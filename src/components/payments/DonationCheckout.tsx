import { useMemo, useState } from "react";
import { closePaymentModal, useFlutterwave } from "flutterwave-react-v3";
import { Loader2, CheckCircle2, CreditCard, Smartphone, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createDonation } from "@/lib/donationService";
import { formatCurrency } from "@/lib/flutterwave";
import { getMomoFeatureFlag, getRwandaNetwork, isValidMtnRwandaMsisdn } from "@/lib/momo";
import { startMomoCollection, waitForMomoPayment } from "@/lib/momoPaymentService";

type DonationMethod = "mtn" | "airtel" | "card";

interface DonationCheckoutProps {
  onSuccess?: () => void;
}

const FLUTTERWAVE_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

function buildTxRef(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function DonationCheckout({ onSuccess }: DonationCheckoutProps) {
  const [amount, setAmount] = useState("5000");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<DonationMethod>(getMomoFeatureFlag() ? "mtn" : "card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();

  const parsedAmount = Number(amount);
  const flutterConfig = useMemo(() => ({
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: buildTxRef("DON"),
    amount: parsedAmount || 0,
    currency: "RWF",
    payment_options: method === "card" ? "card" : "mobilemoneyrwanda",
    customer: {
      email,
      phone_number: phone,
      name: name || "Anonymous Donor",
    },
    customizations: {
      title: "Serenades of Praise",
      description: "Support our ministry",
      logo: "https://serenadesofpraise.netlify.app/LogoTSC.jpg",
    },
  }), [email, method, name, parsedAmount, phone]);

  const handleFlutterPayment = useFlutterwave(flutterConfig);

  const validate = () => {
    if (!parsedAmount || parsedAmount < 100) {
      throw new Error("Enter an amount of at least 100 RWF");
    }
    if (!name.trim()) {
      throw new Error("Your name is required");
    }
    if (!email.trim()) {
      throw new Error("Your email is required");
    }
    if (method === "mtn" && !isValidMtnRwandaMsisdn(phone)) {
      throw new Error("Enter a valid MTN Rwanda number");
    }
    if (method === "airtel") {
      if (!phone.trim()) throw new Error("Your Airtel number is required");
      if (getRwandaNetwork(phone) !== "airtel") {
        throw new Error("Enter a valid Airtel Rwanda number");
      }
    }
    if ((method === "airtel" || method === "card") && !FLUTTERWAVE_PUBLIC_KEY) {
      throw new Error("Flutterwave is not configured yet");
    }
  };

  const markDonationSuccess = (nextMessage: string) => {
    setSuccessMessage(nextMessage);
    setIsProcessing(false);
    onSuccess?.();
  };

  const handleSubmit = async () => {
    try {
      validate();
      setIsProcessing(true);

      if (method === "mtn") {
        const response = await startMomoCollection({
          amount: parsedAmount,
          phone,
          purpose: "donation",
          reference: buildTxRef("DON"),
          customer: {
            name,
            email,
          },
          metadata: {
            message,
          },
        });

        toast({
          title: "Approve on your phone",
          description: response.message || "Check your MTN phone for the payment prompt.",
        });

        const finalStatus = await waitForMomoPayment(response.payment.id);
        if (!finalStatus.success || finalStatus.payment.status !== "successful") {
          throw new Error(finalStatus.message || "The MTN MoMo payment was not completed");
        }

        markDonationSuccess("Your MTN MoMo donation was received successfully.");
        return;
      }

      handleFlutterPayment({
        callback: async (response) => {
          closePaymentModal();

          if (response.status !== "successful") {
            setIsProcessing(false);
            toast({
              title: "Payment failed",
              description: "Your donation was not completed. Please try again.",
              variant: "destructive",
            });
            return;
          }

          try {
            await createDonation({
              donorName: name,
              donorEmail: email,
              amount: parsedAmount,
              method,
              reference: response.tx_ref,
              message,
              date: new Date().toISOString().split("T")[0],
              recordedBy: "Flutterwave",
            });

            markDonationSuccess(
              method === "card"
                ? "Your card donation was received successfully."
                : "Your Airtel Money donation was received successfully.",
            );
          } catch (error: any) {
            setIsProcessing(false);
            toast({
              title: "Donation recorded payment but saving failed",
              description: error?.message || "Please contact the choir team with your payment reference.",
              variant: "destructive",
            });
          }
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (error: any) {
      setIsProcessing(false);
      toast({
        title: "Unable to continue",
        description: error?.message || "Please check your details and try again.",
        variant: "destructive",
      });
    }
  };

  if (successMessage) {
    return (
      <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">Thank You</h3>
        <p className="mt-2 text-sm text-muted-foreground">{successMessage}</p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setSuccessMessage("");
            setAmount("5000");
            setMessage("");
          }}
        >
          Make another donation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {getMomoFeatureFlag() && (
          <button
            type="button"
            onClick={() => setMethod("mtn")}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              method === "mtn" ? "border-yellow-500 bg-yellow-500/10" : "border-primary/20 bg-secondary/30"
            }`}
          >
            <Smartphone className="mb-2 h-5 w-5 text-yellow-500" />
            <p className="font-semibold text-foreground">MTN MoMo</p>
            <p className="text-xs text-muted-foreground">Direct MTN request to pay</p>
          </button>
        )}
        <button
          type="button"
          onClick={() => setMethod("airtel")}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            method === "airtel" ? "border-red-500 bg-red-500/10" : "border-primary/20 bg-secondary/30"
          }`}
        >
          <Smartphone className="mb-2 h-5 w-5 text-red-500" />
          <p className="font-semibold text-foreground">Airtel Money</p>
          <p className="text-xs text-muted-foreground">Handled through Flutterwave</p>
        </button>
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            method === "card" ? "border-blue-500 bg-blue-500/10" : "border-primary/20 bg-secondary/30"
          }`}
        >
          <CreditCard className="mb-2 h-5 w-5 text-blue-500" />
          <p className="font-semibold text-foreground">Card</p>
          <p className="text-xs text-muted-foreground">Visa and Mastercard</p>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="donation-amount">Amount (RWF)</Label>
          <Input
            id="donation-amount"
            type="number"
            value={amount}
            min="100"
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="donation-name">Full name</Label>
          <Input
            id="donation-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="donation-email">Email address</Label>
          <Input
            id="donation-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {method !== "card" && (
          <div className="space-y-2">
            <Label htmlFor="donation-phone">
              {method === "mtn" ? "MTN phone number" : "Airtel phone number"}
            </Label>
            <Input
              id="donation-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="078xxxxxxx"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="donation-message" className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          Message
        </Label>
        <Textarea
          id="donation-message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Share what you'd like this gift to support"
        />
      </div>

      <div className="rounded-2xl border border-primary/15 bg-secondary/20 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Donation total</span>
          <span className="font-semibold text-foreground">
            {Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatCurrency(parsedAmount) : "0 RWF"}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {method === "mtn"
            ? "We will send an approval prompt directly to your MTN MoMo line."
            : method === "airtel"
            ? "Airtel Money checkout will open in Flutterwave."
            : "Card checkout will open in Flutterwave."}
        </p>
      </div>

      <Button className="h-12 w-full" variant="gold" onClick={handleSubmit} disabled={isProcessing}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          `Pay ${Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatCurrency(parsedAmount) : "now"}`
        )}
      </Button>
    </div>
  );
}
