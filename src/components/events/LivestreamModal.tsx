import { X, ExternalLink, Users, Share2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Event } from "@/lib/dataService";

interface LivestreamModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function LivestreamModal({ event, isOpen, onClose }: LivestreamModalProps) {
  const videoId = event.livestreamUrl ? getYouTubeVideoId(event.livestreamUrl) : null;

  const handleShare = async () => {
    const shareData = {
      title: `Watch Live: ${event.title}`,
      text: `Join us for ${event.title} - streaming live now! 🎵`,
      url: event.livestreamUrl || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
    }
  };

  const handleOpenInYouTube = () => {
    if (event.livestreamUrl) {
      window.open(event.livestreamUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-charcoal border-primary/20 p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <DialogTitle className="font-display text-xl text-foreground">
                {event.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={event.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-white/80 mb-4">Unable to load video player</p>
                <Button variant="outline" onClick={handleOpenInYouTube}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in YouTube
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stream Info & Actions */}
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {event.location} • {event.date} at {event.time}
              </p>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInYouTube}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in YouTube
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

