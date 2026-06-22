import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/:username', optionalAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, display_name, bio, avatar_url, banner_url, created_at FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const followers = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
  const following = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;
  let is_following = false;
  if (req.user && req.user.id !== user.id) {
    is_following = !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, user.id);
  }
  res.json({ ...user, followers_count: followers, following_count: following, is_following });
});

router.patch('/:id', authMiddleware, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Not authorized' });
  const updates = {};
  if (req.body.display_name) updates.display_name = req.body.display_name;
  if (req.body.bio !== undefined) updates.bio = req.body.bio;
  if (req.files?.avatar) updates.avatar_url = '/uploads/' + req.files.avatar[0].filename;
  if (req.files?.banner) updates.banner_url = '/uploads/' + req.files.banner[0].filename;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
  const user = db.prepare('SELECT id, username, display_name, bio, avatar_url, banner_url, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

router.post('/:id/follow', authMiddleware, (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ error: 'Cannot follow yourself' });
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  const existing = db.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, req.params.id);
  if (existing) return res.status(409).json({ error: 'Already following' });
  db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  const followCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(req.params.id).count;
  res.json({ following: true, followers_count: followCount });
});

router.delete('/:id/follow', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, req.params.id);
  const followCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(req.params.id).count;
  res.json({ following: false, followers_count: followCount });
});

export default router;
