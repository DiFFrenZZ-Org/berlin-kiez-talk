import express from 'express';
import fetch   from 'node-fetch';          // remove this line if on Node ≥18
import { get as getToken } from '../lib/tokenStore.js';
import { refreshAccessToken } from './eventbriteAuth.js';

function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const router = express.Router();

/**
 * GET /events/search
 * Example: /events/search?q=music&location=Berlin&page=1&page_size=50
 *
 * Relays query to Eventbrite and returns the raw JSON.
 */
router.get('/search', ensureAuth, async (req, res) => {
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

    let tokenObj = getToken(req.session.userId);
    if (!tokenObj) {
      return res.status(401).json({ error: 'No Eventbrite credentials' });
    }
    tokenObj = await refreshAccessToken(req.session.userId, tokenObj);

    // Hit Eventbrite
    const ebRes = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenObj.access_token}` }
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
