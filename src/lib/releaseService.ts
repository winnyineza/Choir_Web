// Release Service - manages albums and music videos
// localStorage-based data management

export interface Album {
  id: string;
  title: string;
  year: string;
  coverImage: string;
  trackCount: number;
  description?: string;
  listenUrl?: string; // Single link (YouTube, smart link, etc.)
  isLatest: boolean;
  createdAt: string;
}

export interface MusicVideo {
  id: string;
  title: string;
  youtubeId: string; // Just the video ID, not full URL
  thumbnail?: string; // Auto-generated from YouTube if not provided
  albumId?: string; // Optional link to album
  isLatest: boolean;
  isFeatured: boolean;
  createdAt: string;
}

// Streaming platform for the "Listen Everywhere" banner
export interface StreamingPlatform {
  id: string;
  name: string;
  url: string; // Link to artist profile on this platform
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

// ============ STREAMING PLATFORMS ============

export function getAllPlatforms(): StreamingPlatform[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PLATFORMS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with defaults
    const platforms = DEFAULT_PLATFORMS.map((p, i) => ({
      ...p,
      id: `platform_${i}`,
    }));
    localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
    return platforms;
  } catch {
    return [];
  }
}

export function getVisiblePlatforms(): StreamingPlatform[] {
  return getAllPlatforms().filter(p => p.isVisible);
}

export function updatePlatform(id: string, updates: Partial<StreamingPlatform>): void {
  const platforms = getAllPlatforms();
  const index = platforms.findIndex(p => p.id === id);
  if (index !== -1) {
    platforms[index] = { ...platforms[index], ...updates };
    localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
  }
}

export function updateAllPlatforms(platforms: StreamingPlatform[]): void {
  localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
}

const KEYS = {
  ALBUMS: "sop_albums",
  MUSIC_VIDEOS: "sop_music_videos",
};

// ============ HELPER FUNCTIONS ============

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ============ ALBUMS ============

export function getAllAlbums(): Album[] {
  return getFromStorage<Album[]>(KEYS.ALBUMS, []);
}

export function getAlbumById(id: string): Album | undefined {
  return getAllAlbums().find((a) => a.id === id);
}

export function getLatestAlbum(): Album | undefined {
  const albums = getAllAlbums();
  return albums.find((a) => a.isLatest) || albums[0];
}

export function addAlbum(album: Omit<Album, "id" | "createdAt">): Album {
  const albums = getAllAlbums();
  
  // If this is marked as latest, unmark others
  if (album.isLatest) {
    albums.forEach((a) => (a.isLatest = false));
  }
  
  const newAlbum: Album = {
    ...album,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  albums.unshift(newAlbum); // Add to beginning
  saveToStorage(KEYS.ALBUMS, albums);
  return newAlbum;
}

export function updateAlbum(id: string, updates: Partial<Album>): Album | null {
  const albums = getAllAlbums();
  const index = albums.findIndex((a) => a.id === id);
  if (index === -1) return null;
  
  // If marking as latest, unmark others
  if (updates.isLatest) {
    albums.forEach((a) => (a.isLatest = false));
  }
  
  albums[index] = { ...albums[index], ...updates };
  saveToStorage(KEYS.ALBUMS, albums);
  return albums[index];
}

export function deleteAlbum(id: string): boolean {
  const albums = getAllAlbums();
  const filtered = albums.filter((a) => a.id !== id);
  if (filtered.length === albums.length) return false;
  saveToStorage(KEYS.ALBUMS, filtered);
  return true;
}

// ============ MUSIC VIDEOS ============

export function getAllMusicVideos(): MusicVideo[] {
  return getFromStorage<MusicVideo[]>(KEYS.MUSIC_VIDEOS, []);
}

export function getMusicVideoById(id: string): MusicVideo | undefined {
  return getAllMusicVideos().find((v) => v.id === id);
}

export function getLatestMusicVideo(): MusicVideo | undefined {
  const videos = getAllMusicVideos();
  return videos.find((v) => v.isLatest) || videos[0];
}

export function getFeaturedMusicVideos(): MusicVideo[] {
  return getAllMusicVideos().filter((v) => v.isFeatured);
}

export function addMusicVideo(video: Omit<MusicVideo, "id" | "createdAt" | "thumbnail">): MusicVideo {
  const videos = getAllMusicVideos();
  
  // If this is marked as latest, unmark others
  if (video.isLatest) {
    videos.forEach((v) => (v.isLatest = false));
  }
  
  const newVideo: MusicVideo = {
    ...video,
    id: generateId(),
    thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
    createdAt: new Date().toISOString(),
  };
  
  videos.unshift(newVideo); // Add to beginning
  saveToStorage(KEYS.MUSIC_VIDEOS, videos);
  return newVideo;
}

export function updateMusicVideo(id: string, updates: Partial<MusicVideo>): MusicVideo | null {
  const videos = getAllMusicVideos();
  const index = videos.findIndex((v) => v.id === id);
  if (index === -1) return null;
  
  // If marking as latest, unmark others
  if (updates.isLatest) {
    videos.forEach((v) => (v.isLatest = false));
  }
  
  // Update thumbnail if youtubeId changed
  if (updates.youtubeId) {
    updates.thumbnail = `https://img.youtube.com/vi/${updates.youtubeId}/maxresdefault.jpg`;
  }
  
  videos[index] = { ...videos[index], ...updates };
  saveToStorage(KEYS.MUSIC_VIDEOS, videos);
  return videos[index];
}

export function deleteMusicVideo(id: string): boolean {
  const videos = getAllMusicVideos();
  const filtered = videos.filter((v) => v.id !== id);
  if (filtered.length === videos.length) return false;
  saveToStorage(KEYS.MUSIC_VIDEOS, filtered);
  return true;
}

// ============ STATS ============

export function getReleaseStats() {
  const albums = getAllAlbums();
  const videos = getAllMusicVideos();
  
  return {
    totalAlbums: albums.length,
    totalVideos: videos.length,
    totalTracks: albums.reduce((sum, a) => sum + a.trackCount, 0),
    latestAlbum: getLatestAlbum()?.title || "None",
    latestVideo: getLatestMusicVideo()?.title || "None",
  };
}

// ============ UTILITY ============

// Extract YouTube video ID from various URL formats
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

