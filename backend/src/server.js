const app = require("./app");
const { port } = require("./config/env");
const { startBackgroundJobs } = require("./jobs");

app.listen(port, () => {
  startBackgroundJobs();
  console.log(`Backend server running on port ${port}`);
});
