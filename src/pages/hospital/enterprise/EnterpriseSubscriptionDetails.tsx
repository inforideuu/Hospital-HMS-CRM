import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Network,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Zap,
  ExternalLink,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { MockStorage } from '../../../services/mockStorage';
import { Organization, HospitalSubscription, SubscriptionPlan } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const EnterpriseSubscriptionDetails: React.FC = () => {
  const { user, currentHospital } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<HospitalSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    const orgId =
      user?.organizationId ||
      currentHospital?.organizationId ||
      (currentHospital ? MockStorage.getOrganizationByHospitalId(currentHospital.id)?.id : undefined);

    let org = orgId ? MockStorage.getOrganizationById(orgId) : undefined;
    if (!org) {
      const allOrgs = MockStorage.getOrganizations();
      org = allOrgs.find((o) => o.planTier === 'enterprise') || allOrgs[0];
    }

    if (org) {
      setOrganization(org);
      const sub =
        MockStorage.getSubscriptionByHospitalId(org.primaryHospitalId) ||
        MockStorage.getSubscriptions().find((s) => s.planTier === 'enterprise');
      setSubscription(sub || null);
      setPlan(MockStorage.getPlanByTier('enterprise'));
    }
  }, [user, currentHospital]);

  if (!organization) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <PageHeader title="Subscription Details" subtitle="Enterprise group subscription agreement" />
        <Card className="p-8 text-center text-slate-500">No Enterprise organization found.</Card>
      </div>
    );
  }

  const branchCount = organization.branches?.length || 1;
  const maxBranches = organization.maxBranches || 10;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <PageHeader
        title="Enterprise Subscription Details"
        subtitle={`Master contract agreement and branch entitlement governance for ${organization.name}`}
      />

      {/* Master Group Subscription Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-500/30">
              <Network className="w-3.5 h-3.5 text-brand-400" />
              Master Group Subscription
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Enterprise Health Network</h2>
            <p className="text-xs text-slate-300">
              Governs all operating branches under <strong className="text-white">{organization.name}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">₹11,990</span>
            <span className="text-xs text-slate-400 font-medium">Billed Annually (Includes all network branches)</span>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Active Branch Quota Entitlement</span>
            <span className="font-bold text-white font-mono">
              {branchCount} of {maxBranches} Branches Active
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-brand-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((branchCount / maxBranches) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Unified billing: Branches are provisioned without separate subscription charges.</span>
            <span className="text-brand-300 font-semibold">{maxBranches - branchCount} Slots Free</span>
          </div>
        </div>

        {/* Contract Key Terms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contract Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Method</span>
            <span className="font-semibold text-white mt-0.5 block truncate">
              {subscription?.paymentMethod || 'UPI QR / Bank Wire'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Upgraded / Activated Date</span>
            <span className="font-semibold text-teal-400 mt-0.5 block font-mono">
              {subscription?.upgradedDate || subscription?.activatedDate || subscription?.startDate || '2026-01-15'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Renewal Date</span>
            <span className="font-semibold text-white mt-0.5 block font-mono">
              {subscription?.renewalDate || '2027-01-15'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Flagship</span>
            <span className="font-semibold text-teal-300 mt-0.5 block truncate">
              {MockStorage.getHospitalById(organization.primaryHospitalId)?.name || 'Chennai Hospital'}
            </span>
          </div>
        </div>
      </div>

      {/* Single Subscription Rule Clarification (Step 9) */}
      <Card className="p-5 border-brand-200 bg-brand-50/40 text-brand-950 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">Enterprise Unified Billing Policy</p>
          <p className="text-slate-600 leading-relaxed">
            The Enterprise Health Network subscription is held at the Healthcare Group level. Branches such as ABC
            Chennai Hospital and ABC Bangalore Hospital operate under this single master agreement without individual
            per-branch SaaS fees. Branch data is never deleted automatically upon lifecycle events.
          </p>
        </div>
      </Card>

      {/* Plan Feature Entitlements */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Included Enterprise Capabilities & Entitlements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            'Multi-Hospital Chain Orchestration',
            'Cross-Facility Patient Transfers & Referrals',
            'Emergency Ambulance Live Telemetry & 911 Dispatch',
            'Independent Branch Hospital Website Builder Configurations',
            'Custom Role-Based Access Control (RBAC) & Tenant Isolation',
            'Consolidated Multi-Branch Executive Analytics & Reporting',
            'High-Capacity EHR & PACS Diagnostic Vault',
            '24/7 Dedicated Account Manager & Enterprise SLA Support',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-700">{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
