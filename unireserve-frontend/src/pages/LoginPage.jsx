import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notifySuccess, notifyError } from '../utils/notify';
import { HiMail, HiLockClosed } from 'react-icons/hi';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      notifySuccess(`Welcome back, ${user.name}!`);
      
      // Redirect based on role
      if (user.role === 'student') {
        navigate('/dashboard');
      } else if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.email || error.response?.data?.password || 'Login failed. Please check your credentials.';
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center min-h-screen p-6">
      <div className="card glass max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">UniReserve</h1>
          <p className="text-text-muted">University Facility Booking & Management</p>
        </div>

        <h2 className="text-xl font-semibold mb-6">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                <HiMail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                className="pl-10"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                <HiLockClosed className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                className="pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" size="sm" className="text-sm">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border space-y-4">
          <p className="text-center text-sm text-text-muted">
            New here? Register as a:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/register/student"
              className="px-4 py-2 text-center rounded-lg border border-border hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Student
            </Link>
            <Link
              to="/register/manager"
              className="px-4 py-2 text-center rounded-lg border border-border hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Staff/Manager
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
