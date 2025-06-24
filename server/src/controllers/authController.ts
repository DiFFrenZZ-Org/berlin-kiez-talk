import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { save } from '../services/tokenStore.js';

export async function login(req: Request, res: Response) {
  const state = uuidv4();
  req.session.oauthState = state;

  const url = new URL('https://www.eventbrite.com/oauth/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.EB_CLIENT_ID!);
  url.searchParams.set(
    'redirect_uri',
    process.env.EB_REDIRECT_URI || 'http://localhost:3000/auth/eventbrite/callback'
  );
  url.searchParams.set('scope', 'events:read offline_access');
  url.searchParams.set('state', state);
  res.redirect(url.toString());
}

export async function callback(req: Request, res: Response) {
  const { code, state } = req.query as Record<string, string>;
  if (!code || !state || state !== req.session.oauthState) {
    return res.status(400).send('Invalid OAuth state');
  }
  delete req.session.oauthState;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.EB_CLIENT_ID!,
    client_secret: process.env.EB_CLIENT_SECRET!,
    redirect_uri: process.env.EB_REDIRECT_URI ||
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
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
  if (!req.session.userId) req.session.userId = uuidv4();
  save(req.session.userId, token);
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
}
