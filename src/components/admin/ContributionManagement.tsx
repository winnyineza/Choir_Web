import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  Pencil,
  Trash2,
  Filter,
  DollarSign,
  Clock,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/flutterwave";
import { getAllMembers, type Member } from "@/lib/dataService";
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
  setMemberMonthlyPayment,
  getMonthName,
  MONTH_NAMES,
  type Contribution,
  type ContributionType,
  type ContributionCategory,
} from "@/lib/contributionService";
import { cn } from "@/lib/utils";

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
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [showBulkMonthlyDues, setShowBulkMonthlyDues] = useState(false);
  const [editingType, setEditingType] = useState<ContributionType | null>(null);
  
  // Bulk monthly dues state
  const [bulkMemberId, setBulkMemberId] = useState("");
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  
  // Cell click payment state
  const [cellPayment, setCellPayment] = useState<{
    memberId: string;
    memberName: string;
    memberEmail: string;
    month: number;
    year: number;
    amount: string;
    expectedAmount: number;
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
    const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
    const currentAmount = getMemberMonthlyPayment(member.id, month, year);
    
    setCellPayment({
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      month,
      year,
      amount: currentAmount > 0 ? currentAmount.toString() : (monthlyType?.amount || 0).toString(),
      expectedAmount: monthlyType?.amount || 0,
    });
  };

  // Save cell payment
  const handleSaveCellPayment = () => {
    if (!cellPayment) return;
    
    const amount = parseFloat(cellPayment.amount) || 0;
    
    setMemberMonthlyPayment(
      cellPayment.memberId,
      cellPayment.memberName,
      cellPayment.memberEmail,
      cellPayment.month,
      cellPayment.year,
      amount,
      currentUser?.name || "Admin"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalCollected)}</p>
              <p className="text-xs text-muted-foreground">Total Collected</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.thisMonthTotal)}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.thisYearTotal)}</p>
              <p className="text-xs text-muted-foreground">This Year</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.uniqueContributors}</p>
              <p className="text-xs text-muted-foreground">Contributors</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant="gold" onClick={() => setShowBulkMonthlyDues(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Monthly Dues
          </Button>
          <Button variant="outline" onClick={() => setShowAddContribution(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Other
          </Button>
          <Button variant="outline" onClick={() => setShowAddType(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
          <Button variant="outline" onClick={() => setShowMonthlyReport(true)}>
            <Users className="w-4 h-4 mr-2" />
            Report
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 bg-secondary border-primary/20"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-secondary border-primary/20">
              <SelectValue placeholder="Filter by type" />
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
      
      {/* Contribution Types */}
      <div className="card-glass rounded-xl p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Contribution Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {contributionTypes.map(type => (
            <div
              key={type.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                type.isActive 
                  ? "bg-secondary/50 border-primary/20" 
                  : "bg-secondary/20 border-primary/10 opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{type.name}</h4>
                  <p className="text-sm text-primary">{formatCurrency(type.amount)}</p>
                  <span className={cn(
                    "inline-block mt-1 px-2 py-0.5 rounded-full text-xs",
                    type.category === "monthly" ? "bg-blue-500/20 text-blue-400" :
                    type.category === "special" ? "bg-purple-500/20 text-purple-400" :
                    type.category === "event" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  )}>
                    {type.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleTypeActive(type)}
                  >
                    {type.isActive ? (
                      <XCircle className="w-3 h-3 text-red-400" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {contributionTypes.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full text-center py-4">
              No contribution types yet. Add one to get started.
            </p>
          )}
        </div>
      </div>

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
                    
                    return (
                      <tr key={member.id} className="border-t border-primary/10 hover:bg-secondary/30 transition-colors">
                        <td className="p-3 font-medium text-foreground sticky left-0 bg-background z-10">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{member.name}</span>
                          </div>
                        </td>
                        {MONTH_NAMES.map((_, monthIndex) => {
                          const month = monthIndex + 1;
                          const amountPaid = getMemberMonthlyPayment(member.id, month, bulkYear);
                          const isFuture = bulkYear === new Date().getFullYear() && month > new Date().getMonth() + 1;
                          const isFullyPaid = amountPaid >= expectedAmount;
                          const isPartiallyPaid = amountPaid > 0 && amountPaid < expectedAmount;
                          
                          if (isFullyPaid) paidMonthsCount++;
                          
                          return (
                            <td key={month} className="p-1 text-center">
                              {isFuture ? (
                                <span className="text-muted-foreground/30">—</span>
                              ) : (
                                <button
                                  onClick={() => handleCellClick(member, month, bulkYear)}
                                  className={cn(
                                    "w-full h-10 rounded-lg transition-all flex items-center justify-center",
                                    isFullyPaid && "bg-green-500/20 hover:bg-green-500/30",
                                    isPartiallyPaid && "bg-yellow-500/20 hover:bg-yellow-500/30",
                                    !amountPaid && "bg-red-500/10 hover:bg-red-500/20"
                                  )}
                                >
                                  {isFullyPaid ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : isPartiallyPaid ? (
                                    <span className="text-xs font-medium text-yellow-500">
                                      {(amountPaid / 1000).toFixed(0)}k
                                    </span>
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400/50" />
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          <span className={cn(
                            "font-medium",
                            paidMonthsCount === 12 ? "text-green-500" :
                            paidMonthsCount >= 6 ? "text-yellow-500" :
                            "text-muted-foreground"
                          )}>
                            {paidMonthsCount}/12
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
                    const expectedAmount = monthlyType?.amount || 0;
                    const paidCount = members.filter(m => 
                      getMemberMonthlyPayment(m.id, month, bulkYear) >= expectedAmount
                    ).length;
                    const isFuture = bulkYear === new Date().getFullYear() && month > new Date().getMonth() + 1;
                    
                    return (
                      <td key={month} className="p-2 text-center">
                        {isFuture ? (
                          <span className="text-muted-foreground/30">—</span>
                        ) : (
                          <span className={cn(
                            "text-xs font-medium",
                            paidCount === members.length ? "text-green-500" :
                            paidCount > 0 ? "text-yellow-500" :
                            "text-red-400"
                          )}>
                            {paidCount}/{members.length}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center font-semibold text-primary">
                    {(() => {
                      const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
                      const expectedAmount = monthlyType?.amount || 0;
                      const totalPayments = members.reduce((sum, m) => {
                        let count = 0;
                        for (let month = 1; month <= 12; month++) {
                          if (getMemberMonthlyPayment(m.id, month, bulkYear) >= expectedAmount) count++;
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
              <span>Full Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-500/20 flex items-center justify-center">
                <span className="text-xs font-medium text-yellow-500">3k</span>
              </div>
              <span>Partial (shows amount)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-400/50" />
              </div>
              <span>Not Paid</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              💡 Click any cell to record payment
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Contributions */}
      <div className="card-glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-primary/10">
          <h3 className="font-semibold text-foreground">Recent Contributions</h3>
        </div>
        {filteredContributions.length > 0 ? (
          <div className="divide-y divide-primary/10">
            {filteredContributions.slice(0, 20).map(contribution => (
              <div key={contribution.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    contribution.category === "monthly" ? "bg-blue-500/20" :
                    contribution.category === "special" ? "bg-purple-500/20" :
                    "bg-yellow-500/20"
                  )}>
                    <DollarSign className={cn(
                      "w-4 h-4",
                      contribution.category === "monthly" ? "text-blue-500" :
                      contribution.category === "special" ? "text-purple-500" :
                      "text-yellow-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{contribution.memberName}</p>
                    <p className="text-sm text-muted-foreground">
                      {contribution.typeName}
                      {contribution.month && contribution.year && (
                        <> · {getMonthName(contribution.month)} {contribution.year}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-green-500">{formatCurrency(contribution.amount)}</p>
                  <p className="text-xs text-muted-foreground hidden md:block">
                    {new Date(contribution.createdAt).toLocaleDateString()}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContribution(contribution.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No contributions recorded yet.</p>
          </div>
        )}
      </div>
      
      {/* Add Contribution Modal */}
      <Dialog open={showAddContribution} onOpenChange={setShowAddContribution}>
        <DialogContent className="max-w-md bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Record Contribution
            </DialogTitle>
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
                  <SelectItem value="monthly">Monthly (Recurring)</SelectItem>
                  <SelectItem value="special">Special (One-time)</SelectItem>
                  <SelectItem value="event">Event (e.g., Wedding)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
      
      {/* Monthly Report Modal */}
      <Dialog open={showMonthlyReport} onOpenChange={setShowMonthlyReport}>
        <DialogContent className="max-w-2xl bg-background border-primary/20 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Monthly Dues Report
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Month/Year Selector */}
            <div className="flex gap-3">
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
            </div>
            
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            {/* Member List */}
            <div className="divide-y divide-primary/10 border border-primary/10 rounded-xl overflow-hidden">
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
                      <span className="text-muted-foreground">-</span>
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
                <Label>Amount (RWF)</Label>
                <Input
                  type="number"
                  value={cellPayment.amount}
                  onChange={(e) => setCellPayment({ ...cellPayment, amount: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20 text-lg font-semibold"
                  placeholder="0"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: {formatCurrency(cellPayment.expectedAmount)}
                </p>
              </div>
              
              {/* Quick amount buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setCellPayment({ ...cellPayment, amount: cellPayment.expectedAmount.toString() })}
                >
                  Full ({formatCurrency(cellPayment.expectedAmount)})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setCellPayment({ ...cellPayment, amount: (cellPayment.expectedAmount / 2).toString() })}
                >
                  Half ({formatCurrency(cellPayment.expectedAmount / 2)})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCellPayment({ ...cellPayment, amount: "0" })}
                  className="text-red-400"
                >
                  Clear
                </Button>
              </div>
              
              {/* Payment status preview */}
              <div className={cn(
                "p-3 rounded-xl border flex items-center gap-3",
                parseFloat(cellPayment.amount) >= cellPayment.expectedAmount 
                  ? "bg-green-500/10 border-green-500/30" 
                  : parseFloat(cellPayment.amount) > 0 
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-red-500/10 border-red-500/30"
              )}>
                {parseFloat(cellPayment.amount) >= cellPayment.expectedAmount ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-green-500 font-medium">Fully Paid</span>
                  </>
                ) : parseFloat(cellPayment.amount) > 0 ? (
                  <>
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <span className="text-yellow-500 font-medium">
                      Partial ({((parseFloat(cellPayment.amount) / cellPayment.expectedAmount) * 100).toFixed(0)}%)
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-400" />
                    <span className="text-red-400 font-medium">Not Paid</span>
                  </>
                )}
              </div>
              
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
    </div>
  );
}

