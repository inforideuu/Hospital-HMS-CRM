import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Your current assigned role (<span className="font-semibold text-slate-800 capitalize">{user?.role?.replace('_', ' ')}</span>) does not have authorization to view this module.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Demonstration Tip
          </p>
          <p>
            You can switch to an authorized role instantly using the demo switcher in the top right navbar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={() => navigate(user?.portal === 'platform' ? '/platform/dashboard' : '/hospital/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => {
              switchRole('super_admin');
              navigate('/platform/dashboard');
            }}
          >
            Switch to Super Admin
          </Button>
        </div>
      </div>
    </div>
  );
};
