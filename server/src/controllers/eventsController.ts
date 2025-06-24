import { Request, Response } from 'express';
import { get as getToken } from '../services/tokenStore.js';
import { refreshAccessToken, searchEvents } from '../services/eventbriteService.js';

export async function search(req: Request, res: Response) {
  try {
    const {
      q = '',
      location = 'Berlin',
      category = '',
      page = '1',
      page_size = '50',
    } = req.query as Record<string, string>;

    let token = getToken(req.session.userId!);
    if (!token) return res.status(401).json({ error: 'No Eventbrite credentials' });

    token = await refreshAccessToken(req.session.userId!, token);

    const data = await searchEvents(token, {
      orgId: process.env.EB_ORG_ID || '',
      'location.address': location,
      page,
      page_size,
      ...(q && { q }),
      ...(category && { categories: category }),
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
