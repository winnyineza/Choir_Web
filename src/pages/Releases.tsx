import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, ShoppingCart, Disc3 } from "lucide-react";

const albums = [
  {
    id: 1,
    title: "Warakoze Mukiza",
    year: "2025",
    cover: "https://img.youtube.com/vi/MIxvjxty1Nw/maxresdefault.jpg",
    tracks: 12,
    price: "10,000 RWF",
    isLatest: true,
  },
];

const youtubeVideos = [
  {
    id: 1,
    title: "Beulah",
    videoId: "Pzgvo9oSPn0",
    isLatest: true,
    isMostViewed: false,
  },
  {
    id: 2,
    title: "Warakoze Mukiza",
    videoId: "MIxvjxty1Nw",
    isLatest: false,
    isMostViewed: true,
  },
  {
    id: 3,
    title: "Ntabaza Yesu | I Must Tell Jesus",
    videoId: "Jwql9oVctsU",
    isLatest: false,
    isMostViewed: false,
  },
  {
    id: 4,
    title: "Yesu Araje",
    videoId: "jTUK35n6Kk4",
    isLatest: false,
    isMostViewed: false,
  },
];

export default function Releases() {
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
                Music
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Our <span className="gold-text">Releases</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Listen to our albums, buy our music, and support the ministry
              </p>
            </div>
          </div>
        </section>

        {/* Latest Album */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                Latest Release
              </span>
              
              {albums.filter(a => a.isLatest).map((album) => (
                <div key={album.id} className="card-glass rounded-3xl p-8 md:p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="relative group">
                      <div className="rounded-2xl overflow-hidden gold-glow-lg">
                        <img
                          src={album.cover}
                          alt={album.title}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
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
                        {album.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {album.tracks} tracks • {album.year}
                      </p>
                      <p className="text-3xl font-bold gold-text mb-8">{album.price}</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="gold" size="lg">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Album
                        </Button>
                        <Button variant="gold-outline" size="lg">
                          <Play className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Albums */}
        <section className="py-16 bg-charcoal">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl font-bold mb-10">
              All <span className="gold-text">Albums</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <div key={album.id} className="group cursor-pointer">
                  <div className="relative rounded-2xl overflow-hidden mb-4">
                    <img
                      src={album.cover}
                      alt={album.title}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{album.title}</h3>
                  <p className="text-sm text-muted-foreground">{album.year} • {album.tracks} tracks</p>
                  <p className="text-primary font-semibold mt-1">{album.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* YouTube Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-display text-3xl font-bold">
                Watch on <span className="gold-text">YouTube</span>
              </h2>
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Channel
              </Button>
            </div>

            {/* Featured Latest Release */}
            {youtubeVideos.filter(v => v.isLatest).map((video) => (
              <div key={video.id} className="mb-10">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                  Latest Release
                </span>
                <div className="rounded-2xl overflow-hidden gold-glow-lg">
                  <iframe
                    width="100%"
                    height="500"
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full aspect-video"
                  />
                </div>
              </div>
            ))}

            {/* Other Videos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {youtubeVideos.filter(v => !v.isLatest).map((video) => (
                <a 
                  key={video.id} 
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-2xl overflow-hidden mb-4">
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                      alt={video.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
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
          </div>
        </section>

        {/* Spotify CTA */}
        <section className="py-20 bg-charcoal relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1DB954]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* Album Art Grid */}
                <div className="relative">
                  <div className="grid grid-cols-2 gap-4">
                    {albums.slice(0, 2).map((album, index) => (
                      <div 
                        key={album.id} 
                        className={`rounded-2xl overflow-hidden shadow-2xl transform ${index === 0 ? 'translate-y-4' : '-translate-y-4'} hover:scale-105 transition-transform duration-500`}
                      >
                        <img
                          src={album.cover}
                          alt={album.title}
                          className="w-full aspect-square object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {/* Floating Spotify badge */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#1DB954] rounded-full p-4 shadow-lg shadow-[#1DB954]/30 animate-bounce" style={{ animationDuration: "2s" }}>
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                </div>

                {/* CTA Content */}
                <div className="text-center lg:text-left">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-sm font-semibold mb-6">
                    <Disc3 className="w-4 h-4 animate-spin" style={{ animationDuration: "3s" }} />
                    Now Streaming
                  </span>
                  
                  <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                    Listen on <span className="text-[#1DB954]">Spotify</span>
                  </h2>
                  
                  <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                    Stream our full catalog anytime, anywhere. Follow us on Spotify to stay updated with our latest releases and worship music.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
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
                  <div className="flex gap-8 mt-10 justify-center lg:justify-start">
                    <div className="text-center">
                      <p className="text-2xl font-bold gold-text">{albums.length}+</p>
                      <p className="text-sm text-muted-foreground">Albums</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold gold-text">{albums.reduce((acc, a) => acc + a.tracks, 0)}+</p>
                      <p className="text-sm text-muted-foreground">Tracks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold gold-text">{youtubeVideos.length}+</p>
                      <p className="text-sm text-muted-foreground">Videos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}