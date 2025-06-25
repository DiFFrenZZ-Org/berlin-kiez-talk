import 'dotenv/config';
import express from 'express';
import fetch   from 'node-fetch';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// 1 req / sec so the free plan (1k req / day) is never exhausted
router.use(rateLimit({ windowMs: 1_000, max: 1 }));

/**
 * Simply forward *all* supported query params to NewsAPI.
 * Any param absent from req.query is omitted, so the route
 * stays future-proof when NewsAPI adds new parameters.
 */
router.get('/', async (req, res) => {
  // whitelist to avoid accidental SSRF
  const allowed = [
    'q','searchIn','sources','domains','excludeDomains',
    'from','to','language','sortBy','page','pageSize'
  ];

  const params = new URLSearchParams();

  allowed.forEach(k => {
    if (req.query[k]) params.set(k, req.query[k].toString());
  });

  // Default: Berlin AND culture, last 24 h, German or English
  if (!params.has('q'))        params.set('q', '"Berlin" AND culture');
  /*
  if (!params.has('language')) params.set('language', 'en');
  */
  if (!params.has('from')) {
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
    params.set('from', yesterday);
  }

  try {
    const r = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      headers: { 'X-Api-Key': process.env.NEWSAPI_KEY ?? '' } // safer than query-string :contentReference[oaicite:2]{index=2}
    });
    if (!r.ok) throw new Error(`NewsAPI ${r.status}`);
    // 👇  pass the response straight through — client gets *all* attributes
    res.json(await r.json());
  } catch (err) {
    console.error('[NewsAPI]', err.message);
    res.status(502).json({ error: 'NewsAPI request failed' });
  }
});

export default router;
