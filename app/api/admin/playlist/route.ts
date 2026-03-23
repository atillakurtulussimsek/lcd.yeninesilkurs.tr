import { NextRequest, NextResponse } from "next/server";
import { getPlaylist, savePlaylist } from "@/app/services/r2";
import { Playlist } from "@/app/services/types";

/**
 * GET /api/admin/playlist
 * Read and return the current playlist.json from R2
 */
export async function GET() {
  try {
    const playlist = await getPlaylist();
    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[Admin Playlist] Error reading playlist:", error);
    return NextResponse.json(
      { error: "Failed to read playlist" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/playlist
 * Update playlist.json in R2
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate playlist structure
    if (!body || !Array.isArray(body.playlist)) {
      return NextResponse.json(
        { error: "Invalid playlist format. Expected { playlist: [...] }" },
        { status: 400 }
      );
    }

    // Validate each playlist item
    for (const item of body.playlist) {
      if (!item.type || !item.src) {
        return NextResponse.json(
          {
            error:
              'Each playlist item must have "type" and "src" fields',
          },
          { status: 400 }
        );
      }

      if (item.type !== "video" && item.type !== "image") {
        return NextResponse.json(
          { error: 'Playlist item type must be "video" or "image"' },
          { status: 400 }
        );
      }

      if (item.type === "image" && item.duration !== undefined) {
        if (typeof item.duration !== "number" || item.duration <= 0) {
          return NextResponse.json(
            { error: "Image duration must be a positive number" },
            { status: 400 }
          );
        }
      }
    }

    const playlist: Playlist = {
      playlist: body.playlist,
    };

    await savePlaylist(playlist);

    return NextResponse.json({
      success: true,
      message: "Playlist updated successfully",
      playlist,
    });
  } catch (error) {
    console.error("[Admin Playlist] Error updating playlist:", error);
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    );
  }
}
