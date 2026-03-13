"use client";

import { useEffect, useRef, useCallback } from "react";
import { resolveMediaUrl } from "@/app/services/types";
import { getVideoMimeType } from "@/app/services/preloader";

interface VideoPlayerProps {
  src: string;
  onEnded: () => void;
  onError: () => void;
}

/**
 * Full-screen video player with autoplay + sound fallback logic.
 *
 * Attempts:
 *  1. Autoplay with sound
 *  2. If blocked → autoplay muted → then unmute
 */
export function VideoPlayer({ src, onEnded, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasEndedRef = useRef(false);

  const handleEnded = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    onEnded();
  }, [onEnded]);

  const handleError = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    console.error(`[VideoPlayer] Error playing: ${src}`);
    onError();
  }, [src, onError]);

  useEffect(() => {
    hasEndedRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    const url = resolveMediaUrl(src);
    video.src = url;
    video.load();

    // Safety timeout: if video doesn't end in a reasonable time, skip
    // Max 10 minutes per video to prevent hangs
    const safetyTimeout = setTimeout(() => {
      console.warn(`[VideoPlayer] Safety timeout reached for: ${src}`);
      handleEnded();
    }, 10 * 60 * 1000);

    const attemptPlay = async () => {
      try {
        // Try autoplay with sound
        video.muted = false;
        await video.play();
        console.log(`[VideoPlayer] Playing with sound: ${src}`);
      } catch {
        try {
          // Fallback: muted autoplay then unmute
          console.warn(`[VideoPlayer] Autoplay blocked, trying muted: ${src}`);
          video.muted = true;
          await video.play();
          // Try to unmute after playback starts
          setTimeout(() => {
            if (video && !video.paused) {
              video.muted = false;
            }
          }, 500);
        } catch (err2) {
          console.error(`[VideoPlayer] Cannot play: ${src}`, err2);
          handleError();
        }
      }
    };

    attemptPlay();

    return () => {
      clearTimeout(safetyTimeout);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, handleEnded, handleError]);

  return (
    <video
      ref={videoRef}
      onEnded={handleEnded}
      onError={handleError}
      playsInline
      autoPlay
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        backgroundColor: "#000",
      }}
    />
  );
}
