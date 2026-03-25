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
