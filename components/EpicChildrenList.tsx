"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Ticket, StatusCategory } from "@/lib/types";
import { cn, getStatusBadgeColor, statusBadgeBase, parseSummaryTags } from "@/lib/utils";
import { TicketTooltip } from "./TicketTooltip";

interface EpicChildrenListProps {
  tickets: Ticket[];
  loading: boolean;
  onTicketSelect?: (ticket: Ticket) => void;
}

interface StatusGroup {
  category: StatusCategory;
  label: string;
  tickets: Ticket[];
  defaultOpen: boolean;
}

export function EpicChildrenList({ tickets, loading, onTicketSelect }: EpicChildrenListProps) {
  const groups = ([
    {
      category: "indeterminate" as StatusCategory,
      label: "In Progress",
      tickets: tickets.filter((t) => t.statusCategory === "indeterminate"),
      defaultOpen: true,
    },
    {
      category: "new" as StatusCategory,
      label: "To Do",
      tickets: tickets.filter((t) => t.statusCategory === "new"),
      defaultOpen: true,
    },
    {
      category: "done" as StatusCategory,
      label: "Done",
      tickets: tickets.filter((t) => t.statusCategory === "done"),
      defaultOpen: false,
    },
  ] satisfies StatusGroup[]).filter((g) => g.tickets.length > 0);

  if (loading) {
    return <div className="py-3 text-center text-xxs text-muted-foreground">Loading...</div>;
  }

  if (tickets.length === 0) {
    return <div className="py-3 text-center text-xxs text-muted-foreground">No child tickets</div>;
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <GroupSection key={group.category} group={group} onTicketSelect={onTicketSelect} />
      ))}
    </div>
  );
}

function GroupSection({
  group,
  onTicketSelect,
}: {
  group: StatusGroup;
  onTicketSelect?: (ticket: Ticket) => void;
}) {
  const [open, setOpen] = useState(group.defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 w-full text-left py-0.5 rounded hover:bg-surface-hover transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-150",
            open && "rotate-90"
          )}
        />
        <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
        <span className="text-xxs text-muted-foreground/60">({group.tickets.length})</span>
      </button>
      {open && (
        <div className="ml-3 space-y-0 border-l-2 border-border/50 pl-2.5">
          {group.tickets.map((t) => (
            <TicketTooltip key={t.key} ticket={t} side="bottom">
              <button
                onClick={() => onTicketSelect?.(t)}
                className="w-full flex items-center gap-1.5 py-0.5 text-xxs text-left hover:text-foreground transition-colors"
              >
                <span className="font-mono text-muted-foreground shrink-0">{t.key}</span>
                <span className="truncate flex-1">
                  {(() => {
                    const { tags, rest } = parseSummaryTags(t.summary);
                    return (
                      <>
                        {tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded px-1 py-px mr-1 text-[10px] font-medium bg-accent text-accent-foreground/70"
                          >
                            {tag}
                          </span>
                        ))}
                        {rest}
                      </>
                    );
                  })()}
                </span>
                <span
                  className={cn(
                    statusBadgeBase,
                    "text-[8px] px-0.5 py-px shrink-0",
                    getStatusBadgeColor(t.statusCategory)
                  )}
                >
                  {t.status.toUpperCase()}
                </span>
              </button>
            </TicketTooltip>
          ))}
        </div>
      )}
    </div>
  );
}
