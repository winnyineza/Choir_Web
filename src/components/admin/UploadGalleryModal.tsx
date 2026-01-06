import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addGalleryItem } from "@/lib/dataService";
import { Loader2, Image, Video, Images, X, Plus, CheckCircle } from "lucide-react";

interface UploadGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UploadType = "photo" | "album" | "video";

interface AlbumPhoto {
  url: string;
  title: string;
}

export function UploadGalleryModal({ isOpen, onClose, onSuccess }: UploadGalleryModalProps) {
  const [type, setType] = useState<UploadType>("photo");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Concert");
  const [isLoading, setIsLoading] = useState(false);
  
  // Album-specific state
  const [albumName, setAlbumName] = useState("");
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([{ url: "", title: "" }]);
  const [bulkUrls, setBulkUrls] = useState("");
  const [uploadMode, setUploadMode] = useState<"individual" | "bulk">("individual");
  
  const { toast } = useToast();

  const resetForm = () => {
    setType("photo");
    setTitle("");
    setUrl("");
    setCategory("Concert");
    setAlbumName("");
    setAlbumPhotos([{ url: "", title: "" }]);
    setBulkUrls("");
    setUploadMode("individual");
  };

  const addAlbumPhoto = () => {
    setAlbumPhotos([...albumPhotos, { url: "", title: "" }]);
  };

  const removeAlbumPhoto = (index: number) => {
    if (albumPhotos.length > 1) {
      setAlbumPhotos(albumPhotos.filter((_, i) => i !== index));
    }
  };

  const updateAlbumPhoto = (index: number, field: "url" | "title", value: string) => {
    const updated = [...albumPhotos];
    updated[index][field] = value;
    setAlbumPhotos(updated);
  };

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === "photo") {
        // Single photo upload
        if (!title.trim() || !url.trim()) {
          toast({
            title: "Error",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!validateUrl(url)) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        addGalleryItem({
          type: "photo",
          title,
          url,
          thumbnail: url,
          category,
        });

        toast({
          title: "Photo Uploaded",
          description: `"${title}" has been added to the gallery.`,
        });
      } else if (type === "album") {
        // Album upload
        if (!albumName.trim()) {
          toast({
            title: "Error",
            description: "Please enter an album name.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        let photosToUpload: AlbumPhoto[] = [];

        if (uploadMode === "bulk") {
          // Parse bulk URLs
          const urls = bulkUrls
            .split(/[\n,]/)
            .map((u) => u.trim())
            .filter((u) => u.length > 0 && validateUrl(u));

          if (urls.length === 0) {
            toast({
              title: "No valid URLs",
              description: "Please enter at least one valid image URL.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          photosToUpload = urls.map((photoUrl, index) => ({
            url: photoUrl,
            title: `${albumName} - Photo ${index + 1}`,
          }));
        } else {
          // Individual photos
          const validPhotos = albumPhotos.filter((p) => p.url.trim() && validateUrl(p.url));

          if (validPhotos.length === 0) {
            toast({
              title: "No valid photos",
              description: "Please add at least one photo with a valid URL.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          photosToUpload = validPhotos.map((photo, index) => ({
            url: photo.url,
            title: photo.title.trim() || `${albumName} - Photo ${index + 1}`,
          }));
        }

        // Add all photos to gallery
        for (const photo of photosToUpload) {
          addGalleryItem({
            type: "photo",
            title: photo.title,
            url: photo.url,
            thumbnail: photo.url,
            category: `${category} | ${albumName}`,
          });
        }

        toast({
          title: "Album Uploaded! 🎉",
          description: `${photosToUpload.length} photos added to "${albumName}".`,
        });
      } else if (type === "video") {
        // Video upload
        if (!title.trim() || !url.trim()) {
          toast({
            title: "Error",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!validateUrl(url)) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Extract YouTube thumbnail
        let thumbnail = url;
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          const videoId = url.match(
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
          )?.[1];
          if (videoId) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }

        addGalleryItem({
          type: "video",
          title,
          url,
          thumbnail,
          category,
        });

        toast({
          title: "Video Added",
          description: `"${title}" has been added to the gallery.`,
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text">
            Upload to Gallery
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Type Selection */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setType("photo")}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                type === "photo"
                  ? "border-primary bg-primary/10"
                  : "border-primary/20 hover:border-primary/40"
              }`}
            >
              <Image
                className={`w-6 h-6 ${type === "photo" ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs font-medium ${type === "photo" ? "text-primary" : "text-muted-foreground"}`}
              >
                Single Photo
              </span>
            </button>
            <button
              type="button"
              onClick={() => setType("album")}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                type === "album"
                  ? "border-primary bg-primary/10"
                  : "border-primary/20 hover:border-primary/40"
              }`}
            >
              <Images
                className={`w-6 h-6 ${type === "album" ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs font-medium ${type === "album" ? "text-primary" : "text-muted-foreground"}`}
              >
                Album
              </span>
            </button>
            <button
              type="button"
              onClick={() => setType("video")}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                type === "video"
                  ? "border-primary bg-primary/10"
                  : "border-primary/20 hover:border-primary/40"
              }`}
            >
              <Video
                className={`w-6 h-6 ${type === "video" ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs font-medium ${type === "video" ? "text-primary" : "text-muted-foreground"}`}
              >
                Video
              </span>
            </button>
          </div>

          {/* Single Photo Form */}
          {type === "photo" && (
            <>
              <div>
                <Label htmlFor="title">Photo Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this photo"
                  className="mt-1 bg-secondary border-primary/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="url">Image URL *</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 bg-secondary border-primary/20"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a direct link to the image
                </p>
              </div>
            </>
          )}

          {/* Album Form */}
          {type === "album" && (
            <>
              <div>
                <Label htmlFor="albumName">Album Name *</Label>
                <Input
                  id="albumName"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="e.g., Easter Concert 2025"
                  className="mt-1 bg-secondary border-primary/20"
                  required
                />
              </div>

              {/* Upload Mode Toggle */}
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUploadMode("individual")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    uploadMode === "individual"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Individual Photos
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("bulk")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    uploadMode === "bulk"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bulk URLs
                </button>
              </div>

              {uploadMode === "individual" ? (
                <div className="space-y-3">
                  <Label>Photos</Label>
                  {albumPhotos.map((photo, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={photo.url}
                          onChange={(e) => updateAlbumPhoto(index, "url", e.target.value)}
                          placeholder="Image URL"
                          className="bg-secondary border-primary/20"
                        />
                        <Input
                          value={photo.title}
                          onChange={(e) => updateAlbumPhoto(index, "title", e.target.value)}
                          placeholder={`Photo title (optional)`}
                          className="bg-secondary border-primary/20 h-8 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeAlbumPhoto(index)}
                        disabled={albumPhotos.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAlbumPhoto}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Photo
                  </Button>
                </div>
              ) : (
                <div>
                  <Label htmlFor="bulkUrls">Paste Image URLs</Label>
                  <Textarea
                    id="bulkUrls"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    placeholder="Paste multiple image URLs here (one per line or comma-separated)

https://example.com/image1.jpg
https://example.com/image2.jpg
https://example.com/image3.jpg"
                    className="mt-1 bg-secondary border-primary/20 min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste multiple URLs separated by new lines or commas
                  </p>
                  {bulkUrls && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {bulkUrls.split(/[\n,]/).filter((u) => u.trim() && validateUrl(u.trim())).length}{" "}
                      valid URLs detected
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Video Form */}
          {type === "video" && (
            <>
              <div>
                <Label htmlFor="videoTitle">Video Title *</Label>
                <Input
                  id="videoTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this video"
                  className="mt-1 bg-secondary border-primary/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="videoUrl">YouTube URL *</Label>
                <Input
                  id="videoUrl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-1 bg-secondary border-primary/20"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a YouTube video URL
                </p>
              </div>
            </>
          )}

          {/* Category (shown for all types) */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Concert">Concert</SelectItem>
                <SelectItem value="Rehearsal">Rehearsal</SelectItem>
                <SelectItem value="Ministry Trip">Ministry Trip</SelectItem>
                <SelectItem value="Fellowship">Fellowship</SelectItem>
                <SelectItem value="Special Event">Special Event</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : type === "album" ? (
                <>
                  <Images className="w-4 h-4 mr-2" />
                  Upload Album
                </>
              ) : (
                "Add to Gallery"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
