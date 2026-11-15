import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.routes.js';
import { errorHandler } from './middlewares/error.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/chat', chatRouter);

app.use(errorHandler);

export default app;
