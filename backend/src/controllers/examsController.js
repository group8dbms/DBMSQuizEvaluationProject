const {
  listExams,
  getExamById,
  createExam,
  createQuestion
} = require("../services/examsService");
const { handleServerError } = require("../utils/http");

async function getExams(_req, res) {
  try {
    const { data, error } = await listExams();
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch exams.");
  }
}

async function getExam(req, res) {
  try {
    const { data, error } = await getExamById(req.params.id);
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch exam.");
  }
}

async function postExam(req, res) {
  try {
    const { title, start_time, end_time, config_json } = req.body;
    const { data, error } = await createExam({
      title,
      start_time,
      end_time,
      config_json,
      created_by: req.user.id
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create exam.");
  }
}

async function postQuestion(req, res) {
  try {
    const { text, type, correct_answer, marks } = req.body;
    const { data, error } = await createQuestion({
      exam_id: Number(req.params.id),
      text,
      type,
      correct_answer,
      marks
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create question.");
  }
}

module.exports = { getExams, getExam, postExam, postQuestion };
