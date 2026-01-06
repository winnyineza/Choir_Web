import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addAlbum, updateAlbum, type Album } from "@/lib/releaseService";
import { Loader2, Disc3, Youtube, Link } from "lucide-react";

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAlbum?: Album | null;
}

export function AddAlbumModal({ isOpen, onClose, onSuccess, editAlbum }: AddAlbumModalProps) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [coverImage, setCoverImage] = useState("");
  const [trackCount, setTrackCount] = useState(10);
  const [description, setDescription] = useState("");
  const [listenUrl, setListenUrl] = useState("");
  const [isLatest, setIsLatest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editAlbum) {
      setTitle(editAlbum.title);
      setYear(editAlbum.year);
      setCoverImage(editAlbum.coverImage);
      setTrackCount(editAlbum.trackCount);
      setDescription(editAlbum.description || "");
      setListenUrl(editAlbum.listenUrl || "");
      setIsLatest(editAlbum.isLatest);
    } else {
      resetForm();
    }
  }, [editAlbum, isOpen]);

  const resetForm = () => {
    setTitle("");
    setYear(new Date().getFullYear().toString());
    setCoverImage("");
    setTrackCount(10);
    setDescription("");
    setListenUrl("");
    setIsLatest(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !coverImage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and cover image URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const albumData = {
        title,
        year,
        coverImage,
        trackCount,
        description: description || undefined,
        listenUrl: listenUrl || undefined,
        isLatest,
      };

      if (editAlbum) {
        updateAlbum(editAlbum.id, albumData);
        toast({
          title: "Album Updated",
          description: `"${title}" has been updated.`,
        });
      } else {
        addAlbum(albumData);
        toast({
          title: "Album Added! 🎵",
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

  // Check if URL is a YouTube link
  const isYouTubeUrl = listenUrl.includes("youtube.com") || listenUrl.includes("youtu.be");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text flex items-center gap-2">
            <Disc3 className="w-5 h-5" />
            {editAlbum ? "Edit Album" : "Add New Album"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Album Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Warakoze Mukiza"
              className="mt-1 bg-secondary border-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Release Year</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2025"
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="trackCount">Number of Tracks</Label>
              <Input
                id="trackCount"
                type="number"
                value={trackCount}
                onChange={(e) => setTrackCount(parseInt(e.target.value) || 0)}
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="coverImage">Cover Image URL *</Label>
            <Input
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/album-cover.jpg"
              className="mt-1 bg-secondary border-primary/20"
              required
            />
            {coverImage && (
              <div className="mt-2 rounded-lg overflow-hidden w-24 h-24">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/100?text=Invalid";
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="listenUrl" className="flex items-center gap-2">
              {isYouTubeUrl ? <Youtube className="w-4 h-4 text-red-500" /> : <Link className="w-4 h-4" />}
              Listen Link
            </Label>
            <Input
              id="listenUrl"
              value={listenUrl}
              onChange={(e) => setListenUrl(e.target.value)}
              placeholder="YouTube playlist URL or any streaming link"
              className="mt-1 bg-secondary border-primary/20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add a YouTube playlist, channel, or any link where people can listen
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the album..."
              className="mt-1 bg-secondary border-primary/20"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <Label htmlFor="isLatest" className="font-medium">Mark as Latest Release</Label>
              <p className="text-sm text-muted-foreground">
                This album will be featured prominently
              </p>
            </div>
            <Switch
              id="isLatest"
              checked={isLatest}
              onCheckedChange={setIsLatest}
            />
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
              ) : editAlbum ? (
                "Update Album"
              ) : (
                "Add Album"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
