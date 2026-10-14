import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Depth, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SectionHead } from "@/components/editorial";
import { getLatestMusicVideo, type MusicVideo } from "@/lib/releaseService";

const ministryFeatures = [
  {
    title: "Ministry trips",
    text: "We travel to churches, conferences and gatherings across Rwanda. Invite the choir to sing at yours.",
  },
  {
    title: "Daily devotions",
    text: "Scripture and reflection shared each day, so the song continues long after the service ends.",
  },
  {
    title: "Community outreach",
    text: "Visits, service and music offered to those who cannot come to us.",
  },
];

export function MinistryPreview() {
  const [featuredVideo, setFeaturedVideo] = useState<MusicVideo | null>(null);

  useEffect(() => {
    getLatestMusicVideo().then((latest) => setFeaturedVideo(latest || null));
  }, []);

  return (
    <section className="relative py-28 md:py-40 bg-charcoal border-y border-foreground/[0.06]">
      <div className="container mx-auto px-4 lg:px-10">
        <SectionHead
          align="split"
          index="II"
          eyebrow="The ministry"
          title={<>Beyond the <span className="italic text-primary">stage.</span></>}
          lede="Our calling reaches past Sabbath services: into journeys, devotions and quiet acts of service, carried by the same spirit we sing with."
          action={
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <Link to="/ministry" className="link-luxe">
                Explore the ministry
                <span className="link-luxe-rule" />
              </Link>
              <Link to="/support" className="link-luxe">
                Support the work
                <span className="link-luxe-rule" />
              </Link>
            </div>
          }
        />

        <Stagger className="grid md:grid-cols-3 border-t border-foreground/10" stagger={0.12}>
          {ministryFeatures.map((item, i) => (
            <StaggerItem key={item.title}>
              <div className="group h-full pt-10 pb-4 md:pr-10 md:[&:not(:first-child)]:pl-10 md:border-l md:first:border-l-0 border-foreground/10">
                <p className="font-display italic text-5xl text-primary/70 transition-colors duration-700 group-hover:text-primary">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-8 font-display text-3xl text-foreground">{item.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-xs">{item.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {featuredVideo && (
          <Reveal className="mt-24 md:mt-32 grid gap-10 lg:grid-cols-12 lg:items-end" blur={false}>
            <Depth className="lg:col-span-8">
              <div className="relative bg-black ring-1 ring-foreground/10 shadow-[var(--shadow-dark)]">
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
            </Depth>
            <div className="lg:col-span-4">
              <p className="eyebrow mb-5">Now playing</p>
              <h3 className="font-display text-4xl text-foreground leading-tight">{featuredVideo.title}</h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Our most recent recording, offered in worship.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                <a
                  href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-luxe"
                >
                  YouTube
                  <span className="link-luxe-rule" />
                </a>
                <a
                  href="https://open.spotify.com/user/31vkr3pk5yd5y2mpocfhibr4xbfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-luxe"
                >
                  Spotify
                  <span className="link-luxe-rule" />
                </a>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
