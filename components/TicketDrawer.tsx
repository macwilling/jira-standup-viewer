"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Ticket, TicketPriority, TicketStatus, TeamMember } from "@/lib/types";
import { isStale } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { TicketLink } from "./TicketLink";
import { TicketTooltip } from "./TicketTooltip";

const priorityConfig: Record<
  TicketPriority,
  { icon: React.ElementType; className: string }
> = {
  Highest: { icon: ChevronsUp, className: "text-red-500" },
  High: { icon: ChevronUp, className: "text-orange-500" },
  Medium: { icon: Equal, className: "text-yellow-500" },
  Low: { icon: ChevronDown, className: "text-blue-400" },
};

const statusColors: Record<TicketStatus, string> = {
  "To Do": "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
  "In Progress": "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  "In Review": "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  Done: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
};

const statusDots: Record<TicketStatus, string> = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-500",
  "In Review": "bg-yellow-500",
  Done: "bg-green-500",
};

const allStatuses: TicketStatus[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
];

const linkTypeLabels: Record<string, string> = {
  "blocks": "Blocks",
  "blocked by": "Blocked by",
  "relates to": "Relates to",
  "duplicates": "Duplicates",
};

interface TicketDrawerProps {
  ticket: Ticket | null;
  teamMembers: TeamMember[];
  allTickets: Ticket[];
  onClose: () => void;
  onStatusChange: (ticket: Ticket, status: TicketStatus) => void;
  onTicketSelect?: (ticket: Ticket) => void;
  ticketHistory: Ticket[];
  onBack: () => void;
  onBreadcrumbNav: (index: number) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function TicketDrawer({
  ticket,
  teamMembers,
  allTickets,
  onClose,
  onStatusChange,
  onTicketSelect,
  ticketHistory,
  onBack,
  onBreadcrumbNav,
}: TicketDrawerProps) {
  const [comment, setComment] = useState("");
  const [epicExpanded, setEpicExpanded] = useState(false);
  const scrollRef = useRef(null as HTMLDivElement | null);

  // Scroll to top when switching tickets
  useEffect(() => {
    if (ticket && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setEpicExpanded(false);
  }, [ticket]);

  // Get tickets in same epic
  const epicSiblings = useMemo(() => {
    if (!ticket?.epicName) return [];
    return allTickets.filter(
      (t) => t.epicName === ticket.epicName && t.key !== ticket.key
    );
  }, [ticket, allTickets]);

  // Resolve linked tickets
  const resolvedLinks = useMemo(() => {
    if (!ticket) return [];
    return ticket.links
      .map((link) => ({
        ...link,
        ticket: allTickets.find((t) => t.key === link.targetKey),
      }))
      .filter((l) => l.ticket);
  }, [ticket, allTickets]);

  if (!ticket) return null;

  const { icon: PriorityIcon, className: priorityClass } =
    priorityConfig[ticket.priority];
  const stale = isStale(ticket);
  const assignee = teamMembers.find((m) => m.id === ticket.assigneeId);
  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  function processChildren(children: React.ReactNode): React.ReactNode {
    if (!children) return children;
    if (typeof children === "string") {
      return <TicketLink text={children} onTicketClick={onTicketSelect} />;
    }
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        if (typeof child === "string") {
          return <TicketLink key={i} text={child} onTicketClick={onTicketSelect} />;
        }
        return child;
      });
    }
    return children;
  }

  // Custom markdown components that render ticket references inline
  const markdownComponents: Components = {
    p: ({ children }) => (
      <p>
        {processChildren(children)}
      </p>
    ),
    li: ({ children }) => (
      <li>
        {processChildren(children)}
      </li>
    ),
  };

  const handleSubmitComment = () => {
    setComment("");
  };

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-4 pb-3 space-y-2 border-b shrink-0">
          {/* Breadcrumb trail — inline with ticket key */}
          <div className="flex items-center gap-1 text-xxs text-muted-foreground pr-6">
            {ticketHistory.length > 0 && (
              <>
                <button
                  onClick={onBack}
                  className="p-0.5 -ml-1 rounded hover:bg-muted transition-colors shrink-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                {ticketHistory.map((t, i) => (
                  <span key={t.key} className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onBreadcrumbNav(i)}
                      className="font-mono hover:text-foreground transition-colors"
                    >
                      {t.key}
                    </button>
                    <ChevronRight className="h-2.5 w-2.5 opacity-40" />
                  </span>
                ))}
              </>
            )}
            <span className="font-mono font-medium text-foreground/80 shrink-0">
              {ticket.key}
            </span>
            {ticket.isL2 && (
              <Badge variant="outline" className="text-xxs text-violet-500 border-violet-300 ml-1">
                L2
              </Badge>
            )}
          </div>
          <SheetTitle className="text-base leading-snug font-semibold pr-6">
            {ticket.summary}
          </SheetTitle>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          <div>
          {/* Properties table — Notion-style */}
          <div className="px-5 py-3 space-y-2.5 border-b text-xs">
            {/* Status */}
            <div className="flex items-center">
              <span className="w-24 text-muted-foreground shrink-0">Status</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xxs font-medium cursor-pointer",
                    statusColors[ticket.status]
                  )}
                >
                  {ticket.status}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {allStatuses.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => onStatusChange(ticket, s)}
                    >
                      <span
                        className={cn(
                          "mr-2 h-2 w-2 rounded-full inline-block",
                          statusDots[s]
                        )}
                      />
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Priority */}
            <div className="flex items-center">
              <span className="w-24 text-muted-foreground shrink-0">Priority</span>
              <span className={cn("inline-flex items-center gap-1", priorityClass)}>
                <PriorityIcon className="h-3.5 w-3.5" />
                {ticket.priority}
              </span>
            </div>

            {/* Assignee */}
            {assignee && (
              <div className="flex items-center">
                <span className="w-24 text-muted-foreground shrink-0">Assignee</span>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                    <AvatarFallback className="text-[7px]">
                      {getInitials(assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{assignee.name}</span>
                </div>
              </div>
            )}

            {/* Epic — clickable to show siblings */}
            {ticket.epicName && (
              <div className="flex items-start">
                <span className="w-24 text-muted-foreground shrink-0">Epic</span>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setEpicExpanded(!epicExpanded)}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ticket.epicColor || "#6B7280" }}
                    />
                    <span>{ticket.epicName}</span>
                    {epicSiblings.length > 0 && (
                      <span className="text-muted-foreground/50 text-xxs ml-0.5">
                        ({epicSiblings.length + 1})
                      </span>
                    )}
                    {epicSiblings.length > 0 && (
                      <ChevronRight className={cn(
                        "h-3 w-3 text-muted-foreground transition-transform duration-150",
                        epicExpanded && "rotate-90"
                      )} />
                    )}
                  </button>

                  {/* Epic children list */}
                  {epicExpanded && epicSiblings.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 pl-4 border-l-2 border-border/50">
                      {epicSiblings.map((t) => (
                        <TicketTooltip key={t.key} ticket={t} side="bottom">
                          <button
                            onClick={() => onTicketSelect?.(t)}
                            className="w-full flex items-center gap-1.5 py-0.5 text-xxs text-left hover:text-foreground transition-colors group"
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDots[t.status])} />
                            <span className="font-mono text-muted-foreground">{t.key}</span>
                            <span className="truncate flex-1">{t.summary}</span>
                          </button>
                        </TicketTooltip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Labels */}
            {ticket.labels.length > 0 && (
              <div className="flex items-start">
                <span className="w-24 text-muted-foreground shrink-0 pt-0.5">Labels</span>
                <div className="flex flex-wrap gap-1">
                  {ticket.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xxs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Last Activity */}
            <div className="flex items-center">
              <span className="w-24 text-muted-foreground shrink-0">Activity</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  stale ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
                )}
              >
                {stale && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                <Clock className="h-3 w-3" />
                {formatRelativeTime(ticket.lastActivityDate)}
              </span>
            </div>
          </div>

          {/* Linked Tickets */}
          {resolvedLinks.length > 0 && (
            <div className="px-5 py-3 border-b space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                Links
              </div>
              <div className="space-y-0.5">
                {resolvedLinks.map((link) => {
                  const t = link.ticket!;
                  return (
                    <TicketTooltip key={`${link.type}-${t.key}`} ticket={t} side="bottom">
                      <button
                        onClick={() => onTicketSelect?.(t)}
                        className="w-full flex items-center gap-2 py-1 px-1 rounded-sm text-left text-xs hover:bg-surface-hover transition-colors group"
                      >
                        <span className="text-xxs text-muted-foreground/60 w-[70px] shrink-0">
                          {linkTypeLabels[link.type]}
                        </span>
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDots[t.status])} />
                        <span className="font-mono text-xxs text-muted-foreground shrink-0">{t.key}</span>
                        <span className="truncate flex-1 text-xxs">{t.summary}</span>
                      </button>
                    </TicketTooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="px-5 py-3 border-b">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-semibold [&_p]:text-xs [&_p]:leading-relaxed [&_li]:text-xs [&_li]:leading-relaxed [&_ul]:my-1 [&_ol]:my-1 [&_p]:my-1.5 [&_h1]:my-2 [&_h2]:my-2 [&_strong]:font-semibold">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {ticket.description}
              </ReactMarkdown>
            </div>
          </div>

          {/* Comments */}
          <div className="px-5 py-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {ticket.comments.length} comment{ticket.comments.length !== 1 ? "s" : ""}
            </div>

            {ticket.comments.map((c) => {
              const author = getMember(c.authorId);
              return (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarImage src={author?.avatarUrl} alt={author?.name} />
                    <AvatarFallback className="text-[9px]">
                      {author ? getInitials(author.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">
                        {author?.name ?? "Unknown"}
                      </span>
                      <span className="text-xxs text-muted-foreground">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      <TicketLink text={c.body} onTicketClick={onTicketSelect} />
                    </p>
                  </div>
                </div>
              );
            })}

            <Separator />

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment or flag a blocker..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[64px] resize-none text-xs"
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!comment.trim()}
                className="h-7 text-xs"
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
