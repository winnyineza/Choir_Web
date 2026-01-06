import { Loader2, Phone, CreditCard, Building2, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/flutterwave";
import type { PaymentMethod } from "./PaymentStep";

interface ProcessingPaymentProps {
  method: PaymentMethod;
  amount: number;
  txRef: string;
}

export function ProcessingPayment({ method, amount, txRef }: ProcessingPaymentProps) {
  const methodInfo: Record<PaymentMethod, { icon: typeof Phone; title: string; description: string }> = {
    demo: {
      icon: Sparkles,
      title: "Processing Demo Payment",
      description: "Simulating a successful payment...",
    },
    momo: {
      icon: Phone,
      title: "Submitting Order",
      description: "Your order is being processed. You'll receive payment instructions shortly.",
    },
    card: {
      icon: CreditCard,
      title: "Processing Card Payment",
      description: "Please complete the payment in the popup window",
    },
    bank: {
      icon: Building2,
      title: "Submitting Order",
      description: "Your order is being processed. Bank details will be sent to your email.",
    },
  };

  const { icon: Icon, title, description } = methodInfo[method];

  return (
    <div className="py-12 text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gold-gradient flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </div>

      <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        {description}
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-muted-foreground">Waiting for confirmation...</span>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-primary/10 max-w-xs mx-auto">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold gold-text">{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Reference</span>
          <span className="font-mono text-foreground">{txRef}</span>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Do not close this window until payment is complete
      </p>
    </div>
  );
}

