import { Router } from 'express';
import {
  searchPatientByABHA,
  addConsultation,
  addVaccination,
  addLabReport,
  listPatients,
} from '../controllers/doctor.controller.js';

const router = Router();

router.get('/patient-search', searchPatientByABHA);
router.get('/patients', listPatients);
router.post('/consultation', addConsultation);
router.post('/vaccination', addVaccination);
router.post('/lab-report', addLabReport);

export default router;
