import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Youtube, Music, BookOpen, Heart, ArrowRight, Eye, TrendingUp } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { getLatestMusicVideo, type MusicVideo } from "@/lib/releaseService";

const ministryFeatures = [
  { icon: Music, text: "Ministry trips and choir bookings" },
  { icon: BookOpen, text: "Daily biblical devotions" },
  { icon: Heart, text: "Community outreach programs" },
];

export function MinistryPreview() {
  const [featuredVideo, setFeaturedVideo] = useState<MusicVideo | null>(null);

  useEffect(() => {
    getLatestMusicVideo().then((latest) => setFeaturedVideo(latest || null));
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-charcoal to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content Side */}
          <div>
            <Stagger stagger={0.1}>
              <StaggerItem>
                <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                  Our Ministry
                </span>
              </StaggerItem>
              <StaggerItem>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Serving Through <span className="gold-text">Sacred Music</span>
                </h2>
              </StaggerItem>
              <StaggerItem>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  From choir trips to daily devotions, our ministry extends beyond the stage. We're committed to spreading joy, faith, and hope through every note we sing.
                </p>
              </StaggerItem>
            </Stagger>

            {/* Ministry Features */}
            <Stagger className="space-y-4 mb-8" stagger={0.1}>
              {ministryFeatures.map((item) => (
                <StaggerItem key={item.text} direction="right">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="flex flex-wrap gap-4">
              <Button variant="gold" size="lg" asChild className="group">
                <Link to="/ministry">
                  Explore Ministry
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="gold-outline" size="lg" asChild className="group">
                <Link to="/support">
                  Support Us
                  <Heart className="w-4 h-4 ml-2 group-hover:scale-125" />
                </Link>
              </Button>
            </Reveal>
          </div>

          {/* Featured Song Card - Only show if video exists */}
          {featuredVideo && (
            <Reveal direction="left" delay={0.15}>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  Featured Song
                </span>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">Watch Now</span>
                </div>
              </div>

              {/* Embedded YouTube Video */}
              <div className="rounded-2xl overflow-hidden mb-4 gold-glow hover-lift">
                <iframe
                  width="100%"
                  height="220"
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
              <p className="text-muted-foreground text-sm mb-5">
                Experience the power of worship through our featured release.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`} target="_blank" rel="noopener noreferrer">
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href="https://open.spotify.com/user/31vkr3pk5yd5y2mpocfhibr4xbfm" target="_blank" rel="noopener noreferrer">
                    <Music className="w-4 h-4 mr-2" />
                    Spotify
                  </a>
                </Button>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
