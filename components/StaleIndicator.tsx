"use client";

import { Flame } from "lucide-react";
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
      <TooltipTrigger className="inline-flex">
        <Flame className="h-4 w-4 text-amber-500" />
      </TooltipTrigger>
      <TooltipContent>No activity for {days} days</TooltipContent>
    </Tooltip>
  );
}
