import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useParams } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  User,
  ShieldAlert,
  Building2,
  Wrench,
  Megaphone,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole, PortalType, User as AuthUser } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MockStorage } from '../../services/mockStorage';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const { hospitalSlug } = useParams<{ hospitalSlug?: string }>();
  const [searchParams] = useSearchParams();

  const hospitals = MockStorage.getHospitals();
  const rawTarget = searchParams.get('targetHospital') || hospitalSlug;
  const initialHospitalId = rawTarget;
  const targetHospital = rawTarget
    ? hospitals.find(
        (h) =>
          h.id.toLowerCase() === rawTarget.toLowerCase() ||
          (h.slug && h.slug.toLowerCase() === rawTarget.toLowerCase()) ||
          (h.branchCode && h.branchCode.toLowerCase() === rawTarget.toLowerCase()) ||
          (rawTarget === 'hosp-1' && h.id === 'HOSP-001') ||
          (rawTarget === 'HOSP-001' && h.id === 'HOSP-001')
      ) || MockStorage.getHospitalById(rawTarget)
    : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchedAccounts, setMatchedAccounts] = useState<AuthUser[] | null>(null);
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

  useEffect(() => {
    if (rawTarget && typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('pulse_active_hospital_target', rawTarget);
    }
  }, [rawTarget]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const allUsers = MockStorage.getUsers();
    const foundUser = allUsers.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

    // Role Restriction: Sales Executive can ONLY log in via /superadmin-login
    if (foundUser && foundUser.role === 'sales_executive') {
      setError('Access Restricted: Sales Executive accounts must sign in via the Platform HQ Portal (/superadmin-login). Login is not permitted on Hospital Sign In.');
      return;
    }

    // Maintenance Mode Restriction: Pause non-admin logins when Platform Maintenance Mode is active
    if (foundUser && foundUser.role !== 'super_admin' && foundUser.role !== 'super_admin_manager') {
      if (platformSettings.maintenanceMode) {
        setError('Platform Scheduled Maintenance Active: Hospital staff and patient logins are temporarily paused during scheduled platform maintenance. Normal operations will resume shortly.');
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      const resolvedHospitalId = targetHospital?.id || rawTarget || undefined;
      const loginResult = login(email, password, resolvedHospitalId);
      setIsLoading(false);

      if (loginResult.multipleAccounts && loginResult.multipleAccounts.length > 1) {
        setMatchedAccounts(loginResult.multipleAccounts);
        return;
      }

      if (loginResult.success) {
        const authUser = MockStorage.getAuthUser();
        showToast('Login Successful', `Welcome ${authUser?.name || 'Back'}`, 'success');

        if (authUser?.role === 'super_admin' || authUser?.role === 'super_admin_manager') {
          navigate('/platform/dashboard');
        } else if (authUser?.role === 'sales_executive') {
          navigate('/sales/dashboard');
        } else if (authUser?.role === 'patient') {
          navigate('/patient/dashboard');
        } else if (authUser?.role === 'ambulance_manager' || authUser?.role === 'ambulance_driver') {
          navigate('/hospital/ambulance');
        } else if (authUser?.role === 'doctor') {
          navigate('/hospital/doctor/dashboard');
        } else {
          navigate('/hospital/dashboard');
        }
      } else {
        setError(loginResult.error || 'Invalid credentials or account inactive.');
      }
    }, 400);
  };

  const handleSelectHospitalAccount = (targetHospId: string) => {
    setMatchedAccounts(null);
    setIsLoading(true);
    setTimeout(() => {
      const loginResult = login(email, password, targetHospId);
      setIsLoading(false);
      if (loginResult.success) {
        const authUser = MockStorage.getAuthUser();
        showToast('Login Successful', `Welcome ${authUser?.name || 'Back'}`, 'success');
        if (authUser?.role === 'patient') {
          navigate('/patient/dashboard');
        } else if (authUser?.role === 'doctor') {
          navigate('/hospital/doctor/dashboard');
        } else if (authUser?.role === 'ambulance_manager' || authUser?.role === 'ambulance_driver') {
          navigate('/hospital/ambulance');
        } else {
          navigate('/hospital/dashboard');
        }
      } else {
        setError(loginResult.error || 'Unable to access selected facility.');
      }
    }, 200);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-center text-slate-800 selection:bg-teal-600 selection:text-white relative"
      style={{ backgroundImage: "url('/login_bg_light_1790316830068.jpg')" }}
    >
      {/* Light Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-100/90 via-slate-100/80 to-white/75 backdrop-blur-[2px]" />

      {/* Top Back Button */}
      <div className="absolute top-6 left-6 z-30">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.removeItem('pulse_active_hospital_target');
            }
            navigate('/select-hospital');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-teal-600" />
          <span>Back to Hospital Selection</span>
        </button>
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Brand Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/90 border border-teal-200 text-teal-800 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Hospital Operations & Patient HMS Portal
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200/80 flex items-center justify-center shadow-md shadow-slate-200/50">
                <img src="/logo.png" alt="Zenelait" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Zenelait HMS & CRM</h1>
                <p className="text-xs font-mono uppercase tracking-widest text-teal-700 font-semibold">Hospital CRM + Operations Suite</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed max-w-lg">
              Hospital Operations, Electronic Health Records (EHR), Clinical Consultations, Ward Admissions, Pharmacy Dispensary, Pathology Labs, Billing, and Patient Self-Service.
            </p>
          </div>

          {/* Security & Access Information Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Database & Security Architecture
              </h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">MySQL Powered</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <Building2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Strict Multi-Tenant Isolation</p>
                  <p className="text-[11px] text-slate-500">Each hospital operates in an isolated tenant schema with role-based permissions.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Cryptographic Authentication</p>
                  <p className="text-[11px] text-slate-500">Hospital staff and patients log in with their registered MySQL database credentials.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6 max-w-md mx-auto w-full">
          <div className="bg-white/95 text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 relative overflow-hidden backdrop-blur-md">
            {/* Global Maintenance Mode Banner */}
            {platformSettings.maintenanceMode && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 text-xs">
                <Wrench className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
                    Platform Scheduled Maintenance
                  </p>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    Scheduled platform maintenance is active. Hospital staff and patient logins are temporarily paused. Super Admin administrative access remains active.
                  </p>
                </div>
              </div>
            )}

            {/* Global Tenant Broadcast Announcement */}
            {platformSettings.broadcastBannerActive && platformSettings.broadcastBannerText && (
              <div className={`mb-5 p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
                platformSettings.broadcastBannerLevel === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : platformSettings.broadcastBannerLevel === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}>
                {platformSettings.broadcastBannerLevel === 'critical' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                ) : platformSettings.broadcastBannerLevel === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Megaphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                    platformSettings.broadcastBannerLevel === 'critical'
                      ? 'bg-rose-200 text-rose-900'
                      : platformSettings.broadcastBannerLevel === 'warning'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-blue-200 text-blue-900'
                  }`}>
                    {platformSettings.broadcastBannerLevel === 'critical'
                      ? 'Critical Alert'
                      : platformSettings.broadcastBannerLevel === 'warning'
                      ? 'System Warning'
                      : 'Broadcast'}
                  </span>
                  <p className="font-semibold text-xs mt-1 leading-snug">
                    {platformSettings.broadcastBannerText}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Sign In</h2>
              <p className="text-xs sm:text-sm text-slate-500">Sign in to access your Hospital HMS workspace</p>
            </div>

            {error && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                  error.toLowerCase().includes('pending bill')
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <ShieldAlert
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    error.toLowerCase().includes('pending bill') ? 'text-amber-600' : 'text-rose-600'
                  }`}
                />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold">{error}</p>
                  {error.toLowerCase().includes('pending bill') && (
                    <p className="text-[11px] text-amber-800">
                      Please settle your outstanding balance at the hospital billing / cashier desk to reactivate your portal access.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Optional Verified Facility Context Banner (if accessed via hospital-specific route) */}
              {initialHospitalId && targetHospital && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Target Facility</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{targetHospital.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-white text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                    Verified Portal
                  </span>
                </div>
              )}

              <div>
                <Input
                  label="Work Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>

              <div className="flex items-center text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>Remember session</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white font-bold"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Hospital HMS
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Zenelait HMS & CRM • Multi-Tenant Hospital Operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Hospital Patient Account Selection Dialog */}
      {matchedAccounts && matchedAccounts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Select Hospital Facility</h3>
            <p className="text-xs text-slate-600 mt-1 mb-5">
              You have registered accounts at multiple hospitals under this email. Please select which hospital facility you would like to access:
            </p>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {matchedAccounts.map((acc) => {
                const hosp = MockStorage.getHospitalById(acc.hospitalId || '');
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectHospitalAccount(acc.hospitalId || '')}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-red-50/80 border border-slate-200 hover:border-[#FF3030]/40 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="truncate mr-2">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-[#FF3030] transition-colors truncate">
                        {hosp?.name || acc.hospitalName || 'Hospital Facility'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        Patient ID: {acc.patientId || acc.id} • {acc.role === 'patient' ? 'Patient Portal' : acc.role}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF3030] shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setMatchedAccounts(null)}
              className="mt-5 w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
