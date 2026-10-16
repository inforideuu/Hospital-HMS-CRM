import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import { HospitalLayout } from './components/layout/HospitalLayout';
import { PatientLayout } from './components/layout/PatientLayout';
import { DriverLayout } from './components/layout/DriverLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Unauthorized } from './pages/auth/Unauthorized';
import { NotFound } from './pages/auth/NotFound';

// Hospital Portal Pages
import { HospitalDashboard } from './pages/hospital/dashboard/HospitalDashboard';
import { PatientManagement } from './pages/hospital/patients/PatientManagement';
import { PatientDetail } from './pages/hospital/patients/PatientDetail';
import { AppointmentManagement } from './pages/hospital/appointments/AppointmentManagement';
import { DoctorManagement } from './pages/hospital/doctors/DoctorManagement';
import { StaffManagement } from './pages/hospital/staff/StaffManagement';
import { DepartmentManagement } from './pages/hospital/departments/DepartmentManagement';
import { AdmissionsManagement } from './pages/hospital/admissions/AdmissionsManagement';
import { BillingManagement } from './pages/hospital/billing/BillingManagement';
import { PharmacyManagement } from './pages/hospital/pharmacy/PharmacyManagement';
import { LaboratoryManagement } from './pages/hospital/laboratory/LaboratoryManagement';
import { AmbulanceManagement } from './pages/hospital/ambulance/AmbulanceManagement';
import { ReportsAnalytics } from './pages/hospital/reports/ReportsAnalytics';
import { HospitalSettings } from './pages/hospital/settings/HospitalSettings';

// Patient Portal Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientProfile } from './pages/patient/PatientProfile';
import { PatientAppointments } from './pages/patient/PatientAppointments';
import { PatientMedicalRecords } from './pages/patient/PatientMedicalRecords';
import { PatientPrescriptions } from './pages/patient/PatientPrescriptions';
import { PatientLabReports } from './pages/patient/PatientLabReports';
import { PatientBilling } from './pages/patient/PatientBilling';
import { PatientAmbulance } from './pages/patient/PatientAmbulance';

// Driver Portal Pages
import { DriverDashboard } from './pages/driver/DriverDashboard';

import { LandingPage } from './pages/public/LandingPage';
import { HospitalPublicWebsite } from './pages/public/HospitalPublicWebsite';
import { HospitalPortalGateway } from './pages/public/HospitalPortalGateway';

const AppRoutesInner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Hospital SaaS Access Gateway (Select Hospital or Login with Credentials) */}
      <Route path="/" element={<HospitalPortalGateway />} />
      <Route path="/hospital-site/:hospitalSlug" element={<HospitalPublicWebsite />} />

      {/* Public / Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* HOSPITAL HMS PORTAL ROUTES */}
      <Route
        path="/hospital"
        element={
          <ProtectedRoute requiredPortal="hospital">
            <HospitalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/hospital/dashboard" replace />} />
        <Route path="dashboard" element={<HospitalDashboard />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="appointments" element={<AppointmentManagement />} />
        <Route path="doctors" element={<DoctorManagement />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="admissions" element={<AdmissionsManagement />} />
        <Route path="billing" element={<BillingManagement />} />
        <Route path="pharmacy" element={<PharmacyManagement />} />
        <Route path="laboratory" element={<LaboratoryManagement />} />
        <Route path="ambulance" element={<AmbulanceManagement />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="settings" element={<HospitalSettings />} />
      </Route>

      {/* PATIENT PORTAL ROUTES */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute requiredPortal="patient">
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="records" element={<PatientMedicalRecords />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="lab-reports" element={<PatientLabReports />} />
        <Route path="billing" element={<PatientBilling />} />
        <Route path="ambulance" element={<PatientAmbulance />} />
      </Route>

      {/* DRIVER PORTAL ROUTES */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute requiredPortal="ambulance_driver">
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="dashboard" element={<DriverDashboard />} />
      </Route>

      {/* 404 Fallback */}
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
