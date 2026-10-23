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
  const patientCount = hospId ? MockStorage.getPatients(hospId).length : MockStorage.getPatients().length;

  const pendingOnboardCount = MockStorage.getConvertedCustomers().filter(
    (c) => c.onboardingStatus === 'Pending Onboarding' || c.subscriptionStatus === 'Pending Setup'
  ).length;

  const activeTicketCount = MockStorage.getSupportTickets().filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  const platformNavItems: NavItem[] = [
    { label: 'Overview', path: '/platform/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Hospital Management', path: '/platform/hospitals', icon: <Building2 className="w-4 h-4" />, badge: String(MockStorage.getHospitals().length), roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Pending Onboarding', path: '/platform/pending-onboarding', icon: <UserCheck className="w-4 h-4 text-amber-500" />, badge: pendingOnboardCount > 0 ? String(pendingOnboardCount) : undefined, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Subscriptions & Plans', path: '/platform/subscriptions', icon: <CreditCard className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Users & Access', path: '/platform/users', icon: <Users className="w-4 h-4" />, roles: ['super_admin'] },
    { label: 'Hospital Website Builder', path: '/platform/websites', icon: <Globe className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Support Center', path: '/platform/support', icon: <HelpCircle className="w-4 h-4" />, badge: activeTicketCount > 0 ? String(activeTicketCount) : undefined, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Reports & Analytics', path: '/platform/reports', icon: <BarChart3 className="w-4 h-4" />, roles: ['super_admin', 'super_admin_manager'] },
    { label: 'Platform Settings', path: '/platform/settings', icon: <Settings className="w-4 h-4" />, roles: ['super_admin'] },
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
      label: 'Admissions & Beds',
      path: '/hospital/admissions',
      icon: <BedDouble className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'nurse', 'receptionist'],
      badge: 'IPD',
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
      roles: ['hospital_admin', 'lab_technician', 'doctor'],
      featureKeyword: 'laboratory_diagnostics',
    },
    {
      label: 'Ambulance & 911 Desk',
      path: '/hospital/ambulance',
      icon: <Ambulance className="w-4 h-4" />,
      roles: ['hospital_admin', 'doctor', 'receptionist', 'nurse'],
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
      label: 'Hospital Settings',
      path: '/hospital/settings',
      icon: <Settings className="w-4 h-4" />,
      roles: ['hospital_admin'],
    },
  ];

  const patientNavItems: NavItem[] = [
    { label: 'Health Dashboard', path: '/patient/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-teal-400" /> },
    { label: 'My Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4 text-sky-400" /> },
    { label: 'Medical Records', path: '/patient/records', icon: <UserPlus className="w-4 h-4 text-indigo-400" /> },
    { label: 'My Prescriptions', path: '/patient/prescriptions', icon: <Pill className="w-4 h-4 text-emerald-400" /> },
    { label: 'Lab Reports', path: '/patient/lab-reports', icon: <FlaskConical className="w-4 h-4 text-purple-400" /> },
    { label: 'Billing & Invoices', path: '/patient/billing', icon: <Receipt className="w-4 h-4 text-amber-400" /> },
    { label: 'Ambulance Request', path: '/patient/ambulance', icon: <Ambulance className="w-4 h-4 text-rose-400" />, badge: '911' },
    { label: 'My Profile', path: '/patient/profile', icon: <UserCheck className="w-4 h-4 text-cyan-400" /> },
  ];

  const salesNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/sales/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-brand-400" /> },
    { label: 'Leads', path: '/sales/leads', icon: <Target className="w-4 h-4 text-sky-400" />, badge: String(MockStorage.getSalesLeads(user?.id).length) },
    { label: 'Follow-ups', path: '/sales/follow-ups', icon: <Clock className="w-4 h-4 text-amber-400" />, badge: String(MockStorage.getLeadFollowUps(user?.id).filter((f) => f.status === 'Pending').length) },
    { label: 'Activities', path: '/sales/activities', icon: <Briefcase className="w-4 h-4 text-indigo-400" /> },
    { label: 'Converted Hospitals', path: '/sales/customers', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, badge: String(MockStorage.getConvertedCustomers(user?.id).length) },
    { label: 'My Profile', path: '/sales/profile', icon: <User className="w-4 h-4 text-teal-400" /> },
  ];

  const driverNavItems: NavItem[] = [
    { label: 'Emergency Console', path: '/driver/dashboard', icon: <Truck className="w-4 h-4 text-rose-400" />, badge: 'LIVE' },
  ];

  const isEnterpriseOrgUser =
    portalType === 'hospital' &&
    user?.role === 'hospital_admin' &&
    (Boolean(user?.isOrganizationAdmin) ||
      Boolean(currentHospital?.organizationId && currentHospital?.planTier === 'enterprise'));

  const enterpriseNavItems: NavItem[] = [
    {
      label: 'Enterprise Dashboard',
      path: '/hospital/enterprise/dashboard',
      icon: <Network className="w-4 h-4 text-purple-400" />,
      roles: ['hospital_admin'],
    },
    {
      label: 'Organization Profile',
      path: '/hospital/enterprise/profile',
      icon: <Building2 className="w-4 h-4 text-indigo-400" />,
      roles: ['hospital_admin'],
    },
    {
      label: 'Branch Management',
      path: '/hospital/enterprise/branches',
      icon: <GitBranch className="w-4 h-4 text-teal-400" />,
      roles: ['hospital_admin'],
    },
    {
      label: 'Branch Admin Management',
      path: '/hospital/enterprise/branch-admins',
      icon: <Users className="w-4 h-4 text-brand-400" />,
      roles: ['hospital_admin'],
    },
    {
      label: 'Consolidated Reports',
      path: '/hospital/enterprise/reports',
      icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
      roles: ['hospital_admin'],
    },
    {
      label: 'Organization Settings',
      path: '/hospital/enterprise/settings',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      roles: ['hospital_admin'],
    },
    {
      label: 'Subscription Details',
      path: '/hospital/enterprise/subscription',
      icon: <CreditCard className="w-4 h-4 text-amber-400" />,
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 shrink-0">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base text-white tracking-tight leading-none truncate">
                  PulseCore
                </span>
                <span className="text-[10px] font-mono tracking-wider text-brand-400 uppercase truncate mt-1">
                  {portalType === 'platform' ? 'Platform HQ' : portalType === 'sales' ? 'Sales Executive Portal' : portalType === 'patient' ? 'Patient Health Portal' : currentHospital?.name || 'HMS Workspace'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Step 4: Enterprise Health Network 7 Navigation Items for Org Admins */}
          {isEnterpriseOrgUser && (
            <div className="space-y-1 mb-4 pb-3 border-b border-slate-800/80">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Enterprise Organization</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    GROUP
                  </span>
                </div>
              )}
              {enterpriseNavItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/hospital/enterprise/dashboard' && location.pathname === '/hospital/enterprise');

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
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {portalType === 'platform'
                ? 'SaaS Administration'
                : portalType === 'patient'
                ? 'Patient Personal Care'
                : isEnterpriseOrgUser
                ? `Branch Operations (${currentHospital?.branchCode || currentHospital?.city || 'Chennai'})`
                : 'Clinical & Operations'}
            </div>
          )}

          {filteredNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const isFeatureDisabled =
              portalType === 'hospital' &&
              item.featureKeyword &&
              !MockStorage.isFeatureEnabledForHospital(hospId, item.featureKeyword);

            const accessCheck = isFeatureDisabled
              ? MockStorage.checkPathAccess(hospId, item.path)
              : null;
            const requiredPackage = accessCheck?.requiredTierName || 'Professional Hospital';
            const upgradeMessage = `Upgrade to ${requiredPackage} package to access`;

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
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                    isFeatureDisabled
                      ? 'text-slate-500 opacity-60 bg-slate-900/40 cursor-not-allowed border border-slate-800/40 hover:opacity-100 hover:border-amber-500/30'
                      : isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isFeatureDisabled ? upgradeMessage : isCollapsed ? item.label : undefined}
              >
                <div
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isFeatureDisabled ? 'text-slate-600 group-hover:text-amber-400' : isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
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
        <div className="p-3 border-t border-slate-800 shrink-0">
          {!isCollapsed ? (
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
          ) : (
            <div className="flex justify-center" title="Multi-Tenant v2.4 • Active">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
