import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAllOrders, updateOrderStatus, confirmOrder, getOrderStats, type TicketOrder } from "@/lib/ticketService";
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
  type LeaveRequest,
} from "@/lib/leaveService";
import {
  getAllAttendanceRecords,
  getAttendanceByDate,
  getRecentSessions,
  saveAttendance,
  deleteAttendanceForDate,
  hasAttendanceForDate,
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
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AdminTeamManagement } from "@/components/admin/AdminTeamManagement";
import { AuditLogPage } from "@/components/admin/AuditLogPage";
import { BarChart3, Shield, History } from "lucide-react";
import { addAuditLog } from "@/lib/adminService";

type Tab = "dashboard" | "members" | "events" | "tickets" | "attendance" | "leave" | "releases" | "promos" | "gallery" | "analytics" | "team" | "audit" | "settings";

const sidebarItems = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
  { id: "members" as Tab, label: "Members", icon: Users },
  { id: "events" as Tab, label: "Events", icon: Calendar },
  { id: "tickets" as Tab, label: "Ticket Orders", icon: Ticket },
  { id: "attendance" as Tab, label: "Attendance", icon: UserCheck },
  { id: "leave" as Tab, label: "Leave Requests", icon: CalendarOff },
  { id: "releases" as Tab, label: "Releases", icon: Disc3 },
  { id: "promos" as Tab, label: "Promo Codes", icon: Tag },
  { id: "gallery" as Tab, label: "Gallery", icon: Image },
  { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
  { id: "team" as Tab, label: "Admin Team", icon: Shield, superAdminOnly: true },
  { id: "audit" as Tab, label: "Audit Log", icon: History, superAdminOnly: true },
  { id: "settings" as Tab, label: "Settings", icon: Settings },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, logout, isSuperAdmin, currentUser } = useAuth();
  const { toast } = useToast();

  // Filter sidebar items based on role
  const visibleSidebarItems = sidebarItems.filter(
    item => !item.superAdminOnly || isSuperAdmin
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
  
  // Attendance state
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [memberId: string]: AttendanceStatus }>({});
  const [sessionTitle, setSessionTitle] = useState("Regular Practice");
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
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
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingMusicVideo, setEditingMusicVideo] = useState<MusicVideo | null>(null);
  const [viewingOrder, setViewingOrder] = useState<TicketOrder | null>(null);

  // Filter states
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "confirmed" | "used">("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  // Settings state
  const [settings, setSettingsState] = useState(getSettings());

  // Load data
  const loadData = () => {
    setMembers(getAllMembers());
    setEvents(getAllEvents());
    setGallery(getAllGalleryItems());
    setOrders(getAllOrders());
    setPromoCodes(getAllPromoCodes());
    setAlbums(getAllAlbums());
    setMusicVideos(getAllMusicVideos());
    setStreamingPlatforms(getAllPlatforms());
    setLeaveRequests(getAllLeaveRequests());
    setAttendanceSessions(getRecentSessions(20));
    setDashboardStats(getDashboardStats());
  };

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

  // Order actions
  const handleConfirmOrder = (orderId: string) => {
    // Use confirmOrder which also reduces ticket availability
    const updated = confirmOrder(orderId);
    if (updated) {
      // Dispatch event to update Events page
      window.dispatchEvent(new Event("eventsUpdated"));
      loadData();
      toast({ title: "Order Confirmed", description: `Order ${updated.txRef} has been confirmed.` });
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const updated = updateOrderStatus(orderId, "cancelled");
    if (updated) {
      loadData();
      toast({ title: "Order Cancelled", description: `Order ${updated.txRef} has been cancelled.` });
    }
  };

  const handleMarkUsed = (orderId: string) => {
    const updated = updateOrderStatus(orderId, "used");
    if (updated) {
      loadData();
      toast({ title: "Ticket Used", description: `Order ${updated.txRef} marked as used.` });
    }
  };


  // Delete actions
  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the choir?`)) {
      deleteMember(id);
      loadData();
      toast({ title: "Member Removed", description: `${name} has been removed.` });
    }
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteEvent(id);
      loadData();
      toast({ title: "Event Deleted", description: `"${title}" has been deleted.` });
    }
  };

  const handleDeleteGalleryItem = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteGalleryItem(id);
      loadData();
      toast({ title: "Media Deleted", description: `"${title}" has been removed.` });
    }
  };

  const handleDeleteAlbum = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete album "${title}"?`)) {
      deleteAlbum(id);
      loadData();
      toast({ title: "Album Deleted", description: `"${title}" has been removed.` });
    }
  };

  const handleDeleteMusicVideo = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMusicVideo(id);
      loadData();
      toast({ title: "Video Deleted", description: `"${title}" has been removed.` });
    }
  };

  // Settings save
  const handleSaveSettings = () => {
    updateSettings(settings);
    toast({ title: "Settings Saved", description: "Your changes have been saved." });
  };

  const orderStats = getOrderStats();

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
                <p className="text-xs text-muted-foreground">Serenades of Praise</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {visibleSidebarItems.map((item) => (
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
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.superAdminOnly && (
                  <Shield className="w-3 h-3 ml-auto text-primary" />
                )}
              </button>
            ))}
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
                {currentUser?.role === "super_admin" ? "Super Admin" : "Admin"}
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
      <div className="flex-1 flex flex-col min-h-screen">
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
                {currentUser?.role === "super_admin" ? "Super Admin" : "Admin"}
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
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-glass rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Members</p>
                  <p className="text-3xl font-bold gold-text">{dashboardStats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    +{dashboardStats.newMembersThisMonth} this month
                  </p>
                </div>
                <div className="card-glass rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground mb-1">Upcoming Events</p>
                  <p className="text-3xl font-bold gold-text">{dashboardStats.upcomingEvents}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Next: {dashboardStats.nextEvent}
                  </p>
                </div>
                <div className="card-glass rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground mb-1">Ticket Revenue</p>
                  <p className="text-3xl font-bold gold-text">{formatCurrency(orderStats.revenue)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{orderStats.total} orders</p>
                </div>
                <div className="card-glass rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground mb-1">Gallery Items</p>
                  <p className="text-3xl font-bold gold-text">{gallery.length}</p>
                  <p className="text-xs text-muted-foreground mt-2">Photos & Videos</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <Button variant="gold" onClick={() => setShowAddEvent(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                  <Button variant="gold-outline" onClick={() => setShowAddMember(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                  <Button variant="outline" onClick={() => setShowUploadGallery(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload to Gallery
                  </Button>
                  <Link to="/scanner">
                    <Button variant="outline">
                      <QrCode className="w-4 h-4 mr-2" />
                      Ticket Scanner
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Recent Events */}
              <div>
                <h2 className="font-display text-lg font-semibold mb-4">Upcoming Events</h2>
                <div className="card-glass rounded-2xl overflow-hidden">
                  {events.length > 0 ? (
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
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No events yet. Create your first event to get started!</p>
                      <div className="flex gap-3 justify-center mt-4">
                        <Button variant="gold" onClick={() => setShowAddEvent(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Event
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="font-display text-lg font-semibold">All Members ({members.length})</h2>
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
                  <Button variant="gold" onClick={() => { setEditingMember(null); setShowAddMember(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </div>
              
              <div className="card-glass rounded-2xl overflow-hidden">
                {filteredMembers.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Voice</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="border-t border-primary/10">
                          <td className="p-4 font-medium text-foreground">{member.name}</td>
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
                              onClick={() => { setEditingMember(member); setShowAddMember(true); }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMember(member.id, member.name)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingEvent(event); setShowAddEvent(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id, event.title)}
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
                  <p className="text-2xl font-bold text-primary">{getOverallAttendanceStats().avgAttendance}%</p>
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
                        onClick={() => {
                          if (members.length === 0) {
                            toast({
                              title: "No Members",
                              description: "Add members first before taking attendance.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Pre-fill with existing attendance if any
                          const existing = getAttendanceByDate(attendanceDate);
                          const existingMap: { [key: string]: AttendanceStatus } = {};
                          existing.forEach(r => {
                            existingMap[r.memberId] = r.status;
                          });
                          
                          // Also check for members on leave
                          const onLeave = getMembersToExcuse(attendanceDate);
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
                        {hasAttendanceForDate(attendanceDate) ? 'Edit Attendance' : 'Start Attendance'}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="gold"
                          onClick={() => {
                            const records = members.map(m => ({
                              memberId: m.id,
                              memberName: m.name,
                              memberEmail: m.email,
                              memberVoice: m.voice,
                              status: attendanceRecords[m.id] || 'absent' as AttendanceStatus,
                            }));
                            
                            saveAttendance(attendanceDate, records, sessionTitle, 'Admin');
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
                        const onLeave = getMembersToExcuse(attendanceDate).find(l => l.memberId === member.id);
                        
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

                {!isTakingAttendance && hasAttendanceForDate(attendanceDate) && (
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
                              onClick={() => {
                                setAttendanceDate(session.date);
                                setSessionTitle(session.title);
                                const existing = getAttendanceByDate(session.date);
                                const existingMap: { [key: string]: AttendanceStatus } = {};
                                existing.forEach(r => { existingMap[r.memberId] = r.status; });
                                setAttendanceRecords(existingMap);
                                setIsTakingAttendance(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete attendance for ${new Date(session.date).toLocaleDateString()}?`)) {
                                  deleteAttendanceForDate(session.date);
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{leaveRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {leaveRequests.filter(r => r.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
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
                  {(["all", "pending", "approved", "denied"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLeaveFilter(filter)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize",
                        leaveFilter === filter
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter}
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
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                                request.status === "approved" && "bg-green-500/20 text-green-400",
                                request.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                                request.status === "denied" && "bg-red-500/20 text-red-400"
                              )}>
                                {request.status === "approved" && <CheckCircle className="w-3 h-3" />}
                                {request.status === "pending" && <Clock className="w-3 h-3" />}
                                {request.status === "denied" && <XCircle className="w-3 h-3" />}
                                {request.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {request.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400 hover:text-green-300"
                                    onClick={() => {
                                      approveLeaveRequest(request.id, "Admin");
                                      loadData();
                                      toast({
                                        title: "Leave Approved",
                                        description: `${request.memberName}'s leave request has been approved.`,
                                      });
                                    }}
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => {
                                      const notes = prompt("Reason for denial (optional):");
                                      denyLeaveRequest(request.id, "Admin", notes || undefined);
                                      loadData();
                                      toast({
                                        title: "Leave Denied",
                                        description: `${request.memberName}'s leave request has been denied.`,
                                      });
                                    }}
                                    title="Deny"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {request.status !== "pending" && request.reviewedBy && (
                                <span className="text-xs text-muted-foreground">
                                  by {request.reviewedBy}
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

          {/* Gallery */}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Manage Gallery ({gallery.length})</h2>
                <Button variant="gold" onClick={() => setShowUploadGallery(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </div>
              
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((item) => (
                    <div key={item.id} className="card-glass rounded-xl overflow-hidden group relative">
                      <div className="aspect-square relative">
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Image";
                          }}
                        />
                        {item.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                            <Video className="w-12 h-12 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteGalleryItem(item.id, item.title)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-foreground text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-glass rounded-2xl p-12 text-center">
                  <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">No media in gallery yet.</p>
                  <Button variant="gold" onClick={() => setShowUploadGallery(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Promo Codes */}
          {activeTab === "promos" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Promo Codes ({promoCodes.length})</h2>
                <Button
                  variant="gold"
                  onClick={() => {
                    const code = createPromoCode({
                      discountType: "percentage",
                      discountValue: 10,
                      minPurchase: 5000,
                      maxUses: 50,
                      validFrom: new Date().toISOString(),
                      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      isActive: true,
                    });
                    loadData();
                    toast({
                      title: "Promo Code Created",
                      description: `Code ${code.code} has been created (10% off).`,
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Promo Code
                </Button>
              </div>

              <div className="card-glass rounded-2xl overflow-hidden">
                {promoCodes.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Code</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Discount</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Min. Purchase</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Uses</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.map((promo) => {
                        const isExpired = new Date(promo.validUntil) < new Date();
                        const isActive = promo.isActive && !isExpired;
                        return (
                          <tr key={promo.id} className="border-t border-primary/10">
                            <td className="p-4">
                              <span className="font-mono font-bold text-primary">{promo.code}</span>
                            </td>
                            <td className="p-4">
                              <span className="flex items-center gap-1 text-foreground">
                                <Percent className="w-4 h-4 text-primary" />
                                {promo.discountType === "percentage"
                                  ? `${promo.discountValue}%`
                                  : formatCurrency(promo.discountValue)}
                              </span>
                            </td>
                            <td className="p-4 text-muted-foreground hidden md:table-cell">
                              {formatCurrency(promo.minPurchase)}
                            </td>
                            <td className="p-4 text-muted-foreground hidden md:table-cell">
                              {promo.usedCount} / {promo.maxUses || "∞"}
                            </td>
                            <td className="p-4">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-semibold",
                                  isActive
                                    ? "bg-green-500/20 text-green-400"
                                    : isExpired
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                )}
                              >
                                {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  updatePromoCode(promo.id, { isActive: !promo.isActive });
                                  loadData();
                                  toast({
                                    title: promo.isActive ? "Code Deactivated" : "Code Activated",
                                    description: `${promo.code} is now ${promo.isActive ? "inactive" : "active"}.`,
                                  });
                                }}
                                title={promo.isActive ? "Deactivate" : "Activate"}
                              >
                                {promo.isActive ? (
                                  <XCircle className="w-4 h-4 text-yellow-500" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Delete promo code ${promo.code}?`)) {
                                    deletePromoCode(promo.id);
                                    loadData();
                                    toast({ title: "Promo Code Deleted" });
                                  }
                                }}
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
                  <div className="p-12 text-center">
                    <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No Promo Codes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create promo codes to offer discounts on ticket purchases.
                    </p>
                    <Button
                      variant="gold"
                      onClick={() => {
                        const code = createPromoCode({
                          discountType: "percentage",
                          discountValue: 10,
                          minPurchase: 5000,
                          maxUses: 50,
                          validFrom: new Date().toISOString(),
                          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                          isActive: true,
                        });
                        loadData();
                        toast({
                          title: "Promo Code Created",
                          description: `Code ${code.code} has been created (10% off).`,
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Code
                    </Button>
                  </div>
                )}
              </div>

              <div className="card-glass rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Create</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const code = createPromoCode({
                        discountType: "percentage",
                        discountValue: 10,
                        minPurchase: 0,
                        maxUses: 100,
                        validFrom: new Date().toISOString(),
                        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        isActive: true,
                      });
                      loadData();
                      toast({ title: "Created!", description: `Code: ${code.code} (10% off, 7 days)` });
                    }}
                  >
                    10% Off (7 days)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const code = createPromoCode({
                        discountType: "percentage",
                        discountValue: 20,
                        minPurchase: 10000,
                        maxUses: 50,
                        validFrom: new Date().toISOString(),
                        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                        isActive: true,
                      });
                      loadData();
                      toast({ title: "Created!", description: `Code: ${code.code} (20% off, 14 days)` });
                    }}
                  >
                    20% Off (14 days)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const code = createPromoCode({
                        discountType: "fixed",
                        discountValue: 5000,
                        minPurchase: 15000,
                        maxUses: 30,
                        validFrom: new Date().toISOString(),
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        isActive: true,
                      });
                      loadData();
                      toast({ title: "Created!", description: `Code: ${code.code} (5,000 RWF off, 30 days)` });
                    }}
                  >
                    5,000 RWF Off (30 days)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Releases */}
          {activeTab === "releases" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-glass rounded-xl p-4 text-center">
                  <Disc3 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{albums.length}</p>
                  <p className="text-xs text-muted-foreground">Albums</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{musicVideos.length}</p>
                  <p className="text-xs text-muted-foreground">Music Videos</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <Music className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {albums.reduce((sum, a) => sum + a.trackCount, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Tracks</p>
                </div>
                <div className="card-glass rounded-xl p-4 text-center">
                  <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {musicVideos.filter((v) => v.isFeatured).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
              </div>

              {/* Streaming Platforms Section */}
              <div className="card-glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Streaming Platforms</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage which platforms appear in the "Listen Everywhere" banner
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {streamingPlatforms.map((platform) => (
                    <div
                      key={platform.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        platform.isVisible
                          ? "bg-primary/10 border-primary/30"
                          : "bg-secondary/30 border-transparent opacity-60"
                      }`}
                    >
                      <Switch
                        checked={platform.isVisible}
                        onCheckedChange={(checked) => {
                          const updated = streamingPlatforms.map((p) =>
                            p.id === platform.id ? { ...p, isVisible: checked } : p
                          );
                          setStreamingPlatforms(updated);
                          updateAllPlatforms(updated);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{platform.name}</p>
                        <Input
                          placeholder="Artist profile URL (optional)"
                          value={platform.url}
                          onChange={(e) => {
                            const updated = streamingPlatforms.map((p) =>
                              p.id === platform.id ? { ...p, url: e.target.value } : p
                            );
                            setStreamingPlatforms(updated);
                            updateAllPlatforms(updated);
                          }}
                          className="mt-1 h-7 text-xs bg-secondary/50 border-primary/10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Toggle platforms on/off to show in the public "Listen Everywhere" banner. 
                  Add your artist profile URLs for each platform (optional).
                </p>
              </div>

              {/* Albums Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Albums ({albums.length})</h2>
                  <Button variant="gold" onClick={() => { setEditingAlbum(null); setShowAddAlbum(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Album
                  </Button>
                </div>

                {albums.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map((album) => (
                      <div key={album.id} className="card-glass rounded-2xl overflow-hidden group">
                        <div className="relative aspect-square">
                          <img
                            src={album.coverImage}
                            alt={album.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Album";
                            }}
                          />
                          {album.isLatest && (
                            <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                              Latest
                            </span>
                          )}
                          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingAlbum(album); setShowAddAlbum(true); }}
                            >
                              <Pencil className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAlbum(album.id, album.title)}
                            >
                              <Trash2 className="w-5 h-5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground">{album.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {album.year} • {album.trackCount} tracks
                          </p>
                          {album.listenUrl && (
                            <p className="text-xs text-primary mt-1 truncate">
                              🔗 {album.listenUrl.slice(0, 30)}...
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-glass rounded-2xl p-8 text-center">
                    <Disc3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">No albums yet. Add your first album!</p>
                    <Button variant="gold" onClick={() => setShowAddAlbum(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Album
                    </Button>
                  </div>
                )}
              </div>

              {/* Music Videos Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Music Videos ({musicVideos.length})</h2>
                  <Button variant="gold" onClick={() => { setEditingMusicVideo(null); setShowAddMusicVideo(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                </div>

                {musicVideos.length > 0 ? (
                  <div className="card-glass rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Video</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">YouTube ID</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {musicVideos.map((video) => (
                          <tr key={video.id} className="border-t border-primary/10">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-10 rounded overflow-hidden shrink-0">
                                  <img
                                    src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{video.title}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <a
                                href={`https://youtube.com/watch?v=${video.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                              >
                                {video.youtubeId}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1 flex-wrap">
                                {video.isLatest && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                                    Latest
                                  </span>
                                )}
                                {video.isFeatured && (
                                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingMusicVideo(video); setShowAddMusicVideo(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMusicVideo(video.id, video.title)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card-glass rounded-2xl p-8 text-center">
                    <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">No music videos yet.</p>
                    <Button variant="gold" onClick={() => setShowAddMusicVideo(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Music Video
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Admin Team (Super Admin Only) */}
          {activeTab === "team" && isSuperAdmin && (
            <AdminTeamManagement />
          )}

          {/* Audit Log (Super Admin Only) */}
          {activeTab === "audit" && isSuperAdmin && (
            <AuditLogPage />
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-semibold">Settings</h2>
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

              {/* Clear All Data Section */}
              <div className="card-glass rounded-2xl p-6 max-w-2xl border border-destructive/20">
                <h3 className="font-semibold text-destructive mb-2">Reset All Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This will permanently delete all data including members, events, gallery items, releases, promo codes, and ticket orders. This action cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
                      // Clear all localStorage keys
                      localStorage.removeItem("serenades_members");
                      localStorage.removeItem("serenades_events");
                      localStorage.removeItem("serenades_gallery");
                      localStorage.removeItem("serenades_donations");
                      localStorage.removeItem("serenades_settings");
                      localStorage.removeItem("sop_albums");
                      localStorage.removeItem("sop_music_videos");
                      localStorage.removeItem("sop_promo_codes");
                      localStorage.removeItem("sop_ticket_orders");
                      loadData();
                      toast({
                        title: "All Data Cleared",
                        description: "All data has been permanently deleted.",
                      });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => { setShowAddMember(false); setEditingMember(null); }}
        onSuccess={loadData}
        editMember={editingMember}
      />

      <AddEventModal
        isOpen={showAddEvent}
        onClose={() => { setShowAddEvent(false); setEditingEvent(null); }}
        onSuccess={loadData}
        editEvent={editingEvent}
      />

      <UploadGalleryModal
        isOpen={showUploadGallery}
        onClose={() => setShowUploadGallery(false)}
        onSuccess={loadData}
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
