import { NextRequest, NextResponse } from "next/server";
import { uploadMediaFile } from "@/app/services/r2";

/**
 * Maximum file size: 500MB in bytes
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

/**
 * Allowed video file extensions
 */
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];

/**
 * Allowed image file extensions
 */
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

/**
 * Sanitize filename by removing special characters and Turkish characters
 */
function sanitizeFilename(filename: string): string {
  // Get file extension
  const parts = filename.split(".");
  const ext = parts.pop()?.toLowerCase() || "";
  const nameWithoutExt = parts.join(".");

  // Replace Turkish characters
  let sanitized = nameWithoutExt
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C");

  // Remove special characters, keep only alphanumeric, dash, and underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9-_]/g, "-");

  // Remove multiple consecutive dashes
  sanitized = sanitized.replace(/-+/g, "-");

  // Remove leading/trailing dashes
  sanitized = sanitized.replace(/^-|-$/g, "");

  // If name is empty after sanitization, use timestamp
  if (!sanitized) {
    sanitized = `file-${Date.now()}`;
  }

  return `${sanitized}.${ext}`;
}

/**
 * Validate file type based on extension
 */
function validateFileType(
  filename: string
): { valid: boolean; type?: "video" | "image"; error?: string } {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (!ext) {
    return { valid: false, error: "File has no extension" };
  }

  if (VIDEO_EXTENSIONS.includes(ext)) {
    return { valid: true, type: "video" };
  }

  if (IMAGE_EXTENSIONS.includes(ext)) {
    return { valid: true, type: "image" };
  }

  return {
    valid: false,
    error: `Invalid file type. Allowed: ${VIDEO_EXTENSIONS.join(", ")} for videos; ${IMAGE_EXTENSIONS.join(", ")} for images`,
  };
}

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const contentTypes: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };

  return contentTypes[ext] || "application/octet-stream";
}

/**
 * POST /api/admin/media/upload
 * Upload a media file to R2
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const validation = validateFileType(file.name);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.name);
    const key = `media/${sanitizedFilename}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get content type
    const contentType = getContentType(sanitizedFilename);

    // Upload to R2
    const result = await uploadMediaFile(buffer, key, contentType);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        key: result.key,
        size: result.size,
        type: validation.type,
        originalName: file.name,
        sanitizedName: sanitizedFilename,
      },
    });
  } catch (error) {
    console.error("[Admin Media Upload] Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
