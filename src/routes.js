const express = require("express");
const prisma = require("./services/prisma");
const authMiddleware = require("./middlewares/auth"); 
const router = express.Router();
router.use(authMiddleware);
router.get("/users/me", async (req, res) => {
    // req.user is set by authMiddleware
    const { id, email, name, createdAt } = req.user;
    res.json({ id, email, name, createdAt });
});
router.get("/boards", async (req, res, next) => {
    try {
        const boards = await prisma.board.findMany({
            where: {
                userId: req.user.id,
                isDeleted: false,
            },
            include: { strokes: true },
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
            include: { strokes: { orderBy: { createdAt: "asc" } } },
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
router.post("/boards/:boardId/strokes", async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const strokeData = req.body;
        if (!boardId) { return res.status(400).json({ error: "Board ID is required" }); }
        if (!strokeData || !strokeData.points) { return res.status(400).json({ error: "Stroke data (e.g., points) is required" }); }
        const board = await prisma.board.findUnique({
            where: { id: boardId, userId: req.user.id, isDeleted: false },
        });
        if (!board) { return res.status(404).json({ error: "Board not found or not accessible" }); }
        const stroke = await prisma.stroke.create({
            data: { ...strokeData, points: JSON.stringify(strokeData.points), boardId: boardId },
        });
        res.status(201).json(stroke);
    } catch (err) { next(err); }
});
router.get("/boards/:boardId/strokes", async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await prisma.board.findUnique({
            where: { id: boardId, userId: req.user.id, isDeleted: false },
        });
        if (!board) { return res.status(404).json({ error: "Board not found or not accessible" }); }
        const strokes = await prisma.stroke.findMany({
            where: { boardId },
            orderBy: { createdAt: "asc" },
        });
        const parsedStrokes = strokes.map(stroke => ({ ...stroke, points: JSON.parse(stroke.points), }));
        res.json({ strokes: parsedStrokes });
    } catch (err) { next(err); }
});
router.put("/strokes/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const strokeData = req.body;
        if (!id) { return res.status(400).json({ error: "Stroke ID is required" }); }
        if (!strokeData || !strokeData.points) { return res.status(400).json({ error: "Stroke data (e.g., points) is required for update" }); }
        const stroke = await prisma.stroke.update({
            where: { id: id, board: { userId: req.user.id, isDeleted: false, } },
            data: { points: JSON.stringify(strokeData.points) },
        });
        res.json(stroke);
    } catch (err) {
        if (err.code === 'P2025') { return res.status(404).json({ error: "Stroke not found or not accessible" }); }
        next(err);
    }
});
router.delete("/strokes/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) { return res.status(400).json({ error: "Please provide a valid stroke ID" }); }
        const stroke = await prisma.stroke.delete({
            where: { id: id, board: { userId: req.user.id, isDeleted: false, } },
        });
        res.json({ msg: `Stroke ${id} deleted successfully` });
    } catch (err) {
        if (err.code === 'P2025') { return res.status(404).json({ error: "Stroke not found or not accessible" }); }
        next(err);
    }
});

module.exports = router;