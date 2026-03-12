// Export utilities for admin panel

import { type TicketOrder } from "./ticketService";
import { formatCurrency } from "./flutterwave";
import { getAllMembers, getAllEvents, getAllGalleryItems, getSettings } from "./dataService";
import { getAllOrders } from "./ticketService";
import { getAllLeaveRequests } from "./leaveService";
import { getAllSessions, getAllAttendanceRecords, getAttendanceByMember, getMemberAttendanceStats, type AttendanceRecord } from "./attendanceService";
import { getAllAlbums, getAllMusicVideos, getAllPlatforms } from "./releaseService";
import { getAllPromoCodes } from "./promoService";
import { getAllAdminUsers, getAuditLog } from "./adminService";
import { 
  getAllContributions, 
  getAllContributionTypes,
  getContributionsByMember,
  getMemberContributionStatus,
  getMonthName,
  MONTH_NAMES,
} from "./contributionService";
import { getAllExpenses, getCategoryLabel } from "./expenseService";
import { getAllDonations, Donation } from "./donationService";
import logo from "@/assets/LogoTSC.jpg";
import montserratRegularTtf from "@/assets/fonts/Montserrat-Regular.ttf";
import montserratBoldTtf from "@/assets/fonts/Montserrat-Bold.ttf";

type ReportCell = string | number | boolean | null | undefined;

interface ReportMetric {
  label: string;
  value: ReportCell;
}

interface BrandedTableReportOptions {
  title: string;
  filename: string;
  headers: string[];
  rows: ReportCell[][];
  subtitle?: string;
  meta?: ReportMetric[];
  summary?: ReportMetric[];
  emptyMessage?: string;
}

interface DownloadReportOptions {
  title?: string;
  subtitle?: string;
  meta?: ReportMetric[];
  summary?: ReportMetric[];
  emptyMessage?: string;
}

interface SpreadsheetReportOptions extends DownloadReportOptions {
  sheetName?: string;
}

function escapeHtml(value: ReportCell): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatReportTitle(filename: string): string {
  return filename
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function createTimestamp(): string {
  return new Date().toISOString().split("T")[0];
}

function toTitleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getPdfStatusColors(status: string): {
  fill: [number, number, number];
  text: [number, number, number];
} {
  switch (status.toLowerCase()) {
    case "present":
      return { fill: [220, 252, 231], text: [22, 101, 52] };
    case "absent":
      return { fill: [254, 226, 226], text: [153, 27, 27] };
    case "excused":
      return { fill: [254, 243, 199], text: [146, 64, 14] };
    case "late":
      return { fill: [255, 237, 213], text: [154, 52, 18] };
    default:
      return { fill: [241, 245, 249], text: [30, 41, 59] };
  }
}

const fontBinaryCache = new Map<string, Promise<string | null>>();

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return binary;
}

function isValidFontBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return false;

  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const isTrueType = bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00;

  return isTrueType || signature === "OTTO" || signature === "true" || signature === "ttcf";
}

async function getFontBinary(src: string): Promise<string | null> {
  const cached = fontBinaryCache.get(src);
  if (cached) return cached;

  const promise = fetch(src)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load asset: ${src}`);
      }

      const buffer = await response.arrayBuffer();
      if (!isValidFontBuffer(buffer)) {
        console.warn(`[Export] Skipping invalid font asset: ${src}`);
        return null;
      }

      return arrayBufferToBinaryString(buffer);
    })
    .catch(() => null);

  fontBinaryCache.set(src, promise);
  return promise;
}

async function getImageDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function triggerDownload(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function buildReportHtml({
  title,
  headers,
  rows,
  subtitle,
  meta = [],
  summary = [],
  emptyMessage = "No records available for this report.",
}: Omit<BrandedTableReportOptions, "filename">): string {
  const generatedAt = new Date().toLocaleString();
  const finalMeta = meta.length > 0 ? meta : [{ label: "Generated", value: generatedAt }];
  const finalSummary = summary.length > 0
    ? summary
    : [{ label: "Records", value: rows.length }, { label: "Generated", value: generatedAt }];

  const tableRows = rows.length > 0
    ? rows
        .map(
          (row) => `
            <tr>
              ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
            </tr>`
        )
        .join("")
    : `
      <tr>
        <td colspan="${headers.length}" class="empty-row">${escapeHtml(emptyMessage)}</td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap");

      :root {
        color-scheme: light;
        --brand-gold: #d4af37;
        --brand-charcoal: #0b0b0b;
        --brand-ink: #111827;
        --brand-muted: #6b7280;
        --brand-border: #e5e7eb;
        --brand-surface: #ffffff;
        --brand-surface-alt: #f8fafc;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 32px;
        font-family: "Montserrat", Arial, sans-serif;
        color: var(--brand-ink);
        background:
          radial-gradient(circle at top right, rgba(212, 175, 55, 0.18), transparent 28%),
          linear-gradient(180deg, #f9f6ea 0%, #ffffff 42%);
      }

      .report-shell {
        max-width: 1200px;
        margin: 0 auto;
        background: var(--brand-surface);
        border: 1px solid rgba(212, 175, 55, 0.24);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 60px rgba(11, 11, 11, 0.08);
      }

      .report-header {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 28px 32px;
        color: #ffffff;
        background: linear-gradient(135deg, #0b0b0b 0%, #1b1b1b 55%, #3e3210 100%);
        border-bottom: 3px solid var(--brand-gold);
      }

      .report-header img {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(245, 231, 167, 0.45);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }

      .report-header h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: 0.01em;
      }

      .report-header p {
        margin: 6px 0 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.98rem;
      }

      .report-body {
        padding: 28px 32px 32px;
      }

      .meta-grid,
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
        margin-bottom: 20px;
      }

      .metric-card {
        padding: 16px 18px;
        border-radius: 16px;
        border: 1px solid var(--brand-border);
        background: linear-gradient(180deg, var(--brand-surface-alt) 0%, #ffffff 100%);
      }

      .metric-card strong {
        display: block;
        margin-bottom: 8px;
        color: var(--brand-muted);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .metric-card span {
        display: block;
        font-size: 1rem;
        font-weight: 700;
        color: var(--brand-ink);
        word-break: break-word;
      }

      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--brand-border);
        border-radius: 18px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background: #ffffff;
      }

      th,
      td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--brand-border);
        text-align: left;
        vertical-align: top;
        font-size: 0.92rem;
      }

      th {
        background: var(--brand-charcoal);
        color: #ffffff;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
      }

      tbody tr:nth-child(even) {
        background: rgba(248, 250, 252, 0.75);
      }

      .empty-row {
        text-align: center;
        color: var(--brand-muted);
        padding: 24px;
      }

      .report-footer {
        margin-top: 18px;
        color: var(--brand-muted);
        font-size: 0.8rem;
        text-align: right;
      }
    </style>
  </head>
  <body>
    <div class="report-shell">
      <div class="report-header">
        <img src="${logo}" alt="Serenades of Praise Choir Logo" />
        <div>
          <h1>Serenades of Praise Choir</h1>
          <p>${escapeHtml(title)}${subtitle ? ` • ${escapeHtml(subtitle)}` : ""}</p>
        </div>
      </div>
      <div class="report-body">
        <div class="meta-grid">
          ${finalMeta
            .map(
              (item) => `
                <div class="metric-card">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>${escapeHtml(item.value)}</span>
                </div>`
            )
            .join("")}
        </div>
        <div class="summary-grid">
          ${finalSummary
            .map(
              (item) => `
                <div class="metric-card">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>${escapeHtml(item.value)}</span>
                </div>`
            )
            .join("")}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
        <div class="report-footer">Generated on ${escapeHtml(generatedAt)}</div>
      </div>
    </div>
  </body>
</html>`;
}

export function downloadBrandedTableReport({
  title,
  filename,
  headers,
  rows,
  subtitle,
  meta = [],
  summary = [],
  emptyMessage = "No records available for this report.",
}: BrandedTableReportOptions): void {
  const fileDate = createTimestamp();
  const generatedAt = new Date().toLocaleString();
  const finalMeta = meta.length > 0 ? meta : [{ label: "Generated", value: generatedAt }];
  const finalSummary = summary.length > 0
    ? summary
    : [{ label: "Records", value: rows.length }, { label: "Generated", value: generatedAt }];
  const statusColumnIndex = headers.findIndex((header) => header.toLowerCase() === "status");

  void Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    getImageDataUrl(logo),
    getFontBinary(montserratRegularTtf),
    getFontBinary(montserratBoldTtf),
  ]).then(([jspdfModule, autoTableModule, logoDataUrl, montserratRegularBinary, montserratBoldBinary]) => {
    const { jsPDF } = jspdfModule;
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 12;
    let hasMontserrat = false;

    if (montserratRegularBinary && montserratBoldBinary) {
      try {
        doc.addFileToVFS("Montserrat-Regular.ttf", montserratRegularBinary);
        doc.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");
        doc.addFileToVFS("Montserrat-Bold.ttf", montserratBoldBinary);
        doc.addFont("Montserrat-Bold.ttf", "Montserrat", "bold");
        hasMontserrat = true;
      } catch (fontError) {
        console.warn("[Export] Falling back to Helvetica; failed to register Montserrat font.", fontError);
      }
    }

    const fontFamily = hasMontserrat ? "Montserrat" : "helvetica";

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setFillColor(11, 11, 11);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 28, pageWidth, 2, "F");

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", marginX, 5, 16, 16);
    }

    doc.setFont(fontFamily, "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Serenades of Praise Choir", logoDataUrl ? 32 : marginX, 13);
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(10);
    doc.setTextColor(240, 240, 240);
    doc.text([title, subtitle].filter(Boolean).join(" • "), logoDataUrl ? 32 : marginX, 20);

    let cursorY = 38;
    const drawMetricGroup = (items: ReportMetric[], startX: number, startY: number, columns: number) => {
      const cardWidth = (pageWidth - (marginX * 2) - ((columns - 1) * 4)) / columns;
      items.forEach((item, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = startX + column * (cardWidth + 4);
        const y = startY + row * 13;
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, 10, 2, 2, "FD");
        doc.setFont(fontFamily, "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        doc.text(String(item.label).toUpperCase(), x + 2, y + 3.5);
        doc.setFont(fontFamily, "bold");
        doc.setFontSize(9.4);
        doc.setTextColor(15, 23, 42);
        doc.text(String(item.value ?? ""), x + 2, y + 7.5, { maxWidth: cardWidth - 4 });
      });
      return startY + Math.ceil(items.length / columns) * 13;
    };

    cursorY = drawMetricGroup(finalMeta.slice(0, 4), marginX, cursorY, Math.min(Math.max(finalMeta.slice(0, 4).length, 1), 4));
    cursorY += 4;
    cursorY = drawMetricGroup(finalSummary.slice(0, 4), marginX, cursorY, Math.min(Math.max(finalSummary.slice(0, 4).length, 1), 4));
    cursorY += 6;

    const bodyRows = rows.length > 0
      ? rows.map((row) => row.map((cell, cellIndex) => {
        const stringValue = String(cell ?? "");
        return cellIndex === statusColumnIndex ? toTitleCase(stringValue) : stringValue;
      }))
      : [[emptyMessage, ...Array(Math.max(headers.length - 1, 0)).fill("")]];

    autoTable(doc, {
      startY: cursorY,
      head: [headers],
      body: bodyRows,
      theme: "grid",
      margin: { left: marginX, right: marginX, bottom: 18 },
      styles: {
        font: fontFamily,
        fontSize: 9,
        cellPadding: 2.5,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.18,
      },
      headStyles: {
        font: fontFamily,
        fillColor: [11, 11, 11],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      bodyStyles: rows.length === 0 ? { textColor: [71, 85, 105] } : { textColor: [15, 23, 42] },
      didParseCell: (data: {
        section: string;
        column: { index: number };
        cell: { styles: { fillColor?: [number, number, number]; textColor?: [number, number, number]; fontStyle?: string; halign?: string } };
        row: { raw: string[] };
      }) => {
        if (data.section !== "body" || statusColumnIndex === -1 || data.column.index !== statusColumnIndex) {
          return;
        }

        const rawStatus = String(data.row.raw[statusColumnIndex] ?? "");
        const colors = getPdfStatusColors(rawStatus);
        data.cell.styles.fillColor = colors.fill;
        data.cell.styles.textColor = colors.text;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.halign = "center";
      },
      didDrawPage: (data: { pageNumber: number }) => {
        const footerTop = pageHeight - 14;

        doc.setFillColor(250, 247, 237);
        doc.rect(0, footerTop - 3, pageWidth, 17, "F");
        doc.setFillColor(212, 175, 55);
        doc.rect(0, footerTop - 3, pageWidth, 1.4, "F");
        doc.setFillColor(11, 11, 11);
        doc.rect(0, footerTop - 1.6, pageWidth, 15.6, "F");

        doc.setFillColor(212, 175, 55);
        doc.circle(marginX + 2, footerTop + 5.8, 1.1, "F");
        doc.circle(pageWidth - marginX - 2, footerTop + 5.8, 1.1, "F");

        doc.setFont(fontFamily, "bold");
        doc.setFontSize(8.2);
        doc.setTextColor(255, 255, 255);
        doc.text("Serenades of Praise Choir", marginX + 6, footerTop + 4.6);

        doc.setFont(fontFamily, "normal");
        doc.setFontSize(7.4);
        doc.setTextColor(226, 232, 240);
        doc.text("Admin report • Attendance and records archive", marginX + 6, footerTop + 8.7);

        doc.setFontSize(7.2);
        doc.setTextColor(245, 208, 95);
        doc.text("Excellence in worship • Discipline in service", pageWidth / 2, footerTop + 6.8, { align: "center" });

        doc.setFont(fontFamily, "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(203, 213, 225);
        doc.text(`Generated on ${generatedAt}`, pageWidth - marginX, footerTop + 4.6, { align: "right" });
        doc.text(`Page ${data.pageNumber}`, pageWidth - marginX, footerTop + 8.7, { align: "right" });
      },
    });

    doc.save(`${filename}-${fileDate}.pdf`);
  });
}

export function downloadSpreadsheetReport({
  title,
  filename,
  headers,
  rows,
  subtitle,
  meta = [],
  summary = [],
  sheetName,
}: BrandedTableReportOptions & { sheetName?: string }): void {
  const worksheetRows = [
    [title],
    ...(subtitle ? [[subtitle]] : []),
    [],
    ...meta.map((item) => [item.label, item.value ?? ""]),
    ...(meta.length > 0 ? [[]] : []),
    ...summary.map((item) => [item.label, item.value ?? ""]),
    ...(summary.length > 0 ? [[]] : []),
    headers,
    ...rows.map((row) => row.map((cell) => cell ?? "")),
  ];

  void import("xlsx").then((XLSX) => {
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, (sheetName || title).slice(0, 31));
    XLSX.writeFile(workbook, `${filename}-${createTimestamp()}.xlsx`);
  });
}

// Export orders to CSV
export function exportOrdersToCSV(orders: TicketOrder[], filename: string = "ticket-orders") {
  const headers = [
    "Order Ref",
    "Date",
    "Customer Name",
    "Email",
    "Phone",
    "Event",
    "Event Date",
    "Tickets",
    "Subtotal",
    "Service Fee",
    "Total",
    "Payment Method",
    "Status",
    "Transaction ID",
  ];

  const rows = orders.map((order) => [
    order.txRef,
    new Date(order.createdAt).toLocaleString(),
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    order.eventTitle,
    order.eventDate,
    order.tickets.map((t) => `${t.quantity}x ${t.tierName}`).join("; "),
    order.subtotal,
    order.serviceFee,
    order.total,
    order.paymentMethod,
    order.status,
    order.transactionId || "",
  ]);

  downloadCSV(headers, rows, filename, {
    title: "Ticket Orders Report",
    summary: [
      { label: "Orders", value: orders.length },
      { label: "Revenue", value: formatCurrency(orders.reduce((sum, order) => sum + order.total, 0)) },
    ],
  });
}

// Add event to calendar (generates .ics file or opens Google Calendar)
export function addToCalendar(
  title: string,
  description: string,
  location: string,
  startDate: string,
  endDate?: string,
  type: "google" | "ics" = "google"
) {
  // Parse the date string
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours

  if (type === "google") {
    const formatDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15) + "Z";

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", title);
    url.searchParams.set("details", description);
    url.searchParams.set("location", location);
    url.searchParams.set("dates", `${formatDate(start)}/${formatDate(end)}`);

    window.open(url.toString(), "_blank");
  } else {
    // Generate .ics file
    const formatICSDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15) + "Z";

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Serenades of Praise//Event//EN
BEGIN:VEVENT
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, "-")}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// Share event
export function shareEvent(
  title: string,
  description: string,
  url: string,
  platform: "whatsapp" | "facebook" | "twitter" | "copy"
) {
  const text = `${title}\n\n${description}\n\n`;

  switch (platform) {
    case "whatsapp":
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + url)}`,
        "_blank"
      );
      break;
    case "facebook":
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
        "_blank"
      );
      break;
    case "twitter":
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
      break;
    case "copy":
      navigator.clipboard.writeText(text + url);
      return true; // Indicate success for toast
  }
  return false;
}

// Print ticket
export function printTicket(ticketImageUrl: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Ticket - Serenades of Praise</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            img {
              max-width: 100%;
              height: auto;
              box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              img {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <img src="${ticketImageUrl}" alt="Ticket" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

// ============ DATA BACKUP & EXPORT ============

export interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    members: any[];
    events: any[];
    gallery: any[];
    orders: any[];
    leaveRequests: any[];
    attendance: any[];
    albums: any[];
    musicVideos: any[];
    streamingPlatforms: any[];
    promoCodes: any[];
    settings: any;
    adminUsers: any[];
    auditLog: any[];
  };
}

// Export all data as JSON backup
export async function exportFullBackup(): Promise<void> {
  const [
    promoCodes,
    members,
    events,
    gallery,
    leaveRequests,
    settings,
    adminUsers,
    auditLog,
    orders,
    attendance,
    albums,
    musicVideos,
    streamingPlatforms,
  ] = await Promise.all([
    getAllPromoCodes(),
    getAllMembers(),
    getAllEvents(),
    getAllGalleryItems(),
    getAllLeaveRequests(),
    getSettings(),
    getAllAdminUsers(),
    getAuditLog(500),
    getAllOrders(),
    getAllSessions(),
    getAllAlbums(),
    getAllMusicVideos(),
    getAllPlatforms(),
  ]);
  const backup: BackupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      members,
      events,
      gallery,
      orders,
      leaveRequests,
      attendance,
      albums,
      musicVideos,
      streamingPlatforms,
      promoCodes,
      settings,
      adminUsers: adminUsers.map((u) => ({ ...u, password: "[HIDDEN]" })), // Don't export passwords
      auditLog,
    },
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `serenades-backup-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Export members to CSV
export function exportMembersToCSV(): void {
  const members = getAllMembers();
  const headers = ["Name", "Email", "Phone", "Voice Part", "Role", "Join Date", "Status"];
  
  const rows = members.map((m) => [
    m.name,
    m.email,
    m.phone,
    m.voicePart,
    m.role,
    m.joinedDate,
    m.status,
  ]);

  downloadCSV(headers, rows, "members");
}

// Export attendance summary to CSV
export async function exportAttendanceToCSV(): Promise<void> {
  const sessions = await getAllSessions();
  
  const headers = ["Date", "Title", "Total Present", "Total Absent", "Total Excused", "Total Late", "Attendance Rate"];
  
  const rows = sessions.map((s) => {
    const total = s.totalPresent + s.totalAbsent + s.totalExcused + s.totalLate;
    const attended = s.totalPresent + s.totalLate;
    const countable = total - s.totalExcused;
    const rate = countable > 0 ? Math.round((attended / countable) * 100) : 100;
    
    return [
      new Date(s.date).toLocaleDateString(),
      s.title,
      s.totalPresent,
      s.totalAbsent,
      s.totalExcused,
      s.totalLate,
      `${rate}%`,
    ];
  });

  downloadCSV(headers, rows, "attendance-summary");
}

// Export detailed attendance records to CSV
export async function exportDetailedAttendanceToCSV(): Promise<void> {
  const records = await getAllAttendanceRecords();
  
  const headers = ["Date", "Member Name", "Email", "Voice Part", "Status", "Notes", "Marked By"];
  
  const rows = records.map((r) => [
    new Date(r.date).toLocaleDateString(),
    r.memberName,
    r.memberEmail,
    r.memberVoice,
    r.status,
    r.notes || "",
    r.markedBy || "",
  ]);

  downloadCSV(headers, rows, "attendance-detailed");
}

// Export attendance by member
export async function exportAttendanceByMemberToCSV(): Promise<void> {
  const members = getAllMembers();

  const headers = ["Member Name", "Email", "Voice Part", "Total Sessions", "Present", "Absent", "Excused", "Late", "Attendance Rate"];

  const statsPromises = members.map((m) => getMemberAttendanceStats(m.id));
  const statsList = await Promise.all(statsPromises);
  const rows = members.map((m, i) => {
    const stats = statsList[i];
    return [
      m.name,
      m.email,
      m.voice,
      stats.total,
      stats.present,
      stats.absent,
      stats.excused,
      stats.late,
      `${stats.percentage}%`,
    ];
  });

  // Sort by attendance rate descending
  rows.sort((a, b) => parseInt(b[8] as string) - parseInt(a[8] as string));

  downloadCSV(headers, rows, "attendance-by-member");
}

// Export attendance for a specific month
export async function exportMonthlyAttendanceToCSV(year: number, month: number): Promise<void> {
  const records = await getAllAttendanceRecords();
  const members = getAllMembers();
  
  // Filter records for the specified month
  const monthRecords = records.filter(r => {
    const date = new Date(r.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  // Get unique dates for the month
  const uniqueDates = [...new Set(monthRecords.map(r => r.date))].sort();
  
  // Create headers
  const headers = ["Member Name", "Voice Part", ...uniqueDates.map(d => new Date(d).toLocaleDateString()), "Rate"];
  
  const rows = members.map((m) => {
    const memberRecords = monthRecords.filter(r => r.memberId === m.id);
    const recordsByDate = memberRecords.reduce((acc, r) => {
      acc[r.date] = r.status;
      return acc;
    }, {} as Record<string, string>);
    
    const present = memberRecords.filter(r => r.status === "present" || r.status === "late").length;
    const total = memberRecords.filter(r => r.status !== "excused").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    
    return [
      m.name,
      m.voice,
      ...uniqueDates.map(d => {
        const status = recordsByDate[d];
        if (!status) return "-";
        switch (status) {
          case "present": return "P";
          case "absent": return "A";
          case "excused": return "E";
          case "late": return "L";
          default: return "-";
        }
      }),
      `${rate}%`,
    ];
  });

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  downloadCSV(headers, rows, `attendance-${monthName}-${year}`);
}

// Export financial report to CSV
export function exportFinancialReportToCSV(): void {
  const orders = getAllOrders().filter(o => o.status === "confirmed" || o.status === "used");
  
  const headers = [
    "Date",
    "Order Ref",
    "Customer",
    "Event",
    "Tickets",
    "Subtotal",
    "Service Fee",
    "Total",
    "Payment Method",
    "Transaction ID",
  ];
  
  const rows = orders.map((o) => [
    new Date(o.createdAt).toLocaleDateString(),
    o.txRef,
    o.customer.name,
    o.eventTitle,
    o.tickets.map(t => `${t.quantity}x ${t.tierName}`).join("; "),
    o.subtotal,
    o.serviceFee,
    o.total,
    o.paymentMethod,
    o.transactionId || "",
  ]);

  // Add summary row
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalSubtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalFees = orders.reduce((sum, o) => sum + o.serviceFee, 0);
  
  rows.push([]);
  rows.push(["TOTAL", "", "", "", "", totalSubtotal, totalFees, totalRevenue, "", ""]);

  downloadCSV(headers, rows, "financial-report");
}

// Export leave requests to CSV
export async function exportLeaveRequestsToCSV(): Promise<void> {
  const requests = await getAllLeaveRequests();
  
  const headers = [
    "Member Name",
    "Email",
    "Start Date",
    "End Date",
    "Reason",
    "Status",
    "Reviewed By",
    "Reviewed At",
    "Admin Notes",
    "Created At",
  ];
  
  const rows = requests.map((r) => [
    r.memberName,
    r.memberEmail,
    r.startDate,
    r.endDate,
    r.reason,
    r.status,
    r.reviewedBy || "",
    r.reviewedAt || "",
    r.adminNotes || "",
    r.createdAt,
  ]);

  downloadCSV(headers, rows, "leave-requests");
}

// Export all contributions to CSV
export function exportContributionsToCSV(): void {
  const contributions = getAllContributions();
  const types = getAllContributionTypes();
  
  const headers = [
    "Date",
    "Member Name",
    "Member Email",
    "Contribution Type",
    "Category",
    "Amount (RWF)",
    "Month",
    "Year",
    "Payment Method",
    "Reference",
    "Recorded By",
    "Notes",
  ];
  
  const rows = contributions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((c) => [
      new Date(c.createdAt).toLocaleDateString(),
      c.memberName,
      c.memberEmail,
      c.typeName,
      c.category,
      c.amount,
      c.month ? getMonthName(c.month) : "",
      c.year || "",
      c.paymentMethod || "cash",
      c.reference || "",
      c.recordedBy || "",
      c.notes || "",
    ]);

  // Add summary
  const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
  const monthlyTotal = contributions.filter(c => c.category === "monthly").reduce((sum, c) => sum + c.amount, 0);
  const specialTotal = contributions.filter(c => c.category === "special" || c.category === "event").reduce((sum, c) => sum + c.amount, 0);
  
  rows.push([]);
  rows.push(["SUMMARY", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push(["Total Contributions", "", "", "", "", totalAmount, "", "", "", "", "", ""]);
  rows.push(["Monthly Dues Total", "", "", "", "", monthlyTotal, "", "", "", "", "", ""]);
  rows.push(["Special/Event Total", "", "", "", "", specialTotal, "", "", "", "", "", ""]);
  rows.push(["Total Records", "", "", "", "", contributions.length, "", "", "", "", "", ""]);

  downloadCSV(headers, rows, "contributions");
}

// Export contributions by member (for member statement)
export function exportMemberStatement(memberId: string, memberName: string, memberEmail: string): void {
  const contributions = getContributionsByMember(memberId);
  const status = getMemberContributionStatus(memberId, memberName, memberEmail);
  
  const headers = [
    "Date",
    "Description",
    "Category",
    "Amount (RWF)",
    "Payment Method",
    "Reference",
  ];
  
  const rows = contributions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((c) => [
      new Date(c.createdAt).toLocaleDateString(),
      c.typeName + (c.month && c.year ? ` - ${getMonthName(c.month)} ${c.year}` : ""),
      c.category,
      c.amount,
      c.paymentMethod || "cash",
      c.reference || "",
    ]);

  // Add summary
  rows.push([]);
  rows.push(["MEMBER STATEMENT SUMMARY", "", "", "", "", ""]);
  rows.push(["Member Name", memberName, "", "", "", ""]);
  rows.push(["Email", memberEmail, "", "", "", ""]);
  rows.push(["Generated", new Date().toLocaleString(), "", "", "", ""]);
  rows.push([]);
  rows.push(["Total Paid", "", "", status?.totalPaid || 0, "", ""]);
  rows.push(["Monthly Dues Paid", "", "", status?.monthlyDuesPaid || 0, "", ""]);
  rows.push(["Special Contributions", "", "", status?.specialContributions || 0, "", ""]);
  
  if (status?.unpaidMonths && status.unpaidMonths.length > 0) {
    rows.push([]);
    rows.push(["OUTSTANDING DUES", "", "", "", "", ""]);
    status.unpaidMonths.forEach(item => {
      rows.push([`${getMonthName(item.month)} ${item.year}`, "Monthly Dues", "monthly", item.expectedAmount, "UNPAID", ""]);
    });
  }

  downloadCSV(headers, rows, `member-statement-${memberName.replace(/\s+/g, "-").toLowerCase()}`);
}

// Export monthly dues report
export function exportMonthlyDuesReport(year: number): void {
  const members = getAllMembers();
  const types = getAllContributionTypes();
  const monthlyType = types.find(t => t.category === "monthly" && t.isActive);
  const expectedAmount = monthlyType?.amount || 0;
  
  const headers = ["Member Name", "Email", ...MONTH_NAMES, "Total Paid", "Months Paid"];
  
  const rows = members.map(member => {
    const status = getMemberContributionStatus(member.id, member.name, member.email);
    const contributions = getContributionsByMember(member.id).filter(c => c.category === "monthly" && c.year === year);
    
    const monthlyPayments = MONTH_NAMES.map((_, index) => {
      const monthContrib = contributions.find(c => c.month === index + 1);
      return monthContrib ? monthContrib.amount : 0;
    });
    
    const totalPaid = monthlyPayments.reduce((sum, p) => sum + p, 0);
    const monthsPaid = monthlyPayments.filter(p => p >= expectedAmount).length;
    
    return [member.name, member.email, ...monthlyPayments, totalPaid, `${monthsPaid}/12`];
  });
  
  // Add totals row
  const monthTotals = MONTH_NAMES.map((_, index) => {
    return rows.reduce((sum, row) => sum + (row[index + 2] as number), 0);
  });
  const grandTotal = monthTotals.reduce((sum, t) => sum + t, 0);
  
  rows.push([]);
  rows.push(["TOTALS", "", ...monthTotals, grandTotal, ""]);

  downloadCSV(headers, rows, `monthly-dues-${year}`);
}

// Export annual financial summary
export async function exportAnnualFinancialSummary(year: number): Promise<void> {
  const allContributions = getAllContributions();
  const [allOrders, allExpenses, allDonations] = await Promise.all([
    getAllOrders(),
    getAllExpenses(),
    getAllDonations(),
  ]);
  const contributions = allContributions.filter(c => c.year === year || new Date(c.createdAt).getFullYear() === year);
  const orders = allOrders.filter(o => new Date(o.createdAt).getFullYear() === year && (o.status === "confirmed" || o.status === "used"));
  const expenses = allExpenses.filter(e => new Date(e.date).getFullYear() === year);
  const donations = allDonations.filter(d => new Date(d.date).getFullYear() === year);
  
  const headers = ["Category", "Description", "Amount (RWF)"];
  
  // Contribution totals by type
  const types = getAllContributionTypes();
  const rows: any[][] = [];
  
  // INCOME SECTION
  rows.push(["=== INCOME ===", "", ""]);
  rows.push([]);
  rows.push(["MEMBER CONTRIBUTIONS", "", ""]);
  
  const monthlyTotal = contributions.filter(c => c.category === "monthly").reduce((sum, c) => sum + c.amount, 0);
  rows.push(["Monthly Dues", `${contributions.filter(c => c.category === "monthly").length} payments`, monthlyTotal]);
  
  types.filter(t => t.category !== "monthly").forEach(type => {
    const typeTotal = contributions.filter(c => c.typeId === type.id).reduce((sum, c) => sum + c.amount, 0);
    if (typeTotal > 0) {
      rows.push([type.name, `${contributions.filter(c => c.typeId === type.id).length} payments`, typeTotal]);
    }
  });
  
  const contributionsTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
  rows.push(["Subtotal - Contributions", "", contributionsTotal]);
  
  rows.push([]);
  rows.push(["TICKET SALES", "", ""]);
  
  const ticketRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const serviceFees = orders.reduce((sum, o) => sum + o.serviceFee, 0);
  rows.push(["Ticket Revenue", `${orders.length} orders`, ticketRevenue]);
  rows.push(["Service Fees", "", serviceFees]);
  rows.push(["Subtotal - Tickets", "", ticketRevenue + serviceFees]);
  
  rows.push([]);
  rows.push(["DONATIONS", "", ""]);
  
  const donationsTotal = donations.reduce((sum, d) => sum + d.amount, 0);
  rows.push(["Total Donations", `${donations.length} donors`, donationsTotal]);
  
  const totalIncome = contributionsTotal + ticketRevenue + serviceFees + donationsTotal;
  rows.push([]);
  rows.push(["TOTAL INCOME", "", totalIncome]);
  
  // EXPENSES SECTION
  rows.push([]);
  rows.push(["=== EXPENSES ===", "", ""]);
  rows.push([]);
  
  const expenseCategories = [...new Set(expenses.map(e => e.category))];
  expenseCategories.forEach(cat => {
    const catExpenses = expenses.filter(e => e.category === cat);
    const catTotal = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    rows.push([getCategoryLabel(cat), `${catExpenses.length} transactions`, catTotal]);
  });
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  rows.push([]);
  rows.push(["TOTAL EXPENSES", "", totalExpenses]);
  
  // NET BALANCE
  rows.push([]);
  rows.push(["=== SUMMARY ===", "", ""]);
  rows.push([]);
  rows.push(["Total Income", "", totalIncome]);
  rows.push(["  - Contributions", "", contributionsTotal]);
  rows.push(["  - Ticket Sales", "", ticketRevenue + serviceFees]);
  rows.push(["  - Donations", "", donationsTotal]);
  rows.push(["Total Expenses", "", totalExpenses]);
  rows.push([]);
  const netBalance = totalIncome - totalExpenses;
  rows.push([netBalance >= 0 ? "NET SURPLUS" : "NET DEFICIT", `Year ${year}`, Math.abs(netBalance)]);

  downloadCSV(headers, rows, `annual-financial-summary-${year}`);
}

// Year-over-year comparison (finance + attendance + membership)
export async function exportYearOverYearReport(years: number[]): Promise<void> {
  const headers = ["Year", "Contributions", "Donations", "Ticket Revenue", "Expenses", "Net", "Attendance Sessions", "Members (end of year)"];
  const rows: any[][] = [];

  const [allExpenses, allMembers, allDonations, allOrders, allSessions] = await Promise.all([
    getAllExpenses(),
    getAllMembers(),
    getAllDonations(),
    getAllOrders(),
    getAllSessions(),
  ]);
  const allContributions = getAllContributions();

  years.forEach((year) => {
    const contributions = allContributions.filter(c => c.year === year || new Date(c.createdAt).getFullYear() === year);
    const contributionTotal = contributions.reduce((sum, c) => sum + c.amount, 0);

    const donations = allDonations.filter(d => new Date(d.date).getFullYear() === year);
    const donationTotal = donations.reduce((sum, d) => sum + d.amount, 0);

    const orders = allOrders.filter(o => new Date(o.createdAt).getFullYear() === year && (o.status === "confirmed" || o.status === "used"));
    const ticketRevenue = orders.reduce((sum, o) => sum + (o.subtotal + o.serviceFee), 0);

    const expenses = allExpenses.filter(e => new Date(e.date).getFullYear() === year);
    const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    const net = contributionTotal + donationTotal + ticketRevenue - expenseTotal;

    const attendanceSessions = allSessions.filter(s => new Date(s.date).getFullYear() === year).length;

    const members = allMembers.filter(m => new Date(m.joinedDate).getFullYear() <= year);

    rows.push([
      year,
      contributionTotal,
      donationTotal,
      ticketRevenue,
      expenseTotal,
      net,
      attendanceSessions,
      members.length,
    ]);
  });

  downloadCSV(headers, rows, `year-over-year-${years.join("-")}`);
}

// Export donations to CSV
export async function exportDonationsToCSV(): Promise<void> {
  const donations = await getAllDonations();
  
  const headers = [
    "Date",
    "Donor Name",
    "Email",
    "Amount (RWF)",
    "Payment Method",
    "Reference",
    "Message",
    "Recorded By",
    "Recorded At",
  ];

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "bank": return "Bank Transfer";
      case "mtn": return "MTN MoMo";
      case "airtel": return "Airtel Money";
      case "cash": return "Cash";
      default: return "Other";
    }
  };

  const rows = donations
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(d => [
      d.date,
      d.donorName,
      d.donorEmail || "",
      d.amount,
      getMethodLabel(d.method),
      d.reference || "",
      d.message || "",
      d.recordedBy,
      new Date(d.createdAt).toLocaleString(),
    ]);

  // Add summary
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  rows.push([]);
  rows.push(["TOTAL", "", "", total, "", "", "", "", ""]);

  downloadCSV(headers, rows, "donations");
}

// Helper function to download CSV
function downloadCSV(
  headers: string[],
  rows: ReportCell[][],
  filename: string,
  options: DownloadReportOptions = {}
): void {
  downloadSpreadsheetReport({
    title: options.title ?? formatReportTitle(filename),
    subtitle: options.subtitle,
    filename,
    headers,
    rows,
    meta: options.meta,
    summary: options.summary,
    emptyMessage: options.emptyMessage,
  });
}

// Get backup statistics
export async function getBackupStats(): Promise<{
  members: number;
  events: number;
  gallery: number;
  orders: number;
  leaveRequests: number;
  attendance: number;
  albums: number;
  musicVideos: number;
  promoCodes: number;
  donations: number;
}> {
  const [
    promoCodes,
    members,
    events,
    gallery,
    leaveRequests,
    orders,
    sessions,
    albums,
    musicVideos,
    donations,
  ] = await Promise.all([
    getAllPromoCodes(),
    getAllMembers(),
    getAllEvents(),
    getAllGalleryItems(),
    getAllLeaveRequests(),
    getAllOrders(),
    getAllSessions(),
    getAllAlbums(),
    getAllMusicVideos(),
    getAllDonations(),
  ]);
  return {
    members: (members || []).length,
    events: (events || []).length,
    gallery: (gallery || []).length,
    orders: (orders || []).length,
    leaveRequests: (leaveRequests || []).length,
    attendance: (sessions || []).length,
    albums: (albums || []).length,
    musicVideos: (musicVideos || []).length,
    promoCodes: (promoCodes || []).length,
    donations: (donations || []).length,
  };
}

