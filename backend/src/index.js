// backend/src/index.js
import express from 'express';
import dotenv  from 'dotenv';
import session from 'express-session';

import eventsRouter     from './routes/events.js';
import router           from './routes/eventbriteAuth.js';
import serpapiRouter    from './routes/serpapi.js';
import newsRouter       from './routes/newsapi.js';

dotenv.config();                       // load .env first

const app = express();                 // ← create app **before** .use()

/* ---------- global middleware ---------- */
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'lax', secure: false },
  })
);

/* ---------- route mounts --------------- */
app.use('/auth/eventbrite', router);   // existing Eventbrite OAuth
app.use('/events', eventsRouter);      // your /events API

// NEW: SerpAPI proxy  ➜  /api/serp/events?city=Berlin
app.use('/api/serp', serpapiRouter);   // ← note leading “/” and position *after* app created
// NEW: NewsAPI proxy   ➜  /api/news?from=2025-06-24
app.use('/api/news', newsRouter);

/* ---------- start server --------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🟢  API server running at http://localhost:${PORT}`)
);
