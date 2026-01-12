// Expense tracking service for choir finances

export type ExpenseCategory = 
  | "equipment" 
  | "transport" 
  | "venue" 
  | "costumes" 
  | "refreshments" 
  | "admin" 
  | "marketing" 
  | "charity"
  | "other";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  vendor?: string;
  receiptNumber?: string;
  approvedBy?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const EXPENSES_KEY = "choir_expenses";

// Get all expenses
export function getAllExpenses(): Expense[] {
  const data = localStorage.getItem(EXPENSES_KEY);
  return data ? JSON.parse(data) : [];
}

// Get expense by ID
export function getExpenseById(id: string): Expense | undefined {
  return getAllExpenses().find(e => e.id === id);
}

// Get expenses by category
export function getExpensesByCategory(category: ExpenseCategory): Expense[] {
  return getAllExpenses().filter(e => e.category === category);
}

// Get expenses by date range
export function getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
  const expenses = getAllExpenses();
  return expenses.filter(e => {
    const date = new Date(e.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });
}

// Get expenses for a specific month/year
export function getExpensesByMonth(month: number, year: number): Expense[] {
  return getAllExpenses().filter(e => {
    const date = new Date(e.date);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
}

// Get expenses for a specific year
export function getExpensesByYear(year: number): Expense[] {
  return getAllExpenses().filter(e => {
    const date = new Date(e.date);
    return date.getFullYear() === year;
  });
}

// Create expense
export function createExpense(expense: Omit<Expense, "id" | "createdAt" | "updatedAt">): Expense {
  const expenses = getAllExpenses();
  const newExpense: Expense = {
    ...expense,
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  expenses.push(newExpense);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  return newExpense;
}

// Update expense
export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const expenses = getAllExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  expenses[index] = {
    ...expenses[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  return expenses[index];
}

// Delete expense
export function deleteExpense(id: string): boolean {
  const expenses = getAllExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  if (filtered.length === expenses.length) return false;
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(filtered));
  return true;
}

// Get expense statistics
export function getExpenseStats() {
  const expenses = getAllExpenses();
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthExpenses = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  const thisYearExpenses = expenses
    .filter(e => new Date(e.date).getFullYear() === thisYear)
    .reduce((sum, e) => sum + e.amount, 0);
    
  // Category breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
    equipment: 0,
    transport: 0,
    venue: 0,
    costumes: 0,
    refreshments: 0,
    admin: 0,
    marketing: 0,
    charity: 0,
    other: 0,
  };
  
  expenses.forEach(e => {
    categoryTotals[e.category] += e.amount;
  });
  
  return {
    totalExpenses,
    thisMonthExpenses,
    thisYearExpenses,
    expenseCount: expenses.length,
    categoryTotals,
  };
}

// Export expenses to CSV format data
export function getExpensesForExport(): { headers: string[]; rows: any[][] } {
  const expenses = getAllExpenses()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const headers = [
    "Date",
    "Category",
    "Description",
    "Vendor",
    "Amount (RWF)",
    "Receipt #",
    "Approved By",
    "Recorded By",
    "Notes",
  ];
  
  const rows = expenses.map(e => [
    new Date(e.date).toLocaleDateString(),
    e.category,
    e.description,
    e.vendor || "",
    e.amount,
    e.receiptNumber || "",
    e.approvedBy || "",
    e.recordedBy,
    e.notes || "",
  ]);
  
  // Summary
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  rows.push([]);
  rows.push(["TOTAL EXPENSES", "", "", "", total, "", "", "", ""]);
  
  return { headers, rows };
}

// Category display names
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "equipment", label: "Equipment & Instruments" },
  { value: "transport", label: "Transport" },
  { value: "venue", label: "Venue & Rehearsal Space" },
  { value: "costumes", label: "Costumes & Uniforms" },
  { value: "refreshments", label: "Refreshments & Catering" },
  { value: "admin", label: "Administrative" },
  { value: "marketing", label: "Marketing & Promotion" },
  { value: "charity", label: "Charity & Donations" },
  { value: "other", label: "Other" },
];

export function getCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
}

