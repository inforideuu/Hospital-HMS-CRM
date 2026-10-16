import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Building2,
  Save,
  CheckCircle2,
  Lock,
  ArrowRightLeft,
  Pill,
  FlaskConical,
  Database,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { MockStorage } from '../../../services/mockStorage';
import { Organization } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useNotification } from '../../../context/NotificationContext';

export const OrganizationSettings: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [settings, setSettings] = useState({
    requireTransferApproval: true,
    sharePharmacyInventory: true,
    syncLabCatalog: true,
    enforceStrictHIPAA: true,
    interBranchReferrals: true,
    dataRetentionYears: 10,
    notificationEmails: '',
  });

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
      setSettings((prev) => ({
        ...prev,
        notificationEmails: org.contactEmail || '',
      }));
    }
  }, [user, currentHospital]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Organization Settings Saved', 'Multi-branch policy configurations have been synchronized across all facilities.', 'success');
  };

  if (!organization) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <PageHeader title="Organization Settings" subtitle="Group-wide governance and network policies" />
        <Card className="p-8 text-center text-slate-500">No Enterprise organization found.</Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <PageHeader
        title="Organization Settings"
        subtitle={`Network policies, inter-branch protocols, and security compliance for ${organization.name}`}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Inter-facility Clinical Protocols */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cross-Facility Clinical Protocols</h3>
              <p className="text-xs text-slate-500">Define transfer and consultation rules between network hospitals</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.requireTransferApproval}
                onChange={(e) => setSettings({ ...settings, requireTransferApproval: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Require Branch Medical Director Approval for Patient Transfers</span>
                <span className="text-slate-500">
                  Transfers from one branch to another (e.g. Chennai to Bangalore) must be accepted by the receiving facility before bed allocation.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.interBranchReferrals}
                onChange={(e) => setSettings({ ...settings, interBranchReferrals: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Enable Direct Inter-Branch Specialist Referrals</span>
                <span className="text-slate-500">
                  Allow physicians at any facility in {organization.name} to book tele-consultations or OPD referrals with specialists at sister branches.
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* Centralized Inventory & Diagnostics */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory & Laboratory Catalog Synchronization</h3>
              <p className="text-xs text-slate-500">Control multi-facility pharmaceutical and diagnostic standardization</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.sharePharmacyInventory}
                onChange={(e) => setSettings({ ...settings, sharePharmacyInventory: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Centralized Group Pharmacy Stock Visibility</span>
                <span className="text-slate-500">
                  Permit pharmacy staff to view critical medicine availability at other branches for inter-facility emergency stock dispatch.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.syncLabCatalog}
                onChange={(e) => setSettings({ ...settings, syncLabCatalog: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Synchronize Master Diagnostic Test Catalog</span>
                <span className="text-slate-500">
                  Propagate standardized lab test codes, test descriptions, and baseline ranges across all operating branches automatically.
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* Security & Data Retention */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Data Isolation & Security Governance</h3>
              <p className="text-xs text-slate-500">Backend tenant security and compliance parameters</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-purple-900">
              <Lock className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold">Strict Cryptographic Tenant Partitioning</span>
                <p className="text-[11px] text-purple-800 mt-0.5">
                  Private EHR, invoices, and diagnostic results are partitioned by hospital tenant ID and validated on the Django backend on every request.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="EHR Data Retention (Years)"
                type="number"
                value={String(settings.dataRetentionYears)}
                onChange={(e) => setSettings({ ...settings, dataRetentionYears: Number(e.target.value) })}
                required
              />
              <Input
                label="Compliance Notification Emails"
                type="text"
                value={settings.notificationEmails}
                onChange={(e) => setSettings({ ...settings, notificationEmails: e.target.value })}
                placeholder="compliance@abchealthcare.org"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end">
          <Button type="submit" variant="primary" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Organization Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
