import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import choirImage from "@/assets/choir-group2.jpg";

const channels = [
  {
    label: "Equity Bank",
    method: "Bank transfer",
    detailLabel: "Account number",
    detail: "4024212955253",
  },
  {
    label: "MTN Mobile Money",
    method: "MoMo",
    detailLabel: "MoMo number",
    detail: "(+250) 798 254 683",
    note: "Account name: Irakoze Alysee",
  },
];

export function SupportCTA() {
  return (
    <section className="relative overflow-hidden bg-ink text-[hsl(40_30%_91%)]">
      <img
        src={choirImage}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(36_12%_4%)_0%,hsl(36_12%_4%/0.92)_45%,hsl(36_12%_4%/0.6)_100%)]" />

      <div className="relative container mx-auto px-4 lg:px-10 py-28 md:py-40">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-6">
            <p className="mb-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-luxe text-[hsl(40_45%_70%)]">
              <span className="font-display text-base normal-case tracking-normal italic">VI</span>
              <span className="h-px w-8 bg-[hsl(40_45%_70%/0.6)]" />
              Give
            </p>
            <h2 className="display-lg">
              Help the song <span className="italic text-[hsl(40_45%_70%)]">carry further.</span>
            </h2>
            <p className="mt-8 max-w-md text-base md:text-lg font-light leading-relaxed text-[hsl(40_30%_91%/0.75)]">
              Your gift funds ministry trips, recordings and outreach, so more hearts across Rwanda can hear the gospel in song.
            </p>
            <div className="mt-12">
              <Button variant="hero" size="xl" asChild>
                <Link to="/support">
                  Support the ministry
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </Reveal>

          <Stagger className="lg:col-span-5 lg:col-start-8 border-t border-[hsl(40_30%_91%/0.15)]" stagger={0.12}>
            {channels.map((c) => (
              <StaggerItem key={c.label}>
                <div className="py-8 border-b border-[hsl(40_30%_91%/0.15)]">
                  <div className="flex items-baseline justify-between gap-6">
                    <h3 className="font-display text-2xl">{c.label}</h3>
                    <span className="text-[0.6rem] uppercase tracking-luxe text-[hsl(40_30%_91%/0.5)]">{c.method}</span>
                  </div>
                  <p className="mt-5 text-[0.6rem] uppercase tracking-[0.2em] text-[hsl(40_45%_70%)]">{c.detailLabel}</p>
                  <p className="mt-1 font-display text-3xl tabular-nums tracking-wide select-all">{c.detail}</p>
                  {c.note && <p className="mt-2 text-sm text-[hsl(40_30%_91%/0.6)]">{c.note}</p>}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
