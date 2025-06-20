import express from 'express';
import dotenv  from 'dotenv';
import eventsRouter from './routes/events.js';

dotenv.config();                    // loads .env in /server

const app = express();
app.use(express.json());

// mount /events routes
app.use('/events', eventsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🟢  API server running at http://localhost:${PORT}`)
);
