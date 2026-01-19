import { addAuditLog, type AdminUser } from "./adminService";

export interface Receipt {
  id: string;
  memberId?: string;
  memberName: string;
  memberEmail?: string;
  amount: number;
  category: string;
  typeName?: string;
  reference?: string;
  paymentMethod?: string;
  month?: number;
  year?: number;
  createdAt: string;
  recordedBy?: string;
}

const KEY = "serenades_receipts";

function generateId() {
  return `rcpt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getAllReceiptsInternal(): Receipt[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(list: Receipt[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAllReceipts(): Receipt[] {
  return getAllReceiptsInternal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createReceipt(data: Omit<Receipt, "id" | "createdAt">, actor?: AdminUser): Receipt {
  const receipt: Receipt = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  const list = getAllReceiptsInternal();
  list.push(receipt);
  saveAll(list);
  if (actor) addAuditLog(actor, "CREATE", `Issued receipt for ${receipt.memberName} - ${receipt.amount}`);
  return receipt;
}

export function deleteReceipt(id: string, actor?: AdminUser) {
  saveAll(getAllReceiptsInternal().filter(r => r.id !== id));
  if (actor) addAuditLog(actor, "DELETE", `Deleted receipt ${id}`);
}

export function exportReceiptsToCSV(): void {
  const receipts = getAllReceipts();
  const headers = ["Date", "Member", "Email", "Category", "Type", "Amount", "Method", "Reference", "Period", "Recorded By"];
  const rows = receipts.map(r => [
    r.createdAt,
    r.memberName,
    r.memberEmail || "",
    r.category,
    r.typeName || "",
    r.amount,
    r.paymentMethod || "",
    r.reference || "",
    r.month && r.year ? `${r.month}/${r.year}` : "",
    r.recordedBy || "",
  ]);

  const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipts-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

