"use client";

import { TicketDataProvider } from "@/lib/ticket-data-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TicketDataProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </TicketDataProvider>
  );
}
