// --- src/app.js ---
// This file sets up the Express application with all its middleware and routes.
// It keeps the Express app setup clean and delegates to separate route files.
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "YOUR_PROD_FRONTEND_URL"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// --- Public Authentication Routes ---
// These routes are unprotected and are defined in a separate file as requested.
app.use("/api/auth", authRoutes);

// --- Protected Application Routes ---
app.use("/api", routes);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;