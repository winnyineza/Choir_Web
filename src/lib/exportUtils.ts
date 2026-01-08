// Export utilities for admin panel

import { type TicketOrder } from "./ticketService";
import { formatCurrency } from "./flutterwave";
import { getAllMembers, getAllEvents, getAllGalleryItems, getSettings } from "./dataService";
import { getAllOrders } from "./ticketService";
import { getAllLeaveRequests } from "./leaveService";
import { getAllSessions } from "./attendanceService";
import { getAllAlbums, getAllMusicVideos, getAllPlatforms } from "./releaseService";
import { getAllPromoCodes } from "./promoService";
import { getAllAdminUsers, getAuditLog } from "./adminService";

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

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
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
export function exportFullBackup(): void {
  const backup: BackupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      members: getAllMembers(),
      events: getAllEvents(),
      gallery: getAllGalleryItems(),
      orders: getAllOrders(),
      leaveRequests: getAllLeaveRequests(),
      attendance: getAllSessions(),
      albums: getAllAlbums(),
      musicVideos: getAllMusicVideos(),
      streamingPlatforms: getAllPlatforms(),
      promoCodes: getAllPromoCodes(),
      settings: getSettings(),
      adminUsers: getAllAdminUsers().map(u => ({ ...u, password: "[HIDDEN]" })), // Don't export passwords
      auditLog: getAuditLog(500),
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

// Export attendance to CSV
export function exportAttendanceToCSV(): void {
  const sessions = getAllAttendanceSessions();
  const members = getAllMembers();
  
  const headers = ["Date", "Title", "Total Present", "Total Absent", "Total Excused"];
  
  const rows = sessions.map((s) => {
    const present = Object.values(s.records).filter(r => r === "present").length;
    const absent = Object.values(s.records).filter(r => r === "absent").length;
    const excused = Object.values(s.records).filter(r => r === "excused").length;
    
    return [s.date, s.title, present, absent, excused];
  });

  downloadCSV(headers, rows, "attendance-summary");
}

// Export detailed attendance to CSV
export function exportDetailedAttendanceToCSV(): void {
  const sessions = getAllAttendanceSessions();
  const members = getAllMembers();
  
  // Create headers: Date, Title, then each member name
  const headers = ["Date", "Title", ...members.map(m => m.name)];
  
  const rows = sessions.map((s) => {
    return [
      s.date,
      s.title,
      ...members.map(m => s.records[m.id] || "absent"),
    ];
  });

  downloadCSV(headers, rows, "attendance-detailed");
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
export function exportLeaveRequestsToCSV(): void {
  const requests = getAllLeaveRequests();
  
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

// Helper function to download CSV
function downloadCSV(headers: string[], rows: any[][], filename: string): void {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Get backup statistics
export function getBackupStats() {
  return {
    members: getAllMembers().length,
    events: getAllEvents().length,
    gallery: getAllGalleryItems().length,
    orders: getAllOrders().length,
    leaveRequests: getAllLeaveRequests().length,
    attendance: getAllSessions().length,
    albums: getAllAlbums().length,
    musicVideos: getAllMusicVideos().length,
    promoCodes: getAllPromoCodes().length,
  };
}

