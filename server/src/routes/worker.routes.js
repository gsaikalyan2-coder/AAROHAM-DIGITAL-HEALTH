import { Router } from 'express';
import {
  getWorkerProfile,
  updateWorkerProfile,
  getWorkerRecords,
} from '../controllers/worker.controller.js';

const router = Router();

router.get('/profile/:id?', getWorkerProfile);
router.put('/profile/:id?', updateWorkerProfile);
router.get('/records/:id?', getWorkerRecords);

export default router;
