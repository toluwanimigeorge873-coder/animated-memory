const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate quiz with AI
router.post('/generate', requireAuth, async (req, res) => {
  const { topic, difficulty = 'medium', count = 5 } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Generate ${count} multiple choice history quiz questions about: "${topic}".
Difficulty: ${difficulty}

Return ONLY valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct and historical context."
  }
]
No preamble, no markdown, pure JSON only.`
      }]
    });

    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);
    res.json({ questions, topic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Save quiz result
router.post('/results', requireAuth, async (req, res) => {
  const { topic, score, totalQ, timeSpent, answers } = req.body;
  const result = await prisma.quizResult.create({
    data: { userId: req.user.id, topic, score, totalQ, timeSpent, answers }
  });

  // Achievement check
  if (score === totalQ) {
    const existing = await prisma.achievement.findFirst({
      where: { userId: req.user.id, type: 'quiz_perfect' }
    });
    if (!existing) {
      await prisma.achievement.create({
        data: {
          userId: req.user.id,
          type: 'quiz_perfect',
          title: 'Perfect Historian',
          description: 'Scored 100% on a history quiz',
          icon: '🎯'
        }
      });
    }
  }

  res.status(201).json({ result });
});

// Get quiz history
router.get('/results', requireAuth, async (req, res) => {
  const results = await prisma.quizResult.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json({ results });
});

module.exports = router;
