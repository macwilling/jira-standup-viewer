"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

const statusColors: Record<TicketStatus, string> = {
  "To Do": "bg-slate-500/20 text-slate-400",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "In Review": "bg-yellow-500/20 text-yellow-400",
  Done: "bg-green-500/20 text-green-400",
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return tickets;
    const q = query.toLowerCase();
    return tickets.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
    );
  }, [query, tickets]);

  const sprintTickets = filtered.filter((t) => !t.isL2);
  const l2Tickets = filtered.filter((t) => t.isL2);
  const allFiltered = [...sprintTickets, ...l2Tickets];

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
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
        className="top-[20%] translate-y-0 overflow-hidden rounded-xl! p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <div onKeyDown={handleKeyDown}>
          {/* Search input */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets by key or keyword..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-72 overflow-y-auto p-1">
            {allFiltered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No tickets found.
              </p>
            ) : (
              <>
                {sprintTickets.length > 0 && (
                  <div className="p-1">
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Sprint Tickets
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
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
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
        "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
        isSelected ? "bg-muted text-foreground" : "text-foreground/80 hover:bg-muted/50"
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", priorityColors[ticket.priority])}
      />
      <span className="font-mono text-xs text-muted-foreground shrink-0">
        {ticket.key}
      </span>
      <span className="truncate flex-1">{ticket.summary}</span>
      <Badge
        variant="outline"
        className={cn("shrink-0 text-xs", statusColors[ticket.status])}
      >
        {ticket.status}
      </Badge>
    </button>
  );
}
