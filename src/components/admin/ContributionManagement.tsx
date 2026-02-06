import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  Pencil,
  Filter,
  DollarSign,
  Clock,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/flutterwave";
import { getAllMembers, type Member } from "@/lib/dataService";
import { addAuditLog } from "@/lib/adminService";
import {
  getAllContributions,
  getAllContributionTypes,
  getActiveContributionTypes,
  createContribution,
  deleteContribution,
  createContributionType,
  updateContributionType,
  deleteContributionType,
  getContributionStats,
  getMonthlyDuesReport,
  getSpecialContributionProgress,
  getContributionsByMember,
  getMemberMonthlyPayment,
  getMemberMonthlyPaymentDetails,
  setMemberMonthlyPayment,
  getMonthlyRateForPeriod,
  MONTH_NAMES,
  type Contribution,
  type ContributionType,
  type ContributionCategory,
} from "@/lib/contributionService";
import { cn } from "@/lib/utils";
import { Download, History, MoreHorizontal, FileText, Star, BarChart3, AlertTriangle } from "lucide-react";
import { 
  exportContributionsToCSV, 
  exportMonthlyDuesReport,
  exportAnnualFinancialSummary,
} from "@/lib/exportUtils";
import { getExpenseStats, getExpensesByYear } from "@/lib/expenseService";

export function ContributionManagement() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Data
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState(getContributionStats());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  
  // Modals
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [showBulkMonthlyDues, setShowBulkMonthlyDues] = useState(false);
  const [editingType, setEditingType] = useState<ContributionType | null>(null);
  
  // Bulk monthly dues state
  const [bulkMemberId, setBulkMemberId] = useState("");
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  
  // Cell click payment state (for monthly)
  const [cellPayment, setCellPayment] = useState<{
    memberId: string;
    memberName: string;
    memberEmail: string;
    month: number;
    year: number;
    amount: string;
    expectedAmount: number;
  } | null>(null);
  
  // Special contribution cell payment state
  const [specialCellPayment, setSpecialCellPayment] = useState<{
    memberId: string;
    memberName: string;
    memberEmail: string;
    typeId: string;
    typeName: string;
    amount: string;
    expectedAmount: number;
    currentPaid: number;
  } | null>(null);
  
  
  // Forms
  const [contributionForm, setContributionForm] = useState({
    memberId: "",
    typeId: "",
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMethod: "cash" as "cash" | "momo" | "bank",
    reference: "",
    notes: "",
  });
  
  const [typeForm, setTypeForm] = useState({
    name: "",
    category: "monthly" as ContributionCategory,
    amount: "",
    description: "",
    targetAmount: "",
    deadline: "",
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    setContributions(getAllContributions());
    setContributionTypes(getAllContributionTypes());
    setMembers(getAllMembers());
    setStats(getContributionStats());
  };
  
  // Filter contributions
  const filteredContributions = contributions
    .filter(c => {
      if (filterType !== "all" && c.typeId !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          c.memberName.toLowerCase().includes(query) ||
          c.typeName.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get paid months for a member in a specific year
  const getPaidMonthsForMember = (memberId: string, year: number): number[] => {
    const memberContribs = getContributionsByMember(memberId);
    return memberContribs
      .filter(c => c.category === "monthly" && c.year === year && c.month)
      .map(c => c.month!)
      .filter((m, i, arr) => arr.indexOf(m) === i); // unique
  };

  // Load paid months when member or year changes in bulk modal
  useEffect(() => {
    if (bulkMemberId && showBulkMonthlyDues) {
      const paidMonths = getPaidMonthsForMember(bulkMemberId, bulkYear);
      setSelectedMonths([]); // Reset selection, only show already paid
    }
  }, [bulkMemberId, bulkYear, showBulkMonthlyDues]);

  // Handle bulk monthly dues save
  const handleBulkMonthlyDuesSave = () => {
    const member = members.find(m => m.id === bulkMemberId);
    const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
    
    if (!member) {
      toast({ title: "Error", description: "Please select a member.", variant: "destructive" });
      return;
    }
    
    if (!monthlyType) {
      toast({ title: "Error", description: "No active monthly dues type found. Please create one first.", variant: "destructive" });
      return;
    }
    
    if (selectedMonths.length === 0) {
      toast({ title: "Error", description: "Please select at least one month.", variant: "destructive" });
      return;
    }
    
    // Get already paid months
    const alreadyPaid = getPaidMonthsForMember(bulkMemberId, bulkYear);
    
    // Only add contributions for newly selected months (not already paid)
    const newMonths = selectedMonths.filter(m => !alreadyPaid.includes(m));
    
    if (newMonths.length === 0) {
      toast({ title: "No new months", description: "All selected months are already paid.", variant: "destructive" });
      return;
    }
    
    // Create contribution for each new month
    newMonths.forEach(month => {
      createContribution({
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        typeId: monthlyType.id,
        typeName: monthlyType.name,
        category: "monthly",
        amount: monthlyType.amount,
        month,
        year: bulkYear,
        paymentMethod: "cash",
        recordedBy: currentUser?.name || "Admin",
      });
    });
    
    if (currentUser) {
      addAuditLog(currentUser, "RECORD_CONTRIBUTIONS", `Recorded ${newMonths.length} month(s) for ${member.name}`);
    }
    
    toast({ 
      title: "Contributions Recorded", 
      description: `${newMonths.length} month(s) recorded for ${member.name}.` 
    });
    
    setShowBulkMonthlyDues(false);
    setBulkMemberId("");
    setSelectedMonths([]);
    loadData();
  };

  // Toggle month selection for bulk entry
  const toggleMonthSelection = (month: number) => {
    const alreadyPaid = getPaidMonthsForMember(bulkMemberId, bulkYear);
    if (alreadyPaid.includes(month)) return; // Can't unselect already paid months
    
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  // Handle cell click in the overview table
  const handleCellClick = (member: Member, month: number, year: number) => {
    const paymentDetails = getMemberMonthlyPaymentDetails(member.id, month, year);
    
    // Use historical rate if payment exists, otherwise use the rate for that month
    const rateForMonth = getMonthlyRateForPeriod(month, year);
    const effectiveExpected = paymentDetails.amountPaid > 0 && paymentDetails.expectedAmount > 0
      ? paymentDetails.expectedAmount 
      : rateForMonth;
    
    setCellPayment({
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      month,
      year,
      // Show current amount if already paid (for editing), otherwise start empty
      amount: paymentDetails.amountPaid > 0 ? paymentDetails.amountPaid.toString() : "",
      expectedAmount: effectiveExpected || 5000, // Fallback to 5000 if no rate defined
    });
  };
  
  // Get member's contribution for a special type
  const getMemberSpecialPayment = (memberId: string, typeId: string): number => {
    const memberContribs = contributions.filter(
      c => c.memberId === memberId && c.typeId === typeId
    );
    return memberContribs.reduce((sum, c) => sum + c.amount, 0);
  };
  
  // Handle special contribution cell click
  const handleSpecialCellClick = (member: Member, type: ContributionType) => {
    const currentPaid = getMemberSpecialPayment(member.id, type.id);
    
    setSpecialCellPayment({
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      typeId: type.id,
      typeName: type.name,
      amount: "",
      expectedAmount: type.amount,
      currentPaid,
    });
  };
  
  // Save special contribution payment
  const handleSaveSpecialPayment = () => {
    if (!specialCellPayment) return;
    
    const amount = parseFloat(specialCellPayment.amount) || 0;
    
    if (amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    
    createContribution({
      memberId: specialCellPayment.memberId,
      memberName: specialCellPayment.memberName,
      memberEmail: specialCellPayment.memberEmail,
      typeId: specialCellPayment.typeId,
      typeName: specialCellPayment.typeName,
      category: contributionTypes.find(t => t.id === specialCellPayment.typeId)?.category || "special",
      amount,
      paymentMethod: "cash",
      recordedBy: currentUser?.name || "Admin",
    });
    
    toast({
      title: "Payment Recorded",
      description: `${formatCurrency(amount)} for ${specialCellPayment.memberName} - ${specialCellPayment.typeName}`,
    });
    
    setSpecialCellPayment(null);
    loadData();
  };

  // Save cell payment
  const handleSaveCellPayment = () => {
    if (!cellPayment) return;
    
    const amount = parseFloat(cellPayment.amount) || 0;
    
    // Pass the expected amount to store the historical rate
    setMemberMonthlyPayment(
      cellPayment.memberId,
      cellPayment.memberName,
      cellPayment.memberEmail,
      cellPayment.month,
      cellPayment.year,
      amount,
      currentUser?.name || "Admin",
      cellPayment.expectedAmount // Historical rate tracking
    );
    
    if (amount > 0) {
      toast({
        title: "Payment Recorded",
        description: `${formatCurrency(amount)} for ${cellPayment.memberName} - ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}`,
      });
    } else {
      toast({
        title: "Payment Removed",
        description: `Payment cleared for ${cellPayment.memberName} - ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}`,
      });
    }
    
    setCellPayment(null);
    loadData();
  };
  
  // Handle add contribution
  const handleAddContribution = () => {
    const member = members.find(m => m.id === contributionForm.memberId);
    const type = contributionTypes.find(t => t.id === contributionForm.typeId);
    
    if (!member || !type) {
      toast({ title: "Error", description: "Please select a member and contribution type.", variant: "destructive" });
      return;
    }
    
    const amount = parseFloat(contributionForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    
    createContribution({
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      typeId: type.id,
      typeName: type.name,
      category: type.category,
      amount,
      month: type.category === "monthly" ? contributionForm.month : undefined,
      year: type.category === "monthly" ? contributionForm.year : undefined,
      paymentMethod: contributionForm.paymentMethod,
      reference: contributionForm.reference || undefined,
      notes: contributionForm.notes || undefined,
      recordedBy: currentUser?.name || "Admin",
    });
    
    toast({ title: "Contribution Recorded", description: `${formatCurrency(amount)} from ${member.name} recorded.` });
    setShowAddContribution(false);
    resetContributionForm();
    loadData();
  };
  
  const resetContributionForm = () => {
    setContributionForm({
      memberId: "",
      typeId: "",
      amount: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      paymentMethod: "cash",
      reference: "",
      notes: "",
    });
  };
  
  // Handle add/edit type
  const handleSaveType = () => {
    if (!typeForm.name || !typeForm.amount) {
      toast({ title: "Error", description: "Please fill in required fields.", variant: "destructive" });
      return;
    }
    
    const amount = parseFloat(typeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    
    if (editingType) {
      updateContributionType(editingType.id, {
        name: typeForm.name,
        category: typeForm.category,
        amount,
        description: typeForm.description || undefined,
        targetAmount: typeForm.targetAmount ? parseFloat(typeForm.targetAmount) : undefined,
        deadline: typeForm.deadline || undefined,
      });
      if (currentUser) {
        addAuditLog(currentUser, "UPDATE_CONTRIBUTION_TYPE", `Updated contribution type: ${typeForm.name}`);
      }
      toast({ title: "Updated", description: "Contribution type updated." });
    } else {
      createContributionType({
        name: typeForm.name,
        category: typeForm.category,
        amount,
        description: typeForm.description || undefined,
        isRecurring: typeForm.category === "monthly",
        targetAmount: typeForm.targetAmount ? parseFloat(typeForm.targetAmount) : undefined,
        deadline: typeForm.deadline || undefined,
      });
      if (currentUser) {
        addAuditLog(currentUser, "CREATE_CONTRIBUTION_TYPE", `Created contribution type: ${typeForm.name}`);
      }
      toast({ title: "Created", description: "Contribution type created." });
    }
    
    setShowAddType(false);
    setEditingType(null);
    resetTypeForm();
    loadData();
  };
  
  const resetTypeForm = () => {
    setTypeForm({
      name: "",
      category: "monthly",
      amount: "",
      description: "",
      targetAmount: "",
      deadline: "",
    });
  };
  
  const handleDeleteContribution = (id: string) => {
    if (confirm("Delete this contribution record?")) {
      deleteContribution(id);
      toast({ title: "Deleted", description: "Contribution deleted." });
      loadData();
    }
  };
  
  const handleDeleteType = (id: string) => {
    const hasContributions = contributions.some(c => c.typeId === id);
    if (hasContributions) {
      toast({ 
        title: "Cannot Delete", 
        description: "This type has contributions. Deactivate it instead.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (confirm("Delete this contribution type?")) {
      deleteContributionType(id);
      toast({ title: "Deleted", description: "Contribution type deleted." });
      loadData();
    }
  };
  
  const handleToggleTypeActive = (type: ContributionType) => {
    updateContributionType(type.id, { isActive: !type.isActive });
    loadData();
    toast({ 
      title: type.isActive ? "Deactivated" : "Activated", 
      description: `${type.name} is now ${type.isActive ? "inactive" : "active"}.` 
    });
  };
  
  // Monthly report data
  const monthlyReport = getMonthlyDuesReport(
    filterMonth,
    filterYear,
    members.map(m => ({ id: m.id, name: m.name, email: m.email }))
  );
  
  const paidCount = monthlyReport.filter(r => r.isPaid).length;
  const unpaidCount = monthlyReport.filter(r => !r.isPaid).length;
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Collected */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-green-400">{formatCurrency(stats.totalCollected)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Total Collected</p>
        </div>
        {/* Monthly */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.monthlyDuesCollected)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Monthly</p>
        </div>
        {/* Special */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.specialContributions)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Special</p>
        </div>
        {/* Outstanding Dues */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-red-400">{formatCurrency(stats.outstandingDues)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Outstanding Dues</p>
        </div>
        {/* This Month */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.thisMonthTotal)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">This Month</p>
        </div>
        {/* This Year */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.thisYearTotal)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">This Year</p>
        </div>
      </div>
      
      {/* Actions Bar */}
      <div className="card-glass rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            <Button variant="gold" onClick={() => setShowBulkMonthlyDues(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Monthly Dues
            </Button>
            <Button variant="outline" onClick={() => setShowAddContribution(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
            <Button variant="outline" onClick={() => setShowAddType(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Type
            </Button>
            
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowReport(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAuditTrail(true)}>
                  <History className="w-4 h-4 mr-2" />
                  Audit Trail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowFinancialSummary(true)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Annual Summary
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { 
                  exportContributionsToCSV(); 
                  toast({ title: "Exported", description: "Contributions exported to CSV" }); 
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Search & Filter */}
          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full lg:w-48 bg-secondary border-primary/20"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 bg-secondary border-primary/20">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {contributionTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Contribution Types - Only Active & Not Expired */}
      {(() => {
        const now = new Date();
        const activeTypes = contributionTypes.filter(t => {
          if (!t.isActive) return false;
          // If has deadline and it's passed, hide it
          if (t.deadline && new Date(t.deadline) < now) return false;
          return true;
        });
        
        if (activeTypes.length === 0) return null;
        
        return (
          <div className="card-glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-primary/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Active Contribution Types
              </h3>
            </div>
            <div className="divide-y divide-primary/10">
              {activeTypes.map(type => (
              <div
                key={type.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">{type.name}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                    type.category === "monthly" 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "bg-purple-500/20 text-purple-400"
                  )}>
                    {type.category === "monthly" ? "Monthly" : "Special"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-primary">{formatCurrency(type.amount)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingType(type);
                      setTypeForm({
                        name: type.name,
                        category: type.category,
                        amount: type.amount.toString(),
                        description: type.description || "",
                        targetAmount: type.targetAmount?.toString() || "",
                        deadline: type.deadline || "",
                      });
                      setShowAddType(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            </div>
          </div>
        );
      })()}

      {/* Monthly Dues Overview Table */}
      {members.length > 0 && contributionTypes.some(t => t.category === "monthly") && (
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Monthly Dues Overview - {bulkYear}
            </h3>
            <div className="flex gap-2">
              {[2023, 2024, 2025, 2026].map(year => (
                <button
                  key={year}
                  onClick={() => setBulkYear(year)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                    bulkYear === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground sticky left-0 bg-secondary/50 z-10">
                    Member
                  </th>
                  {MONTH_NAMES.map((month, i) => (
                    <th key={i} className="p-2 text-center text-xs font-medium text-muted-foreground w-16">
                      {month.slice(0, 3)}
                    </th>
                  ))}
                  <th className="p-3 text-center text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...members]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(member => {
                    const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
                    const expectedAmount = monthlyType?.amount || 0;
                    let paidMonthsCount = 0;
                    
                    // Determine member's start month based on join date
                    const joinDate = new Date(member.joinedDate);
                    const joinYear = joinDate.getFullYear();
                    const joinMonth = joinDate.getMonth() + 1;
                    
                    // Calculate how many months this member is responsible for
                    let applicableMonths = 12;
                    if (joinYear === bulkYear) {
                      applicableMonths = 12 - joinMonth + 1; // From join month to December
                    } else if (joinYear > bulkYear) {
                      applicableMonths = 0; // Not a member yet in this year
                    }
                    
                    return (
                      <tr key={member.id} className="border-t border-primary/10 hover:bg-secondary/30 transition-colors">
                        <td className="p-3 font-medium text-foreground sticky left-0 bg-background z-10">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{member.name}</span>
                          </div>
                        </td>
                        {MONTH_NAMES.map((_, monthIndex) => {
                          const month = monthIndex + 1;
                          
                          // Check if member was a member during this month
                          const wasNotMemberYet = (joinYear === bulkYear && month < joinMonth) || (joinYear > bulkYear);
                          
                          if (wasNotMemberYet) {
                            // Show N/A for months before member joined
                            return (
                              <td key={month} className="p-1 text-center">
                                <div className="w-full h-10 rounded-lg bg-secondary/20 flex items-center justify-center" title="Not a member yet">
                                  <span className="text-[10px] text-muted-foreground/40">N/A</span>
                                </div>
                              </td>
                            );
                          }
                          
                          // Use historical rate tracking - compare against rate at time of payment
                          const paymentDetails = getMemberMonthlyPaymentDetails(member.id, month, bulkYear);
                          const amountPaid = paymentDetails.amountPaid;
                          // Use the stored historical rate, or fall back to current expected amount
                          const effectiveExpected = paymentDetails.hasHistoricalRate 
                            ? paymentDetails.expectedAmount 
                            : expectedAmount;
                          const isFullyPaid = amountPaid >= effectiveExpected && effectiveExpected > 0;
                          const isPartiallyPaid = amountPaid > 0 && amountPaid < effectiveExpected;
                          const percentPaid = effectiveExpected > 0 ? Math.round((amountPaid / effectiveExpected) * 100) : 0;
                          
                          if (isFullyPaid) paidMonthsCount++;
                          
                          return (
                            <td key={month} className="p-1 text-center">
                              <button
                                onClick={() => handleCellClick(member, month, bulkYear)}
                                className={cn(
                                  "w-full h-10 rounded-lg transition-all flex items-center justify-center",
                                  isFullyPaid && "bg-green-500/20 hover:bg-green-500/30",
                                  isPartiallyPaid && "bg-yellow-500/20 hover:bg-yellow-500/30",
                                  !amountPaid && "bg-secondary/50 hover:bg-secondary"
                                )}
                              >
                                {isFullyPaid ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : isPartiallyPaid ? (
                                  <span className="text-xs font-bold text-yellow-500">
                                    {percentPaid}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          <span className={cn(
                            "font-medium",
                            applicableMonths > 0 && paidMonthsCount === applicableMonths ? "text-green-500" :
                            paidMonthsCount >= applicableMonths / 2 ? "text-yellow-500" :
                            "text-muted-foreground"
                          )}>
                            {paidMonthsCount}/{applicableMonths}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {/* Summary Row */}
              <tfoot className="bg-secondary/30 border-t-2 border-primary/20">
                <tr>
                  <td className="p-3 font-semibold text-foreground sticky left-0 bg-secondary/30 z-10">
                    Total Paid
                  </td>
                  {MONTH_NAMES.map((_, monthIndex) => {
                    const month = monthIndex + 1;
                    const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
                    const currentExpected = monthlyType?.amount || 0;
                    // Count members who are fully paid using historical rate
                    const paidCount = members.filter(m => {
                      const details = getMemberMonthlyPaymentDetails(m.id, month, bulkYear);
                      const effectiveExpected = details.hasHistoricalRate ? details.expectedAmount : currentExpected;
                      return details.amountPaid >= effectiveExpected && effectiveExpected > 0;
                    }).length;
                    
                    return (
                      <td key={month} className="p-2 text-center">
                        <span className={cn(
                          "text-xs font-medium",
                          paidCount === members.length ? "text-green-500" :
                          paidCount > 0 ? "text-yellow-500" :
                          "text-muted-foreground"
                        )}>
                          {paidCount}/{members.length}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-3 text-center font-semibold text-primary">
                    {(() => {
                      const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
                      const currentExpected = monthlyType?.amount || 0;
                      const totalPayments = members.reduce((sum, m) => {
                        let count = 0;
                        for (let month = 1; month <= 12; month++) {
                          const details = getMemberMonthlyPaymentDetails(m.id, month, bulkYear);
                          const effectiveExpected = details.hasHistoricalRate ? details.expectedAmount : currentExpected;
                          if (details.amountPaid >= effectiveExpected && effectiveExpected > 0) count++;
                        }
                        return sum + count;
                      }, 0);
                      const maxPayments = members.length * 12;
                      return `${totalPayments}/${maxPayments}`;
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Legend */}
          <div className="p-3 border-t border-primary/10 flex flex-wrap gap-4 text-xs text-muted-foreground bg-secondary/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <span>100% Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-500">60%</span>
              </div>
              <span>Partial (shows %)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-secondary/50 flex items-center justify-center">
                <span className="text-muted-foreground/40">—</span>
              </div>
              <span>Not Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-secondary/20 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/40">N/A</span>
              </div>
              <span>Not a member yet</span>
            </div>
            <div className="ml-auto text-foreground font-medium">
              💡 Click any cell to record/edit payment
            </div>
          </div>
        </div>
      )}

      {/* Special/Event Contributions Tables - Grouped by Year */}
      {(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        // Get ALL special contribution types (both active and inactive)
        const allSpecialTypes = contributionTypes.filter(t => t.category === "special");
        
        // If no special types at all, or no members, don't render
        if (members.length === 0 || allSpecialTypes.length === 0) return null;
        
        // Group types by year (from createdAt or deadline)
        const typesByYear: Record<number, typeof allSpecialTypes> = {};
        allSpecialTypes.forEach(type => {
          const year = type.deadline 
            ? new Date(type.deadline).getFullYear() 
            : new Date(type.createdAt).getFullYear();
          if (!typesByYear[year]) typesByYear[year] = [];
          typesByYear[year].push(type);
        });
        
        // Sort years descending (most recent first)
        const years = Object.keys(typesByYear).map(Number).sort((a, b) => b - a);
        
        return (
          <div className="space-y-4">
            {years.map(year => {
              const yearTypes = typesByYear[year];
              const activeTypes = yearTypes.filter(t => t.isActive && (!t.deadline || new Date(t.deadline) >= now));
              const expiredTypes = yearTypes.filter(t => !t.isActive || (t.deadline && new Date(t.deadline) < now));
              
              // Calculate member column width based on number of columns
              // Starts narrow, grows to match Monthly Dues width (180px) when 6+ columns
              const memberColWidth = yearTypes.length <= 2 ? "min-w-[100px]" :
                                     yearTypes.length <= 4 ? "min-w-[130px]" :
                                     yearTypes.length <= 6 ? "min-w-[150px]" : "min-w-[180px]";
              
              // Enable scrolling when more than 6 columns
              const enableScroll = yearTypes.length > 6;
              
              return (
                <div key={year} className="card-glass rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-primary/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          Special Contributions - {year}
                          {year === currentYear && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary">Current</span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activeTypes.length} active • {expiredTypes.length} past • 
                          {yearTypes.length} total
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {yearTypes.length > 0 ? (
                    <>
                      {enableScroll && (
                        <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 bg-secondary/20">
                          <span>←</span>
                          <span>Scroll horizontally to see all {yearTypes.length} contribution types</span>
                          <span>→</span>
                        </div>
                      )}
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        <table className="w-full">
                          <thead className="bg-secondary/50">
                            <tr>
                              <th className={cn(
                                "text-left p-3 text-sm font-medium text-muted-foreground sticky left-0 bg-secondary/50 z-10",
                                memberColWidth
                              )}>
                                Member
                              </th>
                              {yearTypes.map(type => {
                                const isExpired = !type.isActive || (type.deadline && new Date(type.deadline) < now);
                                // Abbreviate name to first 3-4 chars or first word
                                const shortName = type.name.length > 6 
                                  ? type.name.slice(0, 5) + "..." 
                                  : type.name;
                                return (
                                  <th key={type.id} className={cn(
                                    "p-2 text-center text-xs font-medium w-16",
                                    isExpired ? "text-muted-foreground/50 bg-secondary/30" : "text-muted-foreground"
                                  )}>
                                    <span className="truncate block" title={`${type.name} - ${formatCurrency(type.amount)}`}>
                                      {shortName}
                                    </span>
                                  </th>
                                );
                              })}
                              <th className="p-2 text-center text-xs font-medium text-muted-foreground">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...members]
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(member => {
                                let totalPaid = 0;
                                
                                return (
                                  <tr key={member.id} className="border-t border-primary/10 hover:bg-secondary/30 transition-colors">
                                    <td className={cn(
                                      "p-3 font-medium text-foreground sticky left-0 bg-background z-10",
                                      memberColWidth
                                    )}>
                                      <span className="truncate block">{member.name}</span>
                                    </td>
                                    {yearTypes.map(type => {
                                      const amountPaid = getMemberSpecialPayment(member.id, type.id);
                                      totalPaid += amountPaid;
                                      const isFullyPaid = amountPaid >= type.amount;
                                      const isPartiallyPaid = amountPaid > 0 && amountPaid < type.amount;
                                      const percentPaid = type.amount > 0 ? Math.round((amountPaid / type.amount) * 100) : 0;
                                      const isExpired = !type.isActive || (type.deadline && new Date(type.deadline) < now);
                                
                                      return (
                                        <td key={type.id} className={cn("p-1 text-center", isExpired && "bg-secondary/20")}>
                                          <button
                                            onClick={() => handleSpecialCellClick(member, type)}
                                            className={cn(
                                              "w-full h-10 rounded-lg transition-all flex items-center justify-center",
                                              isFullyPaid && "bg-green-500/20 hover:bg-green-500/30",
                                              isPartiallyPaid && "bg-yellow-500/20 hover:bg-yellow-500/30",
                                              !amountPaid && !isExpired && "bg-secondary/50 hover:bg-secondary",
                                              !amountPaid && isExpired && "bg-secondary/30 hover:bg-secondary/40"
                                            )}
                                          >
                                            {isFullyPaid ? (
                                              <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : isPartiallyPaid ? (
                                              <span className="text-xs font-bold text-yellow-500">
                                                {percentPaid}%
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground/40">—</span>
                                            )}
                                          </button>
                                        </td>
                                      );
                                    })}
                                    <td className="p-2 text-center">
                                      <span className={cn(
                                        "font-medium text-sm",
                                        (() => {
                                          const paidCount = yearTypes.filter(t => 
                                            getMemberSpecialPayment(member.id, t.id) >= t.amount
                                          ).length;
                                          return paidCount === yearTypes.length ? "text-green-500" :
                                                 paidCount > 0 ? "text-yellow-500" : "text-muted-foreground";
                                        })()
                                      )}>
                                        {yearTypes.filter(t => getMemberSpecialPayment(member.id, t.id) >= t.amount).length}/{yearTypes.length}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                          {/* Summary Row */}
                          <tfoot className="bg-secondary/30 border-t-2 border-primary/20">
                            <tr>
                              <td className={cn(
                                "p-3 font-semibold text-foreground sticky left-0 bg-secondary/30 z-10",
                                memberColWidth
                              )}>
                                Total Paid
                              </td>
                              {yearTypes.map(type => {
                                const paidCount = members.filter(m => 
                                  getMemberSpecialPayment(m.id, type.id) >= type.amount
                                ).length;
                                const isExpired = !type.isActive || (type.deadline && new Date(type.deadline) < now);
                                
                                return (
                                  <td key={type.id} className={cn("p-2 text-center", isExpired && "bg-secondary/20")}>
                                    <span className={cn(
                                      "text-xs font-bold",
                                      paidCount === members.length ? "text-green-500" :
                                      paidCount > 0 ? "text-yellow-500" :
                                      "text-muted-foreground"
                                    )}>
                                      {paidCount}/{members.length}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="p-2 text-center font-semibold text-muted-foreground">
                                —
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {/* Legend - only show on first/current year table */}
                      {year === years[0] && (
                        <div className="p-3 border-t border-primary/10 flex flex-wrap gap-4 text-xs text-muted-foreground bg-secondary/20">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                            <span>100% Paid</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-yellow-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-yellow-500">60%</span>
                            </div>
                            <span>Partial (shows %)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-secondary/50 flex items-center justify-center">
                              <span className="text-muted-foreground/40">—</span>
                            </div>
                            <span>Not Paid</span>
                          </div>
                          <div className="ml-auto text-foreground font-medium">
                            💡 Click any cell to add payment
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No special contributions for {year}.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Inactive/Past Contribution Types - At Bottom */}
      {(() => {
        const now = new Date();
        const inactiveTypes = contributionTypes.filter(t => {
          // Include types that are inactive OR have expired deadlines
          if (!t.isActive) return true;
          if (t.deadline && new Date(t.deadline) < now) return true;
          return false;
        });
        
        if (inactiveTypes.length === 0) return null;
        
        return (
          <details className="card-glass rounded-xl overflow-hidden">
            <summary className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="inline-flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">
                  Inactive/Past Contribution Types
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground">
                  {inactiveTypes.length}
                </span>
              </div>
            </summary>
            <div className="divide-y divide-primary/10 border-t border-primary/10">
              {inactiveTypes.map(type => {
                const isExpired = type.deadline && new Date(type.deadline) < now;
                return (
                  <div
                    key={type.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground line-through">{type.name}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        type.category === "monthly" 
                          ? "bg-blue-500/20 text-blue-400" 
                          : "bg-purple-500/20 text-purple-400"
                      )}>
                        {type.category === "monthly" ? "Monthly" : "Special"}
                      </span>
                      {!type.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400">
                          Inactive
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-500/20 text-gray-400">
                          Expired {type.deadline ? new Date(type.deadline).toLocaleDateString() : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-muted-foreground">{formatCurrency(type.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingType(type);
                          setTypeForm({
                            name: type.name,
                            category: type.category,
                            amount: type.amount.toString(),
                            description: type.description || "",
                            targetAmount: type.targetAmount?.toString() || "",
                            deadline: type.deadline || "",
                          });
                          setShowAddType(true);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })()}
      
      {/* Add Contribution Modal */}
      <Dialog open={showAddContribution} onOpenChange={setShowAddContribution}>
        <DialogContent className="max-w-md bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Record Contribution
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Record a new contribution payment from a member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Member *</Label>
              <Select
                value={contributionForm.memberId}
                onValueChange={(v) => setContributionForm({ ...contributionForm, memberId: v })}
              >
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Contribution Type *</Label>
              <Select
                value={contributionForm.typeId}
                onValueChange={(v) => {
                  const type = contributionTypes.find(t => t.id === v);
                  setContributionForm({ 
                    ...contributionForm, 
                    typeId: v,
                    amount: type?.amount.toString() || contributionForm.amount,
                  });
                }}
              >
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {getActiveContributionTypes().map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({formatCurrency(type.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Amount (RWF) *</Label>
              <Input
                type="number"
                value={contributionForm.amount}
                onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="5000"
              />
            </div>
            
            {contributionTypes.find(t => t.id === contributionForm.typeId)?.category === "monthly" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Month</Label>
                  <Select
                    value={contributionForm.month.toString()}
                    onValueChange={(v) => setContributionForm({ ...contributionForm, month: parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((name, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select
                    value={contributionForm.year.toString()}
                    onValueChange={(v) => setContributionForm({ ...contributionForm, year: parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div>
              <Label>Payment Method</Label>
              <Select
                value={contributionForm.paymentMethod}
                onValueChange={(v) => setContributionForm({ ...contributionForm, paymentMethod: v as any })}
              >
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="momo">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Reference/Receipt # (Optional)</Label>
              <Input
                value={contributionForm.reference}
                onChange={(e) => setContributionForm({ ...contributionForm, reference: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="e.g., MoMo ref number"
              />
            </div>
            
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={contributionForm.notes}
                onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddContribution(false)}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleAddContribution}>
                Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Type Modal */}
      <Dialog open={showAddType} onOpenChange={(open) => { setShowAddType(open); if (!open) { setEditingType(null); resetTypeForm(); } }}>
        <DialogContent className="max-w-md bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {editingType ? "Edit" : "Add"} Contribution Type
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {editingType ? "Update contribution type details" : "Create a new contribution type"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="e.g., Monthly Dues, Uniform Fund"
              />
            </div>
            
            <div>
              <Label>Category *</Label>
              <Select
                value={typeForm.category}
                onValueChange={(v) => setTypeForm({ ...typeForm, category: v as ContributionCategory })}
              >
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly (Recurring dues)</SelectItem>
                  <SelectItem value="special">Special (Uniforms, weddings, etc.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Amount per Member (RWF) *</Label>
              <Input
                type="number"
                value={typeForm.amount}
                onChange={(e) => setTypeForm({ ...typeForm, amount: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="5000"
              />
            </div>
            
            {typeForm.category !== "monthly" && (
              <>
                <div>
                  <Label>Target Total (Optional)</Label>
                  <Input
                    type="number"
                    value={typeForm.targetAmount}
                    onChange={(e) => setTypeForm({ ...typeForm, targetAmount: e.target.value })}
                    className="mt-1 bg-secondary border-primary/20"
                    placeholder="e.g., 500000 for uniform fund"
                  />
                </div>
                
                <div>
                  <Label>Deadline (Optional)</Label>
                  <Input
                    type="date"
                    value={typeForm.deadline}
                    onChange={(e) => setTypeForm({ ...typeForm, deadline: e.target.value })}
                    className="mt-1 bg-secondary border-primary/20"
                  />
                </div>
              </>
            )}
            
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddType(false); setEditingType(null); resetTypeForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSaveType}>
                {editingType ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Report Modal */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl bg-background border-primary/20 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Contributions Report
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              View and export contribution reports
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Report Type Toggle */}
            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setReportType("monthly")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  reportType === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setReportType("yearly")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  reportType === "yearly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
              </button>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-3">
              {reportType === "monthly" && (
                <Select
                  value={filterMonth.toString()}
                  onValueChange={(v) => setFilterMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-40 bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={filterYear.toString()}
                onValueChange={(v) => setFilterYear(parseInt(v))}
              >
                <SelectTrigger className="w-28 bg-secondary border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (reportType === "monthly") {
                    exportMonthlyDuesReport(filterYear);
                  } else {
                    exportAnnualFinancialSummary(filterYear);
                  }
                  toast({ title: "Exported", description: "Report exported to CSV" });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            
            {reportType === "monthly" ? (
              <>
                {/* Monthly Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-400">Paid</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{paidCount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-400">Unpaid</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{unpaidCount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary">Collected</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(monthlyReport.reduce((sum, r) => sum + r.paidAmount, 0))}
                    </p>
                  </div>
                </div>
                
                {/* Member List */}
                <div className="divide-y divide-primary/10 border border-primary/10 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                  {monthlyReport.map(report => (
                    <div key={report.memberId} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {report.isPaid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-foreground">{report.memberName}</span>
                      </div>
                      <div className="text-right">
                        {report.isPaid ? (
                          <span className="text-green-500 font-medium">{formatCurrency(report.paidAmount)}</span>
                        ) : (
                          <span className="text-red-400 text-sm">Unpaid</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {monthlyReport.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No members found.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Yearly Summary */}
                {(() => {
                  const yearContribs = contributions.filter(c => 
                    c.year === filterYear || new Date(c.createdAt).getFullYear() === filterYear
                  );
                  const monthlyDuesTotal = yearContribs.filter(c => c.category === "monthly").reduce((sum, c) => sum + c.amount, 0);
                  const specialTotal = yearContribs.filter(c => c.category !== "monthly").reduce((sum, c) => sum + c.amount, 0);
                  const totalCollected = yearContribs.reduce((sum, c) => sum + c.amount, 0);
                  
                  // Count unique months with payments
                  const paidMonths = new Set(
                    yearContribs.filter(c => c.category === "monthly" && c.month).map(c => c.month)
                  ).size;
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <p className="text-sm text-green-400">Total Collected</p>
                          <p className="text-xl font-bold text-green-500">{formatCurrency(totalCollected)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <p className="text-sm text-blue-400">Monthly Dues</p>
                          <p className="text-xl font-bold text-blue-500">{formatCurrency(monthlyDuesTotal)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          <p className="text-sm text-purple-400">Special</p>
                          <p className="text-xl font-bold text-purple-500">{formatCurrency(specialTotal)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <p className="text-sm text-primary">Transactions</p>
                          <p className="text-xl font-bold text-primary">{yearContribs.length}</p>
                        </div>
                      </div>
                      
                      {/* Monthly Breakdown */}
                      <div className="border border-primary/10 rounded-xl overflow-hidden">
                        <div className="p-3 bg-secondary/50 font-medium text-sm text-foreground">
                          Monthly Breakdown - {filterYear}
                        </div>
                        <div className="divide-y divide-primary/10 max-h-[250px] overflow-y-auto">
                          {MONTH_NAMES.map((monthName, i) => {
                            const monthContribs = yearContribs.filter(c => c.category === "monthly" && c.month === i + 1);
                            const monthTotal = monthContribs.reduce((sum, c) => sum + c.amount, 0);
                            const membersPaid = new Set(monthContribs.map(c => c.memberId)).size;
                            
                            return (
                              <div key={i} className="p-3 flex items-center justify-between">
                                <span className="text-foreground">{monthName}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-muted-foreground">{membersPaid} members</span>
                                  <span className={cn(
                                    "font-medium",
                                    monthTotal > 0 ? "text-green-500" : "text-muted-foreground"
                                  )}>
                                    {monthTotal > 0 ? formatCurrency(monthTotal) : "—"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Modal */}
      <Dialog open={showAuditTrail} onOpenChange={setShowAuditTrail}>
        <DialogContent className="max-w-4xl bg-background border-primary/20 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Payment Audit Trail
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              View detailed payment history and audit logs
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete record of all contribution payments with who recorded them and when.
            </p>
            
            <div className="border border-primary/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date/Time</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Member</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Period</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {contributions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 100)
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-secondary/30">
                        <td className="p-3 text-sm">
                          <div className="text-foreground">{new Date(c.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-medium text-foreground">{c.memberName}</div>
                          <div className="text-xs text-muted-foreground">{c.memberEmail}</div>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs",
                            c.category === "monthly" ? "bg-blue-500/20 text-blue-400" :
                            c.category === "special" ? "bg-purple-500/20 text-purple-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {c.typeName}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {c.month && c.year ? `${MONTH_NAMES[c.month - 1]} ${c.year}` : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-semibold text-green-500">{formatCurrency(c.amount)}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-foreground">{c.recordedBy || "System"}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {contributions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No payment records found.
                </div>
              )}
              {contributions.length > 100 && (
                <div className="p-3 text-center text-xs text-muted-foreground bg-secondary/30 border-t border-primary/10">
                  Showing most recent 100 records. Export to CSV for full history.
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-primary/10">
            <Button 
              variant="outline" 
              onClick={() => { 
                exportContributionsToCSV(); 
                toast({ title: "Exported", description: "Full audit trail exported to CSV" }); 
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Full History
            </Button>
            <Button variant="outline" onClick={() => setShowAuditTrail(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Annual Financial Summary Modal */}
      <Dialog open={showFinancialSummary} onOpenChange={setShowFinancialSummary}>
        <DialogContent className="max-w-3xl bg-background border-primary/20 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Annual Financial Summary
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              View annual financial performance summary
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Year Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Year:</span>
              {[2023, 2024, 2025, 2026].map(year => (
                <button
                  key={year}
                  onClick={() => setSummaryYear(year)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    summaryYear === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
            
            {/* Summary Cards */}
            {(() => {
              const yearContribs = contributions.filter(c => 
                c.year === summaryYear || new Date(c.createdAt).getFullYear() === summaryYear
              );
              const yearExpenses = getExpensesByYear(summaryYear);
              
              const totalIncome = yearContribs.reduce((sum, c) => sum + c.amount, 0);
              const monthlyDuesTotal = yearContribs.filter(c => c.category === "monthly").reduce((sum, c) => sum + c.amount, 0);
              const specialTotal = yearContribs.filter(c => c.category !== "monthly").reduce((sum, c) => sum + c.amount, 0);
              const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
              const netBalance = totalIncome - totalExpenses;
              
              return (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
                      <p className="text-xs text-muted-foreground">Total Income</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
                      <p className="text-xs text-muted-foreground">Total Expenses</p>
                    </div>
                    <div className={cn(
                      "card-glass rounded-xl p-4 text-center",
                      netBalance >= 0 ? "ring-1 ring-green-500/50" : "ring-1 ring-red-500/50"
                    )}>
                      <p className={cn(
                        "text-2xl font-bold",
                        netBalance >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatCurrency(Math.abs(netBalance))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {netBalance >= 0 ? "Net Surplus" : "Net Deficit"}
                      </p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{yearContribs.length + yearExpenses.length}</p>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                    </div>
                  </div>
                  
                  {/* Income Breakdown */}
                  <div className="card-glass rounded-xl p-4">
                    <h3 className="font-semibold text-green-500 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Income Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                        <span className="text-foreground">Monthly Dues</span>
                        <span className="font-semibold text-green-500">{formatCurrency(monthlyDuesTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                        <span className="text-foreground">Special Contributions</span>
                        <span className="font-semibold text-green-500">{formatCurrency(specialTotal)}</span>
                      </div>
                      {contributionTypes
                        .filter(t => t.category !== "monthly")
                        .map(type => {
                          const typeTotal = yearContribs.filter(c => c.typeId === type.id).reduce((sum, c) => sum + c.amount, 0);
                          if (typeTotal === 0) return null;
                          return (
                            <div key={type.id} className="flex justify-between items-center p-2 pl-6 text-sm">
                              <span className="text-muted-foreground">↳ {type.name}</span>
                              <span className="text-green-400">{formatCurrency(typeTotal)}</span>
                            </div>
                          );
                        })}
                      <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <span className="font-semibold text-foreground">Total Income</span>
                        <span className="font-bold text-green-500">{formatCurrency(totalIncome)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expense Breakdown */}
                  <div className="card-glass rounded-xl p-4">
                    <h3 className="font-semibold text-red-500 mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Expense Breakdown
                    </h3>
                    <div className="space-y-2">
                      {yearExpenses.length > 0 ? (
                        <>
                          {(() => {
                            const categories = [...new Set(yearExpenses.map(e => e.category))];
                            return categories.map(cat => {
                              const catTotal = yearExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                              return (
                                <div key={cat} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                                  <span className="text-foreground capitalize">{cat}</span>
                                  <span className="font-semibold text-red-500">{formatCurrency(catTotal)}</span>
                                </div>
                              );
                            });
                          })()}
                          <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <span className="font-semibold text-foreground">Total Expenses</span>
                            <span className="font-bold text-red-500">{formatCurrency(totalExpenses)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No expenses recorded for {summaryYear}</p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-primary/10">
            <Button 
              variant="outline" 
              onClick={() => { 
                exportAnnualFinancialSummary(summaryYear); 
                toast({ title: "Exported", description: `${summaryYear} financial summary exported to CSV` }); 
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
            <Button variant="outline" onClick={() => setShowFinancialSummary(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Monthly Dues Modal */}
      <Dialog open={showBulkMonthlyDues} onOpenChange={(open) => { 
        setShowBulkMonthlyDues(open); 
        if (!open) { 
          setBulkMemberId(""); 
          setSelectedMonths([]); 
        } 
      }}>
        <DialogContent className="max-w-2xl bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Record Monthly Dues
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Record monthly dues payment from a member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Member Selection */}
            <div>
              <Label>Select Member *</Label>
              <Select
                value={bulkMemberId}
                onValueChange={setBulkMemberId}
              >
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Year Selection */}
            <div>
              <Label>Year</Label>
              <div className="flex gap-2 mt-2">
                {[2023, 2024, 2025, 2026].map(year => (
                  <button
                    key={year}
                    onClick={() => setBulkYear(year)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      bulkYear === year
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Month Grid */}
            {bulkMemberId && (
              <div>
                <Label className="mb-3 block">
                  Select Months to Record
                  <span className="text-muted-foreground text-xs ml-2">
                    (Click to select/deselect)
                  </span>
                </Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {MONTH_NAMES.map((name, index) => {
                    const month = index + 1;
                    const alreadyPaid = getPaidMonthsForMember(bulkMemberId, bulkYear).includes(month);
                    const isSelected = selectedMonths.includes(month);
                    const isFutureMonth = bulkYear === new Date().getFullYear() && month > new Date().getMonth() + 1;
                    
                    return (
                      <button
                        key={month}
                        onClick={() => !alreadyPaid && !isFutureMonth && toggleMonthSelection(month)}
                        disabled={alreadyPaid || isFutureMonth}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-center",
                          alreadyPaid && "bg-green-500/10 border-green-500/30 cursor-default",
                          isSelected && !alreadyPaid && "bg-primary/20 border-primary",
                          !alreadyPaid && !isSelected && !isFutureMonth && "bg-secondary border-primary/10 hover:border-primary/30 cursor-pointer",
                          isFutureMonth && "bg-secondary/50 border-primary/5 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <p className={cn(
                          "font-medium text-sm",
                          alreadyPaid ? "text-green-500" : 
                          isSelected ? "text-primary" : 
                          isFutureMonth ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {name.slice(0, 3)}
                        </p>
                        <div className="mt-1">
                          {alreadyPaid ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : isSelected ? (
                            <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                          ) : isFutureMonth ? (
                            <Clock className="w-5 h-5 text-muted-foreground mx-auto" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-primary/30 mx-auto" />
                          )}
                        </div>
                        {alreadyPaid && (
                          <p className="text-xs text-green-400 mt-1">Paid</p>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                    <span>Already Paid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/20 border-2 border-primary" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-secondary border border-primary/10" />
                    <span>Unpaid</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Summary & Save */}
            {bulkMemberId && selectedMonths.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recording {selectedMonths.length} month(s)</p>
                    <p className="font-semibold text-foreground">
                      {selectedMonths.sort((a, b) => a - b).map(m => MONTH_NAMES[m - 1].slice(0, 3)).join(", ")}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency((contributionTypes.find(t => t.category === "monthly" && t.isActive)?.amount || 0) * selectedMonths.length)}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowBulkMonthlyDues(false); setBulkMemberId(""); setSelectedMonths([]); }}>
                Cancel
              </Button>
              <Button 
                variant="gold" 
                className="flex-1" 
                onClick={handleBulkMonthlyDuesSave}
                disabled={!bulkMemberId || selectedMonths.length === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Record {selectedMonths.length} Month(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cell Payment Dialog */}
      <Dialog open={!!cellPayment} onOpenChange={(open) => !open && setCellPayment(null)}>
        <DialogContent className="max-w-sm bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Record Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Record a payment for the selected contribution
            </DialogDescription>
          </DialogHeader>
          
          {cellPayment && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/50 border border-primary/10">
                <p className="font-semibold text-foreground">{cellPayment.memberName}</p>
                <p className="text-sm text-muted-foreground">
                  {MONTH_NAMES[cellPayment.month - 1]} {cellPayment.year}
                </p>
              </div>
              
              <div>
                <Label>Amount Paid (RWF)</Label>
                <Input
                  type="number"
                  value={cellPayment.amount}
                  onChange={(e) => setCellPayment({ ...cellPayment, amount: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20 text-lg font-semibold"
                  placeholder={`Enter amount (expected: ${cellPayment.expectedAmount})`}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Monthly dues: <span className="font-medium text-foreground">{formatCurrency(cellPayment.expectedAmount)}</span>
                </p>
              </div>
              
              {/* Quick amount buttons */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick amounts:</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setCellPayment({ ...cellPayment, amount: (cellPayment.expectedAmount * 0.25).toString() })}
                  >
                    25%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setCellPayment({ ...cellPayment, amount: (cellPayment.expectedAmount * 0.5).toString() })}
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setCellPayment({ ...cellPayment, amount: (cellPayment.expectedAmount * 0.75).toString() })}
                  >
                    75%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                    onClick={() => setCellPayment({ ...cellPayment, amount: cellPayment.expectedAmount.toString() })}
                  >
                    100%
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCellPayment({ ...cellPayment, amount: "" })}
                  className="w-full text-red-400 border-red-400/30 hover:bg-red-500/10"
                >
                  Clear Payment
                </Button>
              </div>
              
              {/* Payment status preview */}
              {(() => {
                const amountNum = parseFloat(cellPayment.amount) || 0;
                const percent = cellPayment.expectedAmount > 0 
                  ? Math.round((amountNum / cellPayment.expectedAmount) * 100) 
                  : 0;
                
                return (
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center gap-3",
                    amountNum >= cellPayment.expectedAmount 
                      ? "bg-green-500/10 border-green-500/30" 
                      : amountNum > 0 
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-secondary/50 border-primary/10"
                  )}>
                    {amountNum >= cellPayment.expectedAmount ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-500 font-medium">✓ 100% Paid</span>
                      </>
                    ) : amountNum > 0 ? (
                      <>
                        <Clock className="w-6 h-6 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">
                          {percent}% Paid ({formatCurrency(amountNum)} of {formatCurrency(cellPayment.expectedAmount)})
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground/50 text-lg">—</span>
                        <span className="text-muted-foreground font-medium">No payment recorded</span>
                      </>
                    )}
                  </div>
                );
              })()}
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setCellPayment(null)}>
                  Cancel
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleSaveCellPayment}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Special Contribution Payment Dialog */}
      <Dialog open={!!specialCellPayment} onOpenChange={(open) => !open && setSpecialCellPayment(null)}>
        <DialogContent className="max-w-md bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Record Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Record a payment for the special contribution
            </DialogDescription>
          </DialogHeader>
          
          {specialCellPayment && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/50 border border-primary/10">
                <p className="font-semibold text-foreground">{specialCellPayment.memberName}</p>
                <p className="text-sm text-purple-400">{specialCellPayment.typeName}</p>
              </div>
              
              {/* Current progress */}
              {specialCellPayment.currentPaid > 0 && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-500">
                    Already paid: <span className="font-bold">{formatCurrency(specialCellPayment.currentPaid)}</span>
                    {" "}({Math.round((specialCellPayment.currentPaid / specialCellPayment.expectedAmount) * 100)}%)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Remaining: {formatCurrency(Math.max(0, specialCellPayment.expectedAmount - specialCellPayment.currentPaid))}
                  </p>
                </div>
              )}
              
              <div>
                <Label>Amount to Add (RWF)</Label>
                <Input
                  type="number"
                  value={specialCellPayment.amount}
                  onChange={(e) => setSpecialCellPayment({ ...specialCellPayment, amount: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20 text-lg font-semibold"
                  placeholder={`Expected: ${specialCellPayment.expectedAmount}`}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expected per member: <span className="font-medium text-foreground">{formatCurrency(specialCellPayment.expectedAmount)}</span>
                </p>
              </div>
              
              {/* Quick amount buttons */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick amounts:</p>
                <div className="flex gap-2 flex-wrap">
                  {specialCellPayment.currentPaid < specialCellPayment.expectedAmount && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                      onClick={() => setSpecialCellPayment({ 
                        ...specialCellPayment, 
                        amount: Math.max(0, specialCellPayment.expectedAmount - specialCellPayment.currentPaid).toString() 
                      })}
                    >
                      Complete ({formatCurrency(Math.max(0, specialCellPayment.expectedAmount - specialCellPayment.currentPaid))})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setSpecialCellPayment({ 
                      ...specialCellPayment, 
                      amount: (specialCellPayment.expectedAmount * 0.5).toString() 
                    })}
                  >
                    50% ({formatCurrency(specialCellPayment.expectedAmount * 0.5)})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setSpecialCellPayment({ 
                      ...specialCellPayment, 
                      amount: specialCellPayment.expectedAmount.toString() 
                    })}
                  >
                    Full ({formatCurrency(specialCellPayment.expectedAmount)})
                  </Button>
                </div>
              </div>
              
              {/* Preview */}
              {(() => {
                const amountToAdd = parseFloat(specialCellPayment.amount) || 0;
                const newTotal = specialCellPayment.currentPaid + amountToAdd;
                const newPercent = specialCellPayment.expectedAmount > 0 
                  ? Math.round((newTotal / specialCellPayment.expectedAmount) * 100) 
                  : 0;
                
                return amountToAdd > 0 ? (
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center gap-3",
                    newTotal >= specialCellPayment.expectedAmount 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-yellow-500/10 border-yellow-500/30"
                  )}>
                    {newTotal >= specialCellPayment.expectedAmount ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-500 font-medium">Will be 100% Paid!</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-6 h-6 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">
                          Will be {newPercent}% ({formatCurrency(newTotal)})
                        </span>
                      </>
                    )}
                  </div>
                ) : null;
              })()}
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSpecialCellPayment(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="gold" 
                  className="flex-1" 
                  onClick={handleSaveSpecialPayment}
                  disabled={!specialCellPayment.amount || parseFloat(specialCellPayment.amount) <= 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

