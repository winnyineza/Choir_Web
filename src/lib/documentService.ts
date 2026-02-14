// Document Storage Service - manages choir documents and files

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbDeleteWhere } from './supabaseDB';

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

// ============ DOCUMENTS ============

export async function getAllDocuments(): Promise<Document[]> {
  const docs = await dbGetAll<Document>(DOCUMENTS_KEY);
  return (docs || []).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function getDocumentById(id: string): Promise<Document | null> {
  return dbGetById<Document>(DOCUMENTS_KEY, id);
}

export async function getDocumentsByCategory(category: DocumentCategory): Promise<Document[]> {
  const documents = await getAllDocuments();
  return documents.filter((d) => d.category === category);
}

export async function getPublicDocuments(): Promise<Document[]> {
  const documents = await getAllDocuments();
  return documents.filter((d) => d.isPublic);
}

export async function searchDocuments(query: string): Promise<Document[]> {
  const lowerQuery = query.toLowerCase();
  const documents = await getAllDocuments();
  return documents.filter(
    (d) =>
      d.title.toLowerCase().includes(lowerQuery) ||
      d.description?.toLowerCase().includes(lowerQuery) ||
      d.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

export async function createDocument(
  data: Omit<Document, "id" | "uploadedAt" | "downloadCount">
): Promise<Document> {
  return dbInsert<Document>(DOCUMENTS_KEY, {
    ...data,
    uploadedAt: new Date().toISOString(),
    downloadCount: 0,
  });
}

export async function updateDocument(
  id: string,
  updates: Partial<Document>
): Promise<Document | null> {
  try {
    return await dbUpdate<Document>(DOCUMENTS_KEY, id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

export async function incrementDownloadCount(id: string): Promise<void> {
  try {
    const doc = await getDocumentById(id);
    if (doc) {
      await dbUpdate<Document>(DOCUMENTS_KEY, id, {
        downloadCount: doc.downloadCount + 1,
      });
    }
  } catch {
    // ignore
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    await dbDelete(DOCUMENTS_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// ============ FOLDERS ============

export async function getAllFolders(): Promise<DocumentFolder[]> {
  const folders = await dbGetAll<DocumentFolder>(FOLDERS_KEY);
  return folders || [];
}

export async function createFolder(
  name: string,
  description?: string,
  parentId?: string
): Promise<DocumentFolder> {
  return dbInsert<DocumentFolder>(FOLDERS_KEY, {
    name,
    description,
    parentId,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteFolder(id: string): Promise<boolean> {
  try {
    await dbDeleteWhere(FOLDERS_KEY, "parent_id", id);
    await dbDelete(FOLDERS_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// ============ STATS ============

export async function getDocumentStats(): Promise<DocumentStats> {
  const documents = await getAllDocuments();
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

  documents.forEach((doc) => {
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

// ============ UTILITIES (pure computation - stay sync) ============

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

export async function downloadDocument(doc: Document): Promise<void> {
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
    await incrementDownloadCount(doc.id);
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

export async function exportDocumentListToCSV(): Promise<string> {
  const documents = await getAllDocuments();

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

  const rows = documents.map((d) => [
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

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
