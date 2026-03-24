"use client";

import { Fragment } from "react";
import { tickets } from "@/lib/mock-data";
import { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TicketTooltip } from "./TicketTooltip";

const TICKET_KEY_REGEX = /((?:PROJ|L2)-\d+)/g;

const statusDotColors: Record<string, string> = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-500",
  "In Review": "bg-yellow-500",
  Done: "bg-green-500",
};

function findTicket(key: string): Ticket | undefined {
  return tickets.find((t) => t.key === key);
}

function shortenSummary(summary: string, maxLen = 40): string {
  if (summary.length <= maxLen) return summary;
  const truncated = summary.slice(0, maxLen).replace(/\s\S*$/, "");
  return truncated + "…";
}

interface TicketLinkProps {
  text: string;
  onTicketClick?: (ticket: Ticket) => void;
}

export function TicketLink({ text, onTicketClick }: TicketLinkProps) {
  const parts = text.split(TICKET_KEY_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        const ticket = findTicket(part);
        if (ticket) {
          return (
            <TicketChip
              key={i}
              ticket={ticket}
              onClick={onTicketClick}
            />
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

function TicketChip({
  ticket,
  onClick,
}: {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
}) {
  return (
    <TicketTooltip ticket={ticket}>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(ticket);
        }}
        className={cn(
          "inline whitespace-nowrap px-1 py-px rounded",
          "bg-muted/60 hover:bg-muted transition-colors",
          "text-xxs cursor-pointer",
          "border border-border/40"
        )}
      >
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full align-middle mr-0.5",
            statusDotColors[ticket.status] || "bg-slate-400"
          )}
        />
        <span className="font-mono font-medium text-foreground/70">{ticket.key}</span>
        {" "}
        <span className="text-muted-foreground font-normal">{shortenSummary(ticket.summary)}</span>
      </span>
    </TicketTooltip>
  );
}
