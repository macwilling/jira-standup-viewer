import { NextRequest, NextResponse } from "next/server";
import { searchIssues, hasJiraCredentials } from "@/lib/jira/client";
import { mapJiraIssue } from "@/lib/jira/mappers";

export async function GET(request: NextRequest) {
  const epicKey = request.nextUrl.searchParams.get("epicKey");
  if (!epicKey) {
    return NextResponse.json({ error: "Missing epicKey param" }, { status: 400 });
  }

  if (!hasJiraCredentials()) {
    return NextResponse.json({ error: "Jira not configured" }, { status: 503 });
  }

  try {
    // Fetch all children of this epic
    const jql = `parent = ${epicKey} ORDER BY status ASC, priority DESC`;
    const response = await searchIssues(jql, 50);
    const tickets = response.issues.map((issue) => mapJiraIssue(issue, []));

    return NextResponse.json({ tickets });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
