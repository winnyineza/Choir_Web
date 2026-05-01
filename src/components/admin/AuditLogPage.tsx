import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  UserPlus,
  UserMinus,
  UserCheck,
  Users,
  DollarSign,
  Wallet,
  Ticket,
  Image,
  Music,
  FileText,
  MessageSquare,
  Megaphone,
  Clock,
  CalendarCheck,
  Package,
  AlertTriangle,
  X,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAuditLog,
  getAuditLogPage,
  getAllAdminUsers,
  cleanupAuditLog,
  type AuditLogEntry,
  type AdminUser,
} from "@/lib/adminService";
import { cn } from "@/lib/utils";
import { downloadBrandedTableReport } from "@/lib/exportUtils";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";
import { AUDIT_ACTION_CATEGORIES, getAuditCategoryKey } from "@/lib/auditLogMeta";

const ITEMS_PER_PAGE = 25;

const categoryIcons: Record<string, typeof LogIn> = {
  auth: Shield,
  members: Users,
  contributions: DollarSign,
  expenses: Wallet,
  donations: DollarSign,
  events: Ticket,
  leave: CalendarCheck,
  gallery: Image,
  music: Music,
  announcements: Megaphone,
  disciplinary: AlertTriangle,
  documents: FileText,
  meetings: MessageSquare,
  inventory: Package,
  promos: Zap,
  admin: Shield,
};

const getActionCategory = (action: string): { category: string; color: string; icon: typeof LogIn } => {
  const category = getAuditCategoryKey(action);
  const meta = AUDIT_ACTION_CATEGORIES[category];
  return {
    category,
    color: meta?.color || "text-muted-foreground bg-muted/10 border-muted/20",
    icon: categoryIcons[category] || History,
  };
};

// Action icons mapping
const actionIcons: Record<string, typeof LogIn> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  VIEW: Eye,
  SETTINGS: Settings,
  CREATE_MEMBER: UserPlus,
  UPDATE_MEMBER: UserCheck,
  DELETE_MEMBER: UserMinus,
  BULK_UPDATE_MEMBERS: Users,
  BULK_DELETE_MEMBERS: Users,
  CREATE_CONTRIBUTION: DollarSign,
  UPDATE_CONTRIBUTION: DollarSign,
  DELETE_CONTRIBUTION: DollarSign,
  RECORD_CONTRIBUTIONS: DollarSign,
  CREATE_CONTRIBUTION_TYPE: DollarSign,
  UPDATE_CONTRIBUTION_TYPE: DollarSign,
  DELETE_CONTRIBUTION_TYPE: DollarSign,
  TOGGLE_CONTRIBUTION_TYPE: DollarSign,
  MONTHLY_DUES_TOLERATED: DollarSign,
  MONTHLY_DUES_TOLERANCE_REMOVED: DollarSign,
  CREATE_EXPENSE: Wallet,
  UPDATE_EXPENSE: Wallet,
  DELETE_EXPENSE: Wallet,
  CREATE_EVENT: Ticket,
  UPDATE_EVENT: Ticket,
  DELETE_EVENT: Ticket,
  ADD_GALLERY: Image,
  DELETE_GALLERY: Image,
  CREATE_ALBUM: Music,
  UPDATE_ALBUM: Music,
  DELETE_ALBUM: Music,
  APPROVE_LEAVE: CalendarCheck,
  DENY_LEAVE: CalendarCheck,
  CREATE_DISCIPLINARY: AlertTriangle,
  UPDATE_DISCIPLINARY: AlertTriangle,
  RESOLVE_DISCIPLINARY: AlertTriangle,
  CREATE_ADMIN_INVITE: Shield,
  DELETE_ADMIN_INVITE: Shield,
  RESEND_ADMIN_INVITE: Shield,
  SEND_MEMBER_INVITE: Shield,
  BULK_SEND_INVITES: Shield,
};

// Quick date presets
const datePresets = [
  { label: "Today", getValue: () => { const d = new Date(); return { from: d.toISOString().split("T")[0], to: d.toISOString().split("T")[0] }; } },
  { label: "Yesterday", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { from: d.toISOString().split("T")[0], to: d.toISOString().split("T")[0] }; } },
  { label: "This Week", getValue: () => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay()); return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }; } },
  { label: "This Month", getValue: () => { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }; } },
  { label: "Last 30 Days", getValue: () => { const now = new Date(); const start = new Date(); start.setDate(now.getDate() - 30); return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }; } },
];

export function AuditLogPage() {
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
  const [pagedLogs, setPagedLogs] = useState<AuditLogEntry[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    const [logsData, adminsData] = await Promise.all([
      getAuditLog(500),
      getAllAdminUsers(),
    ]);
    setAllLogs(logsData);
    setAdmins(adminsData);
    setIsLoading(false);
  };

  const loadPagedLogs = async () => {
    setIsLoading(true);
    const result = await getAuditLogPage({
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      searchQuery,
      userId: selectedUser,
      action: selectedAction,
      category: selectedCategory,
      dateFrom,
      dateTo,
    });

    setPagedLogs(result.logs);
    setFilteredTotal(result.total);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPagedLogs();
  }, [searchQuery, selectedUser, selectedAction, selectedCategory, dateFrom, dateTo, currentPage]);

  // Get unique action types from logs
  const actionTypes = useMemo(() => {
    const types = new Set(allLogs.map(log => log.action));
    return Array.from(types).sort();
  }, [allLogs]);

  // Get stats by category
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const log of allLogs) {
      const { category } = getActionCategory(log.action);
      stats[category] = (stats[category] || 0) + 1;
    }
    return stats;
  }, [allLogs]);

  // Get today's activity count
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allLogs.filter(log => log.timestamp.startsWith(today)).length;
  }, [allLogs]);

  // Get most active users
  const topUsers = useMemo(() => {
    const userCounts: Record<string, { name: string; count: number }> = {};
    for (const log of allLogs) {
      if (!userCounts[log.userId]) {
        userCounts[log.userId] = { name: log.userName, count: 0 };
      }
      userCounts[log.userId].count++;
    }
    return Object.values(userCounts).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [allLogs]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedUser !== "all") count++;
    if (selectedCategory !== "all") count++;
    if (selectedAction !== "all") count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [searchQuery, selectedUser, selectedCategory, selectedAction, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTotal / ITEMS_PER_PAGE));

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedUser, selectedAction, selectedCategory, dateFrom, dateTo]);

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

  const handleExport = async () => {
    const exportResult = await getAuditLogPage({
      page: 1,
      pageSize: 250,
      searchQuery,
      userId: selectedUser,
      action: selectedAction,
      category: selectedCategory,
      dateFrom,
      dateTo,
    });

    const headers = ["Timestamp", "User", "Email", "Action", "Details"];
    const rows = exportResult.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.userName,
      log.userEmail,
      log.action,
      log.details,
    ]);

    downloadBrandedTableReport({
      title: "Audit Log Report",
      filename: "audit-log",
      headers,
      rows,
      meta: [
        { label: "User Filter", value: selectedUser === "all" ? "All Users" : selectedUser },
        { label: "Action Filter", value: selectedAction === "all" ? "All Actions" : selectedAction },
        { label: "Generated", value: new Date().toLocaleString() },
      ],
      summary: [
        { label: "Entries", value: exportResult.total },
        { label: "Page", value: currentPage },
      ],
    });

    toast({
      title: "Export Complete",
      description: `Exported ${exportResult.logs.length} log entries`,
    });
  };

  const handleCleanup = () => {
    if (!confirmDestructiveAction({
      action: "delete",
      subject: "audit logs older than 90 days",
      warning: "This cleanup cannot be undone.",
    })) {
      return;
    }
    
    cleanupAuditLog();
    loadData();
    loadPagedLogs();
    toast({
      title: "Cleanup Complete",
      description: "Old audit logs have been removed",
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedUser("all");
    setSelectedCategory("all");
    setSelectedAction("all");
    setDateFrom("");
    setDateTo("");
    setActivePreset(null);
  };

  const applyPreset = (preset: typeof datePresets[0]) => {
    const { from, to } = preset.getValue();
    setDateFrom(from);
    setDateTo(to);
    setActivePreset(preset.label);
  };

  const getActionIcon = (action: string) => {
    // Try exact match first
    if (actionIcons[action]) return actionIcons[action];
    // Try prefix matching
    for (const [key, icon] of Object.entries(actionIcons)) {
      if (action.includes(key)) return icon;
    }
    return History;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold gold-text flex items-center gap-2">
            <History className="w-6 h-6" />
            Audit Log
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track all admin actions and system changes
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCleanup}>
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{allLogs.length.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xl font-bold text-green-500">{todayCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Today</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Filter className="w-4 h-4 text-blue-500" />
            <span className="text-xl font-bold text-blue-500">{filteredTotal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Filtered</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <LogIn className="w-4 h-4 text-emerald-500" />
            <span className="text-xl font-bold">{categoryStats.auth || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Auth Events</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-xl font-bold">{admins.length}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Admin Users</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <span className="text-xl font-bold">{actionTypes.length}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Action Types</p>
        </div>
      </div>

      {/* Category Quick Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
        {Object.entries(AUDIT_ACTION_CATEGORIES).slice(0, 8).map(([key, cat]) => {
          const CatIcon = categoryIcons[key] || History;
          const count = categoryStats[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? "all" : key)}
              className={cn(
                "p-2 rounded-lg border transition-all text-center",
                selectedCategory === key
                  ? cat.color + " border-current"
                  : "bg-secondary/30 border-primary/10 hover:border-primary/30"
              )}
            >
              <CatIcon className={cn("w-4 h-4 mx-auto mb-1", selectedCategory === key ? "" : "text-muted-foreground")} />
              <p className="text-xs font-medium">{count}</p>
              <p className="text-[10px] text-muted-foreground truncate">{cat.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters Panel */}
      <div className="rounded-xl border border-primary/10 overflow-hidden">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-3 bg-secondary/30 flex items-center justify-between hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
        </button>
        
        {showFilters && (
          <div className="p-4 space-y-4 bg-secondary/10">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
              {datePresets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition-colors",
                    activePreset === preset.label
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 border-primary/20 hover:border-primary/50"
                  )}
                >
                  {preset.label}
                </button>
              ))}
              {activePreset && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); setActivePreset(null); }}
                  className="px-3 py-1 text-xs rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action, or details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-primary/20 h-9 text-sm"
                  />
                </div>
              </div>

              {/* User Filter */}
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-background border-primary/20 h-9">
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

              {/* Action Filter */}
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="bg-background border-primary/20 h-9">
                  <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      <span className="text-xs">{action}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setActivePreset(null); }}
                    className="pl-10 bg-background border-primary/20 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setActivePreset(null); }}
                    className="pl-10 bg-background border-primary/20 h-9 text-sm"
                  />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedUser !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    User: {admins.find(a => a.id === selectedUser)?.name}
                    <button onClick={() => setSelectedUser("all")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    Category: {AUDIT_ACTION_CATEGORIES[selectedCategory]?.label}
                    <button onClick={() => setSelectedCategory("all")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedAction !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    Action: {selectedAction}
                    <button onClick={() => setSelectedAction("all")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    {activePreset || `${dateFrom || "..."} - ${dateTo || "..."}`}
                    <button onClick={() => { setDateFrom(""); setDateTo(""); setActivePreset(null); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Most Active Users */}
      {topUsers.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Most Active:</span>
          {topUsers.map((user, idx) => (
            <button
              key={idx}
              onClick={() => {
                const admin = admins.find(a => a.name === user.name);
                if (admin) setSelectedUser(admin.id);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                idx === 0 ? "bg-yellow-500/20 text-yellow-500" :
                idx === 1 ? "bg-slate-300/20 text-slate-300" :
                "bg-amber-700/20 text-amber-700"
              )}>
                {idx + 1}
              </div>
              <span className="text-foreground">{user.name}</span>
              <span className="text-muted-foreground">({user.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Log Entries */}
      <div className="space-y-2">
        {pagedLogs.length > 0 ? (
          pagedLogs.map((log, idx) => {
            const ActionIcon = getActionIcon(log.action);
            const { color: categoryColor } = getActionCategory(log.action);
            
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-primary/30 cursor-pointer",
                  "bg-secondary/20 border-primary/10"
                )}
              >
                {/* Timeline indicator */}
                <div className="hidden sm:flex flex-col items-center self-stretch">
                  <div className={cn("w-2 h-2 rounded-full", categoryColor.split(" ")[0].replace("text-", "bg-"))} />
                  {idx < pagedLogs.length - 1 && (
                    <div className="w-0.5 flex-1 bg-primary/10 mt-1" />
                  )}
                </div>

                {/* Action Icon */}
                <div className={cn("p-2 rounded-lg shrink-0", categoryColor)}>
                  <ActionIcon className="w-4 h-4" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{log.userName}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wide", categoryColor)}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {log.details}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-foreground">{formatRelativeTime(log.timestamp)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(log.timestamp)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/50 mb-4">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No audit logs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeFilterCount > 0
                ? "Try adjusting your filters"
                : "Admin actions will appear here"}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-primary/10">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTotal === 0 ? 0 : ((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTotal)} of {filteredTotal}
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

      <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null); }}>
        <DialogContent className="sm:max-w-xl bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">Audit Entry Details</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Full details for the selected audit activity.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 text-sm mt-2">
              <div>
                <p className="text-muted-foreground">Action</p>
                <p className="font-medium text-foreground">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-muted-foreground">User</p>
                <p className="text-foreground">{selectedLog.userName} ({selectedLog.userEmail})</p>
              </div>
              <div>
                <p className="text-muted-foreground">Timestamp</p>
                <p className="text-foreground">{formatDate(selectedLog.timestamp)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Details</p>
                <div className="rounded-md bg-secondary/40 border border-primary/10 p-3 text-foreground whitespace-pre-wrap break-words">
                  {selectedLog.details || "No details provided"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


