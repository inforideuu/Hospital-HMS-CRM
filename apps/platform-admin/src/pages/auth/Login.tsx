import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MockStorage } from '../../services/mockStorage';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetHospitalId = searchParams.get('targetHospital') || undefined;
  const targetHospital = targetHospitalId ? MockStorage.getHospitalById(targetHospitalId) : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const quickLogins: {
    label: string;
    email: string;
    role: UserRole;
    portal: 'platform';
    desc: string;
  }[] = [
    { label: 'Super Admin', email: 'superadmin@pulsecore.io', role: 'super_admin', portal: 'platform', desc: 'Platform Owner & Super Admin' },
    { label: 'Super Admin Manager', email: 'manager@pulsecore.io', role: 'super_admin_manager', portal: 'platform', desc: 'SaaS Platform Manager' },
    { label: 'Platform Admin', email: 'admin@pulsecore.com', role: 'super_admin', portal: 'platform', desc: 'Platform Operations Admin' },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const loginResult = login(email, password, targetHospitalId);
      setIsLoading(false);

      if (loginResult.success) {
        const allUsers = MockStorage.getUsers();
        const foundUser = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        showToast('Login Successful', `Welcome ${foundUser?.name || 'Back'}`, 'success');

        if (foundUser?.role === 'super_admin' || foundUser?.role === 'super_admin_manager') {
          navigate('/platform/dashboard');
        } else if (foundUser?.role === 'patient') {
          navigate('/patient/dashboard');
        } else if (foundUser?.role === 'ambulance_driver') {
          navigate('/driver/dashboard');
        } else {
          navigate('/hospital/dashboard');
        }
      } else {
        setError(loginResult.error || 'Invalid credentials or account inactive.');
      }
    }, 400);
  };

  const handleQuickLogin = (item: (typeof quickLogins)[0]) => {
    setEmail(item.email);
    setPassword('SuperAdmin@2026');
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      const loginResult = login(item.email, 'SuperAdmin@2026', targetHospitalId);
      setIsLoading(false);
      if (loginResult.success) {
        showToast(`Signed in as ${item.label}`, 'Platform Admin workspace unlocked', 'success');
        navigate('/platform/dashboard');
      } else {
        setError(loginResult.error || 'Access Denied: Account not authorized.');
      }
    }, 300);
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
          onClick={() => navigate('/select-hospital')}
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
                <Activity className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">HealthCore HMS</h1>
                <p className="text-xs font-mono uppercase tracking-widest text-teal-700 font-semibold">Hospital CRM + Operations Suite</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed max-w-lg">
              Hospital Operations, Electronic Health Records (EHR), Clinical Consultations, Ward Admissions, Pharmacy Dispensary, Pathology Labs, Billing, and Patient Self-Service.
            </p>
          </div>

          {/* Quick 1-Click Demo Login Panel */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" /> Platform Admin Accounts
              </h2>
              <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">Platform HQ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickLogins.map((item) => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => handleQuickLogin(item)}
                  className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-400 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                      {item.label}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      HQ
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6 max-w-md mx-auto w-full">
          <div className="bg-white/95 text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 relative overflow-hidden backdrop-blur-md">
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Sign In</h2>
              <p className="text-xs sm:text-sm text-slate-500">Sign in to access your Hospital HMS workspace</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
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

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>Remember session</span>
                </label>
                <Link to="/forgot-password" className="text-teal-600 hover:text-teal-800 font-semibold">
                  Forgot password?
                </Link>
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
                HealthCore HMS • Multi-Tenant Hospital Operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
