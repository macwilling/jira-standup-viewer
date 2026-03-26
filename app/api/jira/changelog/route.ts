import { NextRequest, NextResponse } from "next/server";
import { fetchChangelog, hasJiraCredentials } from "@/lib/jira/client";
import { mapChangelog } from "@/lib/jira/mappers";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key param" }, { status: 400 });
  }

  if (!hasJiraCredentials()) {
    return NextResponse.json({ error: "Jira not configured" }, { status: 503 });
  }

  try {
    const response = await fetchChangelog(key);
    const changelog = mapChangelog(response.values);
    return NextResponse.json({ changelog });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
