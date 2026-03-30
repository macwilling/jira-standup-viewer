"use client";

import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ScopeFilter = "sprint" | "all-open";
export type GroupByOption = "epic" | "fix-version" | "assignee" | "none";

interface FilterBarProps {
  scope: ScopeFilter;
  onScopeChange: (scope: ScopeFilter) => void;
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;
  fixVersionOptions: string[];
  selectedFixVersions: Set<string>;
  onFixVersionsChange: (versions: Set<string>) => void;
  epicOptions: string[];
  selectedEpics: Set<string>;
  onEpicsChange: (epics: Set<string>) => void;
}

const groupByLabels: Record<GroupByOption, string> = {
  epic: "Epic",
  "fix-version": "Fix Version",
  assignee: "Assignee",
  none: "None",
};

export function FilterBar({
  scope,
  onScopeChange,
  groupBy,
  onGroupByChange,
  fixVersionOptions,
  selectedFixVersions,
  onFixVersionsChange,
  epicOptions,
  selectedEpics,
  onEpicsChange,
}: FilterBarProps) {
  const hasActiveFilters = selectedFixVersions.size > 0 || selectedEpics.size > 0;

  const clearAll = () => {
    onFixVersionsChange(new Set());
    onEpicsChange(new Set());
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Scope toggle */}
      <div className="inline-flex rounded-md border bg-muted/50 p-0.5 text-xs">
        <button
          onClick={() => onScopeChange("sprint")}
          className={cn(
            "px-2.5 py-1 rounded-sm transition-colors",
            scope === "sprint"
              ? "bg-background text-foreground shadow-sm font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Sprint
        </button>
        <button
          onClick={() => onScopeChange("all-open")}
          className={cn(
            "px-2.5 py-1 rounded-sm transition-colors",
            scope === "all-open"
              ? "bg-background text-foreground shadow-sm font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All Open
        </button>
      </div>

      {/* Group by */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-1 px-2.5 py-1 h-7 rounded-md border text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          Group: {groupByLabels[groupBy]}
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[140px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xxs">Group by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(groupByLabels) as GroupByOption[]).map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={groupBy === option}
                onCheckedChange={() => onGroupByChange(option)}
              >
                {groupByLabels[option]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Fix Version filter */}
      {fixVersionOptions.length > 0 && (
        <MultiSelectDropdown
          label="Fix Version"
          options={fixVersionOptions}
          selected={selectedFixVersions}
          onChange={onFixVersionsChange}
        />
      )}

      {/* Epic filter */}
      {epicOptions.length > 0 && (
        <MultiSelectDropdown
          label="Epic"
          options={epicOptions}
          selected={selectedEpics}
          onChange={onEpicsChange}
        />
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const count = selected.size;

  const toggle = (option: string) => {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 h-7 rounded-md border text-xs transition-colors hover:bg-muted",
          count > 0
            ? "border-foreground/30 text-foreground font-medium"
            : "border-border text-muted-foreground"
        )}
      >
        {label}
        {count > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-foreground/10 text-[10px] font-medium px-1">
            {count}
          </span>
        )}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[300px] overflow-y-auto min-w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xxs">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selected.has(option)}
              onCheckedChange={() => toggle(option)}
            >
              <span className="truncate">{option}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
