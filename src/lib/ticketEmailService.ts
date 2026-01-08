// Automatic Ticket Email Service
// Sends ticket confirmation emails via Netlify Function

import type { TicketOrder } from "./ticketService";
import QRCode from "qrcode";

interface TicketEmailPayload {
  to: string;
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  tickets: Array<{
    tierName: string;
    quantity: number;
    priceEach: number;
  }>;
  total: number;
  txRef: string;
  qrCodeData: string;
}

// Generate real QR code as data URL
async function generateQRCodeDataUrl(data: string, size: number = 150): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff"
      },
      errorCorrectionLevel: "M"
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}

// Send ticket confirmation email automatically
export async function sendTicketConfirmationEmail(order: TicketOrder): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate QR code data
    const qrData = JSON.stringify({
      orderId: order.id,
      txRef: order.txRef,
      event: order.eventTitle,
      tickets: order.tickets.reduce((sum, t) => sum + t.quantity, 0),
    });
    const qrCodeDataUrl = await generateQRCodeDataUrl(qrData, 200);

    const payload: TicketEmailPayload = {
      to: order.customer.email,
      customerName: order.customer.name,
      eventTitle: order.eventTitle,
      eventDate: order.eventDate,
      eventTime: "", // Will be added if available
      eventLocation: order.eventLocation,
      tickets: order.tickets.map(t => ({
        tierName: t.tierName,
        quantity: t.quantity,
        priceEach: t.priceEach,
      })),
      total: order.total,
      txRef: order.txRef,
      qrCodeData: qrCodeDataUrl,
    };

    // Call Netlify function
    const response = await fetch("/.netlify/functions/send-ticket-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to send ticket email:", errorData);
      return { success: false, error: errorData.error || "Failed to send email" };
    }

    const result = await response.json();
    console.log("Ticket email sent successfully:", result.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return { success: false, error: "Network error" };
  }
}

// Check if email service is available (Netlify function exists)
export async function isEmailServiceAvailable(): Promise<boolean> {
  try {
    // In development, the function might not be available
    if (window.location.hostname === "localhost") {
      return false; // Email will be simulated in dev
    }
    return true;
  } catch {
    return false;
  }
}

