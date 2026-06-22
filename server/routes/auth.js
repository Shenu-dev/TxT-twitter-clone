import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/signup', (req, res) => {
  const { username, displayName, email, password } = req.body;
  if (!username || !displayName || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) return res.status(409).json({ error: 'Username or email already taken' });
  const id = uuid();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, username, display_name, email, password) VALUES (?, ?, ?, ?, ?)').run(id, username, displayName, email, hashed);
  const user = db.prepare('SELECT id, username, display_name, email, bio, avatar_url, banner_url, created_at FROM users WHERE id = ?').get(id);
  const token = generateToken(user);
  res.status(201).json({ user, token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { password: _, ...safeUser } = user;
  const token = generateToken(safeUser);
  res.json({ user: safeUser, token });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, display_name, email, bio, avatar_url, banner_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const followers = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
  const following = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;
  res.json({ ...user, followers_count: followers, following_count: following });
});

export default router;
