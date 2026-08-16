import { env } from '../config/env.js';
import { retrieveKnowledgeContext } from '../services/rag.service.js';

export async function handleChatMessage(req, res, next) {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Messages array is required.' },
      });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Step 1: Perform RAG Knowledge Retrieval
    const ragResult = await retrieveKnowledgeContext(lastUserMessage, userContext);

    // Step 2: Assemble System Prompt with RAG Grounded Context
    const systemPrompt = {
      role: 'system',
      content: `You are Aaroham AI, an intelligent multilingual RAG-powered digital health assistant for migrant workers and healthcare providers in Kerala, India (SIH Problem Statement #82).

OUTPUT FORMATTING RULES:
1. NEVER output raw ASCII tables with pipe symbols (e.g. "| Step | Action | Tips |").
2. Format all multi-step guides cleanly using numbered steps ("1️⃣ Step Name"), bullet points ("• Details"), and bold headings ("### Section").
3. Keep line spacing generous and mobile readable.

GROUNDED KNOWLEDGE BASE CONTEXT (RAG RETRIEVED):
${ragResult.contextText}

${userContext ? `User Profile: Name: ${userContext.name || userContext.full_name || 'User'}, Spoken Language: ${userContext.spoken_language || 'Bengali'}, State: ${userContext.home_state || 'Migrant Worker'}` : ''}

INSTRUCTIONS:
Answer the user query accurately based on the RAG Retrieved Knowledge Base Context above. Respond in the user's primary language (or English if unspecified) with warm, official, and helpful medical guidance.`,
    };

    const apiPayload = {
      model: env.openrouterModel || 'openrouter/free',
      messages: [systemPrompt, ...messages],
      max_tokens: 650,
      temperature: 0.6,
    };

    console.log(`[RAG Chat] Dispatched query: "${lastUserMessage.slice(0, 50)}..." | ${ragResult.retrievedCount} docs retrieved.`);

    const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.clientUrl || 'http://localhost:5173',
        'X-Title': 'Aaroham RAG Migrant Health Assistant',
      },
      body: JSON.stringify(apiPayload),
    });

    const data = await openrouterRes.json();

    if (!openrouterRes.ok) {
      console.warn('[OpenRouter API Notice]:', data?.error || data);

      const retryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.clientUrl || 'http://localhost:5173',
          'X-Title': 'Aaroham RAG',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [systemPrompt, ...messages],
          max_tokens: 650,
        }),
      });

      const retryData = await retryRes.json();
      if (retryRes.ok && retryData?.choices?.[0]?.message) {
        return res.json({
          success: true,
          data: {
            reply: cleanMarkdownText(retryData.choices[0].message.content),
            sources: ragResult.sources,
            ragActive: true,
          },
        });
      }

      // Smart health assistant fallback response synthesized from retrieved RAG docs
      let fallbackText = "Hello! I am Aaroham AI Assistant. How can I help you today?";
      if (ragResult.sources && ragResult.sources.length > 0) {
        const primaryDoc = ragResult.sources[0];
        fallbackText = `### 🛡️ ${primaryDoc.title}\n\n${ragResult.contextText.split('\n\n')[0].replace(/\[DOCUMENT \d+\]/g, '')}`;
      }

      return res.json({
        success: true,
        data: {
          reply: cleanMarkdownText(fallbackText),
          sources: ragResult.sources,
          ragActive: true,
        },
      });
    }

    const rawReply = data?.choices?.[0]?.message?.content || "I am Aaroham AI Assistant. How can I help you today?";
    const cleanReply = cleanMarkdownText(rawReply);

    return res.json({
      success: true,
      data: {
        reply: cleanReply,
        sources: ragResult.sources,
        ragActive: true,
      },
    });
  } catch (err) {
    console.error('[RAG Chat Error]:', err.message);
    return res.json({
      success: true,
      data: {
        reply: "Hello! I am Aaroham AI. Your health record is securely stored in Kerala. You can view your consultations, ABHA health ID, and vaccinations on your dashboard.",
        sources: [],
        ragActive: false,
      },
    });
  }
}

function cleanMarkdownText(text) {
  if (!text) return '';
  let lines = text.split('\n');
  let cleanLines = lines.map((line) => {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0 && !cells[0].includes('---')) {
        return `• ${cells.join(' — ')}`;
      }
      return '';
    }
    return line;
  });

  return cleanLines.filter((l) => l !== undefined).join('\n');
}
