import { Ticket, TicketLinkDef, TeamMember } from "./types";

export type RiskCategory = "blocked" | "stale";
export type RiskSeverity = "critical" | "warning";

export interface RiskItem {
  ticket: Ticket;
  category: RiskCategory;
  severity: RiskSeverity;
  reason: string;
  blockedBy: TicketLinkDef[];
  staleDays: number | null;
  assigneeName: string | null;
  sortScore: number;
}

function getActiveBlockers(links: TicketLinkDef[]): TicketLinkDef[] {
  return links.filter(
    (l) => l.type === "blocked by" && l.targetStatusCategory !== "done"
  );
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function buildBlockerReason(blockers: TicketLinkDef[]): string {
  return (
    "Blocked by " +
    blockers
      .map((b) => {
        const status = b.targetStatus ? ` (${b.targetStatus})` : "";
        return b.targetKey + status;
      })
      .join(", ")
  );
}

export function buildRisksList(
  tickets: Ticket[],
  teamMembers: TeamMember[],
  isStale: (t: Ticket) => boolean,
): RiskItem[] {
  const memberMap = new Map<string, string>();
  for (const m of teamMembers) memberMap.set(m.id, m.name);

  const seen = new Set<string>();
  const items: RiskItem[] = [];

  // Pass 1: Blocked tickets (critical)
  for (const ticket of tickets) {
    if (ticket.statusCategory === "done") continue;
    const blockers = getActiveBlockers(ticket.links);
    if (blockers.length === 0) continue;

    seen.add(ticket.key);
    items.push({
      ticket,
      category: "blocked",
      severity: "critical",
      reason: buildBlockerReason(blockers),
      blockedBy: blockers,
      staleDays: null,
      assigneeName: memberMap.get(ticket.assigneeId) || null,
      sortScore: 0,
    });
  }

  // Pass 2: Stale tickets (warning) — skip if already added as blocked
  for (const ticket of tickets) {
    if (ticket.statusCategory === "done") continue;
    if (seen.has(ticket.key)) continue;
    if (!isStale(ticket)) continue;

    const days = daysSince(ticket.lastActivityDate);
    items.push({
      ticket,
      category: "stale",
      severity: "warning",
      reason: `No activity for ${days} days`,
      blockedBy: [],
      staleDays: days,
      assigneeName: memberMap.get(ticket.assigneeId) || null,
      sortScore: 1,
    });
  }

  // Sort: blocked first (by priority), then stale (by staleness desc)
  items.sort((a, b) => {
    if (a.sortScore !== b.sortScore) return a.sortScore - b.sortScore;
    // Within blocked: higher priority first
    if (a.category === "blocked" && b.category === "blocked") {
      const priorityOrder = { Highest: 0, High: 1, Medium: 2, Low: 3 };
      return (
        (priorityOrder[a.ticket.priority] ?? 2) -
        (priorityOrder[b.ticket.priority] ?? 2)
      );
    }
    // Within stale: most stale first
    if (a.category === "stale" && b.category === "stale") {
      return (b.staleDays ?? 0) - (a.staleDays ?? 0);
    }
    return 0;
  });

  return items;
}

export function riskCounts(items: RiskItem[]): { blocked: number; stale: number } {
  let blocked = 0, stale = 0;
  for (const item of items) {
    if (item.category === "blocked") blocked++;
    else stale++;
  }
  return { blocked, stale };
}
