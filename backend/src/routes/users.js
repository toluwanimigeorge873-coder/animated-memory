const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Get user profile with stats
router.get('/profile', requireAuth, async (req, res) => {
  const [chatCount, msgCount, achievements, quizResults] = await Promise.all([
    prisma.chat.count({ where: { userId: req.user.id, isDeleted: false } }),
    prisma.message.count({ where: { chat: { userId: req.user.id } } }),
    prisma.achievement.findMany({ where: { userId: req.user.id }, orderBy: { earnedAt: 'desc' } }),
    prisma.quizResult.findMany({ where: { userId: req.user.id }, take: 10 })
  ]);

  const avgQuizScore = quizResults.length
    ? Math.round(quizResults.reduce((acc, r) => acc + (r.score / r.totalQ) * 100, 0) / quizResults.length)
    : 0;

  res.json({
    user: req.user,
    stats: { chatCount, msgCount, achievementCount: achievements.length, avgQuizScore },
    achievements,
    recentQuizzes: quizResults
  });
});

// Update profile
router.patch('/profile', requireAuth, async (req, res) => {
  const { name, image } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, image },
    select: { id: true, email: true, name: true, image: true, role: true }
  });
  res.json({ user });
});

module.exports = router;
