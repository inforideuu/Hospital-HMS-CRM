import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  BellOff,
  CheckCircle2,
  Building2,
  Shield,
  LogOut,
  ChevronDown,
  User as UserIcon,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Command,
  Ambulance,
  HeartPulse,
  ChevronRight,
  Home,
  Check,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  AlertTriangle,
  AlertCircle,
  Info,
  RotateCcw,
  X,
  Wrench,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatNotificationTime } from '../../utils/roleNotifications';
import { MockStorage } from '../../services/mockStorage';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  portalType: 'platform' | 'sales' | 'hospital' | 'patient' | 'driver';
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, portalType }) => {
  const { user, currentHospital, logout, switchHospital } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHospSwitcherOpen, setIsHospSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(() => MockStorage.getPlatformSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setPlatformSettings(MockStorage.getPlatformSettings());
    };
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const allHospitals = MockStorage.getHospitals();
  const hospitals = allHospitals.filter((h) => {
    if (user?.role === 'super_admin' || user?.role === 'super_admin_manager') return true;
    if (user?.isOrganizationAdmin && user?.organizationId) {
      return h.organizationId === user.organizationId || (user.permittedBranchIds && user.permittedBranchIds.includes(h.id));
    }
    return h.id === user?.hospitalId;
  });

  const canSwitchHospitals =
    Boolean(user?.role === 'super_admin' || user?.role === 'super_admin_manager' || user?.isOrganizationAdmin) &&
    hospitals.length > 1;

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const hospRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (hospRef.current && !hospRef.current.contains(e.target as Node)) {
        setIsHospSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut ⌘K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHospitalSelect = (hospId: string) => {
    switchHospital(hospId);
    setIsHospSwitcherOpen(false);
  };

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    removeNotification,
    soundEnabled,
    toggleSound,
    resetRoleNotifications,
  } = useNotification();

  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');

  const displayedNotifications = notifTab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const getNotificationPortalTitle = () => {
    if (portalType === 'platform') return 'Platform Alerts';
    if (portalType === 'sales') return 'Sales Pipeline Alerts';
    if (user?.role === 'doctor') return 'Doctor Clinical Alerts';
    if (user?.role === 'nurse') return 'Ward & Patient Alerts';
    if (user?.role === 'receptionist') return 'Front Desk Alerts';
    if (user?.role === 'pharmacist') return 'Pharmacy Orders';
    if (user?.role === 'lab_technician') return 'Diagnostic Lab Alerts';
    if (user?.role === 'accountant') return 'Billing & Settlement Alerts';
    if (user?.role === 'patient') return 'Patient Care Updates';
    if (user?.role === 'ambulance_driver' || user?.role === 'ambulance_manager') return '911 Fleet Emergency Alerts';
    return 'Hospital Notifications';
  };

  // Generate dynamic breadcrumbs based on route
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (portalType === 'platform') {
      if (path.includes('/hospitals/')) {
        return [
          { label: 'Platform HQ', href: '/platform/dashboard' },
          { label: 'Hospital Network', href: '/platform/hospitals' },
          { label: 'Hospital Details' },
        ];
      }
      if (path.includes('/hospitals')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Hospital Management' }];
      }
      if (path.includes('/subscriptions')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Subscriptions & Plans' }];
      }
      if (path.includes('/users')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Users & Access' }];
      }
      if (path.includes('/websites')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Hospital Website Builder' }];
      }
      if (path.includes('/ambulance')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Ambulance & 911 Fleet' }];
      }
      if (path.includes('/support')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Support Center' }];
      }
      if (path.includes('/reports')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Reports & Analytics' }];
      }
      if (path.includes('/settings')) {
        return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Platform Settings' }];
      }
      return [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Super Admin Dashboard' }];
    }
    if (path.includes('/nurse/dashboard') || (path === '/hospital/dashboard' && user?.role === 'nurse')) {
      return [{ label: 'HMS Workspace', href: '/hospital/dashboard' }, { label: 'Nurse Dashboard' }];
    }
    if (path.includes('/doctor/dashboard') || (path === '/hospital/dashboard' && user?.role === 'doctor')) {
      return [{ label: 'HMS Workspace', href: '/hospital/dashboard' }, { label: 'Doctor Dashboard' }];
    }
    if (path.includes('/laboratory/dashboard') || (path === '/hospital/dashboard' && user?.role === 'lab_technician')) {
      return [{ label: 'HMS Workspace', href: '/hospital/dashboard' }, { label: 'Laboratory Dashboard' }];
    }
    if (path.includes('/pharmacist/dashboard') || (path === '/hospital/dashboard' && user?.role === 'pharmacist')) {
      return [{ label: 'HMS Workspace', href: '/hospital/dashboard' }, { label: 'Pharmacist Dashboard' }];
    }
    return [{ label: 'HMS Workspace', href: '/hospital/dashboard' }, { label: 'Operations' }];
  };

  const getUserRoleLabel = () => {
    if (!user) return 'Staff';
    switch (user.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'super_admin_manager':
      case 'superadmin_manager':
        return 'Operations Manager';
      case 'sales_executive':
        return 'Sales Executive';
      case 'hospital_admin':
        return 'Hospital Admin';
      case 'doctor':
        return 'Doctor';
      case 'nurse':
        return 'Staff Nurse';
      case 'receptionist':
        return 'Receptionist';
      case 'pharmacist':
        return 'Pharmacist';
      case 'lab_technician':
        return 'Lab Technician';
      case 'accountant':
        return 'Billing Accountant';
      case 'ambulance_driver':
        return 'Ambulance Driver';
      case 'ambulance_manager':
        return 'EMS Dispatcher';
      case 'patient':
        return 'Patient';
      default:
        return 'Staff';
    }
  };

  const getUserBadgeLabel = () => {
    if (portalType === 'platform' || user?.portal === 'platform') {
      return user?.role === 'sales_executive' ? 'Sales Team' : 'Platform HQ Admin';
    }
    if (portalType === 'sales') return 'Sales Workspace';
    if (portalType === 'patient') return 'Patient Portal';
    if (portalType === 'driver') return 'EMS Emergency Fleet';
    return user?.role === 'hospital_admin' ? 'Hospital Administration' : 'Hospital Clinical Staff';
  };

  const getProfileSettingsPath = () => {
    if (portalType === 'platform') return '/platform/settings';
    if (portalType === 'sales') return '/sales/profile';
    if (portalType === 'patient') return '/patient/profile';
    if (portalType === 'driver') return '/driver/dashboard';
    return '/hospital/settings';
  };

  const getProfileSupportPath = () => {
    if (portalType === 'platform') return '/platform/support';
    return '/hospital/support';
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="sticky top-0 z-30 flex flex-col w-full">
      {/* 1. Global Platform Maintenance Mode Warning (Super Admin Portal View) */}
      {platformSettings.maintenanceMode && (user?.role === 'super_admin' || user?.role === 'super_admin_manager') && (
        <div className="bg-amber-600 text-white px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs border-b border-amber-700">
          <div className="flex items-center gap-2 truncate">
            <Wrench className="w-4 h-4 text-amber-200 shrink-0 animate-bounce" />
            <span className="font-bold tracking-wide uppercase text-[11px] bg-black/30 px-2 py-0.5 rounded">
              Platform Maintenance Active
            </span>
            <span className="hidden sm:inline text-amber-100 truncate text-[11px]">
              Normal hospital staff & patient logins are temporarily paused. Only Super Admins have administrative system access.
            </span>
          </div>
          <Link
            to="/platform/settings"
            className="shrink-0 px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-white text-[11px] font-bold transition-colors"
          >
            Manage in Settings
          </Link>
        </div>
      )}

      {/* 2. Global Tenant Broadcast Announcement Banner */}
      {platformSettings.broadcastBannerActive && platformSettings.broadcastBannerText && (
        <div
          className={`px-4 sm:px-6 py-2 text-xs flex items-center justify-between gap-3 shadow-xs border-b transition-all ${
            platformSettings.broadcastBannerLevel === 'critical'
              ? 'bg-rose-600 text-white border-rose-700'
              : platformSettings.broadcastBannerLevel === 'warning'
              ? 'bg-amber-500 text-slate-950 border-amber-600'
              : 'bg-blue-600 text-white border-blue-700'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {platformSettings.broadcastBannerLevel === 'critical' ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0 animate-pulse" />
            ) : platformSettings.broadcastBannerLevel === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
            ) : (
              <Megaphone className="w-4 h-4 text-blue-100 shrink-0" />
            )}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider shrink-0 ${
                platformSettings.broadcastBannerLevel === 'critical'
                  ? 'bg-black/40 text-white'
                  : platformSettings.broadcastBannerLevel === 'warning'
                  ? 'bg-black/20 text-slate-950'
                  : 'bg-white/20 text-white'
              }`}
            >
              {platformSettings.broadcastBannerLevel === 'critical'
                ? 'CRITICAL ALERT'
                : platformSettings.broadcastBannerLevel === 'warning'
                ? 'SYSTEM WARNING'
                : 'ANNOUNCEMENT'}
            </span>
            <span className="font-semibold text-xs truncate">
              {platformSettings.broadcastBannerText}
            </span>
          </div>
        </div>
      )}

      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left Section: Mobile Menu & Breadcrumb Navigation */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden text-slate-500 hover:text-slate-800 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Platform Breadcrumb Trail */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
          <Link
            to={portalType === 'platform' ? '/platform/dashboard' : '/hospital/dashboard'}
            className="flex items-center gap-1 hover:text-brand-600 text-slate-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-brand-600 text-slate-600 transition-colors truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-900 truncate">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Hospital Switcher (For Hospital Portal Only) */}
        {portalType === 'hospital' && currentHospital && (
          canSwitchHospitals ? (
            <div className="relative" ref={hospRef}>
              <button
                onClick={() => setIsHospSwitcherOpen(!isHospSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-800 transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">{currentHospital.name}</span>
                {currentHospital.isHeadBranch && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    Head Branch
                  </span>
                )}
                {currentHospital.isBranch && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 shrink-0">
                    Sub-Branch
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isHospSwitcherOpen && (
                <div className="absolute left-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {user?.isOrganizationAdmin ? 'Network Branch Switcher' : 'Switch Hospital Workspace'}
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {hospitals.map((hosp) => (
                      <button
                        key={hosp.id}
                        onClick={() => handleHospitalSelect(hosp.id)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          currentHospital.id === hosp.id ? 'bg-brand-50/70 text-brand-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium">{hosp.name}</p>
                            {hosp.isHeadBranch && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                Head Branch
                              </span>
                            )}
                            {hosp.isBranch && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300 shrink-0">
                                Sub-Branch
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{hosp.city}, {hosp.state} • {hosp.branchCode || hosp.type}</p>
                        </div>
                        {currentHospital.id === hosp.id && (
                          <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">{currentHospital.name}</span>
              {currentHospital.isHeadBranch && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  Head Branch
                </span>
              )}
              {currentHospital.isBranch && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 shrink-0">
                  Sub-Branch
                </span>
              )}
            </div>
          )
        )}
      </div>

      {/* Center / Right Section: Global Search, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative hidden md:block">
          <div className="relative w-64 lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospitals, subscriptions, logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchModalOpen(true)}
              className="w-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-xl pl-9 pr-9 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-xs"
            />
            <kbd className="hidden lg:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Super Admin Status Badge */}
        {portalType === 'platform' && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF3030]/10 border border-[#FF3030]/30 text-[#FF3030] text-xs font-semibold shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-[#FF3030]" />
            <span>Super Admin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3030] animate-pulse ml-0.5"></span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-75">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {getNotificationPortalTitle()}
                  </span>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                      All Read
                    </span>
                  )}
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1">
                  {/* Sound Toggle */}
                  <button
                    onClick={toggleSound}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      soundEnabled ? 'text-brand-600 hover:bg-brand-50' : 'text-slate-400 hover:bg-slate-200/60'
                    }`}
                    title={soundEnabled ? 'Alert Sound ON (Click to Mute)' : 'Alert Sound MUTED (Click to Enable)'}
                    aria-label="Toggle alert sound"
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {/* Mark All Read */}
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Mark all as read"
                    aria-label="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>

                  {/* Clear All */}
                  <button
                    onClick={clearAllNotifications}
                    disabled={notifications.length === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Clear all notifications"
                    aria-label="Clear all notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center border-b border-slate-100 px-3 py-1.5 bg-slate-50/40 text-xs gap-2">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                    notifTab === 'all'
                      ? 'bg-white shadow-xs text-brand-700 border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('unread')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                    notifTab === 'unread'
                      ? 'bg-white shadow-xs text-brand-700 border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notification Items List */}
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {displayedNotifications.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <BellOff className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No {notifTab === 'unread' ? 'unread ' : ''}notifications</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      All caught up! Real-time alerts will appear dynamically as hospital workflows and clinical activities occur.
                    </p>
                  </div>
                ) : (
                  displayedNotifications.map((n) => {
                    const icons = {
                      emergency: (
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 animate-pulse border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      ),
                      error: (
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      ),
                      warning: (
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      ),
                      success: (
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ),
                      info: (
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                      ),
                    };

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) markAsRead(n.id);
                          if (n.link) {
                            navigate(n.link);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-3 text-xs flex items-start gap-3 transition-colors cursor-pointer group ${
                          !n.read
                            ? 'bg-brand-50/25 hover:bg-brand-50/50 border-l-2 border-brand-500'
                            : 'hover:bg-slate-50 bg-white opacity-85 hover:opacity-100'
                        }`}
                      >
                        {icons[n.type] || icons.info}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`font-semibold truncate ${!n.read ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                            {n.category && (
                              <span className="px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 uppercase tracking-wider text-[9px]">
                                {n.category}
                              </span>
                            )}
                            <span>{formatNotificationTime(n.timestamp)}</span>
                          </div>
                        </div>

                        {/* Row Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                          {!n.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(n.id);
                            }}
                            className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                            title="Dismiss notification"
                            aria-label="Dismiss notification"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-500">
                <span className="capitalize">
                  Role: <strong className="text-slate-700 font-semibold">{user?.role?.replace(/_/g, ' ') || 'User'}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  {soundEnabled ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                      <Volume2 className="w-3 h-3" /> Sound On
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-0.5">
                      <VolumeX className="w-3 h-3" /> Sound Muted
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-xl ${portalType === 'platform' ? 'bg-[#FF3030] shadow-[#FF3030]/20' : 'bg-gradient-to-tr from-brand-600 to-indigo-600'} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">{user?.name || (portalType === 'platform' ? 'Platform Admin' : 'User')}</p>
              <p className="text-[10px] text-slate-500 font-medium">{getUserRoleLabel()}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900">{user?.name || (portalType === 'platform' ? 'Platform Admin' : 'User')}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email || (portalType === 'platform' ? 'superadmin@zenelait.com' : 'admin@hospital.com')}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md ${portalType === 'platform' ? 'bg-[#FF3030]/10 text-[#FF3030] border border-[#FF3030]/20 font-bold' : 'bg-brand-50 text-brand-700'} text-[10px] font-bold uppercase tracking-wider`}>
                  {getUserBadgeLabel()}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate(getProfileSettingsPath());
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Account & Security Settings
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate(getProfileSupportPath());
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Support Center & Docs
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    const isPlatformOrSales =
                      portalType === 'platform' ||
                      portalType === 'sales' ||
                      user?.portal === 'platform' ||
                      user?.portal === 'sales' ||
                      user?.role === 'super_admin' ||
                      user?.role === 'super_admin_manager' ||
                      user?.role === 'sales_executive';

                    const targetHospitalId =
                      user?.hospitalId ||
                      currentHospital?.id ||
                      (typeof window !== 'undefined' && window.sessionStorage
                        ? sessionStorage.getItem('pulse_active_hospital_target')
                        : null);

                    logout();

                    if (isPlatformOrSales) {
                      navigate('/superadmin-login', { replace: true });
                    } else if (targetHospitalId) {
                      navigate(`/login?targetHospital=${encodeURIComponent(targetHospitalId)}`, { replace: true });
                    } else {
                      navigate('/login', { replace: true });
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Command Search Modal */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search hospitals, subscriptions, users, settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs hover:bg-slate-200 font-medium"
              >
                ESC
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-1 text-xs">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Navigation
              </div>
              <button
                onClick={() => {
                  navigate('/platform/hospitals');
                  setIsSearchModalOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span className="font-semibold">Hospital Management & Network</span>
                </div>
                <span className="text-slate-400 text-[11px]">4 Active</span>
              </button>

              <button
                onClick={() => {
                  navigate('/platform/subscriptions');
                  setIsSearchModalOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <HeartPulse className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold">Subscriptions & Plans</span>
                </div>
                <span className="text-slate-400 text-[11px]">MRR $35,880</span>
              </button>

              <button
                onClick={() => {
                  navigate('/platform/ambulance');
                  setIsSearchModalOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Ambulance className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold">Ambulance & 911 Fleet Overview</span>
                </div>
                <span className="text-slate-400 text-[11px]">6 Units</span>
              </button>

              <button
                onClick={() => {
                  navigate('/platform/reports');
                  setIsSearchModalOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Reports & Analytics Engine</span>
                </div>
                <span className="text-slate-400 text-[11px]">Analytics</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
    </div>
  );
};

export default Topbar;
