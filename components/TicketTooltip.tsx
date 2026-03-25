"use client";

import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
  Clock,
} from "lucide-react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { useTicketData } from "@/lib/ticket-data-context";
import { Ticket, TicketPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusDotColors: Record<string, string> = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-500",
  "In Review": "bg-yellow-500",
  Done: "bg-green-500",
};

const statusLabels: Record<string, string> = {
  "To Do": "To Do",
  "In Progress": "In Progress",
  "In Review": "In Review",
  Done: "Done",
};

const priorityIcons: Record<TicketPriority, React.ElementType> = {
  Highest: ChevronsUp,
  High: ChevronUp,
  Medium: Equal,
  Low: ChevronDown,
};

const priorityColors: Record<TicketPriority, string> = {
  Highest: "text-red-500",
  High: "text-orange-500",
  Medium: "text-yellow-500",
  Low: "text-blue-400",
};

function shortenDescription(desc: string, maxLen = 120): string {
  const plain = desc.replace(/[#*_`~\[\]]/g, "").replace(/\n+/g, " ").trim();
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s\S*$/, "") + "\u2026";
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

interface TicketTooltipProps {
  ticket: Ticket;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export function TicketTooltip({
  ticket,
  children,
  side = "bottom",
  align = "start",
}: TicketTooltipProps) {
  const { teamMembers, isStale } = useTicketData();
  const PriorityIcon = priorityIcons[ticket.priority];
  const assignee = teamMembers.find((m) => m.id === ticket.assigneeId);
  const stale = isStale(ticket);

  return (
    <TooltipPrimitive.Provider delay={50} closeDelay={100}>
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={6}
          align={align}
          className="isolate z-[100]"
        >
          <TooltipPrimitive.Popup
            className={cn(
              "w-72 rounded-lg border bg-popover text-popover-foreground shadow-lg",
              "p-3 space-y-2",
              "animate-in fade-in-0 zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <div>
              <div className="flex items-center gap-1.5 text-xxs text-muted-foreground">
                <span className="font-mono">{ticket.key}</span>
                {ticket.isL2 && (
                  <span className="text-violet-500 font-medium">L2</span>
                )}
              </div>
              <p className="text-sm font-medium leading-snug mt-0.5">
                {ticket.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xxs">
              <span className="inline-flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", statusDotColors[ticket.status])} />
                {statusLabels[ticket.status]}
              </span>

              <span className="text-border">|</span>

              <span className={cn("inline-flex items-center gap-0.5", priorityColors[ticket.priority])}>
                <PriorityIcon className="h-3 w-3" />
                {ticket.priority}
              </span>

              {assignee && (
                <>
                  <span className="text-border">|</span>
                  <span className="text-muted-foreground">{assignee.name}</span>
                </>
              )}
            </div>

            {ticket.epicName && (
              <div className="flex items-center gap-1.5 text-xxs text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: ticket.epicColor || "#6B7280" }}
                />
                {ticket.epicName}
              </div>
            )}

            <p className="text-xxs text-muted-foreground leading-relaxed">
              {shortenDescription(ticket.description)}
            </p>

            <div className={cn(
              "flex items-center gap-1 text-xxs",
              stale ? "text-amber-600" : "text-muted-foreground/70"
            )}>
              <Clock className="h-3 w-3" />
              {formatRelativeTime(ticket.lastActivityDate)}
              {stale && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </div>
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
