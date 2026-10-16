import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Hospital } from '../types';
import { MockStorage } from '../services/mockStorage';

export interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  currentHospital: Hospital | null;
  login: (email: string, role?: UserRole, targetHospitalId?: string) => LoginResult;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchHospital: (hospitalId: string) => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => MockStorage.getAuthUser());
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(() => {
    const authUser = MockStorage.getAuthUser();
    if (authUser?.hospitalId) {
      return MockStorage.getHospitalById(authUser.hospitalId) || null;
    }
    const hospitals = MockStorage.getHospitals();
    return hospitals.length > 0 ? hospitals[0] : null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const authUser = MockStorage.getAuthUser();
      setUser(authUser);
      if (authUser?.hospitalId) {
        setCurrentHospital(MockStorage.getHospitalById(authUser.hospitalId) || null);
      }
    };

    window.addEventListener('pulse_storage_updated', handleStorageChange);
    return () => window.removeEventListener('pulse_storage_updated', handleStorageChange);
  }, []);

  const login = (email: string, explicitRole?: UserRole, targetHospitalId?: string): LoginResult => {
    const allUsers = MockStorage.getUsers();
    let foundUser = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser && explicitRole) {
      foundUser = allUsers.find((u) => u.role === explicitRole);
    }

    if (!foundUser) {
      return { success: false, error: 'User account not found. Please check your credentials or register.' };
    }

    // Single-Tenant Website & Portal Authorization Enforcement
    const isSuperAdmin = foundUser.role === 'super_admin' || foundUser.role === 'super_admin_manager';
    if (targetHospitalId && !isSuperAdmin) {
      if (foundUser.hospitalId && foundUser.hospitalId !== targetHospitalId) {
        const assignedHosp = MockStorage.getHospitalById(foundUser.hospitalId);
        const targetHosp = MockStorage.getHospitalById(targetHospitalId);
        return {
          success: false,
          error: `Access Denied: Your account credentials (${assignedHosp?.name || foundUser.hospitalId}) are valid only inside your assigned hospital website. You are not authorized to log into ${targetHosp?.name || 'this facility'}'s website or portal.`,
        };
      }
    }

    // Subscription Plan Expiry Lock Check
    if (!isSuperAdmin && foundUser.hospitalId) {
      const subStatus = MockStorage.checkHospitalSubscriptionStatus(foundUser.hospitalId);
      if (!subStatus.allowed) {
        const isHospitalAdmin = foundUser.role === 'hospital_admin';
        if (!isHospitalAdmin) {
          const hosp = MockStorage.getHospitalById(foundUser.hospitalId);
          return {
            success: false,
            error: `Subscription Access Restricted: Access to ${hosp?.name || 'your hospital'} is currently locked because the subscription plan is expired or disabled. Only the Hospital Admin can log in to renew or upgrade the subscription.`,
          };
        }
      }
    }

    MockStorage.setAuthUser(foundUser);
    setUser(foundUser);
    if (foundUser.hospitalId) {
      const hosp = MockStorage.getHospitalById(foundUser.hospitalId);
      setCurrentHospital(hosp || null);
    }
    return { success: true };
  };

  const logout = () => {
    MockStorage.setAuthUser(null);
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    const allUsers = MockStorage.getUsers();
    const targetUser = allUsers.find((u) => u.role === role);
    if (targetUser) {
      MockStorage.setAuthUser(targetUser);
      setUser(targetUser);
      if (targetUser.hospitalId) {
        const hosp = MockStorage.getHospitalById(targetUser.hospitalId);
        setCurrentHospital(hosp || null);
      }
    }
  };

  const switchHospital = (hospitalId: string) => {
    const hosp = MockStorage.getHospitalById(hospitalId);
    if (hosp) {
      setCurrentHospital(hosp);
      if (user && user.portal === 'hospital') {
        const updatedUser = { ...user, hospitalId: hosp.id, hospitalName: hosp.name };
        MockStorage.setAuthUser(updatedUser);
        setUser(updatedUser);
      }
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        currentHospital,
        login,
        logout,
        switchRole,
        switchHospital,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
