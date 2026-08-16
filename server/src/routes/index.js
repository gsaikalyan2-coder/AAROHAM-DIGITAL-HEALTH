import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import workerRoutes from './worker.routes.js';
import doctorRoutes from './doctor.routes.js';
import analyticsRoutes from './analytics.routes.js';
import chatRoutes from './chat.routes.js';
import ragRoutes from './rag.routes.js';
import directoryRoutes from './directory.routes.js';
import appointmentRoutes from './appointment.routes.js';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/workers', workerRoutes);
router.use('/doctor', doctorRoutes);
router.use('/analytics', analyticsRoutes);
router.use(chatRoutes);
router.use('/rag', ragRoutes);
router.use(directoryRoutes);
router.use(appointmentRoutes);

export default router;