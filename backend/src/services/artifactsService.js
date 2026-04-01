const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  awsAccessKeyId,
  awsRegion,
  awsS3Bucket,
  awsS3PublicBaseUrl,
  awsSecretAccessKey
} = require("../config/env");
const { supabase } = require("../db/supabase");

function hasS3Config() {
  return Boolean(awsRegion && awsAccessKeyId && awsSecretAccessKey && awsS3Bucket);
}

function getS3Client() {
  return new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey
    }
  });
}

function buildPublicUrl(objectKey) {
  if (awsS3PublicBaseUrl) {
    return `${awsS3PublicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
  }
  return `https://${awsS3Bucket}.s3.${awsRegion}.amazonaws.com/${objectKey}`;
}

async function createUploadUrl({ objectKey, contentType }) {
  const command = new PutObjectCommand({
    Bucket: awsS3Bucket,
    Key: objectKey,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });
  return {
    uploadUrl,
    publicUrl: buildPublicUrl(objectKey)
  };
}

async function createArtifactRecord(payload) {
  return supabase.from("stored_artifacts").insert(payload).select().single();
}

async function listArtifacts() {
  return supabase
    .from("stored_artifacts")
    .select("*, users!stored_artifacts_uploaded_by_fkey(email, role)")
    .order("created_at", { ascending: false });
}

module.exports = {
  hasS3Config,
  createUploadUrl,
  createArtifactRecord,
  listArtifacts
};
