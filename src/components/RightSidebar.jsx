import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import Avatar from './Avatar';

export default function RightSidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.get('/api/users'),
    enabled: !!user,
  });

  const followUser = useMutation({
    mutationFn: ({ id, following }) =>
      following ? api.del(`/api/users/${id}/follow`) : api.post(`/api/users/${id}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const users = Array.isArray(suggestions) ? suggestions.filter(u => u.id !== user?.id).slice(0, 3) : [];

  return (
    <aside className="sidebar-right">
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Search TxT" onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            navigate('/explore?q=' + encodeURIComponent(e.target.value));
          }
        }} />
      </div>
      {user && users.length > 0 && (
        <div className="sidebar-section">
          <h3>Who to follow</h3>
          {users.map(u => (
            <div key={u.id} className="suggestion-row" onClick={() => navigate(`/profile/${u.username}`)}>
              <Avatar user={u} size={36} />
              <div className="suggestion-info">
                <span className="suggestion-name">{u.display_name || u.username}</span>
                <span className="suggestion-username">@{u.username}</span>
              </div>
              <button
                className="btn-follow-sm"
                onClick={(e) => { e.stopPropagation(); followUser.mutate({ id: u.id, following: false }); }}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="sidebar-footer">
        <p>TxT © 2024</p>
      </div>
    </aside>
  );
}
