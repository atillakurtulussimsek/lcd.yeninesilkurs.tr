import { S3Client } from "@aws-sdk/client-s3";

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
