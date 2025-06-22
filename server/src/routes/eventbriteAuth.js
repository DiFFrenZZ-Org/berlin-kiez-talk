import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { save } from '../lib/tokenStore.js';

const router = express.Router();

export async function refreshAccessToken(userId, token) {
  if (!token) return null;
  const now = Date.now();
  if (token.expires_at && token.expires_at - 60000 > now) {
    return token;
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: process.env.EVENTBRITE_CLIENT_ID,
    client_secret: process.env.EVENTBRITE_CLIENT_SECRET,
  });

  const res = await fetch('https://www.eventbrite.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error('Failed to refresh token:', await res.text());
    return token;
  }

  const json = await res.json();
  const newToken = {
    access_token: json.access_token,
    refresh_token: json.refresh_token || token.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
  save(userId, newToken);
  return newToken;
}

router.get('/auth/eventbrite/login', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;
  const url = new URL('https://www.eventbrite.com/oauth/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.EVENTBRITE_CLIENT_ID);
  url.searchParams.set('redirect_uri', process.env.EVENTBRITE_REDIRECT_URI || 'http://localhost:3000/auth/eventbrite/callback');
  url.searchParams.set('scope', 'events:read');
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

router.get('/auth/eventbrite/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.oauthState) {
    return res.status(400).send('Invalid OAuth state');
  }
  delete req.session.oauthState;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.EVENTBRITE_CLIENT_ID,
    client_secret: process.env.EVENTBRITE_CLIENT_SECRET,
    redirect_uri: process.env.EVENTBRITE_REDIRECT_URI || 'http://localhost:3000/auth/eventbrite/callback',
  });

  const tokenRes = await fetch('https://www.eventbrite.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error('Token exchange failed:', text);
    return res.status(500).send('OAuth failed');
  }

  const json = await tokenRes.json();
  const token = {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };

  if (!req.session.userId) {
    req.session.userId = uuidv4();
  }
  save(req.session.userId, token);
  res.redirect('/');
});

export default router;
