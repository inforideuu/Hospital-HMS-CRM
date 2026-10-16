import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  MapPin,
  Users,
  BedDouble,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  Lock,
  Mail,
  Phone,
  UserCheck,
  Network,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { MockStorage } from '../../../services/mockStorage';
import { Organization, Hospital } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context/NotificationContext';

export const BranchManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentHospital, switchHospital } = useAuth();
  const { showToast } = useNotification();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Branch Creation Form State
  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
    branchAdminName: '',
    branchAdminEmail: '',
    branchAdminPhone: '',
    initialPassword: 'Password@123',
  });

  const loadData = () => {
    const orgId =
      user?.organizationId ||
      currentHospital?.organizationId ||
      (currentHospital ? MockStorage.getOrganizationByHospitalId(currentHospital.id)?.id : undefined);

    let org = orgId ? MockStorage.getOrganizationById(orgId) : undefined;
    if (!org) {
      const allOrgs = MockStorage.getOrganizations();
      org = allOrgs.find((o) => o.planTier === 'enterprise') || allOrgs[0];
    }

    if (org) {
      setOrganization(org);
      const allHospitals = MockStorage.getHospitals();
      const orgBranches = allHospitals.filter(
        (h) => h.organizationId === org.id || (org.branches && org.branches.includes(h.id))
      );
      setBranches(orgBranches);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [user, currentHospital]);

  const handlePreFillBangalore = () => {
    setFormData({
      branchName: 'ABC Bangalore Hospital',
      branchCode: 'ABC-BLR',
      address: '88 Hosur Road, Koramangala 5th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      contactPerson: 'Dr. Anita Desai',
      contactPhone: '+91 80 4123 4567',
      contactEmail: 'contact@abcbangalore.org',
      description: 'Comprehensive tertiary multispecialty center serving the Bengaluru technology corridor.',
      branchAdminName: 'Dr. Anita Desai',
      branchAdminEmail: 'admin@abcbangalore.org',
      branchAdminPhone: '+91 98450 12345',
      initialPassword: 'Password@123',
    });
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    // Step 5 Security & Validation
    if (!user?.isOrganizationAdmin && user?.role !== 'super_admin') {
      showToast('Permission Denied', 'Only authorized Organization Admins can provision new network branches.', 'error');
      return;
    }

    if (!formData.branchName || !formData.branchCode || !formData.city || !formData.branchAdminEmail) {
      showToast('Missing Fields', 'Please complete all required fields.', 'error');
      return;
    }

    const res = MockStorage.createBranch({
      organizationId: organization.id,
      branchName: formData.branchName,
      branchCode: formData.branchCode,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      contactPerson: formData.contactPerson || formData.branchAdminName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      description: formData.description,
      branchAdminName: formData.branchAdminName,
      branchAdminEmail: formData.branchAdminEmail,
      branchAdminPhone: formData.branchAdminPhone,
      initialPassword: formData.initialPassword,
    });

    if (res.success && res.branch) {
      showToast(
        'Branch Provisioned Successfully',
        `${res.branch.name} (${res.branch.branchCode}) created. Dedicated Branch Admin (${formData.branchAdminEmail}) has been provisioned and draft website initialized.`,
        'success'
      );
      setIsAddModalOpen(false);
      setFormData({
        branchName: '',
        branchCode: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        description: '',
        branchAdminName: '',
        branchAdminEmail: '',
        branchAdminPhone: '',
        initialPassword: 'Password@123',
      });
      loadData();
    } else {
      showToast('Failed to Provision Branch', res.message || 'Validation error.', 'error');
    }
  };

  const handleSwitchBranch = (hospId: string) => {
    switchHospital(hospId);
    showToast('Switched Hospital Workspace', `Now managing ${hospId}`, 'info');
    navigate('/hospital/dashboard');
  };

  if (!organization) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader title="Branch Management" subtitle="Multi-facility expansion and branch operations" />
        <Card className="p-8 text-center text-slate-500">
          No Enterprise organization found for the current user.
        </Card>
      </div>
    );
  }

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.branchCode && b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const maxBranches = organization.maxBranches || 10;
  const isAtLimit = branches.length >= maxBranches;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Branch Management"
          subtitle={`Multi-facility network topology for ${organization.name}. Each branch maintains independent operational records.`}
        />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-700 block">
              {branches.length} of {maxBranches} Branches Used
            </span>
            <span className="text-[10px] text-slate-400">
              {maxBranches - branches.length} remaining under Enterprise plan
            </span>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            disabled={isAtLimit}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Quota Banner if near or at limit */}
      {isAtLimit && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Branch Allocation Quota Reached:</span> You have provisioned all {maxBranches}{' '}
            branches included in your Enterprise Health Network tier. Contact Platform Superadmin to expand your quota.
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search branches by name, city, or branch code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBranches.map((branch) => {
          const isCurrent = currentHospital?.id === branch.id;
          const isFlagship = organization.primaryHospitalId === branch.id;
          const website = MockStorage.getWebsiteByHospitalId(branch.id);
          const isWebPublished = website?.status === 'published' || website?.published === true;
          const websiteSlug = branch.branchCode ? branch.branchCode.toLowerCase() : branch.id.toLowerCase();

          return (
            <Card
              key={branch.id}
              className={`p-5 transition-all border ${
                isCurrent
                  ? 'border-brand-500 bg-brand-50/15 shadow-md ring-1 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                      {branch.branchCode || 'BR-HQ'}
                    </span>
                    {isFlagship && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Initial Flagship
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{branch.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {branch.city}, {branch.state || branch.country}
                  </p>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    branch.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {branch.status === 'active' ? 'Operational' : branch.status}
                </span>
              </div>

              {/* Operational Stats Grid */}
              <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patients</span>
                  <span className="font-bold text-slate-800">
                    {MockStorage.getPatients(branch.id).length || branch.totalPatients || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Doctors</span>
                  <span className="font-bold text-slate-800">
                    {MockStorage.getDoctors(branch.id).length || branch.totalDoctors || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Beds</span>
                  <span className="font-bold text-slate-800">{branch.totalBeds || 50}</span>
                </div>
              </div>

              {/* Branch Admin & Website Info */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Branch Admin</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {branch.adminName || 'Admin Assigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Public Website</span>
                  {isWebPublished ? (
                    <a
                      href={`/hospital/${websiteSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                    >
                      <span>Published</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                      Draft (Pending Publish)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">Tenant: {branch.id}</span>
                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : 'primary'}
                  onClick={() => handleSwitchBranch(branch.id)}
                >
                  {isCurrent ? 'Current Workspace' : 'Manage Operations'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Branch Modal (Step 5) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Enterprise Branch Hospital"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateBranch} className="space-y-5 p-1">
          <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-brand-900">
              <Network className="w-4 h-4 text-brand-600" />
              <span>
                Adding new branch under <strong className="font-semibold">{organization.name}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handlePreFillBangalore}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-800 bg-white px-2.5 py-1 rounded-lg border border-brand-200 shadow-xs cursor-pointer"
            >
              Autofill ABC Bangalore
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Branch Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Branch Hospital Name"
                placeholder="e.g. ABC Bangalore Hospital"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                required
              />
              <Input
                label="Branch Code (Unique Identifier)"
                placeholder="e.g. ABC-BLR"
                value={formData.branchCode}
                onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                placeholder="e.g. Bengaluru"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
              <Input
                label="State"
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
              <Input
                label="Country"
                placeholder="e.g. India"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>

            <Input
              label="Street Address"
              placeholder="e.g. 88 Hosur Road, Koramangala 5th Block"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                placeholder="e.g. +91 80 4123 4567"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                required
              />
              <Input
                label="Contact Email"
                type="email"
                placeholder="e.g. contact@abcbangalore.org"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Designated Branch Administrator Credentials
            </h4>
            <p className="text-[11px] text-slate-500">
              This administrator will receive access strictly to manage this branch facility only.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Branch Admin Full Name"
                placeholder="e.g. Dr. Anita Desai"
                value={formData.branchAdminName}
                onChange={(e) => setFormData({ ...formData, branchAdminName: e.target.value })}
                required
              />
              <Input
                label="Branch Admin Email (Login ID)"
                type="email"
                placeholder="e.g. admin@abcbangalore.org"
                value={formData.branchAdminEmail}
                onChange={(e) => setFormData({ ...formData, branchAdminEmail: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Branch Admin Phone"
                placeholder="e.g. +91 98450 12345"
                value={formData.branchAdminPhone}
                onChange={(e) => setFormData({ ...formData, branchAdminPhone: e.target.value })}
              />
              <Input
                label="Temporary Password"
                type="text"
                placeholder="Password@123"
                value={formData.initialPassword}
                onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Provision Branch & Admin Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
