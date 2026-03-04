// Expense tracking service for choir finances (Supabase)

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, generateId } from './supabaseDB';

export type ExpenseCategory =
  | "equipment"
  | "transport"
  | "venue"
  | "costumes"
  | "refreshments"
  | "admin"
  | "marketing"
  | "charity"
  | "utilities"
  | "event-production"
  | "member-welfare"
  | "technology"
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
export async function getAllExpenses(): Promise<Expense[]> {
  return dbGetAll<Expense>(EXPENSES_KEY);
}

// Get expense by ID
export async function getExpenseById(id: string): Promise<Expense | undefined> {
  const expense = await dbGetById<Expense>(EXPENSES_KEY, id);
  return expense ?? undefined;
}

// Get expenses by category
export async function getExpensesByCategory(category: ExpenseCategory): Promise<Expense[]> {
  const expenses = await getAllExpenses();
  return expenses.filter(e => e.category === category);
}

// Get expenses by date range
export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  const expenses = await getAllExpenses();
  return expenses.filter(e => {
    const date = new Date(e.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });
}

// Get expenses for a specific month/year
export async function getExpensesByMonth(month: number, year: number): Promise<Expense[]> {
  const expenses = await getAllExpenses();
  return expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
}

// Get expenses for a specific year
export async function getExpensesByYear(year: number): Promise<Expense[]> {
  const expenses = await getAllExpenses();
  return expenses.filter(e => {
    const date = new Date(e.date);
    return date.getFullYear() === year;
  });
}

// Create expense
export async function createExpense(expense: Omit<Expense, "id" | "createdAt" | "updatedAt">): Promise<Expense> {
  const newExpense: Expense = {
    ...expense,
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return dbInsert<Expense>(EXPENSES_KEY, newExpense);
}

// Update expense
export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  try {
    const existing = await dbGetById<Expense>(EXPENSES_KEY, id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return dbUpdate<Expense>(EXPENSES_KEY, id, merged);
  } catch {
    return null;
  }
}

// Delete expense
export async function deleteExpense(id: string): Promise<boolean> {
  try {
    await dbDelete(EXPENSES_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// Get expense statistics
export async function getExpenseStats() {
  const expenses = await getAllExpenses();
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
    utilities: 0,
    "event-production": 0,
    "member-welfare": 0,
    technology: 0,
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
export async function getExpensesForExport(): Promise<{ headers: string[]; rows: any[][] }> {
  const expenses = (await getAllExpenses()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

// Category display names (constant - no async needed)
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "equipment", label: "Equipment & Instruments" },
  { value: "transport", label: "Transport" },
  { value: "venue", label: "Venue & Rehearsal Space" },
  { value: "costumes", label: "Costumes & Uniforms" },
  { value: "refreshments", label: "Refreshments & Catering" },
  { value: "admin", label: "Administrative" },
  { value: "marketing", label: "Marketing & Promotion" },
  { value: "charity", label: "Charity & Donations" },
  { value: "utilities", label: "Utilities & Bills" },
  { value: "event-production", label: "Event Production" },
  { value: "member-welfare", label: "Member Welfare" },
  { value: "technology", label: "Technology & Software" },
  { value: "other", label: "Other" },
];

export function getCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
}
