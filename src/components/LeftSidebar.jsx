import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Hash, Bell, User, LogOut, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';

export default function LeftSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const { data: notifCount } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/api/notifications'),
    select: (data) => Array.isArray(data) ? data.filter(n => !n.read).length : 0,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar-left">
      <div className="logo" onClick={() => navigate('/')}>
        <MessageCircle size={28} strokeWidth={2.5} />
        <span>TxT</span>
      </div>
      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Hash size={22} />
          <span>Explore</span>
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Bell size={22} />
          <span>Notifications</span>
          {notifCount > 0 && <span className="badge">{notifCount}</span>}
        </NavLink>
        <NavLink to={user ? `/profile/${user.username}` : '/login'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <User size={22} />
          <span>Profile</span>
        </NavLink>
      </nav>
      {user && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn-post-large"
          onClick={() => navigate('/')}
        >
          Post
        </motion.button>
      )}
      {user && (
        <div className="sidebar-user" onClick={handleLogout}>
          <div className="sidebar-user-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" />
            ) : (
              <div className="avatar-placeholder">{user.username[0].toUpperCase()}</div>
            )}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.display_name}</span>
            <span className="sidebar-user-username">@{user.username}</span>
          </div>
          <LogOut size={18} />
        </div>
      )}
    </aside>
  );
}
