// Jira Cloud REST API v3 response types

export interface JiraUser {
  accountId: string;
  displayName: string;
  avatarUrls: {
    "48x48": string;
    "24x24": string;
    "16x16": string;
    "32x32": string;
  };
}

export interface JiraStatus {
  name: string;
  statusCategory: {
    key: string; // "new" | "indeterminate" | "done"
    name: string;
  };
}

export interface JiraPriority {
  name: string;
  id: string;
}

export interface JiraIssueType {
  name: string;
  subtask: boolean;
}

export interface JiraIssueLinkType {
  name: string;
  inward: string;
  outward: string;
}

export interface JiraIssueLink {
  type: JiraIssueLinkType;
  inwardIssue?: {
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      issuetype?: JiraIssueType;
      priority?: JiraPriority;
    };
  };
  outwardIssue?: {
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      issuetype?: JiraIssueType;
      priority?: JiraPriority;
    };
  };
}

export interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  content: string; // URL to download
  thumbnail?: string; // URL to thumbnail
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: JiraAdfNode; // ADF format in v3
  created: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: "active" | "closed" | "future";
  startDate: string;
  endDate: string;
}

// Atlassian Document Format node
export interface JiraAdfNode {
  type: string;
  text?: string;
  content?: JiraAdfNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

export interface JiraIssueFields {
  summary: string;
  status: JiraStatus;
  priority: JiraPriority;
  issuetype: JiraIssueType;
  assignee: JiraUser | null;
  labels: string[];
  description: JiraAdfNode | null;
  updated: string;
  issuelinks: JiraIssueLink[];
  attachment?: JiraAttachment[];
  comment: {
    comments: JiraComment[];
    total: number;
  };
  // Epic: next-gen uses parent, classic uses customfield_10014
  parent?: {
    key: string;
    fields: {
      summary: string;
      issuetype: JiraIssueType;
      status: JiraStatus;
    };
  };
  fixVersions?: { id: string; name: string }[];
  customfield_10014?: string; // Epic Link (classic projects)
  // Sprint info (commonly customfield_10020)
  customfield_10020?: JiraSprint[] | null;
  // Epic color (commonly customfield_10011)
  customfield_10011?: string | null;
}

export interface JiraIssue {
  key: string;
  fields: JiraIssueFields;
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  nextPageToken?: string | null;
  isLast?: boolean;
  // Legacy fields (may not be present in /search/jql)
  startAt?: number;
  maxResults?: number;
  total?: number;
}

// --- Changelog types ---

export interface JiraChangelogItem {
  field: string;
  fieldtype: string;
  fieldId: string;
  fromString: string | null;
  toString: string | null;
}

export interface JiraChangelogHistory {
  id: string;
  author: JiraUser;
  created: string;
  items: JiraChangelogItem[];
}

export interface JiraChangelogResponse {
  values: JiraChangelogHistory[];
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
}
