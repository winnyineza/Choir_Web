import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, MapPin, Calendar, Youtube, Music, Heart, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import { getLatestMusicVideo, type MusicVideo } from "@/lib/releaseService";
import { getAllMembers } from "@/lib/dataService";

export default function Ministry() {
  useDocumentTitle("Our Ministry");
  const [featuredVideo, setFeaturedVideo] = useState<MusicVideo | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    // Load data from admin
    const video = getLatestMusicVideo();
    setFeaturedVideo(video || null);
    
    const members = getAllMembers();
    setMemberCount(members.filter(m => m.status === "Active").length);
  }, []);

  const ministryStats = [
    { label: "Ministry Focus", value: "Music", icon: Music },
    { label: "Community", value: "Growing", icon: Heart },
    { label: "Active Members", value: memberCount > 0 ? `${memberCount}` : "—", icon: Users },
    { label: "Location", value: "Rwanda", icon: MapPin },
  ];
  
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

        {/* Ministry Stats */}
        <section className="py-12 border-b border-primary/10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {ministryStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gold-gradient mx-auto mb-3 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold gold-text">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Our Ministry */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-2 block">
                  About Us
                </span>
                <h2 className="font-display text-4xl font-bold mb-6">
                  Our <span className="gold-text">Mission</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  We are dedicated to spreading the gospel through sacred music. Our choir travels across Rwanda 
                  to share worship, fellowship, and spiritual nourishment with communities everywhere.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-glass rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gold-gradient mx-auto mb-4 flex items-center justify-center">
                    <Music className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Worship</h3>
                  <p className="text-muted-foreground text-sm">
                    Leading hearts to God through powerful worship music and hymns.
                  </p>
                </div>
                <div className="card-glass rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gold-gradient mx-auto mb-4 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Fellowship</h3>
                  <p className="text-muted-foreground text-sm">
                    Building community through shared faith and musical ministry.
                  </p>
                </div>
                <div className="card-glass rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gold-gradient mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Devotion</h3>
                  <p className="text-muted-foreground text-sm">
                    Nurturing spiritual growth through daily reflection and prayer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Video - Only show if video exists */}
        {featuredVideo && (
          <section className="py-20 bg-charcoal section-pattern">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <div className="card-glass rounded-3xl p-8">
                  <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                    Featured Release
                  </span>
                  <div className="rounded-2xl overflow-hidden mb-4 gold-glow">
                    <iframe
                      width="100%"
                      height="315"
                      src={`https://www.youtube.com/embed/${featuredVideo.youtubeId}`}
                      title={featuredVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full aspect-video"
                    />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
                    {featuredVideo.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Experience the power of worship through our featured release.
                  </p>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`} target="_blank" rel="noopener noreferrer">
                        <Youtube className="w-4 h-4 mr-2" />
                        Watch on YouTube
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <a href="https://open.spotify.com/user/31vkr3pk5yd5y2mpocfhibr4xbfm" target="_blank" rel="noopener noreferrer">
                        <Music className="w-4 h-4 mr-2" />
                        Listen on Spotify
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

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
