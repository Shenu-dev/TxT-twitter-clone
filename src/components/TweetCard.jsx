import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, RefreshCw, MessageCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import Avatar from './Avatar';
import TweetComposer from './TweetComposer';

function formatTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const date = new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatCount(n) {
  if (!n) return '';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}

export default function TweetCard({ tweet, showReply, linkToTweet }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [replying, setReplying] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tweets'] });
    queryClient.invalidateQueries({ queryKey: ['tweet', tweet.id] });
  };

  const toggleLike = useMutation({
    mutationFn: () => tweet.liked ? api.del(`/api/tweets/${tweet.id}/like`) : api.post(`/api/tweets/${tweet.id}/like`),
    onMutate: () => {
      setAnimateLike(true);
      setTimeout(() => setAnimateLike(false), 300);
    },
    onSuccess: invalidateAll,
  });

  const toggleRetweet = useMutation({
    mutationFn: () => tweet.retweeted ? api.del(`/api/tweets/${tweet.id}/retweet`) : api.post(`/api/tweets/${tweet.id}/retweet`),
    onSuccess: invalidateAll,
  });

  const deleteTweet = useMutation({
    mutationFn: () => api.del(`/api/tweets/${tweet.id}`),
    onSuccess: invalidateAll,
  });

  const u = tweet.user;
  const isOwn = user?.id === tweet.user_id;

  const handleProfile = (e) => {
    e.stopPropagation();
    navigate(`/profile/${u.username}`);
  };

  const handleClick = () => {
    if (linkToTweet !== false) navigate(`/tweet/${tweet.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="tweet-card"
      onClick={handleClick}
    >
      <div className="tweet-left" onClick={handleProfile}>
        <Avatar user={u} />
      </div>
      <div className="tweet-body">
        <div className="tweet-header">
          <span className="tweet-name clickable" onClick={handleProfile}>{u.display_name}</span>
          <span className="tweet-username clickable" onClick={handleProfile}>@{u.username}</span>
          <span className="tweet-dot">·</span>
          <span className="tweet-time">{formatTime(tweet.created_at)}</span>
          {isOwn && (
            <button
              className="tweet-delete"
              onClick={(e) => { e.stopPropagation(); deleteTweet.mutate(); }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <div className="tweet-content">{tweet.content}</div>
        {tweet.image_url && (
          <div className="tweet-image-wrap">
            <img src={tweet.image_url} alt="tweet media" />
          </div>
        )}
        <div className="tweet-actions" onClick={(e) => e.stopPropagation()}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="tweet-action"
            onClick={() => setReplying(!replying)}
          >
            <MessageCircle size={16} /> {tweet.replies_count > 0 && <span>{formatCount(tweet.replies_count)}</span>}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            className={`tweet-action ${tweet.retweeted ? 'active' : ''}`}
            onClick={toggleRetweet.mutate}
          >
            <RefreshCw size={16} /> {tweet.retweets_count > 0 && <span>{formatCount(tweet.retweets_count)}</span>}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            className={`tweet-action like-btn ${tweet.liked ? 'active' : ''}`}
            onClick={toggleLike.mutate}
          >
            <motion.div
              animate={animateLike ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart size={16} fill={tweet.liked ? '#ff0066' : 'none'} />
            </motion.div>
            {tweet.likes_count > 0 && <span>{formatCount(tweet.likes_count)}</span>}
          </motion.button>
        </div>
        {replying && (
          <div className="reply-composer">
            <TweetComposer parentId={tweet.id} placeholder="Post your reply" onSuccess={() => { setReplying(false); invalidateAll(); }} compact />
          </div>
        )}
      </div>
    </motion.div>
  );
}
