import type { HandlerEvent } from "@netlify/functions";
import crypto from "crypto";
import { getSupabaseAdminClient } from "./googleMeetUtils";
import {
  isValidMtnRwandaMsisdn,
  mapMomoCollectionStatus,
  normalizeRwandaMsisdn,
} from "../../../src/lib/momo";
import type { PaymentIntent, PaymentStatus } from "../../../src/lib/paymentService";

type JsonRecord = Record<string, unknown>;

export interface CreateMomoPaymentRequest {
  amount: number;
  currency?: string;
  phone: string;
  purpose: "donation" | "ticket" | "contribution";
  reference?: string;
  linkedRecordId?: string;
  customer?: {
    name?: string;
    email?: string;
    memberId?: string;
  };
  metadata?: JsonRecord;
}

export interface MomoSettlementResult {
  kind: "donation" | "ticket" | "contribution";
  id: string;
}

interface PaymentRow {
  id: string;
  member_id: string | null;
  amount: number;
  currency: string | null;
  method: string | null;
  purpose: string | null;
  reference: string | null;
  status: PaymentStatus | null;
  metadata: JsonRecord | null;
  created_at: string;
  updated_at: string;
}

interface TicketOrderRow {
  id: string;
  event_id: string;
  tickets: Array<{ tierId: string; quantity: number }>;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
}

interface EventRow {
  id: string;
  tickets: Array<{
    id: string;
    name: string;
    available: number;
    sold?: number;
  }>;
}

interface MomoConfig {
  apiBaseUrl: string;
  collectionSubscriptionKey: string;
  apiUserId: string;
  apiKey: string;
  targetEnvironment: string;
  callbackBaseUrl?: string;
  callbackToken?: string;
}

function parseMetadata(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
}

function buildPaymentMetadata(payment: Partial<PaymentIntent>, metadata?: JsonRecord) {
  return {
    ...(metadata || {}),
    provider: payment.provider || "mtn_momo",
    channel: payment.channel || "mtn",
    externalId: payment.externalId || payment.id,
    providerReference: payment.providerReference,
    payerPhone: payment.payerPhone,
    statusDetail: payment.statusDetail,
    linkedRecordId: payment.linkedRecordId,
    callbackPayload: payment.callbackPayload || undefined,
  };
}

export function buildHeaders(methods = "GET, POST, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": process.env.URL || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": methods,
    "Content-Type": "application/json",
  };
}

export function jsonResponse(statusCode: number, body: JsonRecord) {
  return {
    statusCode,
    headers: buildHeaders(),
    body: JSON.stringify(body),
  };
}

export async function parseJsonBody<T>(event: HandlerEvent): Promise<T> {
  if (!event.body) {
    return {} as T;
  }
  return JSON.parse(event.body) as T;
}

export function isMomoCollectionEnabled() {
  return String(process.env.MOMO_COLLECTION_ENABLED || "").toLowerCase() === "true";
}

export function getMomoConfig(): MomoConfig {
  const config: MomoConfig = {
    apiBaseUrl: process.env.MOMO_API_BASE_URL || "https://sandbox.momodeveloper.mtn.com",
    collectionSubscriptionKey: process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY || "",
    apiUserId: process.env.MOMO_API_USER_ID || "",
    apiKey: process.env.MOMO_API_KEY || "",
    targetEnvironment: process.env.MOMO_TARGET_ENVIRONMENT || "sandbox",
    callbackBaseUrl: process.env.MOMO_CALLBACK_BASE_URL,
    callbackToken: process.env.MOMO_CALLBACK_TOKEN,
  };

  const missing = Object.entries(config)
    .filter(([key, value]) => !["callbackBaseUrl", "callbackToken"].includes(key) && !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing MTN MoMo configuration: ${missing.join(", ")}`);
  }

  return config;
}

export function buildReference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

export function buildProviderReference() {
  return crypto.randomUUID();
}

function basicAuthHeader(apiUserId: string, apiKey: string) {
  const value = Buffer.from(`${apiUserId}:${apiKey}`).toString("base64");
  return `Basic ${value}`;
}

async function readErrorBody(response: Response) {
  const text = await response.text();
  return text || response.statusText || "Unknown provider error";
}

export async function getCollectionAccessToken(config: MomoConfig) {
  const response = await fetch(`${config.apiBaseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(config.apiUserId, config.apiKey),
      "Ocp-Apim-Subscription-Key": config.collectionSubscriptionKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to get MTN access token: ${await readErrorBody(response)}`);
  }

  const payload = await response.json();
  return payload.access_token as string;
}

export function buildCallbackUrl(config: MomoConfig, paymentId: string) {
  if (!config.callbackBaseUrl) return undefined;
  const url = new URL("/.netlify/functions/momo-payment-callback", config.callbackBaseUrl);
  url.searchParams.set("paymentId", paymentId);
  if (config.callbackToken) {
    url.searchParams.set("token", config.callbackToken);
  }
  return url.toString();
}

export async function requestToPay(
  config: MomoConfig,
  accessToken: string,
  payment: PaymentIntent,
  payerPhone: string,
) {
  const callbackUrl = buildCallbackUrl(config, payment.id);
  const response = await fetch(`${config.apiBaseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": config.collectionSubscriptionKey,
      "X-Reference-Id": payment.providerReference || "",
      "X-Target-Environment": config.targetEnvironment,
      "Content-Type": "application/json",
      ...(callbackUrl ? { "X-Callback-Url": callbackUrl } : {}),
    },
    body: JSON.stringify({
      amount: String(payment.amount),
      currency: payment.currency || "RWF",
      externalId: payment.externalId || payment.id,
      payer: {
        partyIdType: "MSISDN",
        partyId: payerPhone,
      },
      payerMessage: payment.reference || "Serenades of Praise payment",
      payeeNote: `${payment.purpose}:${payment.id}`,
    }),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`MTN request to pay failed: ${await readErrorBody(response)}`);
  }
}

export async function getRequestToPayStatus(config: MomoConfig, accessToken: string, providerReference: string) {
  const response = await fetch(`${config.apiBaseUrl}/collection/v1_0/requesttopay/${providerReference}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": config.collectionSubscriptionKey,
      "X-Target-Environment": config.targetEnvironment,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch MTN payment status: ${await readErrorBody(response)}`);
  }

  return response.json();
}

export function paymentFromRow(row: PaymentRow): PaymentIntent {
  const metadata = parseMetadata(row.metadata);
  return {
    id: row.id,
    memberId: row.member_id || undefined,
    amount: Number(row.amount),
    currency: row.currency || "RWF",
    method: (metadata.channel as PaymentIntent["method"]) || (row.method as PaymentIntent["method"]) || "mtn",
    provider: (metadata.provider as PaymentIntent["provider"]) || "mtn_momo",
    channel: (metadata.channel as PaymentIntent["channel"]) || "mtn",
    purpose: (row.purpose as PaymentIntent["purpose"]) || "donation",
    reference: row.reference || undefined,
    providerReference: metadata.providerReference as string | undefined,
    externalId: (metadata.externalId as string | undefined) || row.id,
    payerPhone: metadata.payerPhone as string | undefined,
    status: row.status || "pending",
    statusDetail: metadata.statusDetail as string | undefined,
    linkedRecordId: metadata.linkedRecordId as string | undefined,
    callbackPayload: (metadata.callbackPayload as JsonRecord | undefined) || null,
    metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPaymentRowById(paymentId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error || !data) {
    throw new Error("Payment not found");
  }

  return data as PaymentRow;
}

export async function getPaymentById(paymentId: string) {
  return paymentFromRow(await getPaymentRowById(paymentId));
}

export async function createPaymentRecord(input: CreateMomoPaymentRequest) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (!isValidMtnRwandaMsisdn(input.phone)) {
    throw new Error("Enter a valid MTN Rwanda number");
  }

  const normalizedPhone = normalizeRwandaMsisdn(input.phone);
  const paymentId = `pay_${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  const now = new Date().toISOString();

  const payment: PaymentIntent = {
    id: paymentId,
    memberId: input.customer?.memberId,
    amount: Math.round(input.amount),
    currency: input.currency || "RWF",
    method: "mtn",
    provider: "mtn_momo",
    channel: "mtn",
    purpose: input.purpose,
    reference: input.reference || buildReference(input.purpose.toUpperCase()),
    providerReference: buildProviderReference(),
    externalId: paymentId,
    payerPhone: normalizedPhone,
    status: "pending",
    statusDetail: "Awaiting MTN collection request",
    linkedRecordId: input.linkedRecordId,
    metadata: {
      ...(input.metadata || {}),
      customer: input.customer || {},
      linkedRecordId: input.linkedRecordId,
    },
    createdAt: now,
    updatedAt: now,
  };

  const supabase = getSupabaseAdminClient();
  const metadata = buildPaymentMetadata(payment, payment.metadata as JsonRecord);
  const { data, error } = await supabase
    .from("payments")
    .insert({
      id: payment.id,
      member_id: payment.memberId || null,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.channel,
      purpose: payment.purpose,
      reference: payment.reference || null,
      status: payment.status,
      metadata,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to create payment record");
  }

  return paymentFromRow(data as PaymentRow);
}

export async function updatePaymentRecord(
  paymentId: string,
  updates: Partial<PaymentIntent>,
  metadataUpdates?: JsonRecord,
) {
  const current = await getPaymentById(paymentId);
  const nextPayment: PaymentIntent = {
    ...current,
    ...updates,
    metadata: {
      ...(current.metadata || {}),
      ...(metadataUpdates || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  const metadata = buildPaymentMetadata(nextPayment, nextPayment.metadata as JsonRecord);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .update({
      member_id: nextPayment.memberId || null,
      amount: nextPayment.amount,
      currency: nextPayment.currency,
      method: nextPayment.channel || nextPayment.method,
      purpose: nextPayment.purpose,
      reference: nextPayment.reference || null,
      status: nextPayment.status,
      metadata,
      updated_at: nextPayment.updatedAt,
    })
    .eq("id", paymentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to update payment record");
  }

  return paymentFromRow(data as PaymentRow);
}

function getStatusDetail(payload: JsonRecord) {
  const reason = payload.reason;
  if (typeof reason === "string" && reason.trim()) return reason;
  if (reason && typeof reason === "object" && "message" in reason && typeof reason.message === "string") {
    return reason.message;
  }
  if (typeof payload.status === "string" && payload.status.trim()) return payload.status;
  return "Payment status updated";
}

async function settleDonation(payment: PaymentIntent) {
  if (payment.linkedRecordId) {
    return { kind: "donation", id: payment.linkedRecordId } as const;
  }

  const metadata = parseMetadata(payment.metadata);
  const customer = parseMetadata(metadata.customer);
  const donationId = `donation_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("donations").insert({
    id: donationId,
    donor_name: String(customer.name || "Anonymous Donor"),
    donor_email: customer.email ? String(customer.email) : null,
    amount: payment.amount,
    method: "mtn",
    payment_method: "mtn",
    reference: payment.reference || payment.providerReference || payment.id,
    message: metadata.message ? String(metadata.message) : null,
    date: new Date().toISOString().split("T")[0],
    recorded_by: "MTN MoMo",
    status: "completed",
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  await updatePaymentRecord(payment.id, { linkedRecordId: donationId });
  return { kind: "donation", id: donationId } as const;
}

async function settleContribution(payment: PaymentIntent) {
  if (payment.linkedRecordId) {
    return { kind: "contribution", id: payment.linkedRecordId } as const;
  }

  const metadata = parseMetadata(payment.metadata);
  const customer = parseMetadata(metadata.customer);
  const contribution = parseMetadata(metadata.contribution);
  const contributionId = `contrib-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();
  const reference = payment.reference || payment.providerReference || payment.id;
  const supabase = getSupabaseAdminClient();

  const contributionRow = {
    id: contributionId,
    member_id: payment.memberId,
    member_name: String(customer.name || ""),
    member_email: customer.email ? String(customer.email) : null,
    type: String(contribution.typeName || contribution.type || "Contribution"),
    type_id: contribution.typeId ? String(contribution.typeId) : null,
    type_name: contribution.typeName ? String(contribution.typeName) : null,
    category: String(contribution.category || "special"),
    amount: payment.amount,
    expected_amount: contribution.expectedAmount ? Number(contribution.expectedAmount) : null,
    month: contribution.month ? Number(contribution.month) : null,
    year: contribution.year ? Number(contribution.year) : null,
    payment_method: "momo",
    reference,
    notes: contribution.notes ? String(contribution.notes) : "Paid via MTN MoMo",
    recorded_by: "MTN MoMo",
    created_at: now,
  };

  const { error } = await supabase.from("contributions").insert(contributionRow);
  if (error) {
    throw new Error(error.message);
  }

  const { error: receiptError } = await supabase.from("receipts").insert({
    id: `receipt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    member_id: payment.memberId || null,
    member_name: String(customer.name || ""),
    member_email: customer.email ? String(customer.email) : null,
    amount: payment.amount,
    category: String(contribution.category === "monthly" ? "Monthly" : "Special"),
    type_name: contribution.typeName ? String(contribution.typeName) : null,
    reference,
    payment_method: "momo",
    month: contribution.month ? Number(contribution.month) : null,
    year: contribution.year ? Number(contribution.year) : null,
    recorded_by: "MTN MoMo",
    created_at: now,
  });

  if (receiptError) {
    throw new Error(receiptError.message);
  }

  await updatePaymentRecord(payment.id, { linkedRecordId: contributionId });
  return { kind: "contribution", id: contributionId } as const;
}

async function reduceEventTicketAvailability(order: TicketOrderRow) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, tickets")
    .eq("id", order.event_id)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Event not found");
  }

  const event = data as EventRow;
  const nextTickets = [...(event.tickets || [])];

  for (const purchase of order.tickets || []) {
    const index = nextTickets.findIndex((ticket) => ticket.id === purchase.tierId);
    if (index < 0) {
      throw new Error(`Ticket tier ${purchase.tierId} no longer exists`);
    }
    const current = nextTickets[index];
    const sold = current.sold || 0;
    const remaining = current.available - sold;
    if (remaining < purchase.quantity) {
      throw new Error(`Insufficient availability for ${current.name}`);
    }
    nextTickets[index] = {
      ...current,
      sold: sold + purchase.quantity,
    };
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ tickets: nextTickets, updated_at: new Date().toISOString() })
    .eq("id", order.event_id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function settleTicket(payment: PaymentIntent) {
  const orderId = payment.linkedRecordId || String(parseMetadata(payment.metadata).linkedRecordId || "");
  if (!orderId) {
    throw new Error("Ticket order reference missing");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("id, event_id, tickets, status, payment_method, payment_reference")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Ticket order not found");
  }

  const order = data as TicketOrderRow;
  if (order.status !== "confirmed") {
    await reduceEventTicketAvailability(order);
    const { error: updateError } = await supabase
      .from("ticket_orders")
      .update({
        status: "confirmed",
        payment_method: "mtn",
        payment_reference: payment.providerReference || payment.reference || payment.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  return { kind: "ticket", id: order.id } as const;
}

export async function settlePayment(payment: PaymentIntent) {
  if (payment.status !== "successful") {
    return undefined;
  }

  if (payment.purpose === "donation") return settleDonation(payment);
  if (payment.purpose === "contribution") return settleContribution(payment);
  if (payment.purpose === "ticket") return settleTicket(payment);
  return undefined;
}

export async function syncPaymentStatus(payment: PaymentIntent, providerPayload: JsonRecord) {
  const nextStatus = mapMomoCollectionStatus(String(providerPayload.status || ""));
  const updated = await updatePaymentRecord(
    payment.id,
    {
      status: nextStatus,
      statusDetail: getStatusDetail(providerPayload),
      callbackPayload: providerPayload,
    },
    {
      callbackPayload: providerPayload,
      providerReference: String(providerPayload.referenceId || providerPayload.providerReference || payment.providerReference || "")
        || payment.providerReference,
      statusDetail: getStatusDetail(providerPayload),
    },
  );

  const settled = await settlePayment(updated);
  const finalPayment = settled && settled.id !== updated.linkedRecordId
    ? await updatePaymentRecord(updated.id, { linkedRecordId: settled.id })
    : updated;

  return {
    payment: finalPayment,
    terminal: finalPayment.status === "successful" || finalPayment.status === "failed",
    result: settled,
  };
}

export function assertCallbackToken(event: HandlerEvent) {
  const expected = process.env.MOMO_CALLBACK_TOKEN;
  if (!expected) return;

  const received = event.queryStringParameters?.token;
  if (received !== expected) {
    throw new Error("Unauthorized callback");
  }
}

export function getPaymentIdFromCallback(event: HandlerEvent, payload: JsonRecord) {
  const externalId = payload.externalId;
  if (typeof externalId === "string" && externalId.trim()) {
    return externalId;
  }

  const queryPaymentId = event.queryStringParameters?.paymentId;
  if (queryPaymentId) return queryPaymentId;

  throw new Error("Unable to identify payment");
}

export function validateCreateRequest(input: CreateMomoPaymentRequest) {
  if (!isValidMtnRwandaMsisdn(input.phone)) {
    throw new Error("Enter a valid MTN Rwanda phone number");
  }

  if (!input.customer?.name) {
    throw new Error("Customer name is required");
  }

  if (input.purpose !== "ticket" && !input.customer?.email) {
    throw new Error("Customer email is required");
  }
}

export { isValidMtnRwandaMsisdn, normalizeRwandaMsisdn };
