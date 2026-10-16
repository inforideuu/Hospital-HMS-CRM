import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldCheck } from 'lucide-react';

export const HospitalLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentHospital, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};
