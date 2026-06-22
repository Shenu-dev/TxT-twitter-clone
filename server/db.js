import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT NULL,
    banner_url TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tweets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    image_url TEXT DEFAULT NULL,
    parent_id TEXT DEFAULT NULL REFERENCES tweets(id),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL REFERENCES users(id),
    tweet_id TEXT NOT NULL REFERENCES tweets(id),
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, tweet_id)
  );
  CREATE TABLE IF NOT EXISTS retweets (
    user_id TEXT NOT NULL REFERENCES users(id),
    tweet_id TEXT NOT NULL REFERENCES tweets(id),
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, tweet_id)
  );
  CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL REFERENCES users(id),
    following_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, following_id)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    from_user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    tweet_id TEXT DEFAULT NULL REFERENCES tweets(id),
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
