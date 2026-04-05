import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { notifySuccess, notifyError } from '../utils/notify';
import { HiArrowRight, HiLockClosed, HiMail } from 'react-icons/hi';
import AuthLayout from '../components/AuthLayout';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const quickLinks = [
    { to: '/register/student', label: 'Student Sign Up', variant: 'primary' },
    { to: '/register/manager', label: 'Manager Sign Up' },
  ];

  const highlights = [
    {
      label: 'Unified access',
      value: '1 sign-in',
      copy: 'Students, managers, and admins all enter through the same secure flow.',
    },
    {
      label: 'Live updates',
      value: 'Real time',
      copy: 'Bookings, waitlists, and approvals are ready as soon as you log in.',
    },
    {
      label: 'Role aware',
      value: 'Adaptive',
      copy: 'The app routes you straight into the workspace that matches your role.',
    },
  ];

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
    <AuthLayout
      eyebrow="Secure campus access"
      title="Sign in once and step back into your live workspace."
      description="Access your dashboard, facility bookings, approvals, and analytics from one polished university operations platform."
      quickLinks={quickLinks}
      highlights={highlights}
      cardEyebrow="Welcome back"
      cardTitle="Sign In"
      cardDescription="Use your registered university email and password to continue."
      footnote="Student accounts go straight into booking, while manager accounts unlock control and analytics after approval."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="login-email">Email Address</label>
          <div className="auth-field__control">
            <span className="auth-field__icon">
              <HiMail />
            </span>
            <input
              id="login-email"
              type="email"
              required
              placeholder="name@university.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <div className="auth-field__control">
            <span className="auth-field__icon">
              <HiLockClosed />
            </span>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <p className="auth-form__helper">
          If you just registered, verify your email first before signing in.
        </p>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Signing in...' : 'Sign In to UniReserve'}
          {!loading && <HiArrowRight />}
        </button>
      </form>

      <p className="auth-footer">
        Need an account? <Link to="/register/student">Register as a student</Link> or{' '}
        <Link to="/register/manager">apply as a manager</Link>.
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
