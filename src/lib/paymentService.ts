import { addAuditLog, type AdminUser } from "./adminService";

export type PaymentMethod = "mpesa" | "card";
export type PaymentStatus = "pending" | "processing" | "successful" | "failed";

export interface PaymentIntent {
  id: string;
  memberId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  purpose: "contribution" | "ticket" | "donation" | "expense";
  reference?: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

const KEY = "serenades_payments";

function generateId(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getAllPayments(): PaymentIntent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePayments(list: PaymentIntent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function initiatePayment(input: Omit<PaymentIntent, "id" | "status" | "createdAt" | "updatedAt">, actor?: AdminUser): PaymentIntent {
  const intent: PaymentIntent = {
    ...input,
    id: generateId("pay_"),
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getAllPayments();
  all.push(intent);
  savePayments(all);
  if (actor) addAuditLog(actor, "CREATE", `Initiated payment ${intent.id} for ${input.purpose}`);
  return intent;
}

export function updatePaymentStatus(id: string, status: PaymentStatus, actor?: AdminUser): PaymentIntent | null {
  const all = getAllPayments();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
  savePayments(all);
  if (actor) addAuditLog(actor, "UPDATE", `Payment ${id} marked ${status}`);
  return all[idx];
}

export function findPayment(id: string): PaymentIntent | undefined {
  return getAllPayments().find(p => p.id === id);
}

export function listPayments(filter?: Partial<PaymentIntent>): PaymentIntent[] {
  const all = getAllPayments();
  if (!filter) return all;
  return all.filter(p =>
    Object.entries(filter).every(([k, v]) => (p as any)[k] === v)
  );
}

// Webhook simulation for demo
export function simulateWebhook(id: string, success = true, actor?: AdminUser) {
  return updatePaymentStatus(id, success ? "successful" : "failed", actor);
}

