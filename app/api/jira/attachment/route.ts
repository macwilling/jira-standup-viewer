import { NextRequest, NextResponse } from "next/server";

function getCredentials() {
  const url = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!url || !email || !token) return null;
  return {
    baseUrl: url.replace(/\/$/, ""),
    auth: Buffer.from(`${email}:${token}`).toString("base64"),
  };
}

export async function GET(request: NextRequest) {
  const contentUrl = request.nextUrl.searchParams.get("url");
  if (!contentUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  const creds = getCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Jira not configured" }, { status: 503 });
  }

  // Only allow proxying URLs from the configured Jira instance
  if (!contentUrl.startsWith(creds.baseUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  try {
    const res = await fetch(contentUrl, {
      headers: {
        Authorization: `Basic ${creds.auth}`,
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Jira returned ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
