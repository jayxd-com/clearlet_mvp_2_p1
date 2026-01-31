export const ENV = {
  // General
  isProduction: process.env.NODE_ENV === "production",

  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Authentication
  jwtSecret: process.env.JWT_SECRET ?? "super-secret-dev-key", // Fallback for dev, but should be set

  // S3 Compatible Storage (AWS S3 / MinIO / IONOS)
  awsAccessKeyId: process.env.IONOS_S3_ACCESS_KEY ?? process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.IONOS_S3_SECRET_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.IONOS_S3_REGION ?? process.env.AWS_REGION ?? "us-east-1",
  awsBucketName: process.env.IONOS_S3_BUCKET_NAME ?? process.env.AWS_BUCKET_NAME ?? "",
  awsEndpoint: process.env.IONOS_S3_ENDPOINT ?? process.env.AWS_ENDPOINT ?? "", // For MinIO or custom S3 endpoints
  publicS3Endpoint: process.env.PUBLIC_S3_ENDPOINT ?? process.env.IONOS_S3_ENDPOINT ?? process.env.AWS_ENDPOINT ?? "", // Publicly accessible URL for images
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" || !!process.env.IONOS_S3_ENDPOINT, // IONOS/MinIO often use path style or just safer to default if endpoint is custom

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  // SMTP (Mailpit/SendGrid/etc.)
  smtpHost: process.env.SMTP_HOST ?? "localhost",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "1028"),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "noreply@clearlet.com",
};
