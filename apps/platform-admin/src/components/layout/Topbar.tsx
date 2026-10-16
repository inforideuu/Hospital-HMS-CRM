import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
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
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MockStorage } from '../../services/mockStorage';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  portalType: 'platform' | 'hospital';
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

  const hospitals = MockStorage.getHospitals();

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

  const notifications = [
    { id: 1, title: 'Emergency 911 Call', desc: 'Unit NY-EMRG-889 dispatched for cardiac alert', time: '5m ago', unread: true },
    { id: 2, title: 'New Hospital Application', desc: 'Pacific Crest Health submitted onboarding documents', time: '18m ago', unread: true },
    { id: 3, title: 'Subscription Renewed', desc: 'Apex City Medical Center enterprise renewal settled ($1,799/mo)', time: '1h ago', unread: false },
    { id: 4, title: 'Security Audit Passed', desc: 'Quarterly HIPAA & SOC-2 compliance check verified', time: '3h ago', unread: false },
  ];

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
    return [{ label: 'HMS Workspace', href: '/hospital/dashboard' }, { label: 'Operations' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
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
          <div className="relative" ref={hospRef}>
            <button
              onClick={() => setIsHospSwitcherOpen(!isHospSwitcherOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-800 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">{currentHospital.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isHospSwitcherOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Hospital Workspace</p>
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
                        <p className="truncate font-medium">{hosp.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{hosp.city}, {hosp.state} • {hosp.type}</p>
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
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-brand-600" />
            <span>Super Admin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-900">Platform Notifications</span>
                <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold">2 New</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 text-xs hover:bg-slate-50 transition-colors ${n.unread ? 'bg-brand-50/20' : ''}`}>
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">{user?.name || 'Alexander Vance'}</p>
              <p className="text-[10px] text-slate-500 font-medium">Super Admin</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900">{user?.name || 'Alexander Vance'}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email || 'superadmin@pulsecore.io'}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider">
                  Platform HQ Admin
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/platform/settings');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Account & Security Settings
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/platform/support');
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
                    const isPlatform =
                      portalType === 'platform' ||
                      user?.portal === 'platform' ||
                      user?.role === 'super_admin' ||
                      user?.role === 'super_admin_manager';
                    logout();
                    navigate(isPlatform ? '/superadmin-login' : '/login');
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
                  navigate('/platform/websites');
                  setIsSearchModalOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold">Hospital Website Builder</span>
                </div>
                <span className="text-slate-400 text-[11px]">4 Websites</span>
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
  );
};

export default Topbar;
