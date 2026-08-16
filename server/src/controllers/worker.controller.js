import { query } from '../config/db.js';

export async function getWorkerProfile(req, res, next) {
  try {
    const workerId = req.params.id || req.user?.id;
    if (!workerId) {
      return res.status(400).json({ success: false, error: { message: 'Worker ID is required' } });
    }

    const result = await query(
      `SELECT id, full_name, ABHA_id, email, age, home_state, current_address,
              date_of_birth, gender, blood_group, employer_name, employer_phone_number,
              is_vaccinated, spoken_language, previous_health_issues, created_at
       FROM workers WHERE id = $1`,
      [workerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Worker profile not found.' } });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkerProfile(req, res, next) {
  try {
    const workerId = req.params.id || req.user?.id;
    const {
      full_name,
      age,
      home_state,
      current_address,
      date_of_birth,
      gender,
      blood_group,
      employer_name,
      employer_phone_number,
      is_vaccinated,
      spoken_language,
      previous_health_issues,
    } = req.body;

    const result = await query(
      `UPDATE workers
       SET full_name = COALESCE($1, full_name),
           age = COALESCE($2, age),
           home_state = COALESCE($3, home_state),
           current_address = COALESCE($4, current_address),
           date_of_birth = COALESCE($5, date_of_birth),
           gender = COALESCE($6, gender),
           blood_group = COALESCE($7, blood_group),
           employer_name = COALESCE($8, employer_name),
           employer_phone_number = COALESCE($9, employer_phone_number),
           is_vaccinated = COALESCE($10, is_vaccinated),
           spoken_language = COALESCE($11, spoken_language),
           previous_health_issues = COALESCE($12, previous_health_issues)
       WHERE id = $13
       RETURNING id, full_name, ABHA_id, email, age, home_state, current_address, date_of_birth, gender, blood_group, employer_name, employer_phone_number, is_vaccinated, spoken_language, previous_health_issues, created_at`,
      [
        full_name,
        age ? parseInt(age, 10) : null,
        home_state,
        current_address,
        date_of_birth,
        gender,
        blood_group,
        employer_name,
        employer_phone_number,
        is_vaccinated !== undefined ? Boolean(is_vaccinated) : null,
        spoken_language,
        previous_health_issues,
        workerId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Worker profile not found.' } });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getWorkerRecords(req, res, next) {
  try {
    const rawId = req.params.id || req.user?.id || req.user?.ABHA_id || req.user?.email;
    if (!rawId) {
      return res.status(400).json({ success: false, error: { message: 'Worker identifier is required' } });
    }

    // Resolve internal integer worker ID if passed ABHA ID or Email
    const workerRes = await query(
      'SELECT id FROM workers WHERE id::text = $1 OR ABHA_id = $1 OR email = $1 OR employer_phone_number = $1',
      [String(rawId)]
    );
    const resolvedId = workerRes.rows.length > 0 ? workerRes.rows[0].id : rawId;

    const consultations = await query(
      `SELECT * FROM consultations WHERE worker_id = $1 ORDER BY visit_date DESC`,
      [resolvedId]
    );

    const vaccinations = await query(
      `SELECT * FROM vaccinations WHERE worker_id = $1 ORDER BY administered_on DESC`,
      [resolvedId]
    );

    const labReports = await query(
      `SELECT * FROM lab_reports WHERE worker_id = $1 ORDER BY test_date DESC`,
      [resolvedId]
    );

    return res.json({
      success: true,
      data: {
        consultations: consultations.rows,
        vaccinations: vaccinations.rows,
        labReports: labReports.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}
