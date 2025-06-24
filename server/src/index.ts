import express from 'express';
import session from 'express-session';
import loadEnv from './utils/env.js';
import authRouter from './routes/auth/eventbrite.js';
import eventsRouter from './routes/events/search.js';

loadEnv();

const app = express();
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'lax', secure: false },
  })
);

app.use('/auth/eventbrite', authRouter);
app.use('/events', eventsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢  API server running at http://localhost:${PORT}`);
});
