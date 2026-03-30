import { Ticket, TicketLinkDef, StatusCategory, TicketType } from "./types";

// --- Types ---

export interface ProgressCounts {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  pct: number;
}

export interface TaskChip {
  key: string;
  summary: string;
  status: string;
  statusCategory: StatusCategory;
  type: TicketType;
  assigneeId?: string;
  isInSprint: boolean;
  isStale: boolean;
  blockedBy: TicketLinkDef[];
}

export interface StoryCard {
  ticket: Ticket;
  isStub: boolean;
  tasks: TaskChip[];
  progress: ProgressCounts;
  blockedBy: TicketLinkDef[];
  hasBlockedTasks: boolean;
  hasStaleTasks: boolean;
  isStale: boolean;
  epicName: string | null;
  epicColor: string | null;
  fixVersions: string[];
  sortScore: number;
}

export interface ProgressData {
  stories: StoryCard[];
  orphanTasks: TaskChip[];
}

// --- Helpers ---

function countProgress(chips: TaskChip[]): ProgressCounts {
  const total = chips.length;
  if (total === 0) return { total: 0, done: 0, inProgress: 0, todo: 0, pct: 0 };
  let done = 0, inProgress = 0, todo = 0;
  for (const c of chips) {
    if (c.statusCategory === "done") done++;
    else if (c.statusCategory === "indeterminate") inProgress++;
    else todo++;
  }
  return { total, done, inProgress, todo, pct: Math.round((done / total) * 100) };
}

function isBlockingLink(link: TicketLinkDef): boolean {
  return link.type === "blocks" || link.type === "blocked by";
}

function isChildLink(sourceType: string, link: TicketLinkDef): boolean {
  if (isBlockingLink(link)) return false;
  const targetType = link.targetType;
  if (!targetType) return false;
  const storyTypes = new Set(["Story"]);
  const childTypes = new Set(["Task", "Subtask", "Bug"]);
  if (storyTypes.has(sourceType) && childTypes.has(targetType)) return true;
  if (childTypes.has(sourceType) && storyTypes.has(targetType)) return true;
  return false;
}

function getActiveBlockers(links: TicketLinkDef[]): TicketLinkDef[] {
  return links.filter(
    (l) => l.type === "blocked by" && l.targetStatusCategory !== "done"
  );
}

function computeSortScore(card: StoryCard): number {
  // Blocked stories first
  if (card.blockedBy.length > 0) return 0;
  if (card.hasBlockedTasks) return 1;
  if (card.isStale || card.hasStaleTasks) return 2;
  if (card.ticket.statusCategory === "indeterminate") return 3;
  if (card.ticket.statusCategory === "new") return 4;
  // Done stories last
  return 5;
}

// --- Main builder ---

export function buildProgressData(
  tickets: Ticket[],
  isStale: (t: Ticket) => boolean,
): ProgressData {
  // Exclude L2 tickets
  const sprintTickets = tickets.filter((t) => !t.isL2);

  const ticketMap = new Map<string, Ticket>();
  for (const t of sprintTickets) ticketMap.set(t.key, t);

  // Step 1: Build Story→Task relationships from links
  const taskToStory = new Map<string, string>();
  const storyToTasks = new Map<string, Set<string>>();

  // Also track stories discovered via task links (not in sprint themselves)
  const stubStories = new Map<string, TicketLinkDef>(); // storyKey → link data from the task

  for (const ticket of sprintTickets) {
    for (const link of ticket.links) {
      if (!isChildLink(ticket.type, link)) continue;

      let storyKey: string;
      let taskKey: string;

      if (ticket.type === "Story") {
        storyKey = ticket.key;
        taskKey = link.targetKey;
      } else {
        storyKey = link.targetKey;
        taskKey = ticket.key;
      }

      if (!taskToStory.has(taskKey)) {
        taskToStory.set(taskKey, storyKey);
        if (!storyToTasks.has(storyKey)) storyToTasks.set(storyKey, new Set());
        storyToTasks.get(storyKey)!.add(taskKey);
      }

      // If the story is not in the sprint, track it as a stub
      if (!ticketMap.has(storyKey) && ticket.type !== "Story") {
        if (!stubStories.has(storyKey)) {
          stubStories.set(storyKey, link);
        }
      }
    }
  }

  // Step 2: Build StoryCards
  const stories: StoryCard[] = [];
  const processedStoryKeys = new Set<string>();

  // Process stories that ARE in the sprint
  for (const ticket of sprintTickets) {
    if (ticket.type !== "Story") continue;
    processedStoryKeys.add(ticket.key);

    const card = buildStoryCard(ticket, false, storyToTasks, ticketMap, isStale);
    stories.push(card);
  }

  // Process stub stories (discovered via task links, not in sprint)
  for (const [storyKey, linkData] of stubStories) {
    if (processedStoryKeys.has(storyKey)) continue;
    processedStoryKeys.add(storyKey);

    // Create a minimal Ticket from link data
    const stubTicket: Ticket = {
      key: storyKey,
      summary: linkData.targetSummary || storyKey,
      status: linkData.targetStatus || "Unknown",
      statusCategory: linkData.targetStatusCategory || "new",
      priority: "Medium",
      type: "Story",
      assigneeId: "unassigned",
      epicKey: null,
      epicName: null,
      epicColor: null,
      labels: [],
      fixVersions: [],
      description: "",
      lastActivityDate: new Date().toISOString(),
      isL2: false,
      comments: [],
      links: [],
    };

    const card = buildStoryCard(stubTicket, true, storyToTasks, ticketMap, isStale);
    stories.push(card);
  }

  // Sort by attention needed
  stories.sort((a, b) => {
    if (a.sortScore !== b.sortScore) return a.sortScore - b.sortScore;
    // Within same score, sort by epic name for grouping
    const ea = a.epicName || "zzz";
    const eb = b.epicName || "zzz";
    return ea.localeCompare(eb);
  });

  // Step 3: Orphan tasks (in sprint, not linked to any story, not a story themselves)
  const orphanTasks: TaskChip[] = [];
  for (const ticket of sprintTickets) {
    if (ticket.type === "Story" || ticket.type === "Epic") continue;
    if (taskToStory.has(ticket.key)) continue;

    orphanTasks.push({
      key: ticket.key,
      summary: ticket.summary,
      status: ticket.status,
      statusCategory: ticket.statusCategory,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      isInSprint: true,
      isStale: isStale(ticket),
      blockedBy: getActiveBlockers(ticket.links),
    });
  }

  return { stories, orphanTasks };
}

function buildStoryCard(
  storyTicket: Ticket,
  isStub: boolean,
  storyToTasks: Map<string, Set<string>>,
  ticketMap: Map<string, Ticket>,
  isStale: (t: Ticket) => boolean,
): StoryCard {
  const taskKeys = storyToTasks.get(storyTicket.key) || new Set();
  const tasks: TaskChip[] = [];

  // Tasks that are in the sprint dataset
  for (const taskKey of taskKeys) {
    const taskTicket = ticketMap.get(taskKey);
    if (taskTicket) {
      tasks.push({
        key: taskTicket.key,
        summary: taskTicket.summary,
        status: taskTicket.status,
        statusCategory: taskTicket.statusCategory,
        type: taskTicket.type,
        assigneeId: taskTicket.assigneeId,
        isInSprint: true,
        isStale: isStale(taskTicket),
        blockedBy: getActiveBlockers(taskTicket.links),
      });
    }
  }

  // Tasks referenced in story's links but NOT in sprint (discovered from link data)
  if (!isStub) {
    for (const link of storyTicket.links) {
      if (isBlockingLink(link)) continue;
      if (!link.targetType || link.targetType === "Story" || link.targetType === "Epic") continue;
      // Skip if already added from sprint data
      if (tasks.some((t) => t.key === link.targetKey)) continue;
      // Skip if it's in the sprint but wasn't mapped to this story
      if (ticketMap.has(link.targetKey)) continue;

      tasks.push({
        key: link.targetKey,
        summary: link.targetSummary || link.targetKey,
        status: link.targetStatus || "Unknown",
        statusCategory: link.targetStatusCategory || "new",
        type: link.targetType,
        assigneeId: undefined,
        isInSprint: false,
        isStale: false,
        blockedBy: [],
      });
    }
  }

  const hasBlockedTasks = tasks.some((t) => t.blockedBy.length > 0);
  const hasStaleTasks = tasks.some((t) => t.isStale);

  // Collect fix versions from story + all sprint tasks
  const fvSet = new Set(storyTicket.fixVersions);
  for (const taskKey of taskKeys) {
    const t = ticketMap.get(taskKey);
    if (t) for (const v of t.fixVersions) fvSet.add(v);
  }

  const card: StoryCard = {
    ticket: storyTicket,
    isStub,
    tasks,
    progress: countProgress(tasks),
    blockedBy: isStub ? [] : getActiveBlockers(storyTicket.links),
    hasBlockedTasks,
    hasStaleTasks,
    isStale: !isStub && isStale(storyTicket),
    epicName: storyTicket.epicName,
    epicColor: storyTicket.epicColor,
    fixVersions: [...fvSet].sort(),
    sortScore: 0,
  };
  card.sortScore = computeSortScore(card);

  return card;
}
