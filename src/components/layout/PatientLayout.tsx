import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, ShieldCheck, ShieldAlert, Wrench, Megaphone, RefreshCw } from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { Button } from '../ui/Button';

export const PatientLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { currentHospital, user, logout } = useAuth();
  const isHospitalSuspended = Boolean(
    currentHospital?.status &&
    (currentHospital.status.toLowerCase() === 'suspended' ||
      currentHospital.status.toLowerCase() === 'inactive' ||
      currentHospital.status.toLowerCase() === 'rejected')
  );

  const [platformSettings, setPlatformSettings] = useState(() => MockStorage.getPlatformSettings());

  React.useEffect(() => {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative">
      {/* Hospital Facility Suspended Overlay */}
      {isHospitalSuspended && user?.role !== 'super_admin' && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center shadow-2xl border border-rose-300 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-8 h-8 animate-pulse text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                Facility Suspended
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Patient Portal Temporarily Unavailable
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Online services for <strong>{currentHospital?.name}</strong> are temporarily suspended by system administration. Please contact the hospital helpdesk directly for emergency medical assistance.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Platform Maintenance Mode Overlay for Patients */}
      {platformSettings.maintenanceMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Wrench className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                Platform Scheduled Maintenance
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Patient Portal Under Maintenance
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Our electronic health platform is currently undergoing scheduled system optimization. All patient health records and booking vaults remain secure. Normal portal access will resume shortly.
              </p>
            </div>

            {platformSettings.broadcastBannerActive && platformSettings.broadcastBannerText && (
              <div className={`p-4 rounded-xl border text-xs text-left flex items-start gap-3 ${
                platformSettings.broadcastBannerLevel === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : platformSettings.broadcastBannerLevel === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <Megaphone className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                <div>
                  <span className="font-bold block uppercase text-[10px] tracking-wider mb-0.5">
                    Broadcast Announcement:
                  </span>
                  <p className="font-semibold">{platformSettings.broadcastBannerText}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh System Status
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Patient Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        portalType="patient"
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          portalType="patient"
        />

        {/* Patient Environment Banner */}
        <div className="bg-slate-900 text-slate-200 px-4 sm:px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <HeartPulse className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="font-semibold text-white truncate">{user?.hospitalName || currentHospital?.name || 'Apex City Medical Center'}</span>
            <span className="hidden md:inline text-slate-400">• Patient ID: <span className="font-mono text-slate-300">{user?.patientId || 'PAT-1001'}</span></span>
            <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-semibold border border-teal-500/30">
              <ShieldCheck className="w-3 h-3" /> Secure Patient Portal Vault
            </span>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0">
            Patient: <span className="text-white font-medium">{user?.name}</span>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;
