import { NextResponse } from "next/server";

const CDN_BASE_URL =
  process.env.NEXT_PUBLIC_CDN_BASE_URL || "https://lcd-cdn.yeninesilkurs.tr";
const PLAYLIST_PATH =
  process.env.NEXT_PUBLIC_PLAYLIST_PATH || "playlist.json";

/**
 * GET /api/playlist
 *
 * Server-side proxy for fetching the playlist JSON from CDN.
 * This avoids CORS issues since the request is made server-to-server.
 */
export async function GET() {
  try {
    const url = `${CDN_BASE_URL}/${PLAYLIST_PATH}?t=${Date.now()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`[API /playlist] CDN returned HTTP ${res.status}`);
      return NextResponse.json(
        { error: `CDN returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[API /playlist] Error:", err);

    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
