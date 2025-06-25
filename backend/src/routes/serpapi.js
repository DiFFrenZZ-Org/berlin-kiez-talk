import express from 'express';
import fetch   from 'node-fetch';               // or native fetch in Node 18+
import rateLimit from 'express-rate-limit';

const router = express.Router();

/* Basic 1-req/sec limiter so you don’t burn your SerpAPI credits */
router.use(rateLimit({ windowMs: 1000, max: 1 }));

router.get('/events', async (req, res) => {
  const city = req.query.city ?? 'Berlin';
  const qs   = new URLSearchParams({
    engine : 'google_events',
    hl     : 'en',
    q      : `Events in ${city}`,
    api_key: process.env.SERPAPI_KEY       //  ◀  never expose this to the client
  });

  try {
    const r = await fetch(`https://serpapi.com/search.json?${qs}`);
    if (!r.ok) throw new Error(`SerpAPI ${r.status}`);

    const data = await r.json();
    res.json(data);                         // whatever SerpAPI sends
  } catch (err) {
    console.error('[SerpAPI] ', err.message);
    res.status(502).json({ error: 'SerpAPI request failed' });
  }
});

export default router;
