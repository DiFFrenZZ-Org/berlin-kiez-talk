import { Request, Response, NextFunction } from 'express';

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

export default ensureAuth;
