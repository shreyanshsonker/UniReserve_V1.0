import type { PropsWithChildren } from 'react';

import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types/api';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#060e20] flex items-center justify-center text-white">
        Connecting to UniReserve Terminal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
