import {
  Playlist,
  PlaylistItem,
  detectMediaType,
} from "./types";

/**
 * Fetch and parse the playlist JSON via the local API proxy.
 * The proxy fetches from CDN server-side, avoiding CORS issues.
 * Falls back to null on failure so caller can retry or use cached data.
 */
export async function fetchPlaylist(): Promise<PlaylistItem[] | null> {
  try {
    const res = await fetch(`/api/playlist?t=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`[Playlist] HTTP ${res.status} fetching playlist`);
      return null;
    }

    const data: Playlist = await res.json();

    if (!data?.playlist || !Array.isArray(data.playlist)) {
      console.error("[Playlist] Invalid playlist structure");
      return null;
    }

    // Normalize items: ensure each has a type
    return data.playlist
      .filter((item) => item.src)
      .map((item) => ({
        ...item,
        type: item.type ?? detectMediaType(item.src),
      }));
  } catch (err) {
    console.error("[Playlist] Failed to fetch playlist:", err);
    return null;
  }
}
