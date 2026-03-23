import { NextRequest, NextResponse } from "next/server";
import { deleteMediaFile } from "@/app/services/r2";

/**
 * DELETE /api/admin/media/[key]
 * Delete a file from R2 bucket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Decode the key (it might be URL encoded)
    const decodedKey = decodeURIComponent(key);

    // Security check: only allow deleting files from media/ folder
    if (!decodedKey.startsWith("media/")) {
      return NextResponse.json(
        { error: "Can only delete files from media/ folder" },
        { status: 403 }
      );
    }

    // Security check: prevent path traversal
    if (decodedKey.includes("..")) {
      return NextResponse.json(
        { error: "Invalid file key" },
        { status: 400 }
      );
    }

    await deleteMediaFile(decodedKey);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      key: decodedKey,
    });
  } catch (error) {
    console.error("[Admin Media Delete] Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
