"use client";

import { usePlayer } from "@/app/hooks/usePlayer";
import { useWakeLock } from "@/app/hooks/useWakeLock";
import { useTVMode } from "@/app/hooks/useTVMode";
import { VideoPlayer } from "./VideoPlayer";
import { ImagePlayer } from "./ImagePlayer";

/**
 * Main signage player component.
 * Orchestrates the playback loop, TV mode optimizations, and wake lock.
 */
export function SignagePlayer() {
  const { currentItem, loading, error, onItemComplete, onItemError } = usePlayer();

  // Activate TV-specific optimizations
  useWakeLock();
  useTVMode();

  // Loading state
  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={spinnerStyle} />
      </div>
    );
  }

  // Error state with retry
  if (error && !currentItem) {
    return (
      <div style={overlayStyle}>
        <p style={{ color: "#333", fontSize: "1.2rem" }}>{error}</p>
        <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>
          Retrying...
        </p>
      </div>
    );
  }

  // No current item (shouldn't happen, but safety)
  if (!currentItem) {
    return <div style={overlayStyle} />;
  }

  // Render the appropriate player
  return (
    <div style={containerStyle}>
      {currentItem.type === "video" ? (
        <VideoPlayer
          key={`video-${currentItem.src}-${Date.now()}`}
          src={currentItem.src}
          onEnded={onItemComplete}
          onError={onItemError}
        />
      ) : (
        <ImagePlayer
          key={`image-${currentItem.src}-${Date.now()}`}
          src={currentItem.src}
          duration={currentItem.duration}
          onComplete={onItemComplete}
          onError={onItemError}
        />
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "#000",
  overflow: "hidden",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "#000",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const spinnerStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  border: "4px solid #333",
  borderTopColor: "#999",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};
