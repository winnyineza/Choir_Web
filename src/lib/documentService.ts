// Document Storage Service - manages choir documents and files

export type DocumentCategory = "constitution" | "financial" | "minutes" | "music" | "policy" | "training" | "other";

export interface Document {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  fileName: string;
  fileType: string; // e.g., "pdf", "docx", "xlsx"
  fileSize: number; // in bytes
  fileData: string; // Base64 encoded
  uploadedBy: string;
  uploadedAt: string;
  updatedAt?: string;
  tags?: string[];
  isPublic: boolean; // Visible to members
  downloadCount: number;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number; // in bytes
  byCategory: Record<DocumentCategory, number>;
  publicCount: number;
  recentUploads: number; // Last 30 days
}

const DOCUMENTS_KEY = "choir_documents";
const FOLDERS_KEY = "choir_document_folders";

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ DOCUMENTS ============

export function getAllDocuments(): Document[] {
  try {
    const stored = localStorage.getItem(DOCUMENTS_KEY);
    const docs = stored ? JSON.parse(stored) : [];
    return docs.sort((a: Document, b: Document) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveDocuments(documents: Document[]): void {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
}

export function getDocumentById(id: string): Document | undefined {
  return getAllDocuments().find(d => d.id === id);
}

export function getDocumentsByCategory(category: DocumentCategory): Document[] {
  return getAllDocuments().filter(d => d.category === category);
}

export function getPublicDocuments(): Document[] {
  return getAllDocuments().filter(d => d.isPublic);
}

export function searchDocuments(query: string): Document[] {
  const lowerQuery = query.toLowerCase();
  return getAllDocuments().filter(d =>
    d.title.toLowerCase().includes(lowerQuery) ||
    d.description?.toLowerCase().includes(lowerQuery) ||
    d.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

export function createDocument(data: Omit<Document, "id" | "uploadedAt" | "downloadCount">): Document {
  const documents = getAllDocuments();
  
  const newDoc: Document = {
    ...data,
    id: generateId(),
    uploadedAt: new Date().toISOString(),
    downloadCount: 0,
  };
  
  documents.push(newDoc);
  saveDocuments(documents);
  return newDoc;
}

export function updateDocument(id: string, updates: Partial<Document>): Document | null {
  const documents = getAllDocuments();
  const index = documents.findIndex(d => d.id === id);
  if (index === -1) return null;
  
  documents[index] = {
    ...documents[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveDocuments(documents);
  return documents[index];
}

export function incrementDownloadCount(id: string): void {
  const documents = getAllDocuments();
  const index = documents.findIndex(d => d.id === id);
  if (index !== -1) {
    documents[index].downloadCount++;
    saveDocuments(documents);
  }
}

export function deleteDocument(id: string): boolean {
  const documents = getAllDocuments();
  const filtered = documents.filter(d => d.id !== id);
  if (filtered.length === documents.length) return false;
  
  saveDocuments(filtered);
  return true;
}

// ============ FOLDERS ============

export function getAllFolders(): DocumentFolder[] {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFolders(folders: DocumentFolder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function createFolder(name: string, description?: string, parentId?: string): DocumentFolder {
  const folders = getAllFolders();
  
  const newFolder: DocumentFolder = {
    id: `folder_${Date.now()}`,
    name,
    description,
    parentId,
    createdAt: new Date().toISOString(),
  };
  
  folders.push(newFolder);
  saveFolders(folders);
  return newFolder;
}

export function deleteFolder(id: string): boolean {
  const folders = getAllFolders();
  const filtered = folders.filter(f => f.id !== id && f.parentId !== id);
  if (filtered.length === folders.length) return false;
  
  saveFolders(filtered);
  return true;
}

// ============ STATS ============

export function getDocumentStats(): DocumentStats {
  const documents = getAllDocuments();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const byCategory: Record<DocumentCategory, number> = {
    constitution: 0,
    financial: 0,
    minutes: 0,
    music: 0,
    policy: 0,
    training: 0,
    other: 0,
  };
  
  let totalSize = 0;
  let publicCount = 0;
  let recentUploads = 0;
  
  documents.forEach(doc => {
    byCategory[doc.category]++;
    totalSize += doc.fileSize;
    if (doc.isPublic) publicCount++;
    if (new Date(doc.uploadedAt) > thirtyDaysAgo) recentUploads++;
  });
  
  return {
    totalDocuments: documents.length,
    totalSize,
    byCategory,
    publicCount,
    recentUploads,
  };
}

// ============ UTILITIES ============

export function getCategoryLabel(category: DocumentCategory): string {
  const labels: Record<DocumentCategory, string> = {
    constitution: "Constitution & Bylaws",
    financial: "Financial Documents",
    minutes: "Meeting Minutes",
    music: "Music & Scores",
    policy: "Policies",
    training: "Training Materials",
    other: "Other Documents",
  };
  return labels[category];
}

export function getCategoryColor(category: DocumentCategory): string {
  const colors: Record<DocumentCategory, string> = {
    constitution: "text-primary bg-primary/20",
    financial: "text-green-400 bg-green-400/20",
    minutes: "text-blue-400 bg-blue-400/20",
    music: "text-purple-400 bg-purple-400/20",
    policy: "text-orange-400 bg-orange-400/20",
    training: "text-cyan-400 bg-cyan-400/20",
    other: "text-gray-400 bg-gray-400/20",
  };
  return colors[category];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getFileIcon(fileType: string): string {
  const icons: Record<string, string> = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    ppt: "📽️",
    pptx: "📽️",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    mp3: "🎵",
    mp4: "🎬",
    txt: "📃",
    zip: "📦",
  };
  return icons[fileType.toLowerCase()] || "📁";
}

export function downloadDocument(doc: Document): void {
  try {
    // Convert base64 to blob
    const byteCharacters = atob(doc.fileData.split(",")[1] || doc.fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: getMimeType(doc.fileType) });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Increment download count
    incrementDownloadCount(doc.id);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}

function getMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    txt: "text/plain",
    zip: "application/zip",
  };
  return mimeTypes[fileType.toLowerCase()] || "application/octet-stream";
}

export function exportDocumentListToCSV(): string {
  const documents = getAllDocuments();
  
  const headers = [
    "Title",
    "Category",
    "File Name",
    "File Type",
    "Size",
    "Uploaded By",
    "Uploaded At",
    "Public",
    "Downloads",
  ];
  
  const rows = documents.map(d => [
    `"${d.title}"`,
    getCategoryLabel(d.category),
    `"${d.fileName}"`,
    d.fileType,
    formatFileSize(d.fileSize),
    d.uploadedBy,
    d.uploadedAt.split("T")[0],
    d.isPublic ? "Yes" : "No",
    d.downloadCount,
  ]);
  
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

