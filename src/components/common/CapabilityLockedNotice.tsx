import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { SubscriptionUpgradeModal } from './SubscriptionUpgradeModal';
import { PlanCapabilityMatrix } from './PlanCapabilityMatrix';
import { PlanCapability } from '../../constants/planCapabilities';
import { SubscriptionPlanTier } from '../../types';

interface CapabilityLockedNoticeProps {
  capability: PlanCapability;
  currentTier?: SubscriptionPlanTier;
  hospitalId?: string;
  hospitalName?: string;
}

export const CapabilityLockedNotice: React.FC<CapabilityLockedNoticeProps> = ({
  capability,
  currentTier = 'basic',
  hospitalId,
  hospitalName,
}) => {
  const navigate = useNavigate();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const targetTier: SubscriptionPlanTier = capability.professionalHospital ? 'standard' : 'enterprise';
  const targetTierName = targetTier === 'standard' ? 'Professional Hospital' : 'Enterprise Health Network';
  const currentTierName =
    currentTier === 'basic'
      ? 'Starter Clinic'
      : currentTier === 'standard'
      ? 'Professional Hospital'
      : currentTier === 'enterprise'
      ? 'Enterprise Health Network'
      : '7-Day Free Trial';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
      {/* Hero Locked Banner */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-10 text-center text-white shadow-2xl relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5 max-w-2xl mx-auto">
          {/* Lock Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-rose-500/20 via-amber-500/20 to-indigo-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-950/50">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400 stroke-[2.2]" />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              Capability Restricted
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
              Current Plan: <strong className="text-white">{currentTierName}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
              Unlocked in: <strong className="text-emerald-300">{targetTierName}</strong>
            </span>
          </div>

          {/* Main Title & Description */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {capability.name} is Locked on Your Current Plan
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {capability.description} According to the platform capability matrix, this module is not included in the <strong className="text-white">{currentTierName}</strong> tier. Upgrade your facility's subscription to <strong className="text-indigo-300">{targetTierName}</strong> to immediately activate and access this module.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/hospital/dashboard')}
              className="w-full sm:w-auto border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold"
            >
              Back to Dashboard
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUpgradeModalOpen(true)}
              leftIcon={<Sparkles className="w-4 h-4 text-emerald-300" />}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-extrabold shadow-lg shadow-indigo-600/30"
            >
              Upgrade to {targetTierName} Now
            </Button>
          </div>
        </div>
      </div>

      {/* Embedded Official Capability Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" /> Platform Capability Comparison Matrix
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Strict Multi-Tier Feature Gating
          </span>
        </div>
        <PlanCapabilityMatrix
          currentTier={currentTier}
          onSelectTier={() => setIsUpgradeModalOpen(true)}
          showDescriptions={false}
        />
      </div>

      {/* Subscription Upgrade Modal */}
      {hospitalId && (
        <SubscriptionUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          hospitalId={hospitalId}
          hospitalName={hospitalName}
          currentTier={currentTier}
        />
      )}
    </div>
  );
};

export default CapabilityLockedNotice;
