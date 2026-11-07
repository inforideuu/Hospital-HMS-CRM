import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Palette,
  Layout,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { Hospital, HospitalType, WebsiteTemplateId } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface OnboardSubBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedHeadHospitalId?: string;
  linkedDocId?: string;
  onSuccess?: (newBranch: Hospital) => void;
}

const THEME_PRESETS = [
  { name: 'Modern Teal', primary: '#059669', secondary: '#0284c7' },
  { name: 'Deep Ocean', primary: '#0369a1', secondary: '#0f766e' },
  { name: 'Swiss Royal Sapphire', primary: '#1e40af', secondary: '#3b82f6' },
  { name: 'Monaco Crimson & Rose', primary: '#be123c', secondary: '#e11d48' },
  { name: 'Nordic Mint & Jade', primary: '#047857', secondary: '#10b981' },
];

export const OnboardSubBranchModal: React.FC<OnboardSubBranchModalProps> = ({
  isOpen,
  onClose,
  preSelectedHeadHospitalId,
  linkedDocId,
  onSuccess,
}) => {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'super_admin_manager';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [headHospitals, setHeadHospitals] = useState<Hospital[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Hospital Facility Profile
    headHospitalId: '',
    branchName: '',
    branchCode: '',
    type: 'Multi-Specialty Center' as HospitalType,
    totalBeds: 50,
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '560001',
    contactEmail: '',
    contactPhone: '',

    // Step 2: Website Profile
    websiteSubdomain: '',
    websiteCustomDomain: '',
    websiteTemplateId: 'premium-healthcare' as WebsiteTemplateId,
    websiteTheme: 'Modern Teal',
    websitePrimaryColor: '#059669',
    websiteSecondaryColor: '#0284c7',
    websiteHeroTitle: '',
    websiteHeroDescription: '',
    onlineBookingEnabled: true,
    emergencyBannerEnabled: true,
    websiteStatus: 'published' as 'published' | 'draft',

    // Step 3: Sub-Branch Admin Credentials
    branchAdminName: '',
    branchAdminEmail: '',
    branchAdminPhone: '',
    branchAdminPassword: '',
  });

  useEffect(() => {
    if (isOpen) {
      const eligible = MockStorage.getEnterpriseHeadHospitals();
      setHeadHospitals(eligible);

      const defaultHeadId = preSelectedHeadHospitalId || (eligible.length > 0 ? eligible[0].id : '');
      const selectedHead = eligible.find((h) => h.id === defaultHeadId);

      setFormData((prev) => ({
        ...prev,
        headHospitalId: defaultHeadId,
        branchName: selectedHead ? `${selectedHead.name} - ` : '',
        branchCode: '',
        type: 'Multi-Specialty Center',
        totalBeds: 50,
        address: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '560001',
        contactEmail: selectedHead?.email || '',
        contactPhone: selectedHead?.phone || '+91 98765 43210',
        websiteSubdomain: '',
        websiteCustomDomain: '',
        websiteTemplateId: 'premium-healthcare',
        websiteTheme: 'Modern Teal',
        websitePrimaryColor: '#059669',
        websiteSecondaryColor: '#0284c7',
        websiteHeroTitle: '',
        websiteHeroDescription: '',
        onlineBookingEnabled: true,
        emergencyBannerEnabled: true,
        websiteStatus: 'published',
        branchAdminName: '',
        branchAdminEmail: '',
        branchAdminPhone: '',
        branchAdminPassword: `Admin@${Math.floor(100 + Math.random() * 900)}`,
      }));
      setStep(1);
    }
  }, [isOpen, preSelectedHeadHospitalId]);

  // Quick auto-generate branch code and website title from name and city
  const handleNameChange = (name: string) => {
    const cleanParts = name.trim().split('-');
    const suffix = cleanParts.length > 1 ? cleanParts[cleanParts.length - 1].trim() : name.trim();
    const cleanCode = suffix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'SUB';
    const subdomain = suffix.toLowerCase().replace(/[^a-z0-9]/g, '') || 'subbranch';

    setFormData((prev) => ({
      ...prev,
      branchName: name,
      branchCode: prev.branchCode ? prev.branchCode : (cleanCode ? `BR-${cleanCode}` : ''),
      websiteSubdomain: prev.websiteSubdomain ? prev.websiteSubdomain : subdomain,
      websiteHeroTitle: prev.websiteHeroTitle ? prev.websiteHeroTitle : `Welcome to ${name}`,
      websiteHeroDescription: prev.websiteHeroDescription
        ? prev.websiteHeroDescription
        : `World-class healthcare, dedicated specialists, and 24/7 emergency response at ${name}.`,
    }));
  };

  const handleHeadHospitalChange = (headId: string) => {
    const head = headHospitals.find((h) => h.id === headId);
    setFormData((prev) => ({
      ...prev,
      headHospitalId: headId,
      branchName: head ? `${head.name} - ` : prev.branchName,
    }));
  };

  const handleApplyTheme = (themeName: string) => {
    const preset = THEME_PRESETS.find((t) => t.name === themeName);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        websiteTheme: preset.name,
        websitePrimaryColor: preset.primary,
        websiteSecondaryColor: preset.secondary,
      }));
    }
  };

  const validateStep1 = () => {
    if (!formData.headHospitalId) {
      showToast('Validation Error', 'Please select a Parent Head Hospital.', 'error');
      return false;
    }
    if (!formData.branchName.trim()) {
      showToast('Validation Error', 'Sub-branch facility name is required.', 'error');
      return false;
    }
    if (!formData.branchCode.trim()) {
      showToast('Validation Error', 'Branch Code identifier is required.', 'error');
      return false;
    }
    if (!formData.city.trim() || !formData.address.trim()) {
      showToast('Validation Error', 'City and Street Address are required.', 'error');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    return true;
  };

  const validateStep3 = () => {
    if (!formData.branchAdminName.trim()) {
      showToast('Validation Error', 'Sub-Branch Admin Full Name is required.', 'error');
      return false;
    }
    if (!formData.branchAdminEmail.trim() || !formData.branchAdminEmail.includes('@')) {
      showToast('Validation Error', 'A valid Sub-Branch Admin Email is required.', 'error');
      return false;
    }
    if (!formData.branchAdminPassword.trim() || formData.branchAdminPassword.length < 6) {
      showToast('Validation Error', 'Sub-Branch Admin Password must be at least 6 characters.', 'error');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Super Admin Manager is restricted from onboarding hospital facilities. Only Super Administrator can onboard sub-branches.', 'error');
      return;
    }
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    const res = MockStorage.createBranch({
      organizationId: formData.headHospitalId,
      branchName: formData.branchName,
      branchCode: formData.branchCode,
      type: formData.type,
      totalBeds: Number(formData.totalBeds) || 50,
      address: formData.address,
      city: formData.city,
      state: formData.state || 'State',
      country: formData.country || 'India',
      postalCode: formData.postalCode || '560001',
      contactPerson: formData.branchAdminName,
      contactEmail: formData.contactEmail || formData.branchAdminEmail,
      contactPhone: formData.contactPhone || formData.branchAdminPhone || '+91 98765 43210',
      description: formData.websiteHeroDescription,
      websiteSubdomain: formData.websiteSubdomain,
      websiteCustomDomain: formData.websiteCustomDomain,
      websiteTemplateId: formData.websiteTemplateId,
      websiteTheme: formData.websiteTheme,
      websitePrimaryColor: formData.websitePrimaryColor,
      websiteSecondaryColor: formData.websiteSecondaryColor,
      websiteHeroTitle: formData.websiteHeroTitle,
      websiteHeroDescription: formData.websiteHeroDescription,
      websiteStatus: formData.websiteStatus,
      websitePublished: formData.websiteStatus === 'published',
      onlineBookingEnabled: formData.onlineBookingEnabled,
      emergencyBannerEnabled: formData.emergencyBannerEnabled,
      branchAdminName: formData.branchAdminName,
      branchAdminEmail: formData.branchAdminEmail,
      branchAdminPhone: formData.branchAdminPhone,
      initialPassword: formData.branchAdminPassword,
      docId: linkedDocId,
    });

    if (res.success && res.branch) {
      const selectedHead = headHospitals.find((h) => h.id === formData.headHospitalId);
      showToast(
        'Sub-Branch Hospital Onboarded',
        `${res.branch.name} is now live under ${selectedHead?.name || 'Head Hospital Network'}. Website launched and Admin credentials activated.`,
        'success'
      );
      if (onSuccess) onSuccess(res.branch);
      onClose();
    } else {
      showToast('Onboarding Failed', res.message || 'Unable to instantiate sub-branch.', 'error');
    }
  };

  const selectedHeadHosp = headHospitals.find((h) => h.id === formData.headHospitalId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard Sub-Branch Hospital Facility"
      subtitle="Complete 3-step provisioning: Register Facility, Build Website, and Create Sub-Branch Admin"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                step === 1
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Register Hospital</span>
            </button>
            <span className="text-slate-300 text-xs">&rarr;</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                step === 2
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>2. Build Website</span>
            </button>
            <span className="text-slate-300 text-xs">&rarr;</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) setStep(3);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                step === 3
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>3. Admin Credentials</span>
            </button>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shrink-0">
            Step {step} of 3
          </span>
        </div>

        {/* STEP 1: REGISTER HOSPITAL FACILITY */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Parent Head Hospital Selection */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Select Parent Head Hospital (Enterprise Network) *
                </label>
                <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                  Network Parent
                </span>
              </div>
              <Select
                value={formData.headHospitalId}
                onChange={(e) => handleHeadHospitalChange(e.target.value)}
                className="text-xs font-semibold"
              >
                {headHospitals.length === 0 && (
                  <option value="">No Enterprise Head Hospitals available</option>
                )}
                {headHospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city || 'Headquarters'}) &bull; Plan: {h.planTier.toUpperCase()}
                  </option>
                ))}
              </Select>
              {selectedHeadHosp && (
                <p className="text-[11px] text-purple-800">
                  This new sub-branch will be bound under <strong>{selectedHeadHosp.name}</strong>. Consolidated analytics, capacity monitoring, and cross-branch admin access will route through the Head Branch.
                </p>
              )}
            </div>

            {/* Hospital Facility Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Sub-Branch Hospital Name *"
                value={formData.branchName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apex Care - Indiranagar Branch"
                required
              />
              <Input
                label="Branch Code / Identifier *"
                value={formData.branchCode}
                onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                placeholder="e.g. APEX-IND"
                className="font-mono uppercase font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select
                label="Facility Category *"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as HospitalType })}
              >
                <option value="Multi-Specialty Center">Multi-Specialty Center</option>
                <option value="General Hospital">General Hospital</option>
                <option value="Specialty Clinic">Specialty Clinic</option>
                <option value="Emergency Care Unit">Emergency Care Unit</option>
                <option value="Diagnostic & Daycare Center">Diagnostic &amp; Daycare Center</option>
              </Select>

              <Input
                label="Inpatient Bed Allocation *"
                type="number"
                min={1}
                value={formData.totalBeds}
                onChange={(e) => setFormData({ ...formData, totalBeds: Number(e.target.value) })}
                required
              />
            </div>

            {/* Location & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bangalore"
                required
              />
              <Input
                label="State / Province *"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Karnataka"
                required
              />
              <Input
                label="Country *"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. India"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Street Address *"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 100 Feet Road, Indiranagar"
                  required
                />
              </div>
              <Input
                label="Postal Code *"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="e.g. 560038"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Official Contact Email *"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact.indiranagar@hospital.org"
                required
              />
              <Input
                label="Official Contact Phone *"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>
        )}

        {/* STEP 2: BUILD WEBSITE */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Theme & Palette Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Theme Style</label>
                <Select
                  value={formData.websiteTheme}
                  onChange={(e) => handleApplyTheme(e.target.value)}
                  className="text-xs"
                >
                  {THEME_PRESETS.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.websitePrimaryColor}
                    onChange={(e) => setFormData({ ...formData, websitePrimaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.websitePrimaryColor}
                    onChange={(e) => setFormData({ ...formData, websitePrimaryColor: e.target.value })}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.websiteSecondaryColor}
                    onChange={(e) => setFormData({ ...formData, websiteSecondaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.websiteSecondaryColor}
                    onChange={(e) => setFormData({ ...formData, websiteSecondaryColor: e.target.value })}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Hero Copy */}
            <div className="space-y-3">
              <Input
                label="Hero Section Headline *"
                value={formData.websiteHeroTitle}
                onChange={(e) => setFormData({ ...formData, websiteHeroTitle: e.target.value })}
                placeholder="e.g. World-Class Healthcare at Indiranagar"
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Section Description / Mission *
                </label>
                <textarea
                  value={formData.websiteHeroDescription}
                  onChange={(e) => setFormData({ ...formData, websiteHeroDescription: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Brief introductory statement for patient visitors..."
                  required
                />
              </div>
            </div>

            {/* Features Toggles */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.onlineBookingEnabled}
                  onChange={(e) => setFormData({ ...formData, onlineBookingEnabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300"
                />
                <span>Enable Online OPD Appointment Booking</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.emergencyBannerEnabled}
                  onChange={(e) => setFormData({ ...formData, emergencyBannerEnabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300"
                />
                <span>Display 24/7 Emergency Response Banner</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Status:</span>
                <Select
                  value={formData.websiteStatus}
                  onChange={(e) => setFormData({ ...formData, websiteStatus: e.target.value as 'published' | 'draft' })}
                  className="text-xs py-1"
                >
                  <option value="published">Published (Live)</option>
                  <option value="draft">Draft (Private)</option>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CREATE HOSPITAL ADMIN CREDENTIALS */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Sub-Branch Administrator Account</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    This dedicated admin account will manage daily clinical operations, doctors, and bed allocations at {formData.branchName || 'this sub-branch'}.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
                  Sub-Branch Admin Role
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Sub-Branch Admin Full Name *"
                value={formData.branchAdminName}
                onChange={(e) => setFormData({ ...formData, branchAdminName: e.target.value })}
                placeholder="e.g. Dr. Priya Sharma"
                required
              />

              <Input
                label="Official Login Email *"
                type="email"
                value={formData.branchAdminEmail}
                onChange={(e) => setFormData({ ...formData, branchAdminEmail: e.target.value })}
                placeholder="admin.indiranagar@hospital.org"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Admin Phone Number *"
                value={formData.branchAdminPhone}
                onChange={(e) => setFormData({ ...formData, branchAdminPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Password *
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.branchAdminPassword}
                      onChange={(e) => setFormData({ ...formData, branchAdminPassword: e.target.value })}
                      className="w-full text-xs py-2 pl-3 pr-8 border border-slate-300 rounded-lg bg-white font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        branchAdminPassword: `Admin@${Math.floor(100 + Math.random() * 900)}`,
                      })
                    }
                    className="shrink-0 text-xs px-2.5 py-2 font-bold"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            {/* Essential Credentials & Tenant Isolation Callout */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <p className="text-purple-900 leading-relaxed">
                  <strong>Sub-Branch Admin Boundary:</strong> The created sub-branch administrator (<code>{formData.branchAdminEmail || 'branch admin'}</code>) can <em>only</em> access and administer this sub-branch facility. Sub-branch admins cannot access the Main Head Branch or any sibling branches.
                </p>
              </div>

              <div className="flex items-start gap-2 border-t border-purple-200/60 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-emerald-900 leading-relaxed">
                  <strong>Head Hospital Admin Cross-Login:</strong> The Head Hospital Admin of <strong>{selectedHeadHosp?.name || 'Head Branch'}</strong> (<code>{selectedHeadHosp?.adminEmail}</code>) can log in directly into this sub-branch hospital admin page at any time using their <strong>own existing credentials</strong>.
                </p>
              </div>
            </div>

            {/* Final Overview Summary Receipt */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">Onboarding Summary:</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <p>Facility: <strong className="text-slate-900">{formData.branchName || 'Sub-Branch'}</strong></p>
                <p>Code: <strong className="text-slate-900 font-mono">{formData.branchCode || 'CODE'}</strong></p>
                <p>Parent Head: <strong className="text-purple-700">{selectedHeadHosp?.name}</strong></p>
                <p>Capacity: <strong className="text-slate-900">{formData.totalBeds} Beds</strong></p>
                <p>Website: <strong className="text-purple-700 font-mono">https://{formData.websiteSubdomain || 'branch'}.pulsecorehealth.com</strong></p>
                <p>Admin Login: <strong className="text-slate-900 font-mono">{formData.branchAdminEmail || 'admin@branch.com'}</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Continue to Step {step + 1}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCompleteOnboarding}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                Launch &amp; Onboard Sub-Branch Hospital
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
