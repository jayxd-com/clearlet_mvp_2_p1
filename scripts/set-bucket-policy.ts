import { S3Client, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  endpoint: process.env.AWS_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

async function setPolicy() {
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    console.error("AWS_BUCKET_NAME not set");
    return;
  }

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${bucketName}/*`, // Allow public read for everything
      },
    ],
  };

  try {
    console.log(`Setting public policy for bucket: ${bucketName}...`);
    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    });

    await s3Client.send(command);
    console.log("✅ Successfully set public bucket policy.");
  } catch (error: any) {
    console.error("❌ Failed to set bucket policy:", error.message);
  }
}

setPolicy();
