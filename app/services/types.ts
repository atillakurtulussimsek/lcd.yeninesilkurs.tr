/**
 * Media item types supported by the player
 */
export type MediaType = "video" | "image";

/**
 * A single item in the playlist
 */
export interface PlaylistItem {
  type: MediaType;
  src: string;
  /** Display duration in seconds (images only). Default: 15 */
  duration?: number;
}

/**
 * Root playlist JSON structure served from CDN
 */
export interface Playlist {
  playlist: PlaylistItem[];
}

/**
 * Video file extensions the player can handle
 */
export const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"] as const;

/**
 * Image file extensions the player can handle
 */
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

/**
 * Default image display duration in seconds
 */
export const DEFAULT_IMAGE_DURATION =
  Number(process.env.NEXT_PUBLIC_DEFAULT_IMAGE_DURATION) || 15;

/**
 * CDN base URL
 */
export const CDN_BASE_URL =
  process.env.NEXT_PUBLIC_CDN_BASE_URL || "https://lcd-cdn.yeninesilkurs.tr";

/**
 * Playlist JSON URL
 */
export const PLAYLIST_URL = `${CDN_BASE_URL}/${process.env.NEXT_PUBLIC_PLAYLIST_PATH || "playlist.json"}`;

/**
 * Interval (ms) between playlist reload attempts when playback is idle
 */
export const PLAYLIST_RELOAD_INTERVAL =
  Number(process.env.NEXT_PUBLIC_PLAYLIST_RELOAD_INTERVAL) || 30_000;

/**
 * Resolve a relative media path to its full CDN URL
 */
export function resolveMediaUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  return `${CDN_BASE_URL}/${src.replace(/^\//, "")}`;
}

/**
 * Detect media type from file extension if not explicitly provided
 */
export function detectMediaType(src: string): MediaType {
  const ext = src.split(".").pop()?.toLowerCase() ?? "";
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(ext)) return "video";
  return "image";
}
