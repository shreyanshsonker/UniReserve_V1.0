import { createBrowserRouter, Navigate } from 'react-router-dom';

import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import FacilityBrowser from '../pages/FacilityBrowser';
import FacilityDetail from '../pages/FacilityDetail';
import ManagerDashboard from '../pages/ManagerDashboard';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '', element: <Navigate to="/auth/login" replace /> }
    ]
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'facilities', element: <FacilityBrowser /> },
      { path: 'facilities/:id', element: <FacilityDetail /> },
      { path: 'manager', element: <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerDashboard /></ProtectedRoute> },
      { path: '', element: <Navigate to="/dashboard" replace /> }
    ]
  }
]);
