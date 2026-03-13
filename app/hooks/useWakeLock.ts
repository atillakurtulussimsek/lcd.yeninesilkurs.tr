"use client";

import { useEffect, useRef } from "react";

/**
 * Hook that attempts to keep the screen alive and prevent sleep on smart TVs.
 *
 * Uses the Screen Wake Lock API (supported on Chrome, Edge, Android WebView).
 * Falls back to a no-op on unsupported browsers.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let active = true;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator && active) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          console.log("[WakeLock] Acquired");

          wakeLockRef.current.addEventListener("release", () => {
            console.log("[WakeLock] Released, re-acquiring...");
            if (active) {
              // Re-acquire on release (e.g. tab visibility change)
              setTimeout(requestWakeLock, 1000);
            }
          });
        }
      } catch (err) {
        console.warn("[WakeLock] Not available:", err);
      }
    }

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);
}
