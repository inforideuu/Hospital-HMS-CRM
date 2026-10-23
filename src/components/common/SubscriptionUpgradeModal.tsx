import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Check, ShieldCheck, AlertCircle, Copy, Clock, CreditCard, Sparkles, Zap, ArrowRight, ArrowLeft, Tag, Percent, Gift, Upload, Image as ImageIcon, Eye, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MockStorage } from '../../services/mockStorage';
import { SubscriptionPlanTier, BillingInterval, CouponCode } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { BillingSoftwareAddonModal } from './BillingSoftwareAddonModal';
import { PlanCapabilityMatrix } from './PlanCapabilityMatrix';
import { compressImage } from '../../utils/imageCompressor';

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: string;
  hospitalName?: string;
  currentTier?: SubscriptionPlanTier;
}

export const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  isOpen,
  onClose,
  hospitalId,
  hospitalName,
  currentTier = 'basic',
}) => {
  const { showToast } = useNotification();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTier, setSelectedTier] = useState<SubscriptionPlanTier>('standard');
  const [billingCycle, setBillingCycle] = useState<BillingInterval>('monthly');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [isCompressingScreenshot, setIsCompressingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercentage: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [showCapabilityMatrix, setShowCapabilityMatrix] = useState(false);

  // Fetch active promotional coupons created by Superadmin
  const allCoupons = MockStorage.getCoupons();
  const activeCoupons = allCoupons.filter(
    (c) => c.isActive && (!c.validUntil || new Date(c.validUntil) >= new Date()) && (!c.maxUses || (c.usedCount || 0) < c.maxUses)
  );

  // Reset step to 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUtrNumber('');
      setPaymentScreenshot('');
    }
  }, [isOpen]);

  // Controlled by Super Admin in Platform Settings
  const isAddonEnabled = MockStorage.getPlatformSettings().enableBillingAddonModule !== false;

  const plans = MockStorage.getPlans();

  const currentPlanObj = plans.find((p) => p.tier === selectedTier) || plans[1];
  const basePrice = billingCycle === 'yearly' ? currentPlanObj.priceYearly : currentPlanObj.priceMonthly;
  const activePrice = appliedCoupon
    ? Math.round(basePrice * (1 - appliedCoupon.discountPercentage / 100))
    : basePrice;

  const upiId = 'pulsecore.billing@upi';
  const upiString = `upi://pay?pa=${upiId}&pn=PulseCore+SaaS&am=${activePrice}&cu=INR&tn=Sub_${hospitalId}`;

  const handleApplyCoupon = () => {
    if (!couponCodeInput.trim()) return;
    const res = MockStorage.validateCoupon(couponCodeInput.trim(), hospitalId);
    if (res.valid && res.discountPercentage) {
      setAppliedCoupon({ code: res.coupon?.code || couponCodeInput.trim().toUpperCase(), discountPercentage: res.discountPercentage });
      setCouponError('');
      showToast('Coupon Applied!', `${res.discountPercentage}% discount has been applied to your plan price.`, 'success');
    } else {
      setCouponError(res.message || 'Invalid coupon code');
      showToast('Invalid Coupon', res.message || 'The coupon code is invalid or expired.', 'error');
    }
  };

  const handleSelectCouponObj = (coupon: CouponCode) => {
    const res = MockStorage.validateCoupon(coupon.code, hospitalId);
    if (res.valid && res.discountPercentage) {
      setAppliedCoupon({ code: coupon.code, discountPercentage: res.discountPercentage });
      setCouponCodeInput(coupon.code);
      setCouponError('');
      showToast('Coupon Applied!', `Superadmin coupon "${coupon.code}" (${res.discountPercentage}% OFF) applied.`, 'success');
    } else {
      setCouponError(res.message || 'Unable to apply coupon');
      showToast('Coupon Error', res.message || 'The coupon code is invalid or expired.', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  const handleProceedToStep2 = () => {
    if (selectedTier === 'trial') {
      showToast('Action Not Allowed', 'Trial plan cannot be renewed. Please select a commercial subscription tier.', 'error');
      return;
    }
    const plan = plans.find((p) => p.tier === selectedTier);
    if (plan && plan.isActive === false) {
      showToast('Plan Unavailable', `${plan.name} is currently disabled by superadmin.`, 'warning');
      return;
    }
    setStep(2);
  };

  const handleProceedToStep3 = () => {
    setStep(3);
  };

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File Type', 'Please upload an image file (PNG, JPG, or WEBP).', 'error');
      return;
    }

    try {
      setIsCompressingScreenshot(true);
      const compressed = await compressImage(file, 900, 900, 0.75);
      setPaymentScreenshot(compressed);
      showToast('Screenshot Attached', 'Payment receipt screenshot uploaded successfully.', 'success');
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        setPaymentScreenshot(reader.result as string);
        showToast('Screenshot Attached', 'Payment receipt screenshot uploaded.', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingScreenshot(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseSampleScreenshot = () => {
    const sampleReceiptSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="100%" height="100%" fill="%230f172a"/><rect x="16" y="16" width="568" height="348" rx="14" fill="%231e293b" stroke="%2314b8a6" stroke-width="2"/><circle cx="60" cy="65" r="24" fill="%230d9488"/><path d="M50 65l6 6 14-14" stroke="%23ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="100" y="60" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23ffffff">Payment Successful</text><text x="100" y="80" font-family="sans-serif" font-size="12" fill="%2394a3b8">PulseCore SaaS Hospital Commercial Billing</text><line x1="36" y1="110" x2="564" y2="110" stroke="%23334155" stroke-width="1"/><text x="40" y="150" font-family="sans-serif" font-size="13" fill="%2394a3b8">Amount Transferred:</text><text x="210" y="150" font-family="sans-serif" font-size="20" font-weight="bold" fill="%2310b981">₹${activePrice.toLocaleString('en-IN')}</text><text x="40" y="195" font-family="monospace" font-size="13" fill="%2394a3b8">UTR / Ref Number:</text><text x="210" y="195" font-family="monospace" font-size="14" font-weight="bold" fill="%2338bdf8">${utrNumber || 'UTR984729104820'}</text><text x="40" y="240" font-family="sans-serif" font-size="13" fill="%2394a3b8">Plan Selected:</text><text x="210" y="240" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc">${currentPlanObj.name}</text><text x="40" y="285" font-family="sans-serif" font-size="13" fill="%2394a3b8">Payment Mode:</text><text x="210" y="285" font-family="sans-serif" font-size="13" fill="%23e2e8f0">UPI Instant Settlement</text><text x="40" y="325" font-family="sans-serif" font-size="13" fill="%2394a3b8">Timestamp:</text><text x="210" y="325" font-family="sans-serif" font-size="13" fill="%23e2e8f0">${new Date().toLocaleString()}</text></svg>`;
    setPaymentScreenshot(sampleReceiptSvg);
    if (!utrNumber) {
      setUtrNumber('UTR' + Math.floor(100000000000 + Math.random() * 900000000000));
    }
    showToast('Sample Receipt Attached', 'Sample payment completed screenshot loaded.', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTier === 'trial') {
      showToast('Action Not Allowed', 'Trial plan cannot be renewed. Please select a commercial subscription tier.', 'error');
      return;
    }
    if (!utrNumber.trim()) {
      showToast('Validation Error', 'Please enter your payment UTR / Transaction Reference Number', 'error');
      return;
    }
    if (!paymentScreenshot) {
      showToast('Screenshot Required', 'Please attach a screenshot of your completed payment receipt.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      MockStorage.requestSubscriptionUpgrade(
        hospitalId,
        selectedTier,
        activePrice,
        utrNumber.trim(),
        appliedCoupon?.code,
        appliedCoupon ? basePrice : undefined,
        paymentScreenshot,
        billingCycle
      );
      showToast(
        'Payment Submitted for Approval',
        `UTR ${utrNumber} with payment screenshot submitted for ₹${activePrice.toLocaleString('en-IN')}${appliedCoupon ? ` (${appliedCoupon.discountPercentage}% OFF)` : ''}. Superadmin will verify receipt and activate your ${currentPlanObj.name} subscription.`
      );
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Upgrade Hospital Subscription Plan"
        subtitle="Complete the 3-step payment flow to upgrade your facility's SaaS commercial tier."
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Progressive Step Progress Indicator */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            {/* Step 1 Indicator */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                step === 1 ? 'text-indigo-600 font-bold' : step > 1 ? 'text-emerald-600 font-bold' : 'text-slate-400'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-indigo-600 text-white shadow-sm' : step > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs leading-none">Step 1</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Select Tier</p>
              </div>
            </button>

            <div className={`flex-1 h-0.5 mx-3 transition-colors ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 2 Indicator */}
            <button
              type="button"
              onClick={() => { if (step > 1) setStep(2); }}
              disabled={step < 2}
              className={`flex items-center gap-2 transition-all ${
                step === 2
                  ? 'text-indigo-600 font-bold'
                  : step > 2
                  ? 'text-emerald-600 font-bold cursor-pointer'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? 'bg-indigo-600 text-white shadow-sm' : step > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs leading-none">Step 2</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Scan UPI QR</p>
              </div>
            </button>

            <div className={`flex-1 h-0.5 mx-3 transition-colors ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 3 Indicator */}
            <div
              className={`flex items-center gap-2 transition-all ${
                step === 3 ? 'text-indigo-600 font-bold' : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs leading-none">Step 3</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Enter UTR & Screenshot</p>
              </div>
            </div>
          </div>

          {/* STEP 1: CHOOSE SUBSCRIPTION TIER */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Step 1: Choose Commercial Subscription Tier</h4>
                  <p className="text-[11px] text-slate-500">Select preferred capacity limits, features & pricing tiers</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isAddonEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setIsAddonModalOpen(true)}
                      leftIcon={<Zap className="w-3 h-3 text-purple-600" />}
                      className="font-bold border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      + Add On (Billing Software)
                    </Button>
                  )}
                  <div className="inline-flex items-center p-1 rounded-lg bg-slate-200/70 border border-slate-300/60 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Annual</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-extrabold">Save 20%</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Plans Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedTier === plan.tier;
                  const isTrial = plan.priceMonthly === 0;
                  const isPopular = plan.isPopular;
                  const isDisabled = plan.isActive === false;
                  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        if (isDisabled) {
                          showToast('Plan Unavailable', `${plan.name} is currently disabled by superadmin.`, 'warning');
                          return;
                        }
                        if (isTrial) {
                          showToast('Trial Non-Renewable', 'Trial plans cannot be renewed. Please select a commercial plan.', 'warning');
                          return;
                        }
                        setSelectedTier(plan.tier);
                      }}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 relative ${
                        isDisabled || isTrial
                          ? 'bg-slate-100/80 text-slate-400 border-slate-200 cursor-not-allowed opacity-65'
                          : isSelected
                          ? 'bg-indigo-950 text-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/40 cursor-pointer'
                          : isPopular
                          ? 'bg-slate-900 text-white border-slate-700 shadow-md cursor-pointer'
                          : 'bg-white text-slate-900 border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] uppercase tracking-widest font-black px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-white" /> Selected Plan
                        </div>
                      )}
                      {!isSelected && isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 text-[9px] uppercase tracking-widest font-black px-3 py-0.5 rounded-full shadow-md">
                          Most Popular
                        </div>
                      )}
                      {isTrial && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] uppercase tracking-widest font-black px-3 py-0.5 rounded-full shadow-md">
                          Cannot Be Renewed
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5 pt-1">
                          <h5 className={`text-xs font-bold ${isSelected || isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h5>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold ${
                              isSelected
                                ? 'bg-indigo-500/30 text-indigo-200'
                                : isPopular
                                ? 'bg-slate-800 text-slate-300'
                                : isTrial
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isTrial ? '7 Days' : plan.tier}
                          </span>
                        </div>

                        <p className={`text-[10px] ${isSelected || isPopular ? 'text-slate-300' : 'text-slate-500'} mb-3 min-h-[28px] leading-snug`}>
                          {plan.tagline}
                        </p>

                        <div className="flex items-baseline gap-1 mb-3 pb-3 border-b border-slate-200/20">
                          <span className="text-xl font-black">
                            {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                          </span>
                          <span className={`text-[10px] ${isSelected || isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                            {price === 0 ? ' / 7 Days' : `/${billingCycle === 'yearly' ? 'yr' : 'mo'}`}
                          </span>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl mb-3 text-[10px] space-y-1 ${
                            isSelected
                              ? 'bg-indigo-900/60 text-slate-200 border border-indigo-800'
                              : isPopular
                              ? 'bg-slate-800/80 text-slate-300'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>Beds & Wards:</span>
                            <span className="font-bold">{plan.tier === 'basic' ? 'OPD Only (No Beds)' : `${plan.maxBeds || 20} Beds`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Patient Census:</span>
                            <span className="font-bold">{plan.maxPatients.toLocaleString('en-IN')} EHR</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Doctors & Staff:</span>
                            <span className="font-bold">{plan.maxDoctors} Docs / {plan.maxStaff} Staff</span>
                          </div>
                        </div>

                        <ul className="space-y-1.5 text-[10px] mb-2">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check
                                className={`w-3 h-3 shrink-0 mt-0.5 ${
                                  isSelected ? 'text-emerald-400' : isPopular ? 'text-teal-400' : 'text-indigo-600'
                                }`}
                              />
                              <span className={isSelected || isPopular ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-slate-200/20">
                        <span
                          className={`w-full py-1.5 text-[10px] font-bold rounded-lg block text-center transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : isPopular
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select Plan'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Capability Matrix Toggle & View */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">Compare Capabilities by Tier</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCapabilityMatrix(!showCapabilityMatrix)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showCapabilityMatrix ? 'Hide Capability Matrix' : 'View Detailed Capability Matrix (10 Capabilities)'}
                  </button>
                </div>

                {showCapabilityMatrix && (
                  <PlanCapabilityMatrix
                    currentTier={selectedTier}
                    onSelectTier={(t) => setSelectedTier(t)}
                    showDescriptions={true}
                  />
                )}
              </div>

              {/* Available Superadmin Promotional Coupon Codes Section */}
              {activeCoupons.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-700" />
                      <h5 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                        Available Superadmin Promotional Coupons & Discounts
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      {activeCoupons.length} Code{activeCoupons.length > 1 ? 's' : ''} Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeCoupons.map((coupon) => {
                      const isApplied = appliedCoupon?.code.toLowerCase() === coupon.code.toLowerCase();
                      return (
                        <div
                          key={coupon.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isApplied
                              ? 'bg-purple-900 text-white border-purple-700 shadow-sm'
                              : 'bg-white border-purple-200 hover:border-purple-400 text-slate-900 shadow-2xs'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-mono text-xs font-bold ${isApplied ? 'text-purple-200' : 'text-purple-900'}`}>
                                {coupon.code}
                              </span>
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                                isApplied ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {coupon.discountPercentage}% OFF
                              </span>
                            </div>
                            <p className={`text-[10px] line-clamp-1 ${isApplied ? 'text-purple-200' : 'text-slate-500'}`}>
                              {coupon.description}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant={isApplied ? 'outline' : 'primary'}
                            size="xs"
                            onClick={() => (isApplied ? handleRemoveCoupon() : handleSelectCouponObj(coupon))}
                            className={`shrink-0 font-bold ${
                              isApplied
                                ? 'border-purple-400 text-purple-200 hover:bg-purple-800'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            {isApplied ? 'Applied ✓' : 'Apply'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleProceedToStep2}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white flex items-center gap-1.5"
                >
                  <span>Proceed to Step 2: Scan QR & Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: SCAN UPI QR CODE TO TRANSFER */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4 min-w-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Step 2: Scan UPI QR Code to Transfer</span>
                    <h4 className="text-sm font-bold text-white">
                      Scan to Pay ₹{activePrice.toLocaleString('en-IN')} / {billingCycle === 'yearly' ? 'year' : 'month'}
                    </h4>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold shrink-0">
                    {currentPlanObj.name} ({billingCycle.toUpperCase()})
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 min-w-0">
                  {/* Visual QR Code Display */}
                  <div className="p-3 bg-white rounded-xl shadow-lg shrink-0 flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`}
                      alt="Payment QR Code"
                      className="w-32 h-32 sm:w-36 sm:h-36 rounded-lg border border-slate-100"
                    />
                    <span className="text-[10px] font-mono text-slate-700 mt-1 font-bold text-center">
                      Scan via BHIM / Google Pay / PhonePe / Paytm
                    </span>
                  </div>

                  <div className="space-y-3 text-xs flex-1 min-w-0 w-full">
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 min-w-0">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">UPI / VPA ID</span>
                      <div className="flex items-center justify-between mt-1 font-mono text-indigo-300 gap-2 min-w-0">
                        <span className="font-bold truncate">{upiId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(upiId);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 p-1"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5 min-w-0">
                      <div className="flex justify-between items-center text-slate-300 gap-2 text-xs">
                        <span className="shrink-0 text-slate-400">Merchant:</span>
                        <span className="font-semibold text-white truncate text-right">PulseCore Healthcare SaaS</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300 gap-2 text-xs">
                        <span className="shrink-0 text-slate-400">Facility ID:</span>
                        <span className="font-mono text-indigo-300 truncate text-right">{hospitalId}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300 gap-2 text-xs pt-1 border-t border-slate-700/60">
                        <span className="shrink-0 text-slate-400">Total Amount Due:</span>
                        <span className="font-bold text-emerald-400 shrink-0">₹{activePrice.toLocaleString('en-IN')} INR</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo / Coupon Code Redemption Block */}
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Have a Promo / Coupon Code?
                  </label>
                  {activeCoupons.length > 0 && (
                    <span className="text-[10px] text-purple-700 font-bold">
                      {activeCoupons.length} Superadmin Coupon{activeCoupons.length > 1 ? 's' : ''} Available
                    </span>
                  )}
                </div>

                {/* List of Superadmin Coupons Available to Select */}
                {activeCoupons.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pb-1">
                    {activeCoupons.map((c) => {
                      const isSelected = appliedCoupon?.code.toLowerCase() === c.code.toLowerCase();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => (isSelected ? handleRemoveCoupon() : handleSelectCouponObj(c))}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-800 shadow-xs ring-2 ring-purple-500/40'
                              : 'bg-white text-purple-900 border-purple-200 hover:border-purple-400 hover:bg-purple-100/50'
                          }`}
                        >
                          <Tag className="w-3 h-3 text-purple-500" />
                          <span>{c.code}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                            isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {c.discountPercentage}% OFF
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-300 shadow-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 font-mono">CODE: {appliedCoupon.code}</p>
                        <p className="text-[11px] text-emerald-600 font-bold">
                          {appliedCoupon.discountPercentage}% OFF Applied! Saved ₹{(basePrice - activePrice).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="xs" onClick={handleRemoveCoupon} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Or enter coupon code (e.g. Happy_Hospital)"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value);
                        setCouponError('');
                      }}
                      className="font-mono uppercase text-xs"
                      error={couponError}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleApplyCoupon}
                      className="bg-purple-600 hover:bg-purple-700 font-bold shrink-0"
                    >
                      Apply Coupon
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Step 1: Change Plan
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleProceedToStep3}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white flex items-center gap-1.5"
                >
                  <span>Proceed to Step 3: Enter UTR & Screenshot</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: ENTER PAYMENT UTR / TRANSACTION REFERENCE NUMBER */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Payment Summary</span>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded border border-indigo-200">
                    {currentPlanObj.name} • {billingCycle.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
                  <span>Amount to be Verified:</span>
                  <span className="text-emerald-700 font-black text-base">₹{activePrice.toLocaleString('en-IN')} INR</span>
                </div>
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    Includes {appliedCoupon.discountPercentage}% discount using coupon "{appliedCoupon.code}".
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Step 3: Enter Payment UTR / Transaction Reference Number * with screenshot of payment completed
                </label>
                <Input
                  placeholder="e.g. UTR984729104820 or UPI/29481940"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  required
                  className="font-mono text-sm py-2.5"
                />
                <p className="text-[11px] text-slate-500">
                  After completing the QR transfer in your UPI or mobile banking app, copy the 12-digit UTR/Reference number from your payment receipt and paste it above.
                </p>
              </div>

              {/* SCREENSHOT OF PAYMENT COMPLETED */}
              <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-teal-600" />
                    Screenshot of Payment Completed *
                  </label>
                  {!paymentScreenshot && (
                    <button
                      type="button"
                      onClick={handleUseSampleScreenshot}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      + Use Sample Receipt
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleScreenshotChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                {!paymentScreenshot ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-white text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isCompressingScreenshot ? 'Processing Screenshot...' : 'Click to upload screenshot of completed payment'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, or WEBP • Captured from your UPI or mobile banking app receipt
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-teal-200 bg-white p-3.5 flex items-center gap-4 shadow-xs">
                    <img
                      src={paymentScreenshot}
                      alt="Payment Receipt Screenshot"
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-xs shrink-0 bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Screenshot Attached & Verified</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        Payment proof attached for verification with UTR {utrNumber || 'Reference'}.
                      </p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-slate-700 border-slate-300 hover:bg-slate-50 font-bold"
                        >
                          Replace Screenshot
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleRemoveScreenshot}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Step 2: Scan QR
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-md"
                >
                  Submit Payment for Approval
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <BillingSoftwareAddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
      />
    </>
  );
};

export default SubscriptionUpgradeModal;
