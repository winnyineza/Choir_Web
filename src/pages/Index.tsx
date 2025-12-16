import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { AboutPreview } from "@/components/home/AboutPreview";
import { EventsPreview } from "@/components/home/EventsPreview";
import { MinistryPreview } from "@/components/home/MinistryPreview";
import { ReleasesPreview } from "@/components/home/ReleasesPreview";
import { SupportCTA } from "@/components/home/SupportCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <AboutPreview />
        <MinistryPreview />
        <ReleasesPreview />
        <EventsPreview />
        <SupportCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
