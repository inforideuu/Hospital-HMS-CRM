import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Edit,
  Download,
  Sparkles,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { SubscriptionPlanTier, HospitalSubscription, BillingInterval } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { useNotification } from '../../../context/NotificationContext';

export const SubscriptionManagement: React.FC = () => {
  const { showToast } = useNotification();
  const [billingCycle, setBillingCycle] = useState<BillingInterval>('yearly');
  const [subscriptions, setSubscriptions] = useState<HospitalSubscription[]>(() => MockStorage.getSubscriptions());
  const hospitals = MockStorage.getHospitals();
  const plans = MockStorage.getPlans();

  const [selectedSub, setSelectedSub] = useState<HospitalSubscription | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [newTier, setNewTier] = useState<SubscriptionPlanTier>('enterprise');

  // Billing Software Add-on Modal State
  const [isBillingAddonModalOpen, setIsBillingAddonModalOpen] = useState(false);
  const [addonDuration, setAddonDuration] = useState<'3_months' | '6_months' | '1_year'>('1_year');

  const refreshData = () => {
    setSubscriptions(MockStorage.getSubscriptions());
  };

  const handleOpenUpgrade = (sub: HospitalSubscription) => {
    setSelectedSub(sub);
    setNewTier(sub.planTier);
    setIsUpgradeModalOpen(true);
  };

  const handleSaveUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSub) {
      const plan = plans.find((p) => p.tier === newTier);
      const amount = selectedSub.interval === 'yearly' ? (plan?.priceYearly || 4990) : (plan?.priceMonthly || 499);
      const updated: HospitalSubscription = {
        ...selectedSub,
        planTier: newTier,
        planName: plan?.name || 'Professional Hospital',
        amount,
      };
      MockStorage.saveSubscription(updated);

      // Also update hospital record
      const hosp = MockStorage.getHospitalById(selectedSub.hospitalId);
      if (hosp) {
        hosp.planTier = newTier;
        MockStorage.saveHospital(hosp);
      }

      showToast('Plan Updated', `Successfully updated subscription tier to ${plan?.name}.`);
      setIsUpgradeModalOpen(false);
      refreshData();
    }
  };

  const handleExport = () => {
    MockStorage.exportToCSV('Subscriptions_Directory', subscriptions);
    showToast('Export Successful', 'Subscription data downloaded.');
  };

  const handleOpenBillingSystem = (planName?: string) => {
    showToast('Redirecting to Billing System', `Opening billing software portal for ${planName || 'Add-On'}...`);
    window.open('https://billing-system-1-gyvd.onrender.com/', '_blank');
  };

  // Addon Module Governance State
  const [platformSettings, setPlatformSettings] = useState(() => MockStorage.getPlatformSettings());

  const handleToggleAddonModule = (enabled: boolean) => {
    const updated = { ...platformSettings, enableBillingAddonModule: enabled };
    MockStorage.savePlatformSettings(updated);
    setPlatformSettings(updated);
    showToast(
      'Module Settings Updated',
      `Billing Software Add-On is now ${enabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'} for all Hospital Admins.`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Subscription Plans & Platform Billing"
        subtitle="Manage SaaS commercial tiers, capacity allocation, active contracts, and simulated recurring revenue."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Subscriptions' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsBillingAddonModalOpen(true)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md hover:from-purple-700 hover:to-indigo-700"
            >
              Preview Add On Modal
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export Billing Data
            </Button>
          </div>
        }
      />

      {/* Superadmin Control Banner for Hospital Admin Add-On Access */}
      <div className="p-4 rounded-2xl bg-purple-900 text-white border border-purple-700 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/30 text-purple-200 border border-purple-400/40">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold">Hospital Admin Add-On Module Control</h4>
              <span className={`text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                platformSettings.enableBillingAddonModule !== false
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}>
                {platformSettings.enableBillingAddonModule !== false ? 'ON (VISIBLE TO HOSPITALS)' : 'OFF (HIDDEN FROM HOSPITALS)'}
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              Toggle whether Hospital Admins see the "+ Add On Billing Software" button in their HMS dashboard & settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-300 font-bold">Allow Hospital Access:</span>
          <button
            type="button"
            onClick={() => handleToggleAddonModule(platformSettings.enableBillingAddonModule === false)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              platformSettings.enableBillingAddonModule !== false
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {platformSettings.enableBillingAddonModule !== false ? 'SWITCH OFF' : 'SWITCH ON'}
          </button>
        </div>
      </div>

      {/* Plan Billing Cycle Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Commercial SaaS Tiers</h3>
          <p className="text-xs text-slate-500">Select preferred pricing preview mode</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsBillingAddonModalOpen(true)}
            leftIcon={<Zap className="w-3 h-3 text-purple-600" />}
            className="font-bold border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            + Add On (Billing Software)
          </Button>
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-extrabold">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEnterprise = plan.tier === 'enterprise';
          const isStandard = plan.tier === 'standard';
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 relative ${
                plan.isPopular
                  ? 'bg-slate-900 text-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/30'
                  : 'bg-white text-slate-900 border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 text-[10px] uppercase tracking-widest font-black px-3 py-0.5 rounded-full shadow-md">
                  Most Popular for Hospitals
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-base font-bold ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-md uppercase font-mono font-bold ${
                    plan.isPopular ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {plan.tier}
                  </span>
                </div>

                <p className={`text-xs ${plan.isPopular ? 'text-slate-300' : 'text-slate-500'} mb-4 min-h-[32px]`}>
                  {plan.tagline}
                </p>

                <div className="flex items-baseline gap-1 mb-6 pb-4 border-b border-slate-200/20">
                  <span className="text-3xl sm:text-4xl font-black">${price.toLocaleString()}</span>
                  <span className={`text-xs ${plan.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>

                {/* Capacity Limits */}
                <div className={`p-3 rounded-xl mb-4 text-xs space-y-1.5 ${plan.isPopular ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                  <div className="flex justify-between">
                    <span>Patient Capacity:</span>
                    <span className="font-bold">{plan.maxPatients.toLocaleString()} EHR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doctors & Staff:</span>
                    <span className="font-bold">{plan.maxDoctors} Docs / {plan.maxStaff} Staff</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cloud Storage:</span>
                    <span className="font-bold">{plan.storageGB} GB Vault</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2 text-xs">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.isPopular ? 'text-teal-400' : 'text-indigo-600'}`} />
                      <span className={plan.isPopular ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/20 space-y-2">
                <Button
                  variant={plan.isPopular ? 'primary' : 'outline'}
                  size="md"
                  className="w-full font-bold"
                  onClick={() => showToast('Plan Selected', `${plan.name} configuration active.`)}
                >
                  Manage {plan.name} Tier
                </Button>
                
                {/* Add On Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    plan.isPopular
                      ? 'bg-purple-600/30 text-purple-200 border-purple-400/40 hover:bg-purple-600/50'
                      : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  }`}
                  onClick={() => setIsBillingAddonModalOpen(true)}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-purple-500" />}
                >
                  + Add On (Billing Software)
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hospital Subscriptions Table */}
      <Card>
        <CardHeader
          title="Active Hospital Client Subscriptions"
          subtitle="Real-time multi-tenant contract status, billing intervals, and payment methods"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Hospital Workspace</th>
                <th className="px-4 py-3.5">Plan Tier</th>
                <th className="px-4 py-3.5">Cycle & Amount</th>
                <th className="px-4 py-3.5">Plan Activated Date</th>
                <th className="px-4 py-3.5">Renewal Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => {
                const hosp = hospitals.find((h) => h.id === sub.hospitalId);

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 leading-tight">{hosp?.name || sub.hospitalId}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{sub.hospitalId} • {sub.paymentMethod}</p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="capitalize px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {sub.planName}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900">${sub.amount.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{sub.interval} interval</p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {sub.upgradedDate || sub.activatedDate || sub.startDate || '—'}
                        </span>
                      </div>
                      <p className="text-[10px] text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-3 h-3 text-teal-500 shrink-0" />
                        {sub.upgradedDate ? 'Plan Upgraded' : sub.status === 'trialing' ? 'Trial Started' : 'Plan Activated'}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">{sub.renewalDate}</p>
                      <p className="text-[10px] text-slate-400">Auto-Renew: {sub.autoRenew ? 'Yes' : 'No'}</p>
                    </td>

                    <td className="px-4 py-4">
                      {sub.status === 'active' && <Badge variant="success" dot>Active</Badge>}
                      {sub.status === 'trialing' && <Badge variant="cyan" dot>Trialing</Badge>}
                      {sub.status === 'past_due' && <Badge variant="warning" dot>Past Due</Badge>}
                      {sub.status === 'canceled' && <Badge variant="error" dot>Canceled</Badge>}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenUpgrade(sub)}
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Change Tier
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upgrade / Change Plan Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Modify Hospital Subscription"
        subtitle="Upgrade or adjust tier allocation for this facility"
        maxWidth="md"
      >
        <form onSubmit={handleSaveUpgrade} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Target Hospital:</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {hospitals.find((h) => h.id === selectedSub?.hospitalId)?.name || selectedSub?.hospitalId}
            </p>
          </div>

          <Select
            label="Select Subscription Tier"
            value={newTier}
            onChange={(e) => setNewTier(e.target.value as SubscriptionPlanTier)}
          >
            <option value="basic">Starter Clinic ($199/mo or $1,990/yr)</option>
            <option value="standard">Professional Hospital ($499/mo or $4,990/yr)</option>
            <option value="enterprise">Enterprise Health Network ($1,199/mo or $11,990/yr)</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Billing Software Pricing Details Add-On Modal */}
      <Modal
        isOpen={isBillingAddonModalOpen}
        onClose={() => setIsBillingAddonModalOpen(false)}
        title="Billing Software Add-On Subscription Plans"
        subtitle="Integrate our intelligent POS & billing system software with your hospital suite."
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">
                Special Add-On Integration
              </span>
              <h3 className="text-base font-bold mt-1">Standalone Billing Software Suite</h3>
              <p className="text-xs text-slate-300">Choose a billing tier and connect directly to our billing portal.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenBillingSystem('Billing System')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0"
              leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Open Billing Portal
            </Button>
          </div>

          {/* Pricing Duration Selector Pills */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setAddonDuration('3_months')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addonDuration === '3_months' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3 MONTHS
              </button>
              <button
                type="button"
                onClick={() => setAddonDuration('6_months')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addonDuration === '6_months' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 MONTHS
              </button>
              <button
                type="button"
                onClick={() => setAddonDuration('1_year')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addonDuration === '1_year' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 YEAR
              </button>
            </div>
          </div>

          {/* Addon Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Basic Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Basic</h4>
                <div className="flex items-center gap-1 mb-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-sm rounded-lg border border-indigo-100">
                    {addonDuration === '3_months' && '₹1,199.00'}
                    {addonDuration === '6_months' && '₹2,199.00'}
                    {addonDuration === '1_year' && '₹3,999.00'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    /{addonDuration.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-snug">
                  Essential features for small shops. Includes core billing, simple inventory, and basic dashboard analytics.
                </p>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Cashier Limit</span>
                    <span className="font-bold text-slate-900">2</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Festival Offers</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Batch Tracking</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Advanced Reports</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Smart Insights (AI)</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Demand Forecasting</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Dynamic Pricing</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  onClick={() => handleOpenBillingSystem('Basic Billing Add-On')}
                >
                  OK with Add On
                </Button>
              </div>
            </div>

            {/* Standard Card */}
            <div className="rounded-xl border border-indigo-200 bg-slate-50/50 p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                Popular Add-On
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Standard</h4>
                <div className="flex items-center gap-1 mb-3">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-black text-sm rounded-lg border border-indigo-200">
                    {addonDuration === '3_months' && '₹2,699.00'}
                    {addonDuration === '6_months' && '₹4,999.00'}
                    {addonDuration === '1_year' && '₹8,999.00'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    /{addonDuration.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-snug">
                  Perfect for growing businesses. Adds supplier management, purchase orders, batch & expiry tracking, festival offers, and advanced reports.
                </p>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Cashier Limit</span>
                    <span className="font-bold text-slate-900">10</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Festival Offers</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Batch Tracking</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Advanced Reports</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Smart Insights (AI)</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Demand Forecasting</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Dynamic Pricing</span>
                    <span className="text-slate-300 font-mono">✕</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleOpenBillingSystem('Standard Billing Add-On')}
                >
                  OK with Add On
                </Button>
              </div>
            </div>

            {/* Premium Card */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/20 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Premium</h4>
                <div className="flex items-center gap-1 mb-3">
                  <span className="px-3 py-1 bg-purple-100 text-purple-900 font-black text-sm rounded-lg border border-purple-200">
                    {addonDuration === '3_months' && '₹5,199.00'}
                    {addonDuration === '6_months' && '₹9,999.00'}
                    {addonDuration === '1_year' && '₹17,999.00'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    /{addonDuration.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-snug">
                  The complete intelligent store solution. Unlocks all features including Smart AI Insights, Demand Forecasting, Dynamic Auto-Pricing, and unlimited cashier accounts.
                </p>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Cashier Limit</span>
                    <span className="font-bold text-purple-700 uppercase font-mono">Unlimited</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Festival Offers</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Batch Tracking</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Advanced Reports</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Smart Insights (AI)</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Demand Forecasting</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Dynamic Pricing</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-purple-100">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handleOpenBillingSystem('Premium Billing Add-On')}
                >
                  OK with Add On
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Need custom enterprise billing integration? Direct URL: <a href="https://billing-system-1-gyvd.onrender.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-mono underline">billing-system-1-gyvd.onrender.com</a>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBillingAddonModalOpen(false)}
            >
              Close Window
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

