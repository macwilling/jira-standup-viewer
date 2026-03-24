"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { TeamCard } from "@/components/TeamCard";
import { TicketDrawer } from "@/components/TicketDrawer";
import { SearchBar } from "@/components/SearchBar";
import { teamMembers, tickets, sprint, isStale } from "@/lib/mock-data";
import { Ticket, TicketStatus, TeamMemberWithTickets } from "@/lib/types";

export default function Home() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<Ticket[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(
    new Set()
  );

  const membersWithTickets: TeamMemberWithTickets[] = useMemo(() => {
    return teamMembers.map((member) => {
      const memberTickets = tickets.filter(
        (t) => t.assigneeId === member.id
      );
      const sprintTickets = memberTickets.filter((t) => !t.isL2);
      const l2Tickets = memberTickets.filter((t) => t.isL2);
      const staleCount = memberTickets.filter((t) => isStale(t)).length;
      return { ...member, sprintTickets, l2Tickets, staleCount };
    });
  }, []);

  const toggleMember = useCallback((id: string) => {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleTicketSelect = useCallback((ticket: Ticket) => {
    setSelectedTicket((prev) => {
      if (prev && prev.key !== ticket.key) {
        setTicketHistory((h) => {
          // Avoid duplicates from React strict mode double-invoke
          if (h.length > 0 && h[h.length - 1].key === prev.key) return h;
          return [...h, prev];
        });
      }
      return ticket;
    });
  }, []);

  const handleTicketBack = useCallback(() => {
    setTicketHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setSelectedTicket(prev);
      return h.slice(0, -1);
    });
  }, []);

  const handleBreadcrumbNav = useCallback((index: number) => {
    setTicketHistory((h) => {
      const target = h[index];
      setSelectedTicket(target);
      return h.slice(0, index);
    });
  }, []);

  const handleStatusChange = useCallback(
    (ticket: Ticket, status: TicketStatus) => {
      void ticket;
      void status;
    },
    []
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Compact header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-11 px-4">
          <h1 className="text-sm font-semibold tracking-tight shrink-0">
            Standup Dashboard
          </h1>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 h-7 rounded-md border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors w-full max-w-sm mx-4"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Search tickets...</span>
            <kbd className="ml-auto text-xxs bg-background px-1.5 py-0 rounded border font-mono">
              /
            </kbd>
          </button>

          <div className="text-right shrink-0">
            <p className="text-xs font-medium">{sprint.name}</p>
            <p className="text-xxs text-muted-foreground">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </p>
          </div>
        </div>
      </header>

      {/* Single-column list layout */}
      <main className="flex-1 px-4 py-3">
        <div className="flex flex-col max-w-5xl mx-auto">
          {membersWithTickets.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              isExpanded={expandedMembers.has(member.id)}
              onToggle={() => toggleMember(member.id)}
              onTicketSelect={handleTicketSelect}
            />
          ))}
        </div>
      </main>

      {searchOpen && (
        <SearchBar
          open={searchOpen}
          onOpenChange={setSearchOpen}
          tickets={tickets}
          onSelect={handleTicketSelect}
        />
      )}

      <TicketDrawer
        ticket={selectedTicket}
        teamMembers={teamMembers}
        allTickets={tickets}
        onClose={() => { setSelectedTicket(null); setTicketHistory([]); }}
        onStatusChange={handleStatusChange}
        onTicketSelect={handleTicketSelect}
        ticketHistory={ticketHistory}
        onBack={handleTicketBack}
        onBreadcrumbNav={handleBreadcrumbNav}
      />
    </div>
  );
}
