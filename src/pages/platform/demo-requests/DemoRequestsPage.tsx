import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Plus,
  Trash2,
  Download,
  ShieldCheck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { DemoRequest, Hospital, HospitalType, SubscriptionPlanTier } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { compressImage } from '../../../utils/imageCompressor';

export const DemoRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isSuperAdmin = user?.role === 'super_admin';

  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>(() => MockStorage.getDemoRequests());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'scheduled' | 'converted'>('all');
  const [bedFilter, setBedFilter] = useState<string>('all');

  // Quick Onboard Modal State
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<DemoRequest | null>(null);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [onboardData, setOnboardData] = useState({
    name: '',
    slug: '',
    type: 'General Hospital' as HospitalType,
    city: '',
    state: '',
    address: '',
    phone: '',
    email: '',
    planTier: 'trial' as SubscriptionPlanTier,
    totalBeds: 20,
    logoUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
  });

  const loadData = () => {
    setDemoRequests(MockStorage.getDemoRequests());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, []);

  const totalLeads = demoRequests.length;
  const newCount = demoRequests.filter((d) => d.status === 'new').length;
  const contactedCount = demoRequests.filter((d) => d.status === 'contacted').length;
  const scheduledCount = demoRequests.filter((d) => d.status === 'scheduled').length;
  const convertedCount = demoRequests.filter((d) => d.status === 'converted').length;

  const handleStatusChange = (id: string, status: DemoRequest['status'], hospitalName: string) => {
    MockStorage.updateDemoRequestStatus(id, status);
    setDemoRequests(MockStorage.getDemoRequests());
    showToast('Lead Status Updated', `${hospitalName} moved to "${status.toUpperCase()}".`, 'success');
  };

  const handleDeleteDemoRequest = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the demo request from "${name}"?`)) {
      MockStorage.deleteDemoRequest(id);
      setDemoRequests(MockStorage.getDemoRequests());
      showToast('Lead Removed', `Demo inquiry from ${name} deleted successfully.`, 'info');
    }
  };

  const handleOpenOnboardModal = (lead: DemoRequest) => {
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to convert leads and onboard hospital facilities.', 'error');
      return;
    }

    setSelectedLead(lead);
    const calculatedBeds = lead.bedCapacity.includes('500+')
      ? 500
      : lead.bedCapacity.includes('150')
      ? 250
      : lead.bedCapacity.includes('50')
      ? 100
      : 30;

    setOnboardData({
      name: lead.hospitalName,
      slug: lead.hospitalName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: (lead.hospitalType as HospitalType) || 'General Hospital',
      city: lead.city || 'Mumbai',
      state: lead.state || 'Maharashtra',
      address: `${lead.city || 'Central District'}, ${lead.state || 'India'}`,
      phone: lead.phone,
      email: lead.email,
      planTier: 'trial',
      totalBeds: calculatedBeds,
      logoUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
    });
    setIsOnboardModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingLogo(true);
        const compressedBase64 = await compressImage(file, 800, 800, 0.85);
        setOnboardData((prev) => ({ ...prev, logoUrl: compressedBase64 }));
        showToast('Photo Processed', 'Facility photo compressed and ready.', 'success');
      } catch (err) {
        showToast('Upload Error', 'Could not process image file.', 'error');
      } finally {
        setIsCompressingLogo(false);
      }
    }
  };

  const handleConfirmOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to register and onboard hospital tenants.', 'error');
      return;
    }
    if (!onboardData.name || !onboardData.city) {
      showToast('Validation Error', 'Please enter hospital name and location.', 'error');
      return;
    }

    const currentHospitals = MockStorage.getHospitals();
    const plan = MockStorage.getPlanByTier(onboardData.planTier);

    const newHosp: Hospital = {
      id: `HOSP-${(currentHospitals.length + 1).toString().padStart(3, '0')}`,
      name: onboardData.name,
      regNumber: `REG-${Date.now().toString().slice(-6)}`,
      type: (onboardData.type as HospitalType) || 'General Hospital',
      city: onboardData.city,
      state: onboardData.state || 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      address: onboardData.address || `${onboardData.city}, ${onboardData.state}`,
      phone: onboardData.phone || '+91 98765 43210',
      email: onboardData.email || `admin@${(onboardData.slug || 'hospital').toLowerCase()}.org`,
      adminName: selectedLead?.contactPerson || 'Chief Medical Officer',
      adminEmail: onboardData.email || `admin@${(onboardData.slug || 'hospital').toLowerCase()}.org`,
      adminPhone: onboardData.phone || '+91 98765 43210',
      planTier: onboardData.planTier || 'trial',
      status: 'active',
      totalDoctors: plan ? plan.maxDoctors : 3,
      totalPatients: 0,
      totalBeds: onboardData.totalBeds > 0 ? onboardData.totalBeds : (plan ? plan.maxBeds : 20),
      createdAt: new Date().toISOString().split('T')[0],
      logoUrl: onboardData.logoUrl,
      image: onboardData.logoUrl,
    };

    MockStorage.saveHospital(newHosp);

    if (selectedLead) {
      MockStorage.updateDemoRequestStatus(selectedLead.id, 'converted');
    }

    showToast('Hospital Facility Onboarded', `${newHosp.name} successfully registered on ${plan?.name || `${MockStorage.getTrialDays()}-Day Free Trial`}.`, 'success');
    setIsOnboardModalOpen(false);
    setSelectedLead(null);
    loadData();
  };

  const handleExportCSV = () => {
    MockStorage.exportToCSV('Inbound_Demo_Requests', filteredLeads);
    showToast('Export Complete', 'Demo requests lead log exported as CSV.', 'success');
  };

  // Filtered Leads
  const filteredLeads = demoRequests.filter((lead) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      lead.hospitalName.toLowerCase().includes(query) ||
      lead.contactPerson.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.phone.toLowerCase().includes(query) ||
      (lead.city && lead.city.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesBed = bedFilter === 'all' || (lead.bedCapacity && lead.bedCapacity.includes(bedFilter));

    return matchesSearch && matchesStatus && matchesBed;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Inbound Demo Requests & Prospective Hospital Leads"
        subtitle="Manage prospective hospital demo requests received through the public portal, track sales follow-ups, and convert verified leads into provisioned tenant workspaces."
        breadcrumbs={
          user?.portal === 'sales'
            ? [{ label: 'Sales HQ', href: '/sales/dashboard' }, { label: 'Demo Requests' }]
            : [{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Demo Requests' }]
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(user?.portal === 'sales' ? '/sales/customers' : '/platform/hospitals')}
              leftIcon={<Building2 className="w-3.5 h-3.5" />}
            >
              {user?.portal === 'sales' ? 'View Converted Hospitals' : 'View Active Hospitals'}
            </Button>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Demo Requests"
          value={totalLeads}
          icon={<PhoneCall className="w-5 h-5" />}
          trend={{ value: 'Inbound Portal', direction: 'up', label: 'All-time submissions' }}
          accentColor="indigo"
          subtext="Prospects requesting platform preview"
        />
        <StatCard
          title="Action Required (New)"
          value={newCount}
          icon={<Sparkles className="w-5 h-5" />}
          trend={{ value: `${newCount} pending`, direction: 'up', label: 'Needs callback' }}
          accentColor="rose"
          subtext="Unprocessed incoming requests"
        />
        <StatCard
          title="Demos Scheduled"
          value={scheduledCount}
          icon={<Calendar className="w-5 h-5" />}
          trend={{ value: `${scheduledCount} sessions`, direction: 'neutral', label: 'Calendar invites' }}
          accentColor="cyan"
          subtext="Sales meetings arranged"
        />
        <StatCard
          title="Converted to Tenants"
          value={convertedCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ value: `${convertedCount} facilities`, direction: 'up', label: 'Live onboarded' }}
          accentColor="emerald"
          subtext="Successfully converted to workspaces"
        />
      </div>

      {/* 3. Filter Bar & Search */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search hospital name, contact person, email, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
              />
            </div>

            {/* Bed Capacity Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-xs font-semibold text-slate-600 shrink-0">Bed Filter:</label>
              <select
                value={bedFilter}
                onChange={(e) => setBedFilter(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="all">All Bed Capacities</option>
                <option value="0-50">0 - 50 Beds (Clinic)</option>
                <option value="51-150">51 - 150 Beds (Community)</option>
                <option value="151-500">151 - 500 Beds (Hospital)</option>
                <option value="500+">500+ Beds (Multi-Specialty)</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Requests ({totalLeads})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'new'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              🔴 New Leads ({newCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('contacted')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'contacted'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              🟡 Contacted ({contactedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('scheduled')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'scheduled'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              🔵 Scheduled ({scheduledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('converted')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'converted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              🟢 Converted ({convertedCount})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Leads Table */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-purple-600" />
              <span>Inbound Hospital Lead Pipeline</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                {filteredLeads.length} Available
              </span>
            </div>
          }
          subtitle="Click 'Onboard Tenant' to provision a tenant workspace directly from an inbound request."
        />

        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50/50">
              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No Demo Requests Found</p>
              <p className="text-slate-500 mt-1">No incoming leads match the current filters or search term.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[1240px]">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 pl-6 pr-4 min-w-[280px]">Hospital Entity & Type</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Contact Person</th>
                  <th className="py-3.5 px-4 min-w-[210px]">Direct Contact</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Bed Scale</th>
                  <th className="py-3.5 px-4 min-w-[230px]">Requested Demo Slot</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Pipeline Status</th>
                  <th className="py-3.5 pr-6 pl-4 text-right min-w-[190px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 pl-6 pr-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 border border-purple-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5">
                          {lead.hospitalName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm leading-snug">{lead.hospitalName}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200/60">
                              {lead.hospitalType || 'General Hospital'}
                            </span>
                            {(lead.city || lead.state) && (
                              <span className="flex items-center gap-1 text-slate-500 font-medium">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                {lead.city || 'India'}{lead.state ? `, ${lead.state}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <p className="font-bold text-slate-900 text-xs leading-snug">{lead.contactPerson}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{lead.designation || 'Medical Director / Decision Maker'}</p>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                          title={lead.email}
                        >
                          <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{lead.email}</span>
                        </a>
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{lead.phone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/80 font-bold text-xs whitespace-nowrap shadow-2xs">
                        <span className="text-sm">🛏️</span>
                        <span>{lead.bedCapacity || '50-150 Beds'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      {lead.preferredDate ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200/60 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{lead.preferredDate}</span>
                            {lead.preferredTime && (
                              <span className="text-purple-600 font-normal">at {lead.preferredTime}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Immediate / Flexible</span>
                      )}
                      {lead.message && (
                        <div
                          className="text-[11px] text-slate-600 mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200/70 max-w-[240px] leading-relaxed"
                          title={lead.message}
                        >
                          <span className="text-slate-400 font-serif mr-1 font-bold">“</span>
                          <span className="line-clamp-2">{lead.message}</span>
                          <span className="text-slate-400 font-serif ml-1 font-bold">”</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 align-top">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(lead.id, e.target.value as DemoRequest['status'], lead.hospitalName)
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                          lead.status === 'new'
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : lead.status === 'contacted'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : lead.status === 'scheduled'
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        }`}
                      >
                        <option value="new">🔴 New Lead</option>
                        <option value="contacted">🟡 Contacted</option>
                        <option value="scheduled">🔵 Scheduled</option>
                        <option value="converted">🟢 Converted</option>
                      </select>
                    </td>

                    <td className="py-4 pr-6 pl-4 text-right align-top whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {isSuperAdmin ? (
                          <Button
                            variant="coral"
                            style={{ backgroundColor: '#FF3030', borderColor: '#FF3030', color: '#ffffff' }}
                            size="xs"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenOnboardModal(lead)}
                            title="Convert this lead into an onboarded hospital facility"
                            className="font-bold shadow-xs whitespace-nowrap px-3 py-1.5"
                          >
                            Onboard Tenant
                          </Button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded"
                            title="Super Admin authorization required"
                          >
                            <ShieldCheck className="w-3 h-3 text-slate-400" />
                            Super Admin Only
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDemoRequest(lead.id, lead.hospitalName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Delete demo request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* 5. QUICK ONBOARD HOSPITAL MODAL */}
      <Modal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        title="Onboard New Healthcare Facility"
        subtitle={`Convert lead "${selectedLead?.hospitalName}" into an active provisioned tenant`}
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmOnboardSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Super Admin Provisioning Pipeline</p>
              <p className="text-purple-800 text-[11px] mt-0.5">
                Onboarding a new hospital tenant will initialize isolated records, configure default administrator credentials, and set up clinical bed capacity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Hospital Facility Name *"
              placeholder="e.g. Apollo Multi-Specialty Hospital"
              value={onboardData.name}
              onChange={(e) =>
                setOnboardData({
                  ...onboardData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                })
              }
              required
            />
            <Input
              label="Tenant Subdomain / Slug *"
              placeholder="e.g. apollo-hospital"
              value={onboardData.slug}
              onChange={(e) => setOnboardData({ ...onboardData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Type *</label>
              <select
                value={onboardData.type}
                onChange={(e) => setOnboardData({ ...onboardData, type: e.target.value as HospitalType })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="General Hospital">General Hospital</option>
                <option value="Multi-Specialty Center">Multi-Specialty Center</option>
                <option value="Super Specialty">Super Specialty</option>
                <option value="Children Hospital">Children's Hospital</option>
                <option value="Research & Care">Research & Care Institute</option>
                <option value="Emergency Care Unit">Emergency Care Unit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan Tier *</label>
              <select
                value={onboardData.planTier}
                onChange={(e) => setOnboardData({ ...onboardData, planTier: e.target.value as SubscriptionPlanTier })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="trial">Trial Plan ({MockStorage.getTrialDays()}-Day Free Trial - ₹0)</option>
                <option value="basic">Starter Clinic (Basic - ₹4,999/mo)</option>
                <option value="standard">Professional Hospital (Standard - ₹14,999/mo)</option>
                <option value="enterprise">Enterprise Health Network (Enterprise - ₹39,999/mo)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="City Location *"
              placeholder="e.g. Mumbai"
              value={onboardData.city}
              onChange={(e) => setOnboardData({ ...onboardData, city: e.target.value })}
              required
            />
            <Input
              label="State / Province"
              placeholder="e.g. Maharashtra"
              value={onboardData.state}
              onChange={(e) => setOnboardData({ ...onboardData, state: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Hospital Admin Email *"
              type="email"
              placeholder="admin@hospital.org"
              value={onboardData.email}
              onChange={(e) => setOnboardData({ ...onboardData, email: e.target.value })}
              required
            />
            <Input
              label="Official Contact Phone *"
              type="tel"
              placeholder="+91 98765 43210"
              value={onboardData.phone}
              onChange={(e) => setOnboardData({ ...onboardData, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Initial Bed Capacity</label>
              <input
                type="number"
                min="0"
                value={onboardData.totalBeds}
                onChange={(e) => setOnboardData({ ...onboardData, totalBeds: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Photo / Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isCompressingLogo}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsOnboardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="coral"
              type="submit"
              style={{ backgroundColor: '#FF3030', borderColor: '#FF3030', color: '#ffffff' }}
              className="font-bold shadow-md shadow-[#FF3030]/20"
            >
              Provision & Onboard Hospital
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

