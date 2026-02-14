import React, { useState, useEffect, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  Heart,
  Users,
  PiggyBank,
  Plus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Phone,
  Banknote,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Target,
  Sparkles,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllOrders } from "@/lib/ticketService";
import { getAllContributions } from "@/lib/contributionService";
import { getAllExpenses, Expense, getCategoryLabel } from "@/lib/expenseService";
import { getAllDonations, createDonation, updateDonation, deleteDonation, Donation } from "@/lib/donationService";
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog } from "@/lib/adminService";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatCompactCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const INCOME_COLORS = {
  tickets: "#3b82f6",
  contributions: "#8b5cf6",
  donations: "#ec4899",
};

const EXPENSE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7"];

interface TreasuryProps {
  onRefresh?: () => void;
}

export function Treasury({ onRefresh }: TreasuryProps) {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "donations" | "breakdown" | "trends">("overview");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Financial data
  const [ticketRevenue, setTicketRevenue] = useState(0);
  const [contributionTotal, setContributionTotal] = useState(0);
  const [donationTotal, setDonationTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allContributions, setAllContributions] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  
  // Donation form
  const [donationForm, setDonationForm] = useState({
    donorName: "",
    donorEmail: "",
    amount: "",
    method: "cash" as Donation["method"],
    reference: "",
    message: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    // Ticket Revenue
    const orders = await getAllOrders();
    setAllOrders(orders);
    const confirmedOrders = orders.filter(o => o.status === "confirmed");
    const ticketRev = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
    setTicketRevenue(ticketRev);

    // Contributions
    const contributions = await getAllContributions();
    setAllContributions(contributions);
    const contribTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
    setContributionTotal(contribTotal);

    // Donations
    const allDonations = await getAllDonations();
    setDonations(allDonations);
    const donTotal = allDonations.reduce((sum, d) => sum + d.amount, 0);
    setDonationTotal(donTotal);

    // Expenses
    const expenses = await getAllExpenses();
    setAllExpenses(expenses);
    const expTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    setExpenseTotal(expTotal);

    // Recent transactions (combine all sources)
    const transactions = [
      ...confirmedOrders.map(o => ({
        id: o.id,
        type: "ticket" as const,
        description: `Ticket: ${o.eventTitle}`,
        amount: o.total,
        date: o.createdAt,
        isIncome: true,
      })),
      ...contributions.map(c => ({
        id: c.id,
        type: "contribution" as const,
        description: `Contribution: ${c.typeName}`,
        amount: c.amount,
        date: c.paidAt,
        isIncome: true,
      })),
      ...allDonations.map(d => ({
        id: d.id,
        type: "donation" as const,
        description: `Donation: ${d.donorName}`,
        amount: d.amount,
        date: d.date,
        isIncome: true,
      })),
      ...expenses.map(e => ({
        id: e.id,
        type: "expense" as const,
        description: `${getCategoryLabel(e.category)}: ${e.description}`,
        amount: e.amount,
        date: e.date,
        isIncome: false,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 20);

    setRecentTransactions(transactions);
  };

  const totalIncome = ticketRevenue + contributionTotal + donationTotal;
  const balance = totalIncome - expenseTotal;

  // Monthly trend data
  const monthlyTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map((month, index) => {
      const monthStart = new Date(selectedYear, index, 1);
      const monthEnd = new Date(selectedYear, index + 1, 0);
      
      // Filter by month
      const monthTickets = allOrders
        .filter(o => o.status === "confirmed" && new Date(o.createdAt) >= monthStart && new Date(o.createdAt) <= monthEnd)
        .reduce((sum, o) => sum + o.totalAmount, 0);
      
      const monthContributions = allContributions
        .filter(c => new Date(c.paidAt) >= monthStart && new Date(c.paidAt) <= monthEnd)
        .reduce((sum, c) => sum + c.amount, 0);
      
      const monthDonations = donations
        .filter(d => new Date(d.date) >= monthStart && new Date(d.date) <= monthEnd)
        .reduce((sum, d) => sum + d.amount, 0);
      
      const monthExpenses = allExpenses
        .filter(e => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd)
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        month,
        income: monthTickets + monthContributions + monthDonations,
        expenses: monthExpenses,
        tickets: monthTickets,
        contributions: monthContributions,
        donations: monthDonations,
        balance: (monthTickets + monthContributions + monthDonations) - monthExpenses,
      };
    });
    return data;
  }, [selectedYear, allOrders, allContributions, donations, allExpenses]);

  // Income breakdown pie data
  const incomeBreakdownData = [
    { name: "Tickets", value: ticketRevenue, color: INCOME_COLORS.tickets },
    { name: "Contributions", value: contributionTotal, color: INCOME_COLORS.contributions },
    { name: "Donations", value: donationTotal, color: INCOME_COLORS.donations },
  ].filter(d => d.value > 0);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    allExpenses.forEach(e => {
      const label = getCategoryLabel(e.category);
      categoryTotals[label] = (categoryTotals[label] || 0) + e.amount;
    });
    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [allExpenses]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    allOrders.forEach(o => years.add(new Date(o.createdAt).getFullYear()));
    allContributions.forEach(c => years.add(new Date(c.paidAt).getFullYear()));
    donations.forEach(d => years.add(new Date(d.date).getFullYear()));
    allExpenses.forEach(e => years.add(new Date(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [allOrders, allContributions, donations, allExpenses]);

  const handleSaveDonation = async () => {
    if (!donationForm.donorName || !donationForm.amount) return;

    if (editingDonation) {
      await updateDonation(editingDonation.id, {
        ...donationForm,
        amount: parseFloat(donationForm.amount),
      });
      if (currentUser) {
        addAuditLog(currentUser, "UPDATE_DONATION", `Updated donation from ${donationForm.donorName}`);
      }
    } else {
      await createDonation({
        ...donationForm,
        amount: parseFloat(donationForm.amount),
        recordedBy: currentUser?.name || "admin",
      });
      if (currentUser) {
        addAuditLog(currentUser, "CREATE_DONATION", `Recorded donation from ${donationForm.donorName}: ${donationForm.amount} RWF`);
      }
    }

    setShowDonationForm(false);
    setEditingDonation(null);
    setDonationForm({
      donorName: "",
      donorEmail: "",
      amount: "",
      method: "cash",
      reference: "",
      message: "",
      date: new Date().toISOString().split("T")[0],
    });
    await loadFinancialData();
  };

  const handleEditDonation = (donation: Donation) => {
    setEditingDonation(donation);
    setDonationForm({
      donorName: donation.donorName,
      donorEmail: donation.donorEmail || "",
      amount: donation.amount.toString(),
      method: donation.method,
      reference: donation.reference || "",
      message: donation.message || "",
      date: donation.date,
    });
    setShowDonationForm(true);
  };

  const handleDeleteDonation = async (id: string) => {
    if (confirm("Are you sure you want to delete this donation record?")) {
      const donation = donations.find(d => d.id === id);
      await deleteDonation(id);
      if (currentUser && donation) {
        addAuditLog(currentUser, "DELETE_DONATION", `Deleted donation from ${donation.donorName}`);
      }
      await loadFinancialData();
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "bank": return <CreditCard className="w-4 h-4" />;
      case "mtn": 
      case "airtel": return <Phone className="w-4 h-4" />;
      case "cash": return <Banknote className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "bank": return "Bank Transfer";
      case "mtn": return "MTN MoMo";
      case "airtel": return "Airtel Money";
      case "cash": return "Cash";
      default: return "Other";
    }
  };

  const exportTreasury = () => {
    const data = {
      exportDate: new Date().toISOString(),
      summary: {
        totalIncome,
        ticketRevenue,
        contributionTotal,
        donationTotal,
        expenseTotal,
        balance,
      },
      donations: donations,
      recentTransactions: recentTransactions,
      monthlyTrends: monthlyTrendData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treasury_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-charcoal border border-primary/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            Treasury
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Complete financial overview and management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadFinancialData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportTreasury}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="gold" size="sm" onClick={() => setShowDonationForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Donation
          </Button>
        </div>
      </div>

      {/* Main Balance Card - Hero Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal via-charcoal to-primary/20 border border-primary/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Balance</p>
              </div>
              <h3 className={cn(
                "text-4xl md:text-5xl font-bold tracking-tight",
                balance >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {formatCurrency(balance)}
              </h3>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Income: <span className="text-green-400 font-medium">{formatCurrency(totalIncome)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Expenses: <span className="text-red-400 font-medium">{formatCurrency(expenseTotal)}</span></span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-primary/10">
                <Ticket className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-xs text-muted-foreground">Tickets</p>
                <p className="text-lg font-bold text-foreground">{formatCompactCurrency(ticketRevenue)}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-primary/10">
                <Users className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-xs text-muted-foreground">Contributions</p>
                <p className="text-lg font-bold text-foreground">{formatCompactCurrency(contributionTotal)}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-primary/10">
                <Heart className="w-5 h-5 text-pink-400 mb-2" />
                <p className="text-xs text-muted-foreground">Donations</p>
                <p className="text-lg font-bold text-foreground">{formatCompactCurrency(donationTotal)}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-primary/10">
                <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="text-lg font-bold text-foreground">{formatCompactCurrency(expenseTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-primary/10 pb-2">
        {[
          { id: "overview", label: "Overview", icon: PiggyBank },
          { id: "trends", label: "Trends", icon: BarChart3 },
          { id: "donations", label: "Donations", icon: Heart },
          { id: "breakdown", label: "Breakdown", icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income Breakdown Chart */}
          <div className="lg:col-span-1 card-glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Income Sources
            </h3>
            {incomeBreakdownData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {incomeBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {incomeBreakdownData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No income data yet
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 card-glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-primary/10 flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Recent Transactions
              </h3>
              <span className="text-xs text-muted-foreground">Last 20</span>
            </div>
            <div className="divide-y divide-primary/10 max-h-[400px] overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        tx.isIncome 
                          ? tx.type === "ticket" ? "bg-blue-500/20" 
                            : tx.type === "contribution" ? "bg-purple-500/20" 
                            : "bg-pink-500/20"
                          : "bg-red-500/20"
                      )}>
                        {tx.type === "ticket" && <Ticket className="w-5 h-5 text-blue-400" />}
                        {tx.type === "contribution" && <Users className="w-5 h-5 text-purple-400" />}
                        {tx.type === "donation" && <Heart className="w-5 h-5 text-pink-400" />}
                        {tx.type === "expense" && <ArrowDownRight className="w-5 h-5 text-red-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-semibold tabular-nums",
                      tx.isIncome ? "text-green-400" : "text-red-400"
                    )}>
                      {tx.isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Year Selector */}
          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground">Year:</Label>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Income vs Expenses Chart */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Monthly Income vs Expenses ({selectedYear})</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.1)" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCompactCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" fill="url(#incomeGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#expenseGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income Breakdown by Source */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Income Breakdown by Source ({selectedYear})</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.1)" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCompactCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="tickets" name="Tickets" fill={INCOME_COLORS.tickets} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contributions" name="Contributions" fill={INCOME_COLORS.contributions} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="donations" name="Donations" fill={INCOME_COLORS.donations} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Balance */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Monthly Net Balance ({selectedYear})</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.1)" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCompactCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="balance" 
                    name="Net Balance"
                    radius={[4, 4, 0, 0]}
                  >
                    {monthlyTrendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Donations Tab */}
      {activeTab === "donations" && (
        <div className="space-y-4">
          <div className="card-glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-primary/10 flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                All Donations ({donations.length})
              </h3>
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-pink-400">{formatCurrency(donationTotal)}</span>
              </p>
            </div>
            
            {donations.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-pink-400" />
                </div>
                <p className="font-medium mb-2">No donations recorded yet</p>
                <p className="text-sm mb-4">Start tracking donations from supporters</p>
                <Button variant="outline" size="sm" onClick={() => setShowDonationForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record First Donation
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {donations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((donation) => (
                  <div key={donation.id} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                          {getMethodIcon(donation.method)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{donation.donorName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">
                              {getMethodLabel(donation.method)}
                            </span>
                            <span>•</span>
                            <span>{formatDate(donation.date)}</span>
                          </div>
                          {donation.message && (
                            <p className="text-sm text-muted-foreground mt-1 italic line-clamp-1">"{donation.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-pink-400 text-lg tabular-nums">
                          {formatCurrency(donation.amount)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditDonation(donation)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteDonation(donation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === "breakdown" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Income Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { label: "Ticket Sales", amount: ticketRevenue, color: "bg-blue-500", icon: Ticket },
                { label: "Contributions", amount: contributionTotal, color: "bg-purple-500", icon: Users },
                { label: "Donations", amount: donationTotal, color: "bg-pink-500", icon: Heart },
              ].map((item) => {
                const percent = totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-medium text-sm">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", item.color)}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{Math.round(percent)}% of total</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-primary/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Income</span>
                <span className="font-bold text-green-400 text-lg">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Expense Breakdown
            </h3>
            {expenseByCategory.length > 0 ? (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {expenseByCategory.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground truncate">{item.name}</span>
                      </div>
                      <span className="font-medium text-red-400">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No expense data yet
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-primary/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Expenses</span>
                <span className="font-bold text-red-400 text-lg">{formatCurrency(expenseTotal)}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary Table */}
          <div className="lg:col-span-2 card-glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-primary/10">
              <h3 className="font-semibold text-foreground">Financial Summary</h3>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-primary/10">
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 text-muted-foreground flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-blue-400" />
                    Ticket Sales
                  </td>
                  <td className="p-4 text-right font-medium text-green-400">+{formatCurrency(ticketRevenue)}</td>
                </tr>
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Member Contributions
                  </td>
                  <td className="p-4 text-right font-medium text-green-400">+{formatCurrency(contributionTotal)}</td>
                </tr>
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    Donations
                  </td>
                  <td className="p-4 text-right font-medium text-green-400">+{formatCurrency(donationTotal)}</td>
                </tr>
                <tr className="bg-green-500/10">
                  <td className="p-4 font-semibold text-foreground">Total Income</td>
                  <td className="p-4 text-right font-bold text-green-400 text-lg">{formatCurrency(totalIncome)}</td>
                </tr>
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    Total Expenses
                  </td>
                  <td className="p-4 text-right font-medium text-red-400">-{formatCurrency(expenseTotal)}</td>
                </tr>
                <tr className={cn("border-t-2 border-primary/20", balance >= 0 ? "bg-green-500/10" : "bg-red-500/10")}>
                  <td className="p-4 font-bold text-foreground text-lg">Net Balance</td>
                  <td className={cn("p-4 text-right font-bold text-xl", balance >= 0 ? "text-green-400" : "text-red-400")}>
                    {formatCurrency(balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donation Form Dialog */}
      <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              {editingDonation ? "Edit Donation" : "Record Donation"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {editingDonation ? "Update donation details" : "Record a new donation"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Donor Name *</Label>
              <Input
                value={donationForm.donorName}
                onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={donationForm.donorEmail}
                onChange={(e) => setDonationForm({ ...donationForm, donorEmail: e.target.value })}
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (RWF) *</Label>
                <Input
                  type="number"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                  placeholder="50000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={donationForm.date}
                  onChange={(e) => setDonationForm({ ...donationForm, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "bank", label: "Bank", icon: CreditCard },
                  { id: "mtn", label: "MTN", icon: Phone },
                  { id: "airtel", label: "Airtel", icon: Phone },
                  { id: "other", label: "Other", icon: MoreHorizontal },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setDonationForm({ ...donationForm, method: method.id as Donation["method"] })}
                    className={cn(
                      "p-2 rounded-lg border transition-all flex flex-col items-center gap-1",
                      donationForm.method === method.id
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-primary/20 hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <method.icon className="w-4 h-4" />
                    <span className="text-[10px]">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Reference/Transaction ID (Optional)</Label>
              <Input
                value={donationForm.reference}
                onChange={(e) => setDonationForm({ ...donationForm, reference: e.target.value })}
                placeholder="TXN123456"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Message/Note (Optional)</Label>
              <Input
                value={donationForm.message}
                onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })}
                placeholder="For music production..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDonationForm(false);
                  setEditingDonation(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleSaveDonation}
                disabled={!donationForm.donorName || !donationForm.amount}
              >
                {editingDonation ? "Update" : "Record"} Donation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
