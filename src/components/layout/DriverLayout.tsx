import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { Truck, Radio, ShieldCheck } from 'lucide-react';

export const DriverLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Driver Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        portalType="driver"
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          portalType="driver"
        />

        {/* 911 Telemetry Environment Banner */}
        <div className="bg-slate-900 text-slate-200 px-4 sm:px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Truck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-semibold text-white truncate">PulseCore 911 Emergency Telemetry</span>
            <span className="hidden md:inline text-slate-400">• Unit Reg: <span className="font-mono text-slate-300">NY-EMRG-889</span></span>
            <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
              <Radio className="w-3 h-3 animate-pulse" /> Telemetry Stream Active
            </span>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0">
            EMT Driver: <span className="text-white font-medium">{user?.name}</span>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;
