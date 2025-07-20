// src/routes.js
const express = require("express");
const prisma = require("./services/prisma"); // Import prisma client instance
const authMiddleware = require("./middlewares/auth"); // Import the authentication middleware

const router = express.Router();

// --- Apply Authentication Middleware to ALL routes in THIS router ---
// All routes defined AFTER this line will require a valid JWT.
router.use(authMiddleware);

// ====================================================================
// USER ROUTES (e.g., /api/users/me)
// ====================================================================
router.get("/users/me", async (req, res, next) => { // Added next for consistency
    // req.user is set by authMiddleware
    const { id, email, name, createdAt } = req.user;
    res.json({ id, email, name, createdAt });
});


// ====================================================================
// BOARD ROUTES
// ====================================================================

// fetch all boards for the authenticated user
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

// get specific board with everything in it for the authenticated user
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

// Create new board for the authenticated user
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

// Update board name for the authenticated user
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

// Delete board (soft delete) for the authenticated user
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


// ====================================================================
// STROKE ROUTES
// ====================================================================

// create new stroke
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

// REPLACE all strokes for a specific board (owned by authenticated user)
// This will delete existing strokes and create new ones from the provided array.
router.patch("/boards/:boardId/strokes", async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const newStrokesData = req.body; // Expect an array of stroke objects

        if (!boardId) {
            return res.status(400).json({ message: "Board ID is required" });
        }
        if (!Array.isArray(newStrokesData)) {
            return res.status(400).json({ message: "Request body must be an array of strokes" });
        }

        // 1. Verify the board exists and belongs to the authenticated user
        const board = await prisma.board.findUnique({
            where: { id: boardId, userId: req.user.id, isDeleted: false },
        });
        if (!board) {
            return res.status(404).json({ message: "Board not found or not accessible" });
        }

        // 2. Delete all existing strokes for this board
        await prisma.stroke.deleteMany({
            where: { boardId: boardId },
        });

        // 3. Create new strokes from the provided data
        if (newStrokesData.length > 0) {
            // Prepare data for createMany, ensuring points are stringified
            const dataToCreate = newStrokesData.map(stroke => ({
                // Ensure all fields from schema are included, e.g., tool, color, strokeWidth
                // Provide defaults if not always present, matching your schema defaults or requirements
                tool: stroke.tool || 'pen',
                color: stroke.color || 'black',
                strokeWidth: stroke.strokeWidth || 2,
                points: JSON.stringify(stroke.points), // Ensure points is a JSON string
                boardId: boardId,
            }));
            await prisma.stroke.createMany({
                data: dataToCreate,
            });
        }

        // 4. Respond with success
        res.status(200).json({ message: `Board ${boardId} strokes updated successfully.` });

    } catch (err) {
        console.error("Error replacing strokes:", err);
        next(err); // Pass error to global error handler
    }
});

// Get all strokes for a specific board
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

// Update stroke
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

// delete stroke
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