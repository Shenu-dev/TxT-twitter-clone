import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function attachExtras(tweet, uid) {
  const user = db.prepare('SELECT id, username, display_name, avatar_url, bio FROM users WHERE id = ?').get(tweet.user_id);
  const likes = db.prepare('SELECT COUNT(*) as count FROM likes WHERE tweet_id = ?').get(tweet.id).count;
  const retweets = db.prepare('SELECT COUNT(*) as count FROM retweets WHERE tweet_id = ?').get(tweet.id).count;
  const replies = db.prepare('SELECT COUNT(*) as count FROM tweets WHERE parent_id = ?').get(tweet.id).count;
  let liked = false, retweeted = false;
  if (uid) {
    liked = !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND tweet_id = ?').get(uid, tweet.id);
    retweeted = !!db.prepare('SELECT 1 FROM retweets WHERE user_id = ? AND tweet_id = ?').get(uid, tweet.id);
  }
  return { ...tweet, user, likes_count: likes, retweets_count: retweets, replies_count: replies, liked, retweeted };
}

// Timeline
router.get('/', optionalAuth, (req, res) => {
  let tweets;
  if (req.user) {
    tweets = db.prepare(`
      SELECT t.* FROM tweets t
      LEFT JOIN follows f ON f.following_id = t.user_id AND f.follower_id = ?
      WHERE t.parent_id IS NULL AND (t.user_id = ? OR f.follower_id = ?)
      ORDER BY t.created_at DESC LIMIT 50
    `).all(req.user.id, req.user.id, req.user.id);
  } else {
    tweets = db.prepare('SELECT * FROM tweets WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 50').all();
  }
  res.json(tweets.map(t => attachExtras(t, req.user?.id)));
});

// MUST come before /:id — specific routes first
router.get('/search/:query', optionalAuth, (req, res) => {
  const q = '%' + req.params.query + '%';
  const tweets = db.prepare('SELECT * FROM tweets WHERE parent_id IS NULL AND content LIKE ? ORDER BY created_at DESC LIMIT 50').all(q);
  res.json(tweets.map(t => attachExtras(t, req.user?.id)));
});

router.get('/user/:userId/likes', optionalAuth, (req, res) => {
  const tweets = db.prepare(`
    SELECT t.* FROM tweets t JOIN likes l ON l.tweet_id = t.id
    WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT 50
  `).all(req.params.userId);
  res.json(tweets.map(t => attachExtras(t, req.user?.id)));
});

router.get('/user/:userId', optionalAuth, (req, res) => {
  const tweets = db.prepare('SELECT * FROM tweets WHERE user_id = ? AND parent_id IS NULL ORDER BY created_at DESC LIMIT 50').all(req.params.userId);
  res.json(tweets.map(t => attachExtras(t, req.user?.id)));
});

// Single tweet
router.get('/:id', optionalAuth, (req, res) => {
  const tweet = db.prepare('SELECT * FROM tweets WHERE id = ?').get(req.params.id);
  if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
  const replies = db.prepare('SELECT * FROM tweets WHERE parent_id = ? ORDER BY created_at ASC').all(tweet.id);
  res.json({ tweet: attachExtras(tweet, req.user?.id), replies: replies.map(r => attachExtras(r, req.user?.id)) });
});

// Create tweet
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  const { content, parent_id } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });
  if (content.length > 280) return res.status(400).json({ error: 'Content too long' });
  const id = uuid();
  const image_url = req.file ? '/uploads/' + req.file.filename : null;
  db.prepare('INSERT INTO tweets (id, user_id, content, image_url, parent_id) VALUES (?, ?, ?, ?, ?)').run(id, req.user.id, content, image_url, parent_id || null);
  const tweet = db.prepare('SELECT * FROM tweets WHERE id = ?').get(id);
  if (parent_id) {
    const parent = db.prepare('SELECT user_id FROM tweets WHERE id = ?').get(parent_id);
    if (parent && parent.user_id !== req.user.id) {
      db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type, tweet_id) VALUES (?, ?, ?, ?, ?)').run(uuid(), parent.user_id, req.user.id, 'reply', id);
    }
  }
  res.status(201).json(attachExtras(tweet, req.user.id));
});

// Delete
router.delete('/:id', authMiddleware, (req, res) => {
  const tweet = db.prepare('SELECT * FROM tweets WHERE id = ?').get(req.params.id);
  if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
  if (tweet.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  db.prepare('DELETE FROM tweets WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM tweets WHERE parent_id = ?').run(req.params.id);
  db.prepare('DELETE FROM likes WHERE tweet_id = ?').run(req.params.id);
  db.prepare('DELETE FROM retweets WHERE tweet_id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// Like
router.post('/:id/like', authMiddleware, (req, res) => {
  const tweet = db.prepare('SELECT id, user_id FROM tweets WHERE id = ?').get(req.params.id);
  if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
  if (db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND tweet_id = ?').get(req.user.id, req.params.id)) {
    return res.status(409).json({ error: 'Already liked' });
  }
  db.prepare('INSERT INTO likes (user_id, tweet_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE tweet_id = ?').get(req.params.id).count;
  if (tweet.user_id !== req.user.id) {
    db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type, tweet_id) VALUES (?, ?, ?, ?, ?)').run(uuid(), tweet.user_id, req.user.id, 'like', req.params.id);
  }
  res.json({ liked: true, likes_count: count });
});

router.delete('/:id/like', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM likes WHERE user_id = ? AND tweet_id = ?').run(req.user.id, req.params.id);
  const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE tweet_id = ?').get(req.params.id).count;
  res.json({ liked: false, likes_count: count });
});

// Retweet
router.post('/:id/retweet', authMiddleware, (req, res) => {
  const tweet = db.prepare('SELECT id, user_id FROM tweets WHERE id = ?').get(req.params.id);
  if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
  if (db.prepare('SELECT 1 FROM retweets WHERE user_id = ? AND tweet_id = ?').get(req.user.id, req.params.id)) {
    return res.status(409).json({ error: 'Already retweeted' });
  }
  db.prepare('INSERT INTO retweets (user_id, tweet_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  const count = db.prepare('SELECT COUNT(*) as count FROM retweets WHERE tweet_id = ?').get(req.params.id).count;
  if (tweet.user_id !== req.user.id) {
    db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type, tweet_id) VALUES (?, ?, ?, ?, ?)').run(uuid(), tweet.user_id, req.user.id, 'retweet', req.params.id);
  }
  res.json({ retweeted: true, retweets_count: count });
});

router.delete('/:id/retweet', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM retweets WHERE user_id = ? AND tweet_id = ?').run(req.user.id, req.params.id);
  const count = db.prepare('SELECT COUNT(*) as count FROM retweets WHERE tweet_id = ?').get(req.params.id).count;
  res.json({ retweeted: false, retweets_count: count });
});

export default router;
