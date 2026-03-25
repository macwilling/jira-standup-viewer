import { NextRequest, NextResponse } from "next/server";
import { searchText, hasJiraCredentials } from "@/lib/jira/client";
import { mapJiraIssue } from "@/lib/jira/mappers";
import { getConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json({ tickets: [] });
  }

  if (!hasJiraCredentials()) {
    return NextResponse.json({ tickets: [] });
  }

  const config = await getConfig();
  const l2Patterns = config?.l2LabelPatterns || [];

  try {
    const response = await searchText(query, 20);
    const tickets = response.issues.map((issue) => mapJiraIssue(issue, l2Patterns));
    return NextResponse.json({ tickets });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, tickets: [] },
      { status: 500 }
    );
  }
}
