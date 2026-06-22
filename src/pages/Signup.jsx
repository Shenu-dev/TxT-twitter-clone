import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const mutation = useMutation({
    mutationFn: () => api.post('/api/auth/signup', { username, displayName, email, password }),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate('/');
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-box"
      >
        <div className="auth-logo">TxT</div>
        <h2>Join TxT</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '...' : 'Create account'}
          </motion.button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
