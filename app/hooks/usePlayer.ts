"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlaylistItem, DEFAULT_IMAGE_DURATION } from "@/app/services/types";
import { fetchPlaylist } from "@/app/services/playlist";
import { preloadMedia } from "@/app/services/preloader";

export interface PlayerState {
  /** Current item being displayed */
  currentItem: PlaylistItem | null;
  /** Index within the playlist */
  currentIndex: number;
  /** Whether the player is loading initially */
  loading: boolean;
  /** Error message if playlist load completely fails */
  error: string | null;
}

/**
 * Core player hook. Manages the playlist lifecycle:
 *  1. Fetch playlist
 *  2. Play items sequentially
 *  3. When done, re-fetch playlist and loop
 */
export function usePlayer(): PlayerState & {
  onItemComplete: () => void;
  onItemError: () => void;
} {
  const [state, setState] = useState<PlayerState>({
    currentItem: null,
    currentIndex: -1,
    loading: true,
    error: null,
  });

  const playlistRef = useRef<PlaylistItem[]>([]);
  const indexRef = useRef<number>(-1);
  const cancelPreloadRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  /**
   * Advance to the next item. If at end of playlist, reload and restart.
   */
  const advance = useCallback(async (forceReload = false) => {
    if (!mountedRef.current) return;

    const nextIndex = indexRef.current + 1;

    // End of playlist or forced reload → re-fetch
    if (forceReload || nextIndex >= playlistRef.current.length) {
      console.log("[Player] Playlist ended or reload triggered. Fetching fresh playlist...");
      const items = await fetchPlaylist();

      if (items && items.length > 0) {
        playlistRef.current = items;
        indexRef.current = 0;
      } else if (playlistRef.current.length > 0) {
        // Network failed but we have cached playlist – restart it
        console.warn("[Player] Playlist fetch failed, restarting cached playlist");
        indexRef.current = 0;
      } else {
        // No playlist at all
        console.error("[Player] No playlist available");
        setState((s) => ({ ...s, loading: false, error: "No playlist available" }));
        // Retry after delay
        setTimeout(() => {
          if (mountedRef.current) advance(true);
        }, 10_000);
        return;
      }
    } else {
      indexRef.current = nextIndex;
    }

    const item = playlistRef.current[indexRef.current];
    if (!item) return;

    // Cancel previous preload
    cancelPreloadRef.current?.();

    // Update state
    setState({
      currentItem: item,
      currentIndex: indexRef.current,
      loading: false,
      error: null,
    });

    // Preload next item
    const nextIdx = indexRef.current + 1;
    if (nextIdx < playlistRef.current.length) {
      cancelPreloadRef.current = preloadMedia(playlistRef.current[nextIdx]);
    } else {
      cancelPreloadRef.current = null;
    }
  }, []);

  /**
   * Called when the current item finishes playing (video ended or image timer elapsed)
   */
  const onItemComplete = useCallback(() => {
    advance();
  }, [advance]);

  /**
   * Called when the current item fails to load
   */
  const onItemError = useCallback(() => {
    const item = playlistRef.current[indexRef.current];
    console.error(`[Player] Error loading: ${item?.src ?? "unknown"}, skipping...`);
    advance();
  }, [advance]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    advance(true);

    return () => {
      mountedRef.current = false;
      cancelPreloadRef.current?.();
    };
  }, [advance]);

  return {
    ...state,
    onItemComplete,
    onItemError,
  };
}
