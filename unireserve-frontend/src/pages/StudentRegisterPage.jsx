import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';
import { HiUser, HiMail, HiLockClosed, HiIdentification, HiAcademicCap, HiCalendar } from 'react-icons/hi';

const StudentRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirm: '',
    student_id: '',
    department: '',
    year_of_study: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      notifyError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register/student/', formData);
      notifySuccess('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error) {
      const resp = error.response?.data;
      const message = resp?.email?.[0] || resp?.student_id?.[0] || resp?.password?.[0] || 'Registration failed. Please check your data.';
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10 px-6 min-h-screen">
      <div className="card glass max-w-lg w-full animate-fade-in shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/login" className="text-2xl font-bold text-white hover:text-primary transition-colors">UniReserve</Link>
          <h2 className="text-xl font-semibold mt-4">Student Registration</h2>
          <p className="text-text-muted mt-2">Join your university's facility booking system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <HiUser className="h-5 w-5" />
                </span>
                <input
                  name="name"
                  type="text"
                  required
                  className="pl-10"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <HiMail className="h-5 w-5" />
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="pl-10"
                  placeholder="john@univ.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Student ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <HiIdentification className="h-5 w-5" />
                </span>
                <input
                  name="student_id"
                  type="text"
                  required
                  className="pl-10"
                  placeholder="S12345"
                  value={formData.student_id}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Department</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <HiAcademicCap className="h-5 w-5" />
                </span>
                <input
                  name="department"
                  type="text"
                  required
                  className="pl-10"
                  placeholder="Computer Science"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted">Year of Study</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                <HiCalendar className="h-5 w-5" />
              </span>
              <select
                name="year_of_study"
                required
                className="pl-10"
                value={formData.year_of_study}
                onChange={handleChange}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <HiLockClosed className="h-5 w-5" />
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength="8"
                  className="pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <HiLockClosed className="h-5 w-5" />
                </span>
                <input
                  name="password_confirm"
                  type="password"
                  required
                  minLength="8"
                  className="pl-10"
                  placeholder="••••••••"
                  value={formData.password_confirm}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 mt-6 shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Register Student'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-8">
          Already have an account? <Link to="/login" className="text-primary font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
