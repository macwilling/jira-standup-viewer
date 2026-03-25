import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Ticket } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function isStale(ticket: Ticket): boolean {
  return Date.now() - new Date(ticket.lastActivityDate).getTime() > STALE_THRESHOLD_MS;
}
