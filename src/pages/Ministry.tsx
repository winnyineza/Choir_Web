import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, MapPin, Calendar, Youtube, Music, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const trips = [
  {
    id: 1,
    destination: "Musanze District",
    date: "Jan 20-22, 2025",
    purpose: "Youth Conference",
    status: "Trip Approval Status",
  },
  {
    id: 2,
    destination: "Huye District",
    date: "Feb 10-12, 2025",
    purpose: "Church Revival",
    status: "Trip Approval Status",
  },
  {
    id: 3,
    destination: "Rubavu District",
    date: "Mar 5-7, 2025",
    purpose: "Gospel Concert",
    status: "Trip Approval Status",
  },
];

const devotionals = [
  {
    date: "Today",
    title: "Walking in Faith",
    verse: "Hebrews 11:1",
    excerpt: "Now faith is the substance of things hoped for, the evidence of things not seen.",
  },
  {
    date: "Yesterday",
    title: "The Power of Praise",
    verse: "Psalm 150:6",
    excerpt: "Let everything that has breath praise the Lord. Praise the Lord!",
  },
  {
    date: "Dec 5",
    title: "Joy in the Journey",
    verse: "Philippians 4:4",
    excerpt: "Rejoice in the Lord always. I will say it again: Rejoice!",
  },
];

export default function Ministry() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                Our Ministry
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Serving Through <span className="gold-text">Sacred Music</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                From choir trips to daily devotions, discover how we serve God's kingdom
              </p>
            </div>
          </div>
        </section>

        {/* Choir Trips */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
              <div>
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-2 block">
                  Ministry Trips
                </span>
                <h2 className="font-display text-4xl font-bold">
                  <span className="gold-text">Book</span> a Trip with Us
                </h2>
              </div>
              <p className="text-muted-foreground max-w-md mt-4 md:mt-0">
                Travel with the choir to different locations and be part of our ministry outreach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div key={trip.id} className="card-glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center gap-2 text-sm text-primary mb-4">
                    <MapPin className="w-4 h-4" />
                    {trip.destination}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {trip.purpose}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4" />
                    {trip.date}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gold-light">{trip.status}</span>
                    <Button variant="gold" size="sm">Approved</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Content */}
        <section className="py-20 bg-charcoal section-pattern">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Most Loved Song */}
              <div className="card-glass rounded-3xl p-8">
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                  Most Loved Song
                </span>
                <div className="rounded-2xl overflow-hidden mb-4 gold-glow">
                <iframe
                  width="100%"
                  height="220"
                  src="https://www.youtube.com/embed/MIxvjxty1Nw"
                  title="Warakoze Mukiza"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video"
                />
              </div>
                <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
                  Warakoze Mukiza
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our most popular release featuring soul-stirring harmonies and uplifting messages of what salvation plan means to us.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Youtube className="w-4 h-4 mr-2" />
                    Watch on YouTube
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Music className="w-4 h-4 mr-2" />
                    Listen on Spotify
                  </Button>
                </div>
              </div>

              {/* Daily Devotions */}
              <div>
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                  Daily Devotions
                </span>
                <h2 className="font-display text-3xl font-bold mb-6">
                  <span className="gold-text">Spiritual</span> Nourishment
                </h2>
                <div className="space-y-4">
                  {devotionals.map((devotion, index) => (
                    <div key={index} className="card-glass rounded-xl p-5 hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-primary font-semibold">{devotion.date}</span>
                        <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h4 className="font-display text-lg font-semibold text-foreground mb-1">
                        {devotion.title}
                      </h4>
                      <p className="text-sm text-gold-light mb-2">{devotion.verse}</p>
                      <p className="text-sm text-muted-foreground italic">"{devotion.excerpt}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto card-glass rounded-3xl p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gold-gradient mx-auto mb-6 flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Support Our <span className="gold-text">Ministry</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Your generous contributions help us continue spreading the gospel through music, funding trips, equipment, and outreach programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gold" size="lg" asChild>
                  <Link to="/support">
                    Support Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="gold-outline" size="lg" asChild>
                  <Link to="/join">
                    Join as Supporter
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
