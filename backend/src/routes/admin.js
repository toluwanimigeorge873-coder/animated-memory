const router = require('express').Router();
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const chats = await pool.query('SELECT COUNT(*) FROM chats');
    const messages = await pool.query('SELECT COUNT(*) FROM messages');
    const tokens = await pool.query('SELECT SUM(tokens_used) FROM ai_usage');
    const recentUsers = await pool.query('SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 10');
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalChats: parseInt(chats.rows[0].count),
      totalMessages: parseInt(messages.rows[0].count),
      totalTokensUsed: parseInt(tokens.rows[0].sum || 0),
      recentUsers: recentUsers.rows
    });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch stats.' }); }
});

router.get('/users', requireAdmin, async (req, res) => {
  const result = await pool.query('SELECT id,name,email,role,avatar_url,created_at FROM users ORDER BY created_at DESC');
  res.json(result.rows);
});

router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
  const result = await pool.query('UPDATE users SET role=$1 WHERE id=$2 RETURNING id,name,email,role', [role, req.params.id]);
  res.json(result.rows[0]);
});

module.exports = router;
