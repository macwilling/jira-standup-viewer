"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
  Search,
  Loader2,
  Globe,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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

const statusDotColors: Record<TicketStatus, string> = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-400",
  "In Review": "bg-yellow-400",
  Done: "bg-green-400",
};

interface SearchBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
}

export function SearchBar({
  open,
  onOpenChange,
  tickets,
  onSelect,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [remoteResults, setRemoteResults] = useState<Ticket[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return tickets;
    const q = query.toLowerCase();
    return tickets.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
    );
  }, [query, tickets]);

  // Debounced global Jira search
  const searchJira = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jira/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setRemoteResults(data.tickets || []);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    searchJira(query);
  }, [query, searchJira]);

  // Merge local + remote, deduplicate by key
  const mergedResults = useMemo(() => {
    const localKeys = new Set(filtered.map((t) => t.key));
    const uniqueRemote = remoteResults.filter((t) => !localKeys.has(t.key));
    return { local: filtered, remote: uniqueRemote };
  }, [filtered, remoteResults]);

  const sprintTickets = mergedResults.local.filter((t) => !t.isL2);
  const l2Tickets = mergedResults.local.filter((t) => t.isL2);
  const allFiltered = [...sprintTickets, ...l2Tickets, ...mergedResults.remote];

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const item = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const ticket = allFiltered[selectedIndex];
      if (ticket) {
        onSelect(ticket);
        onOpenChange(false);
      }
    }
  };

  const handleSelect = (ticket: Ticket) => {
    onSelect(ticket);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Search Tickets</DialogTitle>
        <DialogDescription>Search for tickets by key or keyword</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="top-[20%] translate-y-0 overflow-hidden rounded-lg! p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <div onKeyDown={handleKeyDown}>
          <div className="flex items-center gap-2 border-b px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div ref={listRef} className="max-h-80 overflow-y-auto p-1">
            {allFiltered.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No tickets found.
              </p>
            ) : (
              <>
                {sprintTickets.length > 0 && (
                  <div className="p-1">
                    <p className="px-2 py-1 text-xxs font-medium text-muted-foreground uppercase tracking-wide">
                      Sprint
                    </p>
                    {sprintTickets.map((ticket) => {
                      const globalIndex = allFiltered.indexOf(ticket);
                      return (
                        <SearchResultItem
                          key={ticket.key}
                          ticket={ticket}
                          isSelected={globalIndex === selectedIndex}
                          dataIndex={globalIndex}
                          onSelect={handleSelect}
                          onHover={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                )}

                {l2Tickets.length > 0 && (
                  <div className="p-1">
                    <p className="px-2 py-1 text-xxs font-medium text-muted-foreground uppercase tracking-wide">
                      L2 / Support
                    </p>
                    {l2Tickets.map((ticket) => {
                      const globalIndex = allFiltered.indexOf(ticket);
                      return (
                        <SearchResultItem
                          key={ticket.key}
                          ticket={ticket}
                          isSelected={globalIndex === selectedIndex}
                          dataIndex={globalIndex}
                          onSelect={handleSelect}
                          onHover={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                )}

                {mergedResults.remote.length > 0 && (
                  <div className="p-1">
                    <p className="px-2 py-1 text-xxs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Jira Search
                    </p>
                    {mergedResults.remote.map((ticket) => {
                      const globalIndex = allFiltered.indexOf(ticket);
                      return (
                        <SearchResultItem
                          key={ticket.key}
                          ticket={ticket}
                          isSelected={globalIndex === selectedIndex}
                          dataIndex={globalIndex}
                          onSelect={handleSelect}
                          onHover={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                )}

                {searching && (
                  <div className="flex items-center justify-center gap-1.5 py-2 text-xxs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching Jira...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultItem({
  ticket,
  isSelected,
  dataIndex,
  onSelect,
  onHover,
}: {
  ticket: Ticket;
  isSelected: boolean;
  dataIndex: number;
  onSelect: (ticket: Ticket) => void;
  onHover: () => void;
}) {
  const Icon = priorityIcons[ticket.priority];
  return (
    <button
      data-index={dataIndex}
      onClick={() => onSelect(ticket)}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1 h-8 text-left text-sm transition-colors",
        isSelected ? "bg-surface-hover text-foreground" : "text-foreground/80 hover:bg-surface-hover/50"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          statusDotColors[ticket.status]
        )}
      />
      <span className="font-mono text-xxs text-muted-foreground shrink-0 w-[72px]">
        {ticket.key}
      </span>
      <span className="truncate flex-1">{ticket.summary}</span>
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 opacity-40",
          priorityColors[ticket.priority]
        )}
      />
    </button>
  );
}
