import React, { useState, useEffect } from 'react';
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
  Percent,
  Calculator,
  Check,
  Lock,
  Network,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { HospitalSettings as HospitalSettingsType, EnterpriseBranchDocument } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { BillingSoftwareAddonModal } from '../../../components/common/BillingSoftwareAddonModal';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';
import { PlanCapabilityMatrix } from '../../../components/common/PlanCapabilityMatrix';

export const HospitalSettings: React.FC = () => {
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const isHospitalAdmin =
    user?.role === 'hospital_admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'super_admin_manager';

  const [storageVersion, setStorageVersion] = useState(0);

  useEffect(() => {
    const handleStorageUpdate = (e: any) => {
      const key = e?.detail?.key || e?.key;
      if (!key || key === 'pulse_plans' || key === 'pulse_hospitals' || key === 'pulse_subscriptions') {
        setStorageVersion((v) => v + 1);
      }
    };
    window.addEventListener('pulse_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('pulse_storage_sync');
        bc.onmessage = (msgEvent) => {
          const k = msgEvent?.data?.key;
          if (!k || k === 'pulse_plans' || k === 'pulse_hospitals' || k === 'pulse_subscriptions') {
            setStorageVersion((v) => v + 1);
          }
        };
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('pulse_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, []);

  const hosp = MockStorage.getHospitalById(hospId) || currentHospital;
  const currentSub = MockStorage.getSubscriptionByHospitalId(hospId);
  const activeTier = currentSub?.planTier || hosp?.planTier || currentHospital?.planTier || 'trial';
  const currentPlan = MockStorage.getPlanByTier(activeTier);

  const [settings, setSettings] = useState<HospitalSettingsType>(() => MockStorage.getHospitalSettings(hospId));
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  // Controlled by Super Admin in Platform Settings
  const isAddonEnabled = MockStorage.getPlatformSettings().enableBillingAddonModule !== false;

  const isEnterprise = activeTier === 'enterprise';
  const allHospitals = MockStorage.getHospitals();
  const [enterpriseDoc, setEnterpriseDoc] = useState<EnterpriseBranchDocument | undefined>(() =>
    hosp?.id ? MockStorage.getEnterpriseBranchDocuments(hosp.id)[0] : undefined
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const isSubBranch = Boolean(hosp?.isBranch || hosp?.headBranchId || (hosp?.organizationId && hosp?.isHeadBranch === false));
  const headHospital = isSubBranch
    ? allHospitals.find((h) => h.id === hosp?.headBranchId || (h.organizationId && h.organizationId === hosp?.organizationId && h.isHeadBranch))
    : null;

  const subBranches = allHospitals.filter(
    (h) => h.headBranchId === hosp?.id || (hosp?.organizationId && h.organizationId === hosp.organizationId && h.id !== hosp.id)
  );

  const storageUsage = MockStorage.getHospitalStorageUsage(hosp?.id || hospId);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Sub-branch manifest document must be 5 MB or smaller.', 'error');
      return;
    }

    // Strict quota check: ensure hospital never exceeds Cloud Storage Vault allocation
    const storageCheck = MockStorage.canUploadFile(hosp?.id || hospId, file.size);
    if (!storageCheck.allowed) {
      showToast(
        'Cloud Storage Vault Exceeded',
        storageCheck.message || 'Cannot upload document: Your facility has reached its allocated Cloud Storage Vault quota.',
        'error'
      );
      return;
    }

    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newDoc: EnterpriseBranchDocument = {
        id: `ENT-DOC-${Date.now()}`,
        hospitalId: hosp?.id || hospId,
        hospitalName: hosp?.name || settings.hospitalName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        fileData: dataUrl,
        uploadedBy: user?.name || 'Hospital Admin',
        uploadedByEmail: user?.email || hosp?.adminEmail || '',
        uploadedAt: new Date().toISOString(),
        status: 'pending_review',
        notes: `Manifest specification for ${hosp?.name || settings.hospitalName}`,
      };

      MockStorage.saveEnterpriseBranchDocument(newDoc);
      setEnterpriseDoc(newDoc);
      setIsUploadingDoc(false);
      showToast(
        'Sub-Branch Manifest Uploaded',
        `${file.name} (${(file.size / 1024).toFixed(1)} KB) transmitted to Super Admin & Manager desk for provisioning.`,
        'success'
      );
    };
    reader.onerror = () => {
      setIsUploadingDoc(false);
      showToast('Upload Error', 'Failed to read document file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadDoc = () => {
    if (!enterpriseDoc?.fileData) return;
    const link = document.createElement('a');
    link.href = enterpriseDoc.fileData;
    link.download = enterpriseDoc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download Started', `Downloading: ${enterpriseDoc.fileName}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHospitalAdmin) {
      showToast('Permission Denied', 'Only Hospital Administrators can modify hospital workspace settings.', 'error');
      return;
    }
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
          <div className="flex items-center gap-2">
            {/* Prominent Current Plan Pill for Hospital Admin */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Current Plan:</span>
                <span className="text-xs font-black text-brand-700">{currentPlan?.name || 'Starter Clinic'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
              </div>
            </div>

            {!isHospitalAdmin && (
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                View Only (Hospital Admin Privileges Required)
              </span>
            )}
            {isHospitalAdmin && isAddonEnabled && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddonModalOpen(true)}
                leftIcon={<Zap className="w-3.5 h-3.5" />}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
              >
                + Add On Billing Software
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-4xl space-y-6">
        {/* Active Subscription Plan & Renewal Card */}
        {(() => {
          const plan = currentPlan;
          const sub = currentSub;
          const subStatus = MockStorage.checkHospitalSubscriptionStatus(hospId);
          const isExpired = !subStatus.allowed;
          const activeCoupons = MockStorage.getCoupons().filter(
            (c) => c.isActive && (!c.validUntil || new Date(c.validUntil) >= new Date()) && (!c.maxUses || (c.usedCount || 0) < c.maxUses)
          );

          // 10 Plan capabilities based on current tier
          const capabilitiesStatus = [
            { name: 'Patient registration & EHR', allowed: true },
            { name: 'Appointments & OPD', allowed: true },
            { name: 'Doctors, staff & departments', allowed: true },
            { name: 'OPD rooms', allowed: true },
            { name: 'Admissions & beds', allowed: activeTier !== 'basic' },
            { name: 'Pharmacy & stock', allowed: activeTier !== 'basic' },
            { name: 'Laboratory & diagnostics', allowed: activeTier !== 'basic' },
            { name: 'Ambulance & emergency', allowed: activeTier !== 'basic' },
            { name: 'Billing & invoices', allowed: true },
            { name: 'Enterprise and multi-branch tools', allowed: activeTier === 'enterprise' },
          ];

          return (
            <div className={`p-6 rounded-2xl border shadow-sm space-y-5 ${
              isExpired
                ? 'bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white border-rose-500/40 ring-2 ring-rose-500/30'
                : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Header Label and Plan Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/40 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl shrink-0 ${isExpired ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md'}`}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        isExpired ? 'bg-rose-500 text-white' : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}>
                        Current Active Plan
                      </span>
                      <h3 className={`text-lg sm:text-xl font-black ${isExpired ? 'text-white' : 'text-slate-900'}`}>
                        {plan?.name || 'Starter Clinic'}
                      </h3>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        isExpired
                          ? 'bg-rose-500 text-white'
                          : sub?.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isExpired ? (subStatus.reason === 'trial_expired' ? 'TRIAL EXPIRED' : 'SUBSCRIPTION EXPIRED') : sub?.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>
                    <p className={`text-xs ${isExpired ? 'text-rose-200' : 'text-slate-500'} mt-1`}>
                      {isSubBranch
                        ? `Sub-Branch Facility • Subscription & licensing are centrally managed under the Enterprise Health Network contract of ${headHospital?.name || 'Head Branch'}.`
                        : isExpired
                        ? 'Your hospital subscription is currently inactive. Renew or upgrade below to restore full access to clinical modules.'
                        : `Hospital: ${hosp?.name || currentHospital?.name || 'Facility Workspace'} • Contract Interval: ${sub?.interval || 'yearly'} • Renewal Date: ${sub?.renewalDate || '2026-12-31'}`}
                    </p>
                  </div>
                </div>

                {isSubBranch ? (
                  <div className="p-2.5 px-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-center gap-2.5 shrink-0 shadow-xs">
                    <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                        Enterprise Sub-Branch
                      </span>
                      <span className="text-xs font-bold text-purple-900">
                        License Managed by Head Branch
                      </span>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Superadmin Active Promotional Coupon Banner */}
              {activeCoupons.length > 0 && !isSubBranch && (
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

              {/* Quota Limits Grid */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Plan Resource Allocations</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Patient EHR</span>
                    <span className="font-black text-sm">{plan?.maxPatients?.toLocaleString('en-IN') || '5,000'} Records</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Specialist Doctors</span>
                    <span className="font-black text-sm">{plan?.maxDoctors || 10} Specialists</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Staff Members</span>
                    <span className="font-black text-sm">{plan?.maxStaff || 25} Staffs</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Inpatient Beds</span>
                    <span className="font-black text-sm">{plan?.tier === 'basic' || !plan?.maxBeds ? '0 Beds (OPD Only)' : `${plan.maxBeds} Beds`}</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex flex-col justify-between ${isExpired ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Cloud Storage Vault</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          storageUsage.isLimitReached
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : storageUsage.percentageUsed > 75
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {storageUsage.percentageUsed}% Used
                        </span>
                      </div>
                      <span className="font-black text-sm block mt-1">
                        {storageUsage.usedFormatted} <span className="text-xs font-normal text-slate-400">/ {plan?.storageGB || 25} GB</span>
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            storageUsage.isLimitReached
                              ? 'bg-rose-500'
                              : storageUsage.percentageUsed > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, storageUsage.percentageUsed))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {storageUsage.remainingGB} GB remaining
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Plan Capabilities at a glance */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Modules & Capabilities Included in {plan?.name || 'Current Plan'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {capabilitiesStatus.filter((c) => c.allowed).length} of 10 Enabled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {capabilitiesStatus.map((cap, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        cap.allowed
                          ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950 font-medium'
                          : 'bg-slate-50 border-slate-200/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {cap.allowed ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <span className={`text-xs ${cap.allowed ? 'font-semibold text-slate-800' : 'text-slate-500 line-through opacity-85'}`}>
                          {cap.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cap.allowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {cap.allowed ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Full Comparison Matrix */}
              <div className="pt-3 border-t border-slate-200/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Compare with Other Plans</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMatrix(!showMatrix)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {showMatrix ? 'Hide Comparison Matrix' : 'View Full Capability Matrix (Table View)'}
                  </button>
                </div>
                {showMatrix && (
                  <PlanCapabilityMatrix
                    currentTier={activeTier}
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
          {/* Enterprise Health Network Multi-Branch Manifest Setup (Head Branch Only) */}
          {isEnterprise && !isSubBranch && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30">
              <CardHeader
                title="Enterprise Health Network – Sub-Branch Specification"
                subtitle="Centralized management of your hospital network, head branch, and sub-branches"
                action={
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    {hosp?.isHeadBranch !== false ? 'Designated Head Branch' : 'Sub-Branch Facility'}
                  </span>
                }
              />
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Network className="w-4 h-4 text-purple-600" />
                        Proposed Sub-Branch Specification Manifest
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                        Upload a document (max 5 MB: PDF, Word, or Excel) listing all proposed sub-branches (e.g. Mumbai, Bangalore), medical directors, and bed counts. Accessible strictly to <strong>Platform Super Admin and Super Admin Manager</strong> to review and provision your sub-branches and websites.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-purple-600" />
                        <span>{enterpriseDoc ? 'Replace Document (Max 5 MB)' : 'Upload Document (Max 5 MB)'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                          className="hidden"
                          disabled={isUploadingDoc}
                          onChange={handleDocUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {enterpriseDoc && (
                    <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{enterpriseDoc.fileName}</p>
                          <p className="text-[10px] text-slate-500">
                            {(enterpriseDoc.fileSize / 1024).toFixed(1)} KB • Uploaded by {enterpriseDoc.uploadedBy} on {new Date(enterpriseDoc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          enterpriseDoc.status === 'provisioned'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {enterpriseDoc.status === 'provisioned' ? 'Branches Provisioned' : 'Under Super Admin Review'}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleDownloadDoc}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-Branch Network Status & Topbar Switcher Info */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      Active Hospital Network Branches ({subBranches.length + 1})
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Switch branches using the top bar switcher
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-white border border-purple-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{hosp?.name || settings.hospitalName}</p>
                        <p className="text-[10px] text-slate-500">{hosp?.city}, {hosp?.state}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                        Head Branch
                      </span>
                    </div>

                    {subBranches.map((b) => (
                      <div key={b.id} className="p-2.5 rounded-lg bg-white border border-blue-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{b.name}</p>
                          <p className="text-[10px] text-slate-500">{b.city}, {b.state} • {b.branchCode || b.id}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          Sub-Branch
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                    <strong>Network Admin Privilege:</strong> As the Head Branch Admin, you can switch dashboards between the Head Branch and any Sub-Branch from the top bar dropdown using your same login credentials. Sub-Branch admins can only access their respective sub-branch.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Hospital Taxation & GST Percentage Configuration */}
          <Card className="border-indigo-100 shadow-sm overflow-hidden">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <span>Hospital Taxation & GST Percentage Configuration</span>
                </div>
              }
              subtitle="All hospital-related GST percentages are chosen and controlled by the Hospital Admin. Configure GST rates across clinical departments, pharmacy dispensary, laboratory tests, and inpatient folios."
              action={
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">GST Billing:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableGSTBilling !== false}
                      onChange={(e) => setSettings({ ...settings, enableGSTBilling: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className={`text-xs font-bold ${settings.enableGSTBilling !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {settings.enableGSTBilling !== false ? 'Enabled' : 'Exempt / Disabled'}
                  </span>
                </div>
              }
            />
            <CardContent className="space-y-6">
              {/* GST Registration & Tax Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Input
                  label="Hospital GSTIN / Tax Registration Number *"
                  placeholder="e.g. 29ABCDE1234F1Z5 or GST-2026-001"
                  value={settings.taxRegistrationNumber || ''}
                  onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                  helperText="Official 15-digit GST Identification Number printed on patient tax invoices"
                />

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    GST Computation Scheme / Tax Type
                  </label>
                  <select
                    value={settings.gstType || 'CGST_SGST'}
                    onChange={(e) => setSettings({ ...settings, gstType: e.target.value as 'CGST_SGST' | 'IGST' })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CGST_SGST">Intra-State: CGST (50%) + SGST (50%) Split</option>
                    <option value="IGST">Inter-State: Integrated GST (IGST 100%)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Defines how tax line items appear on printed receipts and GST summary reports.
                  </p>
                </div>
              </div>

              {/* Departmental GST Rates Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-indigo-600" />
                    Departmental GST Percentage Presets & Rates
                  </h4>
                  <span className="text-[11px] text-slate-500">Click a preset badge or enter custom %</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Pharmacy / Medicines GST */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Pharmacy & Medicines GST
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Prescription fulfillment, OTC dispensary, formulary consumables
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settings.pharmacyGSTRate ?? 5}
                          onChange={(e) => setSettings({ ...settings, pharmacyGSTRate: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-16 p-1.5 text-center text-xs font-black border border-slate-300 rounded-lg bg-slate-50"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                      {[0, 5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSettings({ ...settings, pharmacyGSTRate: rate })}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
                            (settings.pharmacyGSTRate ?? 5) === rate
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. OPD Consultation GST */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          OPD Doctor Consultation GST
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Medical specialist fees, OPD checkups (Healthcare Exempt is 0%)
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settings.consultationGSTRate ?? 0}
                          onChange={(e) => setSettings({ ...settings, consultationGSTRate: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-16 p-1.5 text-center text-xs font-black border border-slate-300 rounded-lg bg-slate-50"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                      {[0, 5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSettings({ ...settings, consultationGSTRate: rate })}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
                            (settings.consultationGSTRate ?? 0) === rate
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {rate === 0 ? '0% (Exempt)' : `${rate}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Laboratory & Diagnostic Tests GST */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                          Laboratory & Diagnostic Tests GST
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pathology, Blood tests, Radiology, MRI, CT Scans, Ultrasound
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settings.labDiagnosticGSTRate ?? 5}
                          onChange={(e) => setSettings({ ...settings, labDiagnosticGSTRate: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-16 p-1.5 text-center text-xs font-black border border-slate-300 rounded-lg bg-slate-50"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                      {[0, 5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSettings({ ...settings, labDiagnosticGSTRate: rate })}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
                            (settings.labDiagnosticGSTRate ?? 5) === rate
                              ? 'bg-cyan-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Inpatient Bed & Room Charges GST */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          Inpatient Bed & Room Charges GST
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          ICU, Deluxe, Special Room tariffs (per day admission charges)
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settings.ipdRoomGSTRate ?? 5}
                          onChange={(e) => setSettings({ ...settings, ipdRoomGSTRate: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-16 p-1.5 text-center text-xs font-black border border-slate-300 rounded-lg bg-slate-50"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                      {[0, 5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSettings({ ...settings, ipdRoomGSTRate: rate })}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
                            (settings.ipdRoomGSTRate ?? 5) === rate
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. General Hospital / Default Billing GST */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3 md:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          General Hospital Services & Default Billing GST
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Standard fallback tax rate applied to general hospital bills, nursing, procedures, and miscellaneous items
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settings.defaultGSTRate ?? 5}
                          onChange={(e) => setSettings({ ...settings, defaultGSTRate: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-16 p-1.5 text-center text-xs font-black border border-slate-300 rounded-lg bg-slate-50"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSettings({ ...settings, defaultGSTRate: rate })}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
                            (settings.defaultGSTRate ?? 5) === rate
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Tax Preview Calculation */}
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span>Live Tax Computation Preview (Hospital Admin Rate Check)</span>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-semibold">
                    Scheme: {settings.gstType === 'IGST' ? 'IGST (Full)' : 'CGST + SGST (50/50 Split)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Pharmacy (₹1,000)</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      +₹{((1000 * (settings.enableGSTBilling !== false ? (settings.pharmacyGSTRate ?? 5) : 0)) / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono">
                      Rate: {settings.enableGSTBilling !== false ? settings.pharmacyGSTRate ?? 5 : 0}%
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">OPD Consult (₹800)</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      +₹{((800 * (settings.enableGSTBilling !== false ? (settings.consultationGSTRate ?? 0) : 0)) / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-mono">
                      Rate: {settings.enableGSTBilling !== false ? settings.consultationGSTRate ?? 0 : 0}%
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Lab Tests (₹1,500)</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      +₹{((1500 * (settings.enableGSTBilling !== false ? (settings.labDiagnosticGSTRate ?? 5) : 0)) / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-cyan-600 font-mono">
                      Rate: {settings.enableGSTBilling !== false ? settings.labDiagnosticGSTRate ?? 5 : 0}%
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">IPD Room (₹4,000)</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      +₹{((4000 * (settings.enableGSTBilling !== false ? (settings.ipdRoomGSTRate ?? 5) : 0)) / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-purple-600 font-mono">
                      Rate: {settings.enableGSTBilling !== false ? settings.ipdRoomGSTRate ?? 5 : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Scheduling & Operational Parameters */}
          <Card>
            <CardHeader
              title="Clinical Scheduling & Operational Parameters"
              subtitle="Default time slots and clinical workflow operational policies"
            />
            <CardContent className="space-y-4">
              {/* Row 1: Cancellation Cutoff Hours & Penalty Percentage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Penalty-Free Appointment Cancellation Cutoff (Hours)"
                  type="number"
                  min="0"
                  max="72"
                  value={settings.cancellationDeadlineHours ?? 4}
                  onChange={(e) => setSettings({ ...settings, cancellationDeadlineHours: Math.max(0, Number(e.target.value) || 0) })}
                  helperText="Minimum hours before slot to cancel without penalty. Cancellations within this cutoff incur a late penalty."
                />
                <Input
                  label="Late Cancellation Penalty (% of Doctor Consultation Fee)"
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.cancellationPenaltyPercent ?? 50}
                  onChange={(e) => setSettings({ ...settings, cancellationPenaltyPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                  helperText="Percentage of doctor consultation fee charged as penalty when appointment is cancelled late. Collected by Accountant at next visit."
                />
              </div>

              {/* Row 1b: Rescheduling Cutoff Hours & Penalty Percentage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Penalty-Free Appointment Rescheduling Cutoff (Hours)"
                  type="number"
                  min="0"
                  max="72"
                  value={settings.reschedulingDeadlineHours ?? 4}
                  onChange={(e) => setSettings({ ...settings, reschedulingDeadlineHours: Math.max(0, Number(e.target.value) || 0) })}
                  helperText="Minimum hours before slot to reschedule without penalty. Shifting within this cutoff incurs a late rescheduling penalty."
                />
                <Input
                  label="Late Rescheduling Penalty (% of Doctor Consultation Fee)"
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.reschedulingPenaltyPercent ?? 50}
                  onChange={(e) => setSettings({ ...settings, reschedulingPenaltyPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                  helperText="Percentage of doctor consultation fee charged as penalty when appointment is shifted within cutoff window. Collected by Accountant."
                />
              </div>

              {/* Row 2: Turnaround Buffer & Advance Horizon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Inter-Appointment Buffer Time (Minutes)"
                  type="number"
                  min="0"
                  max="60"
                  value={settings.appointmentBufferMinutes ?? 5}
                  onChange={(e) => setSettings({ ...settings, appointmentBufferMinutes: Number(e.target.value) })}
                  helperText="Buffer time added between consecutive consultation slots for chamber cleaning and doctor notes"
                />
                <Input
                  label="Maximum Advance Booking Horizon (Days)"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.maxAdvanceBookingDays ?? 30}
                  onChange={(e) => setSettings({ ...settings, maxAdvanceBookingDays: Number(e.target.value) })}
                  helperText="Maximum days in advance receptionists are allowed to schedule OPD doctor appointments"
                />
              </div>

              {/* Row 3: Clinical & Inpatient Settlement Governance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Mandatory Nursing Vitals Triage</p>
                    <p className="text-[11px] text-slate-500">Requires nurses to record vitals at check-in before doctor consultation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.mandatoryVitalsTriage !== false}
                    onChange={(e) => setSettings({ ...settings, mandatoryVitalsTriage: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Strict IPD Discharge Settlement Lock</p>
                    <p className="text-[11px] text-slate-500">Block bed release until inpatient dues are 100% settled at cashier</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireFullSettlementOnDischarge !== false}
                    onChange={(e) => setSettings({ ...settings, requireFullSettlementOnDischarge: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            {isHospitalAdmin ? (
              <>
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
              </>
            ) : (
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                View Only: Only Hospital Administrators can update facility settings.
              </span>
            )}
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
