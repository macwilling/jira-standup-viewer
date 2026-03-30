import { Ticket, TeamMember } from "./types";
import { getLastStandupTime } from "./utils";

export type ChangeType = "status" | "comment" | "blocker" | "activity";

export interface ChangedTicket {
  ticket: Ticket;
  changeTypes: ChangeType[];
  recentCommentCount: number;
  assigneeName: string | null;
}

export type TimeWindow = "24h" | "48h" | "since-standup";

export function getWindowStart(
  window: TimeWindow,
  standupTime?: string | null,
  standupTimezone?: string | null,
): Date {
  const now = new Date();
  switch (window) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "48h":
      return new Date(now.getTime() - 48 * 60 * 60 * 1000);
    case "since-standup":
      return getLastStandupTime(standupTime, standupTimezone);
  }
}

function hasActiveBlocker(ticket: Ticket): boolean {
  return ticket.links.some(
    (l) => l.type === "blocked by" && l.targetStatusCategory !== "done"
  );
}

export function detectChanges(
  tickets: Ticket[],
  teamMembers: TeamMember[],
  since: Date,
): ChangedTicket[] {
  const memberMap = new Map<string, string>();
  for (const m of teamMembers) memberMap.set(m.id, m.name);

  const sinceMs = since.getTime();
  const results: ChangedTicket[] = [];

  for (const ticket of tickets) {
    const changeTypes: ChangeType[] = [];

    // Check if ticket was updated in the window
    const lastActivity = new Date(ticket.lastActivityDate).getTime();
    if (lastActivity < sinceMs) continue; // No activity in window — skip entirely

    // Check for recent comments
    const recentComments = ticket.comments.filter(
      (c) => new Date(c.createdAt).getTime() >= sinceMs
    );
    if (recentComments.length > 0) {
      changeTypes.push("comment");
    }

    // Check for active blockers (we can't tell exactly when a blocker appeared
    // without changelog, but if the ticket is recently active AND blocked, flag it)
    if (hasActiveBlocker(ticket)) {
      changeTypes.push("blocker");
    }

    // If we have comments or blockers, those are specific; otherwise it's generic activity
    if (changeTypes.length === 0) {
      changeTypes.push("activity");
    }

    results.push({
      ticket,
      changeTypes,
      recentCommentCount: recentComments.length,
      assigneeName: memberMap.get(ticket.assigneeId) || null,
    });
  }

  // Sort: blockers first, then comments, then general activity
  results.sort((a, b) => {
    const score = (ct: ChangeType[]) => {
      if (ct.includes("blocker")) return 0;
      if (ct.includes("comment")) return 1;
      return 2;
    };
    const diff = score(a.changeTypes) - score(b.changeTypes);
    if (diff !== 0) return diff;
    // Within same type, most recent first
    return (
      new Date(b.ticket.lastActivityDate).getTime() -
      new Date(a.ticket.lastActivityDate).getTime()
    );
  });

  return results;
}

export function changesSummary(items: ChangedTicket[]): string {
  if (items.length === 0) return "No changes";
  const parts: string[] = [];
  const blockers = items.filter((i) => i.changeTypes.includes("blocker")).length;
  const comments = items.filter((i) => i.changeTypes.includes("comment")).length;
  if (blockers > 0) parts.push(`${blockers} with blockers`);
  if (comments > 0) parts.push(`${comments} with new comments`);
  parts.push(`${items.length} total`);
  return parts.join(" · ");
}
