import { query } from '../config/db.js';

export async function searchPatientByABHA(req, res, next) {
  try {
    const { abhaId, queryStr } = req.query;
    const searchTerm = abhaId || queryStr;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide ABHA ID or search term.' },
      });
    }

    const workerResult = await query(
      `SELECT id, full_name, ABHA_id, email, age, home_state, current_address,
              date_of_birth, gender, blood_group, employer_name, employer_phone_number,
              is_vaccinated, spoken_language, previous_health_issues, created_at
       FROM workers
       WHERE ABHA_id ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1`,
      [`%${searchTerm.trim()}%`]
    );

    if (workerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `No patient found matching '${searchTerm}'.` },
      });
    }

    const worker = workerResult.rows[0];

    // Fetch patient's full medical history
    const consultations = await query(
      `SELECT * FROM consultations WHERE worker_id = $1 ORDER BY visit_date DESC`,
      [worker.id]
    );

    const vaccinations = await query(
      `SELECT * FROM vaccinations WHERE worker_id = $1 ORDER BY administered_on DESC`,
      [worker.id]
    );

    const labReports = await query(
      `SELECT * FROM lab_reports WHERE worker_id = $1 ORDER BY test_date DESC`,
      [worker.id]
    );

    return res.json({
      success: true,
      data: {
        worker,
        consultations: consultations.rows,
        vaccinations: vaccinations.rows,
        labReports: labReports.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function addConsultation(req, res, next) {
  try {
    const {
      worker_id,
      doctor_name,
      hospital_name,
      district,
      visit_date,
      symptoms,
      diagnosis,
      prescriptions,
      notes,
      follow_up_date,
    } = req.body;

    if (!worker_id || !diagnosis) {
      return res.status(400).json({
        success: false,
        error: { message: 'Worker ID and Diagnosis are required.' },
      });
    }

    const result = await query(
      `INSERT INTO consultations (
        worker_id, doctor_id, doctor_name, hospital_name, district,
        visit_date, symptoms, diagnosis, prescriptions, notes, follow_up_date
      ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        worker_id,
        req.user?.id || null,
        doctor_name || req.user?.full_name || 'Dr. Health Officer',
        hospital_name || req.user?.hospital_name || 'Govt. General Hospital',
        district || req.user?.district || 'Ernakulam',
        visit_date || null,
        symptoms || '',
        diagnosis,
        prescriptions || '',
        notes || '',
        follow_up_date || null,
      ]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function addVaccination(req, res, next) {
  try {
    const { worker_id, vaccine_name, dose_number, administered_on, next_due_on, hospital_name } = req.body;

    if (!worker_id || !vaccine_name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Worker ID and Vaccine Name are required.' },
      });
    }

    const result = await query(
      `INSERT INTO vaccinations (
        worker_id, vaccine_name, dose_number, administered_on, next_due_on, hospital_name, status
      ) VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, 'Complete')
      RETURNING *`,
      [
        worker_id,
        vaccine_name,
        dose_number || 'Dose 1',
        administered_on || null,
        next_due_on || null,
        hospital_name || req.user?.hospital_name || 'District Hospital',
      ]
    );

    // Also update is_vaccinated in workers table if needed
    await query('UPDATE workers SET is_vaccinated = TRUE WHERE id = $1', [worker_id]);

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function addLabReport(req, res, next) {
  try {
    const { worker_id, test_name, result, notes, test_date } = req.body;

    if (!worker_id || !test_name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Worker ID and Test Name are required.' },
      });
    }

    const resQuery = await query(
      `INSERT INTO lab_reports (
        worker_id, test_name, result, notes, test_date
      ) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
      RETURNING *`,
      [worker_id, test_name, result || 'Normal', notes || '', test_date || null]
    );

    return res.status(201).json({ success: true, data: resQuery.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function listPatients(req, res, next) {
  try {
    const { q } = req.query;
    let queryText = `SELECT id, full_name, ABHA_id, email, age, home_state, current_address, gender, blood_group, employer_name, is_vaccinated, created_at FROM workers`;
    let params = [];
    if (q && q.trim()) {
      queryText += ` WHERE full_name ILIKE $1 OR ABHA_id ILIKE $1 OR email ILIKE $1 OR home_state ILIKE $1`;
      params.push(`%${q.trim()}%`);
    }
    queryText += ` ORDER BY id DESC LIMIT 50`;
    const result = await query(queryText, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}
