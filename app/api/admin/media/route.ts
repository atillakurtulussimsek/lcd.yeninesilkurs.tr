import { NextResponse } from "next/server";
import { listMediaFiles } from "@/app/services/r2";

/**
 * GET /api/admin/media
 * List all media files in the R2 bucket
 */
export async function GET() {
  try {
    const files = await listMediaFiles();

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        key: file.key,
        size: file.size,
        lastModified: file.lastModified.toISOString(),
        type: file.type,
      })),
      total: files.length,
    });
  } catch (error) {
    console.error("[Admin Media] Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list media files" },
      { status: 500 }
    );
  }
}
