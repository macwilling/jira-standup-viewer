export type TicketStatus = string;
export type StatusCategory = "new" | "indeterminate" | "done";
export type TicketPriority = "Highest" | "High" | "Medium" | "Low";
export type TicketType = "Story" | "Task" | "Subtask" | "Bug" | "Support" | "Epic";

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export type LinkType = "blocks" | "blocked by" | "relates to" | "duplicates";

export interface TicketLinkDef {
  targetKey: string;
  type: LinkType;
}

export interface Ticket {
  key: string;
  summary: string;
  status: TicketStatus;
  statusCategory: StatusCategory;
  priority: TicketPriority;
  type: TicketType;
  assigneeId: string;
  epicKey: string | null;
  epicName: string | null;
  epicColor: string | null;
  labels: string[];
  description: string;
  lastActivityDate: string;
  isL2: boolean;
  comments: Comment[];
  links: TicketLinkDef[];
}

export interface Sprint {
  name: string;
  startDate: string;
  endDate: string;
}

export interface ChangelogEntry {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  created: string;
  changes: {
    field: string;
    from: string | null;
    to: string | null;
  }[];
}

export interface TeamMemberWithTickets extends TeamMember {
  sprintTickets: Ticket[];
  l2Tickets: Ticket[];
  staleCount: number;
}
