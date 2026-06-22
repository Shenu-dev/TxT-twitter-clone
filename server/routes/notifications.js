import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const notifications = db.prepare(`
    SELECT n.*, u.username, u.display_name, u.avatar_url
    FROM notifications n JOIN users u ON u.id = n.from_user_id
    WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50
  `).all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id).count;
  res.json({ notifications, unread_count: unread });
});

router.patch('/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ read: true });
});

router.patch('/read-all', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ read: true });
});

export default router;
