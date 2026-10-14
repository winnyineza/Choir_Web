import { Link } from "react-router-dom";
import { Depth, Reveal, Stagger, StaggerItem, Parallax } from "@/components/motion";
import choirPortrait from "@/assets/Choir01.jpg";
import choirDetail from "@/assets/ChoirLadies.jpg";

const pillars = [
  {
    title: "Mission",
    description: "To carry the gospel through sacred music, touching hearts across Rwanda and beyond.",
  },
  {
    title: "Vision",
    description: "To be a beacon of praise, inspiring communities through harmonious worship and devotion.",
  },
  {
    title: "Values",
    description: "Unity, excellence, spirituality and service shape every rehearsal and every song.",
  },
];

export function AboutPreview() {
  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20 items-start">
          {/* Photographs, layered like a printed spread */}
          <div className="relative lg:col-span-6">
            <Depth tilt={16}>
              <figure className="img-frame aspect-[4/5] shadow-[var(--shadow-dark)]">
                <img src={choirPortrait} alt="Members of Serenades of Praise" className="h-full w-full object-cover" loading="lazy" />
              </figure>
            </Depth>
            <Parallax distance={50} className="absolute -bottom-12 -right-4 md:-right-10 w-[44%] hidden sm:block">
              <figure className="img-frame aspect-[3/4] ring-[10px] ring-background">
                <img src={choirDetail} alt="Choir members singing" className="h-full w-full object-cover" loading="lazy" />
              </figure>
            </Parallax>
            <p className="mt-5 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="text-primary">Fig. 1</span> · Serenades of Praise, Kigali
            </p>
          </div>

          {/* Text */}
          <div className="lg:col-span-6 lg:pt-16">
            <Reveal>
              <p className="mb-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-luxe text-primary">
                <span className="font-display text-base normal-case tracking-normal italic">I</span>
                <span className="h-px w-8 bg-primary/60" />
                Who we are
              </p>
              <h2 className="display-lg text-foreground">
                Voices gathered in <span className="italic text-primary">one</span> devotion.
              </h2>
              <p className="lede mt-8">
                Founded on the first day of 2024, Serenades of Praise is the choir ministry of Kacyiru SDA Church.
                We sing to glorify God and to bring listeners a little closer to Him.
              </p>
            </Reveal>

            <Stagger className="mt-14 border-t border-foreground/10" stagger={0.1}>
              {pillars.map((pillar, i) => (
                <StaggerItem key={pillar.title}>
                  <div className="group grid grid-cols-[3rem_1fr] md:grid-cols-[3rem_9rem_1fr] gap-x-6 gap-y-2 py-7 border-b border-foreground/10">
                    <span className="font-display italic text-primary text-lg tabular-nums">0{i + 1}</span>
                    <h3 className="font-display text-2xl text-foreground transition-colors duration-500 group-hover:text-primary">
                      {pillar.title}
                    </h3>
                    <p className="col-start-2 md:col-start-3 text-sm leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="mt-12" delay={0.1}>
              <Link to="/about" className="link-luxe">
                Our story
                <span className="link-luxe-rule" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
