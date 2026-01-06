import { formatCurrency } from "@/lib/flutterwave";
import { getServiceFee, type TicketTier } from "@/lib/ticketService";
import { Ticket, Receipt } from "lucide-react";

interface OrderSummaryProps {
  tiers: TicketTier[];
  selectedTickets: Record<string, number>;
  showServiceFee?: boolean;
}

export function OrderSummary({
  tiers,
  selectedTickets,
  showServiceFee = true,
}: OrderSummaryProps) {
  const serviceFee = getServiceFee();
  
  const items = tiers
    .filter((tier) => selectedTickets[tier.id] > 0)
    .map((tier) => ({
      name: tier.name,
      quantity: selectedTickets[tier.id],
      price: tier.price,
      total: tier.price * selectedTickets[tier.id],
    }));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + (showServiceFee ? serviceFee : 0);
  const totalTickets = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-secondary/30 border border-primary/10 text-center">
        <Ticket className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Select tickets to see your order</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">Order Summary</h4>
      </div>

      <div className="space-y-2 text-sm">
        {items.map((item) => (
          <div key={item.name} className="flex justify-between">
            <span className="text-muted-foreground">
              {item.quantity}x {item.name}
            </span>
            <span className="text-foreground">{formatCurrency(item.total)}</span>
          </div>
        ))}

        {showServiceFee && (
          <div className="flex justify-between text-muted-foreground">
            <span>Service fee</span>
            <span>{formatCurrency(serviceFee)}</span>
          </div>
        )}

        <div className="border-t border-primary/10 pt-2 mt-2 flex justify-between font-bold">
          <span className="text-foreground">
            Total ({totalTickets} {totalTickets === 1 ? "ticket" : "tickets"})
          </span>
          <span className="gold-text text-lg">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

export function calculateOrderTotal(
  tiers: TicketTier[],
  selectedTickets: Record<string, number>
): { subtotal: number; serviceFee: number; total: number; ticketCount: number } {
  const serviceFee = getServiceFee();
  const subtotal = tiers.reduce(
    (sum, tier) => sum + tier.price * (selectedTickets[tier.id] || 0),
    0
  );
  const ticketCount = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  return {
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
    ticketCount,
  };
}

