import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Building2,
  CreditCard,
  Users,
  Globe,
  HelpCircle,
  Settings,
  LayoutDashboard,
  UserCheck,
  Calendar,
  Stethoscope,
  ShieldAlert,
  UserPlus,
  BedDouble,
  HeartPulse,
  Receipt,
  Pill,
  FlaskConical,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Truck,
  Ambulance,
  Target,
  Clock,
  Briefcase,
  CheckCircle2,
  User,
  Lock,
  Network,
  GitBranch,
  Tag,
  Plus,
  ClipboardList,
  ShoppingCart,
  FileCheck,
  MessageSquare,
  Star,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MockStorage } from '../../services/mockStorage';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  portalType: 'platform' | 'sales' | 'hospital' | 'patient' | 'driver';
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  badge?: string | number;
  featureKeyword?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  portalType,
}) => {
  const { user, currentHospital } = useAuth();
  const location = useLocation();
  const { showToast } = useNotification();

  const hospId = user?.hospitalId || currentHospital?.id;
  const activeHospital = currentHospital || (hospId ? MockStorage.getHospitalById(hospId) : null);
  const [logoImgFailed, setLogoImgFailed] = React.useState(false);

  React.useEffect(() => {
    setLogoImgFailed(false);
  }, [activeHospital?.id, activeHospital?.logoUrl, activeHospital?.image]);

  const patientCount = hospId ? MockStorage.getPatients(hospId).length : MockStorage.getPatients().length;

  const pendingOnboardCount = MockStorage.getConvertedCustomers().filter(
    (c) => c.onboardingStatus === 'Pending Onboarding' || c.subscriptionStatus === 'Pending Setup'
  ).length;

  const pendingManifestCount = MockStorage.getEnterpriseBranchDocuments().filter(
    (d) => d.status === 'pending_review'
  ).length;

  const activeTicketCount = MockStorage.getSupportTickets().filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  const demoRequestsCount = MockStorage.getDemoRequests().filter((d) => d.status === 'new').length;

  const platformNavItems: NavItem[] = [
    { label: 'Overview', path: '/platform/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Hospital Management', path: '/platform/hospitals', icon: <Building2 className="w-4 h-4" />, badge: String(MockStorage.getHospitals().length), roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Sub-Branch Manifests', path: '/platform/enterprise-manifests', icon: <Network className="w-4 h-4 text-purple-400" />, badge: pendingManifestCount > 0 ? `${pendingManifestCount} New` : undefined, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Demo Requests', path: '/platform/demo-requests', icon: <PhoneCall className="w-4 h-4 text-emerald-400" />, badge: demoRequestsCount > 0 ? `${demoRequestsCount} New` : undefined, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Pending Onboarding', path: '/platform/pending-onboarding', icon: <UserCheck className="w-4 h-4 text-amber-500" />, badge: pendingOnboardCount > 0 ? String(pendingOnboardCount) : undefined, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Subscriptions & Plans', path: '/platform/subscriptions', icon: <CreditCard className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Users & Access', path: '/platform/users', icon: <Users className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Hospital Website Builder', path: '/platform/websites', icon: <Globe className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Support Center', path: '/platform/support', icon: <HelpCircle className="w-4 h-4" />, badge: activeTicketCount > 0 ? String(activeTicketCount) : undefined, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Reports & Analytics', path: '/platform/reports', icon: <BarChart3 className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Platform Settings', path: '/platform/settings', icon: <Settings className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
  ];

  const hospitalNavItems: NavItem[] = [
    { label: 'Hospital Dashboard', path: '/hospital/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      label: 'Patients & EHR',
      path: '/hospital/patients',
      icon: <UserPlus className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'receptionist', 'nurse'],
      badge: String(patientCount),
      featureKeyword: 'patients_ehr',
    },
    {
      label: 'Appointments & OPD',
      path: '/hospital/appointments',
      icon: <Calendar className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'receptionist', 'nurse'],
      badge: 'Today',
      featureKeyword: 'appointments_opd',
    },
    {
      label: 'Patient Request Queue',
      path: '/hospital/appointments?tab=patient-requests',
      icon: <MessageSquare className="w-4 h-4 text-teal-400" />,
      roles: ['hospital_admin', 'receptionist'],
      badge: (() => {
        const reqs = hospId ? MockStorage.getAppointmentRequests(hospId) : MockStorage.getAppointmentRequests();
        const pending = reqs.filter((r) => r.status === 'Pending').length;
        return pending > 0 ? `${pending} New` : undefined;
      })(),
      featureKeyword: 'appointments_opd',
    },
    {
      label: 'Doctors & Specialists',
      path: '/hospital/doctors',
      icon: <Stethoscope className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'receptionist'],
      featureKeyword: 'doctors_staff_departments',
    },
    {
      label: 'Staff Directory',
      path: '/hospital/staff',
      icon: <UserCheck className="w-4 h-4" />,
      roles: ['hospital_admin'],
      featureKeyword: 'doctors_staff_departments',
    },
    {
      label: 'Departments',
      path: '/hospital/departments',
      icon: <Layers className="w-4 h-4" />,
      roles: ['hospital_admin'],
      featureKeyword: 'doctors_staff_departments',
    },
    {
      label: 'OPD Rooms',
      path: '/hospital/opd-rooms',
      icon: <Building2 className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'receptionist', 'nurse'],
      featureKeyword: 'opd_rooms',
    },
    {
      label: 'Nurse Dashboard',
      path: '/hospital/nurse/dashboard',
      icon: <Activity className="w-4 h-4 text-emerald-500" />,
      roles: ['hospital_admin', 'nurse'],
      badge: (() => {
        const orders = hospId ? MockStorage.getLabOrders(hospId) : [];
        const pending = orders.filter((o) => o.status === 'Ordered' || o.status === 'Pending Sample' || o.status === 'Doctor Reviewed').length;
        return pending > 0 ? `${pending} Tasks` : undefined;
      })(),
    },
    {
      label: 'Admissions & Beds',
      path: '/hospital/admissions',
      icon: <BedDouble className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'nurse', 'receptionist'],
      badge: (() => {
        const adms = hospId ? MockStorage.getAdmissions(hospId) : MockStorage.getAdmissions();
        const readyCount = adms.filter((a) => a.status === 'Discharge Initiated' && (a.billingStatus === 'Paid' || a.billingStatus === 'Cleared')).length;
        if (readyCount > 0) return `${readyCount} Release Bed`;
        const reqs = hospId ? MockStorage.getAdmissionRequests(hospId) : [];
        const pendingReqs = reqs.filter((r) => r.status === 'Pending').length;
        if (pendingReqs > 0) return `${pendingReqs} Intake`;
        return 'IPD';
      })(),
      featureKeyword: 'admissions_beds',
    },
    {
      label: 'Inpatients Under My Care',
      path: '/hospital/doctor/inpatients',
      icon: <BedDouble className="w-4 h-4 text-teal-400" />,
      roles: ['hospital_admin', 'doctor', 'nurse'],
      badge: 'Nurse Updates',
      featureKeyword: 'admissions_beds',
    },
    {
      label: 'Billing & Invoices',
      path: '/hospital/billing',
      icon: <Receipt className="w-4 h-4" />,
      roles: ['hospital_admin', 'accountant'],
      featureKeyword: 'billing_invoices',
    },
    {
      label: 'Discharge Invoicing',
      path: '/hospital/billing/discharges',
      icon: <FileCheck className="w-4 h-4 text-amber-400" />,
      roles: ['hospital_admin', 'accountant'],
      featureKeyword: 'admissions_beds',
      badge: (() => {
        const adms = hospId ? MockStorage.getAdmissions(hospId) : MockStorage.getAdmissions();
        const pendingCount = adms.filter((a) => a.status === 'Discharge Initiated' && (!a.invoiceId || a.billingStatus !== 'Paid')).length;
        return pendingCount > 0 ? `${pendingCount} Pending` : undefined;
      })(),
    },
    {
      label: 'Pharmacy & Stock',
      path: '/hospital/pharmacy',
      icon: <Pill className="w-4 h-4" />,
      roles: ['hospital_admin', 'pharmacist', 'doctor'],
      featureKeyword: 'pharmacy_stock',
      badge: (() => {
        const meds = hospId ? MockStorage.getMedicines(hospId) : MockStorage.getMedicines();
        const lowStockCount = meds.filter((m) => m.stockQuantity <= (m.minThreshold || 50)).length;
        return lowStockCount > 0 ? `${lowStockCount} Low Stock` : undefined;
      })(),
    },
    {
      label: 'Laboratory Diagnostics',
      path: '/hospital/laboratory',
      icon: <FlaskConical className="w-4 h-4" />,
      roles: ['hospital_admin', 'lab_technician', 'doctor', 'nurse'],
      featureKeyword: 'laboratory_diagnostics',
    },
    {
      label: 'Ambulance & 911 Desk',
      path: '/hospital/ambulance',
      icon: <Ambulance className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'receptionist', 'nurse', 'ambulance_manager', 'ambulance_driver'],
      badge: '911',
      featureKeyword: 'ambulance_emergency',
    },
    {
      label: 'Enterprise Multi-Branch',
      path: '/hospital/enterprise',
      icon: <Network className="w-4 h-4 text-purple-400" />,
      roles: ['hospital_admin'],
      badge: 'Multi-Branch',
      featureKeyword: 'enterprise_multi_branch',
    },
    {
      label: 'Reports & Analytics',
      path: '/hospital/reports',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['hospital_admin', 'accountant', 'doctor'],
      featureKeyword: 'billing_invoices',
    },
    {
      label: 'Patient Testimonials',
      path: '/hospital/testimonials',
      icon: <Star className="w-4 h-4 text-amber-500" />,
      roles: ['hospital_admin'],
      badge: '3D Carousel',
    },
    {
      label: 'Hospital Settings',
      path: '/hospital/settings',
      icon: <Settings className="w-4 h-4" />,
      roles: ['hospital_admin'],
    },
    {
      label: 'Help & Support',
      path: '/hospital/support',
      icon: <HelpCircle className="w-4 h-4 text-sky-500" />,
      roles: ['hospital_admin'],
      badge: (() => {
        const tix = hospId ? MockStorage.getSupportTickets(hospId) : [];
        const openCount = tix.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
        return openCount > 0 ? String(openCount) : undefined;
      })(),
    },
  ];

  const patientNavItems: NavItem[] = [
    { label: 'Health Dashboard', path: '/patient/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-teal-400" /> },
    { label: 'My Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4 text-sky-400" />, featureKeyword: 'appointments_opd' },
    { label: 'Medical Records', path: '/patient/records', icon: <UserPlus className="w-4 h-4 text-indigo-400" />, featureKeyword: 'patients_ehr' },
    { label: 'My Prescriptions', path: '/patient/prescriptions', icon: <Pill className="w-4 h-4 text-emerald-400" /> },
    { label: 'Lab Reports', path: '/patient/lab-reports', icon: <FlaskConical className="w-4 h-4 text-purple-400" />, featureKeyword: 'laboratory_diagnostics' },
    { label: 'Billing & Invoices', path: '/patient/billing', icon: <Receipt className="w-4 h-4 text-amber-400" />, featureKeyword: 'billing_invoices' },
    { label: 'Ambulance Request', path: '/patient/ambulance', icon: <Ambulance className="w-4 h-4 text-rose-400" />, badge: '911', featureKeyword: 'ambulance_emergency' },
    { label: 'My Profile', path: '/patient/profile', icon: <UserCheck className="w-4 h-4 text-cyan-400" /> },
  ];

  const salesNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/sales/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-brand-400" /> },
    { label: 'Demo Requests', path: '/sales/demo-requests', icon: <PhoneCall className="w-4 h-4 text-emerald-400" />, badge: demoRequestsCount > 0 ? `${demoRequestsCount} New` : undefined },
    { label: 'Leads', path: '/sales/leads', icon: <Target className="w-4 h-4 text-sky-400" />, badge: String(MockStorage.getSalesLeads(user?.id).length) },
    { label: 'Follow-ups', path: '/sales/follow-ups', icon: <Clock className="w-4 h-4 text-amber-400" />, badge: String(MockStorage.getLeadFollowUps(user?.id).filter((f) => f.status === 'Pending').length) },
    { label: 'Activities', path: '/sales/activities', icon: <Briefcase className="w-4 h-4 text-indigo-400" /> },
    { label: 'Converted Hospitals', path: '/sales/customers', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, badge: String(MockStorage.getConvertedCustomers(user?.id).length) },
    { label: 'My Profile', path: '/sales/profile', icon: <User className="w-4 h-4 text-teal-400" /> },
  ];

  const driverNavItems: NavItem[] = [
    { label: 'Emergency Console', path: '/driver/dashboard', icon: <Truck className="w-4 h-4 text-rose-400" />, badge: 'LIVE' },
  ];

  const isSubBranchHospital = Boolean(
    currentHospital?.isBranch ||
    currentHospital?.headBranchId ||
    (currentHospital?.organizationId && currentHospital?.isHeadBranch === false)
  );

  const isEnterpriseOrgUser =
    portalType === 'hospital' &&
    user?.role === 'hospital_admin' &&
    !isSubBranchHospital &&
    (Boolean(user?.isOrganizationAdmin) ||
      (currentHospital?.isHeadBranch === true && currentHospital?.planTier === 'enterprise'));

  const enterpriseNavItems: NavItem[] = [
    {
      label: 'Enterprise Health Network',
      path: '/hospital/enterprise-network',
      icon: <Network className="w-4 h-4 text-purple-400" />,
      roles: ['hospital_admin'],
    },
  ];

  const doctorNavItems: NavItem[] = [
    {
      label: 'Doctor Dashboard',
      path: '/hospital/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['doctor'],
    },
    {
      label: 'My Appointments',
      path: '/hospital/doctor/appointments',
      icon: <Calendar className="w-4 h-4" />,
      roles: ['doctor'],
    },
    {
      label: "Today's Patient Queue",
      path: '/hospital/doctor/queue',
      icon: <Clock className="w-4 h-4" />,
      badge: 'Live',
      roles: ['doctor'],
    },
    {
      label: 'Patient & EHR',
      path: '/hospital/patients',
      icon: <UserPlus className="w-4 h-4" />,
      roles: ['doctor'],
      badge: String(patientCount),
      featureKeyword: 'patients_ehr',
    },
    {
      label: 'Consultation Workspace',
      path: '/hospital/consultation',
      icon: <Stethoscope className="w-4 h-4" />,
      roles: ['doctor'],
    },
    {
      label: 'Admissions & Beds',
      path: '/hospital/admissions',
      icon: <BedDouble className="w-4 h-4" />,
      roles: ['doctor'],
      badge: 'IPD',
      featureKeyword: 'admissions_beds',
    },
    {
      label: 'Inpatients Under My Care',
      path: '/hospital/doctor/inpatients',
      icon: <BedDouble className="w-4 h-4 text-teal-400" />,
      roles: ['doctor'],
      badge: 'Nurse Updates',
      featureKeyword: 'admissions_beds',
    },
    {
      label: 'Laboratory Diagnostics',
      path: '/hospital/laboratory',
      icon: <FlaskConical className="w-4 h-4" />,
      roles: ['doctor'],
      featureKeyword: 'laboratory_diagnostics',
    },
    {
      label: 'Ambulance & 911 Desk',
      path: '/hospital/ambulance',
      icon: <Ambulance className="w-4 h-4" />,
      roles: ['doctor'],
      badge: '911',
      featureKeyword: 'ambulance_emergency',
    },
    {
      label: 'Pharmacy & Stock',
      path: '/hospital/pharmacy',
      icon: <Pill className="w-4 h-4" />,
      roles: ['doctor'],
      featureKeyword: 'pharmacy_stock',
    },
    {
      label: 'My Schedule',
      path: '/hospital/doctor/schedule',
      icon: <Calendar className="w-4 h-4" />,
      roles: ['doctor'],
    },
    {
      label: 'My Profile',
      path: '/hospital/doctor/profile',
      icon: <User className="w-4 h-4" />,
      roles: ['doctor'],
    },
  ];

  const pendingLabOrdersCount = hospId
    ? MockStorage.getLabOrders(hospId).filter(
        (o) =>
          o.status === 'Ordered' ||
          o.status === 'Pending Sample' ||
          o.status === 'Sample Collected' ||
          o.status === 'In Progress' ||
          o.status === 'Processing'
      ).length
    : 0;

  const activeCatalogCount = hospId
    ? MockStorage.getLabCatalog(hospId).filter((t) => t.status !== 'inactive').length
    : 0;

  const labTechnicianNavItems: NavItem[] = [
    {
      label: 'Laboratory Dashboard',
      path: '/hospital/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-teal-400" />,
      roles: ['lab_technician'],
    },
    {
      label: 'Diagnostic Work Orders',
      path: '/hospital/laboratory/orders',
      icon: <FlaskConical className="w-4 h-4 text-sky-400" />,
      badge: pendingLabOrdersCount > 0 ? String(pendingLabOrdersCount) : undefined,
      roles: ['lab_technician'],
    },
    {
      label: 'Place Lab Order',
      path: '/hospital/laboratory/new-order',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      roles: ['lab_technician'],
    },
    {
      label: 'Test Catalog',
      path: '/hospital/laboratory/catalog',
      icon: <Tag className="w-4 h-4 text-amber-400" />,
      badge: activeCatalogCount > 0 ? `${activeCatalogCount} Tests` : undefined,
      roles: ['lab_technician'],
    },
  ];

  const nurseNavItems: NavItem[] = [
    {
      label: 'Nurse Dashboard',
      path: '/hospital/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-500" />,
      roles: ['nurse'],
      badge: (() => {
        const orders = hospId ? MockStorage.getLabOrders(hospId) : [];
        const pending = orders.filter((o) => o.status === 'Ordered' || o.status === 'Pending Sample' || o.status === 'Doctor Reviewed').length;
        return pending > 0 ? `${pending} Tasks` : undefined;
      })(),
    },
    {
      label: 'Patients & EHR',
      path: '/hospital/patients',
      icon: <UserPlus className="w-4 h-4" />,
      roles: ['nurse'],
      badge: String(patientCount),
      featureKeyword: 'patients_ehr',
    },
    {
      label: 'Appointments & OPD',
      path: '/hospital/appointments',
      icon: <Calendar className="w-4 h-4" />,
      roles: ['nurse'],
      badge: 'Today',
      featureKeyword: 'appointments_opd',
    },
    {
      label: "Today's Patient Queue",
      path: '/hospital/doctor/queue',
      icon: <Clock className="w-4 h-4" />,
      badge: 'Live',
      roles: ['nurse'],
    },
    {
      label: 'Admissions & Beds',
      path: '/hospital/admissions',
      icon: <BedDouble className="w-4 h-4" />,
      roles: ['nurse'],
      badge: 'IPD',
      featureKeyword: 'admissions_beds',
    },
    {
      label: 'Laboratory Diagnostics',
      path: '/hospital/laboratory',
      icon: <FlaskConical className="w-4 h-4" />,
      roles: ['nurse'],
      featureKeyword: 'laboratory_diagnostics',
    },
    {
      label: 'OPD Rooms',
      path: '/hospital/opd-rooms',
      icon: <Building2 className="w-4 h-4" />,
      roles: ['nurse'],
      featureKeyword: 'opd_rooms',
    },
    {
      label: 'Ambulance & 911 Desk',
      path: '/hospital/ambulance',
      icon: <Ambulance className="w-4 h-4" />,
      roles: ['nurse'],
      badge: '911',
      featureKeyword: 'ambulance_emergency',
    },
  ];

  const pendingPrescriptionsCount = hospId
    ? MockStorage.getPrescriptions(undefined, hospId).filter(
        (p) => p.status !== 'Dispensed' && !p.dispensedAt && p.status !== 'Completed'
      ).length
    : 0;

  const lowStockMedsCount = hospId
    ? MockStorage.getMedicines(hospId).filter((m) => m.stockQuantity <= (m.minThreshold || 25)).length
    : 0;

  const pharmacistNavItems: NavItem[] = [
    {
      label: 'Pharmacist Dashboard',
      path: '/hospital/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" />,
      roles: ['pharmacist'],
    },
    {
      label: 'Prescription Queue',
      path: '/hospital/pharmacy?tab=prescriptions',
      icon: <ClipboardList className="w-4 h-4 text-sky-400" />,
      badge: pendingPrescriptionsCount > 0 ? `${pendingPrescriptionsCount} Pending` : undefined,
      roles: ['pharmacist'],
      featureKeyword: 'pharmacy_stock',
    },
    {
      label: 'Walk-in / OTC POS',
      path: '/hospital/pharmacy?tab=pos',
      icon: <ShoppingCart className="w-4 h-4 text-teal-400" />,
      roles: ['pharmacist'],
      featureKeyword: 'pharmacy_stock',
    },
    {
      label: 'Medicine Stock & Batches',
      path: '/hospital/pharmacy?tab=inventory',
      icon: <Pill className="w-4 h-4 text-indigo-400" />,
      badge: lowStockMedsCount > 0 ? `${lowStockMedsCount} Low` : undefined,
      roles: ['pharmacist'],
      featureKeyword: 'pharmacy_stock',
    },
    {
      label: 'Expiry & Quarantine',
      path: '/hospital/pharmacy?tab=expiry',
      icon: <ShieldAlert className="w-4 h-4 text-purple-400" />,
      roles: ['pharmacist'],
      featureKeyword: 'pharmacy_stock',
    },
    {
      label: 'Dispense Invoices',
      path: '/hospital/pharmacy?tab=invoices',
      icon: <Receipt className="w-4 h-4 text-amber-400" />,
      roles: ['pharmacist'],
      featureKeyword: 'pharmacy_stock',
    },
  ];

  const ambulanceNavItems: NavItem[] = [
    {
      label: 'Ambulance & Emergency',
      path: '/hospital/ambulance',
      icon: <Ambulance className="w-4 h-4 text-rose-400" />,
      badge: '911 LIVE',
      roles: ['ambulance_manager', 'ambulance_driver'],
      featureKeyword: 'ambulance_emergency',
    },
  ];

  const currentNavItems =
    portalType === 'platform'
      ? platformNavItems
      : portalType === 'sales'
      ? salesNavItems
      : portalType === 'patient'
      ? patientNavItems
      : portalType === 'driver'
      ? driverNavItems
      : user?.role === 'doctor'
      ? doctorNavItems
      : user?.role === 'lab_technician'
      ? labTechnicianNavItems
      : user?.role === 'nurse'
      ? nurseNavItems
      : user?.role === 'pharmacist'
      ? pharmacistNavItems
      : user?.role === 'ambulance_manager' || user?.role === 'ambulance_driver'
      ? ambulanceNavItems
      : isEnterpriseOrgUser
      ? hospitalNavItems.filter((item) => item.path !== '/hospital/enterprise')
      : hospitalNavItems;

  const filteredNavItems = currentNavItems.filter((item) => {
    if (!item.roles || !user) return true;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col ${
          portalType === 'platform'
            ? 'bg-[#141212] text-neutral-100 border-r border-[#261e1e]'
            : 'bg-slate-900 text-slate-100 border-r border-slate-800'
        } transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`flex items-center justify-between h-16 px-4 ${portalType === 'platform' ? 'border-b border-[#261e1e]' : 'border-b border-slate-800'} shrink-0`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {portalType === 'hospital' ? (
              (activeHospital?.logoUrl || activeHospital?.image) && !logoImgFailed ? (
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-black/20 shrink-0 overflow-hidden">
                  <img
                    src={activeHospital.logoUrl || activeHospital.image}
                    alt={activeHospital.name || 'Hospital Logo'}
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => setLogoImgFailed(true)}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-900/30 shrink-0 font-bold">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )
            ) : portalType === 'patient' && activeHospital ? (
              (activeHospital?.logoUrl || activeHospital?.image) && !logoImgFailed ? (
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-black/20 shrink-0 overflow-hidden">
                  <img
                    src={activeHospital.logoUrl || activeHospital.image}
                    alt={activeHospital.name || 'Hospital Logo'}
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => setLogoImgFailed(true)}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-900/30 shrink-0">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
              )
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-black/20 shrink-0">
                <img src="/logo.png" alt="Zenelait" className="w-full h-full object-contain" />
              </div>
            )}

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                {portalType === 'hospital' ? (
                  <>
                    <span className="font-extrabold text-base text-white tracking-tight leading-none truncate" title={activeHospital?.name || 'Hospital Portal'}>
                      {activeHospital?.name || 'Hospital Portal'}
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-brand-400 uppercase truncate mt-1">
                      {activeHospital?.type || (activeHospital?.city ? `${activeHospital.city} Portal` : 'Hospital Portal')}
                    </span>
                  </>
                ) : portalType === 'platform' ? (
                  <>
                    <span className="font-extrabold text-base text-white tracking-tight leading-none truncate">
                      Zenelait
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-[#FF3030] font-bold uppercase truncate mt-1">
                      Platform HQ
                    </span>
                  </>
                ) : portalType === 'sales' ? (
                  <>
                    <span className="font-extrabold text-base text-white tracking-tight leading-none truncate">
                      Zenelait
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-brand-400 uppercase truncate mt-1">
                      Sales Executive Portal
                    </span>
                  </>
                ) : portalType === 'patient' ? (
                  <>
                    <span className="font-extrabold text-base text-white tracking-tight leading-none truncate" title={activeHospital?.name || 'Zenelait Health'}>
                      {activeHospital?.name || 'Zenelait Health'}
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-teal-400 uppercase truncate mt-1">
                      Patient Health Portal
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-extrabold text-base text-white tracking-tight leading-none truncate" title={activeHospital?.name || 'Emergency Fleet'}>
                      {activeHospital?.name || 'Emergency Desk'}
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-rose-400 uppercase truncate mt-1">
                      Ambulance Dispatch
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md ${
              portalType === 'platform'
                ? 'bg-[#221a1a] text-neutral-400 hover:text-white hover:bg-[#302020] hover:border hover:border-[#FF3030]/40'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            } transition-colors`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Enterprise Health Network Menu for Network Admins */}
          {isEnterpriseOrgUser && (
            <div className="space-y-1 mb-4 pb-3 border-b border-slate-800/80">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Enterprise Network</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    NETWORK
                  </span>
                </div>
              )}
              {enterpriseNavItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith('/hospital/enterprise');

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive: linkActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                        isActive || linkActive
                          ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div
                      className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.icon}
                    </div>
                    {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          )}

          {!isCollapsed && (
            <div className={`px-3 py-1 text-[11px] font-bold ${portalType === 'platform' ? 'text-[#FF3030] flex items-center justify-between' : 'text-slate-400'} uppercase tracking-wider`}>
              {portalType === 'platform' ? (
                <>
                  <span>SaaS Administration</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3030] animate-pulse"></span>
                </>
              ) : portalType === 'patient'
                ? 'Patient Personal Care'
                : isEnterpriseOrgUser
                ? `Branch Operations (${currentHospital?.branchCode || currentHospital?.city || 'Chennai'})`
                : 'Clinical & Operations'}
            </div>
          )}

          {filteredNavItems.map((item) => {
            const itemPathOnly = item.path.split('?')[0];
            const itemQuery = item.path.includes('?') ? item.path.split('?')[1] : '';
            const isActive = item.path.includes('?')
              ? location.pathname === itemPathOnly && (location.search.includes(itemQuery) || (!location.search && itemQuery === 'tab=nurse_updates'))
              : (location.pathname === item.path && !location.search) ||
                (item.path !== '/hospital/dashboard' &&
                  !item.path.includes('?') &&
                  location.pathname.startsWith(item.path));
            const isFeatureDisabled =
              (portalType === 'hospital' || portalType === 'patient') &&
              item.featureKeyword &&
              !MockStorage.isFeatureEnabledForHospital(hospId, item.featureKeyword);

            const accessCheck = isFeatureDisabled
              ? MockStorage.checkPathAccess(hospId, item.path)
              : null;
            const requiredPackage = accessCheck?.requiredTierName || 'Professional Hospital';
            const upgradeMessage = `Upgrade to ${requiredPackage} package to access`;

            const isItemActive = item.path.includes('?')
              ? `${location.pathname}${location.search}` === item.path
              : location.pathname === item.path && (!location.search || !location.search.includes('tab='));

            return (
              <NavLink
                key={item.path}
                to={isFeatureDisabled ? '#' : item.path}
                onClick={(e) => {
                  if (isFeatureDisabled) {
                    e.preventDefault();
                    showToast(
                      'Upgrade Required',
                      `The feature "${item.label}" is locked. ${upgradeMessage}.`,
                      'warning'
                    );
                    return;
                  }
                  onCloseMobile();
                }}
                className={({ isActive }) => {
                  const active = isItemActive || (isActive && !item.path.includes('?') && !location.search.includes('tab='));
                  return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                    isFeatureDisabled
                      ? 'text-slate-500 opacity-60 bg-slate-900/40 cursor-not-allowed border border-slate-800/40 hover:opacity-100 hover:border-amber-500/30'
                      : active
                      ? (portalType === 'platform' ? 'bg-[#FF3030] text-white font-semibold shadow-md shadow-[#FF3030]/30' : 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30')
                      : (portalType === 'platform' ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-l-2 hover:border-[#FF3030]' : 'text-slate-300 hover:text-white hover:bg-slate-800/80')
                  } ${isCollapsed ? 'justify-center px-0' : ''}`;
                }}
                title={isFeatureDisabled ? upgradeMessage : isCollapsed ? item.label : undefined}
              >
                <div
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isFeatureDisabled
                      ? 'text-slate-600 group-hover:text-amber-400'
                      : (isItemActive || (!item.path.includes('?') && location.pathname === item.path && !location.search.includes('tab=')))
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {isFeatureDisabled ? <Lock className="w-4 h-4 text-rose-400 group-hover:text-amber-400 transition-colors" /> : item.icon}
                </div>

                {!isCollapsed && (
                  <>
                    <span className={`truncate flex-1 ${isFeatureDisabled ? 'line-through text-slate-500 font-normal group-hover:text-slate-300' : ''}`}>
                      {item.label}
                    </span>
                    {isFeatureDisabled ? (
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 group-hover:bg-amber-500/20 group-hover:text-amber-300 group-hover:border-amber-500/40 transition-colors">
                        Locked
                      </span>
                    ) : (
                      item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : portalType === 'platform'
                              ? 'bg-[#FF3030]/15 text-[#FF3030] border border-[#FF3030]/25'
                              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )
                    )}
                  </>
                )}

                {/* Floating Upgrade Tooltip on Hover for Locked Menu Item (Expanded Mode) */}
                {!isCollapsed && isFeatureDisabled && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-amber-300 text-xs font-semibold rounded-lg shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 border border-amber-500/40 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{upgradeMessage}</span>
                  </div>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
                    {isFeatureDisabled ? (
                      <span className="text-amber-300 flex items-center gap-1.5 font-medium">
                        <Lock className="w-3 h-3 text-amber-400" />
                        {item.label}: {upgradeMessage}
                      </span>
                    ) : (
                      item.label
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Tenant Environment Indicator Footer */}
        <div className={`p-3 ${portalType === 'platform' ? 'border-t border-[#261e1e]' : 'border-t border-slate-800'} shrink-0`}>
          {!isCollapsed ? (
            portalType === 'platform' ? (
              <div className="p-3 rounded-xl bg-[#1d1616] border border-[#382222] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF3030]/15 border border-[#FF3030]/30 text-[#FF3030] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#FF3030]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF3030] animate-pulse"></span>
                    <p className="text-xs font-semibold text-neutral-200 truncate">Multi-Tenant v2.4</p>
                  </div>
                  <p className="text-[10px] text-neutral-400 truncate">HIPAA & HL7 Compliant</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <p className="text-xs font-semibold text-slate-200 truncate">Multi-Tenant v2.4</p>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">HIPAA & HL7 Compliant</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex justify-center" title="Multi-Tenant v2.4 • Active">
              <span className={`w-2.5 h-2.5 rounded-full ${portalType === 'platform' ? 'bg-[#FF3030]' : 'bg-emerald-500'} animate-pulse`}></span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
