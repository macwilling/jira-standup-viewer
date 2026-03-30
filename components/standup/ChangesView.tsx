"use client";

import { useState, useMemo } from "react";
import { MessageSquare, Ban, Activity, Clock } from "lucide-react";
import { Ticket, TeamMember } from "@/lib/types";
import {
  detectChanges,
  getWindowStart,
  changesSummary,
  TimeWindow,
  ChangedTicket,
  ChangeType,
} from "@/lib/standup-changes-utils";
import { cn, getStatusBadgeColor, statusBadgeBase, parseSummaryTags } from "@/lib/utils";

interface ChangesViewProps {
  tickets: Ticket[];
  teamMembers: TeamMember[];
  standupTime?: string | null;
  standupTimezone?: string | null;
  onTicketSelect: (ticket: Ticket) => void;
}

const windowLabels: { id: TimeWindow; label: string }[] = [
  { id: "since-standup", label: "Since standup" },
  { id: "24h", label: "24h" },
  { id: "48h", label: "48h" },
];

const changeTypeConfig: Record<
  ChangeType,
  { icon: React.ElementType; label: string; color: string }
> = {
  blocker: {
    icon: Ban,
    label: "Blocked",
    color: "text-red-500",
  },
  comment: {
    icon: MessageSquare,
    label: "New comments",
    color: "text-blue-500",
  },
  activity: {
    icon: Activity,
    label: "Activity",
    color: "text-muted-foreground",
  },
  status: {
    icon: Clock,
    label: "Status change",
    color: "text-green-500",
  },
};

export function ChangesView({
  tickets,
  teamMembers,
  standupTime,
  standupTimezone,
  onTicketSelect,
}: ChangesViewProps) {
  const [window, setWindow] = useState<TimeWindow>("since-standup");

  const since = useMemo(
    () => getWindowStart(window, standupTime, standupTimezone),
    [window, standupTime, standupTimezone]
  );
  const changed = useMemo(
    () => detectChanges(tickets, teamMembers, since),
    [tickets, teamMembers, since]
  );

  return (
    <div className="flex flex-col max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between py-2 px-1">
        <p className="text-xs text-muted-foreground">
          {changesSummary(changed)}
        </p>
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/50">
          {windowLabels.map((w) => (
            <button
              key={w.id}
              onClick={() => setWindow(w.id)}
              className={cn(
                "px-2 py-0.5 rounded-sm text-[11px] font-medium transition-colors",
                window === w.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {changed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Activity className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">No changes in this window</p>
          <p className="text-xs mt-1 opacity-60">
            Try expanding the time window
          </p>
        </div>
      )}

      {/* Changed tickets list */}
      {changed.length > 0 && (
        <div className="flex flex-col">
          {changed.map((item) => (
            <ChangedTicketRow
              key={item.ticket.key}
              item={item}
              onSelect={onTicketSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChangedTicketRow({
  item,
  onSelect,
}: {
  item: ChangedTicket;
  onSelect: (ticket: Ticket) => void;
}) {
  const { ticket, changeTypes, recentCommentCount } = item;
  const { tags, rest } = parseSummaryTags(ticket.summary);
  const primaryChange = changeTypes[0];
  const config = changeTypeConfig[primaryChange];

  return (
    <button
      onClick={() => onSelect(ticket)}
      className="w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-hover group border-b border-border/30"
    >
      {/* Change type indicator */}
      <div className={cn("mt-0.5 shrink-0", config.color)}>
        <config.icon className="h-3.5 w-3.5" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xxs text-muted-foreground shrink-0">
            {ticket.key}
          </span>
          <span className="text-sm truncate">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded px-1 py-px mr-1 text-[10px] font-medium bg-accent text-accent-foreground/70"
              >
                {tag}
              </span>
            ))}
            {rest}
          </span>
        </div>

        {/* Change detail line */}
        <div className="flex items-center gap-2 mt-0.5">
          {changeTypes.includes("blocker") && (
            <span className="text-[11px] text-red-500 font-medium">
              Has active blocker
            </span>
          )}
          {changeTypes.includes("comment") && (
            <span className="text-[11px] text-blue-500">
              {recentCommentCount} new comment{recentCommentCount !== 1 ? "s" : ""}
            </span>
          )}
          {changeTypes.length === 1 && changeTypes[0] === "activity" && (
            <span className="text-[11px] text-muted-foreground">
              Updated recently
            </span>
          )}
          {item.assigneeName && (
            <span className="text-[11px] text-muted-foreground/60">
              {item.assigneeName}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          statusBadgeBase,
          "text-[9px] px-1 py-0.5 shrink-0 mt-0.5",
          getStatusBadgeColor(ticket.statusCategory)
        )}
      >
        {ticket.status.toUpperCase()}
      </span>
    </button>
  );
}
