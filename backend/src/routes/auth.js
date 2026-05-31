const router = require('express').Router();
const passport = require('../config/passport');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const Joi = require('joi');
require('dotenv').config();

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  (req, res) => res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
);

// Register
router.post('/register', async (req, res) => {
  const schema = Joi.object({ name: Joi.string().min(2).max(100).required(), email: Joi.string().email().required(), password: Joi.string().min(8).required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [value.email]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Email already registered.' });
    const hash = await bcrypt.hash(value.password, 12);
    const user = await pool.query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING *', [value.name, value.email, hash]);
    req.login(user.rows[0], (err) => {
      if (err) return res.status(500).json({ error: 'Login after register failed.' });
      const { password_hash, ...safe } = user.rows[0];
      res.status(201).json({ user: safe });
    });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials.' });
    req.login(user, (err) => {
      if (err) return next(err);
      const { password_hash, ...safe } = user;
      res.json({ user: safe });
    });
  })(req, res, next);
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ message: 'Logged out.' });
  });
});

// Me
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  const { password_hash, ...safe } = req.user;
  res.json({ user: safe });
});

module.exports = router;
