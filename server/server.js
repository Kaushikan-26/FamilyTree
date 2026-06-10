import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import relationshipRoutes from "./routes/relationshipRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

// Connect to MongoDB before serving requests
connectDB();

const app = express();

// --- Global middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); // parse JSON request bodies

// --- Health check (reports DB connectivity too) ---
app.get("/api/health", (_req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const db = dbStates[mongoose.connection.readyState] || "unknown";
  res.json({ status: "ok", db, uptime: process.uptime() });
});

// --- API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/relationships", relationshipRoutes);

// --- Serve the built React app in production (single-service deploy) ---
// Express hosts client/dist so the whole app runs from ONE URL (same origin,
// so no CORS/proxy needed — the frontend's "/api" calls just work).
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.join(__dirname, "..", "client", "dist");

  app.use(express.static(clientDist));

  // SPA fallback: any non-API GET returns index.html so client-side routing works
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next(); // let API 404s be JSON
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// --- Error handling (must be registered last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
