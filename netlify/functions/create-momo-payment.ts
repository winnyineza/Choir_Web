import type { Handler } from "@netlify/functions";
import {
  buildHeaders,
  createPaymentRecord,
  getCollectionAccessToken,
  getMomoConfig,
  isMomoCollectionEnabled,
  jsonResponse,
  parseJsonBody,
  requestToPay,
  updatePaymentRecord,
  validateCreateRequest,
  type CreateMomoPaymentRequest,
} from "./_shared/momoUtils";

const handler: Handler = async (event) => {
  const headers = buildHeaders();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  if (!isMomoCollectionEnabled()) {
    return jsonResponse(503, { error: "MTN MoMo direct payments are not enabled" });
  }

  let paymentId: string | null = null;
  try {
    const input = await parseJsonBody<CreateMomoPaymentRequest>(event);
    validateCreateRequest(input);

    const payment = await createPaymentRecord(input);
    paymentId = payment.id;
    const config = getMomoConfig();
    const accessToken = await getCollectionAccessToken(config);
    await requestToPay(config, accessToken, payment, payment.payerPhone || input.phone);

    const updated = await updatePaymentRecord(
      payment.id,
      {
        status: "processing",
        statusDetail: "Waiting for approval on phone",
      },
      {
        statusDetail: "Waiting for approval on phone",
      },
    );

    return jsonResponse(200, {
      success: true,
      payment: updated,
      terminal: false,
      message: "Approve the MTN MoMo prompt on your phone to complete payment.",
    });
  } catch (error: any) {
    if (paymentId) {
      try {
        await updatePaymentRecord(paymentId, {
          status: "failed",
          statusDetail: error?.message || "Unable to start MTN MoMo payment",
        });
      } catch {
        // Keep the original error response if audit update also fails.
      }
    }
    return jsonResponse(400, {
      error: error?.message || "Unable to start MTN MoMo payment",
    });
  }
};

export { handler };
