import { useMemo } from "react";
import { Ticket, Sprint } from "@/lib/types";

interface SprintProgressBarProps {
  sprintTickets: Ticket[];
  sprint: Sprint | null;
}

export function SprintProgressBar({
  sprintTickets,
  sprint,
}: SprintProgressBarProps) {
  const { done, inProgress, total } = useMemo(() => {
    const done = sprintTickets.filter(
      (t) => t.statusCategory === "done"
    ).length;
    const inProgress = sprintTickets.filter(
      (t) => t.statusCategory === "indeterminate"
    ).length;
    return { done, inProgress, total: sprintTickets.length };
  }, [sprintTickets]);

  const daysLeft = useMemo(() => {
    if (!sprint) return null;
    const end = new Date(sprint.endDate);
    const now = new Date();
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
  }, [sprint]);

  if (total === 0) return null;

  const donePct = Math.round((done / total) * 100);
  const inProgressPct = Math.round((inProgress / total) * 100);

  return (
    <div className="flex items-center gap-3 h-7">
      {/* Sprint context */}
      <span className="text-xxs text-muted-foreground shrink-0">
        {sprint && <span className="font-medium text-foreground">{sprint.name}</span>}
        {daysLeft !== null && (
          <span>
            {" · "}{daysLeft}d left
          </span>
        )}
      </span>

      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
        {donePct > 0 && (
          <div
            className="h-full bg-green-600 dark:bg-green-500 transition-all duration-500"
            style={{ width: `${donePct}%` }}
          />
        )}
        {inProgressPct > 0 && (
          <div
            className="h-full bg-green-300 dark:bg-green-300/60 transition-all duration-500"
            style={{ width: `${inProgressPct}%` }}
          />
        )}
      </div>

      {/* Summary */}
      <span className="text-xxs text-muted-foreground shrink-0">
        <span className="font-medium text-foreground">{done}</span>/{total} done
        {" · "}
        <span className="font-medium text-foreground">{inProgress}</span> in progress
      </span>
    </div>
  );
}
