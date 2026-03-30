"use client";

import { Ban } from "lucide-react";
import { TaskChip } from "@/lib/progress-utils";
import { cn } from "@/lib/utils";
import { parseSummaryTags } from "@/lib/utils";

const chipColors = {
  done: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  indeterminate: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  new: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
} as const;

interface TaskChipBadgeProps {
  chip: TaskChip;
  onClick?: () => void;
}

export function TaskChipBadge({ chip, onClick }: TaskChipBadgeProps) {
  const isBlocked = chip.blockedBy.length > 0;
  const { tags } = parseSummaryTags(chip.summary);
  const label = tags.length > 0 ? tags[0] : chip.key;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors hover:ring-1 hover:ring-foreground/20",
        chipColors[chip.statusCategory],
        isBlocked && "ring-1 ring-red-400 dark:ring-red-500",
        !chip.isInSprint && "opacity-50"
      )}
      title={`${chip.key}: ${chip.summary} — ${chip.status}${isBlocked ? ` (blocked by ${chip.blockedBy.map((l) => l.targetKey).join(", ")})` : ""}${!chip.isInSprint ? " (not in sprint)" : ""}`}
    >
      {isBlocked && <Ban className="h-2.5 w-2.5 text-red-500 shrink-0" />}
      <span className="truncate max-w-[120px]">{label}</span>
      <span className="text-[10px] opacity-70">{chip.status}</span>
    </button>
  );
}
