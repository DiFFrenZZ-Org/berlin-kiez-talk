/* --------------------------------------------------------- *
 *  Eventbrite OAuth router                                  *
 *  Final URLs when mounted at /auth/eventbrite :            *
 *    GET /auth/eventbrite/login                             *
 *    GET /auth/eventbrite/callback                          *
 * --------------------------------------------------------- */
import 'dotenv/config';
import express from 'express';
import fetch   from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { save, get } from '../lib/tokenStore.js';   // get() is handy later

const router = express.Router();

/* --------------------------------------------------------- *
 *  Refresh helper (exported for /events route)              *
 * --------------------------------------------------------- */
export async function refreshAccessToken(userId, token) {
  if (!token) return null;

  if (!token.refresh_token) {
    return token;
  }

  /* still valid for >60 s ? */
  if (token.expires_at && token.expires_at - 60_000 > Date.now()) {
    return token;
  }

  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: token.refresh_token,
    client_id:     process.env.EB_CLIENT_ID,
    client_secret: process.env.EB_CLIENT_SECRET,
  });

  const resp = await fetch('https://www.eventbrite.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    console.error('[REFRESH] failed:', await resp.text());
    return token;                                // fall back to old token
  }

  const json = await resp.json();
  const fresh = {
    access_token:  json.access_token,
    refresh_token: json.refresh_token || token.refresh_token,
    expires_at:    Date.now() + json.expires_in * 1000,
  };
  save(userId, fresh);
  return fresh;
}

/* --------------------------------------------------------- *
 *  1.  /login  → 302 to Eventbrite                          *
 * --------------------------------------------------------- */
router.get('/login', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;                       // save in session
  console.log('[LOGIN]  session', req.session.id, 'state', state);

  const url = new URL('https://www.eventbrite.com/oauth/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.EB_CLIENT_ID);
  url.searchParams.set(
    'redirect_uri',
    process.env.EB_REDIRECT_URI ||
      'http://localhost:3000/auth/eventbrite/callback'
  );
  url.searchParams.set('scope', 'events:read offline_access'); // offline access for refresh token
  url.searchParams.set('state', state);

  res.redirect(url.toString());
});

/* --------------------------------------------------------- *
 *  2.  /callback  ← Eventbrite redirects here               *
 * --------------------------------------------------------- */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  console.log('[CALLBACK] session', req.session.id,
              'incoming', state,
              'stored', req.session.oauthState);

  /* ---- CSRF / replay guard -------------------------------- */
  if (!code || !state || state !== req.session.oauthState) {
    return res.status(400).send('Invalid OAuth state');
  }
  delete req.session.oauthState;                         // one-time use

  /* ---- Exchange code ⟶ access/refresh tokens -------------- */
  const body = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    client_id:     process.env.EB_CLIENT_ID,
    client_secret: process.env.EB_CLIENT_SECRET,
    redirect_uri:  process.env.EB_REDIRECT_URI ||
                   'http://localhost:3000/auth/eventbrite/callback',
  });

  const resp = await fetch('https://www.eventbrite.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    console.error('[CALLBACK] token exchange failed:', await resp.text());
    return res.status(502).send('OAuth token exchange failed');
  }

  const json = await resp.json();
  const token = {
    access_token:  json.access_token,
    refresh_token: json.refresh_token,
    expires_at:    Date.now() + json.expires_in * 1000,
  };

  /* ---- link tokens to the session’s user ------------------ */
  if (!req.session.userId) req.session.userId = uuidv4();
  save(req.session.userId, token);
  console.log('[CALLBACK] stored token for', req.session.userId);

  /* ---- back to the front-end ------------------------------ */
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
});

export default router;
