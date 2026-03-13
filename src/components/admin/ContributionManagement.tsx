import { useState, useEffect, useMemo } from "react";
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
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/flutterwave";
import { getAllMembers, getSettings, type Member } from "@/lib/dataService";
import { addAuditLog } from "@/lib/adminService";
import {
  getAllContributions,
  getAllContributionTypes,
  getAllMonthlyDuesExceptions,
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
  markMemberMonthlyTolerance,
  clearMemberMonthlyTolerance,
  getMonthlyRateForPeriod,
  getMemberDuesStartMonth,
  getMonthName,
  isMonthLocked,
  setLockDay,
  getLockDay,
  getDaysUntilLock,
  MONTH_NAMES,
  type Contribution,
  type ContributionType,
  type ContributionCategory,
  type MonthlyDuesException,
} from "@/lib/contributionService";
import { isMonthTemporarilyUnlocked, createUnlockRequest, type UnlockRequestType } from "@/lib/unlockRequestService";
import { notifyUnlockRequestCreated, notifyContributionRecorded } from "@/lib/notificationEmailService";
import { cn } from "@/lib/utils";
import { Download, History, MoreHorizontal, FileText, Star, BarChart3, AlertTriangle, Lock, Unlock } from "lucide-react";
import {
  exportFullContributionHistory,
  exportContributionTypeTransactionReport,
  exportContributionStatusReport,
  exportAnnualFinancialSummary,
  type ContributionReportFormat,
  type ContributionCategoryFilter,
  type ContributionReportScope,
} from "@/lib/exportUtils";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";
import { getExpenseStats, getExpensesByYear } from "@/lib/expenseService";

export function ContributionManagement() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const todayIso = new Date().toISOString().split("T")[0];
  
  // Data
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [monthlyExceptions, setMonthlyExceptions] = useState<MonthlyDuesException[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getContributionStats>> | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<Awaited<ReturnType<typeof getMonthlyDuesReport>>>([]);
  const [reportStatusPreview, setReportStatusPreview] = useState<Awaited<ReturnType<typeof getMonthlyDuesReport>>>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  
  // Modals
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportKind, setReportKind] = useState<"full_history" | "contribution_type" | "status_report" | "annual_summary">("full_history");
  const [reportScope, setReportScope] = useState<ContributionReportScope>("year");
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportTypeId, setReportTypeId] = useState<string>("all");
  const [reportCategoryFilter, setReportCategoryFilter] = useState<ContributionCategoryFilter>("all");
  const [reportStartDate, setReportStartDate] = useState<string>(`${new Date().getFullYear()}-01-01`);
  const [reportEndDate, setReportEndDate] = useState<string>(todayIso);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [showUnlockRequest, setShowUnlockRequest] = useState(false);
  const [unlockForm, setUnlockForm] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() === 0 ? 12 : now.getMonth(),
      year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
      reason: "",
    };
  });
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summaryYearExpenses, setSummaryYearExpenses] = useState<Awaited<ReturnType<typeof getExpensesByYear>>>([]);
  const [showBulkMonthlyDues, setShowBulkMonthlyDues] = useState(false);
  const [editingType, setEditingType] = useState<ContributionType | null>(null);
  
  // Bulk monthly dues state
  const [bulkMemberId, setBulkMemberId] = useState("");
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [bulkPaidMonths, setBulkPaidMonths] = useState<number[]>([]);
  
  // Cell click payment state (for monthly)
  const [cellPayment, setCellPayment] = useState<{
    memberId: string;
    memberName: string;
    memberEmail: string;
    month: number;
    year: number;
    amount: string;
    expectedAmount: number;
    isTolerated: boolean;
    toleratedRecordId?: string;
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
  const [savingCellPayment, setSavingCellPayment] = useState(false);
  const [savingTolerance, setSavingTolerance] = useState(false);
  const [savingSpecialPayment, setSavingSpecialPayment] = useState(false);
  
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showFinancialSummary) {
      getExpensesByYear(summaryYear).then(setSummaryYearExpenses);
    }
  }, [showFinancialSummary, summaryYear]);

  useEffect(() => {
    if (members.length === 0) return;
    getMonthlyDuesReport(filterMonth, filterYear, members.map(m => ({ id: m.id, name: m.name, email: m.email })))
      .then(setMonthlyReport);
  }, [filterMonth, filterYear, members]);

  useEffect(() => {
    const selectedType = contributionTypes.find((type) => type.id === reportTypeId);
    if (!showReport || reportKind !== "status_report" || members.length === 0 || selectedType?.category !== "monthly") {
      setReportStatusPreview([]);
      return;
    }
    const monthsToPreview = reportScope === "period" && reportStartDate && reportEndDate
      ? (() => {
          const start = new Date(reportStartDate);
          const end = new Date(reportEndDate);
          const months: Array<{ month: number; year: number }> = [];
          const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
          const boundary = new Date(end.getFullYear(), end.getMonth(), 1);
          while (cursor <= boundary) {
            months.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
            cursor.setMonth(cursor.getMonth() + 1);
          }
          return months;
        })()
      : reportScope === "month"
        ? [{ month: reportMonth, year: reportYear }]
        : Array.from({ length: 12 }, (_, index) => ({ month: index + 1, year: reportYear }));

    Promise.all(
      monthsToPreview.map(({ month, year }) =>
        getMonthlyDuesReport(
          month,
          year,
          members.map((member) => ({ id: member.id, name: member.name, email: member.email }))
        )
      )
    ).then((results) => {
      const flattened = results.flat();
      const combined = members.map((member) => {
        const memberRows = flattened.filter((row) => row.memberId === member.id);
        const applicableRows = memberRows.filter((row) => row.status !== "not_applicable");
        const expectedAmount = applicableRows.reduce((sum, row) => sum + row.expectedAmount, 0);
        const paidAmount = applicableRows.reduce((sum, row) => sum + row.paidAmount, 0);
        const toleratedCount = applicableRows.filter((row) => row.status === "tolerated").length;
        const unpaidCount = applicableRows.filter((row) => row.status === "unpaid").length;
        const status =
          applicableRows.length === 0
            ? "not_applicable"
            : paidAmount >= expectedAmount && expectedAmount > 0
              ? "paid"
              : paidAmount > 0
                ? "partial"
                : toleratedCount === applicableRows.length
                  ? "tolerated"
                  : toleratedCount > 0 && unpaidCount > 0
                    ? "partial"
                    : "unpaid";

        return {
          memberId: member.id,
          memberName: member.name,
          memberEmail: member.email,
          expectedAmount,
          paidAmount,
          isPaid: status === "paid",
          status,
          isTolerated: status === "tolerated",
          contributions: [],
        };
      });
      setReportStatusPreview(combined as Awaited<ReturnType<typeof getMonthlyDuesReport>>);
    });
  }, [showReport, reportKind, reportTypeId, reportMonth, reportYear, reportScope, reportStartDate, reportEndDate, members, contributionTypes]);
  
  const loadData = async () => {
    const [contribs, types, memb, settings, exceptions] = await Promise.all([
      getAllContributions(),
      getAllContributionTypes(),
      getAllMembers(),
      getSettings(),
      getAllMonthlyDuesExceptions(),
    ]);
    // Sync the lock day from settings
    if (settings.contributionLockDay) {
      setLockDay(settings.contributionLockDay);
    }
    setContributions(contribs);
    setContributionTypes(types);
    setMembers(memb);
    setMonthlyExceptions(exceptions);
    const [st, report] = await Promise.all([
      getContributionStats(),
      getMonthlyDuesReport(filterMonth, filterYear, memb.map(m => ({ id: m.id, name: m.name, email: m.email }))),
    ]);
    setStats(st);
    setMonthlyReport(report);
  };

  // Pre-computed payment details for bulk modal table (member x month x bulkYear)
  const paymentDetailsMap = useMemo(() => {
    const getRateForPeriod = (month: number, year: number): number => {
      const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
      if (!monthlyType) return 0;
      const rateHistory = monthlyType.rateHistory;
      if (!rateHistory || rateHistory.length === 0) return monthlyType.amount;
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      const sortedHistory = [...rateHistory].sort(
        (a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime()
      );
      let applicableRate = sortedHistory[0].amount;
      for (const entry of sortedHistory) {
        const effectiveDate = new Date(entry.effectiveFrom);
        if (effectiveDate <= endOfMonth) applicableRate = entry.amount;
        else break;
      }
      return applicableRate;
    };
    const map: Record<string, {
      amountPaid: number;
      expectedAmount: number;
      hasHistoricalRate: boolean;
      isTolerated: boolean;
      toleratedRecordId?: string;
    }> = {};
    for (const m of members) {
      for (let month = 1; month <= 12; month++) {
        const key = `${m.id}-${month}-${bulkYear}`;
        const monthlyContribs = contributions.filter(
          c => c.memberId === m.id && c.month === month && c.year === bulkYear && c.category === "monthly"
        );
        const amountPaid = monthlyContribs.reduce((sum, c) => sum + c.amount, 0);
        const storedExpected = monthlyContribs.find(c => c.expectedAmount)?.expectedAmount;
        const rateForMonth = getRateForPeriod(month, bulkYear);
        const toleratedRecord = monthlyExceptions.find(
          (record) => record.memberId === m.id && record.month === month && record.year === bulkYear && !record.clearedAt
        );
        map[key] = {
          amountPaid,
          expectedAmount: storedExpected ?? rateForMonth,
          hasHistoricalRate: !!storedExpected || rateForMonth > 0,
          isTolerated: !!toleratedRecord && amountPaid <= 0,
          toleratedRecordId: toleratedRecord?.id,
        };
      }
    }
    return map;
  }, [contributions, contributionTypes, members, bulkYear, monthlyExceptions]);

  const canManageTolerance = currentUser?.role === "finance" || currentUser?.role === "main_admin" || currentUser?.role === "super_admin";
  const canBypassContributionLock = currentUser?.role === "main_admin" || currentUser?.role === "super_admin";

  const openUnlockRequestDialog = (month: number, year: number) => {
    setUnlockForm({
      month,
      year,
      reason: "",
    });
    setShowUnlockRequest(true);
  };

  const openReportModal = (kind: "full_history" | "contribution_type" | "status_report" | "annual_summary") => {
    setReportKind(kind);
    if (kind === "annual_summary") {
      setReportTypeId("all");
      setReportCategoryFilter("all");
      setReportScope("year");
    } else if (kind === "full_history") {
      setReportTypeId("all");
      setReportScope("year");
    } else if (kind === "contribution_type" || kind === "status_report") {
      const firstActiveType = contributionTypes.find((type) => type.isActive);
      setReportTypeId(firstActiveType?.id || "all");
      setReportScope(kind === "status_report" ? "month" : "year");
    }
    setShowReport(true);
  };

  const handleExportReport = async (format: ContributionReportFormat) => {
    if (reportScope === "period") {
      if (!reportStartDate || !reportEndDate) {
        toast({ title: "Choose dates", description: "Select both a start date and end date.", variant: "destructive" });
        return;
      }
      if (new Date(reportStartDate) > new Date(reportEndDate)) {
        toast({ title: "Invalid period", description: "The start date must be before the end date.", variant: "destructive" });
        return;
      }
    }

    if (reportKind === "full_history") {
      await exportFullContributionHistory(
        {
          year: reportScope === "year" || reportScope === "month" ? reportYear : undefined,
          month: reportScope === "month" ? reportMonth : undefined,
          startDate: reportScope === "period" ? reportStartDate : undefined,
          endDate: reportScope === "period" ? reportEndDate : undefined,
          typeId: reportTypeId === "all" ? undefined : reportTypeId,
          category: reportCategoryFilter,
        },
        format
      );
      toast({ title: "Exported", description: `Full contribution history exported to ${format === "pdf" ? "PDF" : "Excel"}` });
      return;
    }

    if (reportKind === "contribution_type") {
      if (reportTypeId === "all") {
        toast({ title: "Select a type", description: "Choose a contribution type first.", variant: "destructive" });
        return;
      }
      const selectedType = contributionTypes.find((type) => type.id === reportTypeId);
      await exportContributionTypeTransactionReport(
        {
          typeId: reportTypeId,
          year: reportScope === "year" || reportScope === "month" ? reportYear : undefined,
          month: selectedType?.category === "monthly" && reportScope === "month" ? reportMonth : undefined,
          startDate: reportScope === "period" ? reportStartDate : undefined,
          endDate: reportScope === "period" ? reportEndDate : undefined,
        },
        format
      );
      toast({ title: "Exported", description: `${selectedType?.name || "Contribution"} report exported to ${format === "pdf" ? "PDF" : "Excel"}` });
      return;
    }

    if (reportKind === "status_report") {
      if (reportTypeId === "all") {
        toast({ title: "Select a type", description: "Choose a contribution type first.", variant: "destructive" });
        return;
      }
      const selectedType = contributionTypes.find((type) => type.id === reportTypeId);
      await exportContributionStatusReport(
        {
          typeId: reportTypeId,
          year: reportYear,
          month: selectedType?.category === "monthly" && reportScope === "month" ? reportMonth : undefined,
          startDate: reportScope === "period" ? reportStartDate : undefined,
          endDate: reportScope === "period" ? reportEndDate : undefined,
        },
        format
      );
      toast({ title: "Exported", description: `${selectedType?.name || "Contribution"} status report exported to ${format === "pdf" ? "PDF" : "Excel"}` });
      return;
    }

    await exportAnnualFinancialSummary(reportYear, format);
    toast({ title: "Exported", description: `${reportYear} annual summary exported to ${format === "pdf" ? "PDF" : "Excel"}` });
  };

  const handleExportAnnualSummary = async (format: ContributionReportFormat) => {
    await exportAnnualFinancialSummary(summaryYear, format);
    toast({ title: "Exported", description: `${summaryYear} financial summary exported to ${format === "pdf" ? "PDF" : "Excel"}` });
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
  const getPaidMonthsForMember = async (memberId: string, year: number): Promise<number[]> => {
    const memberContribs = await getContributionsByMember(memberId);
    return memberContribs
      .filter(c => c.category === "monthly" && c.year === year && c.month)
      .map(c => c.month!)
      .filter((m, i, arr) => arr.indexOf(m) === i); // unique
  };

  // Load paid months when member or year changes in bulk modal
  useEffect(() => {
    if (bulkMemberId && showBulkMonthlyDues) {
      getPaidMonthsForMember(bulkMemberId, bulkYear).then((paid) => {
        setBulkPaidMonths(paid);
        setSelectedMonths([]);
      });
    } else {
      setBulkPaidMonths([]);
    }
  }, [bulkMemberId, bulkYear, showBulkMonthlyDues]);

  // Handle bulk monthly dues save
  const handleBulkMonthlyDuesSave = async () => {
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
    
    // Only add contributions for newly selected months (not already paid)
    const newMonths = selectedMonths.filter(m => !bulkPaidMonths.includes(m));
    
    if (newMonths.length === 0) {
      toast({ title: "No new months", description: "All selected months are already paid.", variant: "destructive" });
      return;
    }
    
    // Create contribution for each new month
    await Promise.all(newMonths.map(month =>
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
      })
    ));
    
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
    if (bulkPaidMonths.includes(month)) return; // Can't unselect already paid months
    
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  // Handle cell click in the overview table
  const handleCellClick = async (member: Member, month: number, year: number) => {
    if (isMonthLocked(month, year) && !canBypassContributionLock) {
      const tempUnlocked = await isMonthTemporarilyUnlocked(month, year, "contributions");
      if (!tempUnlocked) {
        toast({
          title: "Month Locked",
          description: `${MONTH_NAMES[month - 1]} ${year} is locked. Request a temporary unlock to edit it.`,
          variant: "destructive",
        });
        openUnlockRequestDialog(month, year);
        return;
      }
    }
    const paymentDetails = await getMemberMonthlyPaymentDetails(member.id, month, year);
    
    // Use historical rate if payment exists, otherwise use the rate for that month
    const rateForMonth = await getMonthlyRateForPeriod(month, year);
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
      expectedAmount: effectiveExpected,
      isTolerated: paymentDetails.isTolerated,
      toleratedRecordId: paymentDetails.toleratedRecordId,
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
  const handleSaveSpecialPayment = async () => {
    if (!specialCellPayment) return;
    
    const amount = parseFloat(specialCellPayment.amount) || 0;
    
    if (amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    
    setSavingSpecialPayment(true);
    try {
      await createContribution({
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
      // Send contribution receipt email for special payment
      if (specialCellPayment.memberEmail) {
        const type = contributionTypes.find(t => t.id === specialCellPayment.typeId);
        notifyContributionRecorded(
          specialCellPayment.memberEmail,
          specialCellPayment.memberName,
          amount,
          specialCellPayment.expectedAmount || type?.targetAmount || 0,
          new Date().getMonth() + 1,
          new Date().getFullYear(),
          "special",
          specialCellPayment.typeName
        );
      }
      
      setSpecialCellPayment(null);
      await loadData();
    } finally {
      setSavingSpecialPayment(false);
    }
  };

  // Save cell payment
  const handleSaveCellPayment = async () => {
    if (!cellPayment) return;
    
    const amount = parseFloat(cellPayment.amount) || 0;
    
    setSavingCellPayment(true);
    try {
      await setMemberMonthlyPayment(
        cellPayment.memberId,
        cellPayment.memberName,
        cellPayment.memberEmail,
        cellPayment.month,
        cellPayment.year,
        amount,
        currentUser?.name || "Admin",
        currentUser?.role,
        cellPayment.expectedAmount, // Historical rate tracking
        canBypassContributionLock
      );
    
      if (amount > 0) {
        toast({
          title: "Payment Recorded",
          description: `${formatCurrency(amount)} for ${cellPayment.memberName} - ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}`,
        });
        // Send contribution receipt email
        if (cellPayment.memberEmail) {
          notifyContributionRecorded(
            cellPayment.memberEmail,
            cellPayment.memberName,
            amount,
            cellPayment.expectedAmount,
            cellPayment.month,
            cellPayment.year,
            "monthly"
          );
        }
      } else {
        toast({
          title: "Payment Removed",
          description: `Payment cleared for ${cellPayment.memberName} - ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}`,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save payment", variant: "destructive" });
    }
    
    setCellPayment(null);
    loadData();
    setSavingCellPayment(false);
  };

  const handleMarkTolerance = async () => {
    if (!cellPayment || !canManageTolerance) return;

    setSavingTolerance(true);
    try {
      await markMemberMonthlyTolerance({
        memberId: cellPayment.memberId,
        month: cellPayment.month,
        year: cellPayment.year,
        createdBy: currentUser?.name || "Admin",
        createdByRole: currentUser?.role || "finance",
      });
      addAuditLog(currentUser, "MONTHLY_DUES_TOLERATED", `${cellPayment.memberName} marked tolerated for ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}`);
      toast({
        title: "Marked as Tolerated",
        description: `${cellPayment.memberName} is now tolerated for ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}.`,
      });
      setCellPayment(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to mark tolerated month", variant: "destructive" });
    } finally {
      setSavingTolerance(false);
    }
  };

  const handleClearTolerance = async () => {
    if (!cellPayment || !canManageTolerance) return;

    setSavingTolerance(true);
    try {
      await clearMemberMonthlyTolerance({
        memberId: cellPayment.memberId,
        month: cellPayment.month,
        year: cellPayment.year,
        clearedBy: currentUser?.name || "Admin",
        clearedByRole: currentUser?.role || "finance",
      });
      addAuditLog(currentUser, "MONTHLY_DUES_TOLERANCE_REMOVED", `${cellPayment.memberName} tolerance removed for ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}`);
      toast({
        title: "Tolerance Removed",
        description: `${cellPayment.memberName} is back to normal dues tracking for ${MONTH_NAMES[cellPayment.month - 1]} ${cellPayment.year}.`,
      });
      setCellPayment(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove tolerated month", variant: "destructive" });
    } finally {
      setSavingTolerance(false);
    }
  };
  
  // Handle add contribution
  const handleAddContribution = async () => {
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
    
    await createContribution({
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
    await loadData();
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
  const handleSaveType = async () => {
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
      await updateContributionType(editingType.id, {
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
      await createContributionType({
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
    await loadData();
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
  
  const handleDeleteContribution = async (id: string) => {
    const contribution = contributions.find((item) => item.id === id);
    if (!confirmDestructiveAction({
      action: "delete",
      subject: `contribution record for ${contribution?.memberName || "this member"}`,
      warning: "This contribution record will be permanently removed.",
    })) return;

    await deleteContribution(id);
    toast({ title: "Deleted", description: "Contribution deleted." });
    await loadData();
  };
  
  const handleDeleteType = async (id: string) => {
    const hasContributions = contributions.some(c => c.typeId === id);
    if (hasContributions) {
      toast({ 
        title: "Cannot Delete", 
        description: "This type has contributions. Deactivate it instead.", 
        variant: "destructive" 
      });
      return;
    }
    
    const contributionType = contributionTypes.find((item) => item.id === id);
    if (!confirmDestructiveAction({
      action: "delete",
      subject: `contribution type "${contributionType?.name || "this type"}"`,
      warning: "This type will be removed from contribution setup.",
    })) return;

    await deleteContributionType(id);
    toast({ title: "Deleted", description: "Contribution type deleted." });
    await loadData();
  };
  
  const handleToggleTypeActive = async (type: ContributionType) => {
    await updateContributionType(type.id, { isActive: !type.isActive });
    await loadData();
    toast({ 
      title: type.isActive ? "Deactivated" : "Activated", 
      description: `${type.name} is now ${type.isActive ? "inactive" : "active"}.` 
    });
  };
  
  const selectedReportType = contributionTypes.find((type) => type.id === reportTypeId);
  const statusPreviewRows = selectedReportType?.category === "monthly" ? reportStatusPreview : [];
  const paidCount = statusPreviewRows.filter(r => r.status === "paid").length;
  const toleratedCount = statusPreviewRows.filter(r => r.status === "tolerated").length;
  const unpaidCount = statusPreviewRows.filter(r => r.status === "unpaid" || r.status === "partial").length;
  
  const monthlyMemberColumnClass = "min-w-[280px] w-[280px]";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Collected */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-green-400">{formatCurrency(stats?.totalCollected ?? 0)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Total Collected</p>
        </div>
        {/* Monthly */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats?.monthlyDuesCollected ?? 0)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Monthly</p>
        </div>
        {/* Special */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats?.specialContributions ?? 0)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Special</p>
        </div>
        {/* Outstanding Dues */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-red-400">{formatCurrency(stats?.totalOutstanding ?? stats?.outstandingDues ?? 0)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Outstanding (Dues + Fines)</p>
        </div>
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-yellow-400">{stats?.toleratedMonthsCount ?? 0}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Tolerated Months</p>
        </div>
        {/* This Month */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats?.thisMonthTotal ?? 0)}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">This Month</p>
        </div>
        {/* This Year */}
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats?.thisYearTotal ?? 0)}</p>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Reports
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => openReportModal("full_history")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Full History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openReportModal("contribution_type")}>
                  <Target className="w-4 h-4 mr-2" />
                  Contribution Type Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openReportModal("status_report")}>
                  <Users className="w-4 h-4 mr-2" />
                  Status Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openReportModal("annual_summary")}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Annual Summary
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowAuditTrail(true)}>
                  <History className="w-4 h-4 mr-2" />
                  Audit Trail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowFinancialSummary(true)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Annual Summary
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
          {/* Grace period banner */}
          {(() => {
            const now = new Date();
            const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
            const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            if (bulkYear === prevMonthYear || bulkYear === now.getFullYear()) {
              const daysLeft = getDaysUntilLock(prevMonth, prevMonthYear);
              if (daysLeft !== null && daysLeft > 0) {
                return (
                  <div className="mx-4 mt-3 px-4 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-yellow-500">
                      <span className="font-medium">{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span> to add {MONTH_NAMES[prevMonth - 1]} {prevMonthYear} data. 
                      Locks on the {getLockDay()}{getLockDay() === 1 ? "st" : getLockDay() === 2 ? "nd" : getLockDay() === 3 ? "rd" : "th"} of {MONTH_NAMES[prevMonth === 12 ? 0 : prevMonth]}.
                    </span>
                  </div>
                );
              }
              if (isMonthLocked(prevMonth, prevMonthYear) && !canBypassContributionLock) {
                return (
                  <div className="mx-4 mt-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between gap-2">
                    <span className="text-sm text-red-400 flex items-center gap-2">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      {MONTH_NAMES[prevMonth - 1]} {prevMonthYear} is locked.
                    </span>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => openUnlockRequestDialog(prevMonth, prevMonthYear)}>
                      <Unlock className="w-3 h-3 mr-1" /> Request Unlock
                    </Button>
                  </div>
                );
              }
            }
            return null;
          })()}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1260px] table-fixed">
              <colgroup>
                <col className="w-[280px]" />
                {MONTH_NAMES.map((_, index) => (
                  <col key={`monthly-col-${index}`} className="w-[72px]" />
                ))}
                <col className="w-[96px]" />
              </colgroup>
              <thead className="bg-secondary/50">
                <tr>
                  <th className={cn(
                    "text-left p-3 text-sm font-medium text-muted-foreground sticky left-0 bg-secondary/50 z-10",
                    monthlyMemberColumnClass
                  )}>
                    Member
                  </th>
                  {MONTH_NAMES.map((month, i) => {
                    const locked = isMonthLocked(i + 1, bulkYear);
                    return (
                    <th key={i} className={cn("p-2 text-center text-xs font-medium w-16", locked ? "text-muted-foreground/50" : "text-muted-foreground")} title={locked ? `${month} ${bulkYear} is locked` : undefined}>
                      <span className="flex items-center justify-center gap-0.5">
                        {month.slice(0, 3)}
                        {locked && <Lock className="w-2.5 h-2.5" />}
                      </span>
                    </th>
                    );
                  })}
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
                    let toleratedMonthsCount = 0;
                    const startMonth = getMemberDuesStartMonth(member, bulkYear);
                    const applicableMonths = startMonth === null ? 0 : 12 - startMonth + 1;
                    
                    return (
                      <tr key={member.id} className="border-t border-primary/10 hover:bg-secondary/30 transition-colors">
                        <td className={cn(
                          "p-3 font-medium text-foreground sticky left-0 bg-background z-10",
                          monthlyMemberColumnClass
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={member.name}>
                              {member.name}
                            </span>
                          </div>
                        </td>
                        {MONTH_NAMES.map((_, monthIndex) => {
                          const month = monthIndex + 1;
                          const wasNotMemberYet = startMonth === null || month < startMonth;

                          if (wasNotMemberYet) {
                            return (
                              <td key={month} className="p-1 text-center">
                                <div className="w-full h-10 rounded-lg bg-secondary/20 flex items-center justify-center" title="Not a member yet">
                                  <span className="text-[10px] text-muted-foreground/40">N/A</span>
                                </div>
                              </td>
                            );
                          }

                          // Use historical rate tracking - compare against rate at time of payment
                          const paymentDetails = paymentDetailsMap[`${member.id}-${month}-${bulkYear}`] ?? { amountPaid: 0, expectedAmount: expectedAmount, hasHistoricalRate: false };
                          const amountPaid = paymentDetails.amountPaid;
                          // Use the stored historical rate, or fall back to current expected amount
                          const effectiveExpected = paymentDetails.hasHistoricalRate 
                            ? paymentDetails.expectedAmount 
                            : expectedAmount;
                          const isTolerated = paymentDetails.isTolerated && amountPaid <= 0;
                          const isFullyPaid = amountPaid >= effectiveExpected && effectiveExpected > 0;
                          const isPartiallyPaid = amountPaid > 0 && amountPaid < effectiveExpected;
                          const percentPaid = effectiveExpected > 0 ? Math.round((amountPaid / effectiveExpected) * 100) : 0;
                          const locked = isMonthLocked(month, bulkYear);
                          const canEdit = !locked || canBypassContributionLock;
                          
                          if (isFullyPaid) paidMonthsCount++;
                          if (isTolerated) toleratedMonthsCount++;
                          
                          return (
                            <td key={month} className="p-1 text-center">
                              <button
                                onClick={() => handleCellClick(member, month, bulkYear)}
                                title={
                                  isTolerated
                                    ? "Tolerated / grace month"
                                    : locked
                                      ? (canBypassContributionLock ? `Locked month editable by admin override` : `${MONTH_NAMES[monthIndex]} ${bulkYear} is locked`)
                                      : undefined
                                }
                                className={cn(
                                  "w-full h-10 rounded-lg transition-all flex items-center justify-center relative",
                                  isFullyPaid && "bg-green-500/20 hover:bg-green-500/30",
                                  isPartiallyPaid && "bg-yellow-500/20 hover:bg-yellow-500/30",
                                  isTolerated && "bg-amber-500/20 hover:bg-amber-500/30",
                                  !amountPaid && !locked && "bg-secondary/50 hover:bg-secondary",
                                  !amountPaid && locked && "bg-secondary/30",
                                  locked && !canEdit && "cursor-not-allowed opacity-60"
                                )}
                              >
                                {isFullyPaid ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : isTolerated ? (
                                  <Clock className="w-5 h-5 text-amber-400" />
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
                            {paidMonthsCount}P/{toleratedMonthsCount}T/{applicableMonths}
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
                    monthlyMemberColumnClass
                  )}>
                    Total Paid
                  </td>
                  {MONTH_NAMES.map((_, monthIndex) => {
                    const month = monthIndex + 1;
                    const monthlyType = contributionTypes.find(t => t.category === "monthly" && t.isActive);
                    const currentExpected = monthlyType?.amount || 0;
                    // Count members who are fully paid using historical rate
                    const paidCount = members.filter(m => {
                      const details = paymentDetailsMap[`${m.id}-${month}-${bulkYear}`] ?? { amountPaid: 0, expectedAmount: currentExpected, hasHistoricalRate: false };
                      const effectiveExpected = details.hasHistoricalRate ? details.expectedAmount : currentExpected;
                      return details.amountPaid >= effectiveExpected && effectiveExpected > 0;
                    }).length;
                    const toleratedMonthCount = members.filter(m => {
                      const details = paymentDetailsMap[`${m.id}-${month}-${bulkYear}`] ?? { isTolerated: false };
                      return details.isTolerated;
                    }).length;
                    
                    return (
                      <td key={month} className="p-2 text-center">
                        <span className={cn(
                          "text-xs font-medium",
                          paidCount === members.length ? "text-green-500" :
                          paidCount > 0 ? "text-yellow-500" :
                          "text-muted-foreground"
                        )}>
                          {paidCount}P/{toleratedMonthCount}T
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
                          const details = paymentDetailsMap[`${m.id}-${month}-${bulkYear}`] ?? { amountPaid: 0, expectedAmount: currentExpected, hasHistoricalRate: false };
                          const effectiveExpected = details.hasHistoricalRate ? details.expectedAmount : currentExpected;
                          if (details.amountPaid >= effectiveExpected && effectiveExpected > 0) count++;
                        }
                        return sum + count;
                      }, 0);
                      const maxPayments = members.length * 12;
                      const totalTolerated = members.reduce((sum, m) => {
                        let count = 0;
                        for (let month = 1; month <= 12; month++) {
                          const details = paymentDetailsMap[`${m.id}-${month}-${bulkYear}`] ?? { isTolerated: false };
                          if (details.isTolerated) count++;
                        }
                        return sum + count;
                      }, 0);
                      return `${totalPayments}P/${totalTolerated}T/${maxPayments}`;
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
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span>Tolerated / grace</span>
            </div>
            <div className="ml-auto text-foreground font-medium">
              Click any cell to record payment or manage tolerance
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
              const memberColWidth = yearTypes.length <= 2 ? "min-w-[220px] w-[220px]" :
                                     yearTypes.length <= 4 ? "min-w-[240px] w-[240px]" :
                                     yearTypes.length <= 6 ? "min-w-[260px] w-[260px]" : "min-w-[280px] w-[280px]";
              
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
                        <table className="w-full min-w-max table-fixed">
                          <colgroup>
                            <col className={memberColWidth} />
                            {yearTypes.map(type => (
                              <col key={`special-col-${type.id}`} className="w-[72px]" />
                            ))}
                            <col className="w-[96px]" />
                          </colgroup>
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
                                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={member.name}>
                                        {member.name}
                                      </span>
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
                  {contributionTypes.filter(t => t.isActive).map(type => (
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
              Export Reports
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Choose the report purpose first, then export as PDF or Excel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Report Kind Toggle */}
            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => {
                  setReportKind("full_history");
                  setReportTypeId("all");
                }}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  reportKind === "full_history"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Full History
              </button>
              <button
                onClick={() => {
                  setReportKind("contribution_type");
                  if (reportTypeId === "all") {
                    setReportTypeId(contributionTypes.find((type) => type.isActive)?.id || "all");
                  }
                }}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  reportKind === "contribution_type"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Type Report
              </button>
              <button
                onClick={() => {
                  setReportKind("status_report");
                  if (reportTypeId === "all") {
                    setReportTypeId(contributionTypes.find((type) => type.isActive)?.id || "all");
                  }
                }}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  reportKind === "status_report"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Status
              </button>
              <button
                onClick={() => {
                  setReportKind("annual_summary");
                  setReportTypeId("all");
                }}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  reportKind === "annual_summary"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Summary
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {reportKind !== "annual_summary" && (
                <Select
                  value={reportScope}
                  onValueChange={(value) => setReportScope(value as ContributionReportScope)}
                >
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Whole year</SelectItem>
                    <SelectItem value="month">Specific month</SelectItem>
                    <SelectItem value="period">Specific period</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select
                value={reportYear.toString()}
                onValueChange={(v) => setReportYear(parseInt(v))}
              >
                <SelectTrigger className="bg-secondary border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(reportKind === "full_history" || reportKind === "contribution_type" || reportKind === "status_report") && (
                <Select
                  value={reportTypeId}
                  onValueChange={setReportTypeId}
                >
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue placeholder={reportKind === "full_history" ? "All contribution types" : "Select contribution type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {reportKind === "full_history" && (
                      <SelectItem value="all">All contribution types</SelectItem>
                    )}
                    {contributionTypes
                      .filter((type) => type.isActive || type.id === reportTypeId)
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              {reportKind === "full_history" && (
                <Select
                  value={reportCategoryFilter}
                  onValueChange={(value) => setReportCategoryFilter(value as ContributionCategoryFilter)}
                >
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="monthly">Monthly only</SelectItem>
                    <SelectItem value="special">Special only</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {reportScope === "month" && reportKind !== "annual_summary" && (
                <Select
                  value={reportMonth.toString()}
                  onValueChange={(v) => setReportMonth(parseInt(v))}
                >
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {reportScope === "period" && reportKind !== "annual_summary" && (
                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <div>
                    <Label className="mb-2 block text-xs text-muted-foreground">Start date</Label>
                    <Input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="bg-secondary border-primary/20"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs text-muted-foreground">End date</Label>
                    <Input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="bg-secondary border-primary/20"
                    />
                  </div>
                </div>
              )}

              {reportScope !== "month" && (reportKind === "contribution_type" || reportKind === "status_report") &&
                contributionTypes.find((type) => type.id === reportTypeId)?.category === "monthly" && (
                  <div className="md:col-span-2 rounded-xl border border-primary/10 bg-secondary/20 p-3 text-sm text-muted-foreground">
                    Monthly dues reports will aggregate all months inside the selected scope.
                  </div>
                )}
            </div>

            {reportKind === "status_report" ? (
              <>
                {selectedReportType?.category === "monthly" ? (
                  <>
                    <div className="grid grid-cols-4 gap-4">
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
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-yellow-400">Tolerated</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-500">{toleratedCount}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary">Collected</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(statusPreviewRows.reduce((sum, r) => sum + r.paidAmount, 0))}
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-primary/10 border border-primary/10 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                      {statusPreviewRows.map((report) => (
                        <div key={report.memberId} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {report.status === "paid" ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : report.status === "tolerated" ? (
                              <Clock className="w-5 h-5 text-yellow-500" />
                            ) : report.status === "not_applicable" ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary/40 text-[10px] text-muted-foreground">N/A</span>
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-foreground">{report.memberName}</span>
                          </div>
                          <div className="text-right">
                            {report.status === "paid" ? (
                              <span className="text-green-500 font-medium">{formatCurrency(report.paidAmount)}</span>
                            ) : report.status === "tolerated" ? (
                              <span className="text-yellow-400 text-sm">Tolerated</span>
                            ) : report.status === "not_applicable" ? (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            ) : report.status === "partial" ? (
                              <span className="text-yellow-400 text-sm">{formatCurrency(report.paidAmount)} partial</span>
                            ) : (
                              <span className="text-red-400 text-sm">Unpaid</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {statusPreviewRows.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                          No members found for this status report.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-primary/10 bg-secondary/20 p-4 space-y-2">
                    <p className="font-medium text-foreground">Special Contribution Status</p>
                    <p className="text-sm text-muted-foreground">
                      This export will show one row per member for {selectedReportType?.name || "the selected contribution"}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedReportType?.targetAmount
                        ? "Because this contribution has a target amount, statuses will be Paid, Partial, or Unpaid."
                        : "Because this contribution has no target amount, statuses will be Contributed or No Contribution."}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-primary/10 bg-secondary/20 p-4 space-y-2">
                  <p className="font-medium text-foreground">
                    {reportKind === "full_history" && "Full History"}
                    {reportKind === "contribution_type" && "Contribution Type Report"}
                    {reportKind === "annual_summary" && "Annual Summary"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reportKind === "full_history" && "Exports raw contribution transactions using the current year, type, and category filters."}
                    {reportKind === "contribution_type" && "Exports transaction rows for one selected contribution type."}
                    {reportKind === "annual_summary" && "Exports yearly totals, contribution breakdowns, expenses, and net balance."}
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-primary/10">
              <Button variant="outline" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => { void handleExportReport("excel"); }}>
                <Download className="w-4 h-4 mr-2" />
                Export as Excel
              </Button>
              <Button variant="gold" onClick={() => { void handleExportReport("pdf"); }}>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            </div>
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
                  Showing most recent 100 records. Export for full history.
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-primary/10">
            <Button variant="outline" onClick={() => openReportModal("full_history")}>
              <Download className="w-4 h-4 mr-2" />
              Export Reports
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
              const yearExpenses = summaryYearExpenses;
              
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Summary
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => { void handleExportAnnualSummary("pdf"); }}>
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { void handleExportAnnualSummary("excel"); }}>
                  Export Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    const alreadyPaid = bulkPaidMonths.includes(month);
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

              {canManageTolerance && (
                <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-medium text-amber-300">Tolerance / Grace</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                      onClick={handleMarkTolerance}
                      disabled={savingTolerance || savingCellPayment}
                    >
                      {savingTolerance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                      {cellPayment.isTolerated ? "Update Tolerance" : "Mark Tolerated"}
                    </Button>
                    {cellPayment.isTolerated && (
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10"
                        onClick={handleClearTolerance}
                        disabled={savingTolerance || savingCellPayment}
                      >
                        Remove Tolerance
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
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
                        : cellPayment.isTolerated
                          ? "bg-amber-500/10 border-amber-500/30"
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
                    ) : cellPayment.isTolerated ? (
                      <>
                        <Clock className="w-6 h-6 text-amber-400" />
                        <span className="text-amber-300 font-medium">Currently tolerated for this month</span>
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
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={handleSaveCellPayment}
                  disabled={savingCellPayment}
                >
                  {savingCellPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
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
                  disabled={
                    savingSpecialPayment ||
                    !specialCellPayment.amount ||
                    parseFloat(specialCellPayment.amount) <= 0
                  }
                >
                  {savingSpecialPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Request Unlock Dialog */}
      <Dialog open={showUnlockRequest} onOpenChange={setShowUnlockRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-yellow-500" />
              Request Month Unlock
            </DialogTitle>
            <DialogDescription>
              Request the main admin or super admin to temporarily unlock a locked month so you can add or edit data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Month</Label>
                <Select
                  value={unlockForm.month.toString()}
                  onValueChange={(value) => setUnlockForm((prev) => ({ ...prev, month: parseInt(value, 10) }))}
                >
                  <SelectTrigger className="bg-secondary border-primary/20">
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
                <Input
                  type="number"
                  value={unlockForm.year}
                  onChange={(e) => setUnlockForm((prev) => ({ ...prev, year: parseInt(e.target.value, 10) || new Date().getFullYear() }))}
                  className="bg-secondary border-primary/20"
                />
              </div>
            </div>
            <div>
              <Label>Reason for unlock request</Label>
              <Textarea
                value={unlockForm.reason}
                onChange={(e) => setUnlockForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Need to add late contribution records for January..."
                className="mt-1 bg-secondary border-primary/20"
                rows={3}
              />
            </div>
            <Button
              variant="gold"
              className="w-full"
              disabled={!unlockForm.reason.trim()}
              onClick={async () => {
                try {
                  await createUnlockRequest({
                    requestedBy: currentUser?.name || "Admin",
                    requestedByRole: currentUser?.role || "finance",
                    requestedById: currentUser?.id || "",
                    type: "both",
                    month: unlockForm.month,
                    year: unlockForm.year,
                    reason: unlockForm.reason.trim(),
                  });
                  // Notify main_admin and super_admin via email
                  notifyUnlockRequestCreated(
                    currentUser?.name || "Admin",
                    currentUser?.role || "finance",
                    unlockForm.month, unlockForm.year, "both",
                    unlockForm.reason.trim()
                  );
                  toast({ title: "Request Sent", description: "Your unlock request has been sent to the admin for approval." });
                  setShowUnlockRequest(false);
                  setUnlockForm((prev) => ({ ...prev, reason: "" }));
                } catch (err: any) {
                  toast({ title: "Error", description: err.message || "Failed to send request", variant: "destructive" });
                }
              }}
            >
              Send Unlock Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
