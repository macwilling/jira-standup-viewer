"use client";

import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TicketRow } from "./TicketRow";
import { useTicketData } from "@/lib/ticket-data-context";
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
  const { isRecent } = useTicketData();
  const totalTickets = member.sprintTickets.length + member.l2Tickets.length;
  const recentCount = [...member.sprintTickets, ...member.l2Tickets].filter(isRecent).length;

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

          <div className="flex items-center gap-2 text-xxs text-muted-foreground/60 tabular-nums">
            <span>{totalTickets}</span>
            {member.l2Tickets.length > 0 && (
              <span className="text-violet-400/60">{member.l2Tickets.length} L2</span>
            )}
            {recentCount > 0 && (
              <span className="text-blue-400/60">{recentCount} updated</span>
            )}
            {member.staleCount > 0 && (
              <span className="text-amber-500/60">{member.staleCount} stale</span>
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
