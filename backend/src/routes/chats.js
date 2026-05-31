const router = require('express').Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Get all chats for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chats WHERE user_id=$1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch chats.' }); }
});

// Create new chat
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title = 'New Conversation', mode = 'chat' } = req.body;
    const result = await pool.query(
      'INSERT INTO chats(user_id,title,mode) VALUES($1,$2,$3) RETURNING *',
      [req.user.id, title, mode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create chat.' }); }
});

// Get single chat with messages
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const chat = await pool.query('SELECT * FROM chats WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!chat.rows.length) return res.status(404).json({ error: 'Chat not found.' });
    const messages = await pool.query('SELECT * FROM messages WHERE chat_id=$1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ ...chat.rows[0], messages: messages.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch chat.' }); }
});

// Update chat (rename, bookmark, folder)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { title, is_bookmarked, folder } = req.body;
    const result = await pool.query(
      `UPDATE chats SET
        title=COALESCE($1,title),
        is_bookmarked=COALESCE($2,is_bookmarked),
        folder=COALESCE($3,folder),
        updated_at=NOW()
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [title, is_bookmarked, folder, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Chat not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update chat.' }); }
});

// Delete chat
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM chats WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Chat deleted.' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete chat.' }); }
});

// Add message to chat
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { role, content } = req.body;
    if (!['user','assistant'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    const chatCheck = await pool.query('SELECT id FROM chats WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!chatCheck.rows.length) return res.status(404).json({ error: 'Chat not found.' });
    const msg = await pool.query('INSERT INTO messages(chat_id,role,content) VALUES($1,$2,$3) RETURNING *', [req.params.id, role, content]);
    await pool.query('UPDATE chats SET updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.status(201).json(msg.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to save message.' }); }
});

module.exports = router;
