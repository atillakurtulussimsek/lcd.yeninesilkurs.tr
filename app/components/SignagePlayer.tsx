"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/app/hooks/usePlayer";
import { useWakeLock } from "@/app/hooks/useWakeLock";
import { useTVMode } from "@/app/hooks/useTVMode";
import { VideoPlayer } from "./VideoPlayer";
import { ImagePlayer } from "./ImagePlayer";
import type { PlaylistItem } from "@/app/services/types";

/** A buffered item ready for display */
interface BufferItem {
  id: number;
  item: PlaylistItem;
}

/**
 * Main signage player component.
 * Uses a simple double-buffer approach:
 *  - "active" = currently displayed item (always visible)
 *  - "pending" = next item, loading behind the scenes (invisible)
 *  When pending signals ready → it becomes active, old active is removed.
 */
export function SignagePlayer() {
  const { currentItem, playbackId, loading, error, onItemComplete, onItemError } =
    usePlayer();

  useWakeLock();
  useTVMode();

  // Double buffer: active is displayed, pending loads behind it
  const [active, setActive] = useState<BufferItem | null>(null);
  const [pending, setPending] = useState<BufferItem | null>(null);
  const pendingRef = useRef<BufferItem | null>(null);

  // When player produces a new item, decide where it goes
  useEffect(() => {
    if (!currentItem || playbackId === 0) return;

    const newItem: BufferItem = { id: playbackId, item: currentItem };

    if (!active) {
      // First item ever — show immediately
      console.log(`[Signage] First item, showing directly: ${currentItem.src}`);
      setActive(newItem);
    } else {
      // Queue as pending — loads behind the active item
      console.log(`[Signage] Queuing pending: ${currentItem.src}`);
      pendingRef.current = newItem;
      setPending(newItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, playbackId]);

  // Called when pending item's media is ready to display
  const handlePendingReady = useCallback(() => {
    const item = pendingRef.current;
    if (item) {
      console.log(`[Signage] Pending ready, swapping to active: ${item.item.src}`);
      setActive(item);
      setPending(null);
      pendingRef.current = null;
    }
  }, []);

  // Safety: if pending doesn't signal ready within 4s, force-display it
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      console.warn(`[Signage] Safety timeout: force-activating pending item`);
      handlePendingReady();
    }, 4000);
    return () => clearTimeout(timer);
  }, [pending, handlePendingReady]);

  // --- Render ---

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={spinnerStyle} />
      </div>
    );
  }

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

  if (!active) {
    return <div style={overlayStyle} />;
  }

  // Build the render list: active is always rendered; pending loads behind it
  const items: Array<{ buf: BufferItem; isActive: boolean }> = [];
  items.push({ buf: active, isActive: true });
  if (pending && pending.id !== active.id) {
    items.push({ buf: pending, isActive: false });
  }

  return (
    <div style={containerStyle}>
      {items.map(({ buf, isActive }) => (
        <div
          key={buf.id}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: isActive ? 1 : 0,
            opacity: isActive ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          {buf.item.type === "video" ? (
            <VideoPlayer
              src={buf.item.src}
              paused={!isActive}
              onEnded={isActive ? onItemComplete : noop}
              onError={isActive ? onItemError : noop}
              onReady={!isActive ? handlePendingReady : undefined}
            />
          ) : (
            <ImagePlayer
              src={buf.item.src}
              duration={buf.item.duration}
              paused={!isActive}
              onComplete={isActive ? onItemComplete : noop}
              onError={isActive ? onItemError : noop}
              onReady={!isActive ? handlePendingReady : undefined}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const noop = () => {};

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
