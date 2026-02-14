// Release Service - manages albums and music videos
// Supabase-based data management (via supabaseDB)

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, generateId } from './supabaseDB';

export interface Album {
  id: string;
  title: string;
  year: string;
  coverImage: string;
  trackCount: number;
  description?: string;
  listenUrl?: string;
  isLatest: boolean;
  createdAt: string;
}

export interface MusicVideo {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail?: string;
  albumId?: string;
  isLatest: boolean;
  isFeatured: boolean;
  createdAt: string;
}

// Streaming platform for the "Listen Everywhere" banner
export interface StreamingPlatform {
  id: string;
  name: string;
  url: string;
  isVisible: boolean;
}

const PLATFORMS_KEY = "sop_streaming_platforms";

// Default streaming platforms with their artist profile URLs
const DEFAULT_PLATFORMS: Omit<StreamingPlatform, "id">[] = [
  { name: "Spotify", url: "", isVisible: true },
  { name: "Apple Music", url: "", isVisible: true },
  { name: "YouTube Music", url: "", isVisible: true },
  { name: "Boomplay", url: "", isVisible: true },
  { name: "Audiomack", url: "", isVisible: true },
  { name: "Deezer", url: "", isVisible: true },
  { name: "Tidal", url: "", isVisible: true },
  { name: "Amazon Music", url: "", isVisible: true },
  { name: "SoundCloud", url: "", isVisible: false },
  { name: "Pandora", url: "", isVisible: false },
  { name: "iHeartRadio", url: "", isVisible: false },
  { name: "Anghami", url: "", isVisible: false },
  { name: "JioSaavn", url: "", isVisible: false },
  { name: "Shazam", url: "", isVisible: false },
];

const KEYS = {
  ALBUMS: "sop_albums",
  MUSIC_VIDEOS: "sop_music_videos",
};

// ============ STREAMING PLATFORMS ============

export async function getAllPlatforms(): Promise<StreamingPlatform[]> {
  const platforms = await dbGetAll<StreamingPlatform>(PLATFORMS_KEY);
  if (platforms.length === 0) {
    for (let i = 0; i < DEFAULT_PLATFORMS.length; i++) {
      const platform = {
        ...DEFAULT_PLATFORMS[i],
        id: `platform_${i}`,
      };
      try {
        await dbInsert<StreamingPlatform>(PLATFORMS_KEY, platform);
      } catch {
        // May fail if concurrent init
      }
    }
    return dbGetAll<StreamingPlatform>(PLATFORMS_KEY);
  }
  return platforms;
}

export async function getVisiblePlatforms(): Promise<StreamingPlatform[]> {
  const platforms = await getAllPlatforms();
  return platforms.filter((p) => p.isVisible);
}

export async function updatePlatform(id: string, updates: Partial<StreamingPlatform>): Promise<void> {
  await dbUpdate<StreamingPlatform>(PLATFORMS_KEY, id, updates);
}

export async function updateAllPlatforms(platforms: StreamingPlatform[]): Promise<void> {
  const existing = await dbGetAll<StreamingPlatform>(PLATFORMS_KEY);
  const newIds = new Set(platforms.map((p) => p.id));

  for (const p of existing) {
    if (!newIds.has(p.id)) {
      await dbDelete(PLATFORMS_KEY, p.id);
    }
  }

  for (const p of platforms) {
    const existingPlatform = existing.find((e) => e.id === p.id);
    if (existingPlatform) {
      await dbUpdate<StreamingPlatform>(PLATFORMS_KEY, p.id, p);
    } else {
      await dbInsert<StreamingPlatform>(PLATFORMS_KEY, p);
    }
  }
}

// ============ ALBUMS ============

export async function getAllAlbums(): Promise<Album[]> {
  return dbGetAll<Album>(KEYS.ALBUMS);
}

export async function getAlbumById(id: string): Promise<Album | undefined> {
  const album = await dbGetById<Album>(KEYS.ALBUMS, id);
  return album ?? undefined;
}

export async function getLatestAlbum(): Promise<Album | undefined> {
  const albums = await getAllAlbums();
  return albums.find((a) => a.isLatest) || albums[0];
}

export async function addAlbum(album: Omit<Album, "id" | "createdAt">): Promise<Album> {
  if (album.isLatest) {
    const albums = await getAllAlbums();
    for (const a of albums) {
      if (a.isLatest) {
        await dbUpdate<Album>(KEYS.ALBUMS, a.id, { isLatest: false });
      }
    }
  }

  const newAlbum = {
    ...album,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  return dbInsert<Album>(KEYS.ALBUMS, newAlbum);
}

export async function updateAlbum(id: string, updates: Partial<Album>): Promise<Album | null> {
  const album = await getAlbumById(id);
  if (!album) return null;

  if (updates.isLatest) {
    const albums = await getAllAlbums();
    for (const a of albums) {
      if (a.isLatest && a.id !== id) {
        await dbUpdate<Album>(KEYS.ALBUMS, a.id, { isLatest: false });
      }
    }
  }

  try {
    return await dbUpdate<Album>(KEYS.ALBUMS, id, updates);
  } catch {
    return null;
  }
}

export async function deleteAlbum(id: string): Promise<boolean> {
  try {
    await dbDelete(KEYS.ALBUMS, id);
    return true;
  } catch {
    return false;
  }
}

// ============ MUSIC VIDEOS ============

export async function getAllMusicVideos(): Promise<MusicVideo[]> {
  return dbGetAll<MusicVideo>(KEYS.MUSIC_VIDEOS);
}

export async function getMusicVideoById(id: string): Promise<MusicVideo | undefined> {
  const video = await dbGetById<MusicVideo>(KEYS.MUSIC_VIDEOS, id);
  return video ?? undefined;
}

export async function getLatestMusicVideo(): Promise<MusicVideo | undefined> {
  const videos = await getAllMusicVideos();
  return videos.find((v) => v.isLatest) || videos[0];
}

export async function getFeaturedMusicVideos(): Promise<MusicVideo[]> {
  const videos = await getAllMusicVideos();
  return videos.filter((v) => v.isFeatured);
}

export async function addMusicVideo(
  video: Omit<MusicVideo, "id" | "createdAt" | "thumbnail">
): Promise<MusicVideo> {
  if (video.isLatest) {
    const videos = await getAllMusicVideos();
    for (const v of videos) {
      if (v.isLatest) {
        await dbUpdate<MusicVideo>(KEYS.MUSIC_VIDEOS, v.id, { isLatest: false });
      }
    }
  }

  const newVideo = {
    ...video,
    id: generateId(),
    thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
    createdAt: new Date().toISOString(),
  };
  return dbInsert<MusicVideo>(KEYS.MUSIC_VIDEOS, newVideo);
}

export async function updateMusicVideo(
  id: string,
  updates: Partial<MusicVideo>
): Promise<MusicVideo | null> {
  const video = await getMusicVideoById(id);
  if (!video) return null;

  if (updates.isLatest) {
    const videos = await getAllMusicVideos();
    for (const v of videos) {
      if (v.isLatest && v.id !== id) {
        await dbUpdate<MusicVideo>(KEYS.MUSIC_VIDEOS, v.id, { isLatest: false });
      }
    }
  }

  if (updates.youtubeId) {
    updates = {
      ...updates,
      thumbnail: `https://img.youtube.com/vi/${updates.youtubeId}/maxresdefault.jpg`,
    };
  }

  try {
    return await dbUpdate<MusicVideo>(KEYS.MUSIC_VIDEOS, id, updates);
  } catch {
    return null;
  }
}

export async function deleteMusicVideo(id: string): Promise<boolean> {
  try {
    await dbDelete(KEYS.MUSIC_VIDEOS, id);
    return true;
  } catch {
    return false;
  }
}

// ============ STATS ============

export async function getReleaseStats(): Promise<{
  totalAlbums: number;
  totalVideos: number;
  totalTracks: number;
  latestAlbum: string;
  latestVideo: string;
}> {
  const [albums, videos] = await Promise.all([getAllAlbums(), getAllMusicVideos()]);
  const latestAlbum = await getLatestAlbum();
  const latestVideo = await getLatestMusicVideo();

  return {
    totalAlbums: albums.length,
    totalVideos: videos.length,
    totalTracks: albums.reduce((sum, a) => sum + a.trackCount, 0),
    latestAlbum: latestAlbum?.title || "None",
    latestVideo: latestVideo?.title || "None",
  };
}

// ============ UTILITY ============

// Extract YouTube video ID from various URL formats (sync - pure computation)
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^"&?\/\s]{11})/,
    /^([^"&?\/\s]{11})$/, // Just the ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
