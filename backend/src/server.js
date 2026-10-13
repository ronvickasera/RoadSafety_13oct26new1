import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import surveyRoutes from "./routes/surveyRoutes.js";

dotenv.config();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  })
);

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Road Safety API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveyRoutes);

app.use((error, req, res, next) => {
  console.error(error);

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON." });
  }

  return res.status(500).json({
    message: error.message || "Internal server error."
  });
});

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`Road Safety API running on http://localhost:${PORT}`);
});
