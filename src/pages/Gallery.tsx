import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Image, 
  Video, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Images,
  ArrowLeft,
  Grid3X3,
  LayoutGrid
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getAllGalleryItems } from "@/lib/dataService";

interface Photo {
  id: string;
  src: string;
  title: string;
  category: string;
  album?: string;
}

interface Album {
  name: string;
  coverImage: string;
  photoCount: number;
  photos: Photo[];
}

interface VideoItem {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  duration?: string;
  category: string;
}

// No hardcoded defaults - all content comes from admin panel

type ViewType = "photos" | "videos";
type PhotoViewMode = "albums" | "all";

export default function Gallery() {
  useDocumentTitle("Gallery");
  const [view, setView] = useState<ViewType>("photos");
  const [photoViewMode, setPhotoViewMode] = useState<PhotoViewMode>("albums");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load gallery from dataService (admin-managed content only)
  useEffect(() => {
    const loadGallery = () => {
      const galleryItems = getAllGalleryItems();
      
      // Process gallery items into albums and videos
      const photoItems = galleryItems.filter((item) => item.type === "photo");
      const videoItems = galleryItems.filter((item) => item.type === "video");

      // Group photos by album (extracted from category)
      const albumMap = new Map<string, Photo[]>();
      
      photoItems.forEach((item) => {
        // Category format: "Category | AlbumName" or just "Category"
        const parts = item.category.split(" | ");
        const albumName = parts.length > 1 ? parts[1] : parts[0];
        
        const photo: Photo = {
          id: item.id,
          src: item.url,
          title: item.title,
          category: parts[0],
          album: albumName,
        };
        
        if (!albumMap.has(albumName)) {
          albumMap.set(albumName, []);
        }
        albumMap.get(albumName)!.push(photo);
      });

      // Convert to albums array
      const processedAlbums: Album[] = Array.from(albumMap.entries()).map(([name, photos]) => ({
        name,
        coverImage: photos[0]?.src || "",
        photoCount: photos.length,
        photos,
      }));
      
      // Process videos from gallery
      const processedVideos: VideoItem[] = videoItems.map((item) => {
        // Extract YouTube video ID
        const videoId = item.url.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        )?.[1] || "";
        
        return {
          id: item.id,
          title: item.title,
          videoId,
          thumbnail: item.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          category: item.category,
        };
      });

      setAlbums(processedAlbums);
      setVideos(processedVideos);
      setAllPhotos(processedAlbums.flatMap((a) => a.photos));
      setIsLoading(false);
    };

    loadGallery();

    // Listen for updates
    window.addEventListener("storage", loadGallery);
    return () => window.removeEventListener("storage", loadGallery);
  }, []);

  // Get current photos based on view mode
  const currentPhotos = selectedAlbum ? selectedAlbum.photos : allPhotos;

  const handlePrevImage = useCallback(() => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  const handleNextImage = useCallback(() => {
    if (selectedImageIndex !== null && selectedImageIndex < currentPhotos.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, currentPhotos.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "Escape") setSelectedImageIndex(null);
    },
    [selectedImageIndex, handlePrevImage, handleNextImage]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const totalPhotos = allPhotos.length;

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
                Media
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Our <span className="gold-text">Gallery</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Capturing moments of praise, fellowship, and ministry
              </p>
            </div>
          </div>
        </section>

        {/* Restriction Notice */}
        <section className="py-6 bg-primary/10 border-y border-primary/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 text-center">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">Image Usage Notice:</span> All photos and videos are the property of Serenades of Praise Choir. Please request permission before using any media.
              </p>
            </div>
          </div>
        </section>

        {/* View Toggle */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setView("photos");
                  setSelectedAlbum(null);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  view === "photos"
                    ? "bg-gold-gradient text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Image className="w-5 h-5" />
                Photos ({totalPhotos})
              </button>
              <button
                onClick={() => setView("videos")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  view === "videos"
                    ? "bg-gold-gradient text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Video className="w-5 h-5" />
                Videos ({videos.length})
              </button>
            </div>
          </div>
        </section>

        {/* Photos Section */}
        {view === "photos" && (
          <section className="py-8 pb-20">
            <div className="container mx-auto px-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-24">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Empty State */}
              {!isLoading && albums.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center card-glass rounded-2xl border border-primary/20">
                  <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Images className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-3">No Photos Yet</h3>
                  <p className="max-w-md text-muted-foreground mb-6">
                    Our gallery is being updated. Check back soon for photos from our concerts, ministry trips, and special events!
                  </p>
                </div>
              )}

              {/* Sub-navigation for photos */}
              {!isLoading && albums.length > 0 && !selectedAlbum && (
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display text-2xl font-semibold">
                    {photoViewMode === "albums" ? "Albums" : "All Photos"}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant={photoViewMode === "albums" ? "gold" : "outline"}
                      size="sm"
                      onClick={() => setPhotoViewMode("albums")}
                    >
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      Albums
                    </Button>
                    <Button
                      variant={photoViewMode === "all" ? "gold" : "outline"}
                      size="sm"
                      onClick={() => setPhotoViewMode("all")}
                    >
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      All Photos
                    </Button>
                  </div>
                </div>
              )}

              {/* Album View */}
              {!isLoading && albums.length > 0 && !selectedAlbum && photoViewMode === "albums" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {albums.map((album) => (
                    <div
                      key={album.name}
                      className="group cursor-pointer"
                      onClick={() => setSelectedAlbum(album)}
                    >
                      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-secondary">
                        {/* Album Cover with Stack Effect */}
                        <div className="absolute inset-0">
                          {/* Background cards for stack effect */}
                          <div className="absolute top-2 left-2 right-2 bottom-0 bg-primary/20 rounded-xl transform rotate-2" />
                          <div className="absolute top-1 left-1 right-1 bottom-0 bg-primary/10 rounded-xl transform -rotate-1" />
                          
                          {/* Main cover image */}
                          <img
                            src={album.coverImage}
                            alt={album.name}
                            className="absolute inset-0 w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Album";
                            }}
                          />
                        </div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 rounded-xl" />

                        {/* Album Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <Images className="w-5 h-5 text-primary" />
                            <span className="text-sm text-primary font-medium">
                              {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                            </span>
                          </div>
                          <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                            {album.name}
                          </h3>
                        </div>

                        {/* Hover indicator */}
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
                          <ChevronRight className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Photos Grid View */}
              {!isLoading && allPhotos.length > 0 && !selectedAlbum && photoViewMode === "all" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group cursor-pointer"
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <div className="relative rounded-xl overflow-hidden aspect-square">
                        <img
                          src={photo.src}
                          alt={photo.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Photo";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-sm font-medium text-foreground truncate">{photo.title}</p>
                          {photo.album && (
                            <p className="text-xs text-muted-foreground">{photo.album}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Album View */}
              {selectedAlbum && (
                <div>
                  {/* Album Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedAlbum(null)}
                      className="shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                      <h2 className="font-display text-2xl font-semibold">{selectedAlbum.name}</h2>
                      <p className="text-muted-foreground">
                        {selectedAlbum.photoCount} {selectedAlbum.photoCount === 1 ? "photo" : "photos"}
                      </p>
                    </div>
                  </div>

                  {/* Album Photos Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedAlbum.photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="group cursor-pointer"
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <div className="relative rounded-xl overflow-hidden aspect-square">
                          <img
                            src={photo.src}
                            alt={photo.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Photo";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-sm font-medium text-foreground truncate">{photo.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Videos Grid */}
        {view === "videos" && (
          <section className="py-8 pb-20">
            <div className="container mx-auto px-4">
              {/* Empty State for Videos */}
              {videos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center card-glass rounded-2xl border border-primary/20">
                  <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Video className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-3">No Videos Yet</h3>
                  <p className="max-w-md text-muted-foreground mb-6">
                    Videos from our performances and music releases will appear here. Check back soon!
                  </p>
                </div>
              )}

              {videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/640x360?text=Video";
                        }}
                      />
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary-foreground ml-1" />
                        </div>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-background/80 text-foreground text-xs font-mono">
                          {video.duration}
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-2 py-1 rounded bg-primary/90 text-primary-foreground text-xs font-semibold">
                          {video.category}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </section>
        )}

        {/* Photo Lightbox */}
        {selectedImageIndex !== null && (
          <div
            className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors z-10"
              onClick={() => setSelectedImageIndex(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous button */}
            {selectedImageIndex > 0 && (
              <button
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next button */}
            {selectedImageIndex < currentPhotos.length - 1 && (
              <button
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="max-w-5xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={currentPhotos[selectedImageIndex].src}
                alt={currentPhotos[selectedImageIndex].title}
                className="max-w-full max-h-[85vh] rounded-2xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600?text=Image+Not+Found";
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent rounded-b-2xl">
                <h3 className="font-semibold text-foreground text-lg">
                  {currentPhotos[selectedImageIndex].title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedImageIndex + 1} of {currentPhotos.length}
                  {currentPhotos[selectedImageIndex].album && (
                    <span className="ml-2">• {currentPhotos[selectedImageIndex].album}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors z-10"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-2xl overflow-hidden">
                <iframe
                  width="100%"
                  height="500"
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {selectedVideo.title}
                </h3>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
