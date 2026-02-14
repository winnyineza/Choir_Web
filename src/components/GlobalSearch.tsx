import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Users, Calendar, Wallet, FileText, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllMembers, getAllEvents, type Member, type Event } from "@/lib/dataService";
import { getAllContributions, type Contribution } from "@/lib/contributionService";
import { getAllDocuments, type Document } from "@/lib/documentService";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "member" | "event" | "contribution" | "document";
  title: string;
  subtitle: string;
  icon: typeof Users;
  data: Member | Event | Contribution | Document;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultClick?: (result: SearchResult) => void;
}

export function GlobalSearch({ open, onOpenChange, onResultClick }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load all data
  const members = useMemo(() => getAllMembers(), []);
  const events = useMemo(() => getAllEvents(), []);
  const contributions = useMemo(() => getAllContributions(), []);
  const [documents, setDocuments] = useState<Document[]>([]);
  useEffect(() => {
    getAllDocuments().then(setDocuments);
  }, []);

  // Search results
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search members
    members.forEach((member) => {
      if (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.phone?.toLowerCase().includes(q)
      ) {
        searchResults.push({
          id: member.id,
          type: "member",
          title: member.name,
          subtitle: `${member.voice} • ${member.status}`,
          icon: Users,
          data: member,
        });
      }
    });

    // Search events
    events.forEach((event) => {
      if (
        event.title.toLowerCase().includes(q) ||
        event.description?.toLowerCase().includes(q) ||
        event.location?.toLowerCase().includes(q)
      ) {
        searchResults.push({
          id: event.id,
          type: "event",
          title: event.title,
          subtitle: `${new Date(event.date).toLocaleDateString()} • ${event.location}`,
          icon: Calendar,
          data: event,
        });
      }
    });

    // Search contributions by member name
    contributions.forEach((contribution) => {
      const member = members.find((m) => m.id === contribution.memberId);
      if (member?.name.toLowerCase().includes(q)) {
        searchResults.push({
          id: contribution.id,
          type: "contribution",
          title: `${member.name} - ${contribution.type}`,
          subtitle: `RWF ${contribution.amount.toLocaleString()} • ${new Date(contribution.createdAt).toLocaleDateString()}`,
          icon: Wallet,
          data: contribution,
        });
      }
    });

    // Search documents
    documents.forEach((doc) => {
      if (
        doc.title.toLowerCase().includes(q) ||
        doc.description?.toLowerCase().includes(q) ||
        doc.category?.toLowerCase().includes(q)
      ) {
        searchResults.push({
          id: doc.id,
          type: "document",
          title: doc.title,
          subtitle: doc.category || "Document",
          icon: FileText,
          data: doc,
        });
      }
    });

    return searchResults.slice(0, 20); // Limit results
  }, [query, members, events, contributions, documents]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        onResultClick?.(results[selectedIndex]);
        onOpenChange(false);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [results, selectedIndex, onResultClick, onOpenChange]
  );

  // Clear on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const typeColors = {
    member: "text-blue-500 bg-blue-500/10",
    event: "text-green-500 bg-green-500/10",
    contribution: "text-yellow-500 bg-yellow-500/10",
    document: "text-purple-500 bg-purple-500/10",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search for members, events, contributions, and documents
          </DialogDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search members, events, contributions, documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10 h-12 text-lg bg-secondary border-primary/20"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {query && results.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      onResultClick?.(result);
                      onOpenChange(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      index === selectedIndex
                        ? "bg-primary/10"
                        : "hover:bg-secondary"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", typeColors[result.type])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded bg-secondary">
                      {result.type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">
                Press <kbd className="px-2 py-1 rounded bg-secondary text-xs font-mono">⌘K</kbd> to search anytime
              </p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-primary/10 bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">↵</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">esc</kbd> Close
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for keyboard shortcut
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
