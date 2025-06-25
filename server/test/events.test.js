import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('node-fetch', () => ({ default: vi.fn() }));
vi.mock('../src/lib/tokenStore.js', () => ({ get: vi.fn() }));
vi.mock('../src/routes/eventbriteAuth.js', () => ({ refreshAccessToken: vi.fn() }));

import fetch from 'node-fetch';
import { get as getToken } from '../src/lib/tokenStore.js';
import { refreshAccessToken } from '../src/routes/eventbriteAuth.js';

let app;

beforeEach(async () => {
  vi.resetModules();
  const router = (await import('../src/routes/events.js')).default;
  app = express();
  app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
  app.get('/set-user', (req, res) => {
    req.session.userId = 'u1';
    res.end();
  });
  app.use('/events', router);
  fetch.mockReset();
  getToken.mockReset();
  refreshAccessToken.mockReset();
});

describe('GET /events/search', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/events/search');
    expect(res.status).toBe(401);
  });

  it('returns data on success', async () => {
    const agent = request.agent(app);
    await agent.get('/set-user');

    getToken.mockReturnValue({ access_token: 'a', refresh_token: 'r' });
    refreshAccessToken.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ events: [] }),
    });

    const res = await agent.get('/events/search');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ events: [] });
  });

  it('handles Eventbrite errors', async () => {
    const agent = request.agent(app);
    await agent.get('/set-user');
    getToken.mockReturnValue({ access_token: 'a', refresh_token: 'r' });
    refreshAccessToken.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });
    fetch.mockResolvedValue({ ok: false, status: 403, text: vi.fn().mockResolvedValue('fail') });

    const res = await agent.get('/events/search');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'fail' });
  });
});
