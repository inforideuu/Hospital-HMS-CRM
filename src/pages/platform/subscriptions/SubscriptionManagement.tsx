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
  Clock,
  Lock,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { SubscriptionPlanTier, HospitalSubscription, BillingInterval, SubscriptionPlan, CouponCode, CouponCategory } from '../../../types';
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

  // Billing Software Add-on Modal State
  const [isBillingAddonModalOpen, setIsBillingAddonModalOpen] = useState(false);
  const [addonDuration, setAddonDuration] = useState<'3_months' | '6_months' | '1_year'>('1_year');

  // Coupon Codes CRUD State
  const [coupons, setCoupons] = useState<CouponCode[]>(() => MockStorage.getCoupons());
  const [couponCategoryFilter, setCouponCategoryFilter] = useState<'all' | 'subscription' | 'billing_software'>('all');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountPercentage: 50,
    category: 'subscription' as CouponCategory,
    description: '',
    validUntil: '2026-12-31',
    maxUses: undefined as number | undefined,
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
      category: 'subscription',
      description: 'Special platform promotional discount for hospital subscription plans.',
      validUntil: '2026-12-31',
      maxUses: undefined,
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (coupon: CouponCode) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      category: coupon.category || 'subscription',
      description: coupon.description,
      validUntil: coupon.validUntil || '2026-12-31',
      maxUses: coupon.maxUses,
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
      category: couponForm.category,
      description: couponForm.description,
      isActive: editingCoupon ? editingCoupon.isActive : true,
      validUntil: couponForm.validUntil,
      maxUses: Number(couponForm.maxUses),
      usedCount: editingCoupon ? (editingCoupon.usedCount || 0) : 0,
      usedByHospitals: editingCoupon ? (editingCoupon.usedByHospitals || []) : [],
      createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString().split('T')[0],
    };

    MockStorage.saveCoupon(couponToSave);
    showToast(
      editingCoupon ? 'Coupon Code Updated' : 'New Coupon Code Created',
      `Coupon "${couponToSave.code}" (${couponToSave.category === 'billing_software' ? 'Billing Software' : 'HMS Subscription'}) with ${couponToSave.discountPercentage}% discount is now ${couponToSave.isActive ? 'ACTIVE' : 'INACTIVE'}.`
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
    const cleanFeatures = (plan.features || []).filter(
      (f) =>
        !f.toLowerCase().includes('sms') &&
        !f.toLowerCase().includes('whatsapp') &&
        !f.toLowerCase().includes('email support') &&
        !f.toLowerCase().includes('standard email')
    );
    setEditingPlan({ ...plan, features: cleanFeatures });
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
      showToast('Plan Customized', `${editingPlan.name} configuration, capacities, and pricing have been updated.`);
      setIsEditPlanModalOpen(false);
      refreshData();
    }
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
               Create Coupon Code
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
                    <span>Max Patient EHR:</span>
                    <span className="font-bold">{plan.maxPatients.toLocaleString()} Patients</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inpatient Beds:</span>
                    <span className="font-bold">{plan.tier === 'basic' || !plan.maxBeds ? '0 Beds (OPD Only)' : `${plan.maxBeds} Beds`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Staff Members:</span>
                    <span className="font-bold">{plan.maxStaff} Staff</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Specialist Doctors:</span>
                    <span className="font-bold">{plan.maxDoctors} Docs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cloud Storage Vault:</span>
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
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1120px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 pl-6 pr-4 min-w-[240px]">Hospital Workspace</th>
                <th className="py-3.5 px-4 min-w-[160px]">Plan Tier</th>
                <th className="py-3.5 px-4 min-w-[140px]">Cycle & Amount</th>
                <th className="py-3.5 px-4 min-w-[170px]">Plan Activated Date</th>
                <th className="py-3.5 px-4 min-w-[140px]">Renewal Date</th>
                <th className="py-3.5 px-4 min-w-[140px]">Status</th>
                <th className="py-3.5 pr-6 pl-4 text-right min-w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                // Deduplicate subscriptions strictly per hospital (keeping latest / upgraded subscription)
                const dedupedSubs = subscriptions.reduce<HospitalSubscription[]>((acc, sub) => {
                  const existingIdx = acc.findIndex((s) => MockStorage.matchHospitalId(s.hospitalId, sub.hospitalId));
                  if (existingIdx === -1) {
                    acc.push(sub);
                  } else {
                    const existing = acc[existingIdx];
                    if (sub.paymentStatus === 'pending_approval' && existing.paymentStatus !== 'pending_approval') {
                      acc[existingIdx] = sub;
                    } else if (existing.paymentStatus !== 'pending_approval') {
                      const subDate = sub.upgradedDate || sub.activatedDate || sub.startDate || '';
                      const existDate = existing.upgradedDate || existing.activatedDate || existing.startDate || '';
                      if (Boolean(sub.upgradedDate) && !Boolean(existing.upgradedDate)) {
                        acc[existingIdx] = sub;
                      } else if (subDate >= existDate) {
                        acc[existingIdx] = sub;
                      }
                    }
                  }
                  return acc;
                }, []);

                return dedupedSubs.map((sub) => {
                  const hosp = hospitals.find((h) => h.id === sub.hospitalId || MockStorage.matchHospitalId(h.id, sub.hospitalId));

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 pl-6 pr-4 align-top">
                        <p className="font-bold text-slate-900 leading-tight text-sm">{hosp?.name || sub.hospitalId}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">{sub.hospitalId} • {sub.paymentMethod}</p>
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <span className="capitalize px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block">
                          {sub.planName}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <p className="font-bold text-slate-900 text-sm">₹{sub.amount.toLocaleString('en-IN')}</p>
                        <p className="text-[11px] text-slate-500 capitalize mt-0.5">{sub.interval} interval</p>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-semibold text-slate-800 text-xs">
                            {sub.upgradedDate || sub.activatedDate || sub.startDate || '—'}
                          </span>
                        </div>
                        <p className="text-[10px] text-teal-700 font-medium flex items-center gap-1 mt-1">
                          <Sparkles className="w-3 h-3 text-teal-500 shrink-0" />
                          {sub.upgradedDate ? 'Plan Upgraded' : sub.status === 'trialing' ? 'Trial Started' : 'Plan Activated'}
                        </p>
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <p className="font-semibold text-slate-800 text-xs">{sub.renewalDate}</p>
                      </td>

                      <td className="py-4 px-4 align-top space-y-1">
                        {sub.paymentStatus === 'pending_approval' ? (
                          <div>
                            <Badge variant="warning" dot>Pending Approval</Badge>
                            <p className="text-[10px] text-amber-800 font-mono font-bold mt-1">UTR: {sub.utrNumber}</p>
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

                      <td className="py-4 pr-6 pl-4 text-right align-top whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenUpgrade(sub)}
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                          className="font-medium"
                        >
                          Change Tier
                        </Button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Promotional Coupon Codes Management Card (Super Admin Only) */}
      <Card>
        <CardHeader
          title="Promotional Coupon Codes & Discounts (Superadmin Only)"
          subtitle="Create, edit, enable/disable, or remove promo codes for hospital admins to redeem during subscription upgrades or billing software"
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
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCouponCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                couponCategoryFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Categories ({coupons.length})
            </button>
            <button
              type="button"
              onClick={() => setCouponCategoryFilter('subscription')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                couponCategoryFilter === 'subscription'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              HMS Subscriptions ({coupons.filter((c) => (c.category || 'subscription') === 'subscription').length})
            </button>
            <button
              type="button"
              onClick={() => setCouponCategoryFilter('billing_software')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                couponCategoryFilter === 'billing_software'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Billing Software ({coupons.filter((c) => c.category === 'billing_software').length})
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            💡 Billing software coupons are dummy coupons reserved for external partner software.
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1180px]">
            <thead>
              <tr className="border-b border-purple-200 bg-purple-50/80 text-purple-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 pl-6 pr-4 min-w-[200px]">Coupon Code</th>
                <th className="py-3.5 px-4 min-w-[160px]">Category & Scope</th>
                <th className="py-3.5 px-4 min-w-[110px]">Discount</th>
                <th className="py-3.5 px-4 min-w-[260px]">Description & Notes</th>
                <th className="py-3.5 px-4 min-w-[180px]">Hospitals Redeemed</th>
                <th className="py-3.5 px-4 min-w-[130px]">Status</th>
                <th className="py-3.5 pr-6 pl-4 text-right min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.filter((c) => {
                if (couponCategoryFilter === 'all') return true;
                return (c.category || 'subscription') === couponCategoryFilter;
              }).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                    No matching coupon codes found for the selected category.
                  </td>
                </tr>
              ) : (
                coupons
                  .filter((c) => {
                    if (couponCategoryFilter === 'all') return true;
                    return (c.category || 'subscription') === couponCategoryFilter;
                  })
                  .map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 pl-6 pr-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-2xs">
                            <Tag className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-xs text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200 inline-block">
                              {coupon.code}
                            </span>
                            {coupon.validUntil && (
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                Valid until: {coupon.validUntil}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {(coupon.category || 'subscription') === 'billing_software' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            Billing Software 
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            HMS & CRM Tier
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <span className="inline-flex items-center text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          {coupon.discountPercentage}% OFF
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-sm">
                          {coupon.description || 'Promotional subscription discount.'}
                        </p>
                        {coupon.maxUses && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Cap: Max {coupon.maxUses} total redemptions
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50/80 border border-purple-200/60 text-purple-900 font-bold text-xs">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{coupon.usedByHospitals?.length ?? (coupon.usedCount || 0)}</span>
                          <span className="text-[11px] font-medium text-purple-700">
                            {(coupon.usedByHospitals?.length ?? (coupon.usedCount || 0)) === 1 ? 'Hospital' : 'Hospitals'}
                          </span>
                        </div>
                        {coupon.usedByHospitals && coupon.usedByHospitals.length > 0 ? (
                          <div
                            className="text-[10px] text-purple-700 mt-1 font-mono truncate max-w-[170px]"
                            title={`Redeemed by: ${coupon.usedByHospitals.join(', ')} (1 redemption per hospital)`}
                          >
                            {coupon.usedByHospitals.join(', ')}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-1">
                            No redemptions yet
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleCouponStatus(coupon)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            coupon.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {coupon.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                          <span>{coupon.isActive ? 'ACTIVE' : 'DISABLED'}</span>
                        </button>
                      </td>

                      <td className="py-4 pr-6 pl-4 text-right align-top whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenEditCoupon(coupon)}
                            leftIcon={<Edit className="w-3.5 h-3.5" />}
                            className="font-medium"
                          >
                            Edit
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete promotional coupon "${coupon.code}"?`)) {
                                handleDeleteCouponClick(coupon.id, coupon.code);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer ml-1"
                            title="Delete coupon permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        subtitle="Introduce discount codes for Hospital HMS & CRM subscriptions or external Billing Software suite."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCouponSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Category / Target Software *</label>
            <select
              value={couponForm.category}
              onChange={(e) => setCouponForm({ ...couponForm, category: e.target.value as CouponCategory })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="subscription">Hospital HMS & CRM Subscription (Active Discount)</option>
              <option value="billing_software">Billing Software Suite (External Partner Project)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {couponForm.category === 'subscription'
                ? 'Applies discount to Hospital HMS & CRM tier purchases and renewals.'
                : 'Dummy discount code reserved for external standalone billing software (will be blocked from HMS & CRM subscriptions).'}
            </p>
          </div>

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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Redemption Cap (Optional)</label>
              <input
                type="number"
                min="1"
                placeholder="No limit (leave blank)"
                value={couponForm.maxUses !== undefined && couponForm.maxUses !== null ? couponForm.maxUses : ''}
                onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value ? Number(e.target.value) : undefined })}
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

            {/* Pricing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Monthly Pricing (₹)"
                type="number"
                value={editingPlan.priceMonthly}
                onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                required
              />
              <Input
                label="Yearly Pricing (₹)"
                type="number"
                value={editingPlan.priceYearly}
                onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                required
              />
            </div>

            {/* Plan Limit & Allocation Configuration */}
            <div className="space-y-3 pt-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Plan Resource Capacity & Operational Limits
                </h4>
                <p className="text-[11px] text-slate-500">
                  Configure the exact operational quotas for this hospital plan tier.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Max Patient EHR <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    value={editingPlan.maxPatients}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxPatients: Number(e.target.value) })}
                    placeholder="e.g. 5000"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Digital patient records quota</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Inpatient Beds <span className="text-red-500">*</span>
                  </label>
                  {editingPlan.tier === 'basic' ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>0 Beds (Outpatient OPD Clinic Only)</span>
                      </div>
                      <p className="text-[10px] text-amber-800 mt-1 leading-snug">
                        Starter Clinic is strictly locked to outpatient care. Inpatient admissions, wards & beds are restricted by design (0 Beds).
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                        value={editingPlan.maxBeds}
                        onChange={(e) => setEditingPlan({ ...editingPlan, maxBeds: Number(e.target.value) })}
                        placeholder="e.g. 100"
                        required
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">Ward/ICU bed allocation</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Max Staff Members <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    value={editingPlan.maxStaff}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxStaff: Number(e.target.value) })}
                    placeholder="e.g. 50"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Nurses, receptionists & staff</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Doctors</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editingPlan.maxDoctors}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxDoctors: Number(e.target.value) })}
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Specialists & consulting doctors</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cloud Storage Vault (GB)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editingPlan.storageGB}
                    onChange={(e) => setEditingPlan({ ...editingPlan, storageGB: Number(e.target.value) })}
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Lab scans & PACS vault size</p>
                </div>
              </div>
            </div>

            {/* Active Plan Features Management */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Plan Included Features & Capabilities</h4>
                  <p className="text-[11px] text-slate-500">Active capabilities provisioned for hospitals on this subscription tier.</p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono">
                  {editingPlan.features.length} active
                </span>
              </div>

              {/* Active Plan Features with Remove Controls */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-xl p-3 bg-white divide-y divide-slate-100">
                {editingPlan.features.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">No features configured for this plan.</p>
                ) : (
                  editingPlan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 pt-2 first:pt-0">
                      <div className="flex items-center gap-2 flex-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-xs font-medium text-slate-800">{feat}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          title="Remove feature from plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
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
