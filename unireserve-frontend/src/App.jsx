import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import ManagerRegisterPage from './pages/ManagerRegisterPage';
import EmailVerifyPage from './pages/EmailVerifyPage';
import FacilityBrowser from './pages/FacilityBrowser';
import SlotPicker from './pages/SlotPicker';
import Home from './pages/Home';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ManagerFacilities from './pages/ManagerFacilities';
import MyBookings from './pages/MyBookings';





const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/student" element={<StudentRegisterPage />} />
            <Route path="/register/manager" element={<ManagerRegisterPage />} />
            <Route path="/verify-email" element={<EmailVerifyPage />} />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Student Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/facilities" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <FacilityBrowser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/facilities/:id" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SlotPicker />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyBookings />
                </ProtectedRoute>
              } 
            />

            {/* Manager Routes */}
            <Route 
              path="/manager/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerFacilities />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manager/analytics" 
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
