import { NextResponse } from "next/server";
import { searchAllIssues, hasJiraCredentials } from "@/lib/jira/client";
import { mapJiraIssue, extractTeamMembers, extractSprint } from "@/lib/jira/mappers";
import { getConfig } from "@/lib/config";

export async function GET() {
  if (!hasJiraCredentials()) {
    return NextResponse.json(
      { error: "Jira credentials not configured", configured: false },
      { status: 503 }
    );
  }

  const config = await getConfig();
  if (!config?.jqlFilter) {
    return NextResponse.json(
      { error: "JQL filter not configured", configured: false },
      { status: 503 }
    );
  }

  try {
    const issues = await searchAllIssues(config.jqlFilter);
    const l2Patterns = config.l2LabelPatterns || [];
    const tickets = issues.map((issue) => mapJiraIssue(issue, l2Patterns));
    const teamMembers = extractTeamMembers(issues);
    const sprint = extractSprint(issues);

    return NextResponse.json({ tickets, teamMembers, sprint, configured: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, configured: true },
      { status: 500 }
    );
  }
}
