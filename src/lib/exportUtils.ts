// Export utilities for admin panel

import { type TicketOrder } from "./ticketService";
import { formatCurrency } from "./flutterwave";

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

