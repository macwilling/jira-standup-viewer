"use client";

import { useState } from "react";
import {
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
  Flame,
  MessageSquare,
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
// ScrollArea from base-ui doesn't scroll properly in this context; using native overflow
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Ticket, TicketPriority, TicketStatus, TeamMember } from "@/lib/types";
import { isStale } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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
  "To Do": "bg-slate-500/20 text-slate-400",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "In Review": "bg-yellow-500/20 text-yellow-400",
  Done: "bg-green-500/20 text-green-400",
};

const statusDots: Record<TicketStatus, string> = {
  "To Do": "bg-slate-400",
  "In Progress": "bg-blue-400",
  "In Review": "bg-yellow-400",
  Done: "bg-green-400",
};

const allStatuses: TicketStatus[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
];

interface TicketDrawerProps {
  ticket: Ticket | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  onStatusChange: (ticket: Ticket, status: TicketStatus) => void;
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
  return `${days} days ago`;
}

export function TicketDrawer({
  ticket,
  teamMembers,
  onClose,
  onStatusChange,
}: TicketDrawerProps) {
  const [comment, setComment] = useState("");

  if (!ticket) return null;

  const { icon: PriorityIcon, className: priorityClass } =
    priorityConfig[ticket.priority];
  const stale = isStale(ticket);

  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  const handleSubmitComment = () => {
    setComment("");
  };

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <p className="font-mono text-sm text-muted-foreground">
                {ticket.key}
                {ticket.isL2 && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs text-violet-400 border-violet-400/40"
                  >
                    L2
                  </Badge>
                )}
              </p>
              <SheetTitle className="text-lg leading-tight">
                {ticket.summary}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-5 pb-6">
            {/* Epic */}
            {ticket.epicName && (
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: ticket.epicColor || "#6B7280",
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {ticket.epicName}
                </span>
              </div>
            )}

            {/* Status + Priority */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium cursor-pointer",
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

              <Badge
                variant="outline"
                className={cn("text-xs", priorityClass)}
              >
                <PriorityIcon className="h-3 w-3 mr-1" />
                {ticket.priority}
              </Badge>
            </div>

            {/* Labels */}
            {ticket.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ticket.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {ticket.description}
              </ReactMarkdown>
            </div>

            {/* Last Activity */}
            <div
              className={cn(
                "flex items-center gap-2 text-sm",
                stale ? "text-amber-500" : "text-muted-foreground"
              )}
            >
              {stale && <Flame className="h-4 w-4" />}
              <span>
                Last activity: {formatRelativeTime(ticket.lastActivityDate)}
              </span>
            </div>

            <Separator />

            {/* Comments */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Comments ({ticket.comments.length})
              </div>

              {ticket.comments.map((c) => {
                const author = getMember(c.authorId);
                return (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage
                        src={author?.avatarUrl}
                        alt={author?.name}
                      />
                      <AvatarFallback className="text-xs">
                        {author ? getInitials(author.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">
                          {author?.name ?? "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Add Comment */}
            <div className="space-y-3">
              <Textarea
                placeholder="Add a comment or flag a blocker..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!comment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
