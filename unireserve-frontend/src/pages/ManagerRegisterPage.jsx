import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';
import {
  HiAcademicCap,
  HiArrowRight,
  HiIdentification,
  HiLockClosed,
  HiMail,
  HiOfficeBuilding,
  HiUser,
} from 'react-icons/hi';
import AuthLayout from '../components/AuthLayout';

const ManagerRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirm: '',
    employee_id: '',
    department: '',
    facility_responsible_for: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const quickLinks = [
    { to: '/login', label: 'Back to Login', variant: 'primary' },
    { to: '/register/student', label: 'Student Sign Up' },
  ];

  const highlights = [
    {
      label: 'Operations view',
      value: 'Approvals',
      copy: 'Review student requests and respond with clear manager notes from one queue.',
    },
    {
      label: 'Live control',
      value: 'Publish slots',
      copy: 'Create facilities, release schedules, and keep capacity up to date.',
    },
    {
      label: 'Smarter planning',
      value: 'Analytics',
      copy: 'Use demand trends and attendance health to plan around campus behavior.',
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
      await api.post('/auth/register/manager/', formData);
      notifySuccess('Registration submitted! An administrator will review your application.');
      navigate('/login');
    } catch (error) {
      const resp = error.response?.data;
      const message = resp?.email?.[0] || resp?.employee_id?.[0] || resp?.password?.[0] || 'Registration failed. Please check your data.';
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Manager onboarding"
      title="Apply for facility control with a manager account built for operations."
      description="Tell us who you are, which spaces you oversee, and we’ll route your application into the approval workflow."
      quickLinks={quickLinks}
      highlights={highlights}
      cardEyebrow="Manager Access"
      cardTitle="Apply for Manager Account"
      cardDescription="This flow is for facility owners, lab coordinators, and campus operations staff."
      footnote="Manager registrations are reviewed before full dashboard and analytics access is enabled."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-form__grid">
          <div className="auth-field">
            <label htmlFor="manager-name">Full Name</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiUser />
              </span>
              <input
                id="manager-name"
                name="name"
                type="text"
                required
                placeholder="John Smith"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="manager-email">Email Address</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiMail />
              </span>
              <input
                id="manager-email"
                name="email"
                type="email"
                required
                placeholder="j.smith@univ.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="auth-form__grid">
          <div className="auth-field">
            <label htmlFor="manager-id">Employee ID</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiIdentification />
              </span>
              <input
                id="manager-id"
                name="employee_id"
                type="text"
                required
                placeholder="EMP9876"
                value={formData.employee_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="manager-department">Department</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiAcademicCap />
              </span>
              <input
                id="manager-department"
                name="department"
                type="text"
                required
                placeholder="Library Admin / IT"
                value={formData.department}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="manager-facility">Facility to Manage</label>
          <div className="auth-field__control">
            <span className="auth-field__icon">
              <HiOfficeBuilding />
            </span>
            <input
              id="manager-facility"
              name="facility_responsible_for"
              type="text"
              required
              placeholder="Main Library / CS Lab A"
              value={formData.facility_responsible_for}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="auth-form__grid">
          <div className="auth-field">
            <label htmlFor="manager-password">Password</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiLockClosed />
              </span>
              <input
                id="manager-password"
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
            <label htmlFor="manager-password-confirm">Confirm Password</label>
            <div className="auth-field__control">
              <span className="auth-field__icon">
                <HiLockClosed />
              </span>
              <input
                id="manager-password-confirm"
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
          Applications are reviewed by an administrator before manager controls and analytics are
          unlocked.
        </p>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Submitting Application...' : 'Apply for Manager Role'}
          {!loading && <HiArrowRight />}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in here</Link>.
      </p>
    </AuthLayout>
  );
};

export default ManagerRegisterPage;
