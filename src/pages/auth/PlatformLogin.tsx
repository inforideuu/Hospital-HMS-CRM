import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MockStorage } from '../../services/mockStorage';

export const PlatformLogin: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('superadmin@pulsecore.io');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

    const quickLogins: {
    label: string;
    email: string;
    role: UserRole;
    desc: string;
  }[] = [
    { label: 'Super Admin', email: 'superadmin@pulsecore.io', role: 'super_admin', desc: 'Platform HQ SaaS Director' },
    { label: 'Super Admin Manager', email: 'manager@pulsecore.io', role: 'super_admin_manager', desc: 'Operations & Site Builder Admin' },
    { label: 'Sales Executive', email: 'sales@demo-hospitalcrm.com', role: 'sales_executive', desc: 'SaaS Sales & BD Executive' },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const allUsers = MockStorage.getUsers();
    const foundUser = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    // Strict Role Guard: Reject hospital-only staff roles on Platform HQ Login
    if (foundUser && foundUser.role !== 'super_admin' && foundUser.role !== 'super_admin_manager' && foundUser.role !== 'sales_executive') {
      setError('Access Restricted: This login portal is reserved for Super Admin, Super Admin Managers, and Sales Executives.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(email);
      setIsLoading(false);
      if (res.success) {
        showToast('Login Successful', `Welcome ${foundUser?.name || 'Back'}`, 'success');
        if (foundUser?.role === 'sales_executive') {
          navigate('/sales/dashboard');
        } else {
          navigate('/platform/dashboard');
        }
      } else {
        setError(res.error || 'Invalid credentials or account inactive.');
      }
    }, 400);
  };

  const handleQuickLogin = (item: (typeof quickLogins)[0]) => {
    setEmail(item.email);
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      login(item.email, item.role);
      setIsLoading(false);
      showToast(`Signed in as ${item.label}`, 'Switched Workspace', 'success');
      if (item.role === 'sales_executive') {
        navigate('/sales/dashboard');
      } else {
        navigate('/platform/dashboard');
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
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-teal-600" />
          <span>Back to Landing Page</span>
        </button>
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Brand Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/90 border border-teal-200 text-teal-800 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Super Admin & Platform HQ Portal
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
                <Activity className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">HealthCore OS</span>
                <p className="text-xs text-teal-700 font-bold tracking-wider uppercase font-mono">Platform SaaS Command HQ</p>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Platform Headquarters <br />
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent italic font-serif">
                Super Admin Access
              </span>
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Manage hospital network accounts, tenant subscriptions, website customization, platform users, and global SaaS health analytics.
            </p>
          </div>

          {/* Super Admin Roles Only Info */}
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-500" />
              Restricted Credentials Access
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This login interface is exclusively for <strong>Super Admin</strong> and <strong>Super Admin Managers</strong>. Hospital staff, doctors, and patients should log in via their hospital portal.
            </p>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Super Admin Sign In
              </h2>
              <p className="text-xs text-slate-500">Enter your platform administrator credentials</p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Super Admin Official Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@pulsecore.io"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Remember session</span>
                </label>
                <Link to="/forgot-password" className="text-teal-600 hover:text-teal-700 font-bold">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-lg"
              >
                Sign In to Platform HQ <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            {/* Quick Demo Super Admin Roles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                1-Click Super Admin Demo Profiles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickLogins.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleQuickLogin(item)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">{item.label}</span>
                      <Crown className="w-3.5 h-3.5 text-amber-500 opacity-80" />
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformLogin;
