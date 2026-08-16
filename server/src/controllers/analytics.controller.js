import { query } from '../config/db.js';

export async function getSurveillanceMetrics(req, res, next) {
  try {
    const totalWorkersRes = await query('SELECT COUNT(*) FROM workers');
    const totalWorkers = parseInt(totalWorkersRes.rows[0].count, 10);

    const vaccinatedRes = await query('SELECT COUNT(*) FROM workers WHERE is_vaccinated = TRUE');
    const totalVaccinated = parseInt(vaccinatedRes.rows[0].count, 10);

    const totalConsultationsRes = await query('SELECT COUNT(*) FROM consultations');
    const totalConsultations = parseInt(totalConsultationsRes.rows[0].count, 10);

    // District breakdown of registered workers
    const districtRes = await query(`
      SELECT current_address, COUNT(*) as count
      FROM workers
      GROUP BY current_address
      ORDER BY count DESC
      LIMIT 10
    `);

    // Top diagnoses surveillance
    const diagnosisRes = await query(`
      SELECT diagnosis, COUNT(*) as count
      FROM consultations
      GROUP BY diagnosis
      ORDER BY count DESC
      LIMIT 10
    `);

    // State of origin breakdown
    const stateRes = await query(`
      SELECT home_state, COUNT(*) as count
      FROM workers
      GROUP BY home_state
      ORDER BY count DESC
    `);

    return res.json({
      success: true,
      data: {
        totalWorkers,
        totalVaccinated,
        vaccinationPercentage: totalWorkers > 0 ? Math.round((totalVaccinated / totalWorkers) * 100) : 0,
        totalConsultations,
        districtDistribution: districtRes.rows,
        topDiagnoses: diagnosisRes.rows,
        stateOfOrigin: stateRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}
