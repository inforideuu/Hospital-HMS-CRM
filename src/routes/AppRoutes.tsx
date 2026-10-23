import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import { PlatformLayout } from '../components/layout/PlatformLayout';
import { SalesLayout } from '../components/layout/SalesLayout';
import { HospitalLayout } from '../components/layout/HospitalLayout';
import { PatientLayout } from '../components/layout/PatientLayout';
import { DriverLayout } from '../components/layout/DriverLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { PlatformLogin } from '../pages/auth/PlatformLogin';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { Unauthorized } from '../pages/auth/Unauthorized';
import { NotFound } from '../pages/auth/NotFound';

// Sales Executive Portal Pages
import { SalesDashboard } from '../pages/sales/SalesDashboard';
import { SalesLeads } from '../pages/sales/SalesLeads';
import { SalesFollowUps } from '../pages/sales/SalesFollowUps';
import { SalesActivities } from '../pages/sales/SalesActivities';
import { SalesCustomers } from '../pages/sales/SalesCustomers';
import { SalesProfile } from '../pages/sales/SalesProfile';

// Platform Admin Portal Pages
import { PlatformDashboard } from '../pages/platform/dashboard/PlatformDashboard';
import { HospitalManagement } from '../pages/platform/hospitals/HospitalManagement';
import { HospitalDetail } from '../pages/platform/hospitals/HospitalDetail';
import { PendingHospitalOnboarding } from '../pages/platform/hospitals/PendingHospitalOnboarding';
import { SubscriptionManagement } from '../pages/platform/subscriptions/SubscriptionManagement';
import { PlatformUsers } from '../pages/platform/users/PlatformUsers';
import { HospitalWebsites } from '../pages/platform/websites/HospitalWebsites';
import { SupportCenter } from '../pages/platform/support/SupportCenter';
import { PlatformSettings } from '../pages/platform/settings/PlatformSettings';

// Hospital Portal Pages
import { HospitalDashboard } from '../pages/hospital/dashboard/HospitalDashboard';
import { PatientManagement } from '../pages/hospital/patients/PatientManagement';
import { PatientDetail } from '../pages/hospital/patients/PatientDetail';
import { AppointmentManagement } from '../pages/hospital/appointments/AppointmentManagement';
import { DoctorManagement } from '../pages/hospital/doctors/DoctorManagement';
import { StaffManagement } from '../pages/hospital/staff/StaffManagement';
import { DepartmentManagement } from '../pages/hospital/departments/DepartmentManagement';
import { OPDRoomManagement } from '../pages/hospital/opd-rooms/OPDRoomManagement';
import { AdmissionsManagement } from '../pages/hospital/admissions/AdmissionsManagement';
import { BillingManagement } from '../pages/hospital/billing/BillingManagement';
import { PharmacyManagement } from '../pages/hospital/pharmacy/PharmacyManagement';
import { LaboratoryManagement } from '../pages/hospital/laboratory/LaboratoryManagement';
import { AmbulanceManagement } from '../pages/hospital/ambulance/AmbulanceManagement';
import { ReportsAnalytics } from '../pages/hospital/reports/ReportsAnalytics';
import { HospitalSettings } from '../pages/hospital/settings/HospitalSettings';
import { EnterpriseManagement } from '../pages/hospital/enterprise/EnterpriseManagement';
import { EnterpriseDashboard } from '../pages/hospital/enterprise/EnterpriseDashboard';
import { OrganizationProfile } from '../pages/hospital/enterprise/OrganizationProfile';
import { BranchManagement } from '../pages/hospital/enterprise/BranchManagement';
import { BranchAdminManagement } from '../pages/hospital/enterprise/BranchAdminManagement';
import { ConsolidatedReports } from '../pages/hospital/enterprise/ConsolidatedReports';
import { OrganizationSettings } from '../pages/hospital/enterprise/OrganizationSettings';
import { EnterpriseSubscriptionDetails } from '../pages/hospital/enterprise/EnterpriseSubscriptionDetails';

// Doctor Portal Pages
import { DoctorDashboard } from '../pages/hospital/doctor/DoctorDashboard';
import { DoctorAppointments } from '../pages/hospital/doctor/DoctorAppointments';
import { DoctorPatientQueue } from '../pages/hospital/doctor/DoctorPatientQueue';
import { ConsultationWorkspace } from '../pages/hospital/doctor/ConsultationWorkspace';
import { DoctorScheduleView } from '../pages/hospital/doctor/DoctorScheduleView';
import { DoctorProfileView } from '../pages/hospital/doctor/DoctorProfileView';

// Patient Portal Pages
import { PatientDashboard } from '../pages/patient/PatientDashboard';
import { PatientProfile } from '../pages/patient/PatientProfile';
import { PatientAppointments } from '../pages/patient/PatientAppointments';
import { PatientMedicalRecords } from '../pages/patient/PatientMedicalRecords';
import { PatientPrescriptions } from '../pages/patient/PatientPrescriptions';
import { PatientLabReports } from '../pages/patient/PatientLabReports';
import { PatientBilling } from '../pages/patient/PatientBilling';
import { PatientAmbulance } from '../pages/patient/PatientAmbulance';

// Driver Portal Pages
import { DriverDashboard } from '../pages/driver/DriverDashboard';

import { LandingPage } from '../pages/public/LandingPage';
import { HospitalPortalGateway } from '../pages/public/HospitalPortalGateway';
import { WebsiteBuilder } from '../pages/platform/websites/WebsiteBuilder';
import { HospitalPublicWebsite } from '../pages/public/HospitalPublicWebsite';

export const AppRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public SaaS Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Select Your Hospital Website Directory Page */}
      <Route path="/select-hospital" element={<HospitalPortalGateway />} />

      {/* Multi-Tenant Public Hospital Website */}
      <Route path="/hospital-site/:hospitalSlug" element={<HospitalPublicWebsite />} />
      <Route path="/hospital/:hospitalSlug" element={<HospitalPublicWebsite />} />

      {/* Public / Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/hospital/:hospitalSlug/login" element={<Login />} />
      <Route path="/hospital-site/:hospitalSlug/login" element={<Login />} />
      <Route path="/superadmin-login" element={<PlatformLogin />} />
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
        <Route path="pending-onboarding" element={<PendingHospitalOnboarding />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <PlatformUsers />
            </ProtectedRoute>
          }
        />
        <Route path="websites" element={<HospitalWebsites />} />
        <Route path="websites/builder/:hospitalId" element={<WebsiteBuilder />} />
        <Route path="ambulance" element={<Navigate to="/unauthorized" replace />} />
        <Route path="support" element={<SupportCenter />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <PlatformSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* SALES EXECUTIVE PORTAL ROUTES */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute requiredPortal="sales" allowedRoles={['sales_executive']}>
            <SalesLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/sales/dashboard" replace />} />
        <Route path="dashboard" element={<SalesDashboard />} />
        <Route path="leads" element={<SalesLeads />} />
        <Route path="follow-ups" element={<SalesFollowUps />} />
        <Route path="activities" element={<SalesActivities />} />
        <Route path="customers" element={<SalesCustomers />} />
        <Route path="profile" element={<SalesProfile />} />
      </Route>

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
        <Route
          path="patients"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor', 'receptionist', 'nurse']}>
              <PatientManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients/:id"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor', 'receptionist', 'nurse']}>
              <PatientDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor', 'receptionist', 'nurse']}>
              <AppointmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin']}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor/queue"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'nurse']}>
              <DoctorPatientQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="consultation"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin']}>
              <ConsultationWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="consultation/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin']}>
              <ConsultationWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor/schedule"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin']}>
              <DoctorScheduleView />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor/profile"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin']}>
              <DoctorProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctors"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor', 'receptionist']}>
              <DoctorManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <DepartmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="opd-rooms"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor', 'receptionist', 'nurse']}>
              <OPDRoomManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admissions"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor', 'nurse', 'receptionist']}>
              <AdmissionsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="billing"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'accountant']}>
              <BillingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="pharmacy"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'pharmacist', 'doctor']}>
              <PharmacyManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="laboratory"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'lab_technician', 'doctor']}>
              <LaboratoryManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="ambulance"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor', 'receptionist', 'nurse']}>
              <AmbulanceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'accountant', 'doctor']}>
              <ReportsAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor']}>
              <EnterpriseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise/dashboard"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'doctor']}>
              <EnterpriseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise/profile"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <OrganizationProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise/branches"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <BranchManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise/branch-admins"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <BranchAdminManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise/reports"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'accountant']}>
              <ConsolidatedReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise/settings"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <OrganizationSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="enterprise/subscription"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <EnterpriseSubscriptionDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <HospitalSettings />
            </ProtectedRoute>
          }
        />
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

export default AppRoutes;
