const router = require('express').Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

router.get('/chat/:id/pdf', requireAuth, async (req, res) => {
  try {
    const chat = await pool.query('SELECT * FROM chats WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!chat.rows.length) return res.status(404).json({ error: 'Chat not found.' });
    const messages = await pool.query('SELECT * FROM messages WHERE chat_id=$1 ORDER BY created_at ASC', [req.params.id]);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="historygpt-${req.params.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('HistoryGPT', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(chat.rows[0].title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666').text(`Exported: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    messages.rows.forEach(msg => {
      const isUser = msg.role === 'user';
      doc.fontSize(11).font('Helvetica-Bold').fillColor(isUser ? '#1a1a2e' : '#8B6020').text(isUser ? 'You' : 'HistoryGPT');
      doc.fontSize(11).font('Helvetica').fillColor('#333').text(msg.content, { indent: 20 });
      doc.moveDown();
    });

    doc.end();
  } catch (err) { res.status(500).json({ error: 'Export failed.' }); }
});

module.exports = router;
