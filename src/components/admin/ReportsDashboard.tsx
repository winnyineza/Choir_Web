import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download,
  TrendingUp,
  Users,
  Ticket,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  PieChartIcon,
  BarChart3,
} from "lucide-react";
import { getAllOrders, type TicketOrder } from "@/lib/ticketService";
import { getAllMembers, getAllEvents } from "@/lib/dataService";
import { getAllAttendanceSessions, type AttendanceSession } from "@/lib/attendanceService";
import { formatCurrency } from "@/lib/flutterwave";
import {
  exportFullBackup,
  exportMembersToCSV,
  exportAttendanceToCSV,
  exportDetailedAttendanceToCSV,
  exportFinancialReportToCSV,
  exportLeaveRequestsToCSV,
  getBackupStats,
} from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#D4AF37", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ReportsDashboard() {
  const [reportType, setReportType] = useState<"financial" | "attendance" | "members">("financial");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSession[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setOrders(getAllOrders());
    setMembers(getAllMembers());
    setEvents(getAllEvents());
    setAttendance(getAllAttendanceSessions());
  }, []);

  // Filter data by time range
  const getFilteredOrders = () => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "all": Infinity,
    };
    const cutoff = now - ranges[timeRange];
    return orders.filter(o => new Date(o.createdAt).getTime() > cutoff);
  };

  const filteredOrders = getFilteredOrders();
  const confirmedOrders = filteredOrders.filter(o => o.status === "confirmed" || o.status === "used");

  // Financial metrics
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalTickets = confirmedOrders.reduce((sum, o) => sum + o.tickets.reduce((s, t) => s + t.quantity, 0), 0);
  const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

  // Revenue by day chart data
  const getRevenueByDay = () => {
    const byDay: Record<string, number> = {};
    confirmedOrders.forEach(order => {
      const day = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay[day] = (byDay[day] || 0) + order.total;
    });
    return Object.entries(byDay).map(([date, revenue]) => ({ date, revenue })).slice(-14);
  };

  // Revenue by event
  const getRevenueByEvent = () => {
    const byEvent: Record<string, number> = {};
    confirmedOrders.forEach(order => {
      byEvent[order.eventTitle] = (byEvent[order.eventTitle] || 0) + order.total;
    });
    return Object.entries(byEvent).map(([name, value]) => ({ name, value })).slice(0, 6);
  };

  // Tickets by tier
  const getTicketsByTier = () => {
    const byTier: Record<string, number> = {};
    confirmedOrders.forEach(order => {
      order.tickets.forEach(ticket => {
        byTier[ticket.tierName] = (byTier[ticket.tierName] || 0) + ticket.quantity;
      });
    });
    return Object.entries(byTier).map(([name, value]) => ({ name, value }));
  };

  // Attendance rate over time
  const getAttendanceRate = () => {
    return attendance.slice(-12).map(session => {
      const total = Object.keys(session.records).length;
      const present = Object.values(session.records).filter(r => r === "present").length;
      const rate = total > 0 ? (present / total) * 100 : 0;
      return {
        date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rate: Math.round(rate),
        present,
        total,
      };
    });
  };

  // Members by voice part
  const getMembersByVoicePart = () => {
    const byPart: Record<string, number> = {};
    members.forEach(m => {
      byPart[m.voicePart] = (byPart[m.voicePart] || 0) + 1;
    });
    return Object.entries(byPart).map(([name, value]) => ({ name, value }));
  };

  // Member growth
  const getMemberGrowth = () => {
    const sorted = [...members].sort((a, b) => 
      new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime()
    );
    let cumulative = 0;
    const growth: { date: string; count: number }[] = [];
    
    sorted.forEach(m => {
      cumulative++;
      const month = new Date(m.joinedDate).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const existing = growth.find(g => g.date === month);
      if (existing) {
        existing.count = cumulative;
      } else {
        growth.push({ date: month, count: cumulative });
      }
    });
    
    return growth.slice(-12);
  };

  // Payment method distribution
  const getPaymentMethods = () => {
    const byMethod: Record<string, number> = {};
    confirmedOrders.forEach(o => {
      byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] || 0) + 1;
    });
    return Object.entries(byMethod).map(([name, value]) => ({ name, value }));
  };

  const handleExport = (type: string) => {
    switch (type) {
      case "backup":
        exportFullBackup();
        toast({ title: "Backup Created", description: "Full backup downloaded as JSON" });
        break;
      case "members":
        exportMembersToCSV();
        toast({ title: "Exported", description: "Members exported to CSV" });
        break;
      case "attendance":
        exportAttendanceToCSV();
        toast({ title: "Exported", description: "Attendance summary exported to CSV" });
        break;
      case "attendance-detailed":
        exportDetailedAttendanceToCSV();
        toast({ title: "Exported", description: "Detailed attendance exported to CSV" });
        break;
      case "financial":
        exportFinancialReportToCSV();
        toast({ title: "Exported", description: "Financial report exported to CSV" });
        break;
      case "leave":
        exportLeaveRequestsToCSV();
        toast({ title: "Exported", description: "Leave requests exported to CSV" });
        break;
    }
  };

  const backupStats = getBackupStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold gold-text">Reports & Analytics</h2>
          <p className="text-muted-foreground text-sm mt-1">
            View insights and export data
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32 bg-secondary border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 border-b border-primary/10 pb-4">
        {[
          { id: "financial", label: "Financial", icon: DollarSign },
          { id: "attendance", label: "Attendance", icon: Calendar },
          { id: "members", label: "Members", icon: Users },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={reportType === tab.id ? "gold" : "outline"}
            size="sm"
            onClick={() => setReportType(tab.id as any)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* FINANCIAL REPORT */}
      {reportType === "financial" && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold gold-text">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </div>
            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Ticket className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalTickets}</p>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                </div>
              </div>
            </div>
            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(avgOrderValue)}</p>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                </div>
              </div>
            </div>
            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{confirmedOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="card-glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Revenue Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getRevenueByDay()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--primary) / 0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    fill="#D4AF37" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Event & Ticket Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Revenue by Event</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getRevenueByEvent()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
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
            <div className="card-glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Tickets by Tier</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getTicketsByTier()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getTicketsByTier().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card-glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Payment Methods</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getPaymentMethods()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--primary) / 0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ATTENDANCE REPORT */}
      {reportType === "attendance" && (
        <>
          {/* Attendance Rate Chart */}
          <div className="card-glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Attendance Rate Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getAttendanceRate()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--primary) / 0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "rate") return [`${value}%`, "Attendance Rate"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#D4AF37" strokeWidth={2} name="Attendance %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-glass rounded-xl p-4">
              <p className="text-2xl font-bold text-foreground">{attendance.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </div>
            <div className="card-glass rounded-xl p-4">
              <p className="text-2xl font-bold text-green-500">
                {attendance.length > 0 
                  ? Math.round(getAttendanceRate().reduce((sum, a) => sum + a.rate, 0) / getAttendanceRate().length)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Average Attendance</p>
            </div>
            <div className="card-glass rounded-xl p-4">
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
          </div>
        </>
      )}

      {/* MEMBERS REPORT */}
      {reportType === "members" && (
        <>
          {/* Member Growth */}
          <div className="card-glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Member Growth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getMemberGrowth()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--primary) / 0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Voice Parts Distribution */}
          <div className="card-glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Members by Voice Part</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getMembersByVoicePart()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getMembersByVoicePart().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Export Section */}
      <div className="card-glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Export Data
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Button variant="outline" size="sm" onClick={() => handleExport("backup")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Full Backup (JSON)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("financial")}>
            <DollarSign className="w-4 h-4 mr-2" />
            Financial Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("members")}>
            <Users className="w-4 h-4 mr-2" />
            Members
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("attendance")}>
            <Calendar className="w-4 h-4 mr-2" />
            Attendance Summary
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("attendance-detailed")}>
            <Calendar className="w-4 h-4 mr-2" />
            Attendance Detailed
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("leave")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Leave Requests
          </Button>
        </div>
        
        {/* Backup Stats */}
        <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-primary/10">
          <p className="text-sm text-muted-foreground mb-2">Current data in system:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><strong>{backupStats.members}</strong> Members</span>
            <span><strong>{backupStats.events}</strong> Events</span>
            <span><strong>{backupStats.orders}</strong> Orders</span>
            <span><strong>{backupStats.attendance}</strong> Sessions</span>
            <span><strong>{backupStats.gallery}</strong> Gallery Items</span>
          </div>
        </div>
      </div>
    </div>
  );
}

