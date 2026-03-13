import {
  HeadObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getR2Client, getBucketName } from "./r2";

/**
 * Default playlist.json content created when the file doesn't exist in R2.
 */
const DEFAULT_PLAYLIST = {
  playlist: [
    {
      type: "image" as const,
      src: "media/placeholder.txt",
      duration: 10,
    },
  ],
};

/**
 * Required structure in the R2 bucket:
 * - playlist.json (root)
 * - media/ (folder for media files)
 */
interface RequiredFile {
  key: string;
  contentType: string;
  content: string | Buffer;
  description: string;
}

/**
 * Files and folders that must exist in the bucket.
 * Folders in S3/R2 are represented by zero-byte objects with trailing slash
 * or by a placeholder file inside.
 */
function getRequiredFiles(): RequiredFile[] {
  const playlistPath = process.env.NEXT_PUBLIC_PLAYLIST_PATH || "playlist.json";

  return [
    {
      key: playlistPath,
      contentType: "application/json",
      content: JSON.stringify(DEFAULT_PLAYLIST, null, 2),
      description: "Playlist configuration file",
    },
    {
      key: "media/placeholder.txt",
      contentType: "text/plain",
      content:
        "Bu klasöre medya dosyalarınızı (video/resim) yükleyin.\nUpload your media files (video/images) to this folder.",
      description: "Media folder placeholder",
    },
  ];
}

/**
 * Check if a file exists in R2
 */
async function fileExists(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucket = getBucketName();

    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch (err: unknown) {
    const error = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // Re-throw unexpected errors
    throw err;
  }
}

/**
 * Upload a file to R2
 */
async function uploadFile(file: RequiredFile): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: file.key,
      Body: file.content,
      ContentType: file.contentType,
    })
  );

  console.log(`[R2 Init] ✓ Created: ${file.key} (${file.description})`);
}

/**
 * List all objects in the bucket for diagnostic logging
 */
async function listBucketContents(): Promise<string[]> {
  try {
    const client = getR2Client();
    const bucket = getBucketName();

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 100,
      })
    );

    return (response.Contents || []).map((obj) => obj.Key || "").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Main initialization function.
 * Checks the R2 bucket for required files and creates any that are missing.
 *
 * Called on server startup via Next.js instrumentation.
 */
export async function initializeR2Bucket(): Promise<void> {
  console.log("[R2 Init] Checking bucket structure...");

  const requiredFiles = getRequiredFiles();
  let createdCount = 0;

  for (const file of requiredFiles) {
    try {
      const exists = await fileExists(file.key);

      if (!exists) {
        console.log(`[R2 Init] Missing: ${file.key} — creating...`);
        await uploadFile(file);
        createdCount++;
      } else {
        console.log(`[R2 Init] ✓ Exists: ${file.key}`);
      }
    } catch (err) {
      console.error(`[R2 Init] ✗ Error checking/creating ${file.key}:`, err);
    }
  }

  // Log bucket contents for diagnostics
  const contents = await listBucketContents();
  if (contents.length > 0) {
    console.log(`[R2 Init] Bucket contents (${contents.length} files):`);
    contents.forEach((key) => console.log(`  - ${key}`));
  }

  if (createdCount > 0) {
    console.log(
      `[R2 Init] Initialization complete. Created ${createdCount} missing file(s).`
    );
  } else {
    console.log("[R2 Init] All required files present. No action needed.");
  }
}
