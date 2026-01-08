import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  TrendingUp,
  QrCode,
  BarChart3,
  Download,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/flutterwave";
import type { Event } from "@/lib/dataService";
import type { TicketOrder } from "@/lib/ticketService";
import { cn } from "@/lib/utils";

interface EventSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  orders: TicketOrder[];
}

export function EventSummaryModal({ isOpen, onClose, event, orders }: EventSummaryModalProps) {
  if (!event) return null;

  // Filter orders for this event
  const eventOrders = orders.filter(o => o.eventId === event.id);
  const confirmedOrders = eventOrders.filter(o => o.status === "confirmed");
  const pendingOrders = eventOrders.filter(o => o.status === "pending");
  const cancelledOrders = eventOrders.filter(o => o.status === "cancelled");

  // Calculate stats
  const totalTickets = event.tickets.reduce((sum, t) => sum + t.available, 0);
  const soldTickets = event.tickets.reduce((sum, t) => sum + (t.sold || 0), 0);
  const remainingTickets = totalTickets - soldTickets;
  
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;
  
  // Count scanned tickets
  const scannedTickets = confirmedOrders.filter(o => o.scannedAt).length;
  const checkInRate = soldTickets > 0 ? (scannedTickets / soldTickets) * 100 : 0;

  // Event status
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();

  // Revenue by tier
  const revenueByTier = event.tickets.map(tier => {
    const tierOrders = confirmedOrders.filter(o => 
      o.tickets.some(t => t.tierName === tier.name)
    );
    const tierRevenue = tierOrders.reduce((sum, o) => 
      sum + o.tickets
        .filter(t => t.tierName === tier.name)
        .reduce((s, t) => s + t.price * t.quantity, 0),
      0
    );
    const tierSold = tierOrders.reduce((sum, o) => 
      sum + o.tickets
        .filter(t => t.tierName === tier.name)
        .reduce((s, t) => s + t.quantity, 0),
      0
    );
    
    return {
      name: tier.name,
      price: tier.price,
      available: tier.available,
      sold: tier.sold || 0,
      revenue: tierRevenue,
    };
  });

  const downloadSummary = () => {
    const summary = `
EVENT SUMMARY REPORT
=====================

Event: ${event.title}
Date: ${new Date(event.date).toLocaleDateString()}
Time: ${event.time}
Location: ${event.location}
Status: ${isPast ? "Completed" : isToday ? "Today" : "Upcoming"}

TICKET SALES
------------
Total Available: ${totalTickets}
Total Sold: ${soldTickets}
Remaining: ${remainingTickets}
Sell-through Rate: ${((soldTickets / totalTickets) * 100).toFixed(1)}%

REVENUE
-------
Total Revenue: ${formatCurrency(totalRevenue)}
Average Order Value: ${formatCurrency(avgOrderValue)}

ORDERS
------
Confirmed Orders: ${confirmedOrders.length}
Pending Orders: ${pendingOrders.length}
Cancelled Orders: ${cancelledOrders.length}

CHECK-IN
--------
Tickets Scanned: ${scannedTickets}
Check-in Rate: ${checkInRate.toFixed(1)}%

BREAKDOWN BY TIER
-----------------
${revenueByTier.map(t => `${t.name}: ${t.sold}/${t.available} sold (${formatCurrency(t.revenue)})`).join("\n")}

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Event Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <div className="card-glass rounded-xl p-4">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              {event.title}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(event.date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {event.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                isPast ? "bg-green-500/20 text-green-400" :
                isToday ? "bg-yellow-500/20 text-yellow-400" :
                "bg-blue-500/20 text-blue-400"
              )}>
                {isPast ? "Completed" : isToday ? "Today" : "Upcoming"}
              </span>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Tickets Sold</span>
              </div>
              <p className="text-2xl font-bold">{soldTickets}<span className="text-sm text-muted-foreground">/{totalTickets}</span></p>
              <p className="text-xs text-primary mt-1">
                {((soldTickets / totalTickets) * 100).toFixed(1)}% sell-through
              </p>
            </div>

            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(avgOrderValue)}
              </p>
            </div>

            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Orders</span>
              </div>
              <p className="text-2xl font-bold">{confirmedOrders.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingOrders.length} pending
              </p>
            </div>

            <div className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Check-ins</span>
              </div>
              <p className="text-2xl font-bold">{scannedTickets}<span className="text-sm text-muted-foreground">/{soldTickets}</span></p>
              <p className="text-xs text-purple-400 mt-1">
                {checkInRate.toFixed(1)}% check-in rate
              </p>
            </div>
          </div>

          {/* Revenue by Tier */}
          <div className="card-glass rounded-xl p-4">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Breakdown by Tier
            </h4>
            <div className="space-y-3">
              {revenueByTier.map((tier, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{tier.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {tier.sold}/{tier.available} · {formatCurrency(tier.revenue)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(tier.sold / tier.available) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="card-glass rounded-xl p-4">
            <h4 className="font-semibold text-foreground mb-4">Order Status</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-lg font-bold text-green-500">{confirmedOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-lg font-bold text-yellow-500">{pendingOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-lg font-bold text-red-500">{cancelledOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={downloadSummary}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button variant="gold" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

