import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  EyeOff,
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
import { getGoogleConnectionStatus, getGoogleOAuthStartUrl, type GoogleConnectionStatus } from "@/lib/googleMeetService";
import { Switch } from "@/components/ui/switch";
import { AddMemberModal } from "@/components/admin/AddMemberModal";
import { BulkAddMembersModal } from "@/components/admin/BulkAddMembersModal";
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
import { getAllContributions, setLockDay, isMonthLocked, getLockDay, MONTH_NAMES as CONTRIB_MONTH_NAMES } from "@/lib/contributionService";
import {
  getAllUnlockRequests,
  getPendingUnlockRequests,
  createUnlockRequest,
  approveUnlockRequest,
  denyUnlockRequest,
  isMonthTemporarilyUnlocked,
  type UnlockRequest,
  type UnlockRequestType,
} from "@/lib/unlockRequestService";
import { getAllExpenses } from "@/lib/expenseService";
import {
  notifyLeaveRequestDecision,
  notifyUnlockRequestCreated,
  notifyUnlockRequestDecision,
  notifyMemberStatusChanged,
} from "@/lib/notificationEmailService";
import { getAllDonations } from "@/lib/donationService";
import { BarChart3, Shield, History, Wallet, Receipt, PiggyBank, X, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Info, AlertTriangle } from "lucide-react";
import { addAuditLog, getAccessibleTabs, hasPermission, getRoleLabel, canEditMembers, hasWriteAccess, isReviewer, changePassword, updateAdminUser, getAdminById } from "@/lib/adminService";
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

const VALID_TABS = new Set<string>(["dashboard","members","events","tickets","attendance","leave","disciplinary","contributions","expenses","treasury","announcements","messages","releases","promos","gallery","inventory","minutes","documents","voice-balance","surveys","analytics","event-staff","team","audit","settings"]);

function getTabFromHash(): Tab {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "");
  return VALID_TABS.has(hash) ? (hash as Tab) : "dashboard";
}

export default function Admin() {
  const [activeTab, setActiveTabState] = useState<Tab>(getTabFromHash);

  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    window.location.hash = tab === "dashboard" ? "" : tab;
  };

  // Sync tab when browser back/forward changes the hash
  useEffect(() => {
    const onHashChange = () => setActiveTabState(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
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
  const canManageMembers = canEditMembers(effectiveUser) && hasWriteAccess(effectiveUser, "members");
  const canManageAttendance = hasWriteAccess(effectiveUser, "attendance");

  // Filter sidebar items based on role permissions (use effectiveUser for preview)
  const accessibleTabs = getAccessibleTabs(effectiveUser);
  const visibleSidebarItems = sidebarItems.filter(
    item => accessibleTabs.includes(item.id)
  );

  // Loading state for tab content
  const [tabLoading, setTabLoading] = useState(true);

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
  const [showBulkAddMembers, setShowBulkAddMembers] = useState(false);
  const [showUnlockRequest, setShowUnlockRequest] = useState(false);
  const [unlockRequests, setUnlockRequests] = useState<UnlockRequest[]>([]);
  const [unlockForm, setUnlockForm] = useState({ month: new Date().getMonth() === 0 ? 12 : new Date().getMonth(), year: new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear(), type: "both" as UnlockRequestType, reason: "" });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showUploadGallery, setShowUploadGallery] = useState(false);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddMusicVideo, setShowAddMusicVideo] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
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
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState<GoogleConnectionStatus>({
    connected: false,
    googleEmail: null,
    connectedAt: null,
  });
  const [googleConnectionLoading, setGoogleConnectionLoading] = useState(false);

  // My Account state
  const [accountName, setAccountName] = useState(currentUser?.name || "");
  const [accountEmail, setAccountEmail] = useState(currentUser?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Load core data (members, events, dashboard essentials)
  const loadCoreData = async () => {
    try {
      const [
        membersData,
        eventsData,
        dashboardData,
        unreadCount,
      ] = await Promise.all([
        getAllMembers(),
        getAllEvents(),
        getDashboardStats(),
        getUnreadContactCount(),
      ]);
      setMembers(membersData);
      setEvents(eventsData);
      setDashboardStats(dashboardData);
      setUnreadMessages(unreadCount);
    } catch (err) {
      console.error("[Admin] Error loading core data:", err);
    }
  };

  // Load tab-specific data on demand
  const loadTabData = async (tab: string) => {
    setTabLoading(true);
    try {
    switch (tab) {
      case "dashboard": {
        const [allOrders, contributions, donations, expensesData] = await Promise.all([
          getAllOrders(),
          getAllContributions(),
          getAllDonations(),
          getAllExpenses(),
        ]);
        setOrders(allOrders);
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
        const [orderStatsData, attendanceStatsData] = await Promise.all([
          getOrderStats(),
          getOverallAttendanceStats(),
        ]);
        setOrderStats(orderStatsData);
        setOverallAttendanceStats(attendanceStatsData);
        break;
      }
      case "tickets": {
        const allOrders = await getAllOrders();
        setOrders(allOrders);
        setOrderStats(await getOrderStats());
        break;
      }
      case "gallery":
        setGallery(await getAllGalleryItems());
        break;
      case "leave":
        setLeaveRequests(await getAllLeaveRequests());
        break;
      case "contributions": {
        const contributions = await getAllContributions();
        const contributionTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
        setFinancialTotals(prev => ({ ...prev, contributions: contributionTotal }));
        break;
      }
      case "expenses": {
        const expensesData = await getAllExpenses();
        const expenseTotal = expensesData.reduce((sum, e) => sum + e.amount, 0);
        setFinancialTotals(prev => ({ ...prev, expenses: expenseTotal }));
        break;
      }
      case "treasury": {
        const [contributions, donations, expensesData, allOrders] = await Promise.all([
          getAllContributions(),
          getAllDonations(),
          getAllExpenses(),
          getAllOrders(),
        ]);
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
        break;
      }
      case "releases": {
        const [albums, videos, platforms] = await Promise.all([
          getAllAlbums(),
          getAllMusicVideos(),
          getAllPlatforms(),
        ]);
        setAlbums(albums);
        setMusicVideos(videos);
        setStreamingPlatforms(platforms);
        break;
      }
      case "promos":
        setPromoCodes(await getAllPromoCodes());
        break;
      case "attendance":
        setAttendanceSessions(await getRecentSessions(20));
        break;
      case "settings": {
        const stats = await getBackupStats();
        setBackupStats(stats);
        try {
          const unlockReqs = await getAllUnlockRequests();
          setUnlockRequests(unlockReqs);
        } catch { /* table may not exist yet */ }
        break;
      }
    }
    } catch (err) {
      console.error(`[Admin] Error loading tab "${tab}":`, err);
    } finally {
      setTabLoading(false);
    }
  };

  // Combined load for full refresh (used after mutations)
  const loadData = async () => {
    await loadCoreData();
    await loadTabData(activeTab);
  };

  // Load settings on mount
  useEffect(() => {
    getSettings().then((s) => {
      setSettingsState(s);
      if (s.contributionLockDay) setLockDay(s.contributionLockDay);
    });
  }, []);

  const refreshGoogleIntegrationStatus = async () => {
    if (!currentUser?.id) return;
    setGoogleConnectionLoading(true);
    try {
      const status = await getGoogleConnectionStatus(currentUser.id);
      setGoogleConnectionStatus(status);
    } catch (error: any) {
      setGoogleConnectionStatus({ connected: false, googleEmail: null, connectedAt: null });
      toast({
        title: "Google Status Check Failed",
        description: error.message || "Could not load Google integration status",
        variant: "destructive",
      });
    } finally {
      setGoogleConnectionLoading(false);
    }
  };

  const handleConnectGoogleFromSettings = async () => {
    if (!currentUser?.id) {
      toast({ title: "Error", description: "Admin authentication required", variant: "destructive" });
      return;
    }

    setGoogleConnectionLoading(true);
    try {
      const authUrl = await getGoogleOAuthStartUrl(currentUser.id, "/admin#settings");
      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        title: "Google Connect Failed",
        description: error.message || "Unable to start Google OAuth flow",
        variant: "destructive",
      });
      setGoogleConnectionLoading(false);
    }
  };

  // Load core data on mount, then tab-specific data
  useEffect(() => {
    loadCoreData();
    loadTabData(activeTab);
  }, []);

  // Load tab-specific data when switching tabs
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "settings" && currentUser?.id) {
      refreshGoogleIntegrationStatus();
    }
  }, [activeTab, currentUser?.id]);

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
  const CHART_COLORS = ["#D4AF37", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6"];

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
        // Mark member as invited
        if (member.inviteStatus !== "accepted") {
          await updateMember(member.id, { inviteStatus: "invited" });
        }
        toast({ title: "Invite Sent", description: result.message });
        if (currentUser) {
          addAuditLog(currentUser, "SEND_MEMBER_INVITE", `Sent portal invite to: ${member.name} (${member.email})`);
        }
        await loadData();
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
      // Mark successfully invited members
      for (const r of result.results) {
        if (r.success) {
          const m = selectedMembersList.find(mem => mem.email === r.email);
          if (m && m.inviteStatus !== "accepted") {
            await updateMember(m.id, { inviteStatus: "invited" });
          }
        }
      }
      toast({ 
        title: "Invites Sent", 
        description: `${result.sent} sent, ${result.failed} failed out of ${result.total} members.` 
      });
      if (currentUser) {
        addAuditLog(currentUser, "BULK_SEND_INVITES", `Sent ${result.sent} portal invites (${result.failed} failed)`);
      }
      setSelectedMembers([]);
      await loadData();
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
    
    // Get member details before updating for email notifications
    const membersToUpdate = members.filter(m => selectedMembers.includes(m.id));
    await Promise.all(selectedMembers.map(id => updateMember(id, { status })));
    
    // Notify members of status change
    for (const m of membersToUpdate) {
      if (m.email && m.status !== status) {
        notifyMemberStatusChanged(m.email, m.name, m.status, status);
      }
    }
    
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
    // Sync lock day immediately
    if (settings.contributionLockDay) setLockDay(settings.contributionLockDay);
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
    <div className="h-screen bg-background flex overflow-hidden">
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

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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
      <div className={cn("flex-1 flex flex-col h-full overflow-hidden", previewRole && "pt-10")}>
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
        <main className="flex-1 overflow-auto relative">
          {/* Tab loading indicator */}
          {tabLoading && (
            <div className="absolute top-0 left-0 right-0 z-10 h-1 bg-primary/20 overflow-hidden">
              <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite] w-1/3" 
                style={{ animation: "loading 1s ease-in-out infinite" }} />
            </div>
          )}
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
                        <option value="social_affairs">Social Affairs</option>
                        <option value="coach">Coach</option>
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
                  {!canManageMembers && (
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
                  {canManageMembers && (
                    <div className="flex gap-2">
                      <Button variant="gold" onClick={() => { setEditingMember(null); setShowAddMember(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                      <Button variant="gold-outline" onClick={() => setShowBulkAddMembers(true)}>
                        <Users className="w-4 h-4 mr-2" />
                        Bulk Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Distribution - compact inline badges */}
              {members.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  {getMembersByVoice().map((voice, i) => (
                    <div
                      key={voice.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-primary/10"
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm text-muted-foreground">{voice.name}</span>
                      <span className="text-sm font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{voice.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bulk Actions Bar */}
              {selectedMembers.length > 0 && canManageMembers && (
                <div className="card-glass rounded-xl p-3 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium">
                    <span className="text-primary">{selectedMembers.length}</span> member(s) selected
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
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

              {/* Full-width Member Table */}
              <div className="card-glass rounded-2xl overflow-hidden">
                {filteredMembers.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        {canManageMembers && (
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
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Invite</th>
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
                          {canManageMembers && (
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
                          <td className="p-4 hidden lg:table-cell">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              member.inviteStatus === "accepted" ? "bg-green-500/20 text-green-400" :
                              member.inviteStatus === "invited" ? "bg-blue-500/20 text-blue-400" :
                              "bg-zinc-500/20 text-zinc-400"
                            )}>
                              {member.inviteStatus === "accepted" ? "Accepted" :
                               member.inviteStatus === "invited" ? "Pending" :
                               "Not Invited"}
                            </span>
                          </td>
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
                              title="View Profile"
                              onClick={() => setViewingMember(member)}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            {canManageMembers && (
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
                            )}
                            {canManageMembers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingMember(member); setShowAddMember(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canManageMembers && (
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
                    {!memberSearch && canManageMembers && (
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
                      {canManageAttendance ? "Mark attendance for choir members" : "View only mode"}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative">
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
                      {(() => {
                        const d = new Date(attendanceDate);
                        const m = d.getMonth() + 1;
                        const y = d.getFullYear();
                        if (isMonthLocked(m, y) && currentUser?.role !== "super_admin") {
                          return <span className="text-[10px] text-red-400 mt-0.5 block">Month locked</span>;
                        }
                        return null;
                      })()}
                    </div>
                    {canManageAttendance && (
                      <Input
                        type="text"
                        placeholder="Session title"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        className="w-48 bg-secondary border-primary/20"
                      />
                    )}
                    {canManageAttendance && !isTakingAttendance ? (
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
                          
                          // Check if the date falls in a locked month
                          const attDate = new Date(attendanceDate);
                          const attMonth = attDate.getMonth() + 1;
                          const attYear = attDate.getFullYear();
                          if (isMonthLocked(attMonth, attYear) && currentUser?.role !== "super_admin") {
                            const tempUnlocked = await isMonthTemporarilyUnlocked(attMonth, attYear, "attendance");
                            if (!tempUnlocked) {
                              toast({
                                title: "Month Locked",
                                description: `${CONTRIB_MONTH_NAMES[attMonth - 1]} ${attYear} is locked. Attendance can't be modified after the ${getLockDay()}th of the following month.`,
                                variant: "destructive",
                              });
                              return;
                            }
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
                    ) : canManageAttendance ? (
                      <div className="flex gap-2">
                        <Button
                          variant="gold"
                        onClick={async () => {
                          // Re-check lock before saving
                          const savDate = new Date(attendanceDate);
                          const savMonth = savDate.getMonth() + 1;
                          const savYear = savDate.getFullYear();
                          if (isMonthLocked(savMonth, savYear) && currentUser?.role !== "super_admin") {
                            const savTempUnlocked = await isMonthTemporarilyUnlocked(savMonth, savYear, "attendance");
                            if (!savTempUnlocked) {
                              toast({ title: "Month Locked", description: `${CONTRIB_MONTH_NAMES[savMonth - 1]} ${savYear} is locked.`, variant: "destructive" });
                              return;
                            }
                          }
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
                              title: "Attendance Saved!",
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
                    ) : null}
                  </div>
                </div>

                {/* Attendance Form */}
                {canManageAttendance && isTakingAttendance && (
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
                            {canManageAttendance && (
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
                            )}
                            {canManageAttendance && (
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
                            )}
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
                                        onClick={async () => {
                                          const result = await approveLeaveRequest(
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
                                                title: "Leave Fully Approved!",
                                                description: `${request.memberName}'s leave request has been approved (${progress.approvals}/${progress.required}).`,
                                              });
                                              notifyLeaveRequestDecision(request.memberEmail, request.memberName, request.startDate, request.endDate, "approved", currentUser?.name);
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
                                        onClick={async () => {
                                          const notes = prompt("Reason for denial (optional):");
                                          const result = await denyLeaveRequest(
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
                                                title: "Leave Denied",
                                                description: `${request.memberName}'s leave request has been denied (${progress.denials}/${progress.requiredDenials} denials).`,
                                              });
                                              notifyLeaveRequestDecision(request.memberEmail, request.memberName, request.startDate, request.endDate, "denied", currentUser?.name);
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

          {/* Admin Team */}
          {activeTab === "team" && hasPermission(effectiveUser, "team") && (
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

              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Google Meet Integration
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-flex h-2.5 w-2.5 rounded-full",
                      googleConnectionStatus.connected ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="text-muted-foreground">Status:</span>
                    <span className={cn(
                      "font-medium",
                      googleConnectionStatus.connected ? "text-green-500" : "text-red-500"
                    )}>
                      {googleConnectionStatus.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Connected account:</span>{" "}
                    <span className="text-foreground">{googleConnectionStatus.googleEmail || "Not connected"}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Last connected:</span>{" "}
                    <span className="text-foreground">
                      {googleConnectionStatus.connectedAt
                        ? new Date(googleConnectionStatus.connectedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="gold" onClick={handleConnectGoogleFromSettings} disabled={googleConnectionLoading || !currentUser?.id}>
                    {googleConnectionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                    {googleConnectionStatus.connected ? "Reconnect Google" : "Connect Google"}
                  </Button>
                  <Button variant="outline" onClick={refreshGoogleIntegrationStatus} disabled={googleConnectionLoading || !currentUser?.id}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", googleConnectionLoading && "animate-spin")} />
                    Refresh Status
                  </Button>
                </div>
              </div>

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
                      <div className="relative mt-1">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10 bg-secondary border-primary/20"
                          placeholder="Enter current password"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-sm text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors">
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10 bg-secondary border-primary/20"
                          placeholder="Enter new password (min 8 chars)"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-sm text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors">
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmNewPassword"
                          type={showConfirmNewPassword ? "text" : "password"}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="pr-10 bg-secondary border-primary/20"
                          placeholder="Confirm new password"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-sm text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors">
                          {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
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
              <div className="space-y-6">
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

              {/* Contribution Lock Settings */}
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Contribution Month Locking
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Control when monthly contribution data becomes read-only. After the lock day, admins (except super admin) cannot modify that month's contributions.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lockDay">Lock Day (of the following month)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="lockDay"
                        type="number"
                        min={1}
                        max={28}
                        value={settings.contributionLockDay || 5}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(28, parseInt(e.target.value) || 5));
                          setSettingsState({ ...settings, contributionLockDay: val });
                        }}
                        className="bg-secondary border-primary/20 max-w-24 text-center text-lg font-semibold"
                      />
                      <span className="text-sm text-muted-foreground">of the next month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Example: If set to <span className="font-medium text-foreground">{settings.contributionLockDay || 5}</span>, January's contributions will lock on <span className="font-medium text-foreground">February {settings.contributionLockDay || 5}</span>.
                      Set a higher number (e.g. 15) to give more time for late data entry.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">How it works:</p>
                    <p>- After the lock day, the previous month turns read-only for all admins</p>
                    <p>- Both contributions AND attendance are locked together</p>
                    <p>- Locked months show a lock icon in the contributions grid</p>
                    <p>- Super admin can always override locked months</p>
                    <p>- Finance admins can request a temporary unlock (needs approval)</p>
                  </div>
                  <Button variant="gold" onClick={handleSaveSettings}>Save Lock Settings</Button>
                </div>
              </div>

              {/* Unlock Requests Management */}
              {(currentUser?.role === "super_admin" || currentUser?.role === "main_admin") && (
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-yellow-500" />
                  Unlock Requests
                  {unlockRequests.filter(r => r.status === "pending").length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-500">
                      {unlockRequests.filter(r => r.status === "pending").length} pending
                    </span>
                  )}
                </h3>
                {unlockRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unlock requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {unlockRequests.filter(r => r.status === "pending").map(req => (
                      <div key={req.id} className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {CONTRIB_MONTH_NAMES[req.month - 1]} {req.year} — {req.type === "both" ? "Contributions & Attendance" : req.type}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Requested by <span className="text-foreground">{req.requestedBy}</span> ({req.requestedByRole}) — {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{req.reason}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={async () => {
                                await approveUnlockRequest(req.id, currentUser?.name || "Admin", undefined, 3);
                                toast({ title: "Approved", description: `${CONTRIB_MONTH_NAMES[req.month - 1]} ${req.year} unlocked for 3 days.` });
                                const requester = req.requestedById ? await getAdminById(req.requestedById) : null;
                                if (requester) {
                                  notifyUnlockRequestDecision(requester.email, requester.name, req.month, req.year, "approved", currentUser?.name || "Admin", 3);
                                }
                                loadData();
                              }}
                            >
                              Approve (3 days)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await denyUnlockRequest(req.id, currentUser?.name || "Admin", "Denied by admin");
                                toast({ title: "Denied", description: "Unlock request denied." });
                                const requester = req.requestedById ? await getAdminById(req.requestedById) : null;
                                if (requester) {
                                  notifyUnlockRequestDecision(requester.email, requester.name, req.month, req.year, "denied", currentUser?.name || "Admin");
                                }
                                loadData();
                              }}
                            >
                              Deny
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {unlockRequests.filter(r => r.status !== "pending").length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Past requests ({unlockRequests.filter(r => r.status !== "pending").length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {unlockRequests.filter(r => r.status !== "pending").slice(0, 10).map(req => (
                            <div key={req.id} className={`p-3 rounded-lg border text-sm ${
                              req.status === "approved" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                            }`}>
                              <p className="text-foreground">
                                {CONTRIB_MONTH_NAMES[req.month - 1]} {req.year} — <span className={req.status === "approved" ? "text-green-500" : "text-red-500"}>{req.status}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                By {req.requestedBy} • {req.reviewedBy ? `Reviewed by ${req.reviewedBy}` : ""}
                                {req.unlockedUntil && req.status === "approved" ? ` • Unlocked until ${new Date(req.unlockedUntil).toLocaleDateString()}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
              )}

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

      <BulkAddMembersModal
        isOpen={showBulkAddMembers}
        onClose={() => setShowBulkAddMembers(false)}
        onSuccess={() => {
          if (currentUser) {
            addAuditLog(currentUser, "CREATE_MEMBER", "Bulk added members");
          }
          loadData();
        }}
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

      {/* Member Profile Viewer */}
      <Dialog open={!!viewingMember} onOpenChange={(open) => { if (!open) setViewingMember(null); }}>
        <DialogContent className="max-w-md bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Member Profile
            </DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-5 pt-2">
              {/* Photo + Name */}
              <div className="flex flex-col items-center gap-3">
                {viewingMember.photo ? (
                  <img src={viewingMember.photo} alt={viewingMember.name} className="w-24 h-24 rounded-full object-cover border-3 border-primary/30" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{viewingMember.name.charAt(0)}</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">{viewingMember.name}</h3>
                  <div className="flex items-center gap-2 justify-center mt-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      viewingMember.status === "Active" ? "bg-green-500/20 text-green-400" :
                      viewingMember.status === "Pending" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>{viewingMember.status}</span>
                    <span className="text-sm text-primary font-medium">{viewingMember.voice}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm text-foreground">{viewingMember.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm text-foreground">{viewingMember.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Date of Birth</span>
                  <span className="text-sm text-foreground">
                    {viewingMember.dateOfBirth ? new Date(viewingMember.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Invite Status</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    viewingMember.inviteStatus === "accepted" ? "bg-green-500/20 text-green-400" :
                    viewingMember.inviteStatus === "invited" ? "bg-blue-500/20 text-blue-400" :
                    "bg-zinc-500/20 text-zinc-400"
                  )}>
                    {viewingMember.inviteStatus === "accepted" ? "Accepted" :
                     viewingMember.inviteStatus === "invited" ? "Pending" :
                     "Not Invited"}
                  </span>
                </div>
              </div>

              {/* Emergency Contact */}
              {viewingMember.emergencyContact && viewingMember.emergencyContact.name && (
                <div className="bg-secondary/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Emergency Contact</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm text-foreground">{viewingMember.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Relationship</span>
                      <span className="text-sm text-foreground">{viewingMember.emergencyContact.relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm text-foreground">{viewingMember.emergencyContact.phone}</span>
                    </div>
                    {viewingMember.emergencyContact.altPhone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Alt. Phone</span>
                        <span className="text-sm text-foreground">{viewingMember.emergencyContact.altPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewingMember(null)}
                >
                  Close
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={() => {
                    setEditingMember(viewingMember);
                    setShowAddMember(true);
                    setViewingMember(null);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Member
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
