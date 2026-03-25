import { JiraSearchResponse } from "./types";

const JIRA_FIELDS = [
  "summary",
  "status",
  "priority",
  "issuetype",
  "assignee",
  "labels",
  "description",
  "updated",
  "issuelinks",
  "comment",
  "attachment",
  "parent",
  "customfield_10014", // Epic Link (classic)
  "customfield_10020", // Sprint
  "customfield_10011", // Epic color
].join(",");

function getCredentials() {
  const url = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!url || !email || !token) {
    return null;
  }

  return {
    baseUrl: url.replace(/\/$/, ""),
    auth: Buffer.from(`${email}:${token}`).toString("base64"),
  };
}

export function hasJiraCredentials(): boolean {
  return getCredentials() !== null;
}

async function jiraFetch<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error("Jira credentials not configured");
  }

  const url = new URL(`${creds.baseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${creds.auth}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Jira API error ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

export async function searchIssues(
  jql: string,
  maxResults = 100,
  nextPageToken?: string
): Promise<JiraSearchResponse> {
  const params: Record<string, string> = {
    jql,
    fields: JIRA_FIELDS,
    maxResults: String(maxResults),
  };
  if (nextPageToken) {
    params.nextPageToken = nextPageToken;
  }
  return jiraFetch<JiraSearchResponse>("/rest/api/3/search/jql", params);
}

export async function searchAllIssues(jql: string): Promise<JiraSearchResponse["issues"]> {
  const allIssues: JiraSearchResponse["issues"] = [];
  let nextPageToken: string | undefined;

  while (true) {
    const response = await searchIssues(jql, 100, nextPageToken);
    allIssues.push(...response.issues);

    if (response.isLast || !response.nextPageToken) {
      break;
    }
    nextPageToken = response.nextPageToken;
  }

  return allIssues;
}

export async function searchText(
  query: string,
  maxResults = 20
): Promise<JiraSearchResponse> {
  const jql = `text ~ "${query.replace(/"/g, '\\"')}" ORDER BY updated DESC`;
  return searchIssues(jql, maxResults);
}

export async function testConnection(): Promise<{
  ok: boolean;
  error?: string;
  user?: string;
}> {
  try {
    const creds = getCredentials();
    if (!creds) {
      return { ok: false, error: "Jira credentials not configured in environment variables" };
    }

    const res = await fetch(`${creds.baseUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${creds.auth}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return { ok: false, error: `Authentication failed (${res.status})` };
    }

    const user = await res.json();
    return { ok: true, user: user.displayName };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
