import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import ManagerRegisterPage from './pages/ManagerRegisterPage';
import EmailVerifyPage from './pages/EmailVerifyPage';

// Placeholder components for future features
const Dashboard = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>
    <p>Welcome to UniReserve. More features coming in Phase 2!</p>
    <button onClick={() => window.location.href='/login'} className="mt-4 bg-red-500">Temp Logout (use /login)</button>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<StudentRegisterPage />} />
          <Route path="/register/manager" element={<ManagerRegisterPage />} />
          <Route path="/verify-email" element={<EmailVerifyPage />} />

          {/* Student Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Manager Routes */}
          <Route 
            path="/manager/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <div className="p-10"><h1>Manager Dashboard</h1><p>Coming Soon...</p></div>
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div className="p-10"><h1>Admin Dashboard</h1><p>Coming Soon...</p></div>
              </ProtectedRoute>
            } 
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
