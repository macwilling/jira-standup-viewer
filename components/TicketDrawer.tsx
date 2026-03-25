"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ExternalLink,
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
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Ticket, TicketPriority, TicketStatus, TeamMember } from "@/lib/types";
import { useTicketData } from "@/lib/ticket-data-context";
import { cn, getStatusBadgeColor, statusBadgeBase, parseSummaryTags } from "@/lib/utils";
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

// Status colors and labels now come from real Jira status via getStatusBadgeColor

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
  const { isStale } = useTicketData();
  const [comment, setComment] = useState("");
  const [epicExpanded, setEpicExpanded] = useState(false);
  const scrollRef = useRef(null as HTMLDivElement | null);

  // Epic children state
  const [epicChildren, setEpicChildren] = useState<Ticket[]>([]);
  const [epicLoading, setEpicLoading] = useState(false);

  // Linked tickets state
  const [fetchedLinks, setFetchedLinks] = useState<
    { type: string; targetKey: string; ticket: Ticket }[]
  >([]);
  const [linksLoading, setLinksLoading] = useState(false);

  // Track what we've fetched to avoid re-fetching
  const lastFetchedTicketKey = useRef<string | null>(null);

  // Fetch epic children + linked tickets when ticket changes
  useEffect(() => {
    if (!ticket || ticket.key === lastFetchedTicketKey.current) return;
    lastFetchedTicketKey.current = ticket.key;

    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setEpicExpanded(false);
    setEpicChildren([]);
    setFetchedLinks([]);

    // Fetch epic children
    if (ticket.epicKey) {
      setEpicLoading(true);
      fetch(`/api/jira/epic-children?epicKey=${encodeURIComponent(ticket.epicKey)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.tickets) {
            setEpicChildren(data.tickets.filter((t: Ticket) => t.key !== ticket.key));
          }
        })
        .catch(() => {})
        .finally(() => setEpicLoading(false));
    }

    // Fetch linked tickets from Jira
    const linkKeys = ticket.links.map((l) => l.targetKey);
    if (linkKeys.length > 0) {
      // First check which ones we already have locally
      const localMap = new Map(allTickets.map((t) => [t.key, t]));
      const missingKeys = linkKeys.filter((k) => !localMap.has(k));

      if (missingKeys.length > 0) {
        setLinksLoading(true);
        fetch(`/api/jira/issues?keys=${encodeURIComponent(missingKeys.join(","))}`)
          .then((r) => r.json())
          .then((data) => {
            const fetchedMap = new Map(
              (data.tickets || []).map((t: Ticket) => [t.key, t])
            );
            // Merge local + fetched
            const resolved = ticket.links
              .map((link) => ({
                type: link.type,
                targetKey: link.targetKey,
                ticket: localMap.get(link.targetKey) || fetchedMap.get(link.targetKey),
              }))
              .filter((l) => !!l.ticket) as { type: string; targetKey: string; ticket: Ticket }[];
            setFetchedLinks(resolved);
          })
          .catch(() => {
            // Fall back to local only
            const resolved = ticket.links
              .map((link) => ({
                type: link.type,
                targetKey: link.targetKey,
                ticket: localMap.get(link.targetKey),
              }))
              .filter((l) => !!l.ticket) as { type: string; targetKey: string; ticket: Ticket }[];
            setFetchedLinks(resolved);
          })
          .finally(() => setLinksLoading(false));
      } else {
        // All links are local
        const resolved = ticket.links
          .map((link) => ({
            type: link.type,
            targetKey: link.targetKey,
            ticket: localMap.get(link.targetKey),
          }))
          .filter((l) => !!l.ticket) as { type: string; targetKey: string; ticket: Ticket }[];
        setFetchedLinks(resolved);
      }
    }
  }, [ticket, allTickets]);

  // Epic siblings: use fetched if available, else local filter
  const localEpicSiblings = useMemo(() => {
    if (!ticket?.epicName) return [];
    return allTickets.filter(
      (t) => t.epicName === ticket.epicName && t.key !== ticket.key
    );
  }, [ticket, allTickets]);

  const epicSiblings = epicChildren.length > 0 ? epicChildren : localEpicSiblings;

  // Resolved links: use fetched if available
  const resolvedLinks = fetchedLinks;

  if (!ticket) return null;

  const { icon: PriorityIcon, className: priorityClass } =
    priorityConfig[ticket.priority];
  const stale = isStale(ticket);
  const assignee = teamMembers.find((m) => m.id === ticket.assigneeId);
  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  function extractTextContent(node: React.ReactNode): string {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractTextContent).join("");
    if (React.isValidElement(node) && node.props) {
      return extractTextContent((node.props as { children?: React.ReactNode }).children);
    }
    return "";
  }

  function filterPanelMarker(children: React.ReactNode): React.ReactNode {
    if (!children) return children;
    if (typeof children === "string") {
      return children.replace(/\[panel-(success|warning|error|info|note)\]\s*/g, "");
    }
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        if (typeof child === "string") {
          const filtered = child.replace(/\[panel-(success|warning|error|info|note)\]\s*/g, "");
          return filtered || null;
        }
        if (React.isValidElement(child) && child.props) {
          const props = child.props as { children?: React.ReactNode };
          const filteredChildren = filterPanelMarker(props.children);
          // Skip paragraphs that only contained the marker
          const text = extractTextContent(filteredChildren);
          if (!text.trim()) return null;
          return React.cloneElement(child, { key: i }, filteredChildren);
        }
        return child;
      }).filter(Boolean);
    }
    if (React.isValidElement(children) && children.props) {
      const props = children.props as { children?: React.ReactNode };
      return React.cloneElement(children, {}, filterPanelMarker(props.children));
    }
    return children;
  }

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

  // Panel type styles for Jira callout blocks
  const panelStyles: Record<string, { bg: string; border: string; icon: string }> = {
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "✅" },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⚠️" },
    error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "❌" },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "ℹ️" },
    note: { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "📝" },
  };

  // Custom markdown components that render ticket references inline
  const markdownComponents: Components = {
    blockquote: ({ children }) => {
      // Check if this is a Jira panel by looking for [panel-*] marker in text content
      const textContent = extractTextContent(children);
      const panelMatch = textContent.match(/\[panel-(success|warning|error|info|note)\]/);
      if (panelMatch) {
        const type = panelMatch[1];
        const style = panelStyles[type] || panelStyles.info;
        // Remove the marker from rendered children
        return (
          <div className={`${style.bg} ${style.border} border rounded-md p-3 my-2`}>
            <div className="flex gap-2">
              <span className="shrink-0">{style.icon}</span>
              <div className="flex-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                {filterPanelMarker(children)}
              </div>
            </div>
          </div>
        );
      }
      // Regular blockquote
      return (
        <blockquote className="border-l-2 border-border/60 pl-3 my-2 text-muted-foreground italic">
          {children}
        </blockquote>
      );
    },
    p: ({ children }) => (
      <p>
        {processChildren(children)}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="pl-6 space-y-1.5 my-1.5 [list-style-type:disc] [&_ul]:[list-style-type:circle] [&_ul_ul]:[list-style-type:square]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="pl-6 space-y-1.5 my-1.5 list-decimal [&_ol]:[list-style-type:lower-alpha] [&_ol_ol]:[list-style-type:lower-roman]">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="pl-1 [&>ul]:mt-1 [&>ol]:mt-1">
        {processChildren(children)}
      </li>
    ),
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || "attachment"}
        className="max-w-full rounded-md border my-2"
        loading="lazy"
      />
    ),
    code: ({ children, className }) => {
      // If it has a className like "language-*", it's inside a code block (pre > code)
      if (className) {
        return <code className={className}>{children}</code>;
      }
      // Inline code — subtle grey bubble like Jira
      return (
        <code className="px-1.5 py-0.5 rounded bg-muted/60 text-[0.85em] font-mono text-foreground/80">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="my-2 rounded-lg bg-muted/40 border border-border/50 p-3 overflow-x-auto text-[0.85em] leading-relaxed">
        {children}
      </pre>
    ),
    a: ({ href, children }) => {
      // Check if href is a Jira browse URL
      const jiraKeyMatch = href?.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/);
      if (jiraKeyMatch) {
        return <TicketLink text={href!} onTicketClick={onTicketSelect} />;
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {children}
        </a>
      );
    },
  };

  const handleSubmitComment = () => {
    setComment("");
  };

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col"
        defaultWidth={420}
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
            {process.env.NEXT_PUBLIC_JIRA_URL && (
              <a
                href={`${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${ticket.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                title="Open in Jira"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <SheetTitle className="text-base leading-snug font-semibold pr-6">
            {(() => {
              const { tags, rest } = parseSummaryTags(ticket.summary);
              return (
                <>
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded px-1.5 py-0.5 mr-1.5 text-[10px] font-medium bg-accent text-accent-foreground/70 align-middle"
                    >
                      {tag}
                    </span>
                  ))}
                  {rest}
                </>
              );
            })()}
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
              <span
                className={cn(
                  statusBadgeBase,
                  "text-[10px] px-1.5 py-0.5",
                  getStatusBadgeColor(ticket.statusCategory)
                )}
              >
                {ticket.status.toUpperCase()}
              </span>
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
              <div className="flex items-center">
                <span className="w-24 text-muted-foreground shrink-0">Epic</span>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setEpicExpanded(!epicExpanded)}
                    className="inline-flex items-center gap-1.5 max-w-full hover:text-foreground transition-colors rounded px-1.5 py-0.5 -mx-1.5 hover:bg-surface-hover"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: ticket.epicColor || "#6B7280" }}
                    />
                    <span className="truncate">{ticket.epicName}</span>
                    <span className="text-muted-foreground/50 text-xxs shrink-0">
                      ({epicSiblings.length + 1})
                    </span>
                    <ChevronRight className={cn(
                      "h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-150",
                      epicExpanded && "rotate-90"
                    )} />
                  </button>

                  {/* Epic children list */}
                  {epicExpanded && epicLoading && (
                    <div className="mt-1.5 pl-4 text-xxs text-muted-foreground">Loading...</div>
                  )}
                  {epicExpanded && !epicLoading && epicSiblings.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 pl-4 border-l-2 border-border/50">
                      {epicSiblings.map((t) => (
                        <TicketTooltip key={t.key} ticket={t} side="bottom">
                          <button
                            onClick={() => onTicketSelect?.(t)}
                            className="w-full flex items-center gap-1.5 py-0.5 text-xxs text-left hover:text-foreground transition-colors group"
                          >
                            <span className="font-mono text-muted-foreground">{t.key}</span>
                            <span className="truncate flex-1">
                              {(() => {
                                const { tags, rest } = parseSummaryTags(t.summary);
                                return (
                                  <>
                                    {tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center rounded px-1 py-px mr-1 text-[10px] font-medium bg-accent text-accent-foreground/70"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {rest}
                                  </>
                                );
                              })()}
                            </span>
                            <span className={cn(statusBadgeBase, "text-[8px] px-0.5 py-px shrink-0", getStatusBadgeColor(t.statusCategory))}>
                              {t.status.toUpperCase()}
                            </span>
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
          {(resolvedLinks.length > 0 || linksLoading) && (
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
                        <span className="font-mono text-xxs text-muted-foreground shrink-0">{t.key}</span>
                        <span className="truncate flex-1 text-xxs">
                          {(() => {
                            const { tags, rest } = parseSummaryTags(t.summary);
                            return (
                              <>
                                {tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded px-1 py-px mr-1 text-[10px] font-medium bg-accent text-accent-foreground/70"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {rest}
                              </>
                            );
                          })()}
                        </span>
                        <span className={cn(statusBadgeBase, "text-[8px] px-0.5 py-px shrink-0", getStatusBadgeColor(t.statusCategory))}>
                          {t.status.toUpperCase()}
                        </span>
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
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-muted-foreground leading-relaxed mt-0.5 [&_p]:text-xs [&_p]:leading-relaxed [&_p]:my-1 [&_strong]:font-semibold [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {c.body}
                      </ReactMarkdown>
                    </div>
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
