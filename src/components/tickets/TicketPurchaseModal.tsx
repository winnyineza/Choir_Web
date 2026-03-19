import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, MapPin, Tag, X, CheckCircle } from "lucide-react";
import { TicketSelector } from "./TicketSelector";
import { OrderSummary, calculateOrderTotal } from "./OrderSummary";
import { PaymentStep, type PaymentMethod } from "./PaymentStep";
import { ProcessingPayment } from "./ProcessingPayment";
import { TicketConfirmation } from "./TicketConfirmation";
import { generateTxRef, isFlutterwaveConfigured, FLUTTERWAVE_PUBLIC_KEY, formatCurrency } from "@/lib/flutterwave";
import { createOrder, confirmOrder, getOrderById, type TicketTier, type TicketOrder } from "@/lib/ticketService";
import { validatePromoCode, redeemPromoCode, type PromoValidation } from "@/lib/promoService";
import { sendTicketConfirmationEmail } from "@/lib/ticketEmailService";
import { useToast } from "@/hooks/use-toast";
import { getMomoFeatureFlag, getRwandaNetwork, isValidMtnRwandaMsisdn } from "@/lib/momo";
import { startMomoCollection, waitForMomoPayment } from "@/lib/momoPaymentService";

export interface TicketEvent {
  id: string | number; // Support both for backwards compatibility
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  tickets: TicketTier[];
}

interface TicketPurchaseModalProps {
  event: TicketEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

type Step = "select" | "payment" | "processing" | "confirmation";

export function TicketPurchaseModal({
  event,
  isOpen,
  onClose,
}: TicketPurchaseModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [txRef, setTxRef] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<TicketOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState<PromoValidation | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  const { toast } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setSelectedTickets({});
      setPaymentMethod(null);
      setCustomerInfo({ name: "", email: "", phone: "" });
      setTxRef(generateTxRef());
      setConfirmedOrder(null);
      setIsProcessing(false);
      setPromoCode("");
      setPromoValidation(null);
    }
  }, [isOpen]);

  if (!event) return null;

  const { subtotal, serviceFee, total: baseTotal, ticketCount } = calculateOrderTotal(
    event.tickets,
    selectedTickets
  );
  
  // Calculate discount
  const discount = promoValidation?.valid ? promoValidation.discount : 0;
  const total = Math.max(serviceFee, baseTotal - discount);

  const handleQuantityChange = (tierId: string, quantity: number) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [tierId]: quantity,
    }));
    // Reset promo validation when tickets change
    if (promoValidation) {
      setPromoValidation(null);
    }
  };
  
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsValidatingPromo(true);
    try {
      const validation = await validatePromoCode(
        promoCode.trim(),
        subtotal,
        String(event.id)
      );
      setPromoValidation(validation);

      if (validation.valid) {
        toast({
          title: "Promo Code Applied!",
          description: validation.message,
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: validation.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsValidatingPromo(false);
    }
  };
  
  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoValidation(null);
  };

  const handleProceedToPayment = () => {
    if (ticketCount === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep("payment");
  };

  const handleConfirmedOrderSuccess = async (order: TicketOrder, successMessage: string) => {
    if (promoValidation?.valid && promoCode) {
      await redeemPromoCode(promoCode);
    }

    window.dispatchEvent(new Event("eventsUpdated"));

    sendTicketConfirmationEmail(order).then((result) => {
      if (result.success) {
        toast({
          title: "Ticket sent to your email! 📧",
          description: `Confirmation sent to ${order.customer.email}`,
        });
      }
    });

    setConfirmedOrder(order);
    setStep("confirmation");
    toast({
      title: "Payment Successful! 🎉",
      description: successMessage,
    });
  };

  const handlePayment = async () => {
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all your details.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Select payment method",
        description: "Please choose a payment method.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "mtn" && !getMomoFeatureFlag()) {
      toast({
        title: "MTN MoMo unavailable",
        description: "Direct MTN payments are not enabled right now.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "mtn" && !isValidMtnRwandaMsisdn(customerInfo.phone)) {
      toast({
        title: "Invalid MTN number",
        description: "Enter a valid MTN Rwanda number before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "airtel" && getRwandaNetwork(customerInfo.phone) !== "airtel") {
      toast({
        title: "Invalid Airtel number",
        description: "Enter a valid Airtel Rwanda number before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Create the order
    const tickets = event.tickets
      .filter((tier) => selectedTickets[tier.id] > 0)
      .map((tier) => ({
        tierId: tier.id,
        tierName: tier.name,
        quantity: selectedTickets[tier.id],
        priceEach: tier.price,
      }));

    const orderResult = await createOrder({
      txRef,
      eventId: String(event.id),
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      eventImage: event.image,
      tickets,
      subtotal,
      discount,
      promoCode: promoValidation?.valid ? promoCode : undefined,
      customer: customerInfo,
      paymentMethod: paymentMethod === "demo" ? "mtn" : paymentMethod,
    });
    
    if (!orderResult.success || !orderResult.order) {
      setIsProcessing(false);
      toast({
        title: "Unable to create order",
        description: orderResult.error || "Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    const order = orderResult.order;

    // Demo Payment - Instant success
    if (paymentMethod === "demo") {
      setStep("processing");
      
      // Simulate processing delay for realistic feel
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Use the confirmOrder function which also reduces ticket availability
      const confirmed = await confirmOrder(order.id, `DEMO-${Date.now()}`);
      
      if (confirmed) {
        await handleConfirmedOrderSuccess(confirmed, "This is a test transaction. Your ticket is ready!");
      } else {
        toast({
          title: "Order confirmation failed",
          description: "Please contact support.",
          variant: "destructive",
        });
        setStep("payment");
      }
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === "mtn") {
      try {
        setStep("processing");
        const response = await startMomoCollection({
          amount: total,
          phone: customerInfo.phone,
          purpose: "ticket",
          reference: txRef,
          linkedRecordId: order.id,
          customer: {
            name: customerInfo.name,
            email: customerInfo.email,
          },
          metadata: {
            eventTitle: event.title,
            eventId: String(event.id),
            txRef,
            ticketCount,
          },
        });

        toast({
          title: "Approve on your phone",
          description: response.message || "An MTN prompt has been sent to your phone.",
        });

        const finalStatus = await waitForMomoPayment(response.payment.id);
        if (!finalStatus.success || finalStatus.payment.status !== "successful") {
          throw new Error(finalStatus.message || "The MTN MoMo payment was not completed");
        }

        const confirmedOrder = await getOrderById(order.id);
        if (!confirmedOrder || confirmedOrder.status !== "confirmed") {
          throw new Error("Payment succeeded but ticket confirmation could not be verified yet");
        }

        await handleConfirmedOrderSuccess(confirmedOrder, "Your tickets have been confirmed.");
      } catch (error: any) {
        toast({
          title: "MTN payment failed",
          description: error?.message || "The MTN MoMo payment was not completed.",
          variant: "destructive",
        });
        setStep("payment");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // If Flutterwave is configured and using Airtel or Card
    if (isFlutterwaveConfigured() && (paymentMethod === "card" || paymentMethod === "airtel")) {
      setStep("processing");
      
      // Load Flutterwave script if not already loaded
      if (!(window as any).FlutterwaveCheckout) {
        if (typeof document === "undefined" || !document.body) {
          console.warn("[TicketPurchaseModal] Flutterwave script injection skipped: document.body is unavailable");
          toast({
            title: "Payment Error",
            description: "Checkout could not be initialized. Please refresh and try again.",
            variant: "destructive",
          });
          setStep("payment");
          setIsProcessing(false);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.flutterwave.com/v3.js";
        script.async = true;
        script.onload = () => initFlutterwavePayment(order);
        document.body.appendChild(script);
      } else {
        initFlutterwavePayment(order);
      }
    } else {
      // Manual confirmation flow (Bank)
      setStep("processing");
      
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // For manual payments, order stays pending until admin confirms
      setConfirmedOrder({
        ...order,
        status: "pending" as const,
      });
      setStep("confirmation");
      setIsProcessing(false);

      toast({
        title: "Order Submitted! 📝",
        description: "You'll receive payment instructions via email. We'll confirm within 24 hours.",
      });
    }
  };

  const initFlutterwavePayment = (order: TicketOrder) => {
    const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
    
    if (!FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Could not load payment system. Please try again.",
        variant: "destructive",
      });
      setStep("payment");
      setIsProcessing(false);
      return;
    }

    FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: total,
      currency: "RWF",
      payment_options: paymentMethod === "airtel" ? "mobilemoneyrwanda" : "card",
      customer: {
        email: customerInfo.email,
        phone_number: customerInfo.phone,
        name: customerInfo.name,
      },
      customizations: {
        title: "Serenades of Praise",
        description: `Tickets for ${event.title}`,
        logo: "https://lovable.dev/opengraph-image-p98pqg.png",
      },
      callback: async (response: any) => {
        if (response.status === "successful") {
          // Use confirmOrder to update status and reduce availability
          const confirmed = await confirmOrder(order.id, response.transaction_id?.toString());
          
          if (confirmed) {
            await handleConfirmedOrderSuccess(confirmed, "Your tickets have been confirmed.");
          }
        } else {
          toast({
            title: "Payment Failed",
            description: "The payment was not completed. Please try again.",
            variant: "destructive",
          });
          setStep("payment");
        }
        setIsProcessing(false);
      },
      onclose: () => {
        if (step === "processing") {
          setStep("payment");
          setIsProcessing(false);
        }
      },
    });
  };

  const handleClose = () => {
    if (step === "processing") {
      toast({
        title: "Payment in progress",
        description: "Please wait for the payment to complete.",
        variant: "destructive",
      });
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-primary/20">
        {step !== "processing" && step !== "confirmation" ? (
          <DialogHeader>
            <div className="flex items-center justify-between">
              {step === "payment" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep("select")}
                  className="mr-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <DialogTitle className="font-display text-xl flex-1">
                {step === "select" ? "Get Tickets" : "Complete Payment"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm">
              {step === "select" ? "Select your tickets and proceed to payment" : "Complete your secure payment"}
            </DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogTitle className="sr-only">
              {step === "processing" ? "Processing Payment" : "Booking Confirmed"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {step === "processing" ? "Your payment is being processed" : "Your booking has been confirmed"}
            </DialogDescription>
          </>
        )}

        {/* Event Summary - Show on select and payment steps */}
        {(step === "select" || step === "payment") && (
          <div className="flex gap-4 p-4 rounded-xl bg-secondary/30 border border-primary/10 mb-4">
            <img
              src={event.image}
              alt={event.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="w-4 h-4 text-primary" />
                {event.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {event.location}
              </div>
            </div>
          </div>
        )}

        {/* Step: Select Tickets */}
        {step === "select" && (
          <div className="space-y-6">
            <TicketSelector
              tiers={event.tickets}
              selectedTickets={selectedTickets}
              onQuantityChange={handleQuantityChange}
            />

            <OrderSummary
              tiers={event.tickets}
              selectedTickets={selectedTickets}
            />
            
            {/* Promo Code Section */}
            {ticketCount > 0 && subtotal > 0 && (
              <div className="p-4 rounded-xl bg-secondary/30 border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Have a promo code?</span>
                </div>
                
                {promoValidation?.valid ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <span className="text-sm font-medium text-green-500">{promoCode}</span>
                        <p className="text-xs text-muted-foreground">{promoValidation.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-500">
                        -{formatCurrency(discount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={handleRemovePromo}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 bg-background border-primary/20 font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || isValidatingPromo}
                    >
                      {isValidatingPromo ? "..." : "Apply"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Updated Total with Discount */}
            {discount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 text-green-500">
                <span className="text-sm font-medium">Discount Applied</span>
                <span className="font-bold">-{formatCurrency(discount)}</span>
              </div>
            )}

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={handleProceedToPayment}
              disabled={ticketCount === 0}
            >
              Continue to Payment • {formatCurrency(total)}
            </Button>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <PaymentStep
            total={total}
            txRef={txRef}
            customerInfo={customerInfo}
            onCustomerInfoChange={setCustomerInfo}
            selectedMethod={paymentMethod}
            onMethodSelect={setPaymentMethod}
            onProceed={handlePayment}
            isProcessing={isProcessing}
          />
        )}

        {/* Step: Processing */}
        {step === "processing" && paymentMethod && (
          <ProcessingPayment method={paymentMethod} amount={total} txRef={txRef} />
        )}

        {/* Step: Confirmation */}
        {step === "confirmation" && confirmedOrder && (
          <TicketConfirmation order={confirmedOrder} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
