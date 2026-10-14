import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Depth, Reveal } from "@/components/motion";
import { MELODIES_OF_GRACE as EVENT, isMelodiesUpcoming } from "@/lib/melodiesOfGrace";

/** Homepage spotlight for the next concert. Hides itself once the concert has passed. */
export function ConcertFeature() {
  if (!isMelodiesUpcoming()) return null;

  const days = Math.max(0, Math.ceil((EVENT.startsAt.getTime() - Date.now()) / 86_400_000));

  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-4 lg:px-10">
        <Link to={EVENT.path} className="group grid items-center gap-12 lg:grid-cols-12 lg:gap-20" aria-label={`${EVENT.title}: the invitation`}>
          <Depth className="lg:col-span-5" tilt={12}>
            <figure className="img-frame aspect-[4/5] shadow-[var(--shadow-dark)]">
              <img src={EVENT.poster} alt="The Melodies of Grace concert poster" className="h-full w-full object-cover" loading="lazy" />
            </figure>
          </Depth>

          <Reveal className="lg:col-span-7">
            <p className="mb-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-luxe text-primary">
              <span className="h-px w-8 bg-primary/60" />
              The next concert{days > 0 && <> · in {days} {days === 1 ? "day" : "days"}</>}
            </p>
            <h2 className="display-lg text-foreground">
              Melodies of <span className="italic text-primary">Grace.</span>
            </h2>
            <p className="mt-3 text-[0.65rem] uppercase tracking-luxe text-muted-foreground">{EVENT.edition}</p>
            <p className="lede mt-8">
              {EVENT.tagline} The Serenades of Praise with The Clarion Call Choir, Messengers Singers and Balton.
            </p>

            <dl className="mt-10 grid max-w-xl grid-cols-2 border-y border-foreground/10">
              <div className="py-5 pr-6">
                <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">When</dt>
                <dd className="mt-2 font-display text-xl text-foreground">
                  {EVENT.dateLabel.replace("Saturday, ", "Sat ")}
                  <span className="block text-base text-muted-foreground">2:00 PM</span>
                </dd>
              </div>
              <div className="border-l border-foreground/10 py-5 pl-6">
                <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Where</dt>
                <dd className="mt-2 font-display text-xl text-foreground">
                  Kigali English Church
                  <span className="block text-base text-muted-foreground">KG 19 Ave, Kigali</span>
                </dd>
              </div>
            </dl>

            <span className="link-luxe mt-10">
              See the invitation
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
            </span>
          </Reveal>
        </Link>
      </div>
    </section>
  );
}
