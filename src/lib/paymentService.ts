import { addAuditLog, type AdminUser } from "./adminService";
import { dbGetAll, dbGetById, dbInsert, dbUpdate, generateId } from './supabaseDB';

export type PaymentProvider = "mtn_momo" | "flutterwave" | "manual";
export type PaymentChannel = "mtn" | "airtel" | "card" | "bank";
export type PaymentMethod = PaymentChannel | "mpesa";
export type PaymentStatus = "pending" | "processing" | "successful" | "failed";

export interface PaymentIntent {
  id: string;
  memberId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider?: PaymentProvider;
  channel?: PaymentChannel;
  purpose: "contribution" | "ticket" | "donation" | "expense";
  reference?: string;
  providerReference?: string;
  externalId?: string;
  payerPhone?: string;
  status: PaymentStatus;
  statusDetail?: string;
  linkedRecordId?: string;
  callbackPayload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

const KEY = "serenades_payments";

function paymentId(prefix = "pay_"): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function initiatePayment(input: Omit<PaymentIntent, "id" | "status" | "createdAt" | "updatedAt">, actor?: AdminUser): Promise<PaymentIntent> {
  const intent: Omit<PaymentIntent, "id"> & { id?: string } = {
    ...input,
    provider: input.provider || "manual",
    channel: input.channel || (input.method === "mpesa" ? "mtn" : input.method),
    externalId: input.externalId || paymentId("ext_"),
    id: paymentId("pay_"),
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const created = await dbInsert<PaymentIntent>(KEY, intent);
  if (actor) await addAuditLog(actor, "CREATE", `Initiated payment ${created.id} for ${input.purpose}`);
  return created;
}

export async function updatePaymentStatus(id: string, status: PaymentStatus, actor?: AdminUser): Promise<PaymentIntent | null> {
  try {
    const updated = await dbUpdate<PaymentIntent>(KEY, id, { status, updatedAt: new Date().toISOString() });
    if (actor) await addAuditLog(actor, "UPDATE", `Payment ${id} marked ${status}`);
    return updated;
  } catch {
    return null;
  }
}

export async function findPayment(id: string): Promise<PaymentIntent | undefined> {
  const payment = await dbGetById<PaymentIntent>(KEY, id);
  return payment ?? undefined;
}

export async function listPayments(filter?: Partial<PaymentIntent>): Promise<PaymentIntent[]> {
  const all = await dbGetAll<PaymentIntent>(KEY);
  if (!filter) return all;
  return all.filter(p =>
    Object.entries(filter).every(([k, v]) => (p as any)[k] === v)
  );
}

// Webhook simulation for demo
export async function simulateWebhook(id: string, success = true, actor?: AdminUser): Promise<PaymentIntent | null> {
  return updatePaymentStatus(id, success ? "successful" : "failed", actor);
}
