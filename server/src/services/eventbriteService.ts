import fetch from 'node-fetch';
import { Token, save } from './tokenStore.js';

export async function refreshAccessToken(userId: string, token: Token): Promise<Token> {
  if (!token.refresh_token) return token;
  if (token.expires_at && token.expires_at - 60_000 > Date.now()) return token;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: process.env.EB_CLIENT_ID!,
    client_secret: process.env.EB_CLIENT_SECRET!,
  });

  const resp = await fetch('https://www.eventbrite.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    console.error('[REFRESH] failed:', await resp.text());
    return token;
  }

  const json = await resp.json();
  const fresh: Token = {
    access_token: json.access_token,
    refresh_token: json.refresh_token || token.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
  save(userId, fresh);
  return fresh;
}

export async function searchEvents(token: Token, params: Record<string, string>): Promise<any> {
  const url = new URL('https://www.eventbriteapi.com/v3/organizations/');
  // This service expects 'orgId' in params for constructing url path
  const orgId = params.orgId || process.env.EB_ORG_ID || '';
  url.pathname += `${orgId}/events`;
  delete params.orgId;
  url.searchParams.set('expand', 'venue');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}
