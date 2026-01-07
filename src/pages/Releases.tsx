import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Disc3, Headphones } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import {
  getAllAlbums,
  getAllMusicVideos,
  getLatestAlbum,
  getLatestMusicVideo,
  getVisiblePlatforms,
  type Album,
  type MusicVideo,
  type StreamingPlatform,
} from "@/lib/releaseService";
import { getPlatformConfig } from "@/lib/streamingPlatforms";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Releases() {
  useDocumentTitle("Music Releases");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
  const [latestAlbum, setLatestAlbum] = useState<Album | null>(null);
  const [latestVideo, setLatestVideo] = useState<MusicVideo | null>(null);
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  // Load releases data from admin-managed content only
  useEffect(() => {
    const loadReleases = () => {
      const loadedAlbums = getAllAlbums();
      const loadedVideos = getAllMusicVideos();

      setAlbums(loadedAlbums);
      setMusicVideos(loadedVideos);
      setLatestAlbum(getLatestAlbum() || null);
      setLatestVideo(getLatestMusicVideo() || null);
      setPlatforms(getVisiblePlatforms());
      setIsLoading(false);
    };

    loadReleases();

    // Listen for storage changes
    window.addEventListener("storage", loadReleases);
    return () => window.removeEventListener("storage", loadReleases);
  }, []);

  const featuredVideos = musicVideos.filter((v) => v.isFeatured && !v.isLatest);
  const otherVideos = musicVideos.filter((v) => !v.isFeatured && !v.isLatest);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                {t("releases.title")}
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                <span className="gold-text">{t("releases.albums")}</span> & {t("releases.videos")}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t("releases.listenEverywhere")}
              </p>
            </div>
          </div>
        </section>

        {/* Listen Everywhere Banner */}
        {platforms.length > 0 && (
          <section className="py-12 bg-charcoal border-y border-primary/10">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold tracking-wider uppercase mb-2">
                  <Headphones className="w-4 h-4" />
                  {t("releases.listenEverywhere")}
                </div>
                <p className="text-muted-foreground">
                  {t("home.hero.subtitle")}
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {platforms.map((platform) => {
                  const config = getPlatformConfig(platform.name);
                  return (
                    <a
                      key={platform.id}
                      href={platform.url || "#"}
                      target={platform.url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 ${
                        !platform.url ? "cursor-default" : "hover:scale-105"
                      }`}
                      onClick={(e) => !platform.url && e.preventDefault()}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: config.color }}
                      >
                        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                          <path d={config.svgPath} />
                        </svg>
                      </div>
                      <span className="font-medium text-foreground">{platform.name}</span>
                    </a>
                  );
                })}
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-6">
                ...and many more platforms worldwide
              </p>
            </div>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && albums.length === 0 && musicVideos.length === 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto text-center py-16 card-glass rounded-2xl border border-primary/20">
                <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <Disc3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3">No Releases Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Our music releases will appear here. Check back soon for albums, singles, and music videos!
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Latest Album */}
        {!isLoading && latestAlbum && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                  Latest Release
                </span>

                <div className="card-glass rounded-3xl p-8 md:p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="relative group">
                      <div className="rounded-2xl overflow-hidden gold-glow-lg">
                        <img
                          src={latestAlbum.coverImage}
                          alt={latestAlbum.title}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/400?text=Album";
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center">
                          <Play className="w-10 h-10 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                        New Release
                      </span>
                      <h2 className="font-display text-4xl font-bold text-foreground mb-2">
                        {latestAlbum.title}
                      </h2>
                      <p className="text-muted-foreground mb-2">
                        {latestAlbum.trackCount} tracks • {latestAlbum.year}
                      </p>
                      {latestAlbum.description && (
                        <p className="text-muted-foreground mb-6">{latestAlbum.description}</p>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        {latestAlbum.listenUrl ? (
                          <Button variant="gold" size="lg" asChild>
                            <a href={latestAlbum.listenUrl} target="_blank" rel="noopener noreferrer">
                              <Play className="w-4 h-4 mr-2" />
                              Listen Now
                            </a>
                          </Button>
                        ) : (
                          <Button variant="gold" size="lg" asChild>
                            <a
                              href={`https://www.youtube.com/results?search_query=serenades+of+praise+${encodeURIComponent(latestAlbum.title)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Find on YouTube
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Albums */}
        {!isLoading && albums.length > 0 && (
          <section className="py-16 bg-charcoal">
            <div className="container mx-auto px-4">
              <h2 className="font-display text-3xl font-bold mb-10">
                All <span className="gold-text">Albums</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {albums.map((album) => (
                  <div key={album.id} className="group">
                    <div className="relative rounded-2xl overflow-hidden mb-4">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/300?text=Album";
                        }}
                      />
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {album.listenUrl ? (
                          <a
                            href={album.listenUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-full bg-gold-gradient text-primary-foreground font-semibold flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Listen
                          </a>
                        ) : (
                          <a
                            href={`https://www.youtube.com/results?search_query=serenades+of+praise+${encodeURIComponent(album.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-full bg-gold-gradient text-primary-foreground font-semibold flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Find
                          </a>
                        )}
                      </div>
                      {album.isLatest && (
                        <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                          Latest
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{album.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {album.year} • {album.trackCount} tracks
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* YouTube Section */}
        {!isLoading && musicVideos.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-display text-3xl font-bold">
                  Watch on <span className="gold-text">YouTube</span>
                </h2>
                <Button variant="outline" asChild>
                  <a
                    href="https://www.youtube.com/@theserenadesofpraisegroup"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Channel
                  </a>
                </Button>
              </div>

              {/* Featured Latest Release Video */}
              {latestVideo && (
                <div className="mb-10">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                    Latest Release
                  </span>
                  <div className="rounded-2xl overflow-hidden gold-glow-lg">
                    <iframe
                      width="100%"
                      height="500"
                      src={`https://www.youtube.com/embed/${latestVideo.youtubeId}`}
                      title={latestVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full aspect-video"
                    />
                  </div>
                </div>
              )}

              {/* Featured Videos Grid */}
              {featuredVideos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {featuredVideos.map((video) => (
                    <a
                      key={video.id}
                      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group cursor-pointer"
                    >
                      <div className="relative rounded-2xl overflow-hidden mb-4">
                        <img
                          src={
                            video.thumbnail ||
                            `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
                          }
                          alt={video.title}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{video.title}</h3>
                    </a>
                  ))}
                </div>
              )}

              {/* Other Videos */}
              {otherVideos.length > 0 && (
                <>
                  <h3 className="font-display text-xl font-semibold mb-6">More Videos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {otherVideos.map((video) => (
                      <a
                        key={video.id}
                        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group cursor-pointer"
                      >
                        <div className="relative rounded-xl overflow-hidden mb-2">
                          <img
                            src={
                              video.thumbnail ||
                              `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`
                            }
                            alt={video.title}
                            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {video.title}
                        </h4>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Spotify CTA */}
        {(albums.length > 0 || musicVideos.length > 0) && (
          <section className="py-20 bg-charcoal relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1DB954]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-sm font-semibold mb-6">
                  <Disc3 className="w-4 h-4 animate-spin" style={{ animationDuration: "3s" }} />
                  Now Streaming
                </span>

                <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                  Stream Our <span className="text-[#1DB954]">Music</span>
                </h2>

                <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                  Follow us on your favorite streaming platform to stay updated with our latest releases.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold px-8"
                    asChild
                  >
                    <a
                      href="https://open.spotify.com/user/31vkr3pk5yd5y2mpocfhibr4xbfm?si=R0-7_dXCRL2tlA84TP04TA"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                      Follow on Spotify
                    </a>
                  </Button>

                  <Button variant="gold-outline" size="lg" asChild>
                    <a
                      href="https://www.youtube.com/@theserenadesofpraisegroup"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch on YouTube
                    </a>
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-10 justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold gold-text">{albums.length}+</p>
                    <p className="text-sm text-muted-foreground">Albums</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold gold-text">
                      {albums.reduce((acc, a) => acc + a.trackCount, 0)}+
                    </p>
                    <p className="text-sm text-muted-foreground">Tracks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold gold-text">{musicVideos.length}+</p>
                    <p className="text-sm text-muted-foreground">Videos</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
