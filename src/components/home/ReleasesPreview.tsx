import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Depth, Stagger, StaggerItem } from "@/components/motion";
import { SectionHead } from "@/components/editorial";
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

  const otherVideos = musicVideos.filter((v) => !v.isLatest).slice(0, 4);

  // Don't render section if no videos exist
  if (musicVideos.length === 0) {
    return null;
  }

  return (
    <section className="relative py-28 md:py-40">
      <div className="container mx-auto px-4 lg:px-10">
        <SectionHead
          align="split"
          index="III"
          eyebrow="Recordings"
          title={<>Songs for the <span className="italic text-primary">soul.</span></>}
          lede="Hymns, anthems and new compositions, recorded by the choir and shared freely."
          action={
            <Link to="/releases" className="link-luxe">
              The full collection
              <span className="link-luxe-rule" />
            </Link>
          }
        />

        <div className="grid gap-14 lg:grid-cols-12">
          {/* Featured Latest Release */}
          {latestVideo && (
            <Depth className="lg:col-span-7">
              <div className="bg-black ring-1 ring-foreground/10 shadow-[var(--shadow-dark)]">
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
              <div className="mt-6 flex items-baseline justify-between gap-6">
                <h3 className="font-display text-3xl text-foreground">{latestVideo.title}</h3>
                <span className="shrink-0 text-[0.62rem] uppercase tracking-luxe text-primary">Latest</span>
              </div>
            </Depth>
          )}

          {/* Track listing */}
          {otherVideos.length > 0 && (
            <div className={latestVideo ? "lg:col-span-5" : "lg:col-span-12"}>
              <p className="mb-2 text-[0.62rem] uppercase tracking-luxe text-muted-foreground">From the collection</p>
              <Stagger className="border-t border-foreground/10" stagger={0.08}>
                {otherVideos.map((video, i) => (
                  <StaggerItem key={video.id}>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid grid-cols-[2rem_6.5rem_1fr_auto] items-center gap-5 py-5 border-b border-foreground/10"
                    >
                      <span className="font-display italic text-lg text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="img-frame aspect-video">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          alt=""
                          className="h-full w-full object-cover grayscale-[35%] group-hover:grayscale-0"
                          loading="lazy"
                        />
                      </span>
                      <span className="font-display text-xl leading-snug text-foreground transition-colors duration-500 group-hover:text-primary">
                        {video.title}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 text-foreground/70 transition-colors duration-500 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                        <Play className="h-3.5 w-3.5 translate-x-px" />
                        <span className="sr-only">Watch {video.title} on YouTube</span>
                      </span>
                    </a>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
