import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./env";

// Initialize S3 Client
const s3Client = new S3Client({
  region: ENV.awsRegion,
  credentials: {
    accessKeyId: ENV.awsAccessKeyId,
    secretAccessKey: ENV.awsSecretAccessKey,
  },
  endpoint: ENV.awsEndpoint || undefined, // Use custom endpoint for MinIO
  forcePathStyle: ENV.s3ForcePathStyle, // Required for MinIO
});

/**
 * Generates a presigned URL for uploading an object to S3.
 * The client can then use this URL to PUT the file directly to S3.
 * @param key The object key (path and filename) in the S3 bucket.
 * @param contentType The content type of the file being uploaded (e.g., "image/jpeg").
 * @param acl Access Control List (default: "public-read"). Use "private" for sensitive docs.
 * @returns A presigned URL string.
 */
export async function createPresignedUploadUrl(key: string, contentType: string, acl: "public-read" | "private" = "public-read"): Promise<string> {
  if (!ENV.awsBucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured.");
  }

  const command = new PutObjectCommand({
    Bucket: ENV.awsBucketName,
    Key: key,
    ContentType: contentType,
    ACL: acl,
  });

  // URL expires in 1 minute (60 seconds)
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  // Replace internal endpoint with public endpoint if needed (for Docker/MinIO)
  if (ENV.publicS3Endpoint && ENV.awsEndpoint && signedUrl.includes(ENV.awsEndpoint)) {
    return signedUrl.replace(ENV.awsEndpoint, ENV.publicS3Endpoint);
  }

  return signedUrl;
}

/**
 * Generates a presigned URL for downloading an object from S3.
 * @param key The object key in the S3 bucket.
 * @param options Optional settings like response headers.
 * @returns A presigned URL string.
 */
export async function createPresignedDownloadUrl(
  key: string,
  options?: { responseContentDisposition?: string }
): Promise<string> {
  if (!ENV.awsBucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured.");
  }

  const command = new GetObjectCommand({
    Bucket: ENV.awsBucketName,
    Key: key,
    ResponseContentDisposition: options?.responseContentDisposition,
  });

  // URL expires in 1 minute (60 seconds)
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  // Replace internal endpoint with public endpoint if needed (for Docker/MinIO)
  if (ENV.publicS3Endpoint && ENV.awsEndpoint && signedUrl.includes(ENV.awsEndpoint)) {
    return signedUrl.replace(ENV.awsEndpoint, ENV.publicS3Endpoint);
  }

  return signedUrl;
}

/**
 * Generates the public URL for an object in the S3 bucket.
 * @param key The object key (path and filename) in the S3 bucket.
 * @returns The public URL string.
 */
export function getPublicImageUrl(key: string): string {
  if (ENV.publicS3Endpoint) {
    // For MinIO, IONOS, or custom S3 endpoints, use path-style access
    // Remove potential trailing slash from endpoint
    const endpoint = ENV.publicS3Endpoint.replace(/\/$/, "");
    return `${endpoint}/${ENV.awsBucketName}/${key}`;
  } else {
    // Default to AWS S3 virtual-hosted style access
    return `https://${ENV.awsBucketName}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
  }
}

/**
 * Directly uploads a file to S3/MinIO.
 */
export async function putObject(key: string, body: Buffer | Uint8Array | string, contentType: string, acl: "public-read" | "private" = "public-read") {
  if (!ENV.awsBucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured.");
  }

  const command = new PutObjectCommand({
    Bucket: ENV.awsBucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: acl,
  });

  return s3Client.send(command);
}

/**
 * Deletes an object from S3/MinIO.
 */
export async function deleteObject(key: string) {
  if (!ENV.awsBucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured.");
  }

  const command = new DeleteObjectCommand({
    Bucket: ENV.awsBucketName,
    Key: key,
  });

  return s3Client.send(command);
}
