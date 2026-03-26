import { Ticket, StatusCategory } from "@/lib/types";

interface EpicProgressBarProps {
  tickets: Ticket[];
}

const segmentColors: Record<StatusCategory, string> = {
  done: "bg-green-500 dark:bg-green-400",
  indeterminate: "bg-blue-500 dark:bg-blue-400",
  new: "bg-slate-300 dark:bg-slate-500",
};

export function EpicProgressBar({ tickets }: EpicProgressBarProps) {
  const total = tickets.length;
  if (total === 0) return null;

  const counts: Record<StatusCategory, number> = { new: 0, indeterminate: 0, done: 0 };
  for (const t of tickets) {
    counts[t.statusCategory] = (counts[t.statusCategory] || 0) + 1;
  }

  const pct = Math.round((counts.done / total) * 100);

  const segments = ([
    { category: "done" as StatusCategory, count: counts.done },
    { category: "indeterminate" as StatusCategory, count: counts.indeterminate },
    { category: "new" as StatusCategory, count: counts.new },
  ] satisfies { category: StatusCategory; count: number }[]).filter((s) => s.count > 0);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {segments.map((s) => (
            <div
              key={s.category}
              className={segmentColors[s.category]}
              style={{ width: `${(s.count / total) * 100}%` }}
            />
          ))}
        </div>
        <span className="text-xxs text-muted-foreground tabular-nums shrink-0">{pct}%</span>
      </div>
      <div className="flex gap-3 text-xxs text-muted-foreground">
        {counts.done > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400" />
            {counts.done} done
          </span>
        )}
        {counts.indeterminate > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            {counts.indeterminate} in progress
          </span>
        )}
        {counts.new > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
            {counts.new} to do
          </span>
        )}
      </div>
    </div>
  );
}
