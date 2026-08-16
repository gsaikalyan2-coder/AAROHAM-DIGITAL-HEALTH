import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedFixtures = null;

/**
 * Load knowledge base fixtures fallback
 */
async function loadKnowledgeFixtures() {
  if (cachedFixtures) return cachedFixtures;
  try {
    const fixturePath = join(__dirname, '..', '..', 'db', 'fixtures', 'knowledge_base.json');
    const content = await readFile(fixturePath, 'utf8');
    cachedFixtures = JSON.parse(content);
    return cachedFixtures;
  } catch (err) {
    console.warn('[RAG Service] Could not load fixture JSON:', err.message);
    return [];
  }
}

/**
 * Stopwords to ignore in keyword matching
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'in', 'on', 'at',
  'to', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'd', 'll', 'm',
  'o', 're', 've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven'
]);

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Retrieves all knowledge base documents from DB or Fixture
 */
export async function getAllKnowledgeDocuments() {
  try {
    const res = await query('SELECT * FROM knowledge_base ORDER BY id ASC');
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((row) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        keywords: Array.isArray(row.keywords) ? row.keywords : (row.keywords || '').split(','),
        content: row.content,
        sources: row.sources || 'Aaroham Knowledge Base',
      }));
    }
  } catch (err) {
    console.warn('[RAG Service] Database query failed, using fixture fallback:', err.message);
  }

  const fixtures = await loadKnowledgeFixtures();
  return fixtures.map((f, i) => ({
    id: i + 1,
    ...f,
  }));
}

/**
 * Searches the Knowledge Base using TF-IDF style keyword vector weighting
 */
export async function searchKnowledgeBase(queryText, topK = 3) {
  const docs = await getAllKnowledgeDocuments();
  const queryTokens = tokenize(queryText);

  if (queryTokens.length === 0) {
    return docs.slice(0, topK).map((doc) => ({
      ...doc,
      score: 1.0,
    }));
  }

  const scoredDocs = docs.map((doc) => {
    let score = 0;
    const titleTokens = tokenize(doc.title);
    const categoryTokens = tokenize(doc.category);
    const keywordTokens = Array.isArray(doc.keywords)
      ? doc.keywords.flatMap(tokenize)
      : tokenize(doc.keywords);
    const contentTokens = tokenize(doc.content);

    for (const qToken of queryTokens) {
      // Direct title match boost (Weight = 5)
      if (titleTokens.includes(qToken)) score += 5;
      // Keywords match boost (Weight = 4)
      if (keywordTokens.includes(qToken)) score += 4;
      // Category match boost (Weight = 3)
      if (categoryTokens.includes(qToken)) score += 3;
      // Content match (Weight = 1)
      const contentMatches = contentTokens.filter((t) => t === qToken).length;
      score += contentMatches * 1;
    }

    return {
      ...doc,
      score,
    };
  });

  // Sort descending by score
  scoredDocs.sort((a, b) => b.score - a.score);

  // If top scored doc has score > 0, return top matching docs
  const matchingDocs = scoredDocs.filter((d) => d.score > 0);
  if (matchingDocs.length > 0) {
    return matchingDocs.slice(0, topK);
  }

  // Fallback to top general docs if no direct token match
  return docs.slice(0, topK).map((doc) => ({ ...doc, score: 0.5 }));
}

/**
 * Fetches personal health record history for worker RAG context
 */
export async function getWorkerMedicalContext(workerId) {
  if (!workerId) return null;

  try {
    const [workerRes, consultsRes, vaxRes, labRes] = await Promise.all([
      query('SELECT full_name, ABHA_id, spoken_language, is_vaccinated, employer_name FROM workers WHERE id = $1', [workerId]),
      query('SELECT doctor_name, hospital_name, visit_date, symptoms, diagnosis, prescriptions FROM consultations WHERE worker_id = $1 ORDER BY visit_date DESC LIMIT 3', [workerId]),
      query('SELECT vaccine_name, dose_number, administered_on, status FROM vaccinations WHERE worker_id = $1 ORDER BY administered_on DESC', [workerId]),
      query('SELECT test_name, result, test_date FROM lab_reports WHERE worker_id = $1 ORDER BY test_date DESC LIMIT 3', [workerId]),
    ]);

    const worker = workerRes.rows[0];
    if (!worker) return null;

    return {
      worker,
      consultations: consultsRes.rows || [],
      vaccinations: vaxRes.rows || [],
      labReports: labRes.rows || [],
    };
  } catch (err) {
    console.warn('[RAG Service] Could not fetch worker medical context:', err.message);
    return null;
  }
}

/**
 * Synthesizes complete RAG context for LLM prompt augmentation
 */
export async function retrieveKnowledgeContext(queryText, userContext = null) {
  const topDocs = await searchKnowledgeBase(queryText, 3);
  
  let knowledgeSnippet = topDocs.map((doc, idx) => {
    return `[DOCUMENT ${idx + 1}] Category: ${doc.category} | Title: ${doc.title}\nSource: ${doc.sources}\nContent: ${doc.content}`;
  }).join('\n\n');

  let medicalSnippet = '';
  if (userContext && userContext.id) {
    const medData = await getWorkerMedicalContext(userContext.id);
    if (medData) {
      const cList = medData.consultations.map((c) => `- Date: ${c.visit_date}, Diagnosis: ${c.diagnosis}, Prescriptions: ${c.prescriptions || 'None'}`).join('\n');
      const vList = medData.vaccinations.map((v) => `- ${v.vaccine_name} (${v.dose_number}): ${v.status} on ${v.administered_on}`).join('\n');
      const lList = medData.labReports.map((l) => `- ${l.test_name}: Result ${l.result} (${l.test_date})`).join('\n');

      medicalSnippet = `\n\n[USER PERSONAL MEDICAL RECORD CONTEXT]\nWorker Name: ${medData.worker.full_name} | ABHA ID: ${medData.worker.ABHA_id}\nRecent Consultations:\n${cList || 'None'}\nVaccinations:\n${vList || 'None'}\nLab Reports:\n${lList || 'None'}`;
    }
  }

  const sources = topDocs.map((doc) => ({
    title: doc.title,
    category: doc.category,
    source: doc.sources,
  }));

  return {
    contextText: `${knowledgeSnippet}${medicalSnippet}`,
    sources,
    retrievedCount: topDocs.length,
  };
}
