// --- src/services/websocket.js ---
// This module contains all the real-time WebSocket logic, now in the services folder.
const WebSocket = require("ws");
const { Server } = require("y-websocket");
const prisma = require("./services/prisma");
const { Doc } = require("yjs");
const jwt = require("jsonwebtoken");
const config = require("./config/config");

const docs = new Map();

const persistence = {
  writeState: async (doc, boardId) => {
    try {
      const state = Doc.encodeStateAsUpdate(doc);
      await prisma.board.update({
        where: { id: boardId },
        data: { documentState: Buffer.from(state) },
      });
      console.log(`[WS] Persisted state for board ${boardId}`);
    } catch (error) {
      console.error(`[WS] Failed to persist state for board ${boardId}:`, error);
    }
  },

  readState: async (boardId) => {
    try {
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { documentState: true },
      });

      if (board && board.documentState) {
        const doc = new Doc();
        Doc.applyUpdate(doc, new Uint8Array(board.documentState));
        return doc;
      }
    } catch (error) {
      console.error(`[WS] Failed to read state for board ${boardId}:`, error);
    }
    return new Doc();
  },
};

const initializeWebSocketServer = (server) => {
  const wsServer = new Server({
    server: server,
  });

  wsServer.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    const token = urlParams.get("token");
    const boardId = urlParams.get("boardId");

    if (!token || !boardId) {
      console.log("[WS] Connection rejected: Missing token or boardId.");
      ws.close(1008, "Missing token or boardId");
      return;
    }
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      console.log(`[WS] Connection authenticated for user ${decoded.userId}`);
    } catch (error) {
      console.error("[WS] Connection rejected: Invalid token.", error);
      ws.close(1008, "Invalid token");
    }
  });

  wsServer.setPersistence(persistence);
};

module.exports = { initializeWebSocketServer };