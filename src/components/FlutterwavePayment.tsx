import { useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, CreditCard, Loader2, CheckCircle, Heart } from "lucide-react";

interface FlutterwavePaymentProps {
  onSuccess?: (response: any) => void;
  onClose?: () => void;
}

export function FlutterwavePayment({ onSuccess, onClose }: FlutterwavePaymentProps) {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mobilemoneyrwanda" | "card">("mobilemoneyrwanda");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();

  const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

  const config = {
    public_key: publicKey,
    tx_ref: `SOP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: parseFloat(amount) || 0,
    currency: "RWF",
    payment_options: paymentMethod,
    customer: {
      email: email || "donor@serenadeofpraise.org",
      phone_number: phone,
      name: name || "Anonymous Donor",
    },
    customizations: {
      title: "Serenades of Praise",
      description: "Support Our Ministry",
      logo: "https://serenadesofpraise.netlify.app/logo.png",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    if (!amount || parseFloat(amount) < 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (minimum 100 RWF).",
        variant: "destructive",
      });
      return;
    }

    if (!publicKey) {
      toast({
        title: "Payment Not Configured",
        description: "Payment integration is being set up. Please use manual transfer for now.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "mobilemoneyrwanda" && !phone) {
      toast({
        title: "Phone Required",
        description: "Please enter your MTN MoMo phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    handleFlutterPayment({
      callback: (response) => {
        console.log("Payment response:", response);
        setIsProcessing(false);
        
        if (response.status === "successful") {
          setPaymentSuccess(true);
          toast({
            title: "Payment Successful! 🎉",
            description: "Thank you for your generous donation. God bless you!",
          });
          onSuccess?.(response);
        } else {
          toast({
            title: "Payment Failed",
            description: "The payment was not completed. Please try again.",
            variant: "destructive",
          });
        }
        closePaymentModal();
      },
      onClose: () => {
        setIsProcessing(false);
        onClose?.();
      },
    });
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          Thank You!
        </h3>
        <p className="text-muted-foreground mb-4">
          Your donation has been received. May God bless you abundantly!
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setPaymentSuccess(false);
            setAmount("");
            setEmail("");
            setName("");
            setPhone("");
          }}
        >
          Make Another Donation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Amount Selection */}
      <div>
        <Label htmlFor="amount">Donation Amount (RWF)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 bg-secondary border-primary/20 text-lg"
          min="100"
        />
        <div className="flex gap-2 flex-wrap mt-3">
          {[1000, 5000, 10000, 25000, 50000, 100000].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                amount === preset.toString()
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-primary/20"
              }`}
            >
              {preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <Label>Payment Method</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => setPaymentMethod("mobilemoneyrwanda")}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              paymentMethod === "mobilemoneyrwanda"
                ? "border-primary bg-primary/10"
                : "border-primary/20 hover:border-primary/40"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium">MTN MoMo</span>
          </button>
          <button
            onClick={() => setPaymentMethod("card")}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              paymentMethod === "card"
                ? "border-primary bg-primary/10"
                : "border-primary/20 hover:border-primary/40"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium">Card</span>
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Your Name (Optional)</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-secondary border-primary/20"
          />
        </div>
        <div>
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 bg-secondary border-primary/20"
          />
        </div>
      </div>

      {/* Phone for MoMo */}
      {paymentMethod === "mobilemoneyrwanda" && (
        <div>
          <Label htmlFor="phone">MTN MoMo Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="078XXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 bg-secondary border-primary/20"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            You'll receive a prompt on your phone to confirm the payment
          </p>
        </div>
      )}

      {/* Amount Summary */}
      {amount && parseFloat(amount) >= 100 && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Donation</span>
            <span className="font-display text-2xl font-bold gold-text">
              {parseFloat(amount).toLocaleString()} RWF
            </span>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <Button
        variant="gold"
        size="lg"
        className="w-full"
        onClick={handlePayment}
        disabled={isProcessing || !amount}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Heart className="w-5 h-5 mr-2" />
            Donate {amount ? `${parseFloat(amount).toLocaleString()} RWF` : "Now"}
          </>
        )}
      </Button>

      {/* Security Note */}
      <p className="text-xs text-center text-muted-foreground">
        🔒 Secure payment powered by Flutterwave. Your information is encrypted.
      </p>
    </div>
  );
}
