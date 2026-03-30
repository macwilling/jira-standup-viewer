"use client";

import { cn } from "@/lib/utils";

export type ViewMode = "team" | "changes" | "risks";

interface Tab {
  id: ViewMode;
  label: string;
  count?: number;
  countColor?: string;
}

interface ViewTabsProps {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
  changesCount?: number;
  risksCount?: number;
}

export function ViewTabs({
  active,
  onChange,
  changesCount,
  risksCount,
}: ViewTabsProps) {
  const tabs: Tab[] = [
    { id: "team", label: "Team" },
    {
      id: "changes",
      label: "Changes",
      count: changesCount,
      countColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    },
    {
      id: "risks",
      label: "Risks",
      count: risksCount,
      countColor: "bg-red-500/15 text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/50 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors",
            active === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count != null && tab.count > 0 && (
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-semibold tabular-nums",
                tab.countColor
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
