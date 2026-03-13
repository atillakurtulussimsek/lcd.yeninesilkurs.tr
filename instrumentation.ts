import { initializeR2Bucket } from "@/app/services/r2-init";

/**
 * Next.js instrumentation hook.
 * Runs once when the server starts.
 *
 * Used to check R2 bucket structure and create missing files.
 */
export async function register() {
  // Only run on the server (Node.js runtime), not on Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Startup] Server starting, checking R2 bucket...");

    try {
      await initializeR2Bucket();
    } catch (err) {
      // Don't crash the server if R2 init fails (credentials might not be set)
      console.error("[Startup] R2 initialization failed:", err);
      console.warn(
        "[Startup] The player will still work if playlist.json exists on the CDN."
      );
    }
  }
}
