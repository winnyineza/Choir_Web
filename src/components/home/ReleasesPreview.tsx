import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Music, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const youtubeVideos = [
  {
    id: 1,
    title: "Latest Release",
    videoId: "Pzgvo9oSPn0",
    isLatest: true,
  },
  {
    id: 2,
    title: "Ntabaza Yesu | I Must Tell Jesus",
    videoId: "Jwql9oVctsU",
    isLatest: false,
  },
  {
    id: 3,
    title: "Warakoze Mukiza",
    videoId: "MIxvjxty1Nw",
    isLatest: false,
  },
];

export const ReleasesPreview = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const latestVideo = youtubeVideos.find((v) => v.isLatest);
  const otherVideos = youtubeVideos.filter((v) => !v.isLatest);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-charcoal relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            <Music className="w-4 h-4" />
            Our Music
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Recent <span className="gold-text">Releases</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the power of worship through our latest musical releases
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Featured Latest Release */}
          {latestVideo && (
            <div
              className={`transition-all duration-700 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                Latest Release
              </span>
              <div className="rounded-2xl overflow-hidden gold-glow-lg">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${latestVideo.videoId}`}
                  title={latestVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video"
                />
              </div>
            </div>
          )}

          {/* Other Videos */}
          <div
            className={`space-y-4 transition-all duration-700 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h3 className="font-semibold text-lg text-foreground mb-4">
              More from our collection
            </h3>
            {otherVideos.map((video, index) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 p-3 rounded-xl card-glass hover:bg-secondary/50 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative w-40 flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
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
            ))}

            {/* CTA Button */}
            <div className="pt-4">
              <Link to="/releases">
                <Button variant="gold-outline" className="w-full group">
                  View All Releases
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
