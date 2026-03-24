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
    setSelectedTicket(ticket);
  }, []);

  const handleStatusChange = useCallback(
    (ticket: Ticket, status: TicketStatus) => {
      // No-op for Phase 1 — will call API in Phase 2
      void ticket;
      void status;
    },
    []
  );

  // Keyboard shortcuts
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
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-6">
          <h1 className="text-lg font-bold tracking-tight shrink-0">
            Standup Dashboard
          </h1>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors w-full max-w-md mx-6"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="text-sm">Search tickets...</span>
            <kbd className="ml-auto text-xs bg-background px-2 py-0.5 rounded border font-mono">
              /
            </kbd>
          </button>

          <div className="text-right shrink-0">
            <p className="text-sm font-medium">{sprint.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
        onClose={() => setSelectedTicket(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
