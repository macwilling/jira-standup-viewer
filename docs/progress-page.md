# Progress Page

## Purpose

PM-facing view to track story-level progress and identify blockers. Shows one card per story with inline task status chips, sorted by "needs attention."

## Data Model

### Story→Task Hierarchy

Stories and tasks are **not** parent/child in Jira — tasks are linked to stories via issue links. The team uses inconsistent link types ("is implemented by", "relates to", "is tested by", "is idea for", "is connected to", etc.).

**Heuristic**: Any non-blocking link between a Story and a Task/Bug/Subtask = the task belongs to that story. This was validated against the real sprint data (62/62 hierarchy links correctly identified, 0 false positives).

Blocking links (`blocks` / `blocked by`) between Story↔Task are treated as dependency info, not hierarchy.

### Enriched TicketLinkDef

`TicketLinkDef` carries metadata about the linked issue:
- `targetType` — issue type (Story, Task, etc.)
- `targetSummary`, `targetStatus`, `targetStatusCategory` — allows rendering task chips without fetching the full ticket
- `rawDescription` — original Jira link description before normalization

This data comes from the Jira REST API's `issuelinks` response, which includes `issuetype` on linked issues.

### Sprint-Aware Clustering

In sprint scope, if ANY ticket in a story's cluster is in the sprint, the whole story appears:
- Tasks in sprint pull in their parent story (created as stub from link data if not in sprint)
- Stories in sprint pull in all linked tasks (non-sprint tasks shown dimmed via link data)

### StoryCard Sort Order

0. Story is blocked
1. Story has blocked tasks
2. Story or tasks are stale (7+ days no activity)
3. Story is in progress
4. Story is to-do
5. Story is done

## Filters

| Filter | Type | Implementation |
|--------|------|----------------|
| Scope | Toggle | "Sprint" uses context SWR; "All Open" fetches `/api/jira/tickets?scope=all-open` |
| Fix Version | Multi-select | Client-side filter on `Ticket.fixVersions` |
| Epic | Multi-select | Client-side filter on `Ticket.epicName` |

## Key Files

| File | Purpose |
|------|---------|
| `lib/progress-utils.ts` | `buildProgressData()` — hierarchy construction, sort, clustering |
| `lib/types.ts` | `TicketLinkDef` with enriched fields, `Ticket.fixVersions` |
| `lib/jira/mappers.ts` | `mapIssueLinks()` populates enriched link data |
| `app/progress/page.tsx` | Page component with filters, SWR, epic grouping |
| `components/progress/StoryCard.tsx` | Card with task chips, progress bar, blocking info |
| `components/progress/TaskChipBadge.tsx` | Colored badge per task |
| `components/progress/FilterBar.tsx` | Scope toggle + multi-select dropdowns |
| `components/progress/MiniProgressBar.tsx` | Inline tri-color progress bar |
| `app/api/jira/tickets/route.ts` | `?scope=all-open` param support |

## Known Limitations / Future Work

- Stub stories (pulled in via task links) have minimal data — no description, comments, or links of their own
- Fix version filter only works on tickets already in the dataset; doesn't modify the JQL
- The page still needs visual refinement (noted by Mac as of 2026-03-30)
- No test coverage (no test framework in this project)
