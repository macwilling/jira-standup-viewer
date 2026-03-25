"use client";

import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
} from "lucide-react";
import { StaleIndicator } from "./StaleIndicator";
import { Ticket, TicketPriority } from "@/lib/types";
import { useTicketData } from "@/lib/ticket-data-context";
import { cn, getStatusBadgeColor, statusBadgeBase, parseSummaryTags, getEpicColor } from "@/lib/utils";

const priorityConfig: Record<
  TicketPriority,
  { icon: React.ElementType; className: string }
> = {
  Highest: { icon: ChevronsUp, className: "text-red-500" },
  High: { icon: ChevronUp, className: "text-orange-500" },
  Medium: { icon: Equal, className: "text-yellow-500" },
  Low: { icon: ChevronDown, className: "text-blue-400" },
};

interface TicketRowProps {
  ticket: Ticket;
  onSelect: (ticket: Ticket) => void;
  variant?: "sprint" | "l2";
}

export function TicketRow({ ticket, onSelect }: TicketRowProps) {
  const { isStale } = useTicketData();
  const { icon: PriorityIcon, className: priorityClass } =
    priorityConfig[ticket.priority];
  const stale = isStale(ticket);
  const { tags, rest } = parseSummaryTags(ticket.summary);

  return (
    <button
      onClick={() => onSelect(ticket)}
      className="w-full flex items-center gap-2 px-2 pr-4 py-1 h-8 rounded-sm text-left transition-colors hover:bg-surface-hover group"
    >
      <span className="font-mono text-xxs text-muted-foreground shrink-0 w-[72px]">
        {ticket.key}
      </span>
      <span className="text-sm truncate flex-1">
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
      {/* Secondary info — dimmed by default, revealed on hover */}
      {ticket.epicName && (() => {
        const color = getEpicColor(ticket.epicName, ticket.epicColor);
        return (
          <span
            className="shrink-0 max-w-[100px] truncate rounded px-1.5 py-px text-[10px] font-medium leading-tight opacity-0 group-hover:opacity-70 transition-opacity duration-150"
            style={{
              backgroundColor: color + "20",
              color: color,
            }}
            title={ticket.epicName}
          >
            {ticket.epicName}
          </span>
        );
      })()}
      <PriorityIcon
        className={cn(
          "h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity duration-150",
          priorityClass
        )}
      />
      {stale && (
        <span className="opacity-40 group-hover:opacity-100 transition-opacity duration-150">
          <StaleIndicator lastActivityDate={ticket.lastActivityDate} />
        </span>
      )}
      {/* Status badge — always visible but subtle, stronger on hover */}
      <span
        className={cn(
          statusBadgeBase,
          "text-[9px] px-1 py-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-150",
          getStatusBadgeColor(ticket.statusCategory)
        )}
      >
        {ticket.status.toUpperCase()}
      </span>
    </button>
  );
}
