const { createArtifactRecord, createUploadUrl, hasS3Config, listArtifacts } = require("../services/artifactsService");
const { recordAuditLog } = require("../services/auditLogsService");
const { badRequest, handleServerError } = require("../utils/http");
const { isNonEmptyString } = require("../utils/validation");

async function postArtifactUploadUrl(req, res) {
  try {
    const { file_name, content_type, artifact_type, submission_id = null, result_id = null } = req.body;
    if (!isNonEmptyString(file_name) || !isNonEmptyString(content_type) || !isNonEmptyString(artifact_type)) {
      return badRequest(res, "file_name, content_type, and artifact_type are required.");
    }
    if (!hasS3Config()) {
      return badRequest(res, "S3 is not configured yet. Add AWS storage environment variables first.");
    }

    const safeName = file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `${artifact_type}/${Date.now()}-${safeName}`;
    const upload = await createUploadUrl({ objectKey, contentType: content_type });
    const record = await createArtifactRecord({
      submission_id,
      result_id,
      uploaded_by: req.user.id,
      artifact_type,
      provider: "s3",
      object_key: objectKey,
      file_name,
      content_type,
      public_url: upload.publicUrl
    });

    if (record.error) {
      throw record.error;
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "artifact_upload_prepared",
      entity_type: "artifact",
      entity_id: record.data.id,
      metadata: { artifact_type, object_key: objectKey }
    });

    return res.status(201).json({
      artifact: record.data,
      upload_url: upload.uploadUrl,
      public_url: upload.publicUrl
    });
  } catch (error) {
    return handleServerError(res, error, "Unable to prepare artifact upload.");
  }
}

async function getArtifacts(_req, res) {
  try {
    const { data, error } = await listArtifacts();
    if (error) {
      throw error;
    }

    return res.json(data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch artifacts.");
  }
}

module.exports = { postArtifactUploadUrl, getArtifacts };
