import { PlaylistItem, resolveMediaUrl, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "./types";

/**
 * Preload the next media item so it's ready for instant playback.
 *
 * - For images: creates an Image() and loads it.
 * - For videos: creates a hidden <video> element and preloads metadata + buffer.
 *
 * Returns an abort function to cancel preloading if the item changes.
 */
export function preloadMedia(item: PlaylistItem): () => void {
  const url = resolveMediaUrl(item.src);
  const controller = new AbortController();

  if (item.type === "image") {
    const img = new Image();
    img.src = url;
    // Abort by clearing src
    controller.signal.addEventListener("abort", () => {
      img.src = "";
    });
  } else if (item.type === "video") {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = url;
    video.load();
    controller.signal.addEventListener("abort", () => {
      video.src = "";
      video.load();
    });
  }

  return () => controller.abort();
}

/**
 * Get the MIME type hint for a video src
 */
export function getVideoMimeType(src: string): string {
  const ext = src.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    default:
      return "video/mp4";
  }
}

/**
 * Check if the browser can likely play the given file type
 */
export function isSupportedMedia(src: string): boolean {
  const ext = src.split(".").pop()?.toLowerCase() ?? "";
  return (
    (VIDEO_EXTENSIONS as readonly string[]).includes(ext) ||
    (IMAGE_EXTENSIONS as readonly string[]).includes(ext)
  );
}
