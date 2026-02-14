import { addAuditLog, type AdminUser } from "./adminService";
import { dbGetAll, dbInsert, dbDelete, generateId } from './supabaseDB';

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

export async function getAllReceipts(): Promise<Receipt[]> {
  const list = await dbGetAll<Receipt>(KEY);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReceipt(data: Omit<Receipt, "id" | "createdAt">, actor?: AdminUser): Promise<Receipt> {
  const receipt: Receipt = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const created = await dbInsert<Receipt>(KEY, receipt);
  if (actor) await addAuditLog(actor, "CREATE", `Issued receipt for ${created.memberName} - ${created.amount}`);
  return created;
}

export async function deleteReceipt(id: string, actor?: AdminUser): Promise<void> {
  await dbDelete(KEY, id);
  if (actor) await addAuditLog(actor, "DELETE", `Deleted receipt ${id}`);
}

export async function exportReceiptsToCSV(): Promise<void> {
  const receipts = await getAllReceipts();
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
