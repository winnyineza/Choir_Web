import { useState, useEffect } from "react";
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
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Heart,
  Ticket,
  CheckCircle,
  AlertTriangle,
  Target,
  Activity,
  UserCheck,
  UserPlus,
  CalendarOff,
  Mail,
  BarChart3,
  Globe,
  MousePointer,
  Eye,
  Cake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllMembers, getUpcomingEvents, getUpcomingBirthdays, type Member } from "@/lib/dataService";
import { getAllOrders } from "@/lib/ticketService";
import { getAllContributions, getContributionStats } from "@/lib/contributionService";
import { getAllExpenses } from "@/lib/expenseService";
import { getAllDonations } from "@/lib/donationService";
import { getAllLeaveRequests } from "@/lib/leaveService";
import { getUnreadCount as getUnreadContactCount } from "@/lib/contactService";
import { getRecentSessions, getOverallAttendanceStats } from "@/lib/attendanceService";
import { getPageViewStats } from "@/lib/analyticsService";
import { formatCurrency } from "@/lib/flutterwave";

interface ExecutiveDashboardProps {
  onNavigate: (tab: string) => void;
}

export function ExecutiveDashboard({ onNavigate }: ExecutiveDashboardProps) {
  const [stats, setStats] = useState({
    // Financial
    totalRevenue: 0,
    contributions: 0,
    donations: 0,
    ticketSales: 0,
    expenses: 0,
    netBalance: 0,
    collectionRate: 0,
    // Members
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0,
    memberGrowth: 0,
    // Events
    upcomingEvents: 0,
    totalTicketsSold: 0,
    avgCheckInRate: 0,
    // Engagement
    pendingLeave: 0,
    unreadMessages: 0,
    attendanceRate: 0,
    recentSessions: 0,
  });

  const [pageStats, setPageStats] = useState({
    totalViews: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
    viewsByPage: [] as { path: string; title: string; count: number }[],
    viewsByDay: [] as { date: string; views: number }[],
    viewsByHour: [] as { hour: number; views: number }[],
  });

  const [voiceDistribution, setVoiceDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [revenueBySource, setRevenueBySource] = useState<{ name: string; value: number; color: string }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; income: number; expenses: number }[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<{ member: Member; daysUntil: number; date: string }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load all data
    const members = getAllMembers();
    const events = getUpcomingEvents();
    const orders = getAllOrders();
    const contributions = getAllContributions();
    const expenses = getAllExpenses();
    const donations = getAllDonations();
    const leaveRequests = getAllLeaveRequests();
    const contributionStats = getContributionStats();
    const attendanceStats = getOverallAttendanceStats();
    const sessions = getRecentSessions(10);
    const analyticsStats = getPageViewStats();
    const birthdays = getUpcomingBirthdays(7);

    // Set page stats
    setPageStats(analyticsStats);
    setUpcomingBirthdays(birthdays);

    // Calculate financials
    const confirmedOrders = orders.filter(o => o.status === "confirmed");
    const ticketRevenue = confirmedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const contributionTotal = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const donationTotal = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalRevenue = ticketRevenue + contributionTotal + donationTotal;

    // Member stats
    const activeMembers = members.filter(m => m.status === "Active").length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = members.filter(m => new Date(m.joinedDate) >= thisMonth).length;
    
    // Calculate member growth (compare to last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    const membersLastMonth = members.filter(m => new Date(m.joinedDate) < thisMonth).length;
    const memberGrowth = membersLastMonth > 0 ? ((members.length - membersLastMonth) / membersLastMonth * 100) : 0;

    // Collection rate
    const expectedTotal = contributionStats.totalCollected + contributionStats.outstandingDues;
    const collectionRate = expectedTotal > 0 ? (contributionStats.totalCollected / expectedTotal * 100) : 100;

    // Ticket stats
    const totalTicketsSold = confirmedOrders.reduce((sum, o) => sum + (o.ticketQuantity || 0), 0);
    const usedTickets = orders.filter(o => o.status === "used").length;
    const avgCheckInRate = confirmedOrders.length > 0 ? (usedTickets / confirmedOrders.length * 100) : 0;

    setStats({
      totalRevenue,
      contributions: contributionTotal,
      donations: donationTotal,
      ticketSales: ticketRevenue,
      expenses: expenseTotal,
      netBalance: totalRevenue - expenseTotal,
      collectionRate,
      totalMembers: members.length,
      activeMembers,
      newThisMonth,
      memberGrowth,
      upcomingEvents: events.length,
      totalTicketsSold,
      avgCheckInRate,
      pendingLeave: leaveRequests.filter(l => l.status === "pending").length,
      unreadMessages: getUnreadContactCount(),
      attendanceRate: attendanceStats.avgAttendance || 0,
      recentSessions: sessions.length,
    });

    // Voice distribution
    const voiceCounts: Record<string, number> = { Soprano: 0, Alto: 0, Tenor: 0, Bass: 0 };
    members.forEach(m => {
      if (voiceCounts[m.voice] !== undefined) {
        voiceCounts[m.voice]++;
      }
    });
    setVoiceDistribution([
      { name: "Soprano", value: voiceCounts.Soprano, color: "#F59E0B" },
      { name: "Alto", value: voiceCounts.Alto, color: "#10B981" },
      { name: "Tenor", value: voiceCounts.Tenor, color: "#3B82F6" },
      { name: "Bass", value: voiceCounts.Bass, color: "#8B5CF6" },
    ]);

    // Revenue by source
    setRevenueBySource([
      { name: "Contributions", value: contributionTotal, color: "#F59E0B" },
      { name: "Tickets", value: ticketRevenue, color: "#3B82F6" },
      { name: "Donations", value: donationTotal, color: "#10B981" },
    ]);

    // Monthly trend (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData: { month: string; income: number; expenses: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.toISOString();
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthEnd = nextMonth.toISOString();
      
      const monthIncome = contributions
        .filter(c => c.createdAt >= monthStart && c.createdAt < monthEnd)
        .reduce((sum, c) => sum + c.amount, 0) +
        donations
        .filter(d => d.createdAt >= monthStart && d.createdAt < monthEnd)
        .reduce((sum, d) => sum + d.amount, 0) +
        confirmedOrders
        .filter(o => o.createdAt >= monthStart && o.createdAt < monthEnd)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const monthExpenses = expenses
        .filter(e => e.date >= monthStart.split('T')[0] && e.date < monthEnd.split('T')[0])
        .reduce((sum, e) => sum + e.amount, 0);
      
      trendData.push({
        month: monthNames[date.getMonth()],
        income: monthIncome,
        expenses: monthExpenses,
      });
    }
    setMonthlyTrend(trendData);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Colors for page view chart
  const PAGE_COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444"];

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Balance Card */}
        <div className="card-glass rounded-2xl p-6 border border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Balance</p>
              <p className={cn(
                "text-3xl font-bold",
                stats.netBalance >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {formatCurrency(stats.netBalance)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>{formatCurrency(stats.totalRevenue)} income</span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-4 h-4" />
              <span>{formatCurrency(stats.expenses)} spent</span>
            </div>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold text-foreground">{(stats.collectionRate || 0).toFixed(0)}%</p>
              </div>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div 
              className={cn(
                "h-3 rounded-full transition-all",
                stats.collectionRate >= 80 ? "bg-green-500" :
                stats.collectionRate >= 50 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${Math.min(stats.collectionRate || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formatCurrency(stats.contributions)} collected
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold text-foreground">{(stats.attendanceRate || 0).toFixed(0)}%</p>
              </div>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div 
              className={cn(
                "h-3 rounded-full transition-all",
                stats.attendanceRate >= 80 ? "bg-green-500" :
                stats.attendanceRate >= 60 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${Math.min(stats.attendanceRate || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.recentSessions} sessions recorded
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <button onClick={() => onNavigate("members")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold">{stats.totalMembers}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Members</p>
        </button>
        
        <button onClick={() => onNavigate("members")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-green-400" />
            <span className="text-lg font-bold text-green-400">+{stats.newThisMonth}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">New This Month</p>
        </button>
        
        <button onClick={() => onNavigate("events")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold">{stats.upcomingEvents}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Upcoming Events</p>
        </button>
        
        <button onClick={() => onNavigate("tickets")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold">{stats.totalTicketsSold}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Tickets Sold</p>
        </button>
        
        <button onClick={() => onNavigate("contributions")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold">{formatCompact(stats.contributions)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Contributions</p>
        </button>
        
        <button onClick={() => onNavigate("treasury")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-lg font-bold">{formatCompact(stats.donations)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Donations</p>
        </button>
        
        <button onClick={() => onNavigate("leave")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <CalendarOff className="w-4 h-4 text-yellow-400" />
            <span className={cn("text-lg font-bold", stats.pendingLeave > 0 && "text-yellow-400")}>{stats.pendingLeave}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Pending Leave</p>
        </button>
        
        <button onClick={() => onNavigate("messages")} className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all text-left">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className={cn("text-lg font-bold", stats.unreadMessages > 0 && "text-blue-400")}>{stats.unreadMessages}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Unread Messages</p>
        </button>
      </div>

      {/* Website Traffic Section */}
      <div className="card-glass rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Website Traffic
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{pageStats.totalViews}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-primary">{pageStats.todayViews}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{pageStats.weekViews}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{pageStats.monthViews}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Views Chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Daily Page Views (Last 7 Days)
            </h4>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pageStats.viewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  />
                  <Bar dataKey="views" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Pages */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <MousePointer className="w-3 h-3" />
              Most Visited Pages
            </h4>
            <div className="space-y-2">
              {pageStats.viewsByPage.slice(0, 5).map((page, index) => (
                <div key={page.path} className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: PAGE_COLORS[index % PAGE_COLORS.length] }}
                  />
                  <span className="text-sm text-foreground flex-1 truncate">{page.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${pageStats.totalViews > 0 ? (page.count / pageStats.totalViews) * 100 : 0}%`,
                          backgroundColor: PAGE_COLORS[index % PAGE_COLORS.length]
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{page.count}</span>
                  </div>
                </div>
              ))}
              {pageStats.viewsByPage.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No page views recorded yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="card-glass rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Revenue Trend (6 Months)
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#F59E0B" 
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="card-glass rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Revenue by Source
          </h3>
          <div className="h-[200px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {revenueBySource.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {revenueBySource.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-primary/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Total</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(stats.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Birthdays */}
        <div className="card-glass rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Cake className="w-4 h-4 text-pink-400" />
            Upcoming Birthdays
          </h3>
          <div className="space-y-2">
            {upcomingBirthdays.length > 0 ? (
              upcomingBirthdays.slice(0, 5).map((birthday, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    birthday.daysUntil === 0 
                      ? "bg-pink-500/20 border border-pink-500/30" 
                      : "bg-secondary/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    birthday.daysUntil === 0 
                      ? "bg-pink-500 text-white" 
                      : "bg-primary/20 text-primary"
                  )}>
                    {birthday.member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {birthday.member.name.split(' ')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {birthday.daysUntil === 0 
                        ? "🎂 Today!" 
                        : birthday.daysUntil === 1 
                          ? "Tomorrow" 
                          : `${birthday.date}`
                      }
                    </p>
                  </div>
                  {birthday.daysUntil > 0 && (
                    <span className="text-xs text-muted-foreground">
                      in {birthday.daysUntil}d
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming birthdays this week
              </p>
            )}
          </div>
        </div>

        {/* Voice Distribution */}
        <div className="card-glass rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Voice Distribution
          </h3>
          <div className="space-y-3">
            {voiceDistribution.map((voice, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{voice.name}</span>
                  <span className="text-sm font-medium">{voice.value} ({stats.totalMembers > 0 ? ((voice.value / stats.totalMembers) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${stats.totalMembers > 0 ? (voice.value / stats.totalMembers) * 100 : 0}%`,
                      backgroundColor: voice.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="card-glass rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Action Items
          </h3>
          <div className="space-y-2">
            {stats.pendingLeave > 0 && (
              <button 
                onClick={() => onNavigate("leave")}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
              >
                <CalendarOff className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-foreground">{stats.pendingLeave} leave request(s) pending</span>
              </button>
            )}
            {stats.unreadMessages > 0 && (
              <button 
                onClick={() => onNavigate("messages")}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-foreground">{stats.unreadMessages} unread message(s)</span>
              </button>
            )}
            {stats.collectionRate < 70 && (
              <button 
                onClick={() => onNavigate("contributions")}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <Target className="w-4 h-4 text-red-400" />
                <span className="text-sm text-foreground">Collection rate at {(stats.collectionRate || 0).toFixed(0)}%</span>
              </button>
            )}
            {stats.pendingLeave === 0 && stats.unreadMessages === 0 && stats.collectionRate >= 70 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-foreground">All caught up! No pending items.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
