import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Reply,
  ExternalLink,
  Copy,
  MessageSquare,
  MailOpen,
  CheckCheck,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllContactSubmissions,
  markAsRead,
  markAsReplied,
  deleteContactSubmission,
  markAllAsRead,
  getContactStats,
  type ContactSubmission,
} from "@/lib/contactService";
import { cn } from "@/lib/utils";

interface ContactSubmissionsProps {
  onUnreadCountChange?: (count: number) => void;
}

export function ContactSubmissions({ onUnreadCountChange }: ContactSubmissionsProps) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "replied">("all");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, replied: 0, thisWeek: 0 });

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, filter]);

  const loadSubmissions = () => {
    const data = getAllContactSubmissions();
    setSubmissions(data);
    const newStats = getContactStats();
    setStats(newStats);
    onUnreadCountChange?.(newStats.unread);
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.subject.toLowerCase().includes(query) ||
          s.message.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filter === "unread") {
      filtered = filtered.filter((s) => !s.isRead);
    } else if (filter === "replied") {
      filtered = filtered.filter((s) => s.repliedAt);
    }

    setFilteredSubmissions(filtered);
  };

  const handleView = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);

    // Mark as read
    if (!submission.isRead) {
      markAsRead(submission.id);
      loadSubmissions();
    }
  };

  const handleMarkReplied = (id: string) => {
    markAsReplied(id);
    loadSubmissions();
    toast({
      title: "Marked as replied",
      description: "This submission has been marked as replied.",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      deleteContactSubmission(id);
      loadSubmissions();
      setIsViewModalOpen(false);
      toast({
        title: "Deleted",
        description: "Submission has been deleted.",
      });
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    loadSubmissions();
    toast({
      title: "All marked as read",
      description: "All submissions have been marked as read.",
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      general: "General Inquiry",
      booking: "Event Booking",
      join: "Join the Choir",
      support: "Support/Donation",
      media: "Media Request",
      other: "Other",
    };
    return labels[subject] || subject;
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-500/20 text-blue-400",
      booking: "bg-purple-500/20 text-purple-400",
      join: "bg-green-500/20 text-green-400",
      support: "bg-primary/20 text-primary",
      media: "bg-pink-500/20 text-pink-400",
      other: "bg-gray-500/20 text-gray-400",
    };
    return colors[subject] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.unread}</p>
              <p className="text-xs text-muted-foreground">Unread</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCheck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.replied}</p>
              <p className="text-xs text-muted-foreground">Replied</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-secondary border-primary/20"
            />
          </div>
          <div className="flex rounded-lg overflow-hidden border border-primary/20">
            {(["all", "unread", "replied"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-2 text-sm capitalize transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {stats.unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <div className="card-glass rounded-xl p-12 text-center">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No messages</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || filter !== "all"
                ? "No messages match your search criteria."
                : "Contact form submissions will appear here."}
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className={cn(
                "card-glass rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all",
                !submission.isRead && "border-l-4 border-l-primary bg-primary/5"
              )}
              onClick={() => handleView(submission)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "p-2 rounded-lg mt-0.5",
                      submission.isRead ? "bg-secondary" : "bg-primary/20"
                    )}
                  >
                    {submission.isRead ? (
                      <MailOpen className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Mail className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {submission.name}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          getSubjectColor(submission.subject)
                        )}
                      >
                        {getSubjectLabel(submission.subject)}
                      </span>
                      {submission.repliedAt && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                          Replied
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {submission.email}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {submission.message}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(submission.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Message Details
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-primary/10">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {selectedSubmission.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedSubmission.email}</span>
                    <button
                      onClick={() => handleCopy(selectedSubmission.email, "Email")}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      getSubjectColor(selectedSubmission.subject)
                    )}
                  >
                    {getSubjectLabel(selectedSubmission.subject)}
                  </span>
                  {selectedSubmission.repliedAt && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> Replied
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="card-glass rounded-xl p-4">
                <p className="text-foreground whitespace-pre-wrap">
                  {selectedSubmission.message}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-col md:flex-row gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Received: {new Date(selectedSubmission.createdAt).toLocaleString()}
                </div>
                {selectedSubmission.repliedAt && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Replied: {new Date(selectedSubmission.repliedAt).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-primary/10">
                <Button asChild variant="gold">
                  <a href={`mailto:${selectedSubmission.email}`}>
                    <Reply className="w-4 h-4 mr-2" />
                    Reply via Email
                  </a>
                </Button>
                {!selectedSubmission.repliedAt && (
                  <Button
                    variant="outline"
                    onClick={() => handleMarkReplied(selectedSubmission.id)}
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark as Replied
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(selectedSubmission.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

