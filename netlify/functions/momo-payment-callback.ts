import type { Handler } from "@netlify/functions";
import {
  assertCallbackToken,
  buildHeaders,
  getPaymentById,
  getPaymentIdFromCallback,
  jsonResponse,
  parseJsonBody,
  syncPaymentStatus,
} from "./_shared/momoUtils";

const handler: Handler = async (event) => {
  const headers = buildHeaders("POST, OPTIONS");

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    assertCallbackToken(event);
    const payload = await parseJsonBody<Record<string, unknown>>(event);
    const paymentId = getPaymentIdFromCallback(event, payload);
    const payment = await getPaymentById(paymentId);
    const synced = await syncPaymentStatus(payment, payload);

    return jsonResponse(200, {
      success: true,
      payment: synced.payment,
      terminal: synced.terminal,
      result: synced.result,
    });
  } catch (error: any) {
    return jsonResponse(400, {
      error: error?.message || "Unable to process MTN callback",
    });
  }
};

export { handler };
