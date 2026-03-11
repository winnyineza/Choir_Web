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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  TrendingDown,
  Pencil,
  Trash2,
  Download,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/flutterwave";
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  EXPENSE_CATEGORIES,
  getCategoryLabel,
  type Expense,
  type ExpenseCategory,
} from "@/lib/expenseService";
import { addAuditLog } from "@/lib/adminService";
import { cn } from "@/lib/utils";
import { downloadBrandedTableReport } from "@/lib/exportUtils";

export function ExpenseManagement() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getExpenseStats>> | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  
  // Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "other" as ExpenseCategory,
    description: "",
    amount: "",
    vendor: "",
    receiptNumber: "",
    approvedBy: "",
    notes: "",
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const [expensesData, statsData] = await Promise.all([getAllExpenses(), getExpenseStats()]);
    setExpenses(expensesData);
    setStats(statsData);
  };
  
  const filteredExpenses = expenses
    .filter(e => {
      // Year filter
      if (new Date(e.date).getFullYear() !== filterYear) return false;
      
      // Category filter
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          e.description.toLowerCase().includes(query) ||
          e.vendor?.toLowerCase().includes(query) ||
          getCategoryLabel(e.category).toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      category: "other",
      description: "",
      amount: "",
      vendor: "",
      receiptNumber: "",
      approvedBy: "",
      notes: "",
    });
  };
  
  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast({ title: "Error", description: "Description and amount are required.", variant: "destructive" });
      return;
    }
    
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    
    if (editingExpense) {
      await updateExpense(editingExpense.id, {
        date: form.date,
        category: form.category,
        description: form.description,
        amount,
        vendor: form.vendor || undefined,
        receiptNumber: form.receiptNumber || undefined,
        approvedBy: form.approvedBy || undefined,
        notes: form.notes || undefined,
      });
      if (currentUser) {
        addAuditLog(currentUser, "UPDATE_EXPENSE", `Updated expense: ${form.description}`);
      }
      toast({ title: "Updated", description: "Expense updated successfully." });
    } else {
      await createExpense({
        date: form.date,
        category: form.category,
        description: form.description,
        amount,
        vendor: form.vendor || undefined,
        receiptNumber: form.receiptNumber || undefined,
        approvedBy: form.approvedBy || undefined,
        recordedBy: currentUser?.name || "Admin",
        notes: form.notes || undefined,
      });
      if (currentUser) {
        addAuditLog(currentUser, "CREATE_EXPENSE", `Created expense: ${form.description} (${amount} RWF)`);
      }
      toast({ title: "Added", description: "Expense recorded successfully." });
    }
    
    setShowAddExpense(false);
    setEditingExpense(null);
    resetForm();
    await loadData();
  };
  
  const handleEdit = (expense: Expense) => {
    setForm({
      date: expense.date.split("T")[0],
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      vendor: expense.vendor || "",
      receiptNumber: expense.receiptNumber || "",
      approvedBy: expense.approvedBy || "",
      notes: expense.notes || "",
    });
    setEditingExpense(expense);
    setShowAddExpense(true);
  };
  
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense(id);
      if (currentUser) {
        addAuditLog(currentUser, "DELETE_EXPENSE", "Deleted an expense record");
      }
      toast({ title: "Deleted", description: "Expense deleted." });
      await loadData();
    }
  };
  
  const exportToCSV = () => {
    const headers = ["Date", "Category", "Description", "Vendor", "Amount", "Receipt #", "Approved By", "Recorded By", "Notes"];
    const rows = filteredExpenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      getCategoryLabel(e.category),
      e.description,
      e.vendor || "",
      e.amount,
      e.receiptNumber || "",
      e.approvedBy || "",
      e.recordedBy,
      e.notes || "",
    ]);
    
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    rows.push([]);
    rows.push(["TOTAL", "", "", "", total, "", "", "", ""]);
        downloadBrandedTableReport({
          title: "Expenses Report",
          subtitle: `${filterYear}`,
          filename: `expenses-${filterYear}`,
          headers,
          rows,
          meta: [
            { label: "Year", value: filterYear },
            { label: "Category Filter", value: filterCategory === "all" ? "All Categories" : getCategoryLabel(filterCategory as ExpenseCategory) },
            { label: "Generated", value: new Date().toLocaleString() },
          ],
          summary: [
            { label: "Records", value: filteredExpenses.length },
            { label: "Total Expenses", value: formatCurrency(total) },
          ],
        });
    
        toast({ title: "Exported", description: "Expenses report downloaded." });
  };
  
  // Calculate year total
  const yearTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(stats?.totalExpenses ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{formatCurrency(stats?.thisMonthExpenses ?? 0)}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <TrendingDown className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats?.thisYearExpenses ?? 0)}</p>
              <p className="text-xs text-muted-foreground">This Year</p>
            </div>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.expenseCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant="gold" onClick={() => { resetForm(); setEditingExpense(null); setShowAddExpense(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-40 bg-secondary border-primary/20"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-secondary border-primary/20">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear.toString()} onValueChange={(v) => setFilterYear(parseInt(v))}>
            <SelectTrigger className="w-24 bg-secondary border-primary/20">
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
      
      {/* Category Breakdown */}
      <div className="card-glass rounded-xl p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          Expenses by Category ({filterYear})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {EXPENSE_CATEGORIES.map(cat => {
            const catTotal = filteredExpenses
              .filter(e => e.category === cat.value)
              .reduce((sum, e) => sum + e.amount, 0);
            const percentage = yearTotal > 0 ? Math.round((catTotal / yearTotal) * 100) : 0;
            
            return (
              <div 
                key={cat.value}
                onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all",
                  filterCategory === cat.value 
                    ? "bg-primary/20 ring-1 ring-primary" 
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                <p className="font-semibold text-foreground">{formatCurrency(catTotal)}</p>
                {catTotal > 0 && (
                  <div className="mt-1">
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{percentage}%</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Expenses List */}
      <div className="card-glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-primary/10 flex justify-between items-center">
          <h3 className="font-semibold text-foreground">
            Expense Records ({filteredExpenses.length})
          </h3>
          <p className="text-sm text-red-500 font-semibold">
            Total: {formatCurrency(yearTotal)}
          </p>
        </div>
        
        {filteredExpenses.length > 0 ? (
          <div className="divide-y divide-primary/10">
            {filteredExpenses.map(expense => (
              <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Receipt className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{expense.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary">{getCategoryLabel(expense.category)}</span>
                      {expense.vendor && (
                        <>
                          <span>•</span>
                          <span>{expense.vendor}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-red-500">{formatCurrency(expense.amount)}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No expenses recorded yet.</p>
          </div>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      <Dialog open={showAddExpense} onOpenChange={(open) => { setShowAddExpense(open); if (!open) { setEditingExpense(null); resetForm(); } }}>
        <DialogContent className="max-w-md bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {editingExpense ? "Update expense details" : "Record a new expense"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                  <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Description *</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="e.g., Sound system rental"
              />
            </div>
            
            <div>
              <Label>Amount (RWF) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="50000"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vendor</Label>
                <Input
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20"
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <Label>Receipt #</Label>
                <Input
                  value={form.receiptNumber}
                  onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20"
                  placeholder="Receipt number"
                />
              </div>
            </div>
            
            <div>
              <Label>Approved By</Label>
              <Input
                value={form.approvedBy}
                onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="Name of approver"
              />
            </div>
            
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 bg-secondary border-primary/20"
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddExpense(false); setEditingExpense(null); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSave}>
                {editingExpense ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

