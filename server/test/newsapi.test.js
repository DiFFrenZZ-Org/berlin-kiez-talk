import express from 'express';
import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('node-fetch', () => ({ default: vi.fn() }));
import fetch from 'node-fetch';

let app;

beforeEach(async () => {
  vi.resetModules();
  const router = (await import('../src/routes/newsapi.js')).default;
  app = express();
  app.use('/api/news', router);
  fetch.mockReset();
});

describe('GET /api/news', () => {
  it('returns data on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ articles: [] }),
    });

    const res = await request(app).get('/api/news?q=test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ articles: [] });
  });

  it('handles NewsAPI errors', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 });

    const res = await request(app).get('/api/news');
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'NewsAPI request failed' });
  });
});
