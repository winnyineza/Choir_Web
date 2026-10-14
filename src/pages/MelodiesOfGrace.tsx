import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, CalendarPlus, Check, Copy, MapPin, Share2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Depth, Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";
import { SectionHead } from "@/components/editorial";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/use-toast";
import { EASE_OUT } from "@/lib/motionPresets";
import { MELODIES_OF_GRACE as EVENT, buildMelodiesIcs } from "@/lib/melodiesOfGrace";

const ON_DARK = "text-[hsl(40_30%_91%)]";
const ON_DARK_MUTED = "text-[hsl(40_30%_91%/0.7)]";
const GOLD_ON_DARK = "text-[hsl(40_45%_70%)]";

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountUnit({ value, label }: { value: number; label: string }) {
  const reduced = useReducedMotion();
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <span className="relative block h-[1em] overflow-hidden font-display text-5xl leading-none tabular-nums text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
        <motion.span
          key={text}
          className="block"
          initial={reduced ? false : { y: "60%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          {text}
        </motion.span>
      </span>
      <span className="mt-4 text-[0.52rem] uppercase tracking-[0.14em] text-muted-foreground sm:text-[0.6rem] sm:tracking-luxe">{label}</span>
    </div>
  );
}

function CopyLine({ label, value, display, note }: { label: string; value: string; display: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  return (
    <div className="border-b border-foreground/10 py-6">
      <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <span className="font-display text-3xl tabular-nums tracking-wide text-foreground select-all">{display}</span>
        <button
          type="button"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            toast({ title: "Copied", description: `${label} copied to clipboard.` });
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-muted-foreground transition-colors duration-500 hover:border-primary hover:text-primary"
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
        </button>
      </div>
      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

export default function MelodiesOfGrace() {
  useDocumentTitle(`${EVENT.title} — ${EVENT.edition}`);
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const countdown = useCountdown(EVENT.startsAt);

  const pageUrl = typeof window !== "undefined" ? `${window.location.origin}${EVENT.path}` : EVENT.path;

  const saveTheDate = () => {
    const blob = new Blob([buildMelodiesIcs(pageUrl)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "melodies-of-grace.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const data = {
      title: `${EVENT.title} — ${EVENT.edition}`,
      text: `You're invited to ${EVENT.title}, ${EVENT.dateLabel} at ${EVENT.venue}.`,
      url: pageUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      toast({ title: "Link copied", description: "Share the invitation with family and friends." });
    } catch {
      // The visitor closed the share sheet; nothing to do.
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* ---------- Invitation ---------- */}
        <section className={`relative overflow-hidden bg-ink ${ON_DARK}`}>
          <img
            src={EVENT.poster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(36_12%_4%/0.7),hsl(36_12%_4%/0.92)_70%,hsl(36_12%_4%))]" />

          <div className="relative container mx-auto grid min-h-[100svh] items-center gap-14 px-4 pb-20 pt-36 lg:grid-cols-12 lg:gap-20 lg:px-10">
            <div className="lg:col-span-7">
              <motion.p
                className="eyebrow mb-8 !text-[hsl(40_45%_70%)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                You're invited
              </motion.p>
              <h1 className="display-xl">
                <span className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className="block"
                    initial={reduced ? { opacity: 0 } : { y: "105%" }}
                    animate={reduced ? { opacity: 1 } : { y: "0%" }}
                    transition={{ duration: 1.3, delay: 0.3, ease: EASE_OUT }}
                  >
                    Melodies
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className="block"
                    initial={reduced ? { opacity: 0 } : { y: "105%" }}
                    animate={reduced ? { opacity: 1 } : { y: "0%" }}
                    transition={{ duration: 1.3, delay: 0.45, ease: EASE_OUT }}
                  >
                    of <span className={`italic ${GOLD_ON_DARK}`}>Grace.</span>
                  </motion.span>
                </span>
              </h1>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 0.8, ease: EASE_OUT }}
              >
                <p className={`mt-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-luxe ${GOLD_ON_DARK}`}>
                  <span className="h-px w-10 bg-current opacity-60" />
                  {EVENT.edition} · The Serenades of Praise
                </p>
                <p className={`mt-10 max-w-md text-lg font-light leading-relaxed ${ON_DARK_MUTED}`}>
                  {EVENT.tagline} Join us for a celebration of faith, music and togetherness.
                </p>

                <dl className="mt-10 grid max-w-lg grid-cols-2 border-y border-[hsl(40_30%_91%/0.14)]">
                  <div className="py-5 pr-6">
                    <dt className={`text-[0.6rem] uppercase tracking-[0.2em] ${ON_DARK_MUTED}`}>When</dt>
                    <dd className="mt-2 font-display text-xl leading-snug">
                      {EVENT.dateLabel}
                      <span className={`block text-base ${ON_DARK_MUTED}`}>{EVENT.timeLabel}</span>
                    </dd>
                  </div>
                  <div className="border-l border-[hsl(40_30%_91%/0.14)] py-5 pl-6">
                    <dt className={`text-[0.6rem] uppercase tracking-[0.2em] ${ON_DARK_MUTED}`}>Where</dt>
                    <dd className="mt-2 font-display text-xl leading-snug">
                      {EVENT.venue}
                      <span className={`block text-base ${ON_DARK_MUTED}`}>KG 19 Ave, Kigali</span>
                    </dd>
                  </div>
                </dl>

                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
                  <button
                    type="button"
                    onClick={saveTheDate}
                    className="group flex h-14 items-center gap-3 rounded-[2px] bg-primary px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18)] transition-colors duration-500 hover:bg-gold-light"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Save the date
                  </button>
                  <button type="button" onClick={share} className="link-luxe !text-[hsl(40_30%_91%/0.85)] hover:!text-[hsl(40_45%_70%)]">
                    <Share2 className="h-3.5 w-3.5" />
                    Share invitation
                  </button>
                </div>
              </motion.div>
            </div>

            {/* The poster, set like a framed print */}
            <motion.div
              className="lg:col-span-5"
              initial={reduced ? false : { opacity: 0, y: 40, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 1.6, delay: 0.4, ease: EASE_OUT }}
            >
              <TiltCard maxTilt={5} lift={12} className="mx-auto max-w-sm lg:max-w-none">
                <figure className="bg-[hsl(40_33%_95%)] p-3 shadow-[0_40px_80px_-30px_hsl(0_0%_0%/0.8)]">
                  <img
                    src={EVENT.poster}
                    alt="The Serenades of Praise choir on the Melodies of Grace concert poster"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </figure>
              </TiltCard>
            </motion.div>
          </div>
        </section>

        {/* ---------- Countdown ---------- */}
        <section className="border-b border-foreground/[0.06] py-24 md:py-32" id="countdown">
          <div className="container mx-auto px-4 lg:px-10">
            <SectionHead
              align="center"
              index="I"
              eyebrow="Mark your calendar"
              title={
                countdown.done ? (
                  <>The melody has <span className="italic text-primary">begun.</span></>
                ) : (
                  <>The anticipation is part of the <span className="italic text-primary">joy.</span></>
                )
              }
            />
            {!countdown.done && (
              <Reveal className="mx-auto grid max-w-5xl grid-cols-4 divide-x divide-foreground/10" blur={false}>
                <CountUnit value={countdown.days} label="Days" />
                <CountUnit value={countdown.hours} label="Hours" />
                <CountUnit value={countdown.minutes} label="Minutes" />
                <CountUnit value={countdown.seconds} label="Seconds" />
              </Reveal>
            )}
          </div>
        </section>

        {/* ---------- Guest choirs ---------- */}
        <section className="bg-charcoal py-24 md:py-32" id="choirs">
          <div className="container mx-auto px-4 lg:px-10">
            <SectionHead
              align="split"
              index="II"
              eyebrow="On the programme"
              title={<>Voices joining the <span className="italic text-primary">melody.</span></>}
              lede={`Guest choirs will minister alongside The Serenades of Praise on ${EVENT.dateLabel.replace("Saturday, ", "")}.`}
            />
            <Stagger
              className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0"
              stagger={0.12}
            >
              {EVENT.guests.map((guest, i) => (
                <StaggerItem key={guest.name} className="w-[78%] shrink-0 snap-center sm:w-[55%] md:w-auto">
                  <TiltCard maxTilt={5} className="group">
                    <figure className="img-frame aspect-[4/5] shadow-[var(--shadow-dark)]">
                      <img
                        src={guest.image}
                        alt={`Poster announcing ${guest.name} as a guest choir at Melodies of Grace`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </figure>
                  </TiltCard>
                  <div className="mt-6 flex items-baseline gap-4">
                    <span className="font-display text-lg italic text-primary tabular-nums">0{i + 1}</span>
                    <div>
                      <h3 className="font-display text-2xl text-foreground">{guest.name}</h3>
                      <p className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Will minister</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ---------- Venue ---------- */}
        <section className="py-24 md:py-32" id="venue">
          <div className="container mx-auto px-4 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
              <div className="lg:col-span-5">
                <SectionHead
                  index="III"
                  eyebrow="Come together"
                  title={<>A gathering. A shared <span className="italic text-primary">experience.</span></>}
                  className="!mb-10"
                />
                <Reveal>
                  <dl className="divide-y divide-foreground/10 border-y border-foreground/10">
                    <div className="py-5">
                      <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Venue</dt>
                      <dd className="mt-2 font-display text-2xl text-foreground">{EVENT.venue}</dd>
                      <dd className="text-sm text-muted-foreground">{EVENT.address}</dd>
                    </div>
                    <div className="py-5">
                      <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Date &amp; time</dt>
                      <dd className="mt-2 font-display text-2xl text-foreground">{EVENT.dateLabel}</dd>
                      <dd className="text-sm text-muted-foreground">Starts at {EVENT.timeLabel}</dd>
                    </div>
                    <div className="py-5">
                      <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Questions</dt>
                      <dd className="mt-2">
                        <a href="tel:+250780623144" className="font-display text-2xl tabular-nums text-foreground transition-colors hover:text-primary">
                          {EVENT.contactPhone}
                        </a>
                      </dd>
                    </div>
                  </dl>
                  <a href={EVENT.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-luxe mt-8">
                    <MapPin className="h-3.5 w-3.5" />
                    Get directions
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </Reveal>
              </div>
              <Depth className="lg:col-span-7" tilt={10}>
                <div className="relative aspect-[4/3] overflow-hidden border border-foreground/10 bg-muted shadow-[var(--shadow-dark)]">
                  <iframe
                    title={`Map to ${EVENT.venue}`}
                    src={EVENT.mapsEmbedUrl}
                    className="absolute inset-0 h-full w-full grayscale-[60%] contrast-[1.05]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Depth>
            </div>
          </div>
        </section>

        {/* ---------- Support ---------- */}
        <section className="border-y border-foreground/[0.06] bg-charcoal py-24 md:py-32" id="support">
          <div className="container mx-auto px-4 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <SectionHead
                  index="IV"
                  eyebrow="Make a difference"
                  title={<>Help the music reach <span className="italic text-primary">further.</span></>}
                  lede="Your generosity is part of the melody. Support Melodies of Grace through mobile money or bank transfer."
                  className="!mb-8"
                />
                <Reveal>
                  <Link to="/support#give" className="link-luxe">
                    Or give online by card
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Reveal>
              </div>
              <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.1}>
                <div className="border-t border-foreground/10">
                  <CopyLine label="MTN Mobile Money" value="0798254683" display="0798 254 683" note="Irakoze Alysee" />
                  <CopyLine label="Equity Bank" value="4024212955253" display="4024212955253" note="Serenades of Praise" />
                </div>
                <p className="mt-8 font-display text-xl italic text-foreground/80">
                  Every contribution matters. Thank you for being part of this journey.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- Closing ---------- */}
        <section className="py-28 md:py-36">
          <div className="container mx-auto px-4 text-center lg:px-10">
            <Reveal>
              <p className="mx-auto max-w-3xl font-display text-4xl leading-tight text-foreground md:text-6xl text-balance">
                Let everything that has breath <span className="italic text-primary">praise the Lord.</span>
              </p>
              <p className="mt-8 text-[0.65rem] uppercase tracking-luxe text-muted-foreground">Psalm 150 : 6</p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
                <button
                  type="button"
                  onClick={saveTheDate}
                  className="group flex h-12 items-center gap-3 rounded-[2px] bg-primary px-8 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors duration-500 hover:bg-gold-light"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Save the date
                </button>
                <button type="button" onClick={share} className="link-luxe">
                  <Share2 className="h-3.5 w-3.5" />
                  Share invitation
                </button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
