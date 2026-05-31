const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
require('dotenv').config();

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || false);
  } catch (err) { done(err); }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const avatar = profile.photos?.[0]?.value;
    const googleId = profile.id;
    let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    if (result.rows.length > 0) return done(null, result.rows[0]);
    result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const updated = await pool.query('UPDATE users SET google_id=$1,avatar_url=$2 WHERE email=$3 RETURNING *', [googleId, avatar, email]);
      return done(null, updated.rows[0]);
    }
    const newUser = await pool.query('INSERT INTO users(email,name,google_id,avatar_url) VALUES($1,$2,$3,$4) RETURNING *', [email, name, googleId, avatar]);
    return done(null, newUser.rows[0]);
  } catch (err) { return done(err); }
}));

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return done(null, false, { message: 'No account found with that email.' });
    if (!user.password_hash) return done(null, false, { message: 'This account uses Google sign-in.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  } catch (err) { return done(err); }
}));

module.exports = passport;
