# Jira Standup Viewer

A Next.js dashboard for facilitating scrum standups. Fetches tickets from Jira Cloud, groups them by team member and status, and displays sprint progress.

## Features

- Real-time Jira ticket display grouped by team member
- Sprint progress tracking
- Epic colors from Jira Agile API
- Full-text search with command palette (`/` shortcut)
- Ticket detail drawer with ADF-rendered descriptions
- Linked ticket display (blocks, blocked by, relates to)
- Stale ticket detection (7+ days inactive)
- L2/Support ticket segregation via label patterns
- Dark mode support

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) and configure your JQL filter in the Settings page.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JIRA_URL` | Jira Cloud instance URL (e.g. `https://yourcompany.atlassian.net`) |
| `NEXT_PUBLIC_JIRA_URL` | Same URL, exposed to the client for ticket links |
| `JIRA_EMAIL` | Jira account email for API authentication |
| `JIRA_API_TOKEN` | Jira API token ([create one here](https://id.atlassian.com/manage-profile/security/api-tokens)) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token for KV access |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_KV_NAMESPACE_ID` | Cloudflare KV namespace ID for config storage |

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
