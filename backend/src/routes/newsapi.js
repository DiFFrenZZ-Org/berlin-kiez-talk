import express from 'express';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Basic rate limiter so we don't exhaust free NewsAPI quota
router.use(rateLimit({ windowMs: 1000, max: 1 }));

router.get('/', async (req, res) => {
  const {
    q = 'Berlin',
    from,
    to,
    sources = 'bbc-news',
  } = req.query;

  const params = new URLSearchParams({
    q: q.toString(),
    sortBy: 'publishedAt',
    language: 'en',
    sources: sources.toString(),
  });
  if (from) params.set('from', from.toString());
  if (to) params.set('to', to.toString());
  params.set('apiKey', process.env.NEWSAPI_KEY ?? '');

  try {
    const r = await fetch(`https://newsapi.org/v2/everything?${params}`);
    if (!r.ok) throw new Error(`NewsAPI ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('[NewsAPI] ', err.message);
    res.status(502).json({ error: 'NewsAPI request failed' });
  }
});

export default router;
