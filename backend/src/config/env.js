const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const candidatePaths = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(process.cwd(), ".env")
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const requiredKeys = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: process.env.PORT || 4000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  frontendUrl: process.env.FRONTEND_URL || "http://127.0.0.1:5173",
  enableBackgroundJobs: String(process.env.ENABLE_BACKGROUND_JOBS || "false").toLowerCase() === "true",
  backgroundJobTimezone: process.env.BACKGROUND_JOB_TIMEZONE || "Asia/Calcutta",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "no-reply@example.com",
  awsRegion: process.env.AWS_REGION || "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  awsS3Bucket: process.env.AWS_S3_BUCKET || "",
  awsS3PublicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL || ""
};
