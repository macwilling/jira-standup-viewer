"use client";

import { StoryCard as StoryCardType } from "@/lib/progress-utils";
import { Ticket } from "@/lib/types";
import { MiniProgressBar } from "./MiniProgressBar";
import { TaskChipBadge } from "./TaskChipBadge";
import { cn, getStatusBadgeColor, statusBadgeBase, parseSummaryTags } from "@/lib/utils";

interface StoryCardProps {
  card: StoryCardType;
  onTicketSelect: (ticket: Ticket) => void;
  onTaskChipClick: (key: string) => void;
}

function getBorderColor(card: StoryCardType): string {
  if (card.blockedBy.length > 0 || card.hasBlockedTasks) return "border-l-red-500";
  if (card.isStale || card.hasStaleTasks) return "border-l-amber-500";
  if (card.ticket.statusCategory === "done") return "border-l-green-500";
  if (card.ticket.statusCategory === "indeterminate") return "border-l-blue-500";
  return "border-l-slate-300 dark:border-l-slate-600";
}

export function StoryCard({ card, onTicketSelect, onTaskChipClick }: StoryCardProps) {
  const { ticket, tasks, progress, blockedBy, fixVersions, isStub } = card;
  const { tags, rest } = parseSummaryTags(ticket.summary);

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-card px-4 py-3 space-y-2 transition-colors",
        getBorderColor(card),
      )}
    >
      {/* Row 1: Story key, summary, status, progress */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTicketSelect(ticket)}
          className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline shrink-0"
        >
          {ticket.key}
        </button>
        <span className="text-sm truncate flex-1">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded px-1 py-px mr-1 text-[10px] font-medium bg-accent text-accent-foreground/70"
            >
              {tag}
            </span>
          ))}
          <span className={cn(isStub && "italic text-muted-foreground")}>{rest}</span>
        </span>
        <span
          className={cn(
            statusBadgeBase,
            "text-[9px] px-1.5 py-0.5 shrink-0",
            getStatusBadgeColor(ticket.statusCategory)
          )}
        >
          {ticket.status.toUpperCase()}
        </span>
        {tasks.length > 0 && (
          <div className="shrink-0 w-[100px]">
            <MiniProgressBar progress={progress} />
          </div>
        )}
      </div>

      {/* Row 2: Task chips */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tasks.map((chip) => (
            <TaskChipBadge
              key={chip.key}
              chip={chip}
              onClick={() => onTaskChipClick(chip.key)}
            />
          ))}
        </div>
      )}

      {/* Row 3: Blocking info + fix versions */}
      {(blockedBy.length > 0 || card.hasBlockedTasks || fixVersions.length > 0) && (
        <div className="flex items-center gap-3 text-xxs">
          {blockedBy.length > 0 && (
            <span className="text-red-600 dark:text-red-400">
              Blocked by{" "}
              {blockedBy.map((l, i) => (
                <span key={l.targetKey}>
                  {i > 0 && ", "}
                  <span className="font-mono">{l.targetKey}</span>
                  {l.targetStatus && (
                    <span className="text-muted-foreground"> ({l.targetStatus})</span>
                  )}
                </span>
              ))}
            </span>
          )}
          {!blockedBy.length && card.hasBlockedTasks && (
            <span className="text-amber-600 dark:text-amber-400">
              Has blocked tasks
            </span>
          )}
          {fixVersions.length > 0 && (
            <span className="text-muted-foreground ml-auto">
              {fixVersions.join(", ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
