import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RecordsTableShell } from "@/components/ui/records-table-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllGalleryItems,
  addGalleryItem,
  deleteGalleryItem,
  getGalleryAlbums,
  type GalleryItem,
} from "@/lib/dataService";
import { addAuditLog } from "@/lib/adminService";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";
import { cn } from "@/lib/utils";
import {
  Image,
  Video,
  Plus,
  Search,
  Filter,
  Trash2,
  Upload,
  FolderOpen,
  Play,
  X,
  Grid,
  List,
  ExternalLink,
} from "lucide-react";

const CATEGORIES = [
  "Concerts",
  "Rehearsals",
  "Fellowship",
  "Events",
  "Behind the Scenes",
  "Members",
  "Archive",
];

export function GalleryManagement() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [albumStats, setAlbumStats] = useState<{ name: string; count: number; coverImage: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    type: "photo" as "photo" | "video",
    title: "",
    url: "",
    category: "Events",
    albumName: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [itemsData, albumsData] = await Promise.all([
      getAllGalleryItems(),
      getGalleryAlbums(),
    ]);
    setItems(itemsData);
    setAlbumStats(albumsData);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesCategory = filterCategory === "all" || item.category.includes(filterCategory);
    return matchesSearch && matchesType && matchesCategory;
  });

  // Group by album/category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const key = item.albumName || item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, GalleryItem[]>);

  const handleSubmit = async () => {
    if (!formData.title || !formData.url) {
      toast({
        title: "Error",
        description: "Please fill in title and URL",
        variant: "destructive",
      });
      return;
    }

    await addGalleryItem({
      type: formData.type,
      title: formData.title,
      url: formData.url,
      category: formData.albumName ? `${formData.category} | ${formData.albumName}` : formData.category,
      albumName: formData.albumName,
    });

    if (currentUser) {
      addAuditLog(currentUser, "ADD_GALLERY", `Added gallery ${formData.type}: ${formData.title}`);
    }
    toast({ title: "Item Added", description: "Gallery item has been added." });
    await loadData();
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!confirmDestructiveAction({
      action: "delete",
      subject: `gallery item "${item?.title || "this item"}"`,
      warning: "This media item will be removed from the gallery.",
    })) return;

    await deleteGalleryItem(id);
    if (currentUser && item) {
      addAuditLog(currentUser, "DELETE_GALLERY", `Deleted gallery item: ${item.title}`);
    }
    toast({ title: "Item Deleted", description: "Gallery item has been deleted." });
    await loadData();
  };

  const handleBulkDelete = async () => {
    if (!confirmDestructiveAction({
      action: "delete",
      subject: `${selectedItems.length} selected gallery item(s)`,
      warning: "These media items will be removed from the gallery.",
    })) return;

    for (const id of selectedItems) {
      await deleteGalleryItem(id);
    }
    if (currentUser) {
      addAuditLog(currentUser, "BULK_DELETE_GALLERY", `Deleted ${selectedItems.length} gallery items`);
    }
    toast({ title: "Items Deleted", description: `${selectedItems.length} items have been deleted.` });
    setSelectedItems([]);
    await loadData();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // For demo purposes, we'll create data URLs
    // In production, you'd upload to a storage service
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        await addGalleryItem({
          type: file.type.startsWith("video/") ? "video" : "photo",
          title: file.name.replace(/\.[^/.]+$/, ""),
          url: url,
          category: formData.category,
          albumName: formData.albumName,
        });
        await loadData();
      };
      reader.readAsDataURL(file);
    });

    if (currentUser) {
      addAuditLog(currentUser, "UPLOAD_GALLERY", `Uploaded ${files.length} file(s) to gallery`);
    }
    toast({ title: "Files Uploaded", description: `${files.length} file(s) added to gallery.` });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setFormData({
      type: "photo",
      title: "",
      url: "",
      category: "Events",
      albumName: "",
    });
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const stats = {
    total: items.length,
    photos: items.filter(i => i.type === "photo").length,
    videos: items.filter(i => i.type === "video").length,
    albums: albumStats.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Items</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Image className="w-4 h-4 text-blue-400" />
            <span className="text-xl font-bold">{stats.photos}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Photos</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Video className="w-4 h-4 text-purple-400" />
            <span className="text-xl font-bold">{stats.videos}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Videos</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <FolderOpen className="w-4 h-4 text-yellow-400" />
            <span className="text-xl font-bold">{stats.albums}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Albums</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] bg-secondary">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="photo">Photos</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px] bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-lg border-primary/20 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-2", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10")}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-2", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {selectedItems.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete ({selectedItems.length})
          </Button>
        )}

        <Button variant="gold" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Gallery Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="card-glass rounded-xl p-8 text-center">
          <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No gallery items found</p>
          <Button variant="gold" className="mt-4" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group}>
              <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                {group} ({groupItems.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                      selectedItems.includes(item.id) ? "border-primary" : "border-transparent hover:border-primary/50"
                    )}
                    onClick={() => { setPreviewItem(item); setShowPreview(true); }}
                  >
                    {item.type === "photo" ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Image";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-charcoal flex items-center justify-center">
                        <img
                          src={item.thumbnail || `https://img.youtube.com/vi/${item.url}/mqdefault.jpg`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Video";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{item.title}</p>
                        <p className="text-white/60 text-xs">{item.type === "photo" ? "Photo" : "Video"}</p>
                      </div>
                    </div>
                    <div
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); toggleSelectItem(item.id); }}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded border-2 flex items-center justify-center",
                        selectedItems.includes(item.id)
                          ? "bg-primary border-primary"
                          : "border-white/60 bg-black/40"
                      )}>
                        {selectedItems.includes(item.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <button
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-glass rounded-xl overflow-hidden">
          <RecordsTableShell maxHeightClassName="max-h-[38rem]">
          <table className="w-full min-w-[920px]">
            <thead className="sticky top-0 z-10 bg-primary/10 backdrop-blur-sm">
              <tr>
                <th className="text-left p-3 text-xs font-medium">Preview</th>
                <th className="text-left p-3 text-xs font-medium">Title</th>
                <th className="text-left p-3 text-xs font-medium">Type</th>
                <th className="text-left p-3 text-xs font-medium">Category</th>
                <th className="text-left p-3 text-xs font-medium">Date</th>
                <th className="text-right p-3 text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-primary/5">
                  <td className="p-3">
                    <div className="w-16 h-12 rounded overflow-hidden bg-charcoal">
                      {item.type === "photo" ? (
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={item.thumbnail || `https://img.youtube.com/vi/${item.url}/mqdefault.jpg`}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <Play className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{item.title}</td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      item.type === "photo" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                    )}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{item.category}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setPreviewItem(item); setShowPreview(true); }}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </RecordsTableShell>
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">Add to Gallery</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Upload a new image to the gallery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Upload Section */}
            <div className="card-glass rounded-xl p-4 border-2 border-dashed border-primary/30 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload files directly</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Choose Files
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-primary/20" />
              <span className="text-xs text-muted-foreground">OR add by URL</span>
              <div className="flex-1 h-px bg-primary/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Item title"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>{formData.type === "video" ? "YouTube Video ID" : "Image URL"} *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder={formData.type === "video" ? "dQw4w9WgXcQ" : "https://example.com/image.jpg"}
                className="mt-1 bg-secondary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.type === "video" 
                  ? "Enter just the YouTube video ID (e.g., dQw4w9WgXcQ)"
                  : "Enter the full URL to the image"
                }
              </p>
            </div>

            <div>
              <Label>Album Name (Optional)</Label>
              <Input
                value={formData.albumName}
                onChange={(e) => setFormData({ ...formData, albumName: e.target.value })}
                placeholder="e.g., Christmas Concert 2025"
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                Add to Gallery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={(open) => { if (!open) { setShowPreview(false); setPreviewItem(null); } }}>
        <DialogContent className="sm:max-w-3xl bg-charcoal border-primary/20 p-0 overflow-hidden">
          <DialogDescription className="sr-only">Preview of gallery item</DialogDescription>
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </button>
          {previewItem && (
            <div>
              {previewItem.type === "photo" ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  className="w-full max-h-[70vh] object-contain bg-black"
                />
              ) : (
                <div className="aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${previewItem.url}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium">{previewItem.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {previewItem.category} • {new Date(previewItem.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
