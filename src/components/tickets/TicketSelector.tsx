import { Minus, Plus, Ticket, Star, Crown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/flutterwave";
import type { TicketTier } from "@/lib/ticketService";

interface TicketSelectorProps {
  tiers: TicketTier[];
  selectedTickets: Record<string, number>;
  onQuantityChange: (tierId: string, quantity: number) => void;
}

const tierIcons: Record<string, React.ReactNode> = {
  regular: <Ticket className="w-5 h-5" />,
  vip: <Star className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
};

export function TicketSelector({
  tiers,
  selectedTickets,
  onQuantityChange,
}: TicketSelectorProps) {
  const getTierIcon = (tierName: string) => {
    const key = tierName.toLowerCase();
    return tierIcons[key] || <Ticket className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">
        Select Your Tickets
      </h3>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const quantity = selectedTickets[tier.id] || 0;
          const isSelected = quantity > 0;
          // Calculate actual remaining tickets (available - sold)
          const sold = (tier as any).sold || 0;
          const remaining = tier.available - sold;
          const isSoldOut = remaining <= 0;
          const isLowStock = remaining > 0 && remaining <= 10;

          return (
            <div
              key={tier.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : isSoldOut
                  ? "border-muted bg-muted/20 opacity-60"
                  : "border-primary/20 hover:border-primary/40 bg-secondary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Tier Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                      {getTierIcon(tier.name)}
                    </span>
                    <h4 className="font-semibold text-foreground">{tier.name}</h4>
                    {isSoldOut ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs font-bold uppercase">
                        Sold Out
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Only {remaining} left!
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{tier.description}</p>
                  
                  {tier.perks.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {tier.perks.map((perk, i) => (
                        <li
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                        >
                          {perk}
                        </li>
                      ))}
                    </ul>
                  )}

                  {!isSoldOut && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {remaining} tickets available
                    </p>
                  )}
                </div>

                {/* Price & Quantity */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-xl font-bold mb-2 ${isSoldOut ? "text-muted-foreground line-through" : "gold-text"}`}>
                    {formatCurrency(tier.price)}
                  </p>

                  {!isSoldOut && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => onQuantityChange(tier.id, Math.max(0, quantity - 1))}
                        disabled={quantity === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="w-8 text-center font-semibold text-foreground">
                        {quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() =>
                          onQuantityChange(
                            tier.id,
                            Math.min(tier.maxPerPerson, remaining, quantity + 1)
                          )
                        }
                        disabled={quantity >= tier.maxPerPerson || quantity >= remaining}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

