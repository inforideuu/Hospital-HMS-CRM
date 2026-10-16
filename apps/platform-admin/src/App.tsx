import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PlatformLayout } from './components/layout/PlatformLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Unauthorized } from './pages/auth/Unauthorized';
import { NotFound } from './pages/auth/NotFound';

// Platform Admin Portal Pages
import { PlatformDashboard } from './pages/platform/dashboard/PlatformDashboard';
import { HospitalManagement } from './pages/platform/hospitals/HospitalManagement';
import { HospitalDetail } from './pages/platform/hospitals/HospitalDetail';
import { SubscriptionManagement } from './pages/platform/subscriptions/SubscriptionManagement';
import { PlatformUsers } from './pages/platform/users/PlatformUsers';
import { HospitalWebsites } from './pages/platform/websites/HospitalWebsites';
import { SupportCenter } from './pages/platform/support/SupportCenter';
import { PlatformSettings } from './pages/platform/settings/PlatformSettings';
import { WebsiteBuilder } from './pages/platform/websites/WebsiteBuilder';
import { ReportsAnalytics } from './pages/hospital/reports/ReportsAnalytics';

import { LandingPage } from './pages/public/LandingPage';

const AppRoutesInner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* PLATFORM ADMIN PORTAL ROUTES */}
      <Route
        path="/platform"
        element={
          <ProtectedRoute requiredPortal="platform">
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/platform/dashboard" replace />} />
        <Route path="dashboard" element={<PlatformDashboard />} />
        <Route path="hospitals" element={<HospitalManagement />} />
        <Route path="hospitals/:id" element={<HospitalDetail />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route path="users" element={<PlatformUsers />} />
        <Route path="websites" element={<HospitalWebsites />} />
        <Route path="websites/builder/:hospitalId" element={<WebsiteBuilder />} />
        <Route path="ambulance" element={<Navigate to="/unauthorized" replace />} />
        <Route path="support" element={<SupportCenter />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="settings" element={<PlatformSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutesInner />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
