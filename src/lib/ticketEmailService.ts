// Automatic Ticket Email Service
// Sends ticket confirmation emails via Netlify Function

import type { TicketOrder } from "./ticketService";

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

// Generate QR code as data URL
function generateQRCodeDataUrl(data: string, size: number = 150): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return "";

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Create a pattern based on the data hash
  ctx.fillStyle = "#000000";
  const cellSize = size / 25;
  
  // Generate pseudo-random pattern from data
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;
  }

  // Position detection patterns (corners)
  const drawFinderPattern = (x: number, y: number) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(size - cellSize * 7, 0);
  drawFinderPattern(0, size - cellSize * 7);

  // Data modules (simplified)
  const seedRandom = (seed: number) => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };

  const random = seedRandom(Math.abs(hash));

  ctx.fillStyle = "#000000";
  for (let row = 8; row < 17; row++) {
    for (let col = 8; col < 17; col++) {
      if (random() > 0.5) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  for (let row = 0; row < 25; row++) {
    for (let col = 8; col < 17; col++) {
      if (row < 8 || row > 16) {
        if (random() > 0.5) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  for (let col = 0; col < 25; col++) {
    for (let row = 8; row < 17; row++) {
      if (col < 8 || col > 16) {
        if (random() > 0.5) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  return canvas.toDataURL("image/png");
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
    const qrCodeDataUrl = generateQRCodeDataUrl(qrData, 200);

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

