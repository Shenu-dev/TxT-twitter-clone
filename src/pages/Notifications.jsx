import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, RefreshCw, MessageCircle, UserPlus } from 'lucide-react';
import { api } from '../api/client';
import Avatar from '../components/Avatar';

const ICONS = {
  like: <Heart size={16} fill="#ff0066" color="#ff0066" />,
  retweet: <RefreshCw size={16} color="#00ba7c" />,
  reply: <MessageCircle size={16} color="#1d9bf0" />,
  follow: <UserPlus size={16} color="#00ff41" />,
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/api/notifications'),
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div>
      <div className="feed-header">
        <h2>Notifications</h2>
        {data?.unread_count > 0 && (
          <span className="unread-badge">{data.unread_count}</span>
        )}
      </div>
      {(!data?.notifications || data.notifications.length === 0) && (
        <div className="empty-state"><p>No notifications yet</p></div>
      )}
      {data?.notifications?.map((n) => (
        <div
          key={n.id}
          className={`notification-item ${n.read ? '' : 'unread'}`}
          onClick={() => {
            if (!n.read) markRead.mutate(n.id);
            if (n.tweet_id) navigate(`/tweet/${n.tweet_id}`);
            else navigate(`/profile/${n.username}`);
          }}
        >
          <div className="notification-icon">{ICONS[n.type] || '•'}</div>
          <Avatar user={n} size={36} />
          <div className="notification-body">
            <strong>{n.display_name}</strong>
            {n.type === 'like' && ' liked your post'}
            {n.type === 'retweet' && ' retweeted your post'}
            {n.type === 'reply' && ' replied to your post'}
            {n.type === 'follow' && ' followed you'}
          </div>
        </div>
      ))}
    </div>
  );
}
