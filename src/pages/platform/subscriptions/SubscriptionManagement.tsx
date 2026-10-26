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
  Plus,
  Trash2,
  Tag,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { SubscriptionPlanTier, HospitalSubscription, BillingInterval, SubscriptionPlan, CouponCode } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { useNotification } from '../../../context/NotificationContext';

export const SubscriptionManagement: React.FC = () => {
  const { showToast } = useNotification();
  const [billingCycle, setBillingCycle] = useState<BillingInterval>('yearly');
  const [subscriptions, setSubscriptions] = useState<HospitalSubscription[]>(() => MockStorage.getSubscriptions());
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => MockStorage.getPlans());
  const hospitals = MockStorage.getHospitals();

  const [selectedSub, setSelectedSub] = useState<HospitalSubscription | null>(null);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [newTier, setNewTier] = useState<SubscriptionPlanTier>('enterprise');
  const [newInterval, setNewInterval] = useState<BillingInterval>('monthly');

  // Plan Management Modal State
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Billing Software Add-on Modal State
  const [isBillingAddonModalOpen, setIsBillingAddonModalOpen] = useState(false);
  const [addonDuration, setAddonDuration] = useState<'3_months' | '6_months' | '1_year'>('1_year');

  // Coupon Codes CRUD State
  const [coupons, setCoupons] = useState<CouponCode[]>(() => MockStorage.getCoupons());
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountPercentage: 50,
    description: '',
    validUntil: '2026-12-31',
    maxUses: 100,
  });

  const refreshData = () => {
    setSubscriptions(MockStorage.getSubscriptions());
    setPlans(MockStorage.getPlans());
    setCoupons(MockStorage.getCoupons());
  };

  const handleOpenCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      discountPercentage: 50,
      description: 'Special platform promotional discount for hospital subscription plans.',
      validUntil: '2026-12-31',
      maxUses: 100,
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (coupon: CouponCode) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      description: coupon.description,
      validUntil: coupon.validUntil || '2026-12-31',
      maxUses: coupon.maxUses || 100,
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      showToast('Validation Error', 'Please enter a coupon code.', 'error');
      return;
    }

    const couponToSave: CouponCode = {
      id: editingCoupon ? editingCoupon.id : `COUPON-${Date.now()}`,
      code: couponForm.code.trim().replace(/\s+/g, '_'),
      discountPercentage: Number(couponForm.discountPercentage),
      description: couponForm.description,
      isActive: editingCoupon ? editingCoupon.isActive : true,
      validUntil: couponForm.validUntil,
      maxUses: Number(couponForm.maxUses),
      usedCount: editingCoupon ? editingCoupon.usedCount : 0,
      createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString().split('T')[0],
    };

    MockStorage.saveCoupon(couponToSave);
    showToast(
      editingCoupon ? 'Coupon Code Updated' : 'New Coupon Code Created',
      `Coupon "${couponToSave.code}" with ${couponToSave.discountPercentage}% discount is now ${couponToSave.isActive ? 'ACTIVE' : 'INACTIVE'}.`
    );
    setIsCouponModalOpen(false);
    refreshData();
  };

  const handleDeleteCouponClick = (id: string, code: string) => {
    MockStorage.deleteCoupon(id);
    showToast('Coupon Deleted', `Promotional code ${code} has been deleted.`);
    refreshData();
  };

  const handleToggleCouponStatus = (coupon: CouponCode) => {
    const updated = { ...coupon, isActive: !coupon.isActive };
    MockStorage.saveCoupon(updated);
    showToast(
      'Status Changed',
      `Coupon ${coupon.code} is now ${updated.isActive ? 'ACTIVE (Usable by Hospitals)' : 'DISABLED (Inactive)'}.`
    );
    refreshData();
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan, features: [...plan.features] });
    setNewFeatureInput('');
    setIsEditPlanModalOpen(true);
  };

  const handleTogglePlanStatus = (plan: SubscriptionPlan) => {
    const updated = { ...plan, isActive: plan.isActive === false ? true : false };
    MockStorage.savePlan(updated);
    showToast(
      'Plan Status Changed',
      `${plan.name} tier is now ${updated.isActive ? 'ENABLED (Active for hospitals)' : 'DISABLED (Hidden from hospital purchase)'}.`
    );
    refreshData();
  };

  const handleSavePlanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      if (editingPlan.tier === 'trial' && editingPlan.trialDays) {
        const settings = MockStorage.getPlatformSettings();
        MockStorage.savePlatformSettings({ ...settings, allowTrialDays: editingPlan.trialDays });
        editingPlan.name = `${editingPlan.trialDays}-Day Free Trial`;
        editingPlan.tagline = `Zero-cost ${editingPlan.trialDays}-day full platform trial provisioned automatically on hospital registration.`;
      }
      MockStorage.savePlan(editingPlan);
      showToast('Plan Customized', `${editingPlan.name} features, limits, and pricing have been updated.`);
      setIsEditPlanModalOpen(false);
      refreshData();
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeatureInput.trim()],
    });
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, idx) => idx !== index),
    });
  };

  const handleOpenUpgrade = (sub: HospitalSubscription) => {
    setSelectedSub(sub);
    setNewTier(sub.planTier);
    setNewInterval(sub.interval || 'monthly');
    setIsUpgradeModalOpen(true);
  };

  const handleSaveUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSub) {
      const plan = plans.find((p) => p.tier === newTier);
      const isPaid = newTier !== 'trial';
      const amount = newInterval === 'yearly' ? (plan?.priceYearly || 49990) : (plan?.priceMonthly || 4999);
      const now = new Date();
      const nowStr = now.toISOString().split('T')[0];

      // Calculate renewal date based on selected interval (1 month for monthly, 1 year for yearly)
      const renewalDateObj = new Date(now);
      if (newInterval === 'yearly') {
        renewalDateObj.setFullYear(renewalDateObj.getFullYear() + 1);
      } else {
        renewalDateObj.setMonth(renewalDateObj.getMonth() + 1);
      }

      const updated: HospitalSubscription = {
        ...selectedSub,
        planTier: newTier,
        planName: plan?.name || 'Professional Hospital',
        interval: newInterval,
        amount,
        upgradedDate: nowStr,
        activatedDate: selectedSub.activatedDate || nowStr,
        renewalDate: renewalDateObj.toISOString().split('T')[0],
        status: isPaid ? (selectedSub.status === 'trialing' ? 'active' : selectedSub.status) : 'trialing',
        paymentMethod: isPaid && selectedSub.paymentMethod?.toLowerCase().includes('trial')
          ? 'UPI QR Code'
          : (!isPaid && !selectedSub.paymentMethod?.toLowerCase().includes('trial')
            ? '7-Day Free Trial'
            : selectedSub.paymentMethod),
      };
      MockStorage.saveSubscription(updated);

      // Also update hospital record with plan tier and capacity limits
      const hosp = MockStorage.getHospitalById(selectedSub.hospitalId);
      if (hosp) {
        hosp.planTier = newTier;
        if (plan) {
          hosp.totalBeds = plan.maxBeds;
          hosp.totalDoctors = plan.maxDoctors;
        }
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
              onClick={handleOpenCreateCoupon}
              leftIcon={<Tag className="w-3.5 h-3.5" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm"
            >
              + Create Coupon Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBillingAddonModalOpen(true)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              className="font-bold border-purple-200 text-purple-700 hover:bg-purple-50"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <span className="text-3xl sm:text-4xl font-black">₹{price.toLocaleString('en-IN')}</span>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant={plan.isPopular ? 'primary' : 'outline'}
                    size="md"
                    className="flex-1 font-bold"
                    onClick={() => handleOpenEditPlan(plan)}
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
                      <p className="font-bold text-slate-900">₹{sub.amount.toLocaleString('en-IN')}</p>
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

                    <td className="px-4 py-4 space-y-1">
                      {sub.paymentStatus === 'pending_approval' ? (
                        <div>
                          <Badge variant="warning" dot>Pending Approval</Badge>
                          <p className="text-[10px] text-amber-800 font-mono font-bold mt-0.5">UTR: {sub.utrNumber}</p>
                        </div>
                      ) : (
                        <>
                          {sub.status === 'active' && <Badge variant="success" dot>Active</Badge>}
                          {sub.status === 'trialing' && <Badge variant="cyan" dot>Trialing</Badge>}
                          {sub.status === 'past_due' && <Badge variant="warning" dot>Past Due</Badge>}
                          {sub.status === 'canceled' && <Badge variant="error" dot>Canceled</Badge>}
                        </>
                      )}
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

      {/* Promotional Coupon Codes Management Card (Super Admin Only) */}
      <Card>
        <CardHeader
          title="Promotional Coupon Codes & Discounts (Superadmin Only)"
          subtitle="Create, edit, enable/disable, or remove promo codes for hospital admins to redeem during subscription upgrades"
          action={
            <Button
              variant="primary"
              size="xs"
              onClick={handleOpenCreateCoupon}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-purple-600 hover:bg-purple-700 font-bold text-white"
            >
              Add Coupon
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-purple-50/50 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Coupon Code</th>
                <th className="px-4 py-3.5">Discount %</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Redemptions</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-400 italic">
                    No active coupon codes created yet. Click "+ Add Coupon" above to introduce discounts.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-mono font-bold text-sm text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded border border-purple-200">
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {coupon.discountPercentage}% OFF
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 max-w-xs truncate">
                      {coupon.description}
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-700">
                      <span className="font-bold text-slate-900">{coupon.usedCount}</span> / {coupon.maxUses || '∞'} uses
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleCouponStatus(coupon)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          coupon.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {coupon.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        {coupon.isActive ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEditCoupon(coupon)}
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleToggleCouponStatus(coupon)}
                          leftIcon={coupon.isActive ? <ToggleLeft className="w-3.5 h-3.5 text-amber-600" /> : <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />}
                          className={coupon.isActive ? "text-amber-700 border-amber-200 hover:bg-amber-50" : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"}
                        >
                          {coupon.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Coupon Modal */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title={editingCoupon ? `Edit Coupon Code: ${editingCoupon.code}` : 'Create New Promotional Coupon Code'}
        subtitle="Introduce discount codes visible & redeemable by Hospital Admins during plan purchase."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCouponSubmit} className="space-y-4">
          <Input
            label="Coupon Code (e.g. Happy_Hospital) *"
            placeholder="Happy_Hospital"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
            required
            className="font-mono uppercase font-bold"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Percentage (%) *</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={couponForm.discountPercentage}
                  onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: Number(e.target.value) })}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Redemptions</label>
              <input
                type="number"
                min="1"
                value={couponForm.maxUses}
                onChange={(e) => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <Input
            label="Valid Until Date"
            type="date"
            value={couponForm.validUntil}
            onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Description & Offer Note</label>
            <textarea
              rows={2}
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
              placeholder="e.g. 50% Flat Launch Discount for newly onboarded hospital networks."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCouponModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700 font-bold">
              {editingCoupon ? 'Update Coupon Code' : 'Save & Publish Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit / Manage Plan Details & Features Modal */}
      <Modal
        isOpen={isEditPlanModalOpen}
        onClose={() => setIsEditPlanModalOpen(false)}
        title={`Manage ${editingPlan?.name || 'Plan'} Details & Features`}
        subtitle="Edit tier pricing, resource capacity limits, and turn features on or off."
        maxWidth="lg"
      >
        {editingPlan && (
          <form onSubmit={handleSavePlanEdit} className="space-y-5">
            {/* Plan Enable/Disable Availability Banner */}
            <div className="flex items-center justify-between p-3.5 bg-purple-50/80 rounded-xl border border-purple-200">
              <div>
                <h4 className="text-xs font-bold text-purple-950 flex items-center gap-2">
                  <span>Plan Availability Status</span>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full uppercase ${
                    editingPlan.isActive !== false ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                  }`}>
                    {editingPlan.isActive !== false ? 'ENABLED (ACTIVE)' : 'DISABLED (INACTIVE)'}
                  </span>
                </h4>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Toggle whether this subscription tier is active and visible for hospital onboarding & upgrades.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan({ ...editingPlan, isActive: editingPlan.isActive === false ? true : false })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  editingPlan.isActive !== false
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                }`}
              >
                {editingPlan.isActive !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {editingPlan.isActive !== false ? 'DISABLE PLAN' : 'ENABLE PLAN'}
              </button>
            </div>

            {/* Trial Plan Validity Config */}
            {editingPlan.tier === 'trial' && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <label className="block text-xs font-bold text-amber-950">
                  Trial Plan Validity Period (in Days) *
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={editingPlan.trialDays || MockStorage.getTrialDays()}
                      onChange={(e) => {
                        const days = Math.max(1, Number(e.target.value));
                        setEditingPlan({
                          ...editingPlan,
                          trialDays: days,
                          name: `${days}-Day Free Trial`,
                          tagline: `Zero-cost ${days}-day full platform trial provisioned automatically on hospital registration.`,
                        });
                      }}
                      required
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">Days</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-snug">
                    Hospitals on trial get zero-cost access for this number of days. Once validity expires, trial access is automatically disabled.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Plan Display Name"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                required
              />
              <Input
                label="Tagline / Summary"
                value={editingPlan.tagline}
                onChange={(e) => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Monthly (₹)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold"
                  value={editingPlan.priceMonthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Yearly (₹)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold"
                  value={editingPlan.priceYearly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Max Patients</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold"
                  value={editingPlan.maxPatients}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxPatients: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Max Doctors</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold"
                  value={editingPlan.maxDoctors}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxDoctors: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Features Management Section with Catalog Helper and Enable/Disable Toggles */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Plan Included Features & Capabilities</h4>
                  <p className="text-[11px] text-slate-500">Enable or disable specific features for this tier or pick from the recommended platform feature catalog.</p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono">
                  {editingPlan.features.length} active
                </span>
              </div>

              {/* Recommended Feature Catalog Picker for Superadmin */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Catalog of Available Features to Add
                  </span>
                  <span className="text-[10px] text-purple-600 font-semibold">Select to instantly add to plan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {[
                    { title: 'Multi-Department Management', desc: 'Manage OPD, IPD, ICU, Pharmacy, Pathology, and ER seamlessly.' },
                    { title: 'OPD Consultation Scheduling', desc: 'Doctor slot booking, token queueing, and prescriptions.' },
                    { title: 'IPD Bed & Ward Allocation System', desc: 'Real-time bed tracking, admission workflows, and daily round notes.' },
                    { title: 'Electronic Health Records (EHR)', desc: 'Secure cloud patient medical records and diagnostic history.' },
                    { title: 'Integrated Pharmacy & Dispensary', desc: 'Batch & expiry tracking, POS billing, and inventory alerts.' },
                    { title: 'Pathology & Radiology Lab Automation', desc: 'Test ordering, sample tracking, and automated PDF lab reports.' },
                    { title: 'Ambulance Fleet & Driver Dispatch', desc: '911 Emergency dispatch, driver tracking, and trip billing.' },
                    { title: 'GST Billing & Tax Invoices', desc: 'Multi-line item billing, payment gateways, and GST compliance.' },
                    { title: 'SMS & WhatsApp Patient Reminders', desc: 'Automated appointment and prescription alerts to patients.' },
                    { title: 'Custom Domain & Dynamic Website Builder', desc: 'Dedicated public hospital website with custom domain support.' },
                    { title: 'Advanced Financial Audit & CSV Reports', desc: 'Export billing, collection reports, and departmental revenue metrics.' },
                    { title: '24/7 Priority Telephonic SLA Support', desc: 'Dedicated account manager with 4-hour response SLA.' },
                  ].map((catItem, cIdx) => {
                    const alreadyAdded = editingPlan.features.includes(catItem.title);
                    return (
                      <div
                        key={cIdx}
                        className={`p-2 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                          alreadyAdded
                            ? 'bg-slate-100 border-slate-200 opacity-60'
                            : 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{catItem.title}</span>
                            {alreadyAdded ? (
                              <span className="text-[9px] text-slate-500 font-normal">Added</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!alreadyAdded) {
                                    setEditingPlan({
                                      ...editingPlan,
                                      features: [...editingPlan.features, catItem.title],
                                    });
                                  }
                                }}
                                className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded transition-colors"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{catItem.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Add Feature Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Or type a custom feature name & hit Enter..."
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddFeature}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="shrink-0 font-bold"
                >
                  Add Custom Feature
                </Button>
              </div>

              {/* Active Plan Features with Enable/Disable Controls */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-xl p-3 bg-white divide-y divide-slate-100">
                {editingPlan.features.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">No features configured for this plan. Select from the catalog above.</p>
                ) : (
                  editingPlan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 pt-2 first:pt-0">
                      <div className="flex items-center gap-2 flex-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const updatedFeats = [...editingPlan.features];
                            updatedFeats[idx] = e.target.value;
                            setEditingPlan({ ...editingPlan, features: updatedFeats });
                          }}
                          className="w-full text-xs font-medium text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 px-2 py-1 rounded transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="px-2 py-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          title="Disable feature for this plan tier"
                        >
                          <ToggleLeft className="w-3.5 h-3.5" />
                          Disable
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditPlanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Plan Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Upgrade / Change Plan Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Modify Hospital Subscription"
        subtitle="Upgrade or adjust tier allocation for this facility"
        maxWidth="md"
      >
        <form onSubmit={handleSaveUpgrade} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div>
              <span className="text-slate-500">Target Hospital:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {hospitals.find((h) => h.id === selectedSub?.hospitalId)?.name || selectedSub?.hospitalId}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block">Upgraded / Activated Date:</span>
                <span className="font-bold text-teal-700">
                  {selectedSub?.upgradedDate || selectedSub?.activatedDate || selectedSub?.startDate || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Renewal Date:</span>
                <span className="font-bold text-slate-800">{selectedSub?.renewalDate || '—'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Select Subscription Tier"
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as SubscriptionPlanTier)}
            >
              <option value="basic">Starter Clinic (₹4,999/mo or ₹49,990/yr)</option>
              <option value="standard">Professional Hospital (₹14,999/mo or ₹149,990/yr)</option>
              <option value="enterprise">Enterprise Health Network (₹29,999/mo or ₹299,990/yr)</option>
            </Select>

            <Select
              label="Billing Interval"
              value={newInterval}
              onChange={(e) => setNewInterval(e.target.value as BillingInterval)}
            >
              <option value="monthly">Monthly (1 Month Cycle)</option>
              <option value="yearly">Yearly (1 Year Cycle)</option>
            </Select>
          </div>

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

      {/* Receipt Screenshot Preview Modal */}
      <Modal
        isOpen={Boolean(previewScreenshotUrl)}
        onClose={() => setPreviewScreenshotUrl(null)}
        title="Payment Receipt Screenshot"
        subtitle="Submitted proof of payment transfer for subscription verification"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {previewScreenshotUrl && (
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-2 flex items-center justify-center">
              <img
                src={previewScreenshotUrl}
                alt="Payment Receipt Full View"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewScreenshotUrl(null)}>
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
