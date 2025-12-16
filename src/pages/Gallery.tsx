import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Image, Video, X } from "lucide-react";
import { useState } from "react";
import choirImage from "@/assets/choir-group.jpg";
import choirImage2 from "@/assets/choir-group2.jpg";
import choirImage3 from "@/assets/ChoirGrad.jpg";
import choirImage4 from "@/assets/ChoirGrad1.jpg";
import choirImage5 from "@/assets/ChoirLadies.jpg";
import choirImage6 from "@/assets/Choir01.jpg";
import choirImage7 from "@/assets/Choir_2.jpg";
import choirImage8 from "@/assets/Nicewed.jpg";
import choirImage9 from "@/assets/Angewed.jpg";
import choirImage10 from "@/assets/Nice2.jpg";
import choirImage11 from "@/assets/practice.jpg";
import choirImage12 from "@/assets/GraceWED1.jpeg";
import choirImage13 from "@/assets/GraceWED.jpeg";

const photos = [
  { id: 1, src: choirImage, title: "Musanze Shooting Trip", category: "Ministry" },
  { id: 2, src: choirImage2, title: "Musanze Shooting Trip", category: "Ministry" },
  { id: 3, src: choirImage3, title: "Choir Members Graduation", category: "Events" },
  { id: 4, src: choirImage4, title: "Choir Members Graduation", category: "Events" },
  { id: 5, src: choirImage5, title: "Performance - Kacyiru SDA", category: "Ministry" },
  { id: 6, src: choirImage6, title: "Performance - Kacyiru SDA", category: "Ministry" },
  { id: 7, src: choirImage7, title: "Performance - Kabeza Youth Mission", category: "Ministry" },
  { id: 8, src: choirImage8, title: "Nice's Wedding - TSC Singer", category: "Events" },
  { id: 9, src: choirImage9, title: "Ange's Wedding - TSC Singer", category: "Events" },
  { id: 10, src: choirImage10, title: "Nice's Wedding - TSC Singer", category: "Events" },
  { id: 11, src: choirImage11, title: "Practice Sessions", category: "Memories" },
  { id: 12, src: choirImage12, title: "Grace's Wedding - TSC Family", category: "Events" },
  { id: 13, src: choirImage13, title: "Grace's Wedding - TSC Family", category: "Events" },
];

const videos = [];

type ViewType = "photos" | "videos";

export default function Gallery() {
  const [view, setView] = useState<ViewType>("photos");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const photosPerPage = 9;
  const totalPages = Math.ceil(photos.length / photosPerPage);

  const paginatedPhotos = photos.slice(
    (currentPage - 1) * photosPerPage,
    currentPage * photosPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

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
                onClick={() => setView("photos")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  view === "photos"
                    ? "bg-gold-gradient text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Image className="w-5 h-5" />
                Photos
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
                Videos
              </button>
            </div>
          </div>
        </section>

        {/* Photos Grid */}
        {view === "photos" && (
          <section className="py-8 pb-20">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedImage(photo.src)}
                  >
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={photo.src}
                        alt={photo.title}
                        className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <span className="inline-block px-2 py-1 rounded bg-primary/90 text-primary-foreground text-xs font-semibold mb-2">
                          {photo.category}
                        </span>
                        <h3 className="font-semibold text-foreground">{photo.title}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Videos Grid */}
        {view === "videos" && (
          <section className="py-8 pb-20">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="group cursor-pointer">
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center">
                          <Video className="w-8 h-8 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-background/80 text-foreground text-xs font-mono">
                        {video.duration}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-foreground">{video.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Gallery preview"
              className="max-w-full max-h-[90vh] rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
