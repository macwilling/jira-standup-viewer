import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Ticket, StatusCategory } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function isStale(ticket: Ticket): boolean {
  return Date.now() - new Date(ticket.lastActivityDate).getTime() > STALE_THRESHOLD_MS;
}

/** Returns true if the ticket was updated on or after the given date */
export function isRecentlyChanged(ticket: Ticket, since: Date): boolean {
  return new Date(ticket.lastActivityDate).getTime() >= since.getTime();
}

/**
 * Returns the most recent standup time in the past.
 * If today's standup hasn't happened yet, returns yesterday's standup time.
 * @param time HH:MM in 24h format (default "09:00")
 * @param timezone IANA timezone (default: browser local)
 */
export function getLastStandupTime(
  time?: string | null,
  timezone?: string | null,
): Date {
  const [hours, minutes] = (time || "09:00").split(":").map(Number);

  // Build "today at standup time" in the configured timezone
  const now = new Date();

  if (timezone) {
    // Use Intl to get the current wall-clock time in the target timezone
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);

    const tzNowMinutes = get("hour") * 60 + get("minute");
    const standupMinutes = hours * 60 + minutes;

    // How many ms ago was standup in this timezone?
    // If standup hasn't happened yet today, go back to yesterday's
    const diffMinutes = tzNowMinutes - standupMinutes;
    const msAgo =
      diffMinutes >= 0
        ? diffMinutes * 60_000
        : (diffMinutes + 24 * 60) * 60_000;

    return new Date(now.getTime() - msAgo);
  }

  // No timezone configured — use browser local time
  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  if (d.getTime() > now.getTime()) {
    // Standup hasn't happened yet today — use yesterday
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/** Jira-style status lozenge colors based on Jira's statusCategory */
const categoryColors: Record<StatusCategory, string> = {
  "new": "bg-slate-200 text-slate-700 dark:bg-slate-600/30 dark:text-slate-300",
  "indeterminate": "bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300",
  "done": "bg-green-100 text-green-700 dark:bg-green-500/25 dark:text-green-300",
};

/** Get status badge color classes from a ticket's statusCategory */
export function getStatusBadgeColor(category: StatusCategory): string {
  return categoryColors[category] || categoryColors["new"];
}

/** Common classes for all status badge sizes */
export const statusBadgeBase = "inline-flex items-center rounded-sm font-semibold uppercase leading-none whitespace-nowrap";

/** A palette of distinct, pleasant colors for epic pills */
const EPIC_PALETTE = [
  "#7C3AED", // purple
  "#2563EB", // blue
  "#059669", // green
  "#0891B2", // teal
  "#EA580C", // orange
  "#DC2626", // red
  "#DB2777", // pink
  "#4F46E5", // indigo
  "#D97706", // amber
  "#0D9488", // cyan
  "#7C2D12", // brown
  "#6D28D9", // violet
];

/** Get a consistent color for an epic based on its name. Uses epicColor if valid hex, otherwise derives from name hash. */
export function getEpicColor(epicName: string, epicColor?: string | null): string {
  // If we have a valid hex color from Jira, use it
  if (epicColor && /^#[0-9A-Fa-f]{6}$/.test(epicColor)) return epicColor;
  // Hash the epic name to pick a palette color deterministically
  let hash = 0;
  for (let i = 0; i < epicName.length; i++) {
    hash = ((hash << 5) - hash + epicName.charCodeAt(i)) | 0;
  }
  return EPIC_PALETTE[Math.abs(hash) % EPIC_PALETTE.length];
}

/** Extract [TAG] prefixes from a ticket summary and return tags + cleaned summary */
export function parseSummaryTags(summary: string): { tags: string[]; rest: string } {
  const tags: string[] = [];
  let rest = summary;
  // Match leading [TAG] patterns (possibly multiple)
  const match = rest.match(/^(\s*\[[^\]]+\]\s*)+/);
  if (match) {
    const prefix = match[0];
    rest = rest.slice(prefix.length).trim();
    const tagMatches = prefix.matchAll(/\[([^\]]+)\]/g);
    for (const m of tagMatches) {
      tags.push(m[1]);
    }
  }
  return { tags, rest };
}
