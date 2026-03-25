"use client";

import { Fragment, useEffect, useState } from "react";
import { useTicketData } from "@/lib/ticket-data-context";
import { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TicketTooltip } from "./TicketTooltip";

// Matches bare Jira keys (PROJECT-123) or Jira browse URLs containing a key
const TICKET_KEY_REGEX = /(?:https?:\/\/[^\s/]+\/browse\/)?([A-Z][A-Z0-9]+-\d+)/g;
// For splitting: capture the full match (URL or bare key) as a group
const TICKET_SPLIT_REGEX = /((?:https?:\/\/[^\s/]+\/browse\/)?[A-Z][A-Z0-9]+-\d+)/g;
// Extract just the key from a match
function extractKey(match: string): string {
  const m = match.match(/([A-Z][A-Z0-9]+-\d+)$/);
  return m ? m[1] : match;
}

const statusDotColors: Record<string, string> = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-500",
  "In Review": "bg-yellow-500",
  Done: "bg-green-500",
};

function shortenSummary(summary: string, maxLen = 40): string {
  if (summary.length <= maxLen) return summary;
  const truncated = summary.slice(0, maxLen).replace(/\s\S*$/, "");
  return truncated + "\u2026";
}

interface TicketLinkProps {
  text: string;
  onTicketClick?: (ticket: Ticket) => void;
}

export function TicketLink({ text, onTicketClick }: TicketLinkProps) {
  const { findTicket, fetchTicket } = useTicketData();
  const parts = text.split(TICKET_SPLIT_REGEX);

  // Track keys that need async fetching
  const [asyncTickets, setAsyncTickets] = useState<Map<string, Ticket>>(new Map());

  useEffect(() => {
    const keysToFetch: string[] = [];
    for (const part of parts) {
      const key = extractKey(part);
      TICKET_KEY_REGEX.lastIndex = 0;
      if (TICKET_KEY_REGEX.test(part)) {
        TICKET_KEY_REGEX.lastIndex = 0;
        if (!findTicket(key) && !asyncTickets.has(key)) {
          keysToFetch.push(key);
        }
      }
    }
    if (keysToFetch.length === 0) return;

    let cancelled = false;
    Promise.all(keysToFetch.map((k) => fetchTicket(k))).then((results) => {
      if (cancelled) return;
      const newEntries = new Map(asyncTickets);
      for (let i = 0; i < keysToFetch.length; i++) {
        const ticket = results[i];
        if (ticket) newEntries.set(keysToFetch[i], ticket);
      }
      setAsyncTickets(newEntries);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <>
      {parts.map((part, i) => {
        const key = extractKey(part);
        const ticket = findTicket(key) || asyncTickets.get(key);
        if (ticket) {
          return (
            <TicketChip
              key={i}
              ticket={ticket}
              onClick={onTicketClick}
            />
          );
        }
        // Check if it looks like a ticket key/URL but hasn't resolved yet
        TICKET_SPLIT_REGEX.lastIndex = 0;
        if (TICKET_SPLIT_REGEX.test(part)) {
          TICKET_SPLIT_REGEX.lastIndex = 0;
          return (
            <span key={i} className="inline font-mono text-xxs text-muted-foreground/60">
              {key}
            </span>
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
