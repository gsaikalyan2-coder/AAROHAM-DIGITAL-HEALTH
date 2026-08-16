import { Router } from 'express';
import { searchKnowledgeBase, getAllKnowledgeDocuments } from '../services/rag.service.js';

const router = Router();

/**
 * Direct Knowledge Base Search Endpoint
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query: queryText, topK = 5 } = req.body;
    if (!queryText) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query string is required.' },
      });
    }

    const results = await searchKnowledgeBase(queryText, topK);
    return res.json({
      success: true,
      data: {
        query: queryText,
        total: results.length,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * List Knowledge Base Categories & Documents
 */
router.get('/knowledge', async (req, res, next) => {
  try {
    const docs = await getAllKnowledgeDocuments();
    const categories = Array.from(new Set(docs.map((d) => d.category)));

    return res.json({
      success: true,
      data: {
        totalDocs: docs.length,
        categories,
        documents: docs,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
