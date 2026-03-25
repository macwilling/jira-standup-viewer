"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

export function SetupBanner() {
  return (
    <div className="px-4 py-6">
      <div className="max-w-5xl mx-auto rounded-lg border border-border bg-muted/30 p-6 text-center space-y-3">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-3">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-sm font-semibold">Connect to Jira</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Configure your Jira connection and JQL filter to load real sprint data.
          Showing mock data until configured.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
