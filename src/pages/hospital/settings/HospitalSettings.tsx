import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  Clock,
  Save,
  Bell,
  ShieldCheck,
  Receipt,
  FileText,
  Zap,
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  Tag,
  Sparkles,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { HospitalSettings as HospitalSettingsType } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { BillingSoftwareAddonModal } from '../../../components/common/BillingSoftwareAddonModal';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';
import { PlanCapabilityMatrix } from '../../../components/common/PlanCapabilityMatrix';

export const HospitalSettings: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [settings, setSettings] = useState<HospitalSettingsType>(() => MockStorage.getHospitalSettings(hospId));
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  // Controlled by Super Admin in Platform Settings
  const isAddonEnabled = MockStorage.getPlatformSettings().enableBillingAddonModule !== false;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    MockStorage.saveHospitalSettings(settings);
    showToast('Hospital Settings Saved', 'Facility parameters and billing preferences updated.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Hospital Workspace Settings & Operating Policies"
        subtitle="Manage facility identity, emergency hotline, OPD consultation slot durations, and invoice payment terms."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Settings' }]}
        actions={
          isAddonEnabled ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddonModalOpen(true)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
            >
              + Add On Billing Software
            </Button>
          ) : undefined
        }
      />

      <div className="max-w-4xl space-y-6">
        {/* Active Subscription Plan & Renewal Card */}
        {(() => {
          const plan = MockStorage.getPlanByTier(currentHospital?.planTier || 'trial');
          const sub = MockStorage.getSubscriptionByHospitalId(hospId);
          const subStatus = MockStorage.checkHospitalSubscriptionStatus(hospId);
          const isExpired = !subStatus.allowed;
          const activeCoupons = MockStorage.getCoupons().filter(
            (c) => c.isActive && (!c.validUntil || new Date(c.validUntil) >= new Date()) && (!c.maxUses || (c.usedCount || 0) < c.maxUses)
          );

          return (
            <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isExpired
                ? 'bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white border-rose-500/40 ring-2 ring-rose-500/30'
                : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isExpired ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-bold ${isExpired ? 'text-white' : 'text-slate-900'}`}>
                        {plan?.name || currentHospital?.planTier?.toUpperCase() || 'Subscription Plan'}
                      </h3>
                      <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                        isExpired
                          ? 'bg-rose-500 text-white'
                          : sub?.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isExpired ? (subStatus.reason === 'trial_expired' ? 'TRIAL EXPIRED' : 'SUBSCRIPTION EXPIRED') : sub?.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>
                    <p className={`text-xs ${isExpired ? 'text-rose-200' : 'text-slate-500'} mt-0.5`}>
                      {isExpired
                        ? 'Your hospital subscription is currently inactive. Renew or upgrade below to restore full access to clinical modules.'
                        : `Contract Interval: ${sub?.interval || 'yearly'} • Upgraded/Activated: ${sub?.upgradedDate || sub?.activatedDate || sub?.startDate || '2026-01-15'} • Renewal Date: ${sub?.renewalDate || '2026-12-31'}`}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className={`font-bold shrink-0 shadow-md ${
                    isExpired ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  {isExpired ? 'Renew / Upgrade Subscription Now' : 'Change / Upgrade Plan'}
                </Button>
              </div>

              {/* Superadmin Active Promotional Coupon Banner */}
              {activeCoupons.length > 0 && (
                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                  isExpired ? 'bg-purple-950/80 border-purple-500/40 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="font-bold">Superadmin Promotional Offer: </span>
                      <span>
                        Use code <strong className="font-mono underline">{activeCoupons[0].code}</strong> for{' '}
                        <strong className="text-emerald-400 font-extrabold">{activeCoupons[0].discountPercentage}% OFF</strong>!
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="font-bold border-purple-300 text-purple-700 hover:bg-purple-100 shrink-0"
                  >
                    Apply Coupon & Upgrade
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className={`p-2.5 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Patient EHR</span>
                  <span className="font-bold text-sm">{plan?.maxPatients?.toLocaleString('en-IN') || '5,000'}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Doctors</span>
                  <span className="font-bold text-sm">{plan?.maxDoctors || 10} Specialists</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Staff Members</span>
                  <span className="font-bold text-sm">{plan?.maxStaff || 25} Users</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Cloud Storage</span>
                  <span className="font-bold text-sm">{plan?.storageGB || 50} GB Vault</span>
                </div>
              </div>

              {/* Collapsible Capability Matrix */}
              <div className="pt-3 border-t border-slate-200/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Capability Matrix for Your Tier</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMatrix(!showMatrix)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {showMatrix ? 'Hide Capability Matrix' : 'View Full Capability Matrix (10 Capabilities)'}
                  </button>
                </div>
                {showMatrix && (
                  <PlanCapabilityMatrix
                    currentTier={currentHospital?.planTier}
                    onSelectTier={() => setIsUpgradeModalOpen(true)}
                  />
                )}
              </div>
            </div>
          );
        })()}

        {/* Billing Software Add-On Highlight Banner (Controlled by Super Admin) */}
        {isAddonEnabled && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Billing Software Integration Add-On</h3>
                  <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full bg-purple-400 text-slate-950">
                    Hospital Add-On
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Unlock full POS billing, inventory management, cashier limits, and AI demand forecasting with our standalone billing suite.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddonModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0"
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              View Add-On Plans & Connect
            </Button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Hospital Profile Card */}
          <Card>
            <CardHeader
              title="Hospital Identity & Public Helplines"
              subtitle="Contact information printed on patient receipts and portal banners"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hospital Display Name"
                  value={settings.hospitalName}
                  onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                  required
                />
                <Input
                  label="Motto / Clinical Tagline"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="24/7 Emergency Helpline"
                  value={settings.emergencyHelpline}
                  onChange={(e) => setSettings({ ...settings, emergencyHelpline: e.target.value })}
                  required
                />
                <Input
                  label="OPD Reception Phone"
                  value={settings.receptionPhone}
                  onChange={(e) => setSettings({ ...settings, receptionPhone: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Hospital Email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  required
                />
                <Input
                  label="Operating Hours"
                  value={settings.operatingHours}
                  onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                />
              </div>

              <Input
                label="Physical Hospital Address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Clinical Scheduling & Billing Config */}
          <Card>
            <CardHeader
              title="Clinical Scheduling & Invoicing Parameters"
              subtitle="Default time slots and taxation parameters"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Default OPD Consultation Slot (Minutes)"
                  type="number"
                  value={settings.consultationSlotMinutes}
                  onChange={(e) => setSettings({ ...settings, consultationSlotMinutes: Number(e.target.value) })}
                />
                <Input
                  label="Tax Identification / EIN Number"
                  value={settings.taxRegistrationNumber}
                  onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Automated SMS Reminders</p>
                    <p className="text-[11px] text-slate-500">Send appointment reminders 2 hours before OPD slot</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableSmsAlerts}
                    onChange={(e) => setSettings({ ...settings, enableSmsAlerts: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Email Tax Invoices</p>
                    <p className="text-[11px] text-slate-500">Automatically dispatch PDF copy upon billing</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableEmailInvoices}
                    onChange={(e) => setSettings({ ...settings, enableEmailInvoices: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <Textarea
                label="Standard Invoice Terms & Instructions"
                value={settings.invoiceNotes}
                onChange={(e) => setSettings({ ...settings, invoiceNotes: e.target.value })}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setSettings(MockStorage.getHospitalSettings(hospId))}
            >
              Reset
            </Button>
            <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
              Save Workspace Settings
            </Button>
          </div>
        </form>
      </div>

      <BillingSoftwareAddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
      />

      <SubscriptionUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        hospitalId={hospId}
        hospitalName={currentHospital?.name}
        currentTier={currentHospital?.planTier}
      />
    </div>
  );
};
