import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/flutterwave";
import { type TicketOrder } from "@/lib/ticketService";
import {
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Ticket,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Hash,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketDetailModalProps {
  order: TicketOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onMarkUsed: (orderId: string) => void;
}

export function TicketDetailModal({
  order,
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  onMarkUsed,
}: TicketDetailModalProps) {
  if (!order) return null;

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    used: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    cancelled: XCircle,
    used: Ticket,
  };

  const StatusIcon = statusIcons[order.status];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Order Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Reference & Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Order Reference</p>
              <p className="font-mono text-lg font-bold text-foreground">{order.txRef}</p>
            </div>
            <span
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5 capitalize",
                statusColors[order.status]
              )}
            >
              <StatusIcon className="w-4 h-4" />
              {order.status}
            </span>
          </div>

          {/* Event Info */}
          <div className="card-glass rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-primary text-sm">Event Information</h4>
            <div className="space-y-2">
              <p className="font-semibold text-foreground text-lg">{order.eventTitle}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                {order.eventDate}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {order.eventLocation}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="card-glass rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-primary text-sm">Customer Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium">{order.customer.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{order.customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{order.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="card-glass rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-primary text-sm">Tickets Purchased</h4>
            <div className="space-y-2">
              {order.tickets.map((ticket, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-primary/10 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary" />
                    <span className="text-foreground">
                      {ticket.quantity}x {ticket.tierName}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatCurrency(ticket.priceEach * ticket.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card-glass rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-primary text-sm">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="text-foreground">{formatCurrency(order.serviceFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary/10">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold gold-text text-lg">{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-primary/10 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="text-foreground capitalize">{order.paymentMethod}</span>
              </div>
              {order.transactionId && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="text-foreground font-mono text-xs">{order.transactionId}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Order Date:</span>
                <span className="text-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              {order.confirmedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-muted-foreground">Confirmed:</span>
                  <span className="text-foreground">
                    {new Date(order.confirmedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {order.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                  onClick={() => {
                    onConfirm(order.id);
                    onClose();
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => {
                    onCancel(order.id);
                    onClose();
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              </>
            )}
            {order.status === "confirmed" && (
              <Button
                variant="outline"
                className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                onClick={() => {
                  onMarkUsed(order.id);
                  onClose();
                }}
              >
                <Ticket className="w-4 h-4 mr-2" />
                Mark as Used
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

