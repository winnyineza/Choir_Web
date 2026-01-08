import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Pin,
  AlertTriangle,
  Info,
  CheckCircle,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPin,
  toggleAnnouncementActive,
  getAnnouncementStats,
  type Announcement,
} from "@/lib/announcementService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const typeConfig = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/20" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20" },
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20" },
  event: { icon: Calendar, color: "text-primary", bg: "bg-primary/20" },
};

const priorityConfig = {
  normal: { label: "Normal", color: "text-muted-foreground" },
  high: { label: "High", color: "text-yellow-500" },
  urgent: { label: "Urgent", color: "text-red-500" },
};

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info" as Announcement["type"],
    priority: "normal" as Announcement["priority"],
    audience: "all" as Announcement["audience"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isPinned: false,
    isActive: true,
  });
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const loadData = () => {
    setAnnouncements(getAllAnnouncements());
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "info",
      priority: "normal",
      audience: "all",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      isPinned: false,
      isActive: true,
    });
    setEditingAnnouncement(null);
  };

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        audience: announcement.audience,
        startDate: announcement.startDate.split("T")[0],
        endDate: announcement.endDate?.split("T")[0] || "",
        isPinned: announcement.isPinned,
        isActive: announcement.isActive,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and content",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      endDate: formData.endDate || undefined,
      createdBy: currentUser?.name || "Admin",
    };

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, data);
      toast({ title: "Announcement Updated", description: "The announcement has been updated" });
    } else {
      createAnnouncement(data);
      toast({ title: "Announcement Created", description: "The announcement is now live" });
    }

    setIsModalOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteAnnouncement(id);
      toast({ title: "Announcement Deleted" });
      loadData();
    }
  };

  const handleTogglePin = (id: string) => {
    toggleAnnouncementPin(id);
    loadData();
  };

  const handleToggleActive = (id: string) => {
    toggleAnnouncementActive(id);
    loadData();
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === "active") return a.isActive;
    if (filter === "inactive") return !a.isActive;
    return true;
  });

  const stats = getAnnouncementStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold gold-text flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            Announcements
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Post updates for choir members
          </p>
        </div>
        <Button variant="gold" onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-glass rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="card-glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="card-glass rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">{stats.pinned}</p>
          <p className="text-sm text-muted-foreground">Pinned</p>
        </div>
        <div className="card-glass rounded-xl p-4">
          <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
          <p className="text-sm text-muted-foreground">Urgent</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "active", "inactive"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "gold" : "outline"}
            size="sm"
            onClick={() => setFilter(f as any)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="card-glass rounded-2xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No Announcements</h3>
          <p className="text-muted-foreground mb-4">
            Create your first announcement to keep members informed
          </p>
          <Button variant="gold" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => {
            const TypeIcon = typeConfig[announcement.type].icon;
            return (
              <div
                key={announcement.id}
                className={cn(
                  "card-glass rounded-xl p-4 border",
                  announcement.isActive ? "border-primary/20" : "border-muted opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg", typeConfig[announcement.type].bg)}>
                    <TypeIcon className={cn("w-5 h-5", typeConfig[announcement.type].color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                      {announcement.isPinned && (
                        <Pin className="w-4 h-4 text-primary" />
                      )}
                      <span className={cn("text-xs font-medium", priorityConfig[announcement.priority].color)}>
                        {priorityConfig[announcement.priority].label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {announcement.audience}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString()} by {announcement.createdBy}
                      {announcement.endDate && (
                        <span className="ml-2">• Expires: {new Date(announcement.endDate).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(announcement.id)}
                      title={announcement.isActive ? "Deactivate" : "Activate"}
                    >
                      {announcement.isActive ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePin(announcement.id)}
                      title={announcement.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className={cn("w-4 h-4", announcement.isPinned ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(announcement)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl gold-text">
              {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Announcement details..."
                rows={4}
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Information</SelectItem>
                    <SelectItem value="warning">⚠️ Warning</SelectItem>
                    <SelectItem value="success">✅ Success</SelectItem>
                    <SelectItem value="event">📅 Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(v: any) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="audience">Audience</Label>
              <Select value={formData.audience} onValueChange={(v: any) => setFormData({ ...formData, audience: v })}>
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="members">Members Only</SelectItem>
                  <SelectItem value="admins">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <Label htmlFor="isPinned">Pin to Top</Label>
                <p className="text-xs text-muted-foreground">Pinned announcements appear first</p>
              </div>
              <Switch
                id="isPinned"
                checked={formData.isPinned}
                onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSave}>
                {editingAnnouncement ? "Update" : "Publish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

