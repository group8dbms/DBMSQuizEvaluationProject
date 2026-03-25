const { listCases, createCase, updateCase } = require("../services/casesService");
const { handleServerError } = require("../utils/http");

async function getCases(_req, res) {
  try {
    const { data, error } = await listCases();
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch cases.");
  }
}

async function postCase(req, res) {
  try {
    const { submission_id, verdict } = req.body;
    const { data, error } = await createCase({
      submission_id,
      verdict,
      proctor_id: req.user.id,
      status: "open"
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create case.");
  }
}

async function patchCase(req, res) {
  try {
    const updatePayload = {
      ...req.body,
      proctor_id: req.user.id
    };

    if (updatePayload.status === "resolved" && !updatePayload.resolved_at) {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data, error } = await updateCase(req.params.id, updatePayload);
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to update case.");
  }
}

module.exports = { getCases, postCase, patchCase };
