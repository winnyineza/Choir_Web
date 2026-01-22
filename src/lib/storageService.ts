// Supabase Storage Service - File uploads to cloud storage
import { supabase, isSupabaseConfigured } from './supabase';

// Storage bucket names
export const BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  GALLERY: 'gallery',
  DOCUMENTS: 'documents',
  EVENT_IMAGES: 'event-images',
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

// ============ UPLOAD FUNCTIONS ============

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name
 * @param file - File object or base64 string
 * @param path - Optional custom path (defaults to timestamp-based name)
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  bucket: BucketName,
  file: File | Blob,
  path?: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, storing as base64');
    // Fallback: Convert to base64 for localStorage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      // Fallback to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

/**
 * Upload a base64 image to Supabase Storage
 */
export async function uploadBase64Image(
  bucket: BucketName,
  base64String: string,
  fileName?: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    // Already base64, just return it
    return base64String;
  }

  // Check if it's already a URL (not base64)
  if (base64String.startsWith('http')) {
    return base64String;
  }

  try {
    // Convert base64 to blob
    const base64Data = base64String.split(',')[1] || base64String;
    const mimeType = base64String.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
    
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const ext = mimeType.split('/')[1] || 'jpg';
    const name = fileName || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    return uploadFile(bucket, blob, name);
  } catch (error) {
    console.error('Base64 upload failed:', error);
    return base64String; // Return original base64 as fallback
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: BucketName, path: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true; // No-op for localStorage
  }

  try {
    // Extract just the filename from full URL if needed
    const fileName = path.includes('/') ? path.split('/').pop()! : path;
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  if (!isSupabaseConfigured()) {
    return path; // Return as-is for base64 or local paths
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * List files in a bucket folder
 */
export async function listFiles(
  bucket: BucketName,
  folder?: string
): Promise<{ name: string; url: string }[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => ({
        name: file.name,
        url: getPublicUrl(bucket, folder ? `${folder}/${file.name}` : file.name),
      }));
  } catch (error) {
    console.error('List files failed:', error);
    return [];
  }
}

// ============ PROFILE PHOTO HELPERS ============

export async function uploadProfilePhoto(file: File | Blob): Promise<string | null> {
  return uploadFile(BUCKETS.PROFILE_PHOTOS, file);
}

export async function uploadProfilePhotoBase64(base64: string): Promise<string | null> {
  return uploadBase64Image(BUCKETS.PROFILE_PHOTOS, base64);
}

// ============ GALLERY HELPERS ============

export async function uploadGalleryImage(file: File | Blob, albumName?: string): Promise<string | null> {
  const path = albumName 
    ? `${albumName.toLowerCase().replace(/\s+/g, '-')}/${Date.now()}.jpg`
    : undefined;
  return uploadFile(BUCKETS.GALLERY, file, path);
}

// ============ DOCUMENT HELPERS ============

export async function uploadDocument(file: File): Promise<string | null> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return uploadFile(BUCKETS.DOCUMENTS, file, `${Date.now()}-${safeName}`);
}

// ============ EVENT IMAGE HELPERS ============

export async function uploadEventImage(file: File | Blob): Promise<string | null> {
  return uploadFile(BUCKETS.EVENT_IMAGES, file);
}

export async function uploadEventImageBase64(base64: string): Promise<string | null> {
  return uploadBase64Image(BUCKETS.EVENT_IMAGES, base64);
}
