import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('node-fetch', () => ({ default: vi.fn() }));
vi.mock('../src/lib/tokenStore.js', () => ({ save: vi.fn() }));

import fetch from 'node-fetch';
import { save } from '../src/lib/tokenStore.js';

let app;

beforeEach(async () => {
  vi.resetModules();
  const router = (await import('../src/routes/eventbriteAuth.js')).default;
  app = express();
  app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
  app.use('/auth/eventbrite', router);
  fetch.mockReset();
  save.mockReset();
});

describe('GET /auth/eventbrite/login', () => {
  it('redirects to Eventbrite', async () => {
    const res = await request(app).get('/auth/eventbrite/login');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch('https://www.eventbrite.com/oauth/authorize');
  });
});

describe('GET /auth/eventbrite/callback', () => {
  it('rejects invalid state', async () => {
    const res = await request(app).get('/auth/eventbrite/callback');
    expect(res.status).toBe(400);
  });
});

describe('refreshAccessToken', () => {
  it('returns token when still valid', async () => {
    const { refreshAccessToken } = await import('../src/routes/eventbriteAuth.js');
    const token = { access_token: 'a', refresh_token: 'r', expires_at: Date.now() + 100000 };
    const fresh = await refreshAccessToken('u1', token);
    expect(fresh).toEqual(token);
  });

  it('refreshes when expired', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ access_token: 'new', refresh_token: 'nr', expires_in: 3600 })
    });
    const { refreshAccessToken } = await import('../src/routes/eventbriteAuth.js');
    const token = { access_token: 'a', refresh_token: 'r', expires_at: Date.now() - 1000 };
    const fresh = await refreshAccessToken('u1', token);
    expect(fresh.access_token).toBe('new');
    expect(save).toHaveBeenCalled();
  });
});
