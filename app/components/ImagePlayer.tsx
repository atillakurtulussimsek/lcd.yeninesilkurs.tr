"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { resolveMediaUrl, DEFAULT_IMAGE_DURATION } from "@/app/services/types";

interface ImagePlayerProps {
  src: string;
  duration?: number;
  onComplete: () => void;
  onError: () => void;
}

/**
 * Fullscreen image display with timed advancement.
 * Shows the image for the specified duration (default 15s) then calls onComplete.
 */
export function ImagePlayer({ src, duration, onComplete, onError }: ImagePlayerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const completedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const displayDuration = (duration ?? DEFAULT_IMAGE_DURATION) * 1000;

  const handleLoad = useCallback(() => {
    setLoaded(true);
    completedRef.current = false;
    // Start timer on load
    timerRef.current = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, displayDuration);
  }, [displayDuration, onComplete]);

  const handleError = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    console.error(`[ImagePlayer] Error loading: ${src}`);
    onError();
  }, [src, onError]);

  useEffect(() => {
    completedRef.current = false;
    setLoaded(false);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [src]);

  const url = resolveMediaUrl(src);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
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
