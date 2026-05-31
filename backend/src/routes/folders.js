// folders.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', requireAuth, async (req, res) => {
  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    include: { _count: { select: { chats: true } } },
    orderBy: { createdAt: 'asc' }
  });
  res.json({ folders });
});

router.post('/', requireAuth, async (req, res) => {
  const { name, color } = req.body;
  const folder = await prisma.folder.create({
    data: { userId: req.user.id, name, color: color || '#c9a84c' }
  });
  res.status(201).json({ folder });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.folder.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ success: true });
});

module.exports = router;
