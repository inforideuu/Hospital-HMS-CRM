import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Search,
  Lock,
  UserPlus,
  Key,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { MockStorage } from '../../../services/mockStorage';
import { Organization, User, Hospital } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export const BranchAdminManagement: React.FC = () => {
  const { user, currentHospital } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      const branchAdmins = MockStorage.getBranchAdmins(org.id);
      setAdmins(branchAdmins);
      setHospitals(MockStorage.getHospitals());
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [user, currentHospital]);

  if (!organization) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader title="Branch Admin Management" subtitle="Administrator directory across network facilities" />
        <Card className="p-8 text-center text-slate-500">No Enterprise organization found.</Card>
      </div>
    );
  }

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.hospitalName && a.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Branch Admin Management"
          subtitle={`Designated hospital administrators and facility-level access scopes across ${organization.name}`}
        />
      </div>

      {/* Security Scope Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Role-Based Access Control & Strict Data Isolation</p>
          <p className="text-indigo-800 leading-relaxed">
            Organization Admins hold governance privileges over the healthcare group. Each designated Branch
            Administrator is cryptographically restricted to their assigned facility, ensuring medical records,
            pharmacy stock, and invoicing data cannot be accessed across unauthorized branch borders.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter administrators by name, email, or branch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>

      {/* Administrators Table */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Administrator</th>
                <th className="px-6 py-3.5">Assigned Facility</th>
                <th className="px-6 py-3.5">Permission Scope</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Account Created</th>
                <th className="px-6 py-3.5 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAdmins.map((admin) => {
                const assignedHosp = hospitals.find((h) => h.id === admin.hospitalId);
                const isOrgAdmin = admin.isOrganizationAdmin;

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            admin.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={admin.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{admin.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{admin.hospitalName || assignedHosp?.name}</p>
                          <span className="font-mono text-[10px] text-slate-400 block">
                            Code: {assignedHosp?.branchCode || admin.hospitalId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {isOrgAdmin ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            Dual Scope: Org & Branch Admin
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Full Group Governance + {assignedHosp?.city || 'Chennai'} Operations
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <Lock className="w-3 h-3 text-teal-600" />
                            Branch Administrator Only
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Restricted to {assignedHosp?.name || 'Assigned Branch'}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {admin.createdAt || '2026-09-20'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {admin.permittedBranchIds?.join(', ') || admin.hospitalId}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
