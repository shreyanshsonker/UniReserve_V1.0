import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { HiCheckCircle, HiXCircle, HiRefresh } from 'react-icons/hi';
import AuthLayout from '../components/AuthLayout';

const EmailVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token found.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify/${token}/`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. The link may be expired or invalid.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <AuthLayout
      eyebrow="Account verification"
      title="Confirm your university email to activate the right workspace."
      description="Verification keeps access tied to real campus identities and unlocks the correct booking or management experience."
      quickLinks={[
        { to: '/login', label: 'Back to Login', variant: 'primary' },
        { to: '/register/student', label: 'Student Sign Up' },
      ]}
      highlights={[
        {
          label: 'Trust layer',
          value: 'Verified',
          copy: 'Email verification protects reservations and facility controls from misuse.',
        },
        {
          label: 'Fast path',
          value: '1 step',
          copy: 'Most students can verify once and jump straight into booking right after.',
        },
        {
          label: 'Role ready',
          value: 'Secure',
          copy: 'Manager and student journeys both begin with confirmed identity.',
        },
      ]}
      cardEyebrow="Verification"
      cardTitle="Email Status"
      cardDescription="We’re checking your verification link now."
    >
      <div className="auth-status">
        {status === 'verifying' && (
          <>
            <div className="auth-status__icon auth-status__icon--loading">
              <HiRefresh className="animate-spin" />
            </div>
            <p className="auth-status__eyebrow">Checking link</p>
            <h3 className="auth-card__title">Verifying Email...</h3>
            <p className="auth-status__copy">Please wait while we confirm your university email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="auth-status__icon auth-status__icon--success">
              <HiCheckCircle />
            </div>
            <p className="auth-status__eyebrow">Verified</p>
            <h3 className="auth-card__title">You’re all set</h3>
            <p className="auth-status__copy">{message}</p>
            <Link to="/login" className="auth-submit">
              Sign In Now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-status__icon auth-status__icon--error">
              <HiXCircle />
            </div>
            <p className="auth-status__eyebrow">Verification issue</p>
            <h3 className="auth-card__title">Verification Failed</h3>
            <p className="auth-status__copy">{message}</p>
            <Link to="/register/student" className="auth-submit">
              Try Registering Again
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerifyPage;
