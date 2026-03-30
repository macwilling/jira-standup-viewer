import { ProgressCounts } from "@/lib/progress-utils";
import { StatusCategory } from "@/lib/types";

const segmentColors: Record<StatusCategory, string> = {
  done: "bg-green-500 dark:bg-green-400",
  indeterminate: "bg-blue-500 dark:bg-blue-400",
  new: "bg-slate-300 dark:bg-slate-500",
};

interface MiniProgressBarProps {
  progress: ProgressCounts;
}

export function MiniProgressBar({ progress }: MiniProgressBarProps) {
  const { total, done, inProgress, todo } = progress;
  if (total === 0) return null;

  const segments = [
    { category: "done" as StatusCategory, count: done },
    { category: "indeterminate" as StatusCategory, count: inProgress },
    { category: "new" as StatusCategory, count: todo },
  ].filter((s) => s.count > 0);

  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 min-w-[40px]">
        {segments.map((s) => (
          <div
            key={s.category}
            className={segmentColors[s.category]}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>
      <span className="text-xxs text-muted-foreground tabular-nums shrink-0">
        {done}/{total}
      </span>
    </div>
  );
}
