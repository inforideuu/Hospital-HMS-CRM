import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Save,
  CheckCircle2,
  Calendar,
  Globe,
  Award,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { MockStorage } from '../../../services/mockStorage';
import { Organization } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useNotification } from '../../../context/NotificationContext';

export const OrganizationProfile: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    headquartersCity: '',
    headquartersAddress: '',
    contactEmail: '',
    contactPhone: '',
    maxBranches: 10,
  });

  useEffect(() => {
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
      setFormData({
        name: org.name,
        headquartersCity: org.headquartersCity || '',
        headquartersAddress: org.headquartersAddress || '',
        contactEmail: org.contactEmail || '',
        contactPhone: org.contactPhone || '',
        maxBranches: org.maxBranches || 10,
      });
    }
  }, [user, currentHospital]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if (!formData.name.trim()) {
      showToast('Validation Error', 'Organization name is required.', 'error');
      return;
    }

    const updated: Organization = {
      ...organization,
      name: formData.name.trim(),
      headquartersCity: formData.headquartersCity.trim(),
      headquartersAddress: formData.headquartersAddress.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
    };

    MockStorage.saveOrganization(updated);
    setOrganization(updated);
    showToast('Organization Profile Updated', `${updated.name} profile has been saved successfully.`, 'success');
  };

  if (!organization) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <PageHeader title="Organization Profile" subtitle="Manage healthcare group identity and headquarters records" />
        <Card className="p-8 text-center text-slate-500">
          No Enterprise organization found for the current context.
        </Card>
      </div>
    );
  }

  const primaryHospital = MockStorage.getHospitalById(organization.primaryHospitalId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      <PageHeader
        title="Organization Profile"
        subtitle="Manage master healthcare network identity, headquarters registry, and governance credentials"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Group Snapshot */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-800 shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 mb-4">
              <Building2 className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
              Enterprise Health Network
            </span>

            <h2 className="text-xl font-extrabold text-white mt-3 leading-snug">{organization.name}</h2>
            <p className="text-xs text-slate-400 mt-1">Master Enterprise Entity</p>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Organization ID</span>
                <span className="font-mono font-bold text-white">{organization.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Headquarters</span>
                <span className="font-semibold text-white">{organization.headquartersCity || 'Chennai'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Primary Facility</span>
                <span className="font-semibold text-white truncate max-w-[150px]">
                  {primaryHospital?.name || 'Chennai Hospital'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Branches</span>
                <span className="font-bold text-teal-400">
                  {organization.branches?.length || 1} of {organization.maxBranches || 10} Used
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 bg-white space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Compliance & Security</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Multi-tenant data isolation active</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>HIPAA & NABH compliant branch vault</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Cross-facility audit logging enabled</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white border-slate-200 shadow-sm">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Entity Information</h3>
                <p className="text-xs text-slate-500">Legal organization title and registered headquarters</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Healthcare Group Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ABC Healthcare Group"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Headquarters City"
                    value={formData.headquartersCity}
                    onChange={(e) => setFormData({ ...formData, headquartersCity: e.target.value })}
                    placeholder="e.g. Chennai"
                    required
                  />
                  <Input
                    label="Group Contact Phone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="e.g. +91 44 2834 9000"
                  />
                </div>

                <Input
                  label="Group Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="e.g. contact@abchealthcare.org"
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Headquarters Address
                  </label>
                  <textarea
                    rows={3}
                    value={formData.headquartersAddress}
                    onChange={(e) => setFormData({ ...formData, headquartersAddress: e.target.value })}
                    placeholder="e.g. 45 Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017"
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button type="submit" variant="primary" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Organization Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
