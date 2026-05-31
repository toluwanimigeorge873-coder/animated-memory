const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Get all chats for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { folderId, mode, search } = req.query;
    const where = {
      userId: req.user.id,
      isDeleted: false,
      ...(folderId && { folderId }),
      ...(mode && { mode }),
      ...(search && { title: { contains: search, mode: 'insensitive' } })
    };

    const chats = await prisma.chat.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
        _count: { select: { messages: true } }
      }
    });
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create new chat
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, mode, topic, folderId } = req.body;
    const chat = await prisma.chat.create({
      data: {
        userId: req.user.id,
        title: title || 'New Conversation',
        mode: mode || 'CHAT',
        topic,
        folderId
      }
    });
    res.status(201).json({ chat });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get single chat with messages
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user.id, isDeleted: false },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json({ chat });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Send message + get AI response
router.post('/:id/message', requireAuth, async (req, res) => {
  try {
    const { content, detailLevel = 'standard' } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });

    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
    });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Save user message
    await prisma.message.create({
      data: { chatId: chat.id, role: 'user', content }
    });

    // Build conversation history for AI
    const history = chat.messages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content });

    const systemPrompts = {
      simple: 'Explain in simple, accessible language for beginners. Use relatable analogies.',
      standard: 'Provide clear, informative explanations for a general educated audience.',
      academic: 'Use academic language, cite historiographical debates, and provide nuanced multi-perspective analysis.'
    };

    const systemPrompt = `You are HistoryGPT, an expert AI historian with comprehensive knowledge of world history across all eras, civilizations, and regions. You have special depth in African, Asian, and indigenous histories that are often underrepresented.

${systemPrompts[detailLevel] || systemPrompts.standard}

Guidelines:
- Be accurate, balanced, and nuanced
- Acknowledge multiple historical perspectives, especially on controversial events
- Highlight African, Asian, and indigenous histories
- Use **bold** for key terms and dates
- Format responses with clear paragraphs
- End with 2-3 follow-up questions formatted as: **Explore further:** [question 1] | [question 2] | [question 3]
- Make history feel alive and relevant to today`;

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: history
    });

    const aiContent = aiResponse.content[0].text;

    // Save AI message
    const aiMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: aiContent,
        tokens: aiResponse.usage?.output_tokens
      }
    });

    // Auto-update chat title from first message
    if (chat.messages.length === 0) {
      const shortTitle = content.length > 60 ? content.slice(0, 60) + '…' : content;
      await prisma.chat.update({
        where: { id: chat.id },
        data: { title: shortTitle, updatedAt: new Date() }
      });
    } else {
      await prisma.chat.update({
        where: { id: chat.id },
        data: { updatedAt: new Date() }
      });
    }

    // Check for achievements
    const msgCount = await prisma.message.count({ where: { chatId: chat.id } });
    if (msgCount === 2) {
      const existing = await prisma.achievement.findFirst({
        where: { userId: req.user.id, type: 'first_chat' }
      });
      if (!existing) {
        await prisma.achievement.create({
          data: {
            userId: req.user.id,
            type: 'first_chat',
            title: 'First Discovery',
            description: 'Completed your first history conversation',
            icon: '💬'
          }
        });
      }
    }

    res.json({ message: aiMessage, usage: aiResponse.usage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Update chat (rename, bookmark, move to folder)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { title, isBookmarked, folderId } = req.body;
    const chat = await prisma.chat.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: {
        ...(title !== undefined && { title }),
        ...(isBookmarked !== undefined && { isBookmarked }),
        ...(folderId !== undefined && { folderId })
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// Soft delete chat
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.chat.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isDeleted: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

module.exports = router;
