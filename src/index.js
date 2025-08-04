// --- src/index.js ---
// This is the main entry point, responsible for creating and starting the server.
// It keeps the core startup logic clean by delegating to other modules.
const http = require("http");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const appRoutes = require("./routes");
const { initializeWebSocketServer } = require("./services/websocket");

const app = express();
const server = http.createServer(app);

// --- Express API Setup ---
app.use(cors({
  origin: ["http://localhost:5173", "YOUR_PROD_FRONTEND_URL"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Register public auth routes FIRST
app.use("/api/auth", authRoutes);

// Register all other protected app routes
app.use("/api", appRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

initializeWebSocketServer(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Eraser Backend V2 ready at http://localhost:${PORT}`);
  console.log(`⚡ WebSocket server running on port ${PORT}`);
});