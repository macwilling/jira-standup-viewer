"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Loader2, Settings, LogOut, RefreshCw, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeamCard } from "@/components/TeamCard";
import { TicketDrawer } from "@/components/TicketDrawer";
import { SearchBar } from "@/components/SearchBar";
import { SetupBanner } from "@/components/SetupBanner";
import { SprintProgressBar } from "@/components/SprintProgressBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTicketData } from "@/lib/ticket-data-context";
import { Ticket, TicketStatus, TeamMemberWithTickets } from "@/lib/types";

export default function Home() {
  const {
    tickets,
    teamMembers,
    sprint,
    isLoading,
    error,
    configured,
    isStale,
    refresh,
  } = useTicketData();

  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    const minSpin = new Promise((r) => setTimeout(r, 600));
    const fetched = refresh();
    Promise.all([minSpin, fetched]).finally(() => setRefreshing(false));
  }, [refreshing, refresh]);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<Ticket[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(
    new Set()
  );

  const membersWithTickets: TeamMemberWithTickets[] = useMemo(() => {
    return teamMembers
      .map((member) => {
        const memberTickets = tickets.filter(
          (t) => t.assigneeId === member.id
        );
        const sprintTickets = memberTickets.filter((t) => !t.isL2);
        const l2Tickets = memberTickets.filter((t) => t.isL2);
        const staleCount = memberTickets.filter((t) => isStale(t)).length;
        return { ...member, sprintTickets, l2Tickets, staleCount };
      })
      .filter(
        (member) =>
          member.sprintTickets.length + member.l2Tickets.length > 0
      );
  }, [teamMembers, tickets, isStale]);

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/progress"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Progress"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh tickets"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <ThemeToggle />
            <Link
              href="/settings"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Setup banner */}
      {!configured && <SetupBanner />}

      {/* Loading state */}
      {isLoading && tickets.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading tickets...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && configured && (
        <div className="px-4 py-3">
          <div className="max-w-5xl mx-auto rounded-md border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">Failed to load tickets: {error}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {tickets.length > 0 && (
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
      )}

      {searchOpen && (
        <SearchBar
          open={searchOpen}
          onOpenChange={setSearchOpen}
          tickets={tickets}
          onSelect={handleTicketSelect}
        />
      )}

      {/* Sprint progress footer */}
      {tickets.length > 0 && (
        <footer className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <div className="max-w-5xl mx-auto">
            <SprintProgressBar
              sprintTickets={tickets.filter((t) => !t.isL2)}
              sprint={sprint}
            />
          </div>
        </footer>
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
