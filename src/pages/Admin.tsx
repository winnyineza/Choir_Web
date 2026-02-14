import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Music,
  Image,
  Heart,
  Settings,
  LogOut,
  Menu,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Music2,
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Video,
  Download,
  Tag,
  QrCode,
  Percent,
  Disc3,
  Play,
  Star,
  ExternalLink,
  CalendarOff,
  FileText,
  UserCheck,
  IdCard,
  Megaphone,
  Mail,
  Send,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAllOrders, updateOrderStatus, confirmOrder, getOrderStats, getPendingOrderStats, cleanupOldPendingOrders, deletePendingOrders, type TicketOrder } from "@/lib/ticketService";
import {
  getAllMembers,
  getAllEvents,
  getAllGalleryItems,
  getDashboardStats,
  deleteMember,
  deleteEvent,
  deleteGalleryItem,
  getSettings,
  updateSettings,
  type Member,
  type Event,
  type GalleryItem,
} from "@/lib/dataService";
import { formatCurrency } from "@/lib/flutterwave";
import { exportOrdersToCSV } from "@/lib/exportUtils";
import { sendMemberInvite, sendBulkInvites } from "@/lib/memberInviteService";
import {
  getAllPromoCodes,
  createPromoCode,
  deletePromoCode,
  updatePromoCode,
  type PromoCode,
} from "@/lib/promoService";
import {
  getAllAlbums,
  getAllMusicVideos,
  getAllPlatforms,
  updateAllPlatforms,
  type StreamingPlatform,
  deleteAlbum,
  deleteMusicVideo,
  getReleaseStats,
  type Album,
  type MusicVideo,
} from "@/lib/releaseService";
import {
  getAllLeaveRequests,
  getPendingLeaveRequests,
  approveLeaveRequest,
  denyLeaveRequest,
  getLeaveRequestStats,
  hasAdminVoted,
  getApprovalProgress,
  REQUIRED_APPROVALS,
  REQUIRED_DENIALS,
  type LeaveRequest,
} from "@/lib/leaveService";
import {
  getAllAttendanceRecords,
  getAttendanceByDate,
  getRecentSessions,
  saveAttendance,
  deleteAttendanceForDate,
  getMembersToExcuse,
  getOverallAttendanceStats,
  type AttendanceRecord,
  type AttendanceSession,
  type AttendanceStatus,
} from "@/lib/attendanceService";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { AddMemberModal } from "@/components/admin/AddMemberModal";
import { AddEventModal } from "@/components/admin/AddEventModal";
import { UploadGalleryModal } from "@/components/admin/UploadGalleryModal";
import { TicketDetailModal } from "@/components/admin/TicketDetailModal";
import { AddAlbumModal } from "@/components/admin/AddAlbumModal";
import { AddMusicVideoModal } from "@/components/admin/AddMusicVideoModal";
// Lazy loaded components for code splitting
const AnalyticsDashboard = lazy(() => import("@/components/admin/AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard })));
const AdminTeamManagement = lazy(() => import("@/components/admin/AdminTeamManagement").then(m => ({ default: m.AdminTeamManagement })));
const AuditLogPage = lazy(() => import("@/components/admin/AuditLogPage").then(m => ({ default: m.AuditLogPage })));
// Charts - used inline in dashboard, members, tickets, attendance sections
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  exportFullBackup,
  exportMembersToCSV,
  exportAttendanceToCSV,
  exportFinancialReportToCSV,
  getBackupStats,
} from "@/lib/exportUtils";
const AnnouncementManagement = lazy(() => import("@/components/admin/AnnouncementManagement").then(m => ({ default: m.AnnouncementManagement })));
const EventStaffManagement = lazy(() => import("@/components/admin/EventStaffManagement").then(m => ({ default: m.EventStaffManagement })));
import { EventSummaryModal } from "@/components/admin/EventSummaryModal";
const ContributionManagement = lazy(() => import("@/components/admin/ContributionManagement").then(m => ({ default: m.ContributionManagement })));
import { getAllContributions } from "@/lib/contributionService";
import { getAllExpenses } from "@/lib/expenseService";
import { getAllDonations } from "@/lib/donationService";
import { BarChart3, Shield, History, Mail, Wallet, Receipt, PiggyBank, X, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Info, AlertTriangle } from "lucide-react";
import { addAuditLog, getAccessibleTabs, hasPermission, getRoleLabel, canEditMembers, hasWriteAccess, isReviewer, changePassword, updateAdminUser } from "@/lib/adminService";
const ContactSubmissions = lazy(() => import("@/components/admin/ContactSubmissions").then(m => ({ default: m.ContactSubmissions })));
import { getUnreadCount as getUnreadContactCount } from "@/lib/contactService";
const ExpenseManagement = lazy(() => import("@/components/admin/ExpenseManagement").then(m => ({ default: m.ExpenseManagement })));
const Treasury = lazy(() => import("@/components/admin/Treasury").then(m => ({ default: m.Treasury })));
const ExecutiveDashboard = lazy(() => import("@/components/admin/ExecutiveDashboard").then(m => ({ default: m.ExecutiveDashboard })));
import { BirthdayAlert } from "@/components/BirthdayAlert";
const DisciplinaryManagement = lazy(() => import("@/components/admin/DisciplinaryManagement").then(m => ({ default: m.DisciplinaryManagement })));
const GalleryManagement = lazy(() => import("@/components/admin/GalleryManagement").then(m => ({ default: m.GalleryManagement })));
const MusicReleasesManagement = lazy(() => import("@/components/admin/MusicReleasesManagement").then(m => ({ default: m.MusicReleasesManagement })));
const PromoManagement = lazy(() => import("@/components/admin/PromoManagement").then(m => ({ default: m.PromoManagement })));
const InventoryManagement = lazy(() => import("@/components/admin/InventoryManagement").then(m => ({ default: m.InventoryManagement })));
const MeetingMinutesComponent = lazy(() => import("@/components/admin/MeetingMinutes").then(m => ({ default: m.MeetingMinutesComponent })));
const DocumentManagement = lazy(() => import("@/components/admin/DocumentManagement").then(m => ({ default: m.DocumentManagement })));
const VoiceBalanceTracker = lazy(() => import("@/components/admin/VoiceBalanceTracker").then(m => ({ default: m.VoiceBalanceTracker })));
const SurveyManagement = lazy(() => import("@/components/admin/SurveyManagement").then(m => ({ default: m.SurveyManagement })));
import { Package, FileText as FileTextIcon, FolderOpen, Mic2, ClipboardList } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { BackupRestore } from "@/components/admin/BackupRestore";

type Tab = "dashboard" | "members" | "events" | "tickets" | "attendance" | "leave" | "disciplinary" | "contributions" | "expenses" | "treasury" | "announcements" | "messages" | "releases" | "promos" | "gallery" | "inventory" | "minutes" | "documents" | "voice-balance" | "surveys" | "analytics" | "event-staff" | "team" | "audit" | "settings";

const sidebarItems = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
  { id: "members" as Tab, label: "Members", icon: Users },
  { id: "events" as Tab, label: "Events", icon: Calendar },
  { id: "tickets" as Tab, label: "Ticket Orders", icon: Ticket },
  { id: "attendance" as Tab, label: "Attendance", icon: UserCheck },
  { id: "leave" as Tab, label: "Leave Requests", icon: CalendarOff },
  { id: "disciplinary" as Tab, label: "Disciplinary", icon: AlertTriangle },
  { id: "contributions" as Tab, label: "Contributions", icon: Wallet },
  { id: "expenses" as Tab, label: "Expenses", icon: Receipt },
  { id: "treasury" as Tab, label: "Treasury", icon: PiggyBank },
  { id: "announcements" as Tab, label: "Announcements", icon: Megaphone },
  { id: "messages" as Tab, label: "Messages", icon: Mail },
  { id: "releases" as Tab, label: "Releases", icon: Disc3 },
  { id: "promos" as Tab, label: "Promo Codes", icon: Tag },
  { id: "gallery" as Tab, label: "Gallery", icon: Image },
  { id: "inventory" as Tab, label: "Inventory", icon: Package },
  { id: "minutes" as Tab, label: "Minutes", icon: FileTextIcon },
  { id: "documents" as Tab, label: "Documents", icon: FolderOpen },
  { id: "voice-balance" as Tab, label: "Voice Balance", icon: Mic2 },
  { id: "surveys" as Tab, label: "Surveys", icon: ClipboardList },
  { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
  { id: "event-staff" as Tab, label: "Event Staff", icon: IdCard },
  { id: "team" as Tab, label: "Admin Team", icon: Shield },
  { id: "audit" as Tab, label: "Audit Log", icon: History },
  { id: "settings" as Tab, label: "Settings", icon: Settings },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, logout, isSuperAdmin, currentUser } = useAuth();
  const { toast } = useToast();
  
  // Role preview mode (Super Admin only)
  const [previewRole, setPreviewRole] = useState<string | null>(null);
  
  // Create a simulated user for preview mode
  const effectiveUser = previewRole && currentUser ? {
    ...currentUser,
    role: previewRole as any,
  } : currentUser;

  // Filter sidebar items based on role permissions (use effectiveUser for preview)
  const accessibleTabs = getAccessibleTabs(effectiveUser);
  const visibleSidebarItems = sidebarItems.filter(
    item => accessibleTabs.includes(item.id)
  );

  // Data states
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
  const [streamingPlatforms, setStreamingPlatforms] = useState<StreamingPlatform[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveFilter, setLeaveFilter] = useState<"all" | "pending" | "approved" | "denied">("all");
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Financial totals for Finance dashboard
  const [financialTotals, setFinancialTotals] = useState({
    contributions: 0,
    donations: 0,
    expenses: 0,
    ticketRevenue: 0,
    totalIncome: 0,
    balance: 0,
  });
  
  // Order & attendance stats (loaded async)
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0, used: 0, revenue: 0 });
  const [overallAttendanceStats, setOverallAttendanceStats] = useState({ totalSessions: 0, avgAttendance: 0, recentTrend: 'stable' as 'up' | 'down' | 'stable' });
  
  // Attendance state
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [memberId: string]: AttendanceStatus }>({});
  const [sessionTitle, setSessionTitle] = useState("Regular Practice");
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
  const [membersOnLeave, setMembersOnLeave] = useState<{ memberId: string; memberName: string; reason: string }[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalMembers: 0,
    newMembersThisMonth: 0,
    upcomingEvents: 0,
    nextEvent: "None",
    totalDonations: 0,
    donationChange: "+0%",
  });

  // Modal states
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showUploadGallery, setShowUploadGallery] = useState(false);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddMusicVideo, setShowAddMusicVideo] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEventSummary, setShowEventSummary] = useState(false);
  const [summaryEvent, setSummaryEvent] = useState<Event | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingMusicVideo, setEditingMusicVideo] = useState<MusicVideo | null>(null);
  const [viewingOrder, setViewingOrder] = useState<TicketOrder | null>(null);

  // Filter states
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "confirmed" | "used">("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Settings state
  const [settings, setSettingsState] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
  const [backupStats, setBackupStats] = useState<Awaited<ReturnType<typeof getBackupStats>> | null>(null);

  // My Account state
  const [accountName, setAccountName] = useState(currentUser?.name || "");
  const [accountEmail, setAccountEmail] = useState(currentUser?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

  // Load data
  const loadData = async () => {
    const [
      membersData,
      eventsData,
      galleryData,
      leaveData,
      dashboardData,
      expensesData,
      unreadCount,
    ] = await Promise.all([
      getAllMembers(),
      getAllEvents(),
      getAllGalleryItems(),
      getAllLeaveRequests(),
      getDashboardStats(),
      getAllExpenses(),
      getUnreadContactCount(),
    ]);
    setMembers(membersData);
    setEvents(eventsData);
    setGallery(galleryData);
    setLeaveRequests(leaveData);
    setDashboardStats(dashboardData);
    setUnreadMessages(unreadCount);

    const [allOrders, contributions, donations] = await Promise.all([
      getAllOrders(),
      getAllContributions(),
      getAllDonations(),
    ]);
    setOrders(allOrders);
    setPromoCodes(await getAllPromoCodes());
    setAlbums(await getAllAlbums());
    setMusicVideos(await getAllMusicVideos());
    setStreamingPlatforms(await getAllPlatforms());
    setAttendanceSessions(await getRecentSessions(20));

    const confirmedOrders = allOrders.filter(o => o.status === "confirmed");

    const contributionTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
    const donationTotal = donations.reduce((sum, d) => sum + d.amount, 0);
    const expenseTotal = expensesData.reduce((sum, e) => sum + e.amount, 0);
    const ticketRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalIncome = contributionTotal + donationTotal + ticketRevenue;

    setFinancialTotals({
      contributions: contributionTotal,
      donations: donationTotal,
      expenses: expenseTotal,
      ticketRevenue,
      totalIncome,
      balance: totalIncome - expenseTotal,
    });

    const [stats, orderStatsData, attendanceStatsData] = await Promise.all([
      getBackupStats(),
      getOrderStats(),
      getOverallAttendanceStats(),
    ]);
    setBackupStats(stats);
    setOrderStats(orderStatsData);
    setOverallAttendanceStats(attendanceStatsData);
  };

  // Load settings on mount
  useEffect(() => {
    getSettings().then(setSettingsState);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Filtered data
  const filteredOrders = orders
    .filter((order) => orderFilter === "all" || order.status === orderFilter)
    .filter(
      (order) =>
        order.txRef.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(orderSearch.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Chart filters
  const [chartTimePeriod, setChartTimePeriod] = useState<"7d" | "30d" | "90d" | "year" | "all">("30d");
  const [chartEventFilter, setChartEventFilter] = useState<string>("all");
  const [attendanceTimePeriod, setAttendanceTimePeriod] = useState<"10" | "30" | "year" | "all">("10");

  // Chart colors
  const CHART_COLORS = ["#D4AF37", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  // Time period filter helper
  const getTimeCutoff = (period: string): number => {
    const now = Date.now();
    switch (period) {
      case "7d": return now - 7 * 24 * 60 * 60 * 1000;
      case "30d": return now - 30 * 24 * 60 * 60 * 1000;
      case "90d": return now - 90 * 24 * 60 * 60 * 1000;
      case "year": return now - 365 * 24 * 60 * 60 * 1000;
      default: return 0; // all time
    }
  };

  // Filtered confirmed orders based on time and event
  const getFilteredOrders = () => {
    const cutoff = getTimeCutoff(chartTimePeriod);
    return orders
      .filter(o => o.status === "confirmed" || o.status === "used")
      .filter(o => new Date(o.createdAt).getTime() > cutoff)
      .filter(o => chartEventFilter === "all" || o.eventId === chartEventFilter);
  };

  const confirmedOrders = orders.filter(o => o.status === "confirmed" || o.status === "used");
  
  // Get unique events from orders for filter dropdown
  const orderEvents = [...new Map(confirmedOrders.map(o => [o.eventId, { id: o.eventId, title: o.eventTitle }])).values()];
  
  const getRevenueByDay = () => {
    const filtered = getFilteredOrders();
    const byDay: Record<string, number> = {};
    
    // Group by appropriate time unit based on period
    filtered.forEach(order => {
      let key: string;
      const date = new Date(order.createdAt);
      
      if (chartTimePeriod === "year" || chartTimePeriod === "all") {
        // Group by month for longer periods
        key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      } else {
        // Group by day for shorter periods
        key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      byDay[key] = (byDay[key] || 0) + order.total;
    });
    
    return Object.entries(byDay).map(([date, revenue]) => ({ date, revenue }));
  };

  const getTicketsByTier = () => {
    const filtered = getFilteredOrders();
    const byTier: Record<string, number> = {};
    filtered.forEach(order => {
      order.tickets.forEach(ticket => {
        byTier[ticket.tierName] = (byTier[ticket.tierName] || 0) + ticket.quantity;
      });
    });
    return Object.entries(byTier).map(([name, value]) => ({ name, value }));
  };

  const getTicketsByEvent = () => {
    const cutoff = getTimeCutoff(chartTimePeriod);
    const filtered = orders
      .filter(o => o.status === "confirmed" || o.status === "used")
      .filter(o => new Date(o.createdAt).getTime() > cutoff);
    
    const byEvent: Record<string, number> = {};
    filtered.forEach(order => {
      byEvent[order.eventTitle] = (byEvent[order.eventTitle] || 0) + order.tickets.reduce((sum, t) => sum + t.quantity, 0);
    });
    return Object.entries(byEvent).map(([name, value]) => ({ name, value })).slice(0, 6);
  };

  const getRevenueByEvent = () => {
    const cutoff = getTimeCutoff(chartTimePeriod);
    const filtered = orders
      .filter(o => o.status === "confirmed" || o.status === "used")
      .filter(o => new Date(o.createdAt).getTime() > cutoff);
    
    const byEvent: Record<string, number> = {};
    filtered.forEach(order => {
      byEvent[order.eventTitle] = (byEvent[order.eventTitle] || 0) + order.total;
    });
    return Object.entries(byEvent).map(([name, value]) => ({ name, value })).slice(0, 6);
  };

  const getMembersByVoice = () => {
    const byVoice: Record<string, number> = {};
    members.forEach(m => {
      const voice = m.voice || "Unknown";
      byVoice[voice] = (byVoice[voice] || 0) + 1;
    });
    return Object.entries(byVoice).map(([name, value]) => ({ name, value }));
  };

  const getAttendanceRate = () => {
    let sessionsToShow = attendanceSessions;
    
    if (attendanceTimePeriod === "10") {
      sessionsToShow = attendanceSessions.slice(-10);
    } else if (attendanceTimePeriod === "30") {
      sessionsToShow = attendanceSessions.slice(-30);
    } else if (attendanceTimePeriod === "year") {
      const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      sessionsToShow = attendanceSessions.filter(s => new Date(s.date).getTime() > yearAgo);
    }
    
    return sessionsToShow.map(session => {
      const total = session.totalPresent + session.totalAbsent + session.totalExcused + session.totalLate;
      const rate = total > 0 ? (session.totalPresent / total) * 100 : 0;
      return {
        date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rate: Math.round(rate),
        present: session.totalPresent,
        absent: session.totalAbsent,
      };
    });
  };

  // Calculate filtered stats for display
  const filteredOrderStats = () => {
    const filtered = getFilteredOrders();
    return {
      count: filtered.length,
      revenue: filtered.reduce((sum, o) => sum + o.total, 0),
      tickets: filtered.reduce((sum, o) => sum + o.tickets.reduce((s, t) => s + t.quantity, 0), 0),
    };
  };

  // Order actions
  const handleConfirmOrder = async (orderId: string) => {
    // Use confirmOrder which also reduces ticket availability
    const updated = await confirmOrder(orderId);
    if (updated) {
      // Dispatch event to update Events page
      window.dispatchEvent(new Event("eventsUpdated"));
      loadData();
      toast({ title: "Order Confirmed", description: `Order ${updated.txRef} has been confirmed.` });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const updated = await updateOrderStatus(orderId, "cancelled");
    if (updated) {
      loadData();
      toast({ title: "Order Cancelled", description: `Order ${updated.txRef} has been cancelled.` });
    }
  };

  const handleMarkUsed = async (orderId: string) => {
    const updated = await updateOrderStatus(orderId, "used");
    if (updated) {
      loadData();
      toast({ title: "Ticket Used", description: `Order ${updated.txRef} marked as used.` });
    }
  };


  // Send portal invite to a member
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  
  const handleSendInvite = async (member: Member) => {
    setSendingInviteId(member.id);
    try {
      const result = await sendMemberInvite(member);
      if (result.success) {
        toast({ title: "Invite Sent", description: result.message });
        if (currentUser) {
          addAuditLog(currentUser, "SEND_MEMBER_INVITE", `Sent portal invite to: ${member.name} (${member.email})`);
        }
      } else {
        toast({ title: "Invite Failed", description: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send invite", variant: "destructive" });
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleBulkSendInvites = async () => {
    const selectedMembersList = members.filter(m => selectedMembers.includes(m.id) && m.email);
    if (selectedMembersList.length === 0) {
      toast({ title: "No Members Selected", description: "Select members with email addresses to send invites.", variant: "destructive" });
      return;
    }
    
    if (!confirm(`Send portal invite to ${selectedMembersList.length} member(s)?`)) return;
    
    setSendingInviteId("bulk");
    try {
      const result = await sendBulkInvites(selectedMembersList);
      toast({ 
        title: "Invites Sent", 
        description: `${result.sent} sent, ${result.failed} failed out of ${result.total} members.` 
      });
      if (currentUser) {
        addAuditLog(currentUser, "BULK_SEND_INVITES", `Sent ${result.sent} portal invites (${result.failed} failed)`);
      }
      setSelectedMembers([]);
    } catch {
      toast({ title: "Error", description: "Failed to send invites", variant: "destructive" });
    } finally {
      setSendingInviteId(null);
    }
  };

  // Delete actions
  const handleDeleteMember = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the choir?`)) {
      await deleteMember(id);
      if (currentUser) {
        addAuditLog(currentUser, "DELETE_MEMBER", `Deleted member: ${name}`);
      }
      await loadData();
      toast({ title: "Member Removed", description: `${name} has been removed.` });
    }
  };

  // Bulk member actions
  const toggleMemberSelection = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleAllMembers = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };

  const handleBulkStatusUpdate = async (status: Member["status"]) => {
    if (selectedMembers.length === 0) return;
    if (!confirm(`Update ${selectedMembers.length} member(s) to ${status}?`)) return;
    
    await Promise.all(selectedMembers.map(id => updateMember(id, { status })));
    
    await loadData();
    setSelectedMembers([]);
    toast({ 
      title: "Members Updated", 
      description: `${selectedMembers.length} member(s) updated to ${status}.` 
    });
  };

  const handleBulkDelete = async () => {
    if (selectedMembers.length === 0) return;
    if (!confirm(`Delete ${selectedMembers.length} member(s)? This cannot be undone.`)) return;
    
    await Promise.all(selectedMembers.map(id => deleteMember(id)));
    
    await loadData();
    setSelectedMembers([]);
    toast({ 
      title: "Members Deleted", 
      description: `${selectedMembers.length} member(s) have been removed.` 
    });
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteEvent(id);
      if (currentUser) {
        addAuditLog(currentUser, "DELETE_EVENT", `Deleted event: ${title}`);
      }
      await loadData();
      toast({ title: "Event Deleted", description: `"${title}" has been deleted.` });
    }
  };

  const handleDeleteGalleryItem = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteGalleryItem(id);
      if (currentUser) {
        addAuditLog(currentUser, "DELETE_GALLERY", `Deleted gallery item: ${title}`);
      }
      await loadData();
      toast({ title: "Media Deleted", description: `"${title}" has been removed.` });
    }
  };

  const handleDeleteAlbum = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete album "${title}"?`)) {
      await deleteAlbum(id);
      await loadData();
      toast({ title: "Album Deleted", description: `"${title}" has been removed.` });
    }
  };

  const handleDeleteMusicVideo = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteMusicVideo(id);
      await loadData();
      toast({ title: "Video Deleted", description: `"${title}" has been removed.` });
    }
  };

  // Settings save
  const handleSaveSettings = async () => {
    if (!settings) return;
    await updateSettings(settings);
    if (currentUser) {
      addAuditLog(currentUser, "UPDATE_SETTINGS", "Updated system settings");
    }
    toast({ title: "Settings Saved", description: "Your changes have been saved." });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gold-gradient mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Music2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Preview Mode Banner - Fixed at top */}
      {previewRole && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-900 px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">
              Preview Mode: Viewing as <strong>{getRoleLabel(previewRole as any)}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewRole(null)}
            className="text-yellow-900 hover:text-yellow-800 hover:bg-yellow-400/50"
          >
            <X className="w-4 h-4 mr-1" />
            Exit Preview
          </Button>
        </div>
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-charcoal border-r border-primary/10 transform transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-primary/10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                <Music2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold gold-text">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">
                  {previewRole ? (
                    <span className="text-yellow-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {getRoleLabel(previewRole as any)} View
                    </span>
                  ) : (
                    "Serenades of Praise"
                  )}
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon;
              if (!Icon) return null; // Safety check
              return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {/* Unread messages badge */}
                {item.id === "messages" && unreadMessages > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
                    {unreadMessages}
                  </span>
                )}
                {item.superAdminOnly && (
                  <Shield className="w-3 h-3 ml-auto text-primary" />
                )}
              </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-primary/10 space-y-2">
            {/* Current User Info */}
            <div className="p-3 rounded-lg bg-secondary/50 mb-3">
              <p className="text-sm font-medium text-foreground truncate">
                {currentUser?.name || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser?.email}
              </p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                currentUser?.role === "super_admin" 
                  ? "bg-primary/20 text-primary" 
                  : "bg-secondary text-muted-foreground"
              }`}>
                {getRoleLabel(currentUser?.role || "reviewer")}
              </span>
            </div>
            
            <Link to="/">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                View Website
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-h-screen", previewRole && "pt-10")}>
        {/* Header */}
        <header className="h-16 border-b border-primary/10 flex items-center justify-between px-4 lg:px-8">
          <button className="lg:hidden p-2 text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-display text-xl font-semibold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-sm text-foreground font-medium block">
                {currentUser?.name || "Admin"}
              </span>
              <span className="text-xs text-muted-foreground">
                {getRoleLabel(currentUser?.role || "reviewer")}
              </span>
            </div>
            <div className="relative group">
              <button className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                {currentUser?.name?.charAt(0).toUpperCase() || "A"}
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-charcoal border border-primary/20 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 border-b border-primary/10">
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser?.email}
                  </p>
                </div>
                <Link 
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Website
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {/* Birthday Alert */}
          <BirthdayAlert 
            currentUserEmail={currentUser?.email} 
            currentUserName={currentUser?.name}
          />
          
          <Suspense fallback={<PageSkeleton />}>
          <div className="p-4 lg:p-8">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Role Welcome Banner with Preview Switcher */}
              <div className="card-glass rounded-2xl p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      Welcome back, {currentUser?.name?.split(" ")[0]}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-2 px-2 py-0.5 bg-primary/20 rounded-full text-xs font-medium text-primary">
                        {effectiveUser && getRoleLabel(effectiveUser.role)}
                      </span>
                      {previewRole && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded-full text-xs font-medium text-yellow-500">
                          <Eye className="w-3 h-3" />
                          Preview Mode
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Role Preview Switcher - Super Admin Only */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">View as:</span>
                      <select
                        value={previewRole || ""}
                        onChange={(e) => setPreviewRole(e.target.value || null)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-secondary border border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">My Role (Administrator)</option>
                        <option value="main_admin">Main Admin</option>
                        <option value="finance">Finance</option>
                        <option value="secretary">Secretary</option>
                        <option value="disciplinary">Disciplinary</option>
                        <option value="reviewer">Reviewer</option>
                      </select>
                      {previewRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewRole(null)}
                          className="text-yellow-500 hover:text-yellow-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Executive Dashboard for Super Admin and Main Admin */}
              {(effectiveUser?.role === "super_admin" || effectiveUser?.role === "main_admin") && (
                <ExecutiveDashboard onNavigate={setActiveTab} />
              )}

              {/* Finance Dashboard */}
              {effectiveUser?.role === "finance" && (
                <>
                  {/* Finance Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <PiggyBank className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(financialTotals.contributions)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Contributions</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(financialTotals.donations)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Donations</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Ticket className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(financialTotals.ticketRevenue)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Tickets</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        </div>
                        <p className="text-2xl font-bold text-red-400">{formatCurrency(financialTotals.expenses)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(financialTotals.totalIncome)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Total Income</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-primary" />
                        </div>
                        <p className={cn("text-2xl font-bold", financialTotals.balance >= 0 ? "text-green-400" : "text-red-400")}>
                          {formatCurrency(financialTotals.balance)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                      <Button variant="gold" onClick={() => setActiveTab("treasury")}>
                        <PiggyBank className="w-4 h-4 mr-2" />
                        View Treasury
                      </Button>
                      <Button variant="gold-outline" onClick={() => setActiveTab("contributions")}>
                        <Wallet className="w-4 h-4 mr-2" />
                        Manage Contributions
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("expenses")}>
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Record Expense
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Secretary Dashboard */}
              {effectiveUser?.role === "secretary" && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{dashboardStats.totalMembers}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{dashboardStats.upcomingEvents}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Upcoming Events</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{attendanceSessions.length}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Image className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{gallery.length}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Gallery Items</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <CalendarOff className="w-4 h-4 text-yellow-400" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-400">{leaveRequests.filter(l => l.status === "pending").length}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Pending Leave</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className={cn("text-2xl font-bold", unreadMessages > 0 ? "text-blue-400" : "text-foreground")}>{unreadMessages}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Unread Messages</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                      <Button variant="gold" onClick={() => setShowAddEvent(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                      <Button variant="gold-outline" onClick={() => { setEditingMember(null); setShowAddMember(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("attendance")}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Take Attendance
                      </Button>
                      {leaveRequests.filter(l => l.status === "pending").length > 0 && (
                        <Button variant="outline" onClick={() => setActiveTab("leave")}>
                          <CalendarOff className="w-4 h-4 mr-2" />
                          Review Leave ({leaveRequests.filter(l => l.status === "pending").length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Events Table */}
                  {events.length > 0 && (
                    <div>
                      <h2 className="font-display text-lg font-semibold mb-4">Upcoming Events</h2>
                      <div className="card-glass rounded-2xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-secondary/50">
                            <tr>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Event</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Location</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {events.slice(0, 5).map((event) => (
                              <tr key={event.id} className="border-t border-primary/10">
                                <td className="p-4 font-medium text-foreground">{event.title}</td>
                                <td className="p-4 text-muted-foreground hidden md:table-cell">
                                  {new Date(event.date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-muted-foreground hidden md:table-cell">{event.location}</td>
                                <td className="p-4">
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-semibold",
                                    event.isFree ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
                                  )}>
                                    {event.isFree ? "Free" : "Paid"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Disciplinary Dashboard */}
              {effectiveUser?.role === "disciplinary" && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <CalendarOff className="w-4 h-4 text-yellow-400" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-400">{leaveRequests.filter(l => l.status === "pending").length}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Pending Leave Requests</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-green-400">{leaveRequests.filter(l => l.status === "approved").length}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Approved This Month</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{dashboardStats.totalMembers}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Total Members</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                      <Button variant="gold" onClick={() => setActiveTab("leave")}>
                        <CalendarOff className="w-4 h-4 mr-2" />
                        Review Leave Requests ({leaveRequests.filter(l => l.status === "pending").length})
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("members")}>
                        <Users className="w-4 h-4 mr-2" />
                        View Members
                      </Button>
                    </div>
                  </div>

                  {/* Pending Leave Requests */}
                  {leaveRequests.filter(l => l.status === "pending").length > 0 && (
                    <div>
                      <h2 className="font-display text-lg font-semibold mb-4">Pending Leave Requests</h2>
                      <div className="card-glass rounded-2xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-secondary/50">
                            <tr>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Member</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaveRequests.filter(l => l.status === "pending").slice(0, 5).map((request) => (
                              <tr key={request.id} className="border-t border-primary/10">
                                <td className="p-4 font-medium text-foreground">{request.memberName}</td>
                                <td className="p-4 text-muted-foreground hidden md:table-cell">
                                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-muted-foreground truncate max-w-[200px]">{request.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Members */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">All Members ({members.length})</h2>
                  {!canEditMembers(effectiveUser) && (
                    <p className="text-xs text-muted-foreground mt-1">View only mode</p>
                  )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                    />
                  </div>
                  {canEditMembers(effectiveUser) && (
                    <Button variant="gold" onClick={() => { setEditingMember(null); setShowAddMember(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  )}
                </div>
              </div>

              {/* Voice Part Distribution */}
              {members.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-glass rounded-xl p-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">Voice Distribution</h3>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getMembersByVoice()}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {getMembersByVoice().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card-glass rounded-xl p-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getMembersByVoice().map((voice, i) => (
                        <div key={voice.name} className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-lg font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                            {voice.value}
                          </p>
                          <p className="text-xs text-muted-foreground">{voice.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bulk Actions Bar */}
              {selectedMembers.length > 0 && canEditMembers(effectiveUser) && (
                <div className="card-glass rounded-xl p-3 flex items-center justify-between gap-4 mb-4">
                  <p className="text-sm font-medium">
                    <span className="text-primary">{selectedMembers.length}</span> member(s) selected
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("Active")}>
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      Set Active
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("Inactive")}>
                      <XCircle className="w-4 h-4 mr-1 text-red-500" />
                      Set Inactive
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("Pending")}>
                      <Clock className="w-4 h-4 mr-1 text-yellow-500" />
                      Set Pending
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleBulkSendInvites}
                      disabled={sendingInviteId === "bulk"}
                    >
                      {sendingInviteId === "bulk" ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1 text-primary" />
                      )}
                      Send Invites
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedMembers([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              <div className="card-glass rounded-2xl overflow-hidden">
                {filteredMembers.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        {canEditMembers(effectiveUser) && (
                          <th className="w-12 p-4">
                            <input
                              type="checkbox"
                              checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                              onChange={toggleAllMembers}
                              className="rounded border-primary/30"
                            />
                          </th>
                        )}
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Voice</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className={cn(
                          "border-t border-primary/10",
                          selectedMembers.includes(member.id) && "bg-primary/5"
                        )}>
                          {canEditMembers(effectiveUser) && (
                            <td className="w-12 p-4">
                              <input
                                type="checkbox"
                                checked={selectedMembers.includes(member.id)}
                                onChange={() => toggleMemberSelection(member.id)}
                                className="rounded border-primary/30"
                              />
                            </td>
                          )}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {member.photo ? (
                                <img src={member.photo} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">{member.name.charAt(0)}</span>
                                </div>
                              )}
                              <span className="font-medium text-foreground">{member.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground hidden md:table-cell">{member.email}</td>
                          <td className="p-4 text-muted-foreground">{member.voice}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-semibold",
                              member.status === "Active" ? "bg-green-500/20 text-green-400" : 
                              member.status === "Pending" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            )}>
                              {member.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Send Portal Invite"
                              onClick={() => handleSendInvite(member)}
                              disabled={sendingInviteId === member.id || !member.email}
                            >
                              {sendingInviteId === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 text-primary" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingMember(member); setShowAddMember(true); }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {canEditMembers(effectiveUser) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMember(member.id, member.name)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>{memberSearch ? "No members match your search." : "No members yet. Add your first member!"}</p>
                    {!memberSearch && (
                      <Button variant="gold" className="mt-4" onClick={() => setShowAddMember(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Manage Events ({events.length})</h2>
                <Button variant="gold" onClick={() => { setEditingEvent(null); setShowAddEvent(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
              
              <div className="card-glass rounded-2xl overflow-hidden">
                {events.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Event</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Location</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tickets</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => {
                        const totalTickets = event.tickets.reduce((sum, t) => sum + t.available, 0);
                        const soldTickets = event.tickets.reduce((sum, t) => sum + (t.sold || 0), 0);
                        const remainingTickets = totalTickets - soldTickets;
                        
                        return (
                          <tr key={event.id} className="border-t border-primary/10">
                            <td className="p-4 font-medium text-foreground">{event.title}</td>
                            <td className="p-4 text-muted-foreground">{new Date(event.date).toLocaleDateString()}</td>
                            <td className="p-4 text-muted-foreground hidden md:table-cell">{event.location}</td>
                            <td className="p-4">
                              {event.isFree ? (
                                <span className="text-muted-foreground">-</span>
                              ) : (
                                <div className="text-sm">
                                  <span className="font-medium text-foreground">{soldTickets}</span>
                                  <span className="text-muted-foreground">/{totalTickets}</span>
                                  {remainingTickets === 0 && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                      Sold Out
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-semibold",
                                event.isFree ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
                              )}>
                                {event.isFree ? "Free" : `${event.tickets.length} tiers`}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSummaryEvent(event); setShowEventSummary(true); }}
                                title="View Summary"
                              >
                                <BarChart3 className="w-4 h-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingEvent(event); setShowAddEvent(true); }}
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No events yet. Create your first event!</p>
                    <Button variant="gold" className="mt-4" onClick={() => setShowAddEvent(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ticket Orders */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{orderStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{orderStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{orderStats.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{orderStats.used}</p>
                  <p className="text-xs text-muted-foreground">Used</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold gold-text">{formatCurrency(orderStats.revenue)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>

              {/* Pending Order Cleanup */}
              {orderStats.pending > 0 && (
                <div className="card-glass rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        Pending Orders Cleanup
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {orderStats.pending} pending order(s) found. These are orders where payment was not completed.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const count = await cleanupOldPendingOrders(24);
                          if (count > 0) {
                            toast({
                              title: "Cleanup Complete",
                              description: `${count} pending order(s) older than 24 hours marked as cancelled.`,
                            });
                            loadData();
                          } else {
                            toast({
                              title: "No orders to clean",
                              description: "All pending orders are less than 24 hours old.",
                            });
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Cancel Old (24h+)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={async () => {
                          if (confirm("This will permanently delete all pending orders older than 24 hours. This cannot be undone. Continue?")) {
                            const count = await deletePendingOrders(24);
                            if (count > 0) {
                              toast({
                                title: "Deleted",
                                description: `${count} pending order(s) permanently deleted.`,
                              });
                              loadData();
                            } else {
                              toast({
                                title: "No orders to delete",
                                description: "All pending orders are less than 24 hours old.",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Old (24h+)
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Charts */}
              {confirmedOrders.length > 0 && (
                <div className="space-y-4">
                  {/* Chart Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">Period:</span>
                    <div className="flex gap-1">
                      {[
                        { value: "7d", label: "7 Days" },
                        { value: "30d", label: "30 Days" },
                        { value: "90d", label: "90 Days" },
                        { value: "year", label: "This Year" },
                        { value: "all", label: "All Time" },
                      ].map((period) => (
                        <button
                          key={period.value}
                          onClick={() => setChartTimePeriod(period.value as any)}
                          className={cn(
                            "px-3 py-1 text-xs rounded-lg transition-colors",
                            chartTimePeriod === period.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                    
                    {orderEvents.length > 1 && (
                      <>
                        <span className="text-sm text-muted-foreground ml-4">Event:</span>
                        <select
                          value={chartEventFilter}
                          onChange={(e) => setChartEventFilter(e.target.value)}
                          className="px-3 py-1 text-xs rounded-lg bg-secondary border border-primary/20 text-foreground"
                        >
                          <option value="all">All Events</option>
                          {orderEvents.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.title}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>

                  {/* Filtered Stats Summary */}
                  <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">
                      Showing: <strong className="text-foreground">{filteredOrderStats().count}</strong> orders
                    </span>
                    <span className="text-muted-foreground">
                      Revenue: <strong className="gold-text">{formatCurrency(filteredOrderStats().revenue)}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Tickets: <strong className="text-foreground">{filteredOrderStats().tickets}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue Over Time */}
                    <div className="card-glass rounded-xl p-4">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3">Revenue Over Time</h3>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={getRevenueByDay()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                border: "1px solid hsl(var(--primary) / 0.2)",
                                borderRadius: "8px",
                              }}
                              formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Tickets by Tier (for selected event or all) */}
                    <div className="card-glass rounded-xl p-4">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                        Tickets by Tier {chartEventFilter !== "all" && "(Selected Event)"}
                      </h3>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getTicketsByTier()}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={65}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {getTicketsByTier().map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Revenue by Event (show when "all" events selected and has data) */}
                    {chartEventFilter === "all" && getRevenueByEvent().length > 0 && (
                      <div className="card-glass rounded-xl p-4">
                        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Revenue by Event</h3>
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getRevenueByEvent()} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={9} width={100} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: "hsl(var(--card))", 
                                  border: "1px solid hsl(var(--primary) / 0.2)",
                                  borderRadius: "8px",
                                }}
                                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                              />
                              <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Tickets by Event (show when "all" events selected and has data) */}
                    {chartEventFilter === "all" && getTicketsByEvent().length > 0 && (
                      <div className="card-glass rounded-xl p-4">
                        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Tickets by Event</h3>
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getTicketsByEvent()} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={9} width={100} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "confirmed", "used"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setOrderFilter(filter)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize",
                        orderFilter === filter
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => exportOrdersToCSV(filteredOrders)}
                    title="Export to CSV"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="icon" onClick={loadData} title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="card-glass rounded-2xl overflow-hidden">
                {filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Customer</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Event</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tickets</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-t border-primary/10">
                            <td className="p-4">
                              <p className="font-mono text-sm text-foreground">{order.txRef}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <p className="text-foreground">{order.customer.name}</p>
                              <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                            </td>
                            <td className="p-4 hidden lg:table-cell">
                              <p className="text-foreground truncate max-w-[150px]">{order.eventTitle}</p>
                            </td>
                            <td className="p-4">
                              {order.tickets.map((t, i) => (
                                <span key={i} className="text-sm text-muted-foreground">
                                  {t.quantity}x {t.tierName}
                                  {i < order.tickets.length - 1 && ", "}
                                </span>
                              ))}
                            </td>
                            <td className="p-4 font-semibold gold-text">{formatCurrency(order.total)}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                                order.status === "confirmed" && "bg-green-500/20 text-green-400",
                                order.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                                order.status === "used" && "bg-blue-500/20 text-blue-400",
                                order.status === "cancelled" && "bg-red-500/20 text-red-400"
                              )}>
                                {order.status === "confirmed" && <CheckCircle className="w-3 h-3" />}
                                {order.status === "pending" && <Clock className="w-3 h-3" />}
                                {order.status === "used" && <Ticket className="w-3 h-3" />}
                                {order.status === "cancelled" && <XCircle className="w-3 h-3" />}
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                                onClick={() => setViewingOrder(order)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {order.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400 hover:text-green-300"
                                    onClick={() => handleConfirmOrder(order.id)}
                                    title="Confirm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleCancelOrder(order.id)}
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {order.status === "confirmed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-400 hover:text-blue-300"
                                  onClick={() => handleMarkUsed(order.id)}
                                  title="Mark as Used"
                                >
                                  <Ticket className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No Orders Found</h3>
                    <p className="text-sm text-muted-foreground">
                      {orderSearch
                        ? "No orders match your search criteria."
                        : "Ticket orders will appear here when customers make purchases."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{attendanceSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{overallAttendanceStats.avgAttendance}%</p>
                  <p className="text-xs text-muted-foreground">Avg. Attendance</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{members.length}</p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {leaveRequests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Leave</p>
                </div>
              </div>

              {/* Attendance Rate Chart */}
              {attendanceSessions.length > 0 && (
                <div className="card-glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Attendance Rate Trend</h3>
                    <div className="flex gap-1">
                      {[
                        { value: "10", label: "Last 10" },
                        { value: "30", label: "Last 30" },
                        { value: "year", label: "This Year" },
                        { value: "all", label: "All" },
                      ].map((period) => (
                        <button
                          key={period.value}
                          onClick={() => setAttendanceTimePeriod(period.value as any)}
                          className={cn(
                            "px-2 py-1 text-xs rounded-md transition-colors",
                            attendanceTimePeriod === period.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getAttendanceRate()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--primary) / 0.2)",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === "rate") return [`${value}%`, "Attendance Rate"];
                            return [value, name === "present" ? "Present" : "Absent"];
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="rate" stroke="#D4AF37" strokeWidth={2} dot={{ fill: "#D4AF37", r: 3 }} name="Rate %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing {getAttendanceRate().length} sessions • Avg: {
                      getAttendanceRate().length > 0 
                        ? Math.round(getAttendanceRate().reduce((sum, s) => sum + s.rate, 0) / getAttendanceRate().length)
                        : 0
                    }%
                  </p>
                </div>
              )}

              {/* Take Attendance Section */}
              <div className="card-glass rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Take Attendance</h2>
                    <p className="text-sm text-muted-foreground">
                      Mark attendance for choir members
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => {
                        setAttendanceDate(e.target.value);
                        setIsTakingAttendance(false);
                        setAttendanceRecords({});
                      }}
                      className="w-40 bg-secondary border-primary/20"
                    />
                    <Input
                      type="text"
                      placeholder="Session title"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      className="w-48 bg-secondary border-primary/20"
                    />
                    {!isTakingAttendance ? (
                      <Button
                        variant="gold"
                        onClick={async () => {
                          if (members.length === 0) {
                            toast({
                              title: "No Members",
                              description: "Add members first before taking attendance.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Pre-fill with existing attendance if any
                          const existing = await getAttendanceByDate(attendanceDate);
                          const existingMap: { [key: string]: AttendanceStatus } = {};
                          existing.forEach(r => {
                            existingMap[r.memberId] = r.status;
                          });
                          
                          // Also check for members on leave
                          const onLeave = await getMembersToExcuse(attendanceDate);
                          setMembersOnLeave(onLeave);
                          onLeave.forEach(l => {
                            if (!existingMap[l.memberId]) {
                              existingMap[l.memberId] = 'excused';
                            }
                          });
                          
                          setAttendanceRecords(existingMap);
                          setIsTakingAttendance(true);
                        }}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        {attendanceSessions.some(s => s.date === attendanceDate) ? 'Edit Attendance' : 'Start Attendance'}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="gold"
                        onClick={async () => {
                          const records = members.map(m => ({
                            memberId: m.id,
                            memberName: m.name,
                            memberEmail: m.email,
                            memberVoice: m.voice,
                            status: attendanceRecords[m.id] || 'absent' as AttendanceStatus,
                          }));
                            
                            await saveAttendance(attendanceDate, records, sessionTitle, 'Admin');
                            loadData();
                            setIsTakingAttendance(false);
                            toast({
                              title: "Attendance Saved! ✅",
                              description: `Attendance for ${new Date(attendanceDate).toLocaleDateString()} has been recorded.`,
                            });
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Attendance
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsTakingAttendance(false);
                            setAttendanceRecords({});
                            setMembersOnLeave([]);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance Form */}
                {isTakingAttendance && (
                  <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-primary/10">
                      <span className="text-sm text-muted-foreground mr-2">Mark all as:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const all: { [key: string]: AttendanceStatus } = {};
                          members.forEach(m => { all[m.id] = 'present'; });
                          setAttendanceRecords(all);
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                        Present
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const all: { [key: string]: AttendanceStatus } = {};
                          members.forEach(m => { all[m.id] = 'absent'; });
                          setAttendanceRecords(all);
                        }}
                      >
                        <XCircle className="w-3 h-3 mr-1 text-red-500" />
                        Absent
                      </Button>
                    </div>

                    {/* Members List */}
                    <div className="grid gap-2">
                      {members.map((member) => {
                        const onLeave = membersOnLeave.find(l => l.memberId === member.id);
                        
                        return (
                          <div
                            key={member.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all",
                              attendanceRecords[member.id] === 'present' && "bg-green-500/10 border-green-500/30",
                              attendanceRecords[member.id] === 'absent' && "bg-red-500/10 border-red-500/30",
                              attendanceRecords[member.id] === 'excused' && "bg-yellow-500/10 border-yellow-500/30",
                              attendanceRecords[member.id] === 'late' && "bg-orange-500/10 border-orange-500/30",
                              !attendanceRecords[member.id] && "bg-secondary/30 border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.voice}</p>
                                {onLeave && (
                                  <p className="text-xs text-yellow-400">⚠️ Has approved leave</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              {(['present', 'late', 'excused', 'absent'] as AttendanceStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => setAttendanceRecords(prev => ({
                                    ...prev,
                                    [member.id]: status,
                                  }))}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                                    attendanceRecords[member.id] === status
                                      ? status === 'present' ? "bg-green-500 text-white"
                                        : status === 'absent' ? "bg-red-500 text-white"
                                        : status === 'excused' ? "bg-yellow-500 text-white"
                                        : "bg-orange-500 text-white"
                                      : "bg-secondary text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {members.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No members found. Add members first.</p>
                      </div>
                    )}
                  </div>
                )}

                {!isTakingAttendance && attendanceSessions.some(s => s.date === attendanceDate) && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground">
                      ✅ Attendance already recorded for {new Date(attendanceDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "Edit Attendance" to modify the records.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Sessions */}
              <div className="card-glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-primary/10">
                  <h2 className="font-display text-lg font-semibold">Attendance History</h2>
                </div>
                
                {attendanceSessions.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Session</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Present</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Absent</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Excused</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceSessions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((session) => (
                        <tr key={session.id} className="border-t border-primary/10">
                          <td className="p-4 font-medium text-foreground">
                            {new Date(session.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-muted-foreground">{session.title}</td>
                          <td className="p-4">
                            <span className="text-green-400">{session.totalPresent + session.totalLate}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-red-400">{session.totalAbsent}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-yellow-400">{session.totalExcused}</span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                setAttendanceDate(session.date);
                                setSessionTitle(session.title);
                                const existing = await getAttendanceByDate(session.date);
                                const existingMap: { [key: string]: AttendanceStatus } = {};
                                existing.forEach(r => { existingMap[r.memberId] = r.status; });
                                const onLeave = await getMembersToExcuse(session.date);
                                setMembersOnLeave(onLeave);
                                onLeave.forEach(l => {
                                  if (!existingMap[l.memberId]) existingMap[l.memberId] = 'excused';
                                });
                                setAttendanceRecords(existingMap);
                                setIsTakingAttendance(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`Delete attendance for ${new Date(session.date).toLocaleDateString()}?`)) {
                                  await deleteAttendanceForDate(session.date);
                                  loadData();
                                  toast({ title: "Attendance Deleted" });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No Attendance Records</h3>
                    <p className="text-sm text-muted-foreground">
                      Start taking attendance to see history here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leave Requests */}
          {activeTab === "leave" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{leaveRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {leaveRequests.filter(r => r.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">New (0/{REQUIRED_APPROVALS})</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-orange-400">
                    {leaveRequests.filter(r => r.status === "partial").length}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {leaveRequests.filter(r => r.status === "approved").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {leaveRequests.filter(r => r.status === "denied").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Denied</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "partial", "approved", "denied"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLeaveFilter(filter as any)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                        leaveFilter === filter
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter === "partial" ? "In Progress" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Link to="/member-portal" target="_blank">
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Member Portal
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon" onClick={loadData} title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Leave Requests Table */}
              <div className="card-glass rounded-2xl overflow-hidden">
                {leaveRequests.filter(r => leaveFilter === "all" || r.status === leaveFilter).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Member</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Dates</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Reason</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests
                          .filter(r => leaveFilter === "all" || r.status === leaveFilter)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((request) => (
                          <tr key={request.id} className="border-t border-primary/10">
                            <td className="p-4">
                              <p className="font-medium text-foreground">{request.memberName}</p>
                              <p className="text-xs text-muted-foreground">{request.memberEmail}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-foreground">
                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                              </p>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <p className="text-muted-foreground text-sm max-w-[200px] truncate">{request.reason}</p>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 w-fit",
                                  request.status === "approved" && "bg-green-500/20 text-green-400",
                                  request.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                                  request.status === "partial" && "bg-orange-500/20 text-orange-400",
                                  request.status === "denied" && "bg-red-500/20 text-red-400"
                                )}>
                                  {request.status === "approved" && <CheckCircle className="w-3 h-3" />}
                                  {request.status === "pending" && <Clock className="w-3 h-3" />}
                                  {request.status === "partial" && <Clock className="w-3 h-3" />}
                                  {request.status === "denied" && <XCircle className="w-3 h-3" />}
                                  {request.status === "partial" ? "In Progress" : request.status}
                                </span>
                                {/* Show approval progress */}
                                {(request.status === "pending" || request.status === "partial") && (
                                  <span className="text-xs text-muted-foreground">
                                    {request.approvalCount || 0}/{REQUIRED_APPROVALS} approvals
                                    {(request.denialCount || 0) > 0 && (
                                      <span className="text-red-400 ml-1">• {request.denialCount} denial{request.denialCount > 1 ? "s" : ""}</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              {(request.status === "pending" || request.status === "partial") && (
                                <>
                                  {/* Prevent admins from approving their own leave requests */}
                                  {currentUser?.memberId === request.memberId ? (
                                    <span className="text-xs text-muted-foreground italic">
                                      Cannot review own request
                                    </span>
                                  ) : currentUser && hasAdminVoted(request, currentUser.id) ? (
                                    <span className="text-xs text-muted-foreground italic flex items-center gap-1 justify-end">
                                      <CheckCircle className="w-3 h-3 text-primary" />
                                      You voted
                                    </span>
                                  ) : (
                                    <div className="flex gap-1 justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                        onClick={() => {
                                          const result = approveLeaveRequest(
                                            request.id, 
                                            currentUser?.id || "admin",
                                            currentUser?.name || "Admin"
                                          );
                                          loadData();
                                          if (result && 'error' in result) {
                                            toast({
                                              title: "Error",
                                              description: result.error,
                                              variant: "destructive",
                                            });
                                          } else if (result) {
                                            if (currentUser) {
                                              addAuditLog(currentUser, "APPROVE_LEAVE", `Approved leave request for: ${request.memberName}`);
                                            }
                                            const progress = getApprovalProgress(result);
                                            if (result.status === "approved") {
                                              toast({
                                                title: "Leave Fully Approved! ✅",
                                                description: `${request.memberName}'s leave request has been approved (${progress.approvals}/${progress.required}).`,
                                              });
                                            } else {
                                              toast({
                                                title: "Vote Recorded",
                                                description: `Your approval has been recorded (${progress.approvals}/${progress.required}).`,
                                              });
                                            }
                                          }
                                        }}
                                        title="Approve"
                                      >
                                        <ThumbsUp className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        onClick={() => {
                                          const notes = prompt("Reason for denial (optional):");
                                          const result = denyLeaveRequest(
                                            request.id, 
                                            currentUser?.id || "admin",
                                            currentUser?.name || "Admin", 
                                            notes || undefined
                                          );
                                          loadData();
                                          if (result && 'error' in result) {
                                            toast({
                                              title: "Error",
                                              description: result.error,
                                              variant: "destructive",
                                            });
                                          } else if (result) {
                                            if (currentUser) {
                                              addAuditLog(currentUser, "DENY_LEAVE", `Denied leave request for: ${request.memberName}`);
                                            }
                                            const progress = getApprovalProgress(result);
                                            if (result.status === "denied") {
                                              toast({
                                                title: "Leave Denied ❌",
                                                description: `${request.memberName}'s leave request has been denied (${progress.denials}/${progress.requiredDenials} denials).`,
                                              });
                                            } else {
                                              toast({
                                                title: "Vote Recorded",
                                                description: `Your denial has been recorded (${progress.denials}/${progress.requiredDenials} denials).`,
                                              });
                                            }
                                          }
                                        }}
                                        title="Deny"
                                      >
                                        <ThumbsDown className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                              {(request.status === "approved" || request.status === "denied") && (
                                <span className="text-xs text-muted-foreground">
                                  {request.approvalCount || 0} approvals, {request.denialCount || 0} denials
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <CalendarOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No Leave Requests</h3>
                    <p className="text-sm text-muted-foreground">
                      {leaveFilter !== "all" 
                        ? `No ${leaveFilter} leave requests found.`
                        : "Leave requests from members will appear here."}
                    </p>
                    <Link to="/member-portal" target="_blank">
                      <Button variant="gold-outline" className="mt-4">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Member Portal
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="card-glass rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  How Leave Requests Work
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Members access the portal at <code className="text-primary">/member-portal</code> using the choir PIN</li>
                  <li>• They verify their identity via email before submitting a request</li>
                  <li>• Approved leave requests will show members as "Excused" in attendance</li>
                  <li>• Members can view their request status in the portal</li>
                </ul>
              </div>
            </div>
          )}

          {/* Disciplinary */}
          {activeTab === "disciplinary" && <DisciplinaryManagement />}

          {/* Contributions */}
          {activeTab === "contributions" && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold">Member Contributions</h2>
              <ContributionManagement />
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold">Choir Expenses</h2>
              <ExpenseManagement />
            </div>
          )}

          {activeTab === "treasury" && (
            <Treasury onRefresh={loadData} />
          )}

          {/* Announcements */}
          {activeTab === "announcements" && (
            <AnnouncementManagement />
          )}

          {/* Gallery */}
          {activeTab === "gallery" && <GalleryManagement />}

          {/* Inventory */}
          {activeTab === "inventory" && <InventoryManagement />}

          {/* Meeting Minutes */}
          {activeTab === "minutes" && <MeetingMinutesComponent />}

          {/* Documents */}
          {activeTab === "documents" && <DocumentManagement />}

          {/* Voice Balance */}
          {activeTab === "voice-balance" && <VoiceBalanceTracker />}

          {/* Surveys */}
          {activeTab === "surveys" && <SurveyManagement />}

          {/* Promo Codes */}
          {activeTab === "promos" && <PromoManagement />}

          {/* Releases */}
          {activeTab === "releases" && <MusicReleasesManagement />}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Analytics</h2>
                <p className="text-sm text-muted-foreground">
                  Track your website performance
                </p>
              </div>
              <AnalyticsDashboard />
            </div>
          )}

          {/* Event Staff (Super Admin Only) */}
          {activeTab === "event-staff" && isSuperAdmin && (
            <EventStaffManagement />
          )}

          {/* Admin Team (Super Admin Only) */}
          {activeTab === "team" && isSuperAdmin && (
            <AdminTeamManagement />
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold">Contact Messages</h2>
              <ContactSubmissions onUnreadCountChange={setUnreadMessages} />
            </div>
          )}

          {/* Audit Log (Super Admin Only) */}
          {activeTab === "audit" && isSuperAdmin && (
            <AuditLogPage />
          )}

          {/* Settings */}
          {activeTab === "settings" && settings && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-semibold">Settings</h2>

              {/* My Account Section */}
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  My Account
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accountName">Display Name</Label>
                    <Input
                      id="accountName"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="mt-1 bg-secondary border-primary/20"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountEmail">Email Address</Label>
                    <Input
                      id="accountEmail"
                      type="email"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      className="mt-1 bg-secondary border-primary/20"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Role: <strong className="text-foreground">{getRoleLabel(currentUser?.role || "reviewer")}</strong></span>
                  </div>
                  <Button
                    variant="gold"
                    disabled={accountSaving}
                    onClick={async () => {
                      if (!currentUser) return;
                      if (!accountName.trim() || !accountEmail.trim()) {
                        toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
                        return;
                      }
                      setAccountSaving(true);
                      try {
                        await updateAdminUser(currentUser.id, { name: accountName.trim(), email: accountEmail.trim() });
                        await addAuditLog(currentUser, "UPDATE_PROFILE", "Updated own profile");
                        toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message || "Failed to update profile", variant: "destructive" });
                      } finally {
                        setAccountSaving(false);
                      }
                    }}
                  >
                    {accountSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Profile
                  </Button>
                </div>

                {/* Change Password */}
                <div className="mt-6 pt-6 border-t border-primary/10">
                  <h4 className="font-semibold text-foreground mb-3">Change Password</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1 bg-secondary border-primary/20"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 bg-secondary border-primary/20"
                        placeholder="Enter new password (min 8 chars)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="mt-1 bg-secondary border-primary/20"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button
                      variant="outline"
                      disabled={accountSaving}
                      onClick={async () => {
                        if (!currentUser) return;
                        if (!currentPassword) {
                          toast({ title: "Error", description: "Please enter your current password", variant: "destructive" });
                          return;
                        }
                        if (newPassword.length < 8) {
                          toast({ title: "Error", description: "New password must be at least 8 characters", variant: "destructive" });
                          return;
                        }
                        if (newPassword !== confirmNewPassword) {
                          toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
                          return;
                        }
                        setAccountSaving(true);
                        try {
                          const success = await changePassword(currentUser.id, currentPassword, newPassword);
                          if (success) {
                            toast({ title: "Password Changed", description: "Your password has been updated successfully." });
                            await addAuditLog(currentUser, "PASSWORD_CHANGE", "Changed own password");
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmNewPassword("");
                          } else {
                            toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
                          }
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message || "Failed to change password", variant: "destructive" });
                        } finally {
                          setAccountSaving(false);
                        }
                      }}
                    >
                      {accountSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>

              {/* System settings - only for super_admin and main_admin */}
              {(currentUser?.role === "super_admin" || currentUser?.role === "main_admin") && (
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4">Choir Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="choirName">Choir Name</Label>
                    <Input
                      id="choirName"
                      value={settings.choirName}
                      onChange={(e) => setSettingsState({ ...settings, choirName: e.target.value })}
                      className="mt-1 bg-secondary border-primary/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={settings.email}
                      onChange={(e) => setSettingsState({ ...settings, email: e.target.value })}
                      className="mt-1 bg-secondary border-primary/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => setSettingsState({ ...settings, phone: e.target.value })}
                      className="mt-1 bg-secondary border-primary/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) => setSettingsState({ ...settings, address: e.target.value })}
                      className="mt-1 bg-secondary border-primary/20"
                    />
                  </div>
                  <Button variant="gold" onClick={handleSaveSettings}>Save Changes</Button>
                </div>
              </div>

              {/* Member Portal Settings */}
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Member Portal
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="memberPortalPin">Portal Access PIN (4 digits)</Label>
                    <Input
                      id="memberPortalPin"
                      type="text"
                      maxLength={4}
                      pattern="[0-9]*"
                      value={settings.memberPortalPin || "2024"}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setSettingsState({ ...settings, memberPortalPin: value });
                      }}
                      className="mt-1 bg-secondary border-primary/20 font-mono text-lg tracking-widest max-w-32"
                      placeholder="0000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Share this PIN with choir members so they can access the portal
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground font-medium mb-1">Member Portal URL:</p>
                    <code className="text-xs text-primary break-all">
                      {window.location.origin}/member-portal
                    </code>
                  </div>
                  <Button variant="gold" onClick={handleSaveSettings}>Save Portal Settings</Button>
                </div>
              </div>

              {/* Ticket Scanner Settings */}
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Ticket Scanner
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scannerPin">Scanner Access PIN</Label>
                    <Input
                      id="scannerPin"
                      type="text"
                      maxLength={10}
                      value={settings.scannerPin || "2024"}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setSettingsState({ ...settings, scannerPin: value });
                      }}
                      className="mt-1 bg-secondary border-primary/20 font-mono text-lg tracking-widest max-w-40"
                      placeholder="0000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Share this PIN with event staff so they can scan tickets at the entrance
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground font-medium mb-1">Scanner URL:</p>
                    <code className="text-xs text-primary break-all">
                      {window.location.origin}/scanner
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Admins can access the scanner without a PIN when logged in
                  </p>
                  <Button variant="gold" onClick={handleSaveSettings}>Save Scanner Settings</Button>
                </div>
              </div>

              {/* Data Export Section */}
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Export Data
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your data as CSV files or create a full backup.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" onClick={async () => { await exportFullBackup(); toast({ title: "Backup Created" }); }}>
                    <Download className="w-4 h-4 mr-2" />
                    Full Backup (JSON)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { exportFinancialReportToCSV(); toast({ title: "Financial Report Exported" }); }}>
                    <Download className="w-4 h-4 mr-2" />
                    Financial Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { exportMembersToCSV(); toast({ title: "Members Exported" }); }}>
                    <Download className="w-4 h-4 mr-2" />
                    Members List
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { exportAttendanceToCSV(); toast({ title: "Attendance Exported" }); }}>
                    <Download className="w-4 h-4 mr-2" />
                    Attendance
                  </Button>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Current data:</p>
                  <div className="flex flex-wrap gap-3">
                    <span>{backupStats?.members ?? 0} members</span>
                    <span>{backupStats?.events ?? 0} events</span>
                    <span>{backupStats?.orders ?? 0} orders</span>
                    <span>{backupStats?.attendance ?? 0} attendance sessions</span>
                  </div>
                </div>
              </div>

              {/* Backup & Restore Section */}
              <div className="max-w-2xl">
                <BackupRestore />
              </div>
              )}

            </div>
          )}
          </div>
          </Suspense>
        </main>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => { setShowAddMember(false); setEditingMember(null); }}
        onSuccess={() => {
          if (currentUser) {
            addAuditLog(currentUser, editingMember ? "UPDATE_MEMBER" : "CREATE_MEMBER", 
              editingMember ? `Updated member: ${editingMember.name}` : "Created new member");
          }
          loadData();
        }}
        editMember={editingMember}
      />

      <AddEventModal
        isOpen={showAddEvent}
        onClose={() => { setShowAddEvent(false); setEditingEvent(null); }}
        onSuccess={() => {
          if (currentUser) {
            addAuditLog(currentUser, editingEvent ? "UPDATE_EVENT" : "CREATE_EVENT", 
              editingEvent ? `Updated event: ${editingEvent.title}` : "Created new event");
          }
          loadData();
        }}
        editEvent={editingEvent}
      />

      <EventSummaryModal
        isOpen={showEventSummary}
        onClose={() => { setShowEventSummary(false); setSummaryEvent(null); }}
        event={summaryEvent}
        orders={orders}
      />

      <UploadGalleryModal
        isOpen={showUploadGallery}
        onClose={() => setShowUploadGallery(false)}
        onSuccess={() => {
          if (currentUser) {
            addAuditLog(currentUser, "UPLOAD_GALLERY", "Uploaded gallery item");
          }
          loadData();
        }}
      />

      <TicketDetailModal
        order={viewingOrder}
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        onConfirm={(id) => { handleConfirmOrder(id); setViewingOrder(null); }}
        onCancel={(id) => { handleCancelOrder(id); setViewingOrder(null); }}
        onMarkUsed={(id) => { handleMarkUsed(id); setViewingOrder(null); }}
      />

      <AddAlbumModal
        isOpen={showAddAlbum}
        onClose={() => { setShowAddAlbum(false); setEditingAlbum(null); }}
        onSuccess={loadData}
        editAlbum={editingAlbum}
      />

      <AddMusicVideoModal
        isOpen={showAddMusicVideo}
        onClose={() => { setShowAddMusicVideo(false); setEditingMusicVideo(null); }}
        onSuccess={loadData}
        editVideo={editingMusicVideo}
      />
    </div>
  );
}
