import { CheckCircle, Calendar, MapPin, Ticket, QrCode, Clock, AlertCircle, Image, Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/flutterwave";
import type { TicketOrder } from "@/lib/ticketService";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface TicketConfirmationProps {
  order: TicketOrder;
  onClose: () => void;
}

// Generate real scannable QR code with fallback
async function generateQRCodeAsync(data: string, size: number = 150): Promise<string> {
  try {
    // Try to use the qrcode library
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
    console.error("Error generating QR code with library:", error);
    // Fallback: Generate a simple placeholder QR-like pattern
    return generateFallbackQR(data, size);
  }
}

// Fallback QR code generator (creates a visual pattern that looks like a QR code)
function generateFallbackQR(data: string, size: number): string {
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

  // Position detection patterns (corners) - standard QR code pattern
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

  // Data modules based on hash
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

  return canvas.toDataURL("image/png");
}

// Color themes based on ticket tier
const tierColors: Record<string, { primary: string; secondary: string; accent: string; bg1: string; bg2: string }> = {
  regular: {
    primary: "#3B82F6",    // Blue
    secondary: "#1E40AF",
    accent: "#60A5FA",
    bg1: "#0c1929",
    bg2: "#1e3a5f",
  },
  vip: {
    primary: "#FFD700",    // Gold
    secondary: "#B8860B",
    accent: "#FFF8DC",
    bg1: "#1a1a0a",
    bg2: "#3d3d1a",
  },
  premium: {
    primary: "#DC2626",    // Red/Crimson
    secondary: "#991B1B",
    accent: "#FCA5A5",
    bg1: "#1a0a0a",
    bg2: "#4a1a1a",
  },
};

// Helper function to draw rounded rectangles (for browser compatibility)
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Generate professional concert ticket image as PNG
function generateTicketImage(order: TicketOrder, qrCodeData: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const width = 900;
    const height = 320;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      resolve("");
      return;
    }

    const mainWidth = 680;
    const stubWidth = 220;
    const totalTickets = order.tickets.reduce((sum, t) => sum + t.quantity, 0);
    const ticketInfo = order.tickets.map(t => `${t.quantity}x ${t.tierName}`).join(", ");
    
    // Get the primary ticket tier for coloring
    const primaryTier = order.tickets[0]?.tierName?.toLowerCase() || "regular";
    const colors = tierColors[primaryTier] || tierColors.regular;

    // === MAIN TICKET SECTION ===
    // Background gradient based on tier
    const mainGradient = ctx.createLinearGradient(0, 0, mainWidth, height);
    mainGradient.addColorStop(0, colors.bg1);
    mainGradient.addColorStop(0.5, colors.bg2);
    mainGradient.addColorStop(1, colors.bg1);
    ctx.fillStyle = mainGradient;
    ctx.fillRect(0, 0, mainWidth, height);

    // Crowd silhouette at bottom
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    for (let i = 0; i < 50; i++) {
      const x = (i * 15) + Math.random() * 10;
      const h = 40 + Math.random() * 30;
      const w = 12 + Math.random() * 8;
      ctx.beginPath();
      ctx.ellipse(x, height - h/2, w/2, h/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Accent bar at top (tier colored)
    const accentGradient = ctx.createLinearGradient(0, 0, mainWidth, 0);
    accentGradient.addColorStop(0, colors.secondary);
    accentGradient.addColorStop(0.3, colors.primary);
    accentGradient.addColorStop(0.7, colors.primary);
    accentGradient.addColorStop(1, colors.secondary);
    ctx.fillStyle = accentGradient;
    ctx.fillRect(0, 0, mainWidth, 8);

    // Tier badge (top right of main section)
    ctx.fillStyle = colors.primary;
    drawRoundRect(ctx, mainWidth - 120, 20, 90, 28, 14);
    ctx.fill();
    ctx.fillStyle = primaryTier === "vip" ? "#000000" : "#ffffff";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(primaryTier.toUpperCase(), mainWidth - 75, 39);

    // Organization name (top left)
    ctx.fillStyle = colors.primary;
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SERENADES OF PRAISE", 25, 35);

    // Event Title (large)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial, sans-serif";
    const eventTitle = order.eventTitle.length > 28 
      ? order.eventTitle.substring(0, 28) + "..." 
      : order.eventTitle.toUpperCase();
    ctx.fillText(eventTitle, 25, 80);

    // Subtitle
    ctx.fillStyle = colors.primary;
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("LIVE WORSHIP CONCERT", 25, 105);

    // Date box (tier colored)
    ctx.fillStyle = colors.primary;
    ctx.fillRect(25, 125, 80, 70);
    ctx.fillStyle = primaryTier === "vip" ? "#000000" : "#ffffff";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(order.eventDate.split(" ")[0] || "APR", 65, 148);
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText(order.eventDate.split(" ")[1]?.replace(",", "") || "20", 65, 180);

    // Time and Location
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText("TIME", 120, 145);
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillText("4:00 PM", 120, 168);
    
    ctx.font = "14px Arial, sans-serif";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(order.eventLocation, 120, 190);

    // Divider line (tier colored)
    ctx.strokeStyle = colors.primary + "50"; // 50 = 30% opacity
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(25, 210);
    ctx.lineTo(mainWidth - 25, 210);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bottom section - ticket details
    // Attendee
    ctx.fillStyle = "#888888";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText("ATTENDEE", 25, 235);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillText(order.customer.name.toUpperCase(), 25, 255);

    // Tickets
    ctx.fillStyle = "#888888";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText("TICKETS", 220, 235);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillText(ticketInfo, 220, 255);

    // Reference
    ctx.fillStyle = "#888888";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText("REFERENCE", 420, 235);
    ctx.fillStyle = colors.primary;
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillText(order.txRef, 420, 255);

    // Price
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(formatCurrency(order.total), mainWidth - 25, 255);

    // Footer
    ctx.fillStyle = "#666666";
    ctx.font = "10px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Present this ticket at the event entrance • Do not share • www.sereanadesofpraise.com", mainWidth / 2, height - 15);

    // === PERFORATED LINE / SEPARATOR ===
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(mainWidth, 0);
    ctx.lineTo(mainWidth, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Semicircle cutouts
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(mainWidth, 0, 15, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mainWidth, height, 15, Math.PI, Math.PI * 2);
    ctx.fill();

    // === STUB SECTION (Right side) - Tier colored ===
    const stubGradient = ctx.createLinearGradient(mainWidth, 0, width, 0);
    stubGradient.addColorStop(0, colors.bg2);
    stubGradient.addColorStop(1, colors.bg1);
    ctx.fillStyle = stubGradient;
    ctx.fillRect(mainWidth, 0, stubWidth, height);

    // Tier-colored bar on stub
    ctx.fillStyle = accentGradient;
    ctx.fillRect(mainWidth, 0, stubWidth, 8);

    // Stub center
    const stubCenter = mainWidth + stubWidth / 2;

    // QR Code section - Load and draw the QR code image
    const qrSize = 90;
    const qrX = stubCenter - qrSize / 2;
    const qrY = 25;

    // White background for QR
    ctx.fillStyle = "#ffffff";
    drawRoundRect(ctx, qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 6);
    ctx.fill();

    // Draw QR code if provided
    if (qrCodeData) {
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        finishStub();
      };
      qrImg.onerror = () => {
        // Fallback placeholder
        ctx.fillStyle = colors.primary;
        ctx.font = "bold 10px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SCAN ME", stubCenter, qrY + qrSize / 2 + 4);
        finishStub();
      };
      qrImg.src = qrCodeData;
    } else {
      // QR placeholder pattern
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = colors.primary;
      ctx.font = "bold 10px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR CODE", stubCenter, qrY + qrSize / 2 + 4);
      finishStub();
    }

    function finishStub() {
      // "SCAN TO VERIFY" text under QR
      ctx.fillStyle = "#888888";
      ctx.font = "8px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCAN TO VERIFY", stubCenter, qrY + qrSize + 18);

      // Ticket count (large number)
      ctx.fillStyle = colors.primary;
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.fillText(totalTickets.toString(), stubCenter, qrY + qrSize + 55);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText(totalTickets === 1 ? "TICKET" : "TICKETS", stubCenter, qrY + qrSize + 72);

      // Tier badge on stub
      ctx.fillStyle = colors.primary;
      drawRoundRect(ctx, stubCenter - 40, qrY + qrSize + 85, 80, 24, 12);
      ctx.fill();
      ctx.fillStyle = primaryTier === "vip" ? "#000000" : "#ffffff";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(primaryTier.toUpperCase(), stubCenter, qrY + qrSize + 102);

      // Reference at bottom
      ctx.fillStyle = "#666666";
      ctx.font = "8px Arial, sans-serif";
      ctx.fillText("REF: " + order.txRef, stubCenter, height - 15);

      resolve(canvas.toDataURL("image/png"));
    }
  });
}

export function TicketConfirmation({ order, onClose }: TicketConfirmationProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [ticketImageUrl, setTicketImageUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Validate order object
  if (!order || !order.id || !order.txRef) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          Invalid Order
        </h3>
        <p className="text-muted-foreground mb-4">Order data is missing. Please try again.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }
  
  const isConfirmed = order.status === "confirmed" || order.status === "used";
  const isPending = order.status === "pending";

  useEffect(() => {
    // QR code and image will load asynchronously - ticket info shows immediately
    const generateTicketAssets = async () => {
      try {
        // Generate QR code for display
        const qrData = JSON.stringify({
          orderId: order.id,
          txRef: order.txRef,
          event: order.eventTitle,
          tickets: order.tickets?.reduce((sum, t) => sum + t.quantity, 0) || 1,
        });
        
        const qrUrl = await generateQRCodeAsync(qrData, 200);
        if (qrUrl) {
          setQrCodeUrl(qrUrl);
          
          // Try to generate the full ticket image
          try {
            const ticketImg = await generateTicketImage(order, qrUrl);
            if (ticketImg) {
              setTicketImageUrl(ticketImg);
            }
          } catch (imgErr) {
            console.warn("Ticket image generation failed:", imgErr);
          }
        }
      } catch (err) {
        console.warn("QR code generation failed:", err);
        // Don't set error - just continue without QR code
      }
    };
    
    generateTicketAssets();
  }, [order]);

  const totalTickets = order.tickets.reduce((sum, t) => sum + t.quantity, 0);

  const handleDownloadTicket = async () => {
    setIsGenerating(true);
    
    try {
      // Generate QR code if not already available
      let qrUrl = qrCodeUrl;
      if (!qrUrl) {
        const qrData = JSON.stringify({
          orderId: order.id,
          txRef: order.txRef,
          event: order.eventTitle,
          tickets: order.tickets.reduce((sum, t) => sum + t.quantity, 0),
        });
        qrUrl = await generateQRCodeAsync(qrData, 200);
        setQrCodeUrl(qrUrl);
      }
      
      // Generate ticket image
      const imgUrl = await generateTicketImage(order, qrUrl);
      
      if (!imgUrl) {
        console.error("Failed to generate ticket image");
        setIsGenerating(false);
        return;
      }
      
      setTicketImageUrl(imgUrl);
      
      // Create download link
      const a = document.createElement("a");
      a.href = imgUrl;
      a.download = `ticket-${order.txRef}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading ticket:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintTicket = async () => {
    setIsGenerating(true);
    
    try {
      // Generate QR code if not already available
      let qrUrl = qrCodeUrl;
      if (!qrUrl) {
        const qrData = JSON.stringify({
          orderId: order.id,
          txRef: order.txRef,
          event: order.eventTitle,
          tickets: order.tickets.reduce((sum, t) => sum + t.quantity, 0),
        });
        qrUrl = await generateQRCodeAsync(qrData, 200);
        setQrCodeUrl(qrUrl);
      }
      
      let imgUrl = ticketImageUrl;
      if (!imgUrl) {
        imgUrl = await generateTicketImage(order, qrUrl);
        setTicketImageUrl(imgUrl);
      }
      
      if (!imgUrl) {
        console.error("Failed to generate ticket image for printing");
        setIsGenerating(false);
        return;
      }
      
      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Ticket - ${order.txRef}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f5f5f5;
                  padding: 20px;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                @media print {
                  body { background: white; padding: 0; }
                  img { box-shadow: none; max-width: 100%; }
                }
              </style>
            </head>
            <body>
              <img src="${imgUrl}" alt="Ticket" />
              <script>
                document.querySelector('img').onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error("Error printing ticket:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center">
      {/* Status Animation */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        {isConfirmed ? (
          <>
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </>
        )}
      </div>

      <h3 className="font-display text-2xl font-bold text-foreground mb-2">
        {isConfirmed ? "Payment Successful!" : "Order Submitted!"}
      </h3>
      <p className="text-muted-foreground mb-6">
        {isConfirmed 
          ? "Your tickets have been confirmed. See you at the event!"
          : "Your order is pending payment confirmation. You'll receive details via email."}
      </p>

      {/* Ticket Card - with tier-colored accent */}
      {(() => {
        const tier = order.tickets[0]?.tierName?.toLowerCase() || "regular";
        const tierBgClass = tier === "vip" ? "from-yellow-600/20 to-yellow-800/20 border-yellow-500/30" 
          : tier === "premium" ? "from-red-600/20 to-red-800/20 border-red-500/30"
          : "from-blue-600/20 to-blue-800/20 border-blue-500/30";
        const tierBadgeClass = tier === "vip" ? "bg-yellow-500 text-black" 
          : tier === "premium" ? "bg-red-500 text-white"
          : "bg-blue-500 text-white";
        return (
          <div className={`bg-gradient-to-br ${tierBgClass} rounded-2xl p-6 border mb-6 text-left relative overflow-hidden`}>
            {/* Tier Badge */}
            <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase ${tierBadgeClass}`}>
              {tier}
            </span>
            <div className="flex items-start gap-4">
              {/* QR Code */}
              <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-md">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Ticket QR Code"
                    className="w-24 h-24"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-secondary rounded">
                    <QrCode className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Ticket Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm text-muted-foreground">
                    {order.txRef}
                  </span>
                </div>

                <h4 className="font-display text-lg font-semibold text-foreground mb-2 truncate">
                  {order.eventTitle}
                </h4>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    {order.eventDate}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    {order.eventLocation}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Tickets</span>
                <span className="font-semibold text-foreground">
                  {totalTickets} {totalTickets === 1 ? "ticket" : "tickets"}
                </span>
              </div>
              {order.tickets.map((ticket, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {ticket.quantity}x {ticket.tierName}
                  </span>
                  <span className="text-foreground">
                    {formatCurrency(ticket.priceEach * ticket.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                <span className="font-semibold text-foreground">Total Paid</span>
                <span className="font-bold gold-text">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Email Notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
        <Mail className="w-4 h-4 text-green-500" />
        <span>
          {isConfirmed ? "Ticket confirmation sent to" : "Payment instructions will be sent to"}{" "}
          <strong className="text-foreground">{order.customer.email}</strong>
        </span>
      </div>

      {/* Pending Payment Notice */}
      {isPending && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6 text-left">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Payment Pending</p>
            <p className="text-muted-foreground">
              Complete your payment using the instructions sent to your email. 
              Your ticket will be activated once payment is confirmed (within 24 hours).
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {isConfirmed && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleDownloadTicket}
              disabled={isGenerating}
            >
              <Image className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Download"}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handlePrintTicket}
              disabled={isGenerating}
            >
              <Printer className="w-4 h-4 mr-2" />
              {isGenerating ? "Preparing..." : "Print"}
            </Button>
          </div>
        )}
        <Button variant="gold" className="w-full" onClick={onClose}>
          {isConfirmed ? "Done" : "Got it!"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {isConfirmed 
          ? "Present this ticket or QR code at the event entrance"
          : "Save your order reference for tracking: " + order.txRef}
      </p>
    </div>
  );
}

