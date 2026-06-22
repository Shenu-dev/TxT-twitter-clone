import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const mutation = useMutation({
    mutationFn: () => api.post('/api/auth/login', { email, password }),
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
        <h2>Sign in to TxT</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
          <input
            type="text"
            placeholder="Email or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '...' : 'Sign in'}
          </motion.button>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
