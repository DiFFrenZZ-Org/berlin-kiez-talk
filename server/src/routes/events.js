import express from 'express';
import fetch   from 'node-fetch';          // remove this line if on Node ≥18

const router = express.Router();

/**
 * GET /events/search
 * Example: /events/search?q=music&location=Berlin&page=1&page_size=50
 *
 * Relays query to Eventbrite and returns the raw JSON.
 */
router.get('/search', async (req, res) => {
  try {
    // Pull user-supplied filters or fall back to safe defaults
    const {
      q        = '',          // keyword search
      location = 'Berlin',
      category = '',
      page     = '1',
      page_size = '50'
    } = req.query;

    // Build the Eventbrite URL
    const url = new URL('https://www.eventbriteapi.com/v3/events/search/');
    url.searchParams.set('expand', 'venue');
    url.searchParams.set('location.address', location);
    url.searchParams.set('page', page);
    url.searchParams.set('page_size', page_size);
    if (q)       url.searchParams.set('q', q);
    if (category) url.searchParams.set('categories', category);

    // Grab the OAuth token from .env
    const token = process.env.EVENTBRITE_OAUTH_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Server mis-config: no Eventbrite token' });
    }

    // Hit Eventbrite
    const ebRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!ebRes.ok) {
      const errText = await ebRes.text();
      return res.status(ebRes.status).json({ error: errText });
    }

    const data = await ebRes.json();
    return res.json(data);           // send everything to the client
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
