const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { pool } = require('../db');
require('dotenv').config();

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { messages, detailLevel = 'standard', mode = 'chat' } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required.' });

    const levels = {
      simple: 'Explain in simple, accessible language suitable for beginners and students. Use analogies and avoid jargon.',
      standard: 'Provide clear, informative explanations suitable for general educated audiences.',
      academic: 'Use academic language, cite historical debates, mention historiographical perspectives, and provide nuanced analysis.'
    };

    const modeInstructions = {
      research: 'You are in Research Mode. Provide deep academic analysis, suggest primary and secondary sources, mention historiographical debates, and structure responses like academic writing.',
      essay: 'You are in Essay Helper Mode. Help with essay outlines, thesis statements, argument structure, and academic writing techniques.',
      chat: ''
    };

    const systemPrompt = `You are HistoryGPT, an expert AI historian with deep knowledge of world history across all eras, civilizations, and regions. You are especially knowledgeable about African, Asian, and indigenous histories which are often underrepresented.

${levels[detailLevel] || levels.standard}
${modeInstructions[mode] || ''}

Guidelines:
- Be accurate, balanced, and nuanced
- Acknowledge multiple perspectives on controversial events
- Highlight often-overlooked African, Asian, and indigenous histories
- Format responses clearly with bold headers when covering multiple points
- Suggest 2-3 follow-up questions at the end: **Explore further:** [q1] | [q2]
- Make history feel alive and relevant`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    // Log usage
    const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;
    await pool.query('INSERT INTO ai_usage(user_id,tokens_used) VALUES($1,$2)', [req.user.id, tokensUsed]);

    res.json({ content: data.content[0]?.text, usage: data.usage });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'AI request failed.' });
  }
});

module.exports = router;
