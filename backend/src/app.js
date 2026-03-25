const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const usersRoutes = require("./routes/usersRoutes");
const examsRoutes = require("./routes/examsRoutes");
const submissionsRoutes = require("./routes/submissionsRoutes");
const integrityLogsRoutes = require("./routes/integrityLogsRoutes");
const casesRoutes = require("./routes/casesRoutes");
const { attachUser } = require("./middleware/attachUser");

const app = express();

app.use(cors());
app.use(express.json());
app.use(attachUser);

app.use("/api/health", healthRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/exams", examsRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/integrity-logs", integrityLogsRoutes);
app.use("/api/cases", casesRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "DBMSQuizEvaluationProject Backend",
    version: "1.0.0",
    endpoints: [
      "/api/health",
      "/api/users",
      "/api/exams",
      "/api/submissions",
      "/api/integrity-logs",
      "/api/cases"
    ]
  });
});

module.exports = app;
