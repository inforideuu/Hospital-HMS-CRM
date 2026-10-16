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
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { ConvertedCustomer, SubscriptionPlanTier, HospitalType, Hospital } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context/NotificationContext';

export const PendingHospitalOnboarding: React.FC = () => {
  const { showToast } = useNotification();
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
    address: 'Hospital Headquarters',
    city: 'Metropolis',
    state: 'NY',
    country: 'United States',
    postalCode: '10001',
    planTier: 'trial' as SubscriptionPlanTier,
    totalBeds: 20,
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
    setSelectedCustomer(cust);
    const validTiers: SubscriptionPlanTier[] = ['trial', 'basic', 'standard', 'enterprise'];
    const matchedTier = validTiers.find((t) => t.toLowerCase() === cust.interestedPlan?.toLowerCase()) || 'trial';
    const plan = MockStorage.getPlanByTier(matchedTier) || MockStorage.getPlanByTier('trial');
    setFormData({
      name: cust.hospitalName,
      regNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'General Hospital',
      email: cust.email,
      phone: cust.phone,
      address: 'Hospital Headquarters',
      city: 'Metropolis',
      state: 'NY',
      country: 'United States',
      postalCode: '10001',
      planTier: matchedTier,
      totalBeds: plan?.maxBeds || 20,
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    });
    setIsOnboardModalOpen(true);
  };

  const handleConfirmOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const photo = formData.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80';
    const plan = MockStorage.getPlanByTier(formData.planTier);
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const hospitals = MockStorage.getHospitals();
    const newHospital: Hospital = {
      id: selectedCustomer.hospitalId || `HOSP-00${hospitals.length + 1}`,
      ...formData,
      adminName: selectedCustomer.contactPerson,
      adminEmail: selectedCustomer.email,
      adminPhone: selectedCustomer.phone,
      planTier: formData.planTier || 'trial',
      status: 'active',
      totalDoctors: plan?.maxDoctors || 3,
      totalPatients: 0,
      totalBeds: formData.totalBeds || plan?.maxBeds || 20,
      createdAt: new Date().toISOString().split('T')[0],
      websiteUrl: `https://${slug}.pulsecorehealth.com`,
      domainStatus: 'connected',
      logoUrl: photo,
      image: photo,
    };

    MockStorage.saveHospital(newHospital);

    // Update converted customer record status
    selectedCustomer.subscriptionStatus = 'Trial';
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
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleOpenOnboardModal(cust)}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Onboard Hospital & Admin
                        </Button>
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
        subtitle={`Provision hospital tenant & assign subscription plan for ${selectedCustomer?.hospitalName}`}
        maxWidth="lg"
      >
        {selectedCustomer && (
          <form onSubmit={handleConfirmOnboarding} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Converted Lead Handover Details</span>
              </div>
              <p>Lead converted by Sales Executive: <strong className="font-semibold">{selectedCustomer.convertedByName}</strong> on {selectedCustomer.convertedAt}.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Hospital Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Medical Registration No. *"
                value={formData.regNumber}
                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Hospital Admin Name *"
                value={selectedCustomer.contactPerson}
                disabled
              />
              <Input
                label="Hospital Admin Email *"
                value={selectedCustomer.email}
                disabled
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Subscription Plan Tier *"
                value={formData.planTier}
                onChange={(e) => {
                  const newTier = e.target.value as SubscriptionPlanTier;
                  const selectedPlan = MockStorage.getPlanByTier(newTier);
                  setFormData({
                    ...formData,
                    planTier: newTier,
                    totalBeds: selectedPlan?.maxBeds || formData.totalBeds,
                  });
                }}
                required
              >
                {MockStorage.getPlans().map((plan) => (
                  <option key={plan.id} value={plan.tier}>
                    {plan.name} ({plan.priceMonthly === 0 ? `${plan.name} (₹0)` : `₹${plan.priceMonthly.toLocaleString('en-IN')}/mo`})
                  </option>
                ))}
              </Select>

              <Select
                label="Hospital Category *"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as HospitalType })}
                required
              >
                <option value="General Hospital">General Hospital</option>
                <option value="Multi-Specialty">Multi-Specialty</option>
                <option value="Super Specialty">Super Specialty</option>
                <option value="Clinic Network">Clinic Network</option>
                <option value="Research & Academic">Research & Academic</option>
              </Select>

              <Input
                label="Bed Capacity *"
                type="number"
                value={formData.totalBeds}
                onChange={(e) => setFormData({ ...formData, totalBeds: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
              <Input
                label="State *"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
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
              <Button type="submit" variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700">
                Complete Hospital & Admin Onboarding
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
