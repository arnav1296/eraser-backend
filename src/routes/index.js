// this is src/routes/index.js 2nd pillar of backend design and protected routes management
const express = require("express");
const prisma = require("../services/prisma");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();

router.use(authMiddleware);

// --- User Routes ---
router.get("/users/me", async (req, res, next) => {
  const { id, email, name, createdAt } = req.user;
  res.json({ id, email, name, createdAt });
});

// --- Board Routes ---
router.get("/boards", async (req, res, next) => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        userId: req.user.id,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(boards);
  } catch (err) { next(err); }
});

router.get("/boards/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) { return res.status(400).json({ error: "Please provide board ID" }); }
    const board = await prisma.board.findUnique({
      where: { id: id, userId: req.user.id, isDeleted: false },
    });
    if (!board) { return res.status(404).json({ error: "Board not found or not accessible" }); }
    res.json(board);
  } catch (error) { next(error); }
});

router.post("/boards", async (req, res, next) => {
  try {
    const { name } = req.body;
    const boardTitle = name ? name.trim() : "Untitled Board";
    if (!boardTitle) { return res.status(400).json({ error: "Board name cannot be empty" }); }
    const board = await prisma.board.create({
      data: { title: boardTitle, userId: req.user.id },
    });
    res.status(201).json({ board });
  } catch (err) { next(err); }
});

router.put("/boards/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const boardTitle = name ? name.trim() : "";
    if (!id) { return res.status(400).json({ error: "Please provide board ID" }); }
    if (!boardTitle) { return res.status(400).json({ error: "Please provide a valid board name" }); }
    const board = await prisma.board.update({
      where: { id: id, userId: req.user.id, isDeleted: false },
      data: { title: boardTitle },
    });
    res.json({ msg: `${id} updated with name: ${boardTitle}`, board });
  } catch (err) {
    if (err.code === 'P2025') { return res.status(404).json({ error: "Board not found or not accessible" }); }
    next(err);
  }
});

router.delete("/boards/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) { return res.status(400).json({ error: "Please provide a valid board ID" }); }
    const board = await prisma.board.update({
      where: { id: id, userId: req.user.id, isDeleted: false },
      data: { isDeleted: true },
    });
    res.json({ msg: `Board ${id} soft-deleted successfully` });
  } catch (err) {
    if (err.code === 'P2025') { return res.status(404).json({ error: "Board not found or not accessible" }); }
    next(err);
  }
});
module.exports = router;