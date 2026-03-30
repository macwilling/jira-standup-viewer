"use client";

import { Ban, ChevronRight } from "lucide-react";
import { StoryCard as StoryCardType, TaskChip } from "@/lib/progress-utils";
import { Ticket } from "@/lib/types";
import { MiniProgressBar } from "./MiniProgressBar";
import { cn, getStatusBadgeColor, statusBadgeBase, parseSummaryTags } from "@/lib/utils";

interface StoryCardProps {
  card: StoryCardType;
  expanded: boolean;
  onToggle: () => void;
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

function TaskRow({ chip, onClick }: { chip: TaskChip; onClick: () => void }) {
  const isBlocked = chip.blockedBy.length > 0;
  const { tags, rest } = parseSummaryTags(chip.summary);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-1 px-1 rounded-sm text-left text-xs hover:bg-muted/50 transition-colors"
    >
      {isBlocked && <Ban className="h-3 w-3 text-red-500 shrink-0" />}
      <span className={cn("font-mono text-xxs text-muted-foreground shrink-0", !chip.isInSprint && "opacity-50")}>
        {chip.key}
      </span>
      <span className={cn("truncate flex-1 text-xxs", !chip.isInSprint && "opacity-50")}>
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded px-1 py-px mr-1 text-[10px] font-medium bg-accent text-accent-foreground/70"
          >
            {tag}
          </span>
        ))}
        {rest}
      </span>
      <span
        className={cn(
          statusBadgeBase,
          "text-[8px] px-1 py-px shrink-0",
          getStatusBadgeColor(chip.statusCategory),
          !chip.isInSprint && "opacity-50"
        )}
      >
        {chip.status.toUpperCase()}
      </span>
    </button>
  );
}

export function StoryCard({ card, expanded, onToggle, onTicketSelect, onTaskChipClick }: StoryCardProps) {
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
        {tasks.length > 0 ? (
          <button
            onClick={onToggle}
            className="shrink-0 p-0.5 -ml-1 rounded hover:bg-muted transition-colors"
            aria-label={expanded ? "Collapse tasks" : "Expand tasks"}
          >
            <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
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

      {/* Row 2: Task list (expanded) */}
      {expanded && tasks.length > 0 && (
        <div className="border-t pt-1.5 space-y-0.5 ml-4">
          {tasks.map((chip) => (
            <TaskRow
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
