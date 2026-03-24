"use client";

import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StaleIndicator } from "./StaleIndicator";
import { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { isStale } from "@/lib/mock-data";
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

const statusConfig: Record<TicketStatus, string> = {
  "To Do": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "In Review": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Done: "bg-green-500/20 text-green-400 border-green-500/30",
};

interface TicketRowProps {
  ticket: Ticket;
  onSelect: (ticket: Ticket) => void;
  variant?: "sprint" | "l2";
}

export function TicketRow({ ticket, onSelect, variant = "sprint" }: TicketRowProps) {
  const { icon: PriorityIcon, className: priorityClass } =
    priorityConfig[ticket.priority];
  const stale = isStale(ticket);

  return (
    <button
      onClick={() => onSelect(ticket)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-accent/50",
        variant === "l2" && "border-l-2 border-amber-500/60"
      )}
    >
      <PriorityIcon className={cn("h-4 w-4 shrink-0", priorityClass)} />
      <span className="font-mono text-xs text-muted-foreground shrink-0">
        {ticket.key}
      </span>
      <span className="text-sm truncate flex-1">{ticket.summary}</span>
      <Badge
        variant="outline"
        className={cn("shrink-0 text-xs font-medium", statusConfig[ticket.status])}
      >
        {ticket.status}
      </Badge>
      {stale && <StaleIndicator lastActivityDate={ticket.lastActivityDate} />}
    </button>
  );
}
