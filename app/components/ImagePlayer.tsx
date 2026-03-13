"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { resolveMediaUrl, DEFAULT_IMAGE_DURATION } from "@/app/services/types";

interface ImagePlayerProps {
  src: string;
  duration?: number;
  /** When true, image loads but timer does NOT start */
  paused?: boolean;
  onComplete: () => void;
  onError: () => void;
  /** Fires when the image has finished loading and is ready to display */
  onReady?: () => void;
}

/**
 * Fullscreen image display with timed advancement.
 * Shows the image for the specified duration (default 15s) then calls onComplete.
 * When `paused` is true, the image loads but the display timer does not start.
 */
export function ImagePlayer({
  src,
  duration,
  paused = false,
  onComplete,
  onError,
  onReady,
}: ImagePlayerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const completedRef = useRef(false);
  const loadedRef = useRef(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Stable refs for callbacks
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const displayDuration = (duration ?? DEFAULT_IMAGE_DURATION) * 1000;

  // Start the display timer (only when unpaused and loaded)
  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        console.log(`[ImagePlayer] Timer elapsed, completing: ${src}`);
        onCompleteRef.current();
      }
    }, displayDuration);
  }, [displayDuration, src]);

  // Called when the image finishes loading
  const handleLoad = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoaded(true);
    console.log(`[ImagePlayer] Image loaded: ${src}`);
    onReadyRef.current?.();

    // Only start timer if not paused
    if (!pausedRef.current) {
      completedRef.current = false;
      startTimer();
    }
  }, [src, startTimer]);

  const handleError = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    console.error(`[ImagePlayer] Error loading: ${src}`);
    onErrorRef.current();
  }, [src]);

  // When paused changes from true→false and image is already loaded, start the timer
  useEffect(() => {
    if (!paused && loadedRef.current && !completedRef.current) {
      console.log(`[ImagePlayer] Unpaused, starting timer: ${src}`);
      startTimer();
    }
    if (paused) {
      clearTimeout(timerRef.current);
    }
  }, [paused, src, startTimer]);

  // Reset on src change
  useEffect(() => {
    completedRef.current = false;
    loadedRef.current = false;
    setLoaded(false);

    // Fallback: check if the image is already cached/complete
    const checkComplete = () => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0 && !loadedRef.current) {
        handleLoad();
      }
    };
    const raf = requestAnimationFrame(checkComplete);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timerRef.current);
    };
  }, [src, handleLoad]);

  const url = resolveMediaUrl(src);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      ref={imgRef}
      src={url}
      alt=""
      onLoad={handleLoad}
      onError={handleError}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        backgroundColor: "#000",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
      }}
    />
  );
}
