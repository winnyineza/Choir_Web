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

