import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  UserCheck,
  Building2,
  CheckCircle2,
  Plus,
  Clock,
  ShieldCheck,
  Filter,
  Zap,
  Upload,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { ConvertedCustomer, SubscriptionPlanTier, HospitalType, Hospital } from '../../../types';
import { compressImage } from '../../../utils/imageCompressor';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';

export const PendingHospitalOnboarding: React.FC = () => {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [convertedCustomers, setConvertedCustomers] = useState<ConvertedCustomer[]>(() => MockStorage.getConvertedCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ConvertedCustomer | null>(null);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    name: '',
    regNumber: '',
    type: 'General Hospital' as HospitalType,
    email: '',
    phone: '',
    address: 'Hospital Headquarters, Suite 100',
    city: 'Metropolis',
    state: 'NY',
    country: 'United States',
    postalCode: '10001',
    planTier: 'trial' as SubscriptionPlanTier,
    totalBeds: 20,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
  });

  const refreshData = () => {
    setConvertedCustomers(MockStorage.getConvertedCustomers());
  };

  const pendingCustomers = convertedCustomers.filter(
    (c) => c.onboardingStatus === 'Pending Onboarding' || c.subscriptionStatus === 'Pending Setup'
  );

  const filteredPending = pendingCustomers.filter(
    (c) =>
      c.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.convertedByName && c.convertedByName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenOnboardModal = (cust: ConvertedCustomer) => {
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to onboard hospital facilities.', 'error');
      return;
    }
    setSelectedCustomer(cust);
    const defaultTier = (MockStorage.getPlatformSettings().defaultPlanTier || 'trial') as SubscriptionPlanTier;
    const plan = MockStorage.getPlanByTier(defaultTier) || MockStorage.getPlanByTier('trial');
    const lead = MockStorage.getSalesLeads().find((l) => l.id === cust.leadId || l.customerId === cust.id);
    setFormData({
      name: cust.hospitalName,
      regNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'General Hospital',
      email: cust.email,
      phone: cust.phone,
      address: 'Hospital Headquarters, Suite 100',
      city: lead?.city || 'Metropolis',
      state: lead?.state || 'NY',
      country: lead?.country || 'United States',
      postalCode: '10001',
      planTier: defaultTier,
      totalBeds: plan?.tier === 'basic' ? 0 : (plan?.maxBeds ?? 20),
      adminName: cust.contactPerson || '',
      adminEmail: cust.email || '',
      adminPassword: `Admin@${Math.floor(100 + Math.random() * 900)}`,
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    });
    setIsOnboardModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      if (dataUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: dataUrl }));
      }
    } catch {
      showToast('Image Upload Error', 'Could not process the uploaded image file.', 'error');
    }
  };

  const handleConfirmOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to onboard hospital facilities.', 'error');
      return;
    }
    if (!selectedCustomer) return;

    const photo = formData.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80';
    const plan = MockStorage.getPlanByTier(formData.planTier);
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const hospitals = MockStorage.getHospitals();
    const newHospital: Hospital = {
      id: selectedCustomer.hospitalId || `HOSP-00${hospitals.length + 1}`,
      name: formData.name,
      regNumber: formData.regNumber,
      type: formData.type,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      postalCode: formData.postalCode,
      adminName: formData.adminName || selectedCustomer.contactPerson,
      adminEmail: formData.adminEmail || selectedCustomer.email,
      adminPhone: formData.phone || selectedCustomer.phone,
      adminPassword: formData.adminPassword || 'Admin@123',
      planTier: formData.planTier || 'trial',
      status: 'active',
      totalDoctors: plan ? plan.maxDoctors : 3,
      totalPatients: 0,
      totalBeds: formData.totalBeds !== undefined && formData.totalBeds > 0 ? formData.totalBeds : (plan ? plan.maxBeds : 20),
      createdAt: new Date().toISOString().split('T')[0],
      websiteUrl: `https://${slug}.pulsecorehealth.com`,
      domainStatus: 'connected',
      logoUrl: photo,
      image: photo,
    };

    MockStorage.saveHospital(newHospital);

    // Update converted customer record status
    selectedCustomer.subscriptionStatus = formData.planTier === 'trial' ? 'Trial' : 'Active';
    selectedCustomer.hospitalAdminStatus = 'Created';
    selectedCustomer.onboardingStatus = 'Onboarded';
    MockStorage.saveConvertedCustomer(selectedCustomer);

    showToast(
      'Hospital & Admin Onboarded',
      `${newHospital.name} successfully onboarded into Hospital Network & Facilities.`
    );

    setIsOnboardModalOpen(false);
    setSelectedCustomer(null);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Pending Hospital Onboarding"
        subtitle="Review sales executive converted leads, select subscription plans, and onboard new hospital facilities."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Pending Onboarding' }]}
      />

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Super Admin Onboarding Queue</p>
          <p className="mt-0.5 text-indigo-800">
            When a Sales Executive converts a prospective lead into a customer, it is submitted here. Only Super Admins can configure subscription plans, assign capacity, and officially provision the hospital into the <strong>Hospital Network & Facilities</strong> table.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by lead hospital, contact person, email, or sales executive name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Converted Lead Handover Queue</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
                {filteredPending.length} Pending
              </span>
            </div>
          }
          subtitle="Hospital leads waiting for Super Admin subscription plan selection and workspace provisioning."
        />
        <CardContent className="p-4">
          {filteredPending.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50/60 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">No Pending Hospital Onboardings</p>
              <p className="text-slate-500 mt-1">All converted sales leads have been fully onboarded into the platform.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3.5">Hospital Lead & ID</th>
                    <th className="px-4 py-3.5">Contact Person & Email</th>
                    <th className="px-4 py-3.5">Converted By (Sales Exec)</th>
                    <th className="px-4 py-3.5">Conversion Date</th>
                    <th className="px-4 py-3.5">Interested Plan</th>
                    <th className="px-4 py-3.5 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPending.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{cust.hospitalName}</p>
                        <p className="text-[10px] text-indigo-600 font-mono">Lead ID: {cust.leadId} • {cust.id}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-800">
                        <p className="font-semibold">{cust.contactPerson}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{cust.email} • {cust.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>{cust.convertedByName || 'Sales Executive'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        📅 {cust.convertedAt}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[11px] capitalize">
                          {(() => {
                            const plan = MockStorage.getPlanByTier(cust.interestedPlan as SubscriptionPlanTier);
                            return plan ? `${plan.name} (${plan.tier})` : cust.interestedPlan;
                          })()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {isSuperAdmin ? (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleOpenOnboardModal(cust)}
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Onboard Hospital & Admin
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded" title="Super Admin authorization required">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                            Super Admin Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: Onboard Converted Customer Lead */}
      <Modal
        isOpen={isOnboardModalOpen}
        onClose={() => {
          setIsOnboardModalOpen(false);
          setSelectedCustomer(null);
        }}
        title="Onboard Converted Hospital Customer"
        subtitle={`Provision hospital tenant workspace & assign subscription tier for ${selectedCustomer?.hospitalName}`}
        maxWidth="2xl"
      >
        {selectedCustomer && (
          <form onSubmit={handleConfirmOnboarding} className="space-y-4">
            {/* Converted Lead Handover Banner */}
            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-indigo-950 text-xs">Converted Sales Lead Handover</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                    Interested Plan: {selectedCustomer.interestedPlan || 'Trial'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Lead converted by Sales Executive <strong className="font-semibold text-slate-800">{selectedCustomer.convertedByName}</strong> on {selectedCustomer.convertedAt}. Details pre-filled below for tenant activation.
                </p>
              </div>
            </div>

            {/* Hospital Name & Registration Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Hospital Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. St. Jude Memorial Hospital"
                required
              />
              <div className="flex items-end gap-2">
                <Input
                  label="Registration / License Number *"
                  value={formData.regNumber}
                  onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                  placeholder="e.g. MED-2026-9041"
                  required
                  className="flex-1 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      regNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                    })
                  }
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
                  title="Auto-fill Registration License Number"
                  className="mb-0.5 shrink-0 text-xs font-bold bg-amber-50/50 hover:bg-amber-100 border-amber-300 text-amber-900"
                >
                  Auto-Fill
                </Button>
              </div>
            </div>

            {/* Facility Type & Subscription Plan Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Hospital Facility Type *"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as HospitalType })}
                required
              >
                <option value="General Hospital">General Hospital</option>
                <option value="Multi-Specialty Center">Multi-Specialty Center</option>
                <option value="Specialty Clinic">Specialty Clinic</option>
                <option value="Children & Maternity">Children & Maternity</option>
                <option value="Trauma & Tertiary Care">Trauma & Tertiary Care</option>
              </Select>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subscription Tier (Auto-Configured)
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-700">
                      {MockStorage.getPlanByTier(formData.planTier || MockStorage.getPlatformSettings().defaultPlanTier || 'trial').name}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Auto-Assigned
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Auto-assigned from Platform Settings (Default Tier on Signup: {MockStorage.getPlatformSettings().defaultPlanTier || 'trial'}). Upgrades happen via Platform Billing.
                  </p>
                  {(() => {
                    const activeTier = formData.planTier || MockStorage.getPlatformSettings().defaultPlanTier || 'trial';
                    const plan = MockStorage.getPlanByTier(activeTier);
                    return (
                      <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between gap-1 flex-wrap">
                        <span><strong className="text-indigo-600">{plan.maxBeds} Beds</strong></span>
                        <span>•</span>
                        <span><strong className="text-indigo-600">{plan.maxDoctors} Docs</strong></span>
                        <span>•</span>
                        <span><strong className="text-indigo-600">{plan.maxPatients.toLocaleString('en-IN')} EHR</strong></span>
                        <span>•</span>
                        <span><strong className="text-indigo-600">{plan.storageGB} GB</strong></span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Hospital Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Hospital Official Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@hospital.org"
                required
              />
              <Input
                label="Primary Contact Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            {/* Address Details */}
            <Input
              label="Street Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Health Avenue, Suite 100"
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                required
              />
              <Input
                label="State / Province *"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                required
              />
              <Input
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="10001"
              />
            </div>

            {/* Hospital Administrator Credentials Card */}
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Hospital Administrator Account</h4>
                  <p className="text-[10px] text-slate-500">
                    Primary administrative credentials for the hospital director. Role is strictly assigned as <span className="font-bold text-indigo-600">Hospital Admin</span>.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Role: Hospital Admin
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Admin Full Name *"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="e.g. Dr. Arthur Vance"
                  required
                />
                <Input
                  label="Admin Official Email *"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@hospital.org"
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="Password"
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, adminPassword: `Admin@${Math.floor(100 + Math.random() * 900)}` })}
                      className="shrink-0 text-[11px] px-2 py-1 font-bold"
                      title="Generate Secure Password"
                    >
                      Gen
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Photo / Logo Image Upload Dropzone */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hospital Facility Photo / Logo Image
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: '' })}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Clear Image
                  </button>
                )}
              </div>

              {formData.logoUrl ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={formData.logoUrl}
                      alt="Hospital Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-xs shrink-0 bg-white"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">Selected Facility Photo</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{formData.logoUrl}</p>
                    </div>
                  </div>
                  <label className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-medium text-slate-700 cursor-pointer shadow-xs shrink-0">
                    Replace Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all text-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-indigo-600 hover:underline">Click to upload photo</span> or drag and drop
                  </div>
                  <p className="text-[10px] text-slate-400">PNG, JPG, WebP up to 5MB (auto-compressed)</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              )}

              {/* Preset Image Library */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Or select a standard facility photo:
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { name: 'Apex Center', url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80' },
                    { name: 'Metro Super-Specialty', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80' },
                    { name: 'St. Jude General', url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80' },
                    { name: 'City Heart', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&auto=format&fit=crop&q=80' },
                    { name: 'Specialty Care Clinic', url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: preset.url })}
                      className={`flex items-center gap-1.5 p-1 rounded-lg border text-[11px] transition-all cursor-pointer shrink-0 ${
                        formData.logoUrl === preset.url
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-6 h-6 rounded-md object-cover" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setIsOnboardModalOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="coral" size="md">
                Complete Hospital & Admin Onboarding
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
