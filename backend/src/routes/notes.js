const router = require('express').Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM notes WHERE user_id=$1 ORDER BY updated_at DESC', [req.user.id]);
  res.json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { title, content, tags = [] } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required.' });
  const result = await pool.query('INSERT INTO notes(user_id,title,content,tags) VALUES($1,$2,$3,$4) RETURNING *', [req.user.id, title, content, tags]);
  res.status(201).json(result.rows[0]);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { title, content, tags } = req.body;
  const result = await pool.query(
    'UPDATE notes SET title=COALESCE($1,title),content=COALESCE($2,content),tags=COALESCE($3,tags),updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING *',
    [title, content, tags, req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Note not found.' });
  res.json(result.rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM notes WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Note deleted.' });
});

module.exports = router;
