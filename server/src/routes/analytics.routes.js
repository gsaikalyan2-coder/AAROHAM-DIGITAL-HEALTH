import { Router } from 'express';
import { getSurveillanceMetrics } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/surveillance', getSurveillanceMetrics);

export default router;
