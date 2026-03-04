import { Ticket, Target, BarChart3, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/flutterwave";
import { cn } from "@/lib/utils";

interface TicketHealthWidgetProps {
  ticketedEvents: number;
  ticketCapacity: number;
  ticketsSold: number;
  ticketsRemaining: number;
  potentialRevenue: number;
  className?: string;
  title?: string;
}

export function TicketHealthWidget({
  ticketedEvents,
  ticketCapacity,
  ticketsSold,
  ticketsRemaining,
  potentialRevenue,
  className,
  title = "Ticket Health",
}: TicketHealthWidgetProps) {
  const soldRate = ticketCapacity > 0 ? Math.round((ticketsSold / ticketCapacity) * 100) : 0;

  return (
    <div className={cn("card-glass rounded-xl p-4 border border-primary/20", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      {ticketedEvents > 0 ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-lg bg-secondary/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Ticketed Events</p>
              <p className="text-lg font-bold text-foreground">{ticketedEvents}</p>
            </div>
            <div className="rounded-lg bg-secondary/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Capacity</p>
              <p className="text-lg font-bold text-foreground">{ticketCapacity.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Sold</p>
              <p className="text-lg font-bold text-foreground">{ticketsSold.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold text-foreground">{ticketsRemaining.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Potential Revenue</p>
              <p className="text-sm lg:text-base font-bold text-primary">{formatCurrency(potentialRevenue)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="w-3 h-3" />
            Sell-through: <span className="text-foreground font-semibold">{soldRate}%</span>
            <Target className="w-3 h-3 ml-3" />
            Open Inventory: <span className="text-foreground font-semibold">{ticketsRemaining.toLocaleString()}</span>
            <TrendingUp className="w-3 h-3 ml-3" />
            Revenue Ceiling: <span className="text-foreground font-semibold">{formatCurrency(potentialRevenue)}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No ticketed events configured yet.</p>
      )}
    </div>
  );
}
