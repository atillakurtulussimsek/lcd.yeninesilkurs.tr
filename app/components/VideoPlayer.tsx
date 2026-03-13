"use client";

import { useEffect, useRef, useCallback } from "react";
import { resolveMediaUrl } from "@/app/services/types";

interface VideoPlayerProps {
  src: string;
  /** When true, video loads but does NOT start playing */
  paused?: boolean;
  onEnded: () => void;
  onError: () => void;
  /** Fires when the video has enough data to start playing (canplay) */
  onReady?: () => void;
}

/**
 * Full-screen video player with autoplay + sound fallback logic.
 * When `paused` is true, the video preloads but does not play.
 * When `paused` changes to false, playback begins.
 */
export function VideoPlayer({
  src,
  paused = false,
  onEnded,
  onError,
  onReady,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasEndedRef = useRef(false);
  const readyFiredRef = useRef(false);
  const playingRef = useRef(false);

  // Stable refs for callbacks
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const handleEnded = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    console.log(`[VideoPlayer] Video ended`);
    onEndedRef.current();
  }, []);

  const handleError = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    console.error(`[VideoPlayer] Error playing video`);
    onErrorRef.current();
  }, []);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || playingRef.current) return;

    try {
      video.muted = false;
      await video.play();
      playingRef.current = true;
      console.log(`[VideoPlayer] Playing with sound: ${video.src}`);
    } catch {
      try {
        console.warn(`[VideoPlayer] Autoplay blocked, trying muted`);
        video.muted = true;
        await video.play();
        playingRef.current = true;
        setTimeout(() => {
          if (video && !video.paused) {
            video.muted = false;
          }
        }, 500);
      } catch (err2) {
        console.error(`[VideoPlayer] Cannot play`, err2);
        handleError();
      }
    }
  }, [handleError]);

  // Load video and set up events
  useEffect(() => {
    hasEndedRef.current = false;
    readyFiredRef.current = false;
    playingRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    const url = resolveMediaUrl(src);
    video.src = url;
    video.load();

    const handleCanPlay = () => {
      if (!readyFiredRef.current) {
        readyFiredRef.current = true;
        console.log(`[VideoPlayer] Video ready (canplay): ${src}`);
        onReadyRef.current?.();

        // If not paused, start playing immediately
        if (!pausedRef.current) {
          attemptPlay();
        }
      }
    };
    video.addEventListener("canplay", handleCanPlay);

    if (video.readyState >= 3) {
      handleCanPlay();
    }

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      console.warn(`[VideoPlayer] Safety timeout reached for: ${src}`);
      handleEnded();
    }, 10 * 60 * 1000);

    return () => {
      clearTimeout(safetyTimeout);
      video.removeEventListener("canplay", handleCanPlay);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, handleEnded, handleError, attemptPlay]);

  // When paused changes from true→false and video is ready, start playing
  useEffect(() => {
    if (!paused && readyFiredRef.current && !playingRef.current) {
      console.log(`[VideoPlayer] Unpaused, starting playback: ${src}`);
      attemptPlay();
    }
    if (paused && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      playingRef.current = false;
    }
  }, [paused, src, attemptPlay]);

  return (
    <video
      ref={videoRef}
      onEnded={handleEnded}
      onError={handleError}
      playsInline
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
