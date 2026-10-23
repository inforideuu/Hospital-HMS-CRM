import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Hospital } from '../types';
import { MockStorage } from '../services/mockStorage';

export interface LoginResult {
  success: boolean;
  error?: string;
  multipleAccounts?: User[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  currentHospital: Hospital | null;
  login: (
    email: string,
    passwordOrRole?: string | UserRole,
    targetHospitalId?: string,
    explicitRole?: UserRole
  ) => LoginResult;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchHospital: (hospitalId: string) => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KNOWN_ROLES: UserRole[] = [
  'super_admin',
  'super_admin_manager',
  'sales_executive',
  'hospital_admin',
  'doctor',
  'receptionist',
  'nurse',
  'accountant',
  'pharmacist',
  'lab_technician',
  'patient',
  'ambulance_driver',
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => MockStorage.getAuthUser());
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(() => {
    const authUser = MockStorage.getAuthUser();
    if (authUser?.hospitalId) {
      return MockStorage.getHospitalById(authUser.hospitalId) || null;
    }
    return null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const authUser = MockStorage.getAuthUser();
      setUser(authUser);
      if (authUser?.hospitalId) {
        setCurrentHospital(MockStorage.getHospitalById(authUser.hospitalId) || null);
      } else {
        setCurrentHospital(null);
      }
    };

    window.addEventListener('pulse_storage_updated', handleStorageChange);
    return () => window.removeEventListener('pulse_storage_updated', handleStorageChange);
  }, []);

  const login = (
    email: string,
    passwordOrRole?: string | UserRole,
    targetHospitalId?: string,
    explicitRole?: UserRole
  ): LoginResult => {
    let password: string | undefined = undefined;
    let role = explicitRole;

    if (passwordOrRole) {
      if (KNOWN_ROLES.includes(passwordOrRole as UserRole)) {
        role = passwordOrRole as UserRole;
      } else {
        password = passwordOrRole;
      }
    }

    const normalizedEmail = (email || '').trim().toLowerCase();

    // 1. Strict Tenant Scoping: Look up account using resolved hospital context + normalized email
    const authLookup = MockStorage.findUserForAuth(normalizedEmail, targetHospitalId, password);
    let foundUser = authLookup.user;

    // Optional demo fallback for role switcher if specific demo user requested
    if (!foundUser && role && !targetHospitalId) {
      const allUsers = MockStorage.getUsers();
      foundUser = allUsers.find((u) => u.role === role) || null;
    }

    if (!foundUser) {
      return {
        success: false,
        error: authLookup.error || 'Invalid credentials. No account found for this hospital.',
        multipleAccounts: authLookup.multipleAccounts,
      };
    }

    const isSuperAdmin = foundUser.role === 'super_admin' || foundUser.role === 'super_admin_manager';

    // 2. Subscription Plan Expiry Lock Check
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
    } else {
      setCurrentHospital(null);
    }
    return { success: true };
  };

  const logout = () => {
    MockStorage.setAuthUser(null);
    setUser(null);
    setCurrentHospital(null);
    window.dispatchEvent(new Event('pulse_storage_updated'));
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
