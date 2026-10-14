import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowRight, Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { DonationCheckout } from "@/components/payments/DonationCheckout";
import { PageHero, SectionHead } from "@/components/editorial";
import { cn } from "@/lib/utils";
import supportHero from "@/assets/choir-group2.jpg";

const impactAreas = [
  {
    title: "Music production",
    description: "Recording albums and films that carry the gospel further than our voices can reach.",
  },
  {
    title: "Ministry trips",
    description: "Travel, lodging and logistics to sing at churches and gatherings across Rwanda.",
  },
  {
    title: "Digital ministry",
    description: "Streaming, video and an online home that meets people where they are.",
  },
  {
    title: "Equipment & training",
    description: "Instruments, sound systems and vocal coaching that honour God with excellence.",
  },
];

const fieldClass =
  "h-12 rounded-[3px] border-foreground/12 bg-card text-base shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0";

const EASE = [0.19, 1, 0.22, 1] as const;

function CopyRow({
  label,
  value,
  display,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  display?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3">
        <span className="font-display text-xl text-foreground tabular-nums tracking-wide select-all">{display ?? value}</span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 text-muted-foreground transition-colors duration-500 hover:border-primary hover:text-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
        </button>
      </span>
    </div>
  );
}

export default function Support() {
  useDocumentTitle("Support Our Ministry");
  const [paymentMode, setPaymentMode] = useState<"online" | "manual">("online");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [messageSubmitted, setMessageSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingMessage(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmittingMessage(false);
    setMessageSubmitted(true);

    toast({
      title: "Message sent",
      description: "Thank you for your encouraging words. God bless you!",
    });

    setTimeout(() => {
      setMessageSubmitted(false);
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow="Partner with us"
          title={<>Support the <span className="italic text-primary">ministry</span></>}
          lede="Your generosity carries the gospel in song to more hearts across Rwanda and beyond."
          image={supportHero}
          imageAlt="The choir in the hills of Rwanda"
        >
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            <a
              href="#give"
              onClick={() => setPaymentMode("online")}
              className="link-luxe !text-[hsl(40_30%_91%/0.9)] hover:!text-[hsl(40_45%_70%)]"
            >
              Give online
              <ArrowDown className="h-3.5 w-3.5" />
            </a>
            <a
              href="#give"
              onClick={() => setPaymentMode("manual")}
              className="link-luxe !text-[hsl(40_30%_91%/0.9)] hover:!text-[hsl(40_45%_70%)]"
            >
              Transfer directly
              <span className="link-luxe-rule" />
            </a>
          </div>
        </PageHero>

        {/* Where the gift goes */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 lg:px-10">
            <SectionHead
              align="split"
              index="I"
              eyebrow="Your impact"
              title={<>Where your gift <span className="italic text-primary">goes.</span></>}
              lede="Every gift is recorded by the choir's treasury and directed where the ministry needs it most."
            />
            <Stagger className="grid border-t border-foreground/10 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
              {impactAreas.map((area, i) => (
                <StaggerItem key={area.title}>
                  <div className="group h-full border-foreground/10 py-10 sm:pr-8 lg:border-l lg:pl-8 lg:first:border-l-0 lg:first:pl-0">
                    <p className="font-display text-5xl italic text-primary/60 transition-colors duration-700 group-hover:text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-8 font-display text-2xl text-foreground">{area.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{area.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Giving */}
        <section id="give" className="scroll-mt-24 border-y border-foreground/[0.06] bg-charcoal py-24 md:py-32">
          <div className="container mx-auto px-4 lg:px-10">
            <div className="mb-16 flex flex-col gap-10 md:mb-20 lg:flex-row lg:items-end lg:justify-between">
              <Reveal>
                <p className="mb-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-luxe text-primary">
                  <span className="font-display text-base normal-case tracking-normal italic">II</span>
                  <span className="h-px w-8 bg-primary/60" />
                  Give
                </p>
                <h2 className="display-lg text-foreground">
                  {paymentMode === "online" ? (
                    <>Three quiet <span className="italic text-primary">steps.</span></>
                  ) : (
                    <>Give <span className="italic text-primary">directly.</span></>
                  )}
                </h2>
              </Reveal>

              {/* Mode switch */}
              <Reveal delay={0.1}>
                <div className="relative inline-grid grid-cols-2 rounded-full border border-foreground/15 p-1" role="tablist" aria-label="How to give">
                  {(["online", "manual"] as const).map((mode) => (
                    <button
                      key={mode}
                      role="tab"
                      aria-selected={paymentMode === mode}
                      onClick={() => setPaymentMode(mode)}
                      className={cn(
                        "relative z-10 h-11 rounded-full px-4 sm:px-6 text-[0.64rem] sm:text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-colors duration-500",
                        paymentMode === mode ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
                      )}
                    >
                      {paymentMode === mode && (
                        <motion.span
                          layoutId="give-mode"
                          className="absolute inset-0 -z-10 rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 300, damping: 32 }}
                        />
                      )}
                      {mode === "online" ? "Give online" : "Bank & MoMo"}
                    </button>
                  ))}
                </div>
              </Reveal>
            </div>

            {paymentMode === "online" ? (
              <motion.div key="online" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
                <DonationCheckout />
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="grid gap-12 lg:grid-cols-12 lg:gap-16"
              >
                <div className="space-y-8 lg:col-span-7">
                  {/* Bank */}
                  <div className="border border-foreground/10 bg-card p-6 md:p-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-display text-3xl text-foreground">Bank transfer</h3>
                      <span className="text-[0.6rem] uppercase tracking-luxe text-muted-foreground">Equity Bank Rwanda</span>
                    </div>
                    <div className="mt-6 divide-y divide-foreground/10 border-y border-foreground/10">
                      <div className="flex items-center justify-between gap-4 py-4">
                        <span className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Account name</span>
                        <span className="font-display text-xl text-foreground">Serenades of Praise</span>
                      </div>
                      <CopyRow label="Account number" value="4024212955253" copied={copied === "Account number"} onCopy={() => handleCopy("4024212955253", "Account number")} />
                      <CopyRow label="Swift code" value="EABORWRW" copied={copied === "Swift code"} onCopy={() => handleCopy("EABORWRW", "Swift code")} />
                    </div>
                  </div>

                  {/* Mobile money */}
                  <div className="border border-foreground/10 bg-card p-6 md:p-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-display text-3xl text-foreground">Mobile money</h3>
                      <span className="text-[0.6rem] uppercase tracking-luxe text-muted-foreground">MTN Mobile Money</span>
                    </div>
                    <div className="mt-6 divide-y divide-foreground/10 border-y border-foreground/10">
                      <div className="flex items-center justify-between gap-4 py-4">
                        <span className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Account name</span>
                        <span className="font-display text-xl text-foreground">Irakoze Alysee</span>
                      </div>
                      <CopyRow label="MTN MoMo" value="0798254683" display="(+250) 798 254 683" copied={copied === "MTN number"} onCopy={() => handleCopy("0798254683", "MTN number")} />
                    </div>
                  </div>
                </div>

                {/* Notify */}
                <aside className="lg:col-span-5">
                  <div className="border border-primary/30 bg-card p-6 md:p-8 lg:sticky lg:top-28">
                    <p className="text-[0.62rem] uppercase tracking-luxe text-primary">After you send</p>
                    <h3 className="mt-3 font-display text-3xl text-foreground">Let us say thank you.</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Transfers don't tell us who sent them. Leave your name so the choir can acknowledge your gift.
                    </p>
                    <div className="mt-8 space-y-4">
                      <Input placeholder="Your name" className={fieldClass} aria-label="Your name" />
                      <Input type="email" placeholder="Email" className={fieldClass} aria-label="Email" />
                      <button
                        type="button"
                        onClick={() => {
                          toast({
                            title: "Thank you",
                            description: "We've received your note. God bless you!",
                          });
                        }}
                        className="group flex h-12 w-full items-center justify-center gap-3 rounded-[2px] bg-primary text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors duration-500 hover:bg-gold-light"
                      >
                        I've sent my gift
                        <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </aside>
              </motion.div>
            )}
          </div>
        </section>

        {/* Scripture */}
        <section className="py-28 md:py-36">
          <div className="container mx-auto px-4 lg:px-10">
            <Reveal className="mx-auto max-w-4xl text-center">
              <span aria-hidden className="block font-display text-[6rem] leading-[0.5] text-primary/40 select-none">“</span>
              <blockquote className="font-display text-3xl md:text-5xl leading-[1.2] text-foreground text-balance">
                Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion,
                for God loves a <span className="italic text-primary">cheerful giver.</span>
              </blockquote>
              <cite className="mt-8 block text-[0.65rem] not-italic uppercase tracking-luxe text-muted-foreground">2 Corinthians 9 : 7</cite>
            </Reveal>
          </div>
        </section>

        {/* Leave a Message */}
        <section className="border-t border-foreground/[0.06] py-24 md:py-32">
          <div className="container mx-auto px-4 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <SectionHead
                  index="III"
                  eyebrow="Encourage"
                  title={<>Leave a <span className="italic text-primary">word.</span></>}
                  lede="Not every gift is money. A prayer or a kind word reaches the whole choir family."
                  className="!mb-0"
                />
              </div>

              <Reveal delay={0.1} className="lg:col-span-7">
                {messageSubmitted ? (
                  <div className="border border-primary/30 bg-card px-6 py-16 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/50">
                      <Check className="h-6 w-6 text-primary" strokeWidth={1.4} />
                    </span>
                    <h3 className="mt-6 font-display text-3xl text-foreground">Message received.</h3>
                    <p className="mt-3 text-muted-foreground">Thank you for your encouraging words. God bless you!</p>
                  </div>
                ) : (
                  <form onSubmit={handleMessageSubmit} className="space-y-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Your name</label>
                        <Input id="name" placeholder="Enter your name" required className={fieldClass} disabled={isSubmittingMessage} />
                      </div>
                      <div>
                        <label htmlFor="email" className="mb-2 flex justify-between text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Email <span className="normal-case tracking-normal text-muted-foreground/70">Optional</span>
                        </label>
                        <Input id="email" type="email" placeholder="your@email.com" className={fieldClass} disabled={isSubmittingMessage} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Your message</label>
                      <Textarea
                        id="message"
                        placeholder="Write your message of support..."
                        className="rounded-[3px] border-foreground/12 bg-card text-base shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                        rows={5}
                        required
                        disabled={isSubmittingMessage}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingMessage}
                      className="group flex h-12 items-center gap-3 rounded-[2px] border border-foreground/25 px-8 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-foreground transition-colors duration-500 hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-60"
                    >
                      {isSubmittingMessage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending
                        </>
                      ) : (
                        <>
                          Send message
                          <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
