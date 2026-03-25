"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
  Search,
  Loader2,
  Flame,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Ticket, TicketPriority } from "@/lib/types";
import { cn, getStatusBadgeColor, statusBadgeBase, isStale, parseSummaryTags } from "@/lib/utils";

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
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tickets.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
  }, [query, tickets]);

  // Debounced global Jira search with request cancellation
  const abortRef = useRef<AbortController | null>(null);
  const searchJira = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    if (q.length < 2) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/jira/search?q=${encodeURIComponent(q)}&limit=20`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setRemoteResults(data.tickets || []);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          // ignore non-abort errors
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    searchJira(query);
  }, [query, searchJira]);

  // Merge local + remote into a flat list, deduplicated by key
  const allFiltered = useMemo(() => {
    const localKeys = new Set(filtered.map((t) => t.key));
    const uniqueRemote = remoteResults.filter((t) => !localKeys.has(t.key));
    return [...filtered, ...uniqueRemote];
  }, [filtered, remoteResults]);

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
        className="top-[20%] translate-y-0 overflow-hidden rounded-lg! p-0 gap-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <div onKeyDown={handleKeyDown} className="w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by key, summary, or status..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1">
            {allFiltered.length === 0 && !searching ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {query.length > 0 ? "No tickets found" : "Type to search all Jira tickets"}
              </p>
            ) : (
              <>
                {allFiltered.map((ticket, i) => (
                  <SearchResultItem
                    key={ticket.key}
                    ticket={ticket}
                    isSelected={i === selectedIndex}
                    dataIndex={i}
                    onSelect={handleSelect}
                    onHover={() => setSelectedIndex(i)}
                  />
                ))}
                {searching && (
                  <div className="flex items-center justify-center gap-1.5 py-3 text-xxs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching Jira...
                  </div>
                )}
              </>
            )}
          </div>

          {allFiltered.length > 0 && (
            <div className="border-t px-3 py-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
              <span className="ml-auto">{allFiltered.length} result{allFiltered.length !== 1 ? "s" : ""}</span>
            </div>
          )}
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
  const stale = isStale(ticket);
  return (
    <button
      data-index={dataIndex}
      onClick={() => onSelect(ticket)}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors min-w-0",
        isSelected ? "bg-accent/60" : "hover:bg-accent/30"
      )}
    >
      {/* Priority icon */}
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          priorityColors[ticket.priority]
        )}
      />
      {/* Ticket key */}
      <span className="font-mono text-xs text-muted-foreground shrink-0 w-[72px]">
        {ticket.key}
      </span>
      {/* Summary */}
      <span className="truncate flex-1 text-[13px]">
        {(() => {
          const { tags, rest } = parseSummaryTags(ticket.summary);
          return (
            <>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded px-1 py-px mr-1 text-[10px] font-medium bg-accent text-accent-foreground/70"
                >
                  {tag}
                </span>
              ))}
              {rest}
            </>
          );
        })()}
      </span>
      {/* Right side: stale + status */}
      <div className="flex items-center gap-1.5 shrink-0">
        {stale && <Flame className="h-3 w-3 text-amber-500" />}
        <span
          className={cn(
            statusBadgeBase,
            "text-[9px] px-1.5 py-0.5",
            getStatusBadgeColor(ticket.statusCategory)
          )}
        >
          {ticket.status.toUpperCase()}
        </span>
      </div>
    </button>
  );
}
