import express from 'express';
import { search } from '../../controllers/eventsController.js';
import ensureAuth from '../../middlewares/ensureAuth.js';

const router = express.Router();

router.get('/search', ensureAuth, search);

export default router;
