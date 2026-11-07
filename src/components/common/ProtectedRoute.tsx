import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole, PortalType } from '../../types';
import { MockStorage } from '../../services/mockStorage';
import { CapabilityLockedNotice } from './CapabilityLockedNotice';

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

    const storedHospital =
      typeof window !== 'undefined' && window.sessionStorage
        ? sessionStorage.getItem('pulse_active_hospital_target')
        : null;

    const targetLoginUrl = isPlatformOrSales
      ? '/superadmin-login'
      : storedHospital
      ? `/login?targetHospital=${encodeURIComponent(storedHospital)}`
      : '/login';

    return <Navigate to={targetLoginUrl} state={{ from: location }} replace />;
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

  // Enforce Dynamic Subscription Plan Feature Gating on Hospital routes
  if (user.portal === 'hospital' && location.pathname.startsWith('/hospital')) {
    const isExemptPath =
      location.pathname === '/hospital' ||
      location.pathname === '/hospital/dashboard' ||
      location.pathname.startsWith('/hospital/settings') ||
      location.pathname.startsWith('/hospital/support');

    if (!isExemptPath) {
      const access = MockStorage.checkPathAccess(user.hospitalId, location.pathname);
      if (!access.allowed && access.capability) {
        const hosp = MockStorage.getHospitalById(user.hospitalId || '');
        return (
          <CapabilityLockedNotice
            capability={access.capability}
            currentTier={hosp?.planTier}
            hospitalId={user.hospitalId}
            hospitalName={hosp?.name}
          />
        );
      }
    }
  }

  return children;
};
