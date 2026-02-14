import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  getCategoryLabel,
  getCategoryColor,
  formatFileSize,
  getFileIcon,
  downloadDocument,
  exportDocumentListToCSV,
  type Document,
  type DocumentCategory,
} from "@/lib/documentService";
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog } from "@/lib/adminService";
import { cn } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  FolderOpen,
  HardDrive,
  Clock,
  Globe,
  Lock,
  MoreVertical,
} from "lucide-react";

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as DocumentCategory,
    isPublic: false,
    tags: "",
  });
  const [fileData, setFileData] = useState<{
    name: string;
    type: string;
    size: number;
    data: string;
  } | null>(null);

  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDocumentStats>> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [docs, docStats] = await Promise.all([
      getAllDocuments(),
      getDocumentStats(),
    ]);
    setDocuments(docs);
    setStats(docStats);
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesVisibility = filterVisibility === "all" ||
      (filterVisibility === "public" && doc.isPublic) ||
      (filterVisibility === "private" && !doc.isPublic);
    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const statsValue = stats ?? {
    totalDocuments: 0,
    totalSize: 0,
    byCategory: { constitution: 0, financial: 0, minutes: 0, music: 0, policy: 0, training: 0, other: 0 },
    publicCount: 0,
    recentUploads: 0,
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 10MB for documents
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file under 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const fileType = file.name.split(".").pop() || "";
      setFileData({
        name: file.name,
        type: fileType,
        size: file.size,
        data: result,
      });
      // Auto-fill title from filename
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, "") });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDocument && !fileData) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (selectedDocument) {
        await updateDocument(selectedDocument.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          isPublic: formData.isPublic,
          tags,
          ...(fileData && {
            fileName: fileData.name,
            fileType: fileData.type,
            fileSize: fileData.size,
            fileData: fileData.data,
          }),
        });
        if (user) {
          addAuditLog(user, "UPDATE_DOCUMENT", `Updated document: ${formData.title}`);
        }
        toast({ title: "Document Updated", description: "Document has been updated." });
      } else {
        await createDocument({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          fileName: fileData!.name,
          fileType: fileData!.type,
          fileSize: fileData!.size,
          fileData: fileData!.data,
          uploadedBy: user?.name || "Admin",
          isPublic: formData.isPublic,
          tags,
        });
        if (user) {
          addAuditLog(user, "UPLOAD_DOCUMENT", `Uploaded document: ${formData.title}`);
        }
        toast({ title: "Document Uploaded", description: "Document has been uploaded successfully." });
      }
      await loadData();
      setShowUploadModal(false);
      resetForm();
    } catch {
      toast({ title: "Error", description: "Failed to save document", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const doc = documents.find((d) => d.id === id);
    const ok = await deleteDocument(id);
    if (ok) {
      if (user && doc) {
        addAuditLog(user, "DELETE_DOCUMENT", `Deleted document: ${doc.title}`);
      }
      toast({ title: "Document Deleted", description: "Document has been deleted." });
      await loadData();
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      await downloadDocument(doc);
      await loadData(); // Refresh to update download count
      toast({ title: "Download Started", description: `Downloading ${doc.fileName}` });
    } catch {
      toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
    }
  };

  const handleExportList = async () => {
    const csv = await exportDocumentListToCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents_list_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Document list exported to CSV." });
  };

  const resetForm = () => {
    setSelectedDocument(null);
    setFormData({
      title: "",
      description: "",
      category: "other",
      isPublic: false,
      tags: "",
    });
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditModal = (doc: Document) => {
    setSelectedDocument(doc);
    setFormData({
      title: doc.title,
      description: doc.description || "",
      category: doc.category,
      isPublic: doc.isPublic,
      tags: doc.tags?.join(", ") || "",
    });
    setShowUploadModal(true);
  };

  const toggleVisibility = async (doc: Document) => {
    const updated = await updateDocument(doc.id, { isPublic: !doc.isPublic });
    if (updated) {
      if (user) {
        addAuditLog(user, "TOGGLE_DOCUMENT_VISIBILITY", `${doc.isPublic ? "Made private" : "Made public"}: ${doc.title}`);
      }
      toast({
        title: doc.isPublic ? "Made Private" : "Made Public",
        description: `${doc.title} is now ${doc.isPublic ? "private" : "visible to members"}.`,
      });
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{statsValue.totalDocuments}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Documents</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span className="text-xl font-bold">{formatFileSize(statsValue.totalSize)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Size</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Globe className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold">{statsValue.publicCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Public</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Lock className="w-4 h-4 text-orange-400" />
            <span className="text-xl font-bold">{statsValue.totalDocuments - statsValue.publicCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Private</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xl font-bold">{statsValue.recentUploads}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Last 30 Days</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-xl font-bold">
              {Object.values(statsValue.byCategory).filter((v) => v > 0).length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Categories</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px] bg-secondary">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="constitution">Constitution</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="minutes">Minutes</SelectItem>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="policy">Policies</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterVisibility} onValueChange={setFilterVisibility}>
          <SelectTrigger className="w-[120px] bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExportList}>
          <Download className="w-4 h-4 mr-2" />
          Export List
        </Button>

        <Button variant="gold" onClick={() => { resetForm(); setShowUploadModal(true); }}>
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="card-glass rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No documents found</p>
          <Button variant="gold" className="mt-4" onClick={() => { resetForm(); setShowUploadModal(true); }}>
            <Upload className="w-4 h-4 mr-2" />
            Upload First Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="card-glass rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="text-3xl">{getFileIcon(doc.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" title={doc.title}>{doc.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full", getCategoryColor(doc.category))}>
                        {getCategoryLabel(doc.category).split(" ")[0]}
                      </span>
                      {doc.isPublic ? (
                        <Globe className="w-3 h-3 text-green-400" title="Public" />
                      ) : (
                        <Lock className="w-3 h-3 text-orange-400" title="Private" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {doc.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{doc.description}</p>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/10">
                <div className="text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span className="mx-2">•</span>
                  <span>{doc.downloadCount} downloads</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVisibility(doc)}
                    title={doc.isPublic ? "Make Private" : "Make Public"}
                  >
                    {doc.isPublic ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(doc)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doc.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{doc.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={(open) => { if (!open) { setShowUploadModal(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">
              {selectedDocument ? "Edit Document" : "Upload Document"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {selectedDocument ? "Update document details" : "Upload a new document to the library"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* File Upload */}
            <div>
              <Label>File {!selectedDocument && "*"}</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  fileData
                    ? "border-primary/50 bg-primary/5"
                    : "border-primary/20 hover:border-primary/40"
                )}
              >
                {fileData ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">{getFileIcon(fileData.type)}</span>
                    <div className="text-left">
                      <p className="font-medium">{fileData.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(fileData.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a file (max 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.mp3,.mp4,.zip"
              />
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as DocumentCategory })}>
                <SelectTrigger className="mt-1 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="constitution">Constitution & Bylaws</SelectItem>
                  <SelectItem value="financial">Financial Documents</SelectItem>
                  <SelectItem value="minutes">Meeting Minutes</SelectItem>
                  <SelectItem value="music">Music & Scores</SelectItem>
                  <SelectItem value="policy">Policies</SelectItem>
                  <SelectItem value="training">Training Materials</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., 2026, budget, annual"
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="isPublic" className="text-sm">
                <span className="font-medium">Make Public</span>
                <p className="text-muted-foreground text-xs">Visible to all choir members in the portal</p>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowUploadModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                {selectedDocument ? "Update" : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

