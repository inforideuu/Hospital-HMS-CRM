import React from 'react';
import { Check, Lock, Sparkles, Shield, ArrowUpRight } from 'lucide-react';
import { PLAN_CAPABILITIES, PlanCapability } from '../../constants/planCapabilities';
import { SubscriptionPlanTier } from '../../types';

interface PlanCapabilityMatrixProps {
  currentTier?: SubscriptionPlanTier;
  onSelectTier?: (tier: SubscriptionPlanTier) => void;
  className?: string;
  showDescriptions?: boolean;
}

export const PlanCapabilityMatrix: React.FC<PlanCapabilityMatrixProps> = ({
  currentTier,
  onSelectTier,
  className = '',
  showDescriptions = false,
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl bg-black border border-slate-800 text-white shadow-2xl ${className}`}>
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-black to-slate-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              Subscription Capability & Module Matrix
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Compare capabilities across Starter Clinic, Professional Hospital, and Enterprise Health Network
          </p>
        </div>

        {currentTier && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">Current Workspace:</span>
            <span className="text-emerald-400 font-bold uppercase">{currentTier}</span>
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs sm:text-sm font-bold text-white bg-slate-950/80">
              <th className="py-4 px-4 sm:px-6 w-2/5 font-bold tracking-wide">
                Capability
              </th>
              <th className={`py-4 px-3 sm:px-4 text-center font-bold tracking-wide ${
                currentTier === 'basic' ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-100'
              }`}>
                <div className="flex flex-col items-center">
                  <span>Starter Clinic</span>
                  {currentTier === 'basic' && (
                    <span className="text-[9px] font-mono px-2 py-0.5 mt-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Active</span>
                  )}
                </div>
              </th>
              <th className={`py-4 px-3 sm:px-4 text-center font-bold tracking-wide ${
                currentTier === 'standard' ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-100'
              }`}>
                <div className="flex flex-col items-center">
                  <span>Professional Hospital</span>
                  {currentTier === 'standard' && (
                    <span className="text-[9px] font-mono px-2 py-0.5 mt-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">Active</span>
                  )}
                </div>
              </th>
              <th className={`py-4 px-3 sm:px-4 text-center font-bold tracking-wide ${
                currentTier === 'enterprise' ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-100'
              }`}>
                <div className="flex flex-col items-center">
                  <span>Enterprise Health Network</span>
                  {currentTier === 'enterprise' && (
                    <span className="text-[9px] font-mono px-2 py-0.5 mt-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Active</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-xs sm:text-sm">
            {PLAN_CAPABILITIES.map((cap, index) => {
              return (
                <tr
                  key={cap.id}
                  className="hover:bg-slate-900/40 transition-colors group"
                >
                  {/* Capability Column */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="font-medium text-slate-100 group-hover:text-white transition-colors">
                      {cap.name}
                    </div>
                    {showDescriptions && (
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {cap.description}
                      </p>
                    )}
                  </td>

                  {/* Starter Clinic */}
                  <td className={`py-3.5 px-3 sm:px-4 text-center ${
                    currentTier === 'basic' ? 'bg-indigo-950/20' : ''
                  }`}>
                    <div className="flex items-center justify-center">
                      {cap.starterClinic ? (
                        <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400" title="Locked on Starter Clinic">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Professional Hospital */}
                  <td className={`py-3.5 px-3 sm:px-4 text-center ${
                    currentTier === 'standard' ? 'bg-indigo-950/20' : ''
                  }`}>
                    <div className="flex items-center justify-center">
                      {cap.professionalHospital ? (
                        <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400" title="Locked on Professional Hospital">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Enterprise Health Network */}
                  <td className={`py-3.5 px-3 sm:px-4 text-center ${
                    currentTier === 'enterprise' ? 'bg-indigo-950/20' : ''
                  }`}>
                    <div className="flex items-center justify-center">
                      {cap.enterpriseHealthNetwork ? (
                        <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400" title="Locked">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" /> Full Capability Included
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5" /> Capability Locked
          </span>
        </div>
        {onSelectTier && (
          <div className="text-slate-400 flex items-center gap-2">
            <span>Need an upgrade?</span>
            <button
              onClick={() => onSelectTier('standard')}
              className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Upgrade Tier <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanCapabilityMatrix;
