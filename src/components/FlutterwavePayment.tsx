import { useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";

interface FlutterwavePaymentProps {
  onSuccess?: (response: any) => void;
  onClose?: () => void;
}

// Payment method icons
const MtnIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-[#FFCC00] flex items-center justify-center shadow-sm">
    <span className="text-black font-bold text-xs">MTN</span>
  </div>
);

const VisaIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-[#1A1F71] flex items-center justify-center shadow-sm">
    <span className="text-white font-bold text-[10px] italic">VISA</span>
  </div>
);

const MastercardIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#EB001B] to-[#F79E1B] flex items-center justify-center shadow-sm">
    <div className="flex -space-x-1">
      <div className="w-3 h-3 rounded-full bg-[#EB001B]"></div>
      <div className="w-3 h-3 rounded-full bg-[#F79E1B]"></div>
    </div>
  </div>
);

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

    if (paymentMethod === "card" && !email) {
      toast({
        title: "Email Required",
        description: "Please enter your email for card payment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    handleFlutterPayment({
      callback: (response) => {
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
      <div className="text-center py-10">
        <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          Thank You!
        </h3>
        <p className="text-muted-foreground mb-6">
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
      {/* Payment Method Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Select Payment Method</Label>
        <div className="grid grid-cols-2 gap-3">
          {/* MTN MoMo Option */}
          <button
            onClick={() => setPaymentMethod("mobilemoneyrwanda")}
            className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
              paymentMethod === "mobilemoneyrwanda"
                ? "border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20"
                : "border-border hover:border-yellow-500/50 bg-secondary/50"
            }`}
          >
            <MtnIcon />
            <div className="text-left">
              <p className="font-semibold text-sm">MTN MoMo</p>
              <p className="text-xs text-muted-foreground">Mobile Money</p>
            </div>
            {paymentMethod === "mobilemoneyrwanda" && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-black" />
              </div>
            )}
          </button>

          {/* Card Option */}
          <button
            onClick={() => setPaymentMethod("card")}
            className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
              paymentMethod === "card"
                ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                : "border-border hover:border-blue-500/50 bg-secondary/50"
            }`}
          >
            <div className="flex -space-x-1">
              <VisaIcon />
              <MastercardIcon />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Card</p>
              <p className="text-xs text-muted-foreground">Visa / Mastercard</p>
            </div>
            {paymentMethod === "card" && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Card Preview for Card Payment */}
      {paymentMethod === "card" && (
        <div className="relative h-44 rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black p-5 shadow-xl overflow-hidden">
          {/* Card Pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          {/* Card Content */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-400 to-yellow-600"></div>
              <div className="flex gap-1">
                <div className="w-6 h-6 rounded-full bg-red-500 opacity-80"></div>
                <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80 -ml-3"></div>
              </div>
            </div>
            
            <div>
              <p className="text-white/60 text-xs mb-1">Card Number</p>
              <p className="text-white font-mono text-lg tracking-wider">•••• •••• •••• ••••</p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/60 text-[10px]">CARD HOLDER</p>
                <p className="text-white text-sm font-medium">{name || "YOUR NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-[10px]">EXPIRES</p>
                <p className="text-white text-sm font-medium">••/••</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MoMo Visual for Mobile Money */}
      {paymentMethod === "mobilemoneyrwanda" && (
        <div className="relative h-44 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-5 shadow-xl overflow-hidden">
          {/* Pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="bg-black/20 rounded-lg px-3 py-1">
                <span className="text-black font-bold text-lg">MTN</span>
              </div>
              <span className="text-black/70 text-sm font-medium">Mobile Money</span>
            </div>
            
            <div>
              <p className="text-black/60 text-xs mb-1">Phone Number</p>
              <p className="text-black font-mono text-xl tracking-wider">
                {phone ? phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3") : "07XX XXX XXX"}
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-black/60 text-[10px]">ACCOUNT NAME</p>
                <p className="text-black text-sm font-medium">{name || "YOUR NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-black/60 text-[10px]">RWANDA</p>
                <p className="text-black text-sm font-bold">RWF</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div>
        <Label htmlFor="amount" className="text-sm font-medium">Amount (RWF)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5 bg-secondary border-primary/20 text-lg h-12"
          min="100"
        />
        <div className="flex gap-2 flex-wrap mt-3">
          {[1000, 5000, 10000, 25000, 50000].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                amount === preset.toString()
                  ? "bg-yellow-500 text-black shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-yellow-500/20"
              }`}
            >
              {preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Name Input */}
      <div>
        <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
        <Input
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 bg-secondary border-primary/20"
        />
      </div>

      {/* Conditional Fields */}
      {paymentMethod === "mobilemoneyrwanda" ? (
        <div>
          <Label htmlFor="phone" className="text-sm font-medium">MTN MoMo Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 bg-secondary border-primary/20"
            required
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            You'll receive a prompt on your phone to confirm
          </p>
        </div>
      ) : (
        <div>
          <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 bg-secondary border-primary/20"
            required
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Receipt will be sent to this email
          </p>
        </div>
      )}

      {/* Amount Summary */}
      {amount && parseFloat(amount) >= 100 && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Donation</span>
            <span className="font-display text-2xl font-bold text-yellow-500">
              {parseFloat(amount).toLocaleString()} RWF
            </span>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <Button
        variant="gold"
        size="lg"
        className="w-full h-14 text-base"
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
            {paymentMethod === "mobilemoneyrwanda" ? (
              <MtnIcon />
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            <span className="ml-2">
              Pay {amount ? `${parseFloat(amount).toLocaleString()} RWF` : "Now"}
            </span>
          </>
        )}
      </Button>
    </div>
  );
}
