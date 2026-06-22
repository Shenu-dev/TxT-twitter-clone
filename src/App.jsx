import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import { api } from './api/client';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import TweetPage from './pages/TweetPage';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Signup from './pages/Signup';

function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { token, setAuth, setUser, logout } = useAuthStore();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me'),
    enabled: !!token,
    retry: false,
    staleTime: 60000,
  });

  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);

  useEffect(() => {
    if (token && me === undefined) {
      const check = async () => {
        try {
          await api.get('/api/auth/me');
        } catch {
          logout();
        }
      };
      check();
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:username" element={<Profile />} />
        <Route path="tweet/:id" element={<TweetPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
