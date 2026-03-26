"use client";

import { ThemeProvider } from "next-themes";
import { TicketDataProvider } from "@/lib/ticket-data-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TicketDataProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </TicketDataProvider>
    </ThemeProvider>
  );
}
