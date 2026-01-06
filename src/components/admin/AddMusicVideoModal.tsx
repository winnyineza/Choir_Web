import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  addMusicVideo,
  updateMusicVideo,
  extractYouTubeId,
  getAllAlbums,
  type MusicVideo,
  type Album,
} from "@/lib/releaseService";
import { Loader2, Video, ExternalLink } from "lucide-react";

interface AddMusicVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editVideo?: MusicVideo | null;
}

export function AddMusicVideoModal({
  isOpen,
  onClose,
  onSuccess,
  editVideo,
}: AddMusicVideoModalProps) {
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [albumId, setAlbumId] = useState<string>("");
  const [releaseDate, setReleaseDate] = useState("");
  const [isLatest, setIsLatest] = useState(false);
  const [isFeatured, setIsFeatured] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setAlbums(getAllAlbums());
  }, [isOpen]);

  useEffect(() => {
    if (editVideo) {
      setTitle(editVideo.title);
      setYoutubeUrl(`https://youtube.com/watch?v=${editVideo.youtubeId}`);
      setYoutubeId(editVideo.youtubeId);
      setAlbumId(editVideo.albumId || "");
      setReleaseDate(editVideo.releaseDate || "");
      setIsLatest(editVideo.isLatest);
      setIsFeatured(editVideo.isFeatured);
    } else {
      resetForm();
    }
  }, [editVideo, isOpen]);

  const resetForm = () => {
    setTitle("");
    setYoutubeUrl("");
    setYoutubeId("");
    setAlbumId("");
    setReleaseDate("");
    setIsLatest(false);
    setIsFeatured(true);
  };

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const id = extractYouTubeId(url);
    if (id) {
      setYoutubeId(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video title.",
        variant: "destructive",
      });
      return;
    }

    if (!youtubeId) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube video URL or ID.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const videoData = {
        title,
        youtubeId,
        albumId: albumId || undefined,
        releaseDate: releaseDate || undefined,
        isLatest,
        isFeatured,
      };

      if (editVideo) {
        updateMusicVideo(editVideo.id, videoData);
        toast({
          title: "Video Updated",
          description: `"${title}" has been updated.`,
        });
      } else {
        addMusicVideo(videoData);
        toast({
          title: "Music Video Added! 🎬",
          description: `"${title}" has been added to releases.`,
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
          <DialogTitle className="font-display text-xl gold-text flex items-center gap-2">
            <Video className="w-5 h-5" />
            {editVideo ? "Edit Music Video" : "Add Music Video"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Video Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Beulah - Official Music Video"
              className="mt-1 bg-secondary border-primary/20"
              required
            />
          </div>

          <div>
            <Label htmlFor="youtubeUrl">YouTube URL or Video ID *</Label>
            <Input
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => handleYoutubeUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or video ID"
              className="mt-1 bg-secondary border-primary/20"
              required
            />
            {youtubeId && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <span>✓ Video ID: {youtubeId}</span>
                  <a
                    href={`https://youtube.com/watch?v=${youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="rounded-lg overflow-hidden aspect-video max-w-[200px]">
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {albums.length > 0 && (
            <div>
              <Label htmlFor="albumId">Link to Album (Optional)</Label>
              <Select value={albumId} onValueChange={setAlbumId}>
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue placeholder="Select an album" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No album</SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title} ({album.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="releaseDate">Release Date (Optional)</Label>
            <Input
              id="releaseDate"
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="mt-1 bg-secondary border-primary/20"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <Label htmlFor="isLatest" className="font-medium">Mark as Latest Release</Label>
                <p className="text-sm text-muted-foreground">
                  Featured at the top of the page
                </p>
              </div>
              <Switch
                id="isLatest"
                checked={isLatest}
                onCheckedChange={setIsLatest}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <Label htmlFor="isFeatured" className="font-medium">Featured Video</Label>
                <p className="text-sm text-muted-foreground">
                  Show in featured videos section
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editVideo ? (
                "Update Video"
              ) : (
                "Add Video"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

