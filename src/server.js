import express from 'express';
import cors from 'cors';
import strokeRoutes from './routes/strokes.js';

const app = express();
app.use(cors());
app.use(express.json()); // important for reading JSON body

app.use('/strokes', strokeRoutes);

app.listen(4000, () => console.log('Server running on http://localhost:4000'));
