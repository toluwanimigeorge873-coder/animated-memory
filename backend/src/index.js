require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { pool } = require('./db');
const passport = require('./config/passport');

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/ai', rateLimit({ windowMs: 60*1000, max: 30, message: { error: 'Too many AI requests.' } }));
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 50, message: { error: 'Too many auth requests.' } }));
app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7*24*60*60*1000, httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: process.env.NODE_ENV==='production'?'none':'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/export', require('./routes/export'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Internal server error.' }); });
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HistoryGPT API running on port ${PORT}`));
module.exports = app;
