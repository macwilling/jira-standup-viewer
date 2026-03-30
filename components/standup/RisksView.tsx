"use client";

import { useMemo } from "react";
import { Ban, Clock, ShieldAlert } from "lucide-react";
import { Ticket, TeamMember } from "@/lib/types";
import { buildRisksList, riskCounts, RiskItem, RiskCategory } from "@/lib/risks-utils";
import { cn, getStatusBadgeColor, statusBadgeBase, parseSummaryTags } from "@/lib/utils";

interface RisksViewProps {
  tickets: Ticket[];
  teamMembers: TeamMember[];
  isStale: (t: Ticket) => boolean;
  onTicketSelect: (ticket: Ticket) => void;
}

const sectionConfig: Record<
  RiskCategory,
  { icon: React.ElementType; label: string; borderColor: string; badgeColor: string }
> = {
  blocked: {
    icon: Ban,
    label: "Blocked",
    borderColor: "border-l-red-500",
    badgeColor: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  stale: {
    icon: Clock,
    label: "Stale",
    borderColor: "border-l-amber-500",
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
};

export function RisksView({
  tickets,
  teamMembers,
  isStale,
  onTicketSelect,
}: RisksViewProps) {
  const risks = useMemo(
    () => buildRisksList(tickets, teamMembers, isStale),
    [tickets, teamMembers, isStale]
  );
  const counts = useMemo(() => riskCounts(risks), [risks]);

  const blockedItems = risks.filter((r) => r.category === "blocked");
  const staleItems = risks.filter((r) => r.category === "stale");

  return (
    <div className="flex flex-col max-w-5xl mx-auto">
      {/* Summary bar */}
      <div className="flex items-center gap-3 py-2 px-1">
        <p className="text-xs text-muted-foreground">
          {risks.length === 0
            ? "No risks or blockers"
            : `${risks.length} items need attention`}
        </p>
        {counts.blocked > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium">
            <Ban className="h-3 w-3" />
            {counts.blocked} blocked
          </span>
        )}
        {counts.stale > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium">
            <Clock className="h-3 w-3" />
            {counts.stale} stale
          </span>
        )}
      </div>

      {/* Empty state */}
      {risks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ShieldAlert className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">All clear — no blockers or stale items</p>
        </div>
      )}

      {/* Blocked section */}
      {blockedItems.length > 0 && (
        <RiskSection
          category="blocked"
          items={blockedItems}
          onTicketSelect={onTicketSelect}
        />
      )}

      {/* Stale section */}
      {staleItems.length > 0 && (
        <RiskSection
          category="stale"
          items={staleItems}
          onTicketSelect={onTicketSelect}
        />
      )}
    </div>
  );
}

function RiskSection({
  category,
  items,
  onTicketSelect,
}: {
  category: RiskCategory;
  items: RiskItem[];
  onTicketSelect: (ticket: Ticket) => void;
}) {
  const config = sectionConfig[category];

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 px-1 py-1.5">
        <config.icon className={cn("h-3.5 w-3.5", category === "blocked" ? "text-red-500" : "text-amber-500")} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {config.label}
        </span>
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-semibold tabular-nums",
            config.badgeColor
          )}
        >
          {items.length}
        </span>
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <RiskRow
            key={item.ticket.key}
            item={item}
            onSelect={onTicketSelect}
          />
        ))}
      </div>
    </div>
  );
}

function RiskRow({
  item,
  onSelect,
}: {
  item: RiskItem;
  onSelect: (ticket: Ticket) => void;
}) {
  const { ticket, reason, assigneeName, category } = item;
  const config = sectionConfig[category];
  const { tags, rest } = parseSummaryTags(ticket.summary);

  return (
    <button
      onClick={() => onSelect(ticket)}
      className={cn(
        "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-hover border-b border-border/30 border-l-2",
        config.borderColor
      )}
    >
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

        {/* Reason + assignee */}
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              "text-[11px] font-medium",
              category === "blocked" ? "text-red-500" : "text-amber-500"
            )}
          >
            {reason}
          </span>
          {assigneeName && (
            <span className="text-[11px] text-muted-foreground/60">
              {assigneeName}
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
