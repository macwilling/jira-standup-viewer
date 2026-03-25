export type TicketStatus = "To Do" | "In Progress" | "In Review" | "Done";
export type TicketPriority = "Highest" | "High" | "Medium" | "Low";
export type TicketType = "Story" | "Task" | "Subtask" | "Bug" | "Support";

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

export interface TeamMemberWithTickets extends TeamMember {
  sprintTickets: Ticket[];
  l2Tickets: Ticket[];
  staleCount: number;
}
