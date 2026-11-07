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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Live Database Authentication against MySQL via Django REST API
      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          setIsLoading(false);
          setError(errData?.message || 'Invalid credentials. Incorrect email or password.');
          return;
        }
      } catch (networkErr) {
        // Backend offline: fallback to client-side validation
      }

      // 2. Strict Role & Password Verification via Auth Context
      const res = login(cleanEmail, password);
      setIsLoading(false);

      if (res.success) {
        const currentUser = MockStorage.getAuthUser();
        if (currentUser && currentUser.role !== 'super_admin' && currentUser.role !== 'super_admin_manager' && currentUser.role !== 'sales_executive') {
          setError('Access Restricted: This login portal is reserved exclusively for Super Admin and Super Admin Managers.');
          return;
        }

        showToast('Login Successful', `Welcome ${currentUser?.name || 'Super Admin'}`, 'success');
        if (currentUser?.role === 'sales_executive') {
          navigate('/sales/dashboard');
        } else {
          navigate('/platform/dashboard');
        }
      } else {
        setError(res.error || 'Invalid credentials. Incorrect email or password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'An unexpected error occurred during login.');
    }
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF3030]/10 border border-[#FF3030]/30 text-[#FF3030] text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#FF3030]" />
            Super Admin & Platform HQ Portal
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200/80 flex items-center justify-center shadow-md shadow-slate-200/50">
                <img src="/logo.png" alt="Zenelait" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">Zenelait OS</span>
                <p className="text-xs text-[#FF3030] font-bold tracking-wider uppercase font-mono">Platform SaaS Command HQ</p>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Platform Headquarters <br />
              <span className="bg-gradient-to-r from-[#FF3030] to-rose-600 bg-clip-text text-transparent italic font-serif">
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
                placeholder="name@zenelait.com"
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

              <div className="flex items-center text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Remember session</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="coral"
                size="lg"
                isLoading={isLoading}
                className="w-full bg-[#FF3030] hover:bg-[#e62222] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#FF3030]/30 border-none cursor-pointer"
              >
                Sign In to Platform HQ <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformLogin;
