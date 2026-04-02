import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { UserPlus } from 'lucide-react';
import { extractErrorMessage } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/register/student/', formData);
      navigate('/auth/login', { state: { msg: 'Registration successful! Please login.' }});
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dynamic-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">Join <span className="gradient-text">UniReserve</span></h1>
          <p className="text-gray-400">Create your student access key.</p>
        </div>

        <div className="glass-panel p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">First Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Jane"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Last Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">University Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="jane.doe@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Secure Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button flex justify-center items-center gap-2 mt-2"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already registered?{' '}
            <Link to="/auth/login" className="text-white font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
