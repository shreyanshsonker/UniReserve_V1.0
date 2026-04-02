import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { LogIn } from 'lucide-react';
import type { ApiEnvelope, AuthTokenPayload, User } from '../types/api';
import { extractErrorMessage } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAccessToken, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginResponse = await apiClient.post<ApiEnvelope<AuthTokenPayload>>('/auth/login/', { email, password });
      setAccessToken(loginResponse.data.data.access);

      const profileResponse = await apiClient.get<ApiEnvelope<User>>('/users/me/');
      setUser(profileResponse.data.data);
      
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to authenticate.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dynamic-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl mb-2">Welcome to <span className="gradient-text">UniReserve</span></h1>
          <p className="text-gray-400 text-lg">The Digital Curator for Campus Spaces.</p>
        </div>

        <div className="glass-panel p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-primary hover:text-indigo-300 transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button flex justify-center items-center gap-2 mt-4"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-white font-medium hover:text-primary transition-colors">
              Apply for access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
