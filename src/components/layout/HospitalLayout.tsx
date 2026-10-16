import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldCheck, Lock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { SubscriptionUpgradeModal } from '../common/SubscriptionUpgradeModal';
import { CapabilityLockedNotice } from '../common/CapabilityLockedNotice';
import { checkPathCapability } from '../../constants/planCapabilities';
import { Button } from '../ui/Button';

export const HospitalLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { currentHospital, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hospId = user?.hospitalId || currentHospital?.id;
  const subStatus = MockStorage.checkHospitalSubscriptionStatus(hospId);

  const isHospitalAdmin = user?.role === 'hospital_admin';
  const isSubscriptionPage = location.pathname === '/hospital/settings';
  const isAccessBlocked = !subStatus.allowed;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative">
      {/* Non-Admin Full-Screen Lock Overlay if Subscription Expired */}
      {isAccessBlocked && !isHospitalAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Lock className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-300 inline-block mb-2">
              Subscription Access Restricted
            </span>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Hospital Subscription Inactive
            </h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
              Access is currently locked because your facility's subscription plan has expired or is disabled. Please contact your Hospital Administrator to renew the subscription.
            </p>
          </div>
        </div>
      )}

      {/* Hospital Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        portalType="hospital"
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          portalType="hospital"
        />

        {/* Top Warning Banner for Hospital Admin when Subscription is Expired/Restricted */}
        {isAccessBlocked && isHospitalAdmin && (
          <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-slate-900 text-white px-4 sm:px-6 py-2.5 shadow-md flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
              <span className="font-bold truncate">
                Hospital Subscription Expired / Restricted: Access to clinical modules is locked.
              </span>
              <span className="hidden md:inline text-amber-100">
                Only the Subscription & Settings page is accessible to renew or upgrade.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="xs"
                onClick={() => setIsUpgradeModalOpen(true)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="bg-black text-white hover:bg-slate-100 hover:text-black font-extrabold shadow-sm transition-colors duration-300"
              >
                Renew / Upgrade Plan
              </Button>
            </div>
          </div>
        )}

        {/* Tenant Environment Banner */}
        <div className="bg-slate-900 text-slate-200 px-4 sm:px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="font-semibold text-white truncate">{currentHospital?.name || 'Hospital Workspace'}</span>
            <span className="hidden md:inline text-slate-400">• Tenant ID: <span className="font-mono text-slate-300">{currentHospital?.id}</span></span>
            <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-semibold border border-teal-500/30">
              <ShieldCheck className="w-3 h-3" /> HIPAA Compliant Vault
            </span>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0">
            Role: <span className="text-white font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isAccessBlocked && isHospitalAdmin && !isSubscriptionPage ? (
            <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center shadow-lg space-y-4 my-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Module Access Restricted Due to Expired Subscription
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {subStatus.message}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/hospital/settings')}
                >
                  Go to Subscription & Settings Page
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  leftIcon={<ArrowRight className="w-4 h-4" />}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Renew / Upgrade Subscription Now
                </Button>
              </div>
            </div>
          ) : (() => {
            const pathCheck = checkPathCapability(location.pathname, currentHospital?.planTier);
            if (!pathCheck.allowed && pathCheck.capability) {
              return (
                <CapabilityLockedNotice
                  capability={pathCheck.capability}
                  currentTier={currentHospital?.planTier}
                  hospitalId={hospId}
                  hospitalName={currentHospital?.name}
                />
              );
            }
            return <Outlet />;
          })()}
        </main>
      </div>

      {/* Subscription Upgrade Modal */}
      {hospId && (
        <SubscriptionUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          hospitalId={hospId}
          currentTier={currentHospital?.planTier || 'trial'}
        />
      )}
    </div>
  );
};
