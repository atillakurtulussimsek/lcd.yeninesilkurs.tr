import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Playlist } from "./types";

/**
 * Cloudflare R2 client (S3-compatible).
 * Used server-side only for bucket initialization checks.
 */
export function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "[R2] Missing credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Get the R2 bucket name from environment
 */
export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || "lcd-signage";
}

/**
 * Get the playlist path from environment
 */
export function getPlaylistPath(): string {
  return process.env.NEXT_PUBLIC_PLAYLIST_PATH || "playlist.json";
}

/**
 * Media file information returned by listMediaFiles
 */
export interface MediaFileInfo {
  key: string;
  size: number;
  lastModified: Date;
  type: "video" | "image" | "other";
}

/**
 * Read playlist.json from R2 bucket
 */
export async function getPlaylist(): Promise<Playlist> {
  const client = getR2Client();
  const bucket = getBucketName();
  const playlistPath = getPlaylistPath();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: playlistPath,
      })
    );

    const body = await response.Body?.transformToString();
    if (!body) {
      throw new Error("Empty playlist file");
    }

    return JSON.parse(body) as Playlist;
  } catch (error) {
    console.error("[R2] Error reading playlist:", error);
    throw error;
  }
}

/**
 * Save playlist.json to R2 bucket
 */
export async function savePlaylist(playlist: Playlist): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();
  const playlistPath = getPlaylistPath();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: playlistPath,
        Body: JSON.stringify(playlist, null, 2),
        ContentType: "application/json",
      })
    );
  } catch (error) {
    console.error("[R2] Error saving playlist:", error);
    throw error;
  }
}

/**
 * List all media files in the R2 bucket
 */
export async function listMediaFiles(): Promise<MediaFileInfo[]> {
  const client = getR2Client();
  const bucket = getBucketName();

  const videoExtensions = ["mp4", "webm", "mov"];
  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif"];

  const files: MediaFileInfo[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: "media/",
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      );

      for (const object of response.Contents || []) {
        if (!object.Key || object.Key.endsWith("/")) continue;

        const ext = object.Key.split(".").pop()?.toLowerCase() || "";
        let type: "video" | "image" | "other" = "other";

        if (videoExtensions.includes(ext)) {
          type = "video";
        } else if (imageExtensions.includes(ext)) {
          type = "image";
        }

        files.push({
          key: object.Key,
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
          type,
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return files;
  } catch (error) {
    console.error("[R2] Error listing media files:", error);
    throw error;
  }
}

/**
 * Upload a media file to R2 bucket
 */
export async function uploadMediaFile(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<{ key: string; size: number }> {
  const client = getR2Client();
  const bucket = getBucketName();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );

    return {
      key,
      size: file.length,
    };
  } catch (error) {
    console.error("[R2] Error uploading file:", error);
    throw error;
  }
}

/**
 * Delete a file from R2 bucket
 */
export async function deleteMediaFile(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (error) {
    console.error("[R2] Error deleting file:", error);
    throw error;
  }
}
