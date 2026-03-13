"use client";

import { useEffect } from "react";

/**
 * Hide the mouse cursor and attempt fullscreen on user interaction.
 * Also suppresses context menu on TVs.
 */
export function useTVMode() {
  useEffect(() => {
    // Attempt fullscreen on first user gesture (some TV browsers need this)
    const enterFullscreen = async () => {
      try {
        if (document.fullscreenElement) return;
        await document.documentElement.requestFullscreen?.();
        console.log("[TVMode] Entered fullscreen");
      } catch {
        // Fullscreen not supported or blocked – that's fine for most TVs
      }
    };

    // Listen for any interaction to trigger fullscreen
    const handleInteraction = () => {
      enterFullscreen();
      // Remove after first trigger
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    // Suppress right-click context menu
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    // Auto-attempt fullscreen (works on some platforms without gesture)
    enterFullscreen();

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
}
