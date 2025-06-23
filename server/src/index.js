import express from 'express';
import dotenv  from 'dotenv';
import session from 'express-session';
import eventsRouter from './routes/events.js';
import router from './routes/eventbriteAuth.js';

dotenv.config();                    // loads .env in /server

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax', secure: false }
}));

// mount /events routes
app.use('/auth/eventbrite', router);
app.use('/events', eventsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🟢  API server running at http://localhost:${PORT}`)
);
