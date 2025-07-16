import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Eraser v1 backend running');
});

// Create a new board
app.post('/boards', async (req, res) => {
  try {
    const { title } = req.body;
    const board = await prisma.board.create({ data: { title } });
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ error: 'Error creating board' });
  }
});

// Get all boards
app.get('/boards', async (req, res) => {
  const boards = await prisma.board.findMany();
  res.json(boards);
});

// Get strokes for a specific board
app.get('/boards/:id/strokes', async (req, res) => {
  const { id } = req.params;
  const strokes = await prisma.stroke.findMany({
    where: { boardId: id },
  });
  res.json(strokes);
});

// Add a stroke to a board
app.post('/boards/:id/strokes', async (req, res) => {
  const { id } = req.params;
  const { points, color, width } = req.body;

  try {
    const stroke = await prisma.stroke.create({
      data: {
        points,
        color,
        width,
        board: { connect: { id } },
      },
    });
    res.status(201).json(stroke);
  } catch (err) {
    res.status(500).json({ error: 'Error saving stroke' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
