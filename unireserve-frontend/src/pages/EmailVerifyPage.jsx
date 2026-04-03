import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { HiCheckCircle, HiXCircle, HiRefresh } from 'react-icons/hi';

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
    <div className="flex-center min-h-screen p-6">
      <div className="card glass max-w-md w-full text-center animate-fade-in">
        {status === 'verifying' && (
          <div className="space-y-4">
            <HiRefresh className="h-16 w-16 text-primary mx-auto animate-spin" />
            <h2 className="text-2xl font-bold">Verifying Email...</h2>
            <p className="text-text-muted">Please wait while we confirm your university email.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <HiCheckCircle className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold">Verified!</h2>
            <p className="text-text-muted">{message}</p>
            <div className="pt-4">
              <Link to="/login">
                <button className="w-full py-3">Sign In Now</button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <HiXCircle className="h-16 w-16 text-danger mx-auto" />
            <h2 className="text-2xl font-bold">Verification Failed</h2>
            <p className="text-text-muted">{message}</p>
            <div className="pt-4">
              <Link to="/register/student">
                <button className="w-full py-3 border border-border bg-transparent hover:bg-slate-800 transition-colors">
                  Try Registering Again
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerifyPage;
