"use client";

import { ChevronDown, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full cursor-pointer select-none hover:bg-accent/30 transition-colors p-4 text-left">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatarUrl} alt={member.name} />
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>

            <span className="font-semibold text-base flex-1">
              {member.name}
            </span>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {totalTickets} ticket{totalTickets !== 1 ? "s" : ""}
              </Badge>

              {member.staleCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs text-amber-500 border-amber-500/40"
                >
                  <Flame className="h-3 w-3 mr-1" />
                  {member.staleCount} stale
                </Badge>
              )}

              {member.l2Tickets.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs text-violet-400 border-violet-400/40"
                >
                  {member.l2Tickets.length} L2
                </Badge>
              )}

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 px-3">
            <div className="space-y-0.5">
              {member.sprintTickets.map((ticket) => (
                <TicketRow
                  key={ticket.key}
                  ticket={ticket}
                  onSelect={onTicketSelect}
                  variant="sprint"
                />
              ))}
            </div>

            {member.l2Tickets.length > 0 && (
              <>
                <div className="flex items-center gap-2 my-3 px-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    L2 / Support
                  </span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-0.5">
                  {member.l2Tickets.map((ticket) => (
                    <TicketRow
                      key={ticket.key}
                      ticket={ticket}
                      onSelect={onTicketSelect}
                      variant="l2"
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
