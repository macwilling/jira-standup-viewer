"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Ticket, TeamMember, Sprint } from "./types";
import { isStale as isStaleUtil } from "./utils";
import {
  teamMembers as mockTeamMembers,
  tickets as mockTickets,
  sprint as mockSprint,
} from "./mock-data";

interface TicketDataContextValue {
  tickets: Ticket[];
  teamMembers: TeamMember[];
  sprint: Sprint | null;
  isLoading: boolean;
  error: string | null;
  configured: boolean;
  findTicket: (key: string) => Ticket | undefined;
  fetchTicket: (key: string) => Promise<Ticket | undefined>;
  isStale: (ticket: Ticket) => boolean;
  refresh: () => void;
}

const TicketDataContext = createContext<TicketDataContextValue>({
  tickets: [],
  teamMembers: [],
  sprint: null,
  isLoading: false,
  error: null,
  configured: false,
  findTicket: () => undefined,
  fetchTicket: async () => undefined,
  isStale: isStaleUtil,
  refresh: () => {},
});

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.configured === false) {
      return { tickets: [], teamMembers: [], sprint: null, configured: false };
    }
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
};

export function TicketDataProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR("/api/jira/tickets", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 300_000, // 5 minutes
    errorRetryCount: 2,
  });

  const configured = data?.configured !== false;
  const hasData = data?.tickets && data.tickets.length > 0;

  // Use real data if available, mock data if not configured
  const tickets: Ticket[] = hasData ? data.tickets : configured ? [] : mockTickets;
  const teamMembers: TeamMember[] = hasData
    ? data.teamMembers
    : configured
    ? []
    : mockTeamMembers;
  const sprint: Sprint | null = hasData ? data.sprint : configured ? null : mockSprint;

  const ticketMap = useMemo(() => {
    const map = new Map<string, Ticket>();
    for (const t of tickets) {
      map.set(t.key, t);
    }
    return map;
  }, [tickets]);

  // Cache for externally fetched tickets (outside JQL filter)
  const [externalCache, setExternalCache] = useState<Map<string, Ticket>>(new Map());
  const inflightRef = useRef<Map<string, Promise<Ticket | undefined>>>(new Map());

  const findTicket = useCallback(
    (key: string) => ticketMap.get(key) || externalCache.get(key),
    [ticketMap, externalCache]
  );

  const fetchTicket = useCallback(
    async (key: string): Promise<Ticket | undefined> => {
      // Check local first
      const local = ticketMap.get(key) || externalCache.get(key);
      if (local) return local;

      // Check inflight
      const inflight = inflightRef.current.get(key);
      if (inflight) return inflight;

      // Fetch from Jira
      const promise = fetch(`/api/jira/issues?keys=${encodeURIComponent(key)}`)
        .then((r) => r.json())
        .then((data) => {
          const ticket = data.tickets?.[0] as Ticket | undefined;
          if (ticket) {
            setExternalCache((prev) => {
              const next = new Map(prev);
              next.set(key, ticket);
              return next;
            });
          }
          inflightRef.current.delete(key);
          return ticket;
        })
        .catch(() => {
          inflightRef.current.delete(key);
          return undefined;
        });

      inflightRef.current.set(key, promise);
      return promise;
    },
    [ticketMap, externalCache]
  );

  const value = useMemo<TicketDataContextValue>(
    () => ({
      tickets,
      teamMembers,
      sprint,
      isLoading,
      error: error?.message || null,
      configured,
      findTicket,
      fetchTicket,
      isStale: isStaleUtil,
      refresh: () => mutate(),
    }),
    [tickets, teamMembers, sprint, isLoading, error, configured, findTicket, fetchTicket, mutate]
  );

  return (
    <TicketDataContext.Provider value={value}>
      {children}
    </TicketDataContext.Provider>
  );
}

export function useTicketData() {
  return useContext(TicketDataContext);
}
