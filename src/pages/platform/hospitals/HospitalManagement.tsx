import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Edit,
  Trash2,
  Download,
  Eye,
  ShieldCheck,
  Globe,
  Copy,
  Key,
  Check,
  Camera,
  Upload,
  Image as ImageIcon,
  Zap,
  FileText,
  Network,
  Layers,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { Hospital, HospitalType, SubscriptionPlanTier, HospitalStatus, ConvertedCustomer, EnterpriseBranchDocument } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { compressImage } from '../../../utils/imageCompressor';
import { UserCheck, Sparkles } from 'lucide-react';
import { OnboardSubBranchModal } from '../../../components/platform/OnboardSubBranchModal';

export const HospitalManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'super_admin_manager';

  const currentTab = (searchParams.get('tab') as 'facilities' | 'enterprise_requests') || 'facilities';
  const setActiveTab = (tab: 'facilities' | 'enterprise_requests') => {
    setSearchParams({ tab });
  };

  const [hospitals, setHospitals] = useState<Hospital[]>(() => MockStorage.getHospitals());
  const [convertedCustomers, setConvertedCustomers] = useState<ConvertedCustomer[]>(() => MockStorage.getConvertedCustomers());
  const [enterpriseDocs, setEnterpriseDocs] = useState<EnterpriseBranchDocument[]>(() => MockStorage.getEnterpriseBranchDocuments());
  const [selectedCustomerToOnboard, setSelectedCustomerToOnboard] = useState<ConvertedCustomer | null>(null);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isOnboardBranchModalOpen, setIsOnboardBranchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sub-Branch Provisioning Modal State (Super Admin & Super Admin Manager)
  const [selectedDocForProvision, setSelectedDocForProvision] = useState<EnterpriseBranchDocument | null>(null);
  const [isProvisionBranchModalOpen, setIsProvisionBranchModalOpen] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
    branchName: '',
    branchCode: '',
    city: '',
    state: '',
    country: 'India',
    address: '',
    totalBeds: 50,
    branchAdminName: '',
    branchAdminEmail: '',
    branchAdminPassword: 'Admin@123',
    branchAdminPhone: '',
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    regNumber: '',
    type: 'General Hospital' as HospitalType,
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    postalCode: '',
    planTier: 'trial' as SubscriptionPlanTier,
    totalBeds: 20,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    logoUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
  });

  const refreshData = () => {
    setHospitals(MockStorage.getHospitals());
    setConvertedCustomers(MockStorage.getConvertedCustomers());
    setEnterpriseDocs(MockStorage.getEnterpriseBranchDocuments());
  };

  const pendingOnboardingCustomers = convertedCustomers.filter(
    (c) => c.onboardingStatus === 'Pending Onboarding' || c.subscriptionStatus === 'Pending Setup'
  );

  const handleOpenOnboardModal = (cust: ConvertedCustomer) => {
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to onboard hospital facilities.', 'error');
      return;
    }
    setSelectedCustomerToOnboard(cust);
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
      totalBeds: plan?.tier === 'basic' ? 0 : (plan?.maxBeds ?? 20),
      adminName: cust.contactPerson || '',
      adminEmail: cust.email || '',
      adminPassword: 'Admin@123',
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    });
    setIsOnboardModalOpen(true);
  };

  const handleConfirmOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to onboard hospital facilities.', 'error');
      return;
    }
    if (!selectedCustomerToOnboard) return;

    const photo = formData.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80';
    const plan = MockStorage.getPlanByTier(formData.planTier);
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const newHospital: Hospital = {
      id: selectedCustomerToOnboard.hospitalId || `HOSP-00${hospitals.length + 1}`,
      ...formData,
      adminName: selectedCustomerToOnboard.contactPerson,
      adminEmail: selectedCustomerToOnboard.email,
      adminPhone: selectedCustomerToOnboard.phone,
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
    selectedCustomerToOnboard.subscriptionStatus = formData.planTier === 'trial' ? 'Trial' : 'Active';
    selectedCustomerToOnboard.hospitalAdminStatus = 'Created';
    selectedCustomerToOnboard.onboardingStatus = 'Onboarded';
    MockStorage.saveConvertedCustomer(selectedCustomerToOnboard);

    showToast(
      'Hospital Onboarded Successfully',
      `${newHospital.name} converted lead onboarded by Super Admin to Hospital Network & Facilities.`
    );

    setIsOnboardModalOpen(false);
    setSelectedCustomerToOnboard(null);
    refreshData();
  };

  // KPI Calculations
  const totalHospitals = hospitals.length;
  const activeCount = hospitals.filter((h) => h.status === 'active').length;
  const pendingCount = hospitals.filter((h) => h.status === 'pending').length;
  const suspendedCount = hospitals.filter((h) => h.status === 'suspended').length;

  // Filtering
  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
    const matchesPlan = planFilter === 'all' || h.planTier === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const totalPages = Math.ceil(filteredHospitals.length / pageSize);
  const paginatedHospitals = filteredHospitals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAddModal = () => {
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to register hospital facilities.', 'error');
      return;
    }
    const defaultTier = MockStorage.getPlatformSettings().defaultPlanTier || 'trial';
    const initialPlan = MockStorage.getPlanByTier(defaultTier) || MockStorage.getPlanByTier('trial');
    setFormData({
      name: '',
      regNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'General Hospital',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'United States',
      postalCode: '',
      planTier: defaultTier,
      totalBeds: initialPlan?.maxBeds || 20,
      adminName: '',
      adminEmail: '',
      adminPassword: 'Admin@123',
      logoUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (hosp: Hospital) => {
    setSelectedHospital(hosp);
    const plan = MockStorage.getPlanByTier(hosp.planTier);
    setFormData({
      name: hosp.name,
      regNumber: hosp.regNumber,
      type: hosp.type,
      email: hosp.email,
      phone: hosp.phone,
      address: hosp.address,
      city: hosp.city,
      state: hosp.state,
      country: hosp.country,
      postalCode: hosp.postalCode,
      planTier: hosp.planTier || 'trial',
      totalBeds: hosp.planTier === 'basic' ? 0 : (hosp.totalBeds ?? (plan?.maxBeds ?? 20)),
      adminName: hosp.adminName || '',
      adminEmail: hosp.adminEmail || '',
      adminPassword: '',
      logoUrl: hosp.logoUrl || hosp.image || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Administrator has authorization to register or update hospital facilities.', 'error');
      return;
    }
    if (!formData.name || !formData.email) {
      showToast('Validation Error', 'Hospital Name and Contact Email are required', 'error');
      return;
    }

    const defaultTier = MockStorage.getPlatformSettings().defaultPlanTier || 'trial';
    const activeTier = isEditModalOpen && selectedHospital ? selectedHospital.planTier : defaultTier;
    const plan = MockStorage.getPlanByTier(activeTier);
    const photo = formData.logoUrl || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80';

    if (isEditModalOpen && selectedHospital) {
      const updated: Hospital = {
        ...selectedHospital,
        ...formData,
        planTier: selectedHospital.planTier,
        totalBeds: formData.totalBeds !== undefined && formData.totalBeds > 0 ? formData.totalBeds : (plan ? plan.maxBeds : 20),
        totalDoctors: plan ? plan.maxDoctors : (selectedHospital.totalDoctors || 3),
        logoUrl: photo,
        image: photo,
      };
      MockStorage.saveHospital(updated);
      showToast('Hospital Updated', `${updated.name} facility profile successfully updated.`);
      setIsEditModalOpen(false);
    } else {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const adminName = formData.adminName?.trim() || `${formData.name} Admin`;
      const adminEmail = formData.adminEmail?.trim() || formData.email || `admin@${slug || 'hospital'}.com`;
      const adminPassword = formData.adminPassword?.trim() || 'Admin@123';

      const newHospital: Hospital = {
        id: `HOSP-00${hospitals.length + 1}`,
        ...formData,
        adminName,
        adminEmail,
        adminPassword,
        planTier: defaultTier,
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

      showToast(
        'Hospital Registered',
        `${newHospital.name} provisioned on ${plan?.name || `${MockStorage.getTrialDays()}-Day Free Trial`}.`
      );
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleDirectLogoUpload = async (hosp: Hospital, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImage(file);
      if (dataUrl) {
        const updated: Hospital = {
          ...hosp,
          logoUrl: dataUrl,
          image: dataUrl,
        };
        MockStorage.saveHospital(updated);
        showToast('Logo Updated', `${hosp.name} facility photo uploaded successfully.`);
        refreshData();
      }
    } catch (err) {
      console.error(err);
      showToast('Upload Error', 'Failed to process image file.', 'error');
    }
  };

  const handleStatusChange = (id: string, status: HospitalStatus, name: string) => {
    MockStorage.updateHospitalStatus(id, status);
    showToast('Status Updated', `${name} is now ${status.toUpperCase()}.`);
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      MockStorage.deleteHospital(confirmDeleteId);
      showToast('Hospital Deleted', 'Hospital workspace and records removed.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  const handleExport = () => {
    MockStorage.exportToCSV('Hospital_Network_List', filteredHospitals);
    showToast('Export Successful', 'Hospital records downloaded as CSV.');
  };

  const pendingDocsCount = enterpriseDocs.filter((d) => d.status === 'pending_review').length;

  const handleDownloadManifestDoc = (doc: EnterpriseBranchDocument) => {
    if (!doc.fileData) {
      showToast('Download Error', 'No file data available for this document.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download Started', `Downloading manifest: ${doc.fileName}`);
  };

  const handleOpenProvisionBranchModal = (doc: EnterpriseBranchDocument) => {
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Super Admin Manager is restricted from onboarding hospital facilities. Only Super Administrator can provision sub-branches.', 'error');
      return;
    }
    setSelectedDocForProvision(doc);
    setBranchFormData({
      branchName: `${doc.hospitalName} - `,
      branchCode: '',
      city: '',
      state: '',
      country: 'India',
      address: '',
      totalBeds: 50,
      branchAdminName: '',
      branchAdminEmail: '',
      branchAdminPassword: `Admin@${Math.floor(100 + Math.random() * 900)}`,
      branchAdminPhone: '',
    });
    setIsProvisionBranchModalOpen(true);
  };

  const handleProvisionBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Super Admin Manager is restricted from onboarding hospital facilities. Only Super Administrator can provision sub-branches.', 'error');
      return;
    }
    if (!selectedDocForProvision) return;

    if (!branchFormData.branchName.trim() || !branchFormData.branchCode.trim() || !branchFormData.branchAdminEmail.trim()) {
      showToast('Validation Error', 'Sub-Branch Name, Branch Code, and Branch Admin Email are required.', 'error');
      return;
    }

    const headHosp = MockStorage.getHospitalById(selectedDocForProvision.hospitalId);
    const orgId = headHosp?.organizationId || selectedDocForProvision.hospitalId;

    const res = MockStorage.createBranch({
      organizationId: orgId,
      branchName: branchFormData.branchName,
      branchCode: branchFormData.branchCode,
      city: branchFormData.city || 'City',
      state: branchFormData.state || 'State',
      country: branchFormData.country || 'India',
      address: branchFormData.address || 'Sub-Branch Address',
      totalBeds: Number(branchFormData.totalBeds) || 50,
      contactPerson: branchFormData.branchAdminName,
      contactEmail: branchFormData.branchAdminEmail,
      contactPhone: branchFormData.branchAdminPhone || headHosp?.phone || '+91 98765 43210',
      branchAdminName: branchFormData.branchAdminName,
      branchAdminEmail: branchFormData.branchAdminEmail,
      branchAdminPhone: branchFormData.branchAdminPhone,
      initialPassword: branchFormData.branchAdminPassword || 'Admin@123',
      docId: selectedDocForProvision.id,
    });

    if (res.success && res.branch) {
      showToast(
        'Sub-Branch Provisioned',
        `${res.branch.name} (${res.branch.branchCode}) provisioned with public website and dedicated Branch Admin credentials.`,
        'success'
      );
      setIsProvisionBranchModalOpen(false);
      setSelectedDocForProvision(null);
      refreshData();
    } else {
      showToast('Provisioning Failed', res.message || 'Unable to create branch.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Hospital Network & Facilities"
        subtitle="Manage hospital onboarding, tenant provisioning, subscription tiers, and operational compliance."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Hospitals' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export List
            </Button>
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOnboardBranchModalOpen(true)}
                leftIcon={<Building2 className="w-3.5 h-3.5 text-purple-600" />}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 font-bold"
              >
                Onboard Sub-Branch
              </Button>
            )}
            {isSuperAdmin && (
              <Button variant="coral" size="sm" onClick={handleOpenAddModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Register Hospital
              </Button>
            )}
          </div>
        }
      />

      {/* Platform Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            currentTab === 'facilities'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Facilities</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {hospitals.length}
          </span>
        </button>

        {isPlatformAdmin && (
          <button
            onClick={() => setActiveTab('enterprise_requests')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'enterprise_requests'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Sub-Branch Manifests</span>
            {pendingDocsCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold animate-pulse">
                {pendingDocsCount} Pending
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {enterpriseDocs.length}
              </span>
            )}
          </button>
        )}
      </div>

      {currentTab === 'facilities' ? (
        <>
          {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalHospitals}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active & Operating</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approval</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{suspendedCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, city, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </Select>

            <Select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5"
            >
              <option value="all">All Plan Tiers</option>
              <option value="trial">{MockStorage.getPlanByTier('trial')?.name || `${MockStorage.getTrialDays()}-Day Free Trial`} (₹0)</option>
              <option value="basic">Starter Clinic (Basic)</option>
              <option value="standard">Professional Hospital (Standard)</option>
              <option value="enterprise">Enterprise Health Network</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        {filteredHospitals.length === 0 ? (
          <EmptyState
            title="No Hospitals Found"
            description="No matching facilities match your search query or filter selection."
            actionText="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPlanFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Hospital Workspace</th>
                  <th className="px-4 py-3.5">Primary Contact</th>
                  <th className="px-4 py-3.5">Admin Lead</th>
                  <th className="px-4 py-3.5">Plan & Capacity</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedHospitals.map((hosp) => {
                  const plan = MockStorage.getPlanByTier(hosp.planTier);
                  const isTrial = hosp.planTier === 'trial';

                  return (
                    <tr key={hosp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <img
                              src={hosp.logoUrl || hosp.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=80&auto=format&fit=crop&q=80'}
                              alt={hosp.name}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 group-hover:opacity-85 transition-all shadow-xs"
                            />
                            <label
                              htmlFor={`upload-logo-${hosp.id}`}
                              className="absolute inset-0 bg-slate-900/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white shadow-md"
                              title="Upload / Change Hospital Photo"
                            >
                              <Camera className="w-4 h-4 text-white" />
                              <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">Upload</span>
                              <input
                                id={`upload-logo-${hosp.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleDirectLogoUpload(hosp, e)}
                              />
                            </label>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 leading-tight">{hosp.name}</p>
                              {hosp.isHeadBranch && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                  Head Branch
                                </span>
                              )}
                              {hosp.isBranch && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                  Sub-Branch {hosp.branchCode ? `(${hosp.branchCode})` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{hosp.city}, {hosp.state} • <span className="font-mono text-indigo-600 font-semibold">{hosp.id}</span></p>
                            <p className="text-[10px] text-slate-400">{hosp.type}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <p className="font-medium text-slate-800">{hosp.email}</p>
                        <p className="text-[11px] text-slate-500">{hosp.phone}</p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{hosp.adminName}</p>
                        <p className="text-[11px] text-slate-500">{hosp.adminEmail}</p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            isTrial
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : hosp.planTier === 'enterprise'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : hosp.planTier === 'standard'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {plan?.name || (isTrial ? `${MockStorage.getTrialDays()}-Day Free Trial` : hosp.planTier)}
                          </span>
                          {isTrial && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {MockStorage.getTrialDays()}d Trial
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                          Max {plan?.maxBeds || hosp.totalBeds} Beds • Max {plan?.maxDoctors || hosp.totalDoctors} Docs • {plan?.maxPatients ? `${plan.maxPatients.toLocaleString('en-IN')} EHR` : ''}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {hosp.status === 'active' && <Badge variant="success" dot>Active</Badge>}
                        {hosp.status === 'pending' && <Badge variant="warning" dot>Pending</Badge>}
                        {hosp.status === 'suspended' && <Badge variant="error" dot>Suspended</Badge>}
                        {hosp.status === 'rejected' && <Badge variant="neutral" dot>Rejected</Badge>}
                      </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate(`/platform/hospitals/${hosp.id}`)}
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate(`/platform/websites/builder/${hosp.id}`)}
                          title="Build & Customize Public Website"
                        >
                          <Globe className="w-3.5 h-3.5 text-teal-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEditModal(hosp)}
                          title="Edit Hospital"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        {hosp.status === 'pending' && (
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => handleStatusChange(hosp.id, 'active', hosp.name)}
                          >
                            Approve
                          </Button>
                        )}

                        {hosp.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-amber-600 hover:bg-amber-50"
                            onClick={() => handleStatusChange(hosp.id, 'suspended', hosp.name)}
                            title="Suspend Hospital"
                          >
                            Suspend
                          </Button>
                        )}

                        {hosp.status === 'suspended' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleStatusChange(hosp.id, 'active', hosp.name)}
                            title="Reactivate"
                          >
                            Reactivate
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => setConfirmDeleteId(hosp.id)}
                          title="Delete Hospital"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredHospitals.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>
    </>
  ) : (
    /* Enterprise Sub-Branch Manifest Requests Desk (Super Admin & Super Admin Manager Only) */
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-purple-950">
              Enterprise Health Network – Sub-Branch Provisioning Desk
            </h3>
            <p className="text-xs text-purple-800 mt-0.5 max-w-3xl leading-relaxed">
              When a hospital upgrades to <strong>Enterprise Health Network</strong>, it uploads a specification document (up to 5 MB) detailing proposed sub-branches. As Super Admin or Super Admin Manager, review the manifest specifications below and click <strong>Provision Sub-Branch</strong> to instantiate branches under the hospital&apos;s network and generate their websites.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-800 text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Platform HQ Access Only</span>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Enterprise Sub-Branch Manifest Documents"
          subtitle="Hospital network submissions awaiting review and branch creation"
        />
        {enterpriseDocs.length === 0 ? (
          <EmptyState
            title="No Sub-Branch Manifests Submitted Yet"
            description="When hospitals upgrade to the Enterprise Health Network tier and attach a sub-branch specification file, it will appear here for Super Admin provisioning."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Hospital Network (Head Branch)</th>
                  <th className="px-4 py-3.5">Manifest Specification File</th>
                  <th className="px-4 py-3.5">Uploaded By</th>
                  <th className="px-4 py-3.5">Provisioning Status</th>
                  <th className="px-4 py-3.5">Linked Sub-Branches</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enterpriseDocs.map((doc) => {
                  const linkedBranches = hospitals.filter(
                    (h) => doc.provisionedBranchIds && doc.provisionedBranchIds.includes(h.id)
                  );

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{doc.hospitalName}</p>
                            <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              Head Branch
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-500">
                              {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <p className="font-medium text-slate-900">{doc.uploadedBy}</p>
                        <p className="text-[11px] text-slate-500">{doc.uploadedByEmail || 'admin@hospital.org'}</p>
                      </td>

                      <td className="px-4 py-4">
                        {doc.status === 'pending_review' && (
                          <Badge variant="warning" dot>Pending Review</Badge>
                        )}
                        {doc.status === 'provisioned' && (
                          <Badge variant="success" dot>Branches Provisioned</Badge>
                        )}
                        {doc.status === 'rejected' && (
                          <Badge variant="error" dot>Rejected</Badge>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {linkedBranches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedBranches.map((b) => (
                              <span
                                key={b.id}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {b.name} ({b.branchCode || b.id})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No sub-branches created yet</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleDownloadManifestDoc(doc)}
                            leftIcon={<Download className="w-3.5 h-3.5 text-slate-600" />}
                            title="Download uploaded manifest file"
                          >
                            Download
                          </Button>
                          <Button
                            variant="coral"
                            size="xs"
                            onClick={() => handleOpenProvisionBranchModal(doc)}
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                          >
                            Provision Sub-Branch
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )}

  {/* Provision Sub-Branch Modal (Super Admin & Manager) */}
  <Modal
    isOpen={isProvisionBranchModalOpen && !!selectedDocForProvision}
    onClose={() => {
      setIsProvisionBranchModalOpen(false);
      setSelectedDocForProvision(null);
    }}
    title="Provision Sub-Branch Facility from Manifest"
    subtitle={`Instantiating sub-branch under ${selectedDocForProvision?.hospitalName} Health Network`}
    maxWidth="2xl"
  >
    <form onSubmit={handleProvisionBranchSubmit} className="space-y-4">
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Parent Hospital Network</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedDocForProvision?.hospitalName}</p>
        </div>
        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
          Designated Head Branch
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Sub-Branch Facility Name *"
          value={branchFormData.branchName}
          onChange={(e) => setBranchFormData({ ...branchFormData, branchName: e.target.value })}
          placeholder="e.g. ABC Hospital - Mumbai"
          required
        />
        <Input
          label="Branch Code / Identifier *"
          value={branchFormData.branchCode}
          onChange={(e) => setBranchFormData({ ...branchFormData, branchCode: e.target.value.toUpperCase() })}
          placeholder="e.g. ABC-BOM"
          className="font-mono uppercase"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="City *"
          value={branchFormData.city}
          onChange={(e) => setBranchFormData({ ...branchFormData, city: e.target.value })}
          placeholder="e.g. Mumbai"
          required
        />
        <Input
          label="State / Province *"
          value={branchFormData.state}
          onChange={(e) => setBranchFormData({ ...branchFormData, state: e.target.value })}
          placeholder="e.g. Maharashtra"
          required
        />
        <Input
          label="Country *"
          value={branchFormData.country}
          onChange={(e) => setBranchFormData({ ...branchFormData, country: e.target.value })}
          placeholder="e.g. India"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            label="Street Address *"
            value={branchFormData.address}
            onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
            placeholder="e.g. Plot 45, Bandra Kurla Complex"
            required
          />
        </div>
        <Input
          label="Inpatient Bed Allocation *"
          type="number"
          min={1}
          value={branchFormData.totalBeds}
          onChange={(e) => setBranchFormData({ ...branchFormData, totalBeds: Number(e.target.value) })}
          required
        />
      </div>

      {/* Sub-Branch Administrator Credentials */}
      <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Dedicated Sub-Branch Administrator</h4>
            <p className="text-[10px] text-slate-500">
              Role: <span className="font-bold text-blue-700">Hospital Admin</span> (Restricted strictly to this sub-branch)
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
            Single-Branch Boundary
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Branch Admin Name *"
            value={branchFormData.branchAdminName}
            onChange={(e) => setBranchFormData({ ...branchFormData, branchAdminName: e.target.value })}
            placeholder="e.g. Dr. Rajesh Sharma"
            required
          />
          <Input
            label="Official Email *"
            type="email"
            value={branchFormData.branchAdminEmail}
            onChange={(e) => setBranchFormData({ ...branchFormData, branchAdminEmail: e.target.value })}
            placeholder="admin.mumbai@abchospital.com"
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Login Password *
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={branchFormData.branchAdminPassword}
                onChange={(e) => setBranchFormData({ ...branchFormData, branchAdminPassword: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-mono"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBranchFormData({ ...branchFormData, branchAdminPassword: `Admin@${Math.floor(100 + Math.random() * 900)}` })}
                className="shrink-0 text-[11px] px-2 py-1 font-bold"
              >
                Gen
              </Button>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-white border border-blue-200 text-[11px] text-slate-600 flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Security Isolation:</strong> This branch admin can <em>only</em> access and operate <strong>{branchFormData.branchName || 'this sub-branch'}</strong>. They cannot log into the Head Branch or other branches. The Head Branch Network Admin will have full multi-branch switching access.
          </p>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
        <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Public Website:</strong> A dedicated draft website will be initialized at <span className="font-mono font-bold">https://{(branchFormData.branchCode || 'branch').toLowerCase()}.pulsecorehealth.com</span>.
        </span>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => {
            setIsProvisionBranchModalOpen(false);
            setSelectedDocForProvision(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" variant="coral" size="md">
          Provision Sub-Branch & Website
        </Button>
      </div>
    </form>
  </Modal>

      {/* Add / Edit Hospital Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Hospital Details' : 'Register New Hospital Facility'}
        subtitle="Provision a dedicated multi-tenant hospital workspace on PulseCore Health OS"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveHospital} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Hospital Facility Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as HospitalType })}
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
                    {MockStorage.getPlanByTier(isEditModalOpen && selectedHospital ? selectedHospital.planTier : (MockStorage.getPlatformSettings().defaultPlanTier || 'trial')).name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {isEditModalOpen ? 'Current Plan' : 'Auto-Assigned'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isEditModalOpen
                    ? 'Subscription tiers are managed and upgraded securely via Platform Billing.'
                    : `Auto-assigned from Platform Settings (Default Tier on Signup: ${MockStorage.getPlatformSettings().defaultPlanTier || 'trial'}). Upgrades happen via Billing.`
                  }
                </p>
                {(() => {
                  const activePlanTier = isEditModalOpen && selectedHospital ? selectedHospital.planTier : (MockStorage.getPlatformSettings().defaultPlanTier || 'trial');
                  const plan = MockStorage.getPlanByTier(activePlanTier);
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
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>

          <Input
            label="Street Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Health Avenue, Suite 100"
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
            <Input
              label="State / Province"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State"
            />
            <Input
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="10001"
            />
          </div>

          {/* Hospital Photo / Image Upload Dropzone */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hospital Facility Photo / Logo Image *
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
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Photo Selected & Ready</p>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Will update hospital card and header
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Change File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await compressImage(file);
                            setFormData({ ...formData, logoUrl: dataUrl });
                            showToast('Photo Loaded', 'Hospital image updated and ready to save.');
                          } catch (err) {
                            showToast('Upload Error', 'Failed to read image file.', 'error');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                <div className="p-3 bg-indigo-100/60 rounded-full text-indigo-600 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">Click to Upload Hospital Photo / Logo File</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports PNG, JPG, WEBP formats (Auto-optimized)</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const dataUrl = await compressImage(file);
                        setFormData({ ...formData, logoUrl: dataUrl });
                        showToast('Photo Attached', 'Hospital image file ready.');
                      } catch (err) {
                        showToast('Upload Error', 'Failed to read image file.', 'error');
                      }
                    }
                  }}
                />
              </label>
            )}

            <Input
              label="Or Paste Direct Photo / Image URL"
              placeholder="https://images.unsplash.com/..."
              value={formData.logoUrl.startsWith('data:') ? '(Uploaded Image File)' : formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            />

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Quick Select Photo Preset:</label>
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
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="md">
              {isEditModalOpen ? 'Save Changes' : 'Provision Hospital'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Hospital Tenant Workspace?"
        message="Are you sure you want to permanently delete this hospital? All associated tenant records, staff profiles, and simulated EHR data will be purged."
        confirmText="Yes, Delete Tenant"
      />

      {/* Manual Onboard Sub-Branch Modal */}
      <OnboardSubBranchModal
        isOpen={isOnboardBranchModalOpen}
        onClose={() => setIsOnboardBranchModalOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />
    </div>
  );
};
