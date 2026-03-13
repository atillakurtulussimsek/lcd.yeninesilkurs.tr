import { NextResponse } from "next/server";
import { initializeR2Bucket } from "@/app/services/r2-init";

/**
 * GET /api/init
 *
 * Manually trigger R2 bucket structure check.
 * Creates any missing required files (playlist.json, media/ folder).
 *
 * Usage: curl https://lcd.yeninesilkurs.tr/api/init
 */
export async function GET() {
  try {
    await initializeR2Bucket();

    return NextResponse.json({
      success: true,
      message: "R2 bucket structure verified and initialized.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[API /init] Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
