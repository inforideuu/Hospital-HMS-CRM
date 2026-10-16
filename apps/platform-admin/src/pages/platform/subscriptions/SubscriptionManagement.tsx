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
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Eye,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { SubscriptionPlanTier, HospitalSubscription, BillingInterval, SubscriptionPlan } from '../../../types';
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
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  const refreshData = () => {
    setSubscriptions(MockStorage.getSubscriptions());
  };

  const handleTogglePlanStatus = (plan: SubscriptionPlan) => {
    const updated = { ...plan, isActive: plan.isActive === false ? true : false };
    MockStorage.savePlan(updated);
    showToast(
      'Plan Status Changed',
      `${plan.name} tier is now ${updated.isActive ? 'ENABLED (Active)' : 'DISABLED (Inactive)'}.`
    );
    refreshData();
  };

  const [platformSettings, setPlatformSettings] = useState(() => MockStorage.getPlatformSettings());

  const handleToggleAddonModule = (enabled: boolean) => {
    const updated = { ...platformSettings, enableBillingAddonModule: enabled };
    setPlatformSettings(updated);
    MockStorage.savePlatformSettings(updated);
    showToast(
      enabled ? 'Add-On Module Enabled' : 'Add-On Module Disabled',
      `Hospital Admin "+ Add On Billing Software" button is now ${enabled ? 'VISIBLE' : 'HIDDEN'} across all hospital dashboards.`
    );
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Subscription Plans & Platform Billing"
        subtitle="Manage SaaS commercial tiers, capacity allocation, active contracts, and simulated recurring revenue."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Subscriptions' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export Billing Data
            </Button>
          </div>
        }
      />

      {/* Super Admin Control Switch for Hospital Add-On Module */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Hospital Admin Add-On Module Switch</h3>
              <Badge variant={platformSettings.enableBillingAddonModule !== false ? 'success' : 'neutral'}>
                {platformSettings.enableBillingAddonModule !== false ? 'SWITCH ON' : 'SWITCH OFF'}
              </Badge>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Control whether hospital admins can see the <strong>"+ Add On Billing Software"</strong> button and 50% discount cards in their subscription upgrade modal & portals.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 bg-slate-800/80 p-2 rounded-xl border border-indigo-500/20">
          <span className="text-xs font-semibold text-indigo-200">Enable Add-On for Hospital Admins:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={platformSettings.enableBillingAddonModule !== false}
              onChange={(e) => handleToggleAddonModule(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* Plan Billing Cycle Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Commercial SaaS Tiers</h3>
          <p className="text-xs text-slate-500">Select preferred pricing preview mode</p>
        </div>
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
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black uppercase ${
                      plan.isActive !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    }`}>
                      {plan.isActive !== false ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md uppercase font-mono font-bold ${
                      plan.isPopular ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {plan.tier}
                    </span>
                  </div>
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

              <div className="pt-6 mt-6 border-t border-slate-200/20">
                <div className="flex items-center gap-2">
                  <Button
                    variant={plan.isPopular ? 'primary' : 'outline'}
                    size="md"
                    className="flex-1 font-bold"
                    onClick={() => showToast('Plan Selected', `${plan.name} configuration active.`)}
                  >
                    Manage {plan.name} Tier
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleTogglePlanStatus(plan)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      plan.isActive !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    }`}
                    title={plan.isActive !== false ? 'Click to Disable Plan' : 'Click to Enable Plan'}
                  >
                    {plan.isActive !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{plan.isActive !== false ? 'ENABLED' : 'DISABLED'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PENDING QR PAYMENT APPROVALS CARD (SUPER ADMIN ACTION) */}
      {(() => {
        const pendingPayments = subscriptions.filter((s) => s.paymentStatus === 'pending_approval');

        return (
          <Card className="border-amber-300 bg-amber-50/40">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  <span>Pending QR Payment & UTR Approvals</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold font-mono">
                    {pendingPayments.length} Pending
                  </span>
                </div>
              }
              subtitle="Review Hospital UTR transaction reference numbers submitted via QR code and activate/upgrade subscription plans."
            />
            <CardContent className="p-4">
              {pendingPayments.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs bg-white/80 rounded-xl border border-amber-200/60">
                  <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="font-bold text-slate-800">No Pending QR Payments</p>
                  <p className="text-slate-500 mt-0.5">All submitted UTR numbers have been verified and processed by Superadmin.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-amber-200 bg-amber-100/60 text-slate-800 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Hospital Facility</th>
                        <th className="px-4 py-3">Submitted UTR / Transaction No.</th>
                        <th className="px-4 py-3">Receipt Screenshot</th>
                        <th className="px-4 py-3">Requested Plan & Amount</th>
                        <th className="px-4 py-3">Applied Coupon</th>
                        <th className="px-4 py-3">Submission Date</th>
                        <th className="px-4 py-3 text-right">Superadmin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingPayments.map((sub) => {
                        const hosp = hospitals.find((h) => h.id === sub.hospitalId);

                        return (
                          <tr key={sub.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-900">{hosp?.name || sub.hospitalId}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{sub.hospitalId}</p>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-mono font-bold border border-amber-300 text-xs select-all">
                                UTR: {sub.utrNumber}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              {sub.paymentScreenshot ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewScreenshotUrl(sub.paymentScreenshot || null)}
                                  className="group flex items-center gap-2 cursor-pointer hover:opacity-90 transition-all text-left"
                                >
                                  <img
                                    src={sub.paymentScreenshot}
                                    alt="Payment Screenshot"
                                    className="w-10 h-10 object-cover rounded-lg border border-amber-300 shadow-xs group-hover:ring-2 group-hover:ring-teal-500 bg-slate-900 shrink-0"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-teal-700 group-hover:underline flex items-center gap-1">
                                      <Eye className="w-3.5 h-3.5" /> View Receipt
                                    </span>
                                    <span className="text-[9px] text-slate-400">Attached</span>
                                  </div>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No receipt attached</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              <p className="font-bold text-indigo-700 capitalize">{sub.requestedTier || sub.planTier} Tier</p>
                              <p className="text-xs font-black text-emerald-600">₹{sub.amount?.toLocaleString('en-IN')}</p>
                            </td>

                            <td className="px-4 py-3.5">
                              {sub.appliedCoupon ? (
                                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold text-[10px]">
                                  {sub.appliedCoupon}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">None</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                              {sub.paymentSubmittedAt ? new Date(sub.paymentSubmittedAt).toLocaleString() : 'Recent'}
                            </td>

                            <td className="px-4 py-3.5 text-right space-x-2">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  MockStorage.rejectSubscriptionUpgrade(sub.id);
                                  showToast('Payment Rejected', `Payment UTR ${sub.utrNumber} marked as invalid.`);
                                  refreshData();
                                }}
                                className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
                              >
                                Reject
                              </Button>
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => {
                                  MockStorage.approveSubscriptionUpgrade(sub.id);
                                  showToast('Subscription Activated', `Approved payment UTR ${sub.utrNumber}. ${hosp?.name || 'Hospital'} plan upgraded.`);
                                  refreshData();
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Verify & Approve
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

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

      {/* FULL RESOLUTION SCREENSHOT PREVIEW MODAL */}
      <Modal
        isOpen={Boolean(previewScreenshotUrl)}
        onClose={() => setPreviewScreenshotUrl(null)}
        title="Payment Receipt Proof Screenshot"
        subtitle="Full resolution image uploaded by Hospital Admin during plan upgrade submission"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="bg-slate-950 p-2 rounded-2xl flex items-center justify-center max-h-[70vh] overflow-auto border border-slate-800 shadow-inner">
            {previewScreenshotUrl && (
              <img
                src={previewScreenshotUrl}
                alt="Full Payment Receipt"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            )}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Verified against UPI / Banking Settlement</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewScreenshotUrl(null)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
