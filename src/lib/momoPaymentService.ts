import type { PaymentIntent } from "./paymentService";

export interface MomoCustomerDetails {
  name: string;
  email?: string;
  memberId?: string;
}

export interface StartMomoCollectionInput {
  amount: number;
  currency?: string;
  phone: string;
  purpose: "donation" | "ticket" | "contribution";
  reference?: string;
  linkedRecordId?: string;
  customer: MomoCustomerDetails;
  metadata?: Record<string, unknown>;
}

export interface MomoPaymentResponse {
  success: boolean;
  payment: PaymentIntent;
  terminal: boolean;
  result?: {
    kind: "donation" | "ticket" | "contribution";
    id: string;
  };
  message?: string;
}

async function parseResponse(response: Response): Promise<MomoPaymentResponse> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Payment request failed");
  }
  return payload as MomoPaymentResponse;
}

export async function startMomoCollection(input: StartMomoCollectionInput): Promise<MomoPaymentResponse> {
  const response = await fetch("/.netlify/functions/create-momo-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse(response);
}

export async function getMomoPaymentStatus(paymentId: string): Promise<MomoPaymentResponse> {
  const response = await fetch(`/.netlify/functions/momo-payment-status?id=${encodeURIComponent(paymentId)}`);
  return parseResponse(response);
}

export async function waitForMomoPayment(
  paymentId: string,
  options: {
    timeoutMs?: number;
    pollIntervalMs?: number;
    signal?: AbortSignal;
  } = {},
): Promise<MomoPaymentResponse> {
  const timeoutMs = options.timeoutMs ?? 90_000;
  const pollIntervalMs = options.pollIntervalMs ?? 4_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (options.signal?.aborted) {
      throw new Error("Payment polling cancelled");
    }

    const status = await getMomoPaymentStatus(paymentId);
    if (status.terminal) {
      return status;
    }

    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(resolve, pollIntervalMs);

      if (options.signal) {
        const abortHandler = () => {
          window.clearTimeout(timeout);
          reject(new Error("Payment polling cancelled"));
        };
        options.signal.addEventListener("abort", abortHandler, { once: true });
      }
    });
  }

  throw new Error("Timed out while waiting for MTN MoMo confirmation");
}
