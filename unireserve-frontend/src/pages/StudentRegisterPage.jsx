import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';
import {
  HiAcademicCap,
  HiArrowRight,
  HiCalendar,
  HiIdentification,
  HiLockClosed,
  HiMail,
  HiUser,
} from 'react-icons/hi';
import AuthLayout from '../components/AuthLayout';

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

  const quickLinks = [
    { to: '/login', label: 'Back to Login', variant: 'primary' },
    { to: '/register/manager', label: 'Manager Application' },
  ];

  const highlights = [
    {
      label: 'Campus access',
      value: 'Browse all',
      copy: 'Search quiet zones, labs, study rooms, and specialist spaces in one place.',
    },
    {
      label: 'Smarter booking',
      value: 'Waitlists',
      copy: 'Track upcoming sessions and auto-promotion from full slots after sign-up.',
    },
    {
      label: 'Fast setup',
      value: 'Email verify',
      copy: 'Registration finishes with a quick verification step sent to your inbox.',
    },
  ];

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
    <AuthLayout
      eyebrow="Student onboarding"
      title="Start booking campus spaces with a student account built for speed."
      description="Create your profile once, verify your email, and manage reservations, waitlists, and favorite study spots from one dashboard."
      quickLinks={quickLinks}
      highlights={highlights}
      cardEyebrow="Student Access"
      cardTitle="Create Student Account"
      cardDescription="Use your university identity so we can match you to the right booking experience."
      footnote="After registration, we’ll send a verification link to your email before you can sign in."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-form__grid">
          <div className="auth-field">
            <label htmlFor="student-name">Full Name</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiUser />
              </span>
              <input
                id="student-name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="student-email">Email Address</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiMail />
              </span>
              <input
                id="student-email"
                name="email"
                type="email"
                required
                placeholder="john@univ.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="auth-form__grid">
          <div className="auth-field">
            <label htmlFor="student-id">Student ID</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiIdentification />
              </span>
              <input
                id="student-id"
                name="student_id"
                type="text"
                required
                placeholder="S12345"
                value={formData.student_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="student-department">Department</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiAcademicCap />
              </span>
              <input
                id="student-department"
                name="department"
                type="text"
                required
                placeholder="Computer Science"
                value={formData.department}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="student-year">Year of Study</label>
          <div className="auth-field__control">
            <span className="auth-field__icon">
              <HiCalendar />
            </span>
            <select
              id="student-year"
              name="year_of_study"
              required
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

        <div className="auth-form__grid">
          <div className="auth-field">
            <label htmlFor="student-password">Password</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiLockClosed />
              </span>
              <input
                id="student-password"
                name="password"
                type="password"
                required
                minLength="8"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="student-password-confirm">Confirm Password</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiLockClosed />
              </span>
              <input
                id="student-password-confirm"
                name="password_confirm"
                type="password"
                required
                minLength="8"
                placeholder="••••••••"
                value={formData.password_confirm}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <p className="auth-form__helper">
          Make sure the email matches the one you can access right now, since verification happens
          immediately after registration.
        </p>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Creating Account...' : 'Create Student Account'}
          {!loading && <HiArrowRight />}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in here</Link>.
      </p>
    </AuthLayout>
  );
};

export default StudentRegisterPage;
