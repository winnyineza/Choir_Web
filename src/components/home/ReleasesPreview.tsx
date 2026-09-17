import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Music, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { getAllMusicVideos, getLatestMusicVideo, type MusicVideo } from "@/lib/releaseService";

export const ReleasesPreview = () => {
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
  const [latestVideo, setLatestVideo] = useState<MusicVideo | null>(null);

  useEffect(() => {
    (async () => {
      const [videos, latest] = await Promise.all([getAllMusicVideos(), getLatestMusicVideo()]);
      setMusicVideos(videos);
      setLatestVideo(latest || null);
    })();
  }, []);

  const otherVideos = musicVideos.filter((v) => !v.isLatest).slice(0, 3);

  // Don't render section if no videos exist
  if (musicVideos.length === 0) {
    return null;
  }

  return (
    <section className="py-20 md:py-28 bg-charcoal relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <Stagger className="text-center mb-12" stagger={0.1}>
          <StaggerItem>
            <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold tracking-wider uppercase mb-4">
              <Music className="w-4 h-4" />
              Our Music
            </span>
          </StaggerItem>
          <StaggerItem>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Recent <span className="gold-text">Releases</span>
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the power of worship through our latest musical releases
            </p>
          </StaggerItem>
        </Stagger>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Featured Latest Release */}
          {latestVideo && (
            <Reveal direction="right" delay={0.1}>
              <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                Latest Release
              </span>
              <div className="rounded-2xl overflow-hidden gold-glow-lg hover-lift">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${latestVideo.youtubeId}`}
                  title={latestVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video"
                />
              </div>
            </Reveal>
          )}

          {/* Other Videos */}
          <Stagger className="space-y-4" stagger={0.1} delay={0.15}>
            {otherVideos.length > 0 && (
              <StaggerItem>
                <h3 className="font-semibold text-lg text-foreground mb-4">
                  More from our collection
                </h3>
              </StaggerItem>
            )}
            {otherVideos.map((video) => (
              <StaggerItem key={video.id} direction="left">
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 p-3 rounded-xl card-glass hover:bg-secondary/50 hover:translate-x-1 transition-all duration-300"
                >
                  <div className="relative w-40 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full aspect-video object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">Watch on YouTube</p>
                  </div>
                </a>
              </StaggerItem>
            ))}

            {/* CTA Button */}
            <StaggerItem>
              <div className="pt-4">
                <Link to="/releases">
                  <Button variant="gold-outline" className="w-full group">
                    View All Releases
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </div>
    </section>
  );
};
