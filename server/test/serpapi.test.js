import express from 'express';
import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('node-fetch', () => ({ default: vi.fn() }));
import fetch from 'node-fetch';

let app;

beforeEach(async () => {
  vi.resetModules();
  const router = (await import('../src/routes/serpapi.js')).default;
  app = express();
  app.use('/api/serp', router);
  fetch.mockReset();
});

describe('GET /api/serp/events', () => {
  it('returns data on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ hello: 'world' }),
    });

    const res = await request(app).get('/api/serp/events?city=Berlin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ hello: 'world' });
  });

  it('handles errors from SerpAPI', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 });

    const res = await request(app).get('/api/serp/events');
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'SerpAPI request failed' });
  });
});
