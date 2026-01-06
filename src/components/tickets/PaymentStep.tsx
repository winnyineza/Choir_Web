import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, CreditCard, Building2, Sparkles, Loader2 } from "lucide-react";
import { formatCurrency, isFlutterwaveConfigured } from "@/lib/flutterwave";

export type PaymentMethod = "momo" | "card" | "bank" | "demo";

interface PaymentStepProps {
  total: number;
  txRef: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  onCustomerInfoChange: (info: { name: string; email: string; phone: string }) => void;
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  onProceed: () => void;
  isProcessing: boolean;
}

export function PaymentStep({
  total,
  txRef,
  customerInfo,
  onCustomerInfoChange,
  selectedMethod,
  onMethodSelect,
  onProceed,
  isProcessing,
}: PaymentStepProps) {
  const flutterwaveReady = isFlutterwaveConfigured();

  const paymentMethods = [
    {
      id: "demo" as PaymentMethod,
      name: "Demo Payment",
      icon: Sparkles,
      description: "Test the full flow instantly",
      available: true,
      highlight: true,
    },
    {
      id: "momo" as PaymentMethod,
      name: "MTN MoMo",
      icon: Phone,
      description: flutterwaveReady ? "Pay instantly with mobile money" : "Mobile money payment",
      available: true,
    },
    {
      id: "card" as PaymentMethod,
      name: "Card Payment",
      icon: CreditCard,
      description: "Visa, Mastercard",
      available: flutterwaveReady,
    },
    {
      id: "bank" as PaymentMethod,
      name: "Bank Transfer",
      icon: Building2,
      description: "Bank transfer payment",
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Your Information
          </h3>
          <span className="text-xs text-muted-foreground">* Required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={customerInfo.name}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, name: e.target.value })
              }
              className={`bg-secondary ${!customerInfo.name ? "border-destructive/50" : "border-primary/20"}`}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="078 XXX XXXX"
              value={customerInfo.phone}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, phone: e.target.value })
              }
              className={`bg-secondary ${!customerInfo.phone ? "border-destructive/50" : "border-primary/20"}`}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-1">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@email.com"
            value={customerInfo.email}
            onChange={(e) =>
              onCustomerInfoChange({ ...customerInfo, email: e.target.value })
            }
            className={`bg-secondary ${!customerInfo.email ? "border-destructive/50" : "border-primary/20"}`}
            required
          />
          <p className="text-xs text-muted-foreground">
            Your ticket will be sent to this email
          </p>
        </div>

        {/* Missing fields warning */}
        {(!customerInfo.name || !customerInfo.email || !customerInfo.phone) && selectedMethod && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            Please fill in all required fields above to continue.
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Payment Method
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => method.available && onMethodSelect(method.id)}
              disabled={!method.available}
              className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                selectedMethod === method.id
                  ? "border-primary bg-primary/10"
                  : method.id === "demo"
                  ? "border-green-500/50 bg-green-500/10 hover:border-green-500"
                  : method.available
                  ? "border-primary/20 hover:border-primary/50 bg-secondary/30"
                  : "border-muted bg-muted/20 opacity-50 cursor-not-allowed"
              }`}
            >
              <method.icon
                className={`w-6 h-6 mb-2 ${
                  selectedMethod === method.id 
                    ? "text-primary" 
                    : method.id === "demo"
                    ? "text-green-500"
                    : "text-muted-foreground"
                }`}
              />
              <h4 className="font-semibold text-foreground text-sm">{method.name}</h4>
              <p className="text-xs text-muted-foreground">{method.description}</p>
              {!method.available && (
                <span className="text-xs text-destructive mt-1 block">Coming soon</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Payment Info */}
      {selectedMethod === "demo" && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-foreground">Demo Mode</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            This is a test payment. Click the button below to simulate a successful payment
            and see the full ticket confirmation flow.
          </p>
          <div className="flex justify-between text-sm pt-2 border-t border-green-500/20">
            <span className="text-muted-foreground">Amount (simulated)</span>
            <span className="font-semibold gold-text">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* MoMo Payment Info */}
      {selectedMethod === "momo" && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">MTN MoMo Payment</h4>
            <span className="text-xs text-muted-foreground font-mono">{txRef}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You will receive payment instructions via SMS/email after clicking the button below.
            Our team will confirm your payment within 24 hours.
          </p>
          <div className="flex justify-between text-sm pt-2 border-t border-primary/10">
            <span className="text-muted-foreground">Amount to pay</span>
            <span className="font-semibold gold-text">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Bank Transfer Info */}
      {selectedMethod === "bank" && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 space-y-3">
          <h4 className="font-semibold text-foreground">Bank Transfer</h4>
          <p className="text-sm text-muted-foreground">
            Bank account details will be sent to your email after you submit.
            Please include the reference number in your transfer.
          </p>
          <div className="flex justify-between text-sm pt-2 border-t border-primary/10">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono text-foreground">{txRef}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount to pay</span>
            <span className="font-semibold gold-text">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Proceed Button */}
      <Button
        variant={selectedMethod === "demo" ? "default" : "gold"}
        size="lg"
        className={`w-full ${
          selectedMethod === "demo" && customerInfo.name && customerInfo.email && customerInfo.phone
            ? "bg-green-500 hover:bg-green-600" 
            : ""
        }`}
        onClick={onProceed}
        disabled={
          !selectedMethod ||
          !customerInfo.name ||
          !customerInfo.email ||
          !customerInfo.phone ||
          isProcessing
        }
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : !customerInfo.name || !customerInfo.email || !customerInfo.phone ? (
          "Fill in your details above"
        ) : !selectedMethod ? (
          "Select a payment method"
        ) : selectedMethod === "demo" ? (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Complete Demo Payment
          </>
        ) : flutterwaveReady && selectedMethod === "card" ? (
          "Pay Now"
        ) : (
          "Submit Order"
        )}
      </Button>

      {selectedMethod && selectedMethod !== "demo" && (
        <p className="text-xs text-center text-muted-foreground">
          {selectedMethod === "momo" || selectedMethod === "bank"
            ? "You'll receive payment details via email. Payment confirmation within 24 hours."
            : "Secure payment powered by Flutterwave."}
        </p>
      )}
    </div>
  );
}

