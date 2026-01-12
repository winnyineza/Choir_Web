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
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllAlbums,
  addAlbum,
  updateAlbum,
  deleteAlbum,
  getAllMusicVideos,
  addMusicVideo,
  updateMusicVideo,
  deleteMusicVideo,
  getAllPlatforms,
  updateAllPlatforms,
  extractYouTubeId,
  getReleaseStats,
  type Album,
  type MusicVideo,
  type StreamingPlatform,
} from "@/lib/releaseService";
import { addAuditLog } from "@/lib/adminService";
import { cn } from "@/lib/utils";
import {
  Disc3,
  Video,
  Music,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  Play,
  Search,
  Settings,
  Eye,
  EyeOff,
  Link,
  Globe,
} from "lucide-react";

export function MusicReleasesManagement() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>([]);
  const [activeTab, setActiveTab] = useState<"albums" | "videos" | "platforms">("albums");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<MusicVideo | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Form states
  const [albumForm, setAlbumForm] = useState({
    title: "",
    year: new Date().getFullYear().toString(),
    coverImage: "",
    trackCount: 10,
    description: "",
    listenUrl: "",
    isLatest: false,
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    youtubeId: "",
    albumId: "",
    isLatest: false,
    isFeatured: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAlbums(getAllAlbums());
    setMusicVideos(getAllMusicVideos());
    setPlatforms(getAllPlatforms());
  };

  const stats = getReleaseStats();

  // Filter items
  const filteredAlbums = albums.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVideos = musicVideos.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Album handlers
  const handleAlbumSubmit = () => {
    if (!albumForm.title || !albumForm.year) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedAlbum) {
      updateAlbum(selectedAlbum.id, albumForm);
      if (currentUser) {
        addAuditLog(currentUser, "UPDATE_ALBUM", `Updated album: ${albumForm.title}`);
      }
      toast({ title: "Album Updated", description: "Album has been updated." });
    } else {
      addAlbum(albumForm);
      if (currentUser) {
        addAuditLog(currentUser, "CREATE_ALBUM", `Added album: ${albumForm.title}`);
      }
      toast({ title: "Album Added", description: "Album has been added." });
    }

    loadData();
    setShowAlbumModal(false);
    resetAlbumForm();
  };

  const handleAlbumDelete = (id: string) => {
    if (!confirm("Delete this album?")) return;
    const album = albums.find(a => a.id === id);
    deleteAlbum(id);
    if (currentUser && album) {
      addAuditLog(currentUser, "DELETE_ALBUM", `Deleted album: ${album.title}`);
    }
    toast({ title: "Album Deleted", description: "Album has been deleted." });
    loadData();
  };

  const openAlbumEdit = (album: Album) => {
    setSelectedAlbum(album);
    setAlbumForm({
      title: album.title,
      year: album.year,
      coverImage: album.coverImage,
      trackCount: album.trackCount,
      description: album.description || "",
      listenUrl: album.listenUrl || "",
      isLatest: album.isLatest,
    });
    setShowAlbumModal(true);
  };

  const resetAlbumForm = () => {
    setSelectedAlbum(null);
    setAlbumForm({
      title: "",
      year: new Date().getFullYear().toString(),
      coverImage: "",
      trackCount: 10,
      description: "",
      listenUrl: "",
      isLatest: false,
    });
  };

  // Video handlers
  const handleVideoSubmit = () => {
    if (!videoForm.title || !videoForm.youtubeId) {
      toast({
        title: "Error",
        description: "Please fill in title and YouTube ID",
        variant: "destructive",
      });
      return;
    }

    // Extract ID if full URL was pasted
    const youtubeId = extractYouTubeId(videoForm.youtubeId) || videoForm.youtubeId;

    if (selectedVideo) {
      updateMusicVideo(selectedVideo.id, { ...videoForm, youtubeId });
      if (currentUser) {
        addAuditLog(currentUser, "UPDATE_VIDEO", `Updated music video: ${videoForm.title}`);
      }
      toast({ title: "Video Updated", description: "Music video has been updated." });
    } else {
      addMusicVideo({ ...videoForm, youtubeId });
      if (currentUser) {
        addAuditLog(currentUser, "CREATE_VIDEO", `Added music video: ${videoForm.title}`);
      }
      toast({ title: "Video Added", description: "Music video has been added." });
    }

    loadData();
    setShowVideoModal(false);
    resetVideoForm();
  };

  const handleVideoDelete = (id: string) => {
    if (!confirm("Delete this video?")) return;
    const video = musicVideos.find(v => v.id === id);
    deleteMusicVideo(id);
    if (currentUser && video) {
      addAuditLog(currentUser, "DELETE_VIDEO", `Deleted music video: ${video.title}`);
    }
    toast({ title: "Video Deleted", description: "Music video has been deleted." });
    loadData();
  };

  const openVideoEdit = (video: MusicVideo) => {
    setSelectedVideo(video);
    setVideoForm({
      title: video.title,
      youtubeId: video.youtubeId,
      albumId: video.albumId || "",
      isLatest: video.isLatest,
      isFeatured: video.isFeatured,
    });
    setShowVideoModal(true);
  };

  const resetVideoForm = () => {
    setSelectedVideo(null);
    setVideoForm({
      title: "",
      youtubeId: "",
      albumId: "",
      isLatest: false,
      isFeatured: false,
    });
  };

  // Platform handlers
  const handlePlatformToggle = (id: string, isVisible: boolean) => {
    const updated = platforms.map(p =>
      p.id === id ? { ...p, isVisible } : p
    );
    setPlatforms(updated);
    updateAllPlatforms(updated);
  };

  const handlePlatformUrlChange = (id: string, url: string) => {
    const updated = platforms.map(p =>
      p.id === id ? { ...p, url } : p
    );
    setPlatforms(updated);
    updateAllPlatforms(updated);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Disc3 className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{stats.totalAlbums}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Albums</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Video className="w-4 h-4 text-purple-400" />
            <span className="text-xl font-bold">{stats.totalVideos}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Music Videos</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Music className="w-4 h-4 text-blue-400" />
            <span className="text-xl font-bold">{stats.totalTracks}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Tracks</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold truncate">{stats.latestAlbum}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Latest Album</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Play className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold truncate">{stats.latestVideo}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Latest Video</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
        {[
          { id: "albums", label: "Albums", icon: Disc3 },
          { id: "videos", label: "Music Videos", icon: Video },
          { id: "platforms", label: "Streaming Platforms", icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      {activeTab !== "platforms" && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>
          <Button
            variant="gold"
            onClick={() => activeTab === "albums" ? setShowAlbumModal(true) : setShowVideoModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === "albums" ? "Album" : "Video"}
          </Button>
        </div>
      )}

      {/* Albums Tab */}
      {activeTab === "albums" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlbums.length === 0 ? (
            <div className="col-span-full card-glass rounded-xl p-8 text-center">
              <Disc3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No albums found</p>
            </div>
          ) : (
            filteredAlbums.map((album) => (
              <div key={album.id} className="card-glass rounded-xl overflow-hidden group">
                <div className="aspect-square relative">
                  {album.coverImage ? (
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-charcoal flex items-center justify-center">
                      <Disc3 className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  {album.isLatest && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      Latest
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openAlbumEdit(album)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAlbumDelete(album.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {album.listenUrl && (
                      <Button variant="secondary" size="sm" asChild>
                        <a href={album.listenUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{album.title}</h3>
                  <p className="text-sm text-muted-foreground">{album.year} • {album.trackCount} tracks</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === "videos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.length === 0 ? (
            <div className="col-span-full card-glass rounded-xl p-8 text-center">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No music videos found</p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div key={video.id} className="card-glass rounded-xl overflow-hidden group">
                <div className="aspect-video relative">
                  <img
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1">
                    {video.isLatest && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                        Latest
                      </span>
                    )}
                    {video.isFeatured && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/80 text-black">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openVideoEdit(video)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleVideoDelete(video.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <a href={`https://youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {albums.find(a => a.id === video.albumId)?.title || "Single"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Platforms Tab */}
      {activeTab === "platforms" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure where your music is available. These links will be shown on the public website.
          </p>
          <div className="card-glass rounded-xl divide-y divide-primary/10">
            {platforms.map((platform) => (
              <div key={platform.id} className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Globe className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{platform.name}</p>
                    <Input
                      value={platform.url}
                      onChange={(e) => handlePlatformUrlChange(platform.id, e.target.value)}
                      placeholder={`https://${platform.name.toLowerCase().replace(" ", "")}.com/artist/...`}
                      className="mt-1 bg-secondary text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {platform.isVisible ? (
                    <Eye className="w-4 h-4 text-green-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={platform.isVisible}
                    onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Album Modal */}
      <Dialog open={showAlbumModal} onOpenChange={(open) => { if (!open) { setShowAlbumModal(false); resetAlbumForm(); } }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">
              {selectedAlbum ? "Edit Album" : "Add Album"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Album Title *</Label>
              <Input
                value={albumForm.title}
                onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                placeholder="Album title"
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Year *</Label>
                <Input
                  value={albumForm.year}
                  onChange={(e) => setAlbumForm({ ...albumForm, year: e.target.value })}
                  placeholder="2025"
                  className="mt-1 bg-secondary"
                />
              </div>
              <div>
                <Label>Track Count</Label>
                <Input
                  type="number"
                  value={albumForm.trackCount}
                  onChange={(e) => setAlbumForm({ ...albumForm, trackCount: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div>
              <Label>Cover Image URL</Label>
              <Input
                value={albumForm.coverImage}
                onChange={(e) => setAlbumForm({ ...albumForm, coverImage: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>Listen URL (Spotify, YouTube, etc.)</Label>
              <Input
                value={albumForm.listenUrl}
                onChange={(e) => setAlbumForm({ ...albumForm, listenUrl: e.target.value })}
                placeholder="https://spotify.com/album/..."
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                placeholder="Brief description of the album"
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={albumForm.isLatest}
                onCheckedChange={(checked) => setAlbumForm({ ...albumForm, isLatest: checked })}
              />
              <Label>Mark as Latest Release</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAlbumModal(false); resetAlbumForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleAlbumSubmit}>
                {selectedAlbum ? "Update" : "Add"} Album
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={(open) => { if (!open) { setShowVideoModal(false); resetVideoForm(); } }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">
              {selectedVideo ? "Edit Music Video" : "Add Music Video"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Video Title *</Label>
              <Input
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                placeholder="Song name"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>YouTube Video ID or URL *</Label>
              <Input
                value={videoForm.youtubeId}
                onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                placeholder="dQw4w9WgXcQ or full YouTube URL"
                className="mt-1 bg-secondary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can paste a full YouTube URL and we'll extract the ID
              </p>
            </div>

            <div>
              <Label>Album (Optional)</Label>
              <select
                value={videoForm.albumId}
                onChange={(e) => setVideoForm({ ...videoForm, albumId: e.target.value })}
                className="w-full mt-1 bg-secondary border border-primary/20 rounded-md p-2 text-sm"
              >
                <option value="">Single (No Album)</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={videoForm.isLatest}
                  onCheckedChange={(checked) => setVideoForm({ ...videoForm, isLatest: checked })}
                />
                <Label>Latest Video</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={videoForm.isFeatured}
                  onCheckedChange={(checked) => setVideoForm({ ...videoForm, isFeatured: checked })}
                />
                <Label>Featured</Label>
              </div>
            </div>

            {videoForm.youtubeId && (
              <div className="aspect-video rounded-lg overflow-hidden bg-charcoal">
                <img
                  src={`https://img.youtube.com/vi/${extractYouTubeId(videoForm.youtubeId) || videoForm.youtubeId}/maxresdefault.jpg`}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${extractYouTubeId(videoForm.youtubeId) || videoForm.youtubeId}/mqdefault.jpg`;
                  }}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowVideoModal(false); resetVideoForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleVideoSubmit}>
                {selectedVideo ? "Update" : "Add"} Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

