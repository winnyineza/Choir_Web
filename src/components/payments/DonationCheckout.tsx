import { useMemo, useRef, useState, type ReactNode } from "react";
import { closePaymentModal, useFlutterwave } from "flutterwave-react-v3";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2, Lock, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createDonation } from "@/lib/donationService";
import { formatCurrency } from "@/lib/flutterwave";
import { getMomoFeatureFlag, isValidMtnRwandaMsisdn } from "@/lib/momo";
import { startMomoCollection, waitForMomoPayment } from "@/lib/momoPaymentService";
import { EASE_OUT } from "@/lib/motionPresets";
import { cn } from "@/lib/utils";

type DonationMethod = "mtn" | "card";

interface DonationCheckoutProps {
  onSuccess?: () => void;
  /** "full" places the live summary beside the form; "compact" stacks everything for narrow containers. */
  layout?: "full" | "compact";
}

const FLUTTERWAVE_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

function buildTxRef(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Small brand marks so each method is recognisable at a glance without shouting. */
function MethodMark({ method }: { method: DonationMethod }) {
  if (method === "mtn") {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-[#FFCB05] text-[0.6rem] font-black tracking-tight text-[#004F71]">
        MoMo
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center gap-0.5 rounded-[3px] bg-white ring-1 ring-black/5">
      <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
      <span className="-ml-2 h-3.5 w-3.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
    </span>
  );
}

function Step({ index, title, hint, children }: { index: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-foreground/10 pt-8">
      <div className="mb-6 flex items-baseline gap-5">
        <span className="font-display text-2xl italic text-primary tabular-nums">{index}</span>
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-foreground leading-none">{title}</h3>
          {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="md:pl-12">{children}</div>
    </section>
  );
}

function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center justify-between text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
      {optional && <span className="normal-case tracking-normal text-muted-foreground/70">Optional</span>}
    </label>
  );
}

const fieldClass =
  "h-12 rounded-[3px] border-foreground/12 bg-card text-base shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0";

export function DonationCheckout({ onSuccess, layout = "full" }: DonationCheckoutProps) {
  const momoEnabled = getMomoFeatureFlag();
  const [amount, setAmount] = useState("10000");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<DonationMethod>(momoEnabled ? "mtn" : "card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingPhone, setAwaitingPhone] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const checkoutRef = useRef<HTMLDivElement>(null);
  const checkoutInView = useInView(checkoutRef, { margin: "-15% 0px -15% 0px" });

  const parsedAmount = Number(amount);
  const hasAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const methods = useMemo(
    () =>
      [
        momoEnabled && { id: "mtn" as const, title: "MTN Mobile Money", detail: "Approve the request on your phone" },
        { id: "card" as const, title: "Visa / Mastercard", detail: "Secure card checkout via Flutterwave" },
      ].filter(Boolean) as { id: DonationMethod; title: string; detail: string }[],
    [momoEnabled]
  );
  const methodTitle = methods.find((m) => m.id === method)?.title ?? "";

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
    if (method === "card" && !FLUTTERWAVE_PUBLIC_KEY) {
      throw new Error("Flutterwave is not configured yet");
    }
  };

  const markDonationSuccess = (nextMessage: string) => {
    setSuccessMessage(nextMessage);
    setIsProcessing(false);
    setAwaitingPhone(false);
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

        setAwaitingPhone(true);
        toast({
          title: "Approve on your phone",
          description: response.message || "Check your MTN phone for the payment prompt.",
        });

        const finalStatus = await waitForMomoPayment(response.payment.id);
        if (!finalStatus.success || finalStatus.payment.status !== "successful") {
          throw new Error(finalStatus.message || "The MTN MoMo payment was not completed");
        }

        markDonationSuccess("Your MTN MoMo gift was received.");
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

            markDonationSuccess("Your card gift was received.");
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
      setAwaitingPhone(false);
      toast({
        title: "Unable to continue",
        description: error?.message || "Please check your details and try again.",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setSuccessMessage("");
    setAmount("10000");
    setMessage("");
  };

  /* ---------- Thank-you state ---------- */
  if (successMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        className="border border-primary/30 bg-card px-6 py-16 text-center md:px-16"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/50">
          <Check className="h-7 w-7 text-primary" strokeWidth={1.4} />
        </span>
        <p className="mt-8 text-[0.62rem] uppercase tracking-luxe text-primary">Gift received</p>
        <h3 className="mt-4 font-display text-4xl md:text-5xl text-foreground">
          Thank you, <span className="italic text-primary">{name.split(" ")[0] || "friend"}</span>.
        </h3>
        <p className="mx-auto mt-5 max-w-md text-muted-foreground leading-relaxed">
          {successMessage} {hasAmount && <>Your {formatCurrency(parsedAmount)} will help the choir keep singing.</>}
        </p>
        <p className="mt-8 font-display italic text-lg text-foreground/80">“God loves a cheerful giver.” · 2 Corinthians 9:7</p>
        <button type="button" onClick={reset} className="link-luxe mt-10">
          Give again
          <span className="link-luxe-rule" />
        </button>
      </motion.div>
    );
  }

  const payLabel = hasAmount ? `Give ${formatCurrency(parsedAmount)}` : "Give now";

  /* ---------- Live summary ---------- */
  const summary = (
    <div className="border border-foreground/10 bg-card">
      <div className="p-6 md:p-8">
        <p className="text-[0.62rem] uppercase tracking-luxe text-primary">Your gift</p>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={hasAmount ? parsedAmount : "none"}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="mt-3 font-display text-5xl text-foreground tabular-nums"
          >
            {hasAmount ? parsedAmount.toLocaleString("en-US") : "0"}
            <span className="ml-2 font-body text-sm tracking-[0.2em] text-muted-foreground">RWF</span>
          </motion.p>
        </AnimatePresence>

        <dl className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10 text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Method</dt>
            <dd className="text-right text-foreground">{methodTitle}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">From</dt>
            <dd className="truncate text-right text-foreground">{name.trim() || "—"}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing}
          className="group mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-[2px] bg-primary text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18)] transition-colors duration-500 hover:bg-gold-light disabled:opacity-60"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {awaitingPhone ? "Waiting for approval" : "Processing"}
            </>
          ) : (
            <>
              {payLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </>
          )}
        </button>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {method === "mtn"
            ? "We'll send an approval prompt straight to your MTN line. Keep this page open until it's confirmed."
            : "A secure card checkout will open in Flutterwave."}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-px border-t border-foreground/10 bg-foreground/10 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {[
          { icon: ShieldCheck, text: "Secure checkout" },
          { icon: Lock, text: "Encrypted details" },
          { icon: Sparkles, text: "Goes to the ministry" },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2 bg-card px-4 py-3">
            <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );

  /* ---------- Form ---------- */
  const form = (
    <div className="space-y-12">
      <Step index="01" title="Your gift" hint="Choose an amount or enter your own.">
        <FieldLabel htmlFor="donation-amount">Amount</FieldLabel>
        <div className="group flex items-baseline gap-3 border-b border-foreground/20 pb-2 transition-colors focus-within:border-primary">
          <span className="text-sm tracking-[0.2em] text-muted-foreground">RWF</span>
          <input
            id="donation-amount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={amount ? Number(amount).toLocaleString("en-US") : ""}
            onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="0"
            className="w-full min-w-0 bg-transparent font-display text-5xl md:text-6xl text-foreground tabular-nums outline-none placeholder:text-muted-foreground/40"
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => {
            const active = parsedAmount === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                aria-pressed={active}
                className={cn(
                  "h-10 rounded-full border px-5 text-sm tabular-nums transition-colors duration-500",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground/15 text-foreground/80 hover:border-primary/60 hover:text-primary"
                )}
              >
                {value.toLocaleString("en-US")}
              </button>
            );
          })}
        </div>

      </Step>

      <Step index="02" title="About you" hint="No account needed. We use these details only for your receipt and thanks.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="donation-name">Full name</FieldLabel>
            <Input id="donation-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={fieldClass} autoComplete="name" />
          </div>
          <div>
            <FieldLabel htmlFor="donation-email">Email</FieldLabel>
            <Input id="donation-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={fieldClass} autoComplete="email" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="donation-message" optional>A word for the choir</FieldLabel>
            <Textarea
              id="donation-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A prayer, an encouragement, or what moved you to give"
              className="rounded-[3px] border-foreground/12 bg-card text-base shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </Step>

      <Step index="03" title="Payment" hint="Choose how you'd like to give.">
        <div className="space-y-2" role="radiogroup" aria-label="Payment method">
          {methods.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-[3px] border px-4 py-3.5 text-left transition-colors duration-500",
                  active ? "border-primary/60 bg-primary/[0.06]" : "border-foreground/10 hover:border-foreground/25"
                )}
              >
                <MethodMark method={m.id} />
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">{m.title}</span>
                  <span className="block text-xs text-muted-foreground">{m.detail}</span>
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                    active ? "border-primary" : "border-foreground/25"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full bg-primary transition-transform duration-500", active ? "scale-100" : "scale-0")} />
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {method !== "card" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="pt-6">
                <FieldLabel htmlFor="donation-phone">MTN number</FieldLabel>
                <div className="flex">
                  <span className="flex h-12 items-center gap-2 rounded-l-[3px] border border-r-0 border-foreground/12 bg-muted px-3 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4" strokeWidth={1.5} />
                    +250
                  </span>
                  <Input
                    id="donation-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="078 xxx xxxx"
                    className={cn(fieldClass, "rounded-l-none")}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MoMo approval moment: a clear "look at your phone" state instead of a silent spinner */}
        <AnimatePresence>
          {awaitingPhone && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="mt-6 flex items-center gap-4 border border-primary/30 bg-primary/[0.06] p-5"
              role="status"
            >
              <span className="relative flex h-11 w-11 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <Smartphone className="relative h-5 w-5 text-primary" strokeWidth={1.5} />
              </span>
              <p className="text-sm leading-relaxed text-foreground/85">
                Check your phone and enter your MoMo PIN to approve {hasAmount ? formatCurrency(parsedAmount) : "the gift"}.
                This page will update on its own.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Step>
    </div>
  );

  if (layout === "compact") {
    return (
      <div className="space-y-12">
        {form}
        {summary}
      </div>
    );
  }

  return (
    <>
      <div ref={checkoutRef} className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">{form}</div>
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">{summary}</div>
        </aside>
      </div>

      {/* Mobile: while the form is on screen, the total and the action stay within thumb's reach */}
      <div
        aria-hidden={!checkoutInView}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] lg:hidden",
          checkoutInView ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div className="leading-tight">
            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">You give</p>
            <p className="font-display text-2xl text-foreground tabular-nums">{hasAmount ? formatCurrency(parsedAmount) : "—"}</p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex h-12 items-center gap-2 rounded-[2px] bg-primary px-6 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-60"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Give <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </>
  );
}
