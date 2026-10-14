import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { AboutPreview } from "@/components/home/AboutPreview";
import { EventsPreview } from "@/components/home/EventsPreview";
import { MinistryPreview } from "@/components/home/MinistryPreview";
import { ReleasesPreview } from "@/components/home/ReleasesPreview";
import { SupportCTA } from "@/components/home/SupportCTA";
import { Testimonials } from "@/components/home/Testimonials";
import { ConcertFeature } from "@/components/home/ConcertFeature";
import { ScriptureMarquee } from "@/components/editorial";

const verses = [
  "Sing to the Lord a new song",
  "Let everything that has breath praise the Lord",
  "Make a joyful noise",
  "It is good to sing praises to our God",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ScriptureMarquee items={verses} />
        <ConcertFeature />
        <AboutPreview />
        <MinistryPreview />
        <ReleasesPreview />
        <EventsPreview />
        <Testimonials />
        <SupportCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
