import { NextRequest, NextResponse } from "next/server";
import { hasJiraCredentials, searchIssues } from "@/lib/jira/client";
import { mapJiraIssue } from "@/lib/jira/mappers";

// Fetch specific issues by key — for resolving linked tickets outside the JQL filter
export async function GET(request: NextRequest) {
  const keys = request.nextUrl.searchParams.get("keys");
  if (!keys) {
    return NextResponse.json({ error: "Missing keys param" }, { status: 400 });
  }

  if (!hasJiraCredentials()) {
    return NextResponse.json({ error: "Jira not configured" }, { status: 503 });
  }

  try {
    const keyList = keys.split(",").map((k) => k.trim()).filter(Boolean);
    if (keyList.length === 0) {
      return NextResponse.json({ tickets: [] });
    }

    const jql = `key in (${keyList.join(",")}) ORDER BY priority DESC`;
    const response = await searchIssues(jql, keyList.length);
    const tickets = response.issues.map((issue) => mapJiraIssue(issue, []));

    return NextResponse.json({ tickets });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
