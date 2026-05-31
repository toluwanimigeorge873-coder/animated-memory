// messages.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/chat/:chatId', requireAuth, async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { chatId: req.params.chatId, chat: { userId: req.user.id } },
    orderBy: { createdAt: 'asc' }
  });
  res.json({ messages });
});

module.exports = router;
