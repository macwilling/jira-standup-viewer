"use client";

import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
} from "lucide-react";
import { StaleIndicator } from "./StaleIndicator";
import { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { useTicketData } from "@/lib/ticket-data-context";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  TicketPriority,
  { icon: React.ElementType; className: string }
> = {
  Highest: { icon: ChevronsUp, className: "text-red-500" },
  High: { icon: ChevronUp, className: "text-orange-500" },
  Medium: { icon: Equal, className: "text-yellow-500" },
  Low: { icon: ChevronDown, className: "text-blue-400" },
};

const statusDotColors: Record<TicketStatus, string> = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-400",
  "In Review": "bg-yellow-400",
  Done: "bg-green-400",
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

  return (
    <button
      onClick={() => onSelect(ticket)}
      className="w-full flex items-center gap-2 px-2 pr-4 py-1 h-8 rounded-sm text-left transition-colors hover:bg-surface-hover group"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          statusDotColors[ticket.status]
        )}
      />
      <span className="font-mono text-xxs text-muted-foreground shrink-0 w-[72px]">
        {ticket.key}
      </span>
      <span className="text-sm truncate flex-1">{ticket.summary}</span>
      <PriorityIcon
        className={cn(
          "h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-80 transition-opacity",
          priorityClass
        )}
      />
      {stale && <StaleIndicator lastActivityDate={ticket.lastActivityDate} />}
    </button>
  );
}
