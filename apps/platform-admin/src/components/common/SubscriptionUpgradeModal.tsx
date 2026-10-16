import React, { useState, useRef } from 'react';
import { QrCode, Check, ShieldCheck, AlertCircle, Copy, Clock, CreditCard, Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MockStorage } from '../../services/mockStorage';
import { SubscriptionPlanTier, BillingInterval } from '../../types';
import { useNotification } from '../../context/NotificationContext';
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
  const [selectedTier, setSelectedTier] = useState<SubscriptionPlanTier>('standard');
  const [billingCycle, setBillingCycle] = useState<BillingInterval>('monthly');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [isCompressingScreenshot, setIsCompressingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plans = MockStorage.getPlans();

  const currentPlanObj = plans.find((p) => p.tier === selectedTier) || plans[1];
  const activePrice = billingCycle === 'yearly' ? currentPlanObj.priceYearly : currentPlanObj.priceMonthly;

  const upiId = 'pulsecore.billing@upi';
  const upiString = `upi://pay?pa=${upiId}&pn=PulseCore+SaaS&am=${activePrice}&cu=INR&tn=Sub_${hospitalId}`;

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
      MockStorage.requestSubscriptionUpgrade(hospitalId, selectedTier, activePrice, utrNumber.trim(), paymentScreenshot);
      showToast(
        'Payment Submitted for Approval',
        `UTR ${utrNumber} with payment screenshot submitted. Superadmin will verify and activate your ${currentPlanObj.name} subscription.`
      );
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Hospital Subscription Plan"
      subtitle="Scan UPI / Banking QR Code to pay in Indian Rupees (INR) and submit transaction reference for Superadmin approval."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Billing Cycle Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Choose Commercial Subscription Tier</h4>
            <p className="text-[11px] text-slate-500">Compare full capacity limits, features & pricing tiers</p>
          </div>
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

        {/* Detailed Plans Cards Grid (Matching Superadmin Subscription Management) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isSelected = selectedTier === plan.tier;
            const isTrial = plan.priceMonthly === 0;
            const isPopular = plan.isPopular;
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedTier(plan.tier)}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-950 text-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/40'
                    : isPopular
                    ? 'bg-slate-900 text-white border-slate-700 shadow-md'
                    : isTrial
                    ? 'bg-teal-950/10 text-slate-900 border-teal-300 shadow-xs hover:border-teal-400'
                    : 'bg-white text-slate-900 border-slate-200 shadow-xs hover:border-indigo-300'
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
                {!isSelected && isTrial && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 text-[9px] uppercase tracking-widest font-black px-3 py-0.5 rounded-full shadow-md">
                    Free Trial
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
                      {isTrial ? '14 Days' : plan.tier}
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
                      {price === 0 ? ' / 14 Days' : `/${billingCycle === 'yearly' ? 'yr' : 'mo'}`}
                    </span>
                  </div>

                  {/* Detailed Capacity Metrics */}
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
                      <span className="font-bold">{plan.maxBeds || 20} Beds</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patient Census:</span>
                      <span className="font-bold">{plan.maxPatients.toLocaleString('en-IN')} EHR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doctors & Staff:</span>
                      <span className="font-bold">{plan.maxDoctors} Docs / {plan.maxStaff} Staff</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vault Storage:</span>
                      <span className="font-bold">{plan.storageGB} GB</span>
                    </div>
                  </div>

                  {/* Detailed Feature List */}
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

        {/* QR Code & Payment Details */}
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

        {/* Transaction Reference Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            3. Enter Payment UTR / Transaction Reference Number * with screenshot of payment completed
          </label>
          <Input
            placeholder="e.g. UTR984729104820 or UPI/29481940"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            required
            className="font-mono"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            After making the QR payment, copy the UTR/Reference number from your banking receipt and paste it above.
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

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<CreditCard className="w-4 h-4" />}>
            Submit Payment for Approval
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SubscriptionUpgradeModal;
