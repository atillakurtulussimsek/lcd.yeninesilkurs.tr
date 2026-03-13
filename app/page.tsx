"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

// Dynamic import to avoid SSR issues with video/audio APIs
const SignagePlayer = dynamic(
  () =>
    import("@/app/components/SignagePlayer").then((mod) => ({
      default: mod.SignagePlayer,
    })),
  { ssr: false }
);

export default function Home() {
  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return <SignagePlayer />;
}
