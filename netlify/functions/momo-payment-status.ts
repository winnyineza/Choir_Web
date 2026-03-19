import type { Handler } from "@netlify/functions";
import {
  buildHeaders,
  getCollectionAccessToken,
  getMomoConfig,
  getPaymentById,
  getRequestToPayStatus,
  jsonResponse,
  syncPaymentStatus,
} from "./_shared/momoUtils";

const handler: Handler = async (event) => {
  const headers = buildHeaders("GET, OPTIONS");

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const paymentId = event.queryStringParameters?.id;
  if (!paymentId) {
    return jsonResponse(400, { error: "Payment id is required" });
  }

  try {
    const payment = await getPaymentById(paymentId);

    if (payment.status === "successful" || payment.status === "failed") {
      return jsonResponse(200, {
        success: true,
        payment,
        terminal: true,
      });
    }

    if (!payment.providerReference) {
      return jsonResponse(400, { error: "Provider reference missing for payment" });
    }

    const config = getMomoConfig();
    const accessToken = await getCollectionAccessToken(config);
    const providerPayload = await getRequestToPayStatus(config, accessToken, payment.providerReference);
    const synced = await syncPaymentStatus(payment, providerPayload as Record<string, unknown>);

    return jsonResponse(200, {
      success: true,
      payment: synced.payment,
      terminal: synced.terminal,
      result: synced.result,
    });
  } catch (error: any) {
    return jsonResponse(400, {
      error: error?.message || "Unable to fetch payment status",
    });
  }
};

export { handler };

