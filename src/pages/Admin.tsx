import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  getAllSessions,
  canEditAttendanceDate,
  getAttendanceEditDeadline,
  getAttendanceByDate,
  getRecentSessions,
  saveAttendance,
  getMembersToExcuse,
  getOverallAttendanceStats,
  type AttendanceRecord,
  type AttendanceSession,
  type AttendanceStatus,
} from "@/lib/attendanceService";
import { getPageViewStats } from "@/lib/analyticsService";
import { useToast } from "@/hooks/use-toast";
import { getGoogleConnectionStatus, getGoogleOAuthStartUrl, syncGoogleBirthdayCalendar, type GoogleConnectionStatus } from "@/lib/googleMeetService";
import { Switch } from "@/components/ui/switch";
import { AddMemberModal } from "@/components/admin/AddMemberModal";
import { BulkAddMembersModal } from "@/components/admin/BulkAddMembersModal";
import { AddEventModal } from "@/components/admin/AddEventModal";
import { UploadGalleryModal } from "@/components/admin/UploadGalleryModal";
import { TicketDetailModal } from "@/components/admin/TicketDetailModal";
import { AddAlbumModal } from "@/components/admin/AddAlbumModal";
import { AddMusicVideoModal } from "@/components/admin/AddMusicVideoModal";
// Lazy loaded components for code splitting
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
  downloadBrandedTableReport,
} from "@/lib/exportUtils";
const AnnouncementManagement = lazy(() => import("@/components/admin/AnnouncementManagement").then(m => ({ default: m.AnnouncementManagement })));
const EventStaffManagement = lazy(() => import("@/components/admin/EventStaffManagement").then(m => ({ default: m.EventStaffManagement })));
import { EventSummaryModal } from "@/components/admin/EventSummaryModal";
const ContributionManagement = lazy(() => import("@/components/admin/ContributionManagement").then(m => ({ default: m.ContributionManagement })));
import { getAllContributions, setLockDay, isMonthLocked, getLockDay, MONTH_NAMES as CONTRIB_MONTH_NAMES } from "@/lib/contributionService";
import logo from "@/assets/LogoTSC.jpg";
import { TicketHealthWidget } from "@/components/admin/TicketHealthWidget";
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
import { BackupRestore } from "@/components/admin/BackupRestore";
import { getTicketedEvents } from "@/lib/ticketVisibility";

type Tab = "dashboard" | "members" | "events" | "tickets" | "attendance" | "leave" | "disciplinary" | "contributions" | "expenses" | "treasury" | "announcements" | "messages" | "releases" | "promos" | "gallery" | "inventory" | "minutes" | "documents" | "voice-balance" | "surveys" | "event-staff" | "team" | "audit" | "settings";

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
  { id: "event-staff" as Tab, label: "Event Staff", icon: IdCard },
  { id: "team" as Tab, label: "Admin Team", icon: Shield },
  { id: "audit" as Tab, label: "Audit Log", icon: History },
  { id: "settings" as Tab, label: "Settings", icon: Settings },
];

const VALID_TABS = new Set<string>(["dashboard","members","events","tickets","attendance","leave","disciplinary","contributions","expenses","treasury","announcements","messages","releases","promos","gallery","inventory","minutes","documents","voice-balance","surveys","event-staff","team","audit","settings"]);

function getTabFromHash(): Tab {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "");
  return VALID_TABS.has(hash) ? (hash as Tab) : "dashboard";
}

export default function Admin() {
  const TAB_DATA_TTL_MS = 60_000;
  const [activeTab, setActiveTabState] = useState<Tab>(getTabFromHash);
  const initialTabLoadDoneRef = useRef(false);
  const tabLoadTimestampsRef = useRef<Partial<Record<Tab, number>>>({});

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
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0, used: 0, archived: 0, revenue: 0 });
  const [overallAttendanceStats, setOverallAttendanceStats] = useState({ totalSessions: 0, avgAttendance: 0, recentTrend: 'stable' as 'up' | 'down' | 'stable' });
  const [dashboardPageStats, setDashboardPageStats] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
    viewsByPage: [] as { path: string; title: string; count: number }[],
    viewsByDay: [] as { date: string; views: number }[],
    viewsByHour: [] as { hour: number; views: number }[],
  });

  // Attendance state
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [memberId: string]: AttendanceStatus }>({});
  const [sessionTitle, setSessionTitle] = useState("Regular Practice");
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
  const [membersOnLeave, setMembersOnLeave] = useState<{ memberId: string; memberName: string; reason: string }[]>([]);
  const [attendanceMemberSearch, setAttendanceMemberSearch] = useState("");
  const [viewingAttendanceSession, setViewingAttendanceSession] = useState<AttendanceSession | null>(null);
  const [viewingAttendanceRecords, setViewingAttendanceRecords] = useState<AttendanceRecord[]>([]);
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
    calendarId: null,
    reconnectRequired: false,
    statusMessage: null,
    scope: null,
  });
  const [googleConnectionLoading, setGoogleConnectionLoading] = useState(false);
  const googleStatusRefreshInFlightRef = useRef(false);
  const googleBirthdaySyncInFlightRef = useRef(false);

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

  const loadAttendanceData = async () => {
    const [allSessionsData, attendanceStatsData, pendingLeaveData] = await Promise.all([
      getAllSessions(),
      getOverallAttendanceStats(),
      getPendingLeaveRequests(),
    ]);

    setAttendanceSessions(
      allSessionsData.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    );
    setOverallAttendanceStats(attendanceStatsData);
    setLeaveRequests(pendingLeaveData);
  };

  const normalizeAttendanceRecordDate = (value: string) => {
    if (!value) return "";
    return value.includes("T") ? value.split("T")[0] : value;
  };

  const loadAttendanceSessionRecords = async (session: AttendanceSession) => {
    let records = await getAttendanceByDate(session.date);

    if (records.length === 0) {
      const allRecords = await getAllAttendanceRecords();
      records = allRecords.filter((record) => normalizeAttendanceRecordDate(record.date) === session.date);
    }

    const memberMap = new Map(members.map((member) => [member.id, member]));

    return records
      .map((record) => {
        const member = memberMap.get(record.memberId);

        return {
          ...record,
          memberName: record.memberName || member?.name || "Unknown member",
          memberEmail: record.memberEmail || member?.email || "",
          memberVoice: record.memberVoice || member?.voice || "",
          date: normalizeAttendanceRecordDate(record.date) || session.date,
        };
      })
      .sort((left, right) => left.memberName.localeCompare(right.memberName));
  };

  const getAttendanceStatusBadgeClass = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "border border-green-500/30 bg-green-500/10 text-green-400";
      case "absent":
        return "border border-red-500/30 bg-red-500/10 text-red-400";
      case "excused":
        return "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
      case "late":
        return "border border-orange-500/30 bg-orange-500/10 text-orange-300";
      default:
        return "border border-primary/20 bg-secondary/40 text-foreground";
    }
  };

  const formatAttendanceStatusLabel = (status: AttendanceStatus) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const runGoogleBirthdaySync = async (source: string, showSyncFeedback = false) => {
    if (!currentUser?.id) return;
    if (googleBirthdaySyncInFlightRef.current) {
      console.info(`[Admin] Google birthday sync skipped (${source}): sync already in-flight`);
      return;
    }

    googleBirthdaySyncInFlightRef.current = true;
    try {
      console.info(`[Admin] Google birthday sync started (${source})`);
      const result = await syncGoogleBirthdayCalendar(currentUser.id);
      console.info(`[Admin] Google birthday sync success (${source}):`, result);
      if (showSyncFeedback) {
        toast({
          title: "Google Birthday Sync Complete",
          description: `Created ${result.created}, updated ${result.updated}, removed ${result.deleted} (calendar: ${result.calendarId || googleConnectionStatus.calendarId || "unknown"})`,
        });
      }
    } catch (syncError: any) {
      const message = syncError?.message || "Could not sync birthdays to Google Calendar";
      console.warn(`[Admin] Google birthday sync failed (${source}):`, message);

      if (
        message.includes("GOOGLE_RECONNECT_REQUIRED")
        || message.includes("GOOGLE_SCOPE_UPGRADE_REQUIRED")
        || message.includes("expired or revoked")
        || message.includes("insufficient authentication scopes")
      ) {
        setGoogleConnectionStatus({
          connected: false,
          googleEmail: null,
          connectedAt: null,
          calendarId: null,
          reconnectRequired: true,
          statusMessage: "Google Calendar needs to be reconnected with calendar access permissions.",
          scope: null,
        });
      }

      if (showSyncFeedback) {
        toast({
          title: "Birthday Sync Failed",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      googleBirthdaySyncInFlightRef.current = false;
    }
  };

  // Load tab-specific data on demand
  const loadTabData = async (tab: Tab, options?: { force?: boolean }) => {
    const shouldUseCachedTabData = !options?.force
      && (Date.now() - (tabLoadTimestampsRef.current[tab] ?? 0) < TAB_DATA_TTL_MS);

    if (shouldUseCachedTabData) {
      return;
    }

    setTabLoading(true);
    try {
    switch (tab) {
      case "dashboard": {
        const [allOrders, contributions, donations, expensesData, recentSessionsData, pageViewStats] = await Promise.all([
          getAllOrders(),
          getAllContributions(),
          getAllDonations(),
          getAllExpenses(),
          getRecentSessions(20),
          getPageViewStats(),
        ]);
        setOrders(allOrders);
        setAttendanceSessions(recentSessionsData);
        setDashboardPageStats(pageViewStats);
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
        await loadAttendanceData();
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
      tabLoadTimestampsRef.current[tab] = Date.now();
    } catch (err) {
      console.error(`[Admin] Error loading tab "${tab}":`, err);
    } finally {
      setTabLoading(false);
    }
  };

  // Combined load for full refresh (used after mutations)
  const loadData = async () => {
    await Promise.all([loadCoreData(), loadTabData(activeTab, { force: true })]);
  };

  const refreshCoreData = async () => {
    await loadCoreData();
  };

  const refreshTabData = async (tab: Tab = activeTab) => {
    await loadTabData(tab, { force: true });
  };

  // Load settings on mount
  useEffect(() => {
    getSettings().then((s) => {
      setSettingsState(s);
      if (s.contributionLockDay) setLockDay(s.contributionLockDay);
    });
  }, []);

  const refreshGoogleIntegrationStatus = async (showSyncFeedback = false) => {
    if (!currentUser?.id) return;
    if (googleStatusRefreshInFlightRef.current) {
      console.info("[Admin] Google integration status refresh skipped: request already in-flight");
      return;
    }

    googleStatusRefreshInFlightRef.current = true;
    setGoogleConnectionLoading(true);
    try {
      const status = await getGoogleConnectionStatus(currentUser.id);
      console.info("[Admin] Google integration status:", status);
      setGoogleConnectionStatus(status);
      if (status.connected) {
        await runGoogleBirthdaySync(showSyncFeedback ? "settings-manual-refresh" : "status-refresh", showSyncFeedback);
      } else if (showSyncFeedback && status.reconnectRequired) {
        toast({
          title: "Google Reconnect Required",
          description: status.statusMessage || "Reconnect Google Calendar and approve calendar access.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setGoogleConnectionStatus({
        connected: false,
        googleEmail: null,
        connectedAt: null,
        calendarId: null,
        reconnectRequired: false,
        statusMessage: null,
        scope: null,
      });
      console.warn("[Admin] Google status check failed:", error?.message || error);
      toast({
        title: "Google Status Check Failed",
        description: error.message || "Could not load Google integration status",
        variant: "destructive",
      });
    } finally {
      googleStatusRefreshInFlightRef.current = false;
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
    loadTabData(activeTab, { force: true });
    initialTabLoadDoneRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load tab-specific data when switching tabs
  useEffect(() => {
    if (!initialTabLoadDoneRef.current) {
      return;
    }

    loadTabData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "settings" && currentUser?.id) {
      refreshGoogleIntegrationStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    refreshGoogleIntegrationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    getAllUnlockRequests()
      .then(setUnlockRequests)
      .catch(() => {
        // Best-effort fetch for attendance unlock state.
      });
  }, [currentUser?.id]);

  const requestAttendanceUnlock = async (date: string) => {
    if (!currentUser?.id || !currentUser?.name) {
      toast({ title: "Error", description: "Admin authentication required.", variant: "destructive" });
      return;
    }

    const reason = window.prompt(
      `Why do you need to unlock attendance for ${new Date(`${date}T00:00:00`).toLocaleDateString()}?`,
      "Need to correct attendance records.",
    )?.trim();

    if (!reason) return;

    const baseDate = new Date(`${date}T00:00:00`);
    const month = baseDate.getMonth() + 1;
    const year = baseDate.getFullYear();
    const fullReason = `Attendance edit request for ${date}: ${reason}`;

    try {
      await createUnlockRequest({
        requestedBy: currentUser.name,
        requestedByRole: currentUser.role,
        requestedById: currentUser.id,
        type: "attendance",
        month,
        year,
        reason: fullReason,
      });

      await notifyUnlockRequestCreated(
        currentUser.name,
        currentUser.role,
        month,
        year,
        "attendance",
        fullReason,
      );

      const updatedRequests = await getAllUnlockRequests();
      setUnlockRequests(updatedRequests);
      toast({
        title: "Unlock Request Sent",
        description: "Only Super Admin or Main Admin can approve this attendance unlock request.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error?.message || "Could not submit attendance unlock request.",
        variant: "destructive",
      });
    }
  };

  const handleViewAttendanceSession = async (session: AttendanceSession) => {
    try {
      const sortedRecords = await loadAttendanceSessionRecords(session);
      setViewingAttendanceSession(session);
      setViewingAttendanceRecords(sortedRecords);

      if (sortedRecords.length === 0 && (session.totalPresent + session.totalAbsent + session.totalExcused + session.totalLate) > 0) {
        toast({
          title: "Detailed Records Missing",
          description: "This session still has a saved summary, but the member-level attendance rows for that date are missing from the database.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "View Failed",
        description: error?.message || "Could not load attendance records.",
        variant: "destructive",
      });
    }
  };

  const openAttendanceSessionForEdit = async (session: AttendanceSession) => {
    const existing = await getAttendanceByDate(session.date);
    const existingMap: { [key: string]: AttendanceStatus } = {};
    existing.forEach((record) => {
      existingMap[record.memberId] = record.status;
    });

    const onLeave = await getMembersToExcuse(session.date);
    setMembersOnLeave(onLeave);
    onLeave.forEach((leaveMember) => {
      if (!existingMap[leaveMember.memberId]) {
        existingMap[leaveMember.memberId] = "excused";
      }
    });

    setViewingAttendanceSession(null);
    setViewingAttendanceRecords([]);
    setAttendanceDate(session.date);
    setSessionTitle(session.title);
    setAttendanceRecords(existingMap);
    setIsTakingAttendance(true);
  };

  const handleDownloadAttendanceSession = async (session: AttendanceSession) => {
    try {
      const sortedRecords = await loadAttendanceSessionRecords(session);
      const sessionDateLabel = new Date(`${session.date}T00:00:00`).toLocaleDateString();
      const totalMembers = sortedRecords.length;
      const totalPresent = sortedRecords.filter((record) => record.status === "present" || record.status === "late").length;
      const totalAbsent = sortedRecords.filter((record) => record.status === "absent").length;
      const totalExcused = sortedRecords.filter((record) => record.status === "excused").length;

      downloadBrandedTableReport({
        title: "Attendance Report",
        subtitle: session.title,
        filename: `attendance-${session.date}`,
        headers: ["Member Name", "Email", "Voice", "Date", "Status", "Marked By"],
        rows: sortedRecords.map((record) => [
          record.memberName,
          record.memberEmail || "",
          record.memberVoice || "",
          sessionDateLabel,
          record.status,
          record.markedBy || "",
        ]),
        meta: [
          { label: "Session", value: session.title },
          { label: "Date", value: sessionDateLabel },
          { label: "Generated", value: new Date().toLocaleString() },
        ],
        summary: [
          { label: "Total Members", value: totalMembers },
          { label: "Attended", value: totalPresent },
          { label: "Absent", value: totalAbsent },
          { label: "Excused", value: totalExcused },
        ],
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error?.message || "Could not download attendance records.",
        variant: "destructive",
      });
    }
  };

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
  const [attendanceTimePeriod, setAttendanceTimePeriod] = useState<"30" | "120" | "year" | "all">("30");

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
  const ticketedEvents = getTicketedEvents(events);
  const ticketedEventCount = ticketedEvents.length;
  const hasTicketedEvents = ticketedEventCount > 0;
  const totalTicketCapacity = ticketedEvents.reduce(
    (sum, event) => sum + event.tickets.reduce((tierSum, tier) => tierSum + (tier.available || 0), 0),
    0
  );
  const totalTicketsConfiguredSold = ticketedEvents.reduce(
    (sum, event) => sum + event.tickets.reduce((tierSum, tier) => tierSum + (tier.sold || 0), 0),
    0
  );
  const totalTicketsRemaining = ticketedEvents.reduce(
    (sum, event) =>
      sum + event.tickets.reduce((tierSum, tier) => tierSum + Math.max(0, (tier.available || 0) - (tier.sold || 0)), 0),
    0
  );
  const ticketRevenuePotential = ticketedEvents.reduce(
    (sum, event) => sum + event.tickets.reduce((tierSum, tier) => tierSum + (tier.price || 0) * (tier.available || 0), 0),
    0
  );
  
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
    const sortedSessions = [...attendanceSessions].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
    );

    let sessionsToShow = sortedSessions;
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (attendanceTimePeriod === "30" || attendanceTimePeriod === "120") {
      const days = Number(attendanceTimePeriod);
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days + 1);
      cutoff.setHours(0, 0, 0, 0);
      sessionsToShow = sortedSessions.filter((session) => {
        const sessionDate = new Date(`${session.date}T00:00:00`);
        return sessionDate.getTime() >= cutoff.getTime();
      });
    } else if (attendanceTimePeriod === "year") {
      const cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      cutoff.setHours(0, 0, 0, 0);
      sessionsToShow = sortedSessions.filter((session) => {
        const sessionDate = new Date(`${session.date}T00:00:00`);
        return sessionDate.getTime() >= cutoff.getTime();
      });
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

  const attendanceTrend = getAttendanceRate();
  const isAttendancePrivilegedEditor = currentUser?.role === "super_admin" || currentUser?.role === "main_admin";
  const isAttendanceUnlockApprover = currentUser?.role === "super_admin" || currentUser?.role === "main_admin";
  const isAttendanceDateTemporarilyUnlocked = (date: string) => {
    const baseDate = new Date(`${date}T00:00:00`);
    const month = baseDate.getMonth() + 1;
    const year = baseDate.getFullYear();
    const now = Date.now();

    return unlockRequests.some((request) => {
      if (request.status !== "approved") return false;
      if (!request.unlockedUntil) return false;
      if (new Date(request.unlockedUntil).getTime() < now) return false;
      if (request.type !== "attendance" && request.type !== "both") return false;
      return request.month === month && request.year === year;
    });
  };
  const attendanceEditDeadline = attendanceDate ? getAttendanceEditDeadline(attendanceDate) : null;
  const selectedAttendanceSession = attendanceSessions.find((session) => session.date === attendanceDate) || null;
  const selectedAttendanceExists = Boolean(selectedAttendanceSession);
  const canEditSelectedAttendance = attendanceDate
    ? selectedAttendanceExists
      && isAttendancePrivilegedEditor
      && (canEditAttendanceDate(attendanceDate, isAttendancePrivilegedEditor) || isAttendanceDateTemporarilyUnlocked(attendanceDate))
    : false;
  const canTakeSelectedAttendance = attendanceDate
    ? !selectedAttendanceExists || canEditSelectedAttendance
    : false;
  const filteredAttendanceMembers = members.filter((member) => {
    const query = attendanceMemberSearch.trim().toLowerCase();
    if (!query) return true;

    return member.name.toLowerCase().includes(query)
      || member.email.toLowerCase().includes(query)
      || member.voice.toLowerCase().includes(query);
  });
  const revenueTrend = getRevenueByDay();
  const topRevenueEvents = getRevenueByEvent();
  const topVisitedPages = dashboardPageStats.viewsByPage.slice(0, 6);
  const ticketPipelineData = [
    { name: "Pending", count: orderStats.pending },
    { name: "Confirmed", count: orderStats.confirmed },
    { name: "Used", count: orderStats.used },
    { name: "Cancelled", count: orderStats.cancelled },
    { name: "Archived", count: orderStats.archived },
  ];

  // Order actions
  const handleConfirmOrder = async (orderId: string) => {
    // Use confirmOrder which also reduces ticket availability
    const updated = await confirmOrder(orderId);
    if (updated) {
      // Dispatch event to update Events page
      window.dispatchEvent(new Event("eventsUpdated"));
      refreshTabData("tickets");
      toast({ title: "Order Confirmed", description: `Order ${updated.txRef} has been confirmed.` });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const updated = await updateOrderStatus(orderId, "cancelled");
    if (updated) {
      refreshTabData("tickets");
      toast({ title: "Order Cancelled", description: `Order ${updated.txRef} has been cancelled.` });
    }
  };

  const handleMarkUsed = async (orderId: string) => {
    const updated = await updateOrderStatus(orderId, "used");
    if (updated) {
      refreshTabData("tickets");
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
        await refreshCoreData();
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
      await refreshCoreData();
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
      await refreshCoreData();
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
    
    await refreshCoreData();
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
    
    await refreshCoreData();
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
      await refreshCoreData();
      toast({ title: "Event Deleted", description: `"${title}" has been deleted.` });
    }
  };

  const handleDeleteGalleryItem = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteGalleryItem(id);
      if (currentUser) {
        addAuditLog(currentUser, "DELETE_GALLERY", `Deleted gallery item: ${title}`);
      }
      await refreshTabData("gallery");
      toast({ title: "Media Deleted", description: `"${title}" has been removed.` });
    }
  };

  const handleDeleteAlbum = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete album "${title}"?`)) {
      await deleteAlbum(id);
      await refreshTabData("releases");
      toast({ title: "Album Deleted", description: `"${title}" has been removed.` });
    }
  };

  const handleDeleteMusicVideo = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteMusicVideo(id);
      await refreshTabData("releases");
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
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
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
    <div className="h-screen bg-background font-body flex overflow-hidden">
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
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30 shadow-[0_0_18px_hsl(var(--gold)/0.25)]">
                <img src={logo} alt="Serenades of Praise Logo" className="w-full h-full object-cover" />
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
          
          <Suspense fallback={null}>
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
                    {hasTicketedEvents && (
                      <div className="card-glass rounded-xl p-4 hover:bg-secondary/50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Ticket className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(financialTotals.ticketRevenue)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Tickets</p>
                      </div>
                    )}
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

              {/* Advanced Insights for all admin roles */}
              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Advanced Command Center</h2>
                    <p className="text-sm text-muted-foreground">Live performance, engagement, finance, and operational intelligence</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadTabData("dashboard")}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Insights
                  </Button>
                </div>

                {hasTicketedEvents && (
                  <TicketHealthWidget
                    title="Ticket Health (Global)"
                    ticketedEvents={ticketedEventCount}
                    ticketCapacity={totalTicketCapacity}
                    ticketsSold={totalTicketsConfiguredSold}
                    ticketsRemaining={totalTicketsRemaining}
                    potentialRevenue={ticketRevenuePotential}
                  />
                )}

                <div className="grid grid-cols-2 lg:grid-cols-8 gap-3">
                  <div className="card-glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Weekly Web Visits</p>
                    <p className="text-2xl font-bold text-foreground">{dashboardPageStats.weekViews.toLocaleString()}</p>
                  </div>
                  <div className="card-glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold text-foreground">{dashboardPageStats.uniqueVisitors.toLocaleString()}</p>
                  </div>
                  {hasTicketedEvents && (
                    <>
                      <div className="card-glass rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Ticketed Events</p>
                        <p className="text-2xl font-bold text-foreground">{ticketedEventCount}</p>
                      </div>
                      <div className="card-glass rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Tickets Remaining</p>
                        <p className="text-2xl font-bold text-foreground">{totalTicketsRemaining.toLocaleString()}</p>
                      </div>
                      <div className="card-glass rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Ticket Potential</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(ticketRevenuePotential)}</p>
                      </div>
                      <div className="card-glass rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Ticket Conversion</p>
                        <p className="text-2xl font-bold text-foreground">{orderStats.total > 0 ? `${Math.round((orderStats.confirmed / orderStats.total) * 100)}%` : "0%"}</p>
                      </div>
                    </>
                  )}
                  <div className="card-glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Attendance Health</p>
                    <p className="text-2xl font-bold text-foreground">{Math.round(overallAttendanceStats.avgAttendance)}%</p>
                  </div>
                  <div className="card-glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Net Position</p>
                    <p className={cn("text-2xl font-bold", financialTotals.balance >= 0 ? "text-green-400" : "text-red-400")}>{formatCurrency(financialTotals.balance)}</p>
                  </div>
                  <div className="card-glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Unread Messages</p>
                    <p className="text-2xl font-bold text-foreground">{unreadMessages}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {hasTicketedEvents && (
                    <div className="card-glass rounded-2xl p-5">
                      <h3 className="font-display text-base font-semibold mb-3">Revenue Momentum</h3>
                      {revenueTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,55,0.08)" />
                            <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-muted-foreground">No confirmed ticket revenue in selected time range yet.</p>
                      )}
                    </div>
                  )}

                  {hasTicketedEvents && (
                    <div className="card-glass rounded-2xl p-5">
                      <h3 className="font-display text-base font-semibold mb-3">Ticket Pipeline Status</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={ticketPipelineData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,55,0.08)" />
                          <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => [value, "Orders"]} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {ticketPipelineData.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="card-glass rounded-2xl p-5">
                    <h3 className="font-display text-base font-semibold mb-3">Attendance Trend</h3>
                    {attendanceTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={attendanceTrend.slice(-10)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,55,0.08)" />
                          <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => [`${value}%`, "Attendance"]} />
                          <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attendance sessions recorded yet.</p>
                    )}
                  </div>

                  <div className="card-glass rounded-2xl p-5">
                    <h3 className="font-display text-base font-semibold mb-3">Website Traffic (Last 7 Days)</h3>
                    {dashboardPageStats.viewsByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={dashboardPageStats.viewsByDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,55,0.08)" />
                          <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => [value, "Views"]} />
                          <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground">No page-view activity yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="card-glass rounded-2xl p-5">
                    <h3 className="font-display text-base font-semibold mb-3">Top Revenue Events</h3>
                    {topRevenueEvents.length > 0 ? (
                      <div className="space-y-2">
                        {topRevenueEvents.slice(0, 5).map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                            <span className="text-sm text-foreground truncate pr-2">{index + 1}. {entry.name}</span>
                            <span className="text-sm font-semibold text-primary">{formatCurrency(entry.value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No event revenue available yet.</p>
                    )}
                  </div>

                  <div className="card-glass rounded-2xl p-5">
                    <h3 className="font-display text-base font-semibold mb-3">Top Visited Pages</h3>
                    {topVisitedPages.length > 0 ? (
                      <div className="space-y-2">
                        {topVisitedPages.map((entry, index) => (
                          <div key={entry.path} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                            <span className="text-sm text-foreground truncate pr-2">{index + 1}. {entry.path === "/" ? "Home" : entry.path}</span>
                            <span className="text-sm font-semibold text-primary">{entry.count.toLocaleString()} views</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No web traffic recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
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

              {hasTicketedEvents && (
                <TicketHealthWidget
                  ticketedEvents={ticketedEventCount}
                  ticketCapacity={totalTicketCapacity}
                  ticketsSold={totalTicketsConfiguredSold}
                  ticketsRemaining={totalTicketsRemaining}
                  potentialRevenue={ticketRevenuePotential}
                />
              )}
              
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
              {hasTicketedEvents && (
                <TicketHealthWidget
                  ticketedEvents={ticketedEventCount}
                  ticketCapacity={totalTicketCapacity}
                  ticketsSold={totalTicketsConfiguredSold}
                  ticketsRemaining={totalTicketsRemaining}
                  potentialRevenue={ticketRevenuePotential}
                />
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                {hasTicketedEvents && (
                  <div className="card-glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{ticketedEventCount}</p>
                    <p className="text-xs text-muted-foreground">Ticketed Events</p>
                  </div>
                )}
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
                            refreshTabData("tickets");
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
                          if (confirm("This will archive all pending orders older than 24 hours (kept for records). Continue?")) {
                            const count = await deletePendingOrders(24);
                            if (count > 0) {
                              toast({
                                title: "Archived",
                                description: `${count} pending order(s) archived.`,
                              });
                              refreshTabData("tickets");
                            } else {
                              toast({ title: "No orders to archive", description: "All pending orders are less than 24 hours old." });
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Archive Old (24h+)
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
                        : ticketedEventCount > 0
                          ? `You have ${ticketedEventCount} ticketed event(s) live. Orders will appear here as soon as purchases start.`
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
                        { value: "30", label: "Last 30" },
                        { value: "120", label: "Last 120" },
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
                      <LineChart data={attendanceTrend}>
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
                    Showing {attendanceTrend.length} sessions • Avg: {
                      attendanceTrend.length > 0 
                        ? Math.round(attendanceTrend.reduce((sum, s) => sum + s.rate, 0) / attendanceTrend.length)
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
                      {selectedAttendanceExists && !canEditSelectedAttendance && attendanceEditDeadline && (
                        <span className="text-[10px] text-red-400 mt-0.5 block">
                          Editing locked after {attendanceEditDeadline.toLocaleDateString()}
                        </span>
                      )}
                      {selectedAttendanceExists && canEditSelectedAttendance && isAttendanceDateTemporarilyUnlocked(attendanceDate) && (
                        <span className="text-[10px] text-green-400 mt-0.5 block">Temporarily unlocked</span>
                      )}
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
                        disabled={!canTakeSelectedAttendance}
                        onClick={async () => {
                          if (members.length === 0) {
                            toast({
                              title: "No Members",
                              description: "Add members first before taking attendance.",
                              variant: "destructive",
                            });
                            return;
                          }

                          if (selectedAttendanceExists && !canEditSelectedAttendance) {
                            toast({
                              title: "Attendance Editing Restricted",
                              description: isAttendancePrivilegedEditor
                                ? `Attendance can only be edited within 3 days of the session date. This one locked on ${getAttendanceEditDeadline(attendanceDate).toLocaleDateString()}.`
                                : "Only Main Admin and Super Admin can edit already taken attendance.",
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
                        {!canTakeSelectedAttendance
                          ? 'Editing Restricted'
                          : selectedAttendanceExists
                            ? 'Edit Attendance'
                            : 'Start Attendance'}
                      </Button>
                    ) : canManageAttendance ? (
                      <div className="flex gap-2">
                        <Button
                          variant="gold"
                        onClick={async () => {
                          if (selectedAttendanceExists && !canEditSelectedAttendance) {
                            toast({
                              title: "Attendance Editing Restricted",
                              description: isAttendancePrivilegedEditor
                                ? `Attendance can only be edited within 3 days of the session date. This one locked on ${getAttendanceEditDeadline(attendanceDate).toLocaleDateString()}.`
                                : "Only Main Admin and Super Admin can edit already taken attendance.",
                              variant: "destructive",
                            });
                            return;
                          }
                          const records = members.map(m => ({
                            memberId: m.id,
                            memberName: m.name,
                            memberEmail: m.email,
                            memberVoice: m.voice,
                            status: attendanceRecords[m.id] || 'absent' as AttendanceStatus,
                          }));
                            
                            await saveAttendance(attendanceDate, records, sessionTitle, 'Admin');
                            await loadAttendanceData();
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

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          value={attendanceMemberSearch}
                          onChange={(e) => setAttendanceMemberSearch(e.target.value)}
                          placeholder="Search members by name, email, or voice"
                          className="pl-9 bg-secondary border-primary/20"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredAttendanceMembers.length} of {members.length}
                      </p>
                    </div>

                    {/* Members List */}
                    <div className="grid gap-2">
                      {filteredAttendanceMembers.map((member) => {
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

                    {members.length > 0 && filteredAttendanceMembers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No members match your attendance search.</p>
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
                      {canEditSelectedAttendance
                        ? 'Click "Edit Attendance" to modify the records.'
                        : isAttendancePrivilegedEditor
                          ? `Editing closed on ${attendanceEditDeadline?.toLocaleDateString()}. Use the lock action in history to request access.`
                          : 'Only Main Admin and Super Admin can edit already taken attendance.'}
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
                  <div className="max-h-[28rem] overflow-y-auto">
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
                        .map((session) => {
                        const canEditSession = isAttendancePrivilegedEditor
                          && (canEditAttendanceDate(session.date, isAttendancePrivilegedEditor) || isAttendanceDateTemporarilyUnlocked(session.date));
                        const sessionDeadline = getAttendanceEditDeadline(session.date);

                        return (
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
                            <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAttendanceSession(session)}
                              title="View attendance"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canManageAttendance && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (canEditSession) {
                                    toast({
                                      title: "Attendance Editable",
                                      description: `This attendance can be edited until ${sessionDeadline.toLocaleDateString()}. Open it with View to inspect or edit.`,
                                    });
                                    return;
                                  }

                                  requestAttendanceUnlock(session.date);
                                }}
                                title={canEditSession ? `Editable until ${sessionDeadline.toLocaleDateString()}` : "Request attendance unlock"}
                              >
                                <Lock className={cn("w-4 h-4", canEditSession ? "text-muted-foreground" : "text-yellow-500")} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAttendanceSession(session)}
                              title="Download attendance"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  </div>
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
                                          refreshTabData("leave");
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
                                          refreshTabData("leave");
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
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-semibold">Settings</h2>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              <div className="card-glass rounded-2xl p-6 w-full">
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
                      {googleConnectionStatus.connected
                        ? "Connected"
                        : googleConnectionStatus.reconnectRequired
                          ? "Reconnect Required"
                          : "Disconnected"}
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

                  <div>
                    <span className="text-muted-foreground">Target calendar:</span>{" "}
                    <span className="text-foreground">{googleConnectionStatus.calendarId || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Granted scope:</span>{" "}
                    <span className="text-foreground break-all">{googleConnectionStatus.scope || "N/A"}</span>
                  </div>

                  {googleConnectionStatus.statusMessage && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">
                      {googleConnectionStatus.statusMessage}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="gold" onClick={handleConnectGoogleFromSettings} disabled={googleConnectionLoading || !currentUser?.id}>
                    {googleConnectionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                    {googleConnectionStatus.connected ? "Reconnect Google" : "Connect Google"}
                  </Button>
                  <Button variant="outline" onClick={() => refreshGoogleIntegrationStatus(true)} disabled={googleConnectionLoading || !currentUser?.id}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", googleConnectionLoading && "animate-spin")} />
                    Refresh Status
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Birthday reminders sync automatically to Google Calendar when the account is connected and are not listed as regular Serenades events.
                </p>
              </div>

              {/* My Account Section */}
              <div className="card-glass rounded-2xl p-6 w-full">
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
              {(currentUser?.role === "super_admin" || currentUser?.role === "main_admin") && settings && (
              <>
              <div className="card-glass rounded-2xl p-6 w-full">
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
              <div className="card-glass rounded-2xl p-6 w-full">
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
              <div className="card-glass rounded-2xl p-6 w-full">
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
              <div className="card-glass rounded-2xl p-6 w-full">
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
              <div className="card-glass rounded-2xl p-6 w-full">
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
                                await approveUnlockRequest(req.id, currentUser?.name || "Admin", currentUser?.role, undefined, 3);
                                toast({ title: "Approved", description: `${CONTRIB_MONTH_NAMES[req.month - 1]} ${req.year} unlocked for 3 days.` });
                                const requester = req.requestedById ? await getAdminById(req.requestedById) : null;
                                if (requester) {
                                  notifyUnlockRequestDecision(requester.email, requester.name, req.month, req.year, "approved", currentUser?.name || "Admin", 3);
                                }
                                refreshTabData("settings");
                              }}
                            >
                              Approve (3 days)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await denyUnlockRequest(req.id, currentUser?.name || "Admin", currentUser?.role, "Denied by admin");
                                toast({ title: "Denied", description: "Unlock request denied." });
                                const requester = req.requestedById ? await getAdminById(req.requestedById) : null;
                                if (requester) {
                                  notifyUnlockRequestDecision(requester.email, requester.name, req.month, req.year, "denied", currentUser?.name || "Admin");
                                }
                                refreshTabData("settings");
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
              <div className="card-glass rounded-2xl p-6 w-full">
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
              <div className="w-full">
                <BackupRestore />
              </div>
              </>
              )}

              {!settings && (
                <div className="card-glass rounded-2xl p-6 w-full xl:col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Settings data is still loading. Google Meet connection is available above.
                  </p>
                </div>
              )}

              </div>

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
          refreshCoreData();
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
          refreshCoreData();
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
          refreshCoreData();
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
          refreshTabData("gallery");
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
        onSuccess={() => refreshTabData("releases")}
        editAlbum={editingAlbum}
      />

      <AddMusicVideoModal
        isOpen={showAddMusicVideo}
        onClose={() => { setShowAddMusicVideo(false); setEditingMusicVideo(null); }}
        onSuccess={() => refreshTabData("releases")}
        editVideo={editingMusicVideo}
      />

      <Dialog open={!!viewingAttendanceSession} onOpenChange={(open) => {
        if (!open) {
          setViewingAttendanceSession(null);
          setViewingAttendanceRecords([]);
        }
      }}>
        <DialogContent className="w-[min(96vw,72rem)] max-w-5xl bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Attendance Details
            </DialogTitle>
            <DialogDescription>
              Review the member-by-member attendance breakdown for the selected session and export it if needed.
            </DialogDescription>
          </DialogHeader>
          {viewingAttendanceSession && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 bg-secondary/20 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{new Date(`${viewingAttendanceSession.date}T00:00:00`).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Session</p>
                  <p className="font-medium text-foreground">{viewingAttendanceSession.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recorded Members</p>
                  <p className="font-medium text-foreground">{viewingAttendanceRecords.length}</p>
                </div>
              </div>

              <div className="max-h-[30rem] overflow-auto rounded-xl border border-primary/10">
                <table className="w-full">
                  <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
                    <tr>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Member</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Voice</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingAttendanceRecords.map((record) => (
                      <tr key={record.id} className="border-t border-primary/10">
                        <td className="p-3 text-sm text-foreground">{record.memberName}</td>
                        <td className="p-3 text-sm text-muted-foreground">{record.memberEmail || "N/A"}</td>
                        <td className="p-3 text-sm text-muted-foreground">{record.memberVoice}</td>
                        <td className="p-3 text-sm text-muted-foreground">{new Date(`${record.date}T00:00:00`).toLocaleDateString()}</td>
                        <td className="p-3 text-sm text-foreground">
                          <span className={cn("inline-flex min-w-20 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium capitalize", getAttendanceStatusBadgeClass(record.status))}>
                            {formatAttendanceStatusLabel(record.status)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{record.markedBy || "N/A"}</td>
                      </tr>
                    ))}
                    {viewingAttendanceRecords.length === 0 && (
                      <tr className="border-t border-primary/10">
                        <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                          No member-level attendance records were found for this session. The session summary exists, but the detailed member rows for this date are missing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownloadAttendanceSession(viewingAttendanceSession)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {isAttendancePrivilegedEditor && (
                  canEditAttendanceDate(viewingAttendanceSession.date, currentUser?.role === "super_admin")
                  || isAttendanceDateTemporarilyUnlocked(viewingAttendanceSession.date)
                ) && (
                  <Button variant="gold" onClick={() => openAttendanceSessionForEdit(viewingAttendanceSession)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Attendance
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Profile Viewer */}
      <Dialog open={!!viewingMember} onOpenChange={(open) => { if (!open) setViewingMember(null); }}>
        <DialogContent className="max-w-md bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Member Profile
            </DialogTitle>
            <DialogDescription>
              View the selected choir member&apos;s profile details, status, and contact information.
            </DialogDescription>
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
