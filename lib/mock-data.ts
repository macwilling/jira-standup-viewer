import { TeamMember, Ticket, Sprint, Comment } from "./types";

// Helper to compute stale status
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function isStale(ticket: Ticket): boolean {
  return Date.now() - new Date(ticket.lastActivityDate).getTime() > STALE_THRESHOLD_MS;
}

// Helper to make avatar URLs
function avatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
}

// Dates relative to now for realistic stale/fresh mix
const now = new Date();
function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// --- Team Members ---
export const teamMembers: TeamMember[] = [
  { id: "sarah", name: "Sarah Chen", avatarUrl: avatar("Sarah Chen") },
  { id: "marcus", name: "Marcus Johnson", avatarUrl: avatar("Marcus Johnson") },
  { id: "priya", name: "Priya Patel", avatarUrl: avatar("Priya Patel") },
  { id: "alex", name: "Alex Rivera", avatarUrl: avatar("Alex Rivera") },
  { id: "jordan", name: "Jordan Kim", avatarUrl: avatar("Jordan Kim") },
];

// --- Sprint ---
export const sprint: Sprint = {
  name: "Sprint 24.3",
  startDate: "2026-03-11",
  endDate: "2026-03-25",
};

// --- Helper to build comments ---
function makeComments(...items: [string, string, number][]): Comment[] {
  return items.map(([authorId, body, daysBack], i) => ({
    id: `comment-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    authorId,
    body,
    createdAt: daysAgo(daysBack),
  }));
}

// --- Sprint Tickets ---
export const tickets: Ticket[] = [
  // Sarah's sprint tickets (4)
  {
    key: "PROJ-101",
    summary: "Implement user authentication flow",
    status: "In Progress",
    statusCategory: "indeterminate",
    priority: "Highest",
    type: "Story",
    assigneeId: "sarah",
    epicKey: null,
    epicName: "Authentication",
    epicColor: "#7C3AED",
    labels: ["frontend", "security"],
    description:
      "## Overview\n\nImplement the full OAuth2 authentication flow including:\n\n- Login page with email/password\n- Social login (Google, GitHub)\n- Token refresh logic\n- Session management\n\n### Acceptance Criteria\n\n1. User can log in with email and password\n2. User can log in with Google or GitHub\n3. Sessions persist across page reloads\n4. Token refresh happens transparently",
    lastActivityDate: daysAgo(1),
    isL2: false,
    links: [
      { targetKey: "PROJ-102", type: "relates to" },
      { targetKey: "PROJ-104", type: "blocks" },
    ],
    comments: makeComments(
      ["sarah", "Started on the login page UI. OAuth provider configs are set up. Related to PROJ-102 for the design tokens.", 1],
      ["marcus", "Make sure to use the shared auth context from `lib/auth`.", 1],
      ["priya", "I can help test the social login flow once it's ready.", 0]
    ),
  },
  {
    key: "PROJ-102",
    summary: "Design system token migration to CSS variables",
    status: "In Review",
    statusCategory: "indeterminate",
    priority: "High",
    type: "Task",
    assigneeId: "sarah",
    epicKey: null,
    epicName: "Design System",
    epicColor: "#2563EB",
    labels: ["frontend", "design-system"],
    description:
      "Migrate all hardcoded color values to CSS custom properties. This enables theming support and ensures consistency across the application.\n\n**Files to update:**\n- `globals.css`\n- All component files using direct hex values\n- Tailwind config",
    lastActivityDate: daysAgo(2),
    isL2: false,
    links: [
      { targetKey: "PROJ-101", type: "relates to" },
      { targetKey: "PROJ-103", type: "blocks" },
    ],
    comments: makeComments(
      ["sarah", "PR is up: #342. All color tokens migrated. Need a design review.", 2],
      ["jordan", "Looks great! Left a few minor comments on the PR.", 1]
    ),
  },
  {
    key: "PROJ-103",
    summary: "Add loading skeletons to dashboard cards",
    status: "To Do",
    statusCategory: "new",
    priority: "Medium",
    type: "Task",
    assigneeId: "sarah",
    epicKey: null,
    epicName: "Design System",
    epicColor: "#2563EB",
    labels: ["frontend", "ux"],
    description:
      "Add skeleton loading states to all dashboard cards to improve perceived performance. Use the shadcn Skeleton component.\n\nCards that need skeletons:\n- Metrics cards\n- Activity feed\n- Recent tickets list",
    lastActivityDate: daysAgo(3),
    isL2: false,
    links: [
      { targetKey: "PROJ-102", type: "blocked by" },
    ],
    comments: makeComments(
      ["alex", "I have a reusable skeleton wrapper in the design system branch.", 3]
    ),
  },
  {
    key: "PROJ-104",
    summary: "Write E2E tests for onboarding flow",
    status: "Done",
    statusCategory: "done",
    priority: "Low",
    type: "Task",
    assigneeId: "sarah",
    epicKey: null,
    epicName: "Quality",
    epicColor: "#059669",
    labels: ["testing"],
    description:
      "Write Playwright E2E tests covering the complete onboarding wizard:\n\n1. Account creation step\n2. Profile setup step\n3. Team invitation step\n4. Dashboard redirect",
    lastActivityDate: daysAgo(1),
    isL2: false,
    links: [
      { targetKey: "PROJ-101", type: "blocked by" },
    ],
    comments: makeComments(
      ["sarah", "All tests passing. Covers 4 onboarding steps + edge cases.", 1],
      ["marcus", "Nice coverage! Approved and merged.", 1]
    ),
  },

  // Marcus's sprint tickets (3)
  {
    key: "PROJ-105",
    summary: "API rate limiting middleware",
    status: "In Progress",
    statusCategory: "indeterminate",
    priority: "Highest",
    type: "Story",
    assigneeId: "marcus",
    epicKey: null,
    epicName: "Infrastructure",
    epicColor: "#DC2626",
    labels: ["backend", "security"],
    description:
      "## Rate Limiting\n\nImplement rate limiting middleware for all API endpoints:\n\n- **Default**: 100 requests/minute per IP\n- **Auth endpoints**: 10 requests/minute per IP\n- **Webhook endpoints**: 1000 requests/minute per API key\n\nUse Redis for distributed rate limit counters. Return `429 Too Many Requests` with `Retry-After` header.",
    lastActivityDate: daysAgo(10),
    isL2: false,
    links: [
      { targetKey: "PROJ-106", type: "blocks" },
      { targetKey: "L2-201", type: "relates to" },
    ],
    comments: makeComments(
      ["marcus", "Redis setup is done. Working on the middleware wrapper. See PROJ-106 for the connection pooling dependency.", 10],
      ["alex", "Should we also add rate limiting to the GraphQL endpoint?", 9]
    ),
  },
  {
    key: "PROJ-106",
    summary: "Database connection pooling optimization",
    status: "To Do",
    statusCategory: "new",
    priority: "High",
    type: "Task",
    assigneeId: "marcus",
    epicKey: null,
    epicName: "Infrastructure",
    epicColor: "#DC2626",
    labels: ["backend", "performance"],
    description:
      "Current connection pool settings are causing timeouts under load. Need to:\n\n1. Tune PgBouncer settings\n2. Add connection pool metrics to monitoring\n3. Implement connection retry logic with exponential backoff",
    lastActivityDate: daysAgo(4),
    isL2: false,
    links: [
      { targetKey: "PROJ-105", type: "blocked by" },
    ],
    comments: makeComments(
      ["marcus", "Need to benchmark current pool settings before changing anything.", 4],
      ["priya", "I saw some timeout errors in the logs yesterday. Might be related.", 3]
    ),
  },
  {
    key: "PROJ-107",
    summary: "Implement webhook delivery system",
    status: "In Review",
    statusCategory: "indeterminate",
    priority: "Medium",
    type: "Story",
    assigneeId: "marcus",
    epicKey: null,
    epicName: "Integrations",
    epicColor: "#F59E0B",
    labels: ["backend", "integrations"],
    description:
      "Build a reliable webhook delivery system with:\n\n- Event queue (using BullMQ)\n- Retry with exponential backoff (max 5 attempts)\n- Delivery logs and status tracking\n- Signature verification (HMAC-SHA256)",
    lastActivityDate: daysAgo(2),
    isL2: false,
    links: [
      { targetKey: "L2-201", type: "blocks" },
      { targetKey: "PROJ-113", type: "relates to" },
    ],
    comments: makeComments(
      ["marcus", "PR #358 is up. All retry logic implemented and tested. This unblocks L2-201.", 2],
      ["jordan", "Left a comment about the signature verification timing.", 1]
    ),
  },

  // Priya's sprint tickets (3)
  {
    key: "PROJ-108",
    summary: "Notification preferences page",
    status: "In Progress",
    statusCategory: "indeterminate",
    priority: "High",
    type: "Story",
    assigneeId: "priya",
    epicKey: null,
    epicName: "Notifications",
    epicColor: "#8B5CF6",
    labels: ["frontend", "notifications"],
    description:
      "Build the notification preferences page allowing users to configure:\n\n- Email notifications (per event type)\n- In-app notifications\n- Slack integration toggles\n- Digest frequency (real-time, daily, weekly)\n\nUse the settings page layout pattern from the account settings.",
    lastActivityDate: daysAgo(1),
    isL2: false,
    links: [
      { targetKey: "PROJ-109", type: "relates to" },
    ],
    comments: makeComments(
      ["priya", "Working on the toggle matrix UI. Using the Switch component from shadcn.", 1],
      ["sarah", "The settings layout is in `components/settings-layout.tsx` — feel free to reuse it.", 1]
    ),
  },
  {
    key: "PROJ-109",
    summary: "Refactor data fetching to use React Query",
    status: "To Do",
    statusCategory: "new",
    priority: "Medium",
    type: "Task",
    assigneeId: "priya",
    epicKey: null,
    epicName: "Frontend Architecture",
    epicColor: "#0891B2",
    labels: ["frontend", "refactor"],
    description:
      "Replace manual `useEffect` + `useState` data fetching patterns with React Query (TanStack Query).\n\nBenefits:\n- Automatic caching and revalidation\n- Optimistic updates\n- Better loading/error states\n- Reduced boilerplate",
    lastActivityDate: daysAgo(5),
    isL2: false,
    links: [
      { targetKey: "PROJ-108", type: "relates to" },
    ],
    comments: makeComments(
      ["priya", "Going to start with the dashboard page as a pilot.", 5],
      ["marcus", "Make sure to set up the QueryClientProvider in the root layout.", 4]
    ),
  },
  {
    key: "PROJ-110",
    summary: "Fix timezone handling in date displays",
    status: "Done",
    statusCategory: "done",
    priority: "High",
    type: "Bug",
    assigneeId: "priya",
    epicKey: null,
    epicName: "Quality",
    epicColor: "#059669",
    labels: ["frontend", "bug"],
    description:
      "Dates are showing in UTC instead of the user's local timezone. Need to:\n\n1. Use `Intl.DateTimeFormat` consistently\n2. Store user timezone preference\n3. Apply timezone conversion in all date display components",
    lastActivityDate: daysAgo(1),
    isL2: false,
    links: [
      { targetKey: "L2-203", type: "relates to" },
    ],
    comments: makeComments(
      ["priya", "Fixed across all date components. PR merged.", 1],
      ["alex", "Confirmed the fix looks correct in US Pacific and UTC+5:30.", 1]
    ),
  },

  // Alex's sprint tickets (2)
  {
    key: "PROJ-111",
    summary: "Implement file upload with drag and drop",
    status: "In Progress",
    statusCategory: "indeterminate",
    priority: "High",
    type: "Story",
    assigneeId: "alex",
    epicKey: null,
    epicName: "File Management",
    epicColor: "#EA580C",
    labels: ["frontend", "files"],
    description:
      "## File Upload Feature\n\nImplement a file upload component with:\n\n- Drag and drop support\n- Progress indicator\n- File type validation (images, PDFs, docs)\n- Max file size: 10MB\n- Multiple file upload\n\nUpload to S3 via presigned URLs from the backend.",
    lastActivityDate: daysAgo(12),
    isL2: false,
    links: [],
    comments: makeComments(
      ["alex", "Drag and drop zone is working. Need to wire up the presigned URL flow.", 12],
      ["sarah", "We have a `usePresignedUpload` hook in the shared hooks folder.", 11]
    ),
  },
  {
    key: "PROJ-112",
    summary: "Add keyboard shortcuts for common actions",
    status: "To Do",
    statusCategory: "new",
    priority: "Low",
    type: "Task",
    assigneeId: "alex",
    epicKey: null,
    epicName: "UX Improvements",
    epicColor: "#06B6D4",
    labels: ["frontend", "ux"],
    description:
      "Add keyboard shortcuts:\n\n- `Cmd+K` — Command palette\n- `Cmd+/` — Toggle sidebar\n- `Cmd+N` — New ticket\n- `Esc` — Close modal/drawer\n\nUse a central keyboard shortcut registry.",
    lastActivityDate: daysAgo(6),
    isL2: false,
    links: [],
    comments: makeComments(
      ["alex", "Will use the `useHotkeys` hook pattern. Need to check for conflicts.", 6]
    ),
  },

  // Jordan's sprint tickets (3)
  {
    key: "PROJ-113",
    summary: "GraphQL schema for team management",
    status: "In Progress",
    statusCategory: "indeterminate",
    priority: "Highest",
    type: "Story",
    assigneeId: "jordan",
    epicKey: null,
    epicName: "Team Management",
    epicColor: "#4F46E5",
    labels: ["backend", "graphql"],
    description:
      "Define and implement the GraphQL schema for team management:\n\n```graphql\ntype Team {\n  id: ID!\n  name: String!\n  members: [TeamMember!]!\n  createdAt: DateTime!\n}\n\ntype TeamMember {\n  user: User!\n  role: TeamRole!\n  joinedAt: DateTime!\n}\n```\n\nInclude mutations for invite, remove, and role change.",
    lastActivityDate: daysAgo(1),
    isL2: false,
    links: [
      { targetKey: "PROJ-114", type: "blocks" },
      { targetKey: "PROJ-107", type: "relates to" },
    ],
    comments: makeComments(
      ["jordan", "Schema is defined. Working on the resolver implementations.", 1],
      ["marcus", "Don't forget to add the team permission checks in the middleware.", 1]
    ),
  },
  {
    key: "PROJ-114",
    summary: "Add audit log for admin actions",
    status: "To Do",
    statusCategory: "new",
    priority: "Medium",
    type: "Task",
    assigneeId: "jordan",
    epicKey: null,
    epicName: "Security",
    epicColor: "#BE185D",
    labels: ["backend", "security", "audit"],
    description:
      "Track all admin actions in an audit log:\n\n- User management (invite, remove, role change)\n- Settings changes\n- Billing events\n- API key creation/revocation\n\nStore in a dedicated `audit_logs` table with actor, action, target, and metadata.",
    lastActivityDate: daysAgo(3),
    isL2: false,
    links: [
      { targetKey: "PROJ-113", type: "blocked by" },
    ],
    comments: makeComments(
      ["jordan", "Drafted the DB schema. Will share for review.", 3],
      ["priya", "Can we also log login events? Would help with security monitoring.", 2]
    ),
  },
  {
    key: "PROJ-115",
    summary: "CI pipeline optimization — parallelized test runs",
    status: "Done",
    statusCategory: "done",
    priority: "Medium",
    type: "Task",
    assigneeId: "jordan",
    epicKey: null,
    epicName: "Infrastructure",
    epicColor: "#DC2626",
    labels: ["devops", "ci"],
    description:
      "Optimize the CI pipeline by:\n\n1. Splitting test suites across 4 parallel runners\n2. Caching node_modules and build artifacts\n3. Running lint and type-check in parallel with tests\n\nTarget: reduce CI time from 12 min to under 5 min.",
    lastActivityDate: daysAgo(2),
    isL2: false,
    links: [],
    comments: makeComments(
      ["jordan", "CI time is down to 4:30. All green.", 2],
      ["alex", "Huge improvement! Merging is so much faster now.", 1]
    ),
  },

  // L2 Tickets (Marcus: 2, Priya: 1)
  {
    key: "L2-201",
    summary: "Users unable to reset password on mobile Safari",
    status: "In Progress",
    statusCategory: "indeterminate",
    priority: "Highest",
    type: "Bug",
    assigneeId: "marcus",
    epicKey: null,
    epicName: null,
    epicColor: null,
    labels: ["l2-support", "mobile", "auth"],
    description:
      "## Bug Report\n\n**Reported by:** Customer support (3 tickets this week)\n\n**Steps to reproduce:**\n1. Open password reset page on mobile Safari (iOS 17+)\n2. Enter email address\n3. Tap \"Send Reset Link\"\n4. Nothing happens — no loading state, no error\n\n**Expected:** User receives reset email\n\n**Root cause investigation needed.** Likely a form submission issue specific to Safari's handling of `fetch` in form handlers.",
    lastActivityDate: daysAgo(11),
    isL2: true,
    links: [
      { targetKey: "PROJ-101", type: "relates to" },
      { targetKey: "PROJ-107", type: "blocked by" },
    ],
    comments: makeComments(
      ["marcus", "Reproduced the issue. Safari is blocking the fetch due to mixed content.", 11],
      ["sarah", "This might be related to the CSP header changes we made last week.", 10]
    ),
  },
  {
    key: "L2-202",
    summary: "CSV export includes deleted records",
    status: "To Do",
    statusCategory: "new",
    priority: "High",
    type: "Bug",
    assigneeId: "marcus",
    epicKey: null,
    epicName: null,
    epicColor: null,
    labels: ["l2-support", "data", "export"],
    description:
      "The CSV export endpoint is not filtering out soft-deleted records. Customers are seeing deleted items in their exports.\n\n**Impact:** Medium — affects data accuracy for all users using the export feature.\n\n**Fix:** Add `WHERE deleted_at IS NULL` to the export query.",
    lastActivityDate: daysAgo(2),
    isL2: true,
    links: [],
    comments: makeComments(
      ["marcus", "Quick fix — need to add the soft-delete filter to the export query.", 2]
    ),
  },
  {
    key: "L2-203",
    summary: "Dashboard widgets not loading for enterprise SSO users",
    status: "In Progress",
    statusCategory: "indeterminate",
    priority: "High",
    type: "Support",
    assigneeId: "priya",
    epicKey: null,
    epicName: null,
    epicColor: null,
    labels: ["l2-support", "enterprise", "sso"],
    description:
      "Enterprise customers using SAML SSO report that dashboard widgets show a perpetual loading state after login.\n\n**Affected orgs:** 3 enterprise accounts\n\n**Symptoms:**\n- Login works fine\n- Main navigation loads\n- Dashboard widgets show spinners indefinitely\n- Browser console shows 403 errors on `/api/widgets` endpoint\n\nLikely a session/token scope issue for SSO sessions.",
    lastActivityDate: daysAgo(1),
    isL2: true,
    links: [
      { targetKey: "PROJ-110", type: "relates to" },
      { targetKey: "PROJ-101", type: "relates to" },
    ],
    comments: makeComments(
      ["priya", "Found the issue — SSO tokens are missing the `widgets:read` scope.", 1],
      ["jordan", "The scope mapping config is in `auth/sso-config.ts`. Should be a one-liner.", 1],
      ["marcus", "Let's add a test for scope validation too.", 0]
    ),
  },
];
