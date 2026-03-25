"use client";

import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TicketRow } from "./TicketRow";
import { Ticket, TeamMemberWithTickets } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  member: TeamMemberWithTickets;
  isExpanded: boolean;
  onToggle: () => void;
  onTicketSelect: (ticket: Ticket) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function TeamCard({
  member,
  isExpanded,
  onToggle,
  onTicketSelect,
}: TeamCardProps) {
  const totalTickets = member.sprintTickets.length + member.l2Tickets.length;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full cursor-pointer select-none hover:bg-surface-hover transition-colors px-4 py-2.5 text-left border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <ChevronRight
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform duration-150 shrink-0",
              isExpanded && "rotate-90"
            )}
          />

          <Avatar className="h-5 w-5">
            <AvatarImage src={member.avatarUrl} alt={member.name} />
            <AvatarFallback className="text-[9px]">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>

          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
            {member.name}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-xxs text-muted-foreground">
              <span className="font-semibold">{member.sprintTickets.length}</span>
              <span>sprint</span>
            </span>

            {member.l2Tickets.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xxs text-violet-400">
                <span className="font-semibold">{member.l2Tickets.length}</span>
                <span>L2/support</span>
              </span>
            )}

            {member.staleCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xxs text-amber-500"
                title={`${member.staleCount} ticket${member.staleCount === 1 ? "" : "s"} with no activity in 3+ days`}
              >
                <span className="font-semibold">{member.staleCount}</span>
                <span>stale</span>
              </span>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-8 border-b border-border/30 pb-1">
          {member.sprintTickets.map((ticket) => (
            <TicketRow
              key={ticket.key}
              ticket={ticket}
              onSelect={onTicketSelect}
              variant="sprint"
            />
          ))}

          {member.l2Tickets.length > 0 && (
            <>
              <div className="flex items-center gap-2 pr-4 py-1 mt-1">
                <span className="text-xxs text-muted-foreground/50 uppercase tracking-wider">
                  L2
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
              {member.l2Tickets.map((ticket) => (
                <TicketRow
                  key={ticket.key}
                  ticket={ticket}
                  onSelect={onTicketSelect}
                  variant="l2"
                />
              ))}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
