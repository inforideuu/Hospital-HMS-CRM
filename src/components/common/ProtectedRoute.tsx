import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole, PortalType } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  requiredPortal?: PortalType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPortal,
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const isPlatformOrSales =
      requiredPortal === 'platform' ||
      requiredPortal === 'sales' ||
      location.pathname.startsWith('/platform') ||
      location.pathname.startsWith('/sales');
    return <Navigate to={isPlatformOrSales ? '/superadmin-login' : '/login'} state={{ from: location }} replace />;
  }

  if (requiredPortal && user.portal !== requiredPortal) {
    // Allow ambulance drivers/managers with hospital portal to access driver console routes
    const isAmbulancePermitted =
      requiredPortal === 'ambulance_driver' &&
      (user.role === 'ambulance_driver' || user.role === 'ambulance_manager');

    if (!isAmbulancePermitted) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
