"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function StaleIndicator({
  lastActivityDate,
}: {
  lastActivityDate: string;
}) {
  const days = Math.floor(
    (Date.now() - new Date(lastActivityDate).getTime()) / 86_400_000
  );

  return (
    <Tooltip>
      <TooltipTrigger render={<span />} className="inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[0.6875rem] leading-4">
        No activity for {days}d
      </TooltipContent>
    </Tooltip>
  );
}
