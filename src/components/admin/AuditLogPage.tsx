import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Filter,
  RefreshCw,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Settings,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAuditLog,
  getAllAdminUsers,
  cleanupAuditLog,
  type AuditLogEntry,
  type AdminUser,
} from "@/lib/adminService";

const ITEMS_PER_PAGE = 20;

// Action icons mapping
const actionIcons: Record<string, typeof LogIn> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  VIEW: Eye,
  SETTINGS: Settings,
};

// Action colors
const actionColors: Record<string, string> = {
  LOGIN: "text-green-500 bg-green-500/10",
  LOGOUT: "text-yellow-500 bg-yellow-500/10",
  CREATE: "text-blue-500 bg-blue-500/10",
  UPDATE: "text-orange-500 bg-orange-500/10",
  DELETE: "text-red-500 bg-red-500/10",
  VIEW: "text-purple-500 bg-purple-500/10",
  SETTINGS: "text-gray-500 bg-gray-500/10",
};

export function AuditLogPage() {
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const loadData = () => {
    setIsLoading(true);
    setAllLogs(getAuditLog(10000)); // Get all logs
    setAdmins(getAllAdminUsers());
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get unique action types from logs
  const actionTypes = useMemo(() => {
    const types = new Set(allLogs.map(log => log.action));
    return Array.from(types).sort();
  }, [allLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          log.userName.toLowerCase().includes(query) ||
          log.userEmail.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // User filter
      if (selectedUser !== "all" && log.userId !== selectedUser) {
        return false;
      }
      
      // Action filter
      if (selectedAction !== "all" && log.action !== selectedAction) {
        return false;
      }
      
      // Date from filter
      if (dateFrom) {
        const logDate = new Date(log.timestamp).setHours(0, 0, 0, 0);
        const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (logDate < fromDate) return false;
      }
      
      // Date to filter
      if (dateTo) {
        const logDate = new Date(log.timestamp).setHours(23, 59, 59, 999);
        const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
        if (logDate > toDate) return false;
      }
      
      return true;
    });
  }, [allLogs, searchQuery, selectedUser, selectedAction, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedUser, selectedAction, dateFrom, dateTo]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Timestamp", "User", "Email", "Action", "Details"];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.userName,
      log.userEmail,
      log.action,
      log.details,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredLogs.length} log entries`,
    });
  };

  const handleCleanup = () => {
    if (!confirm("This will delete all audit logs older than 90 days. Continue?")) {
      return;
    }
    
    cleanupAuditLog();
    loadData();
    toast({
      title: "Cleanup Complete",
      description: "Old audit logs have been removed",
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedUser("all");
    setSelectedAction("all");
    setDateFrom("");
    setDateTo("");
  };

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || History;
    return Icon;
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || "text-muted-foreground bg-muted";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold gold-text flex items-center gap-2">
            <History className="w-6 h-6" />
            Audit Log
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track all admin actions and system changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCleanup}>
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Old
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="ghost" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <p className="text-2xl font-bold text-foreground">{allLogs.length}</p>
          <p className="text-sm text-muted-foreground">Total Entries</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
          <p className="text-sm text-muted-foreground">Filtered Results</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <p className="text-2xl font-bold text-foreground">
            {allLogs.filter(l => l.action === "LOGIN").length}
          </p>
          <p className="text-sm text-muted-foreground">Total Logins</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <p className="text-2xl font-bold text-foreground">{admins.length}</p>
          <p className="text-sm text-muted-foreground">Admin Users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-primary/10 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filters
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-primary/20"
              />
            </div>
          </div>

          {/* User Filter */}
          <div>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-background border-primary/20">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {admins.map(admin => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Filter */}
          <div>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="bg-background border-primary/20">
                <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10 bg-background border-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-10 bg-background border-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-2">
        {paginatedLogs.length > 0 ? (
          paginatedLogs.map((log) => {
            const ActionIcon = getActionIcon(log.action);
            const colorClass = getActionColor(log.action);
            
            return (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-primary/10 hover:border-primary/20 transition-colors"
              >
                {/* Action Icon */}
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <ActionIcon className="w-4 h-4" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{log.userName}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {log.details || "No details provided"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.userEmail}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-foreground">{formatRelativeTime(log.timestamp)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No audit logs found</p>
            <p className="text-sm">
              {searchQuery || selectedUser !== "all" || selectedAction !== "all" || dateFrom || dateTo
                ? "Try adjusting your filters"
                : "Admin actions will appear here"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-primary/10">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

