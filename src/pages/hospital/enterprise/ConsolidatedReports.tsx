import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  Filter,
  Download,
  Users,
  BedDouble,
  Receipt,
  Stethoscope,
  TrendingUp,
  MapPin,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { MockStorage } from '../../../services/mockStorage';
import { Organization, Hospital } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { useNotification } from '../../../context/NotificationContext';

export const ConsolidatedReports: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Hospital[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('this_month');
  const [metrics, setMetrics] = useState<any>(null);

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

      const met = MockStorage.getConsolidatedEnterpriseMetrics(org.id, selectedBranchId, dateRange);
      setMetrics(met);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [user, currentHospital, selectedBranchId, dateRange]);

  const handleExportCSV = () => {
    if (!metrics || !metrics.branchSummaries) return;

    const headers = ['Branch Name', 'Branch Code', 'City', 'Patients', 'Appointments', 'Admissions', 'Total Beds', 'Bed Occupancy %', 'Doctors', 'Settled Revenue (INR)'];
    const rows = metrics.branchSummaries.map((b: any) => [
      `"${b.hospitalName}"`,
      `"${b.branchCode}"`,
      `"${b.city}"`,
      b.patientCount,
      b.appointmentCount,
      b.admissionCount,
      b.totalBeds,
      `${b.bedOccupancyRate}%`,
      b.doctorCount,
      b.revenue,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${organization?.slug || 'enterprise'}-consolidated-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    showToast('Report Exported', 'Consolidated CSV performance report downloaded successfully.', 'success');
  };

  if (!organization || !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader title="Consolidated Reports" subtitle="Multi-branch operational intelligence" />
        <Card className="p-8 text-center text-slate-500">No Enterprise organization data found.</Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Consolidated Enterprise Reports"
          subtitle={`Aggregated clinical and financial metrics across ${organization.name} network facilities`}
        />

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Report Filters:</span>
          </div>

          <div className="min-w-[200px]">
            <Select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              options={[
                { value: 'all', label: `All Network Branches (${branches.length})` },
                ...branches.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.branchCode || b.city})`,
                })),
              ]}
            />
          </div>

          <div className="min-w-[180px]">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: 'this_month', label: 'Current Billing Cycle' },
                { value: 'last_30_days', label: 'Last 30 Days' },
                { value: 'quarter_to_date', label: 'Quarter to Date' },
                { value: 'year_to_date', label: 'Year to Date' },
              ]}
            />
          </div>

          <div className="ml-auto text-xs text-slate-400">
            Showing authorized live database metrics for <strong className="text-slate-700">{organization.name}</strong>
          </div>
        </div>
      </Card>

      {/* Group Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Facilities</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalBranches}</span>
            <span className="text-xs text-emerald-600 font-semibold">{metrics.activeBranches} Active</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Group-wide footprint</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Patients</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalPatients.toLocaleString()}</span>
            <span className="text-xs text-teal-600 font-semibold">Registered</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Electronic Health Records</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OPD Appointments</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalAppointments.toLocaleString()}</span>
            <span className="text-xs text-brand-600 font-semibold">Consultations</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Scheduled & Completed</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bed Occupancy Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.totalBeds > 0 ? Math.round((metrics.totalAdmissions / metrics.totalBeds) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500">
              {metrics.totalAdmissions} / {metrics.totalBeds} Beds
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Inpatient capacity utilized</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settled Revenue</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{metrics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Paid</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Invoicing collections</span>
        </Card>
      </div>

      {/* Comparative Facility Breakdown Table */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Comparative Facility Breakdown</h3>
          <span className="text-xs text-slate-400 font-mono">
            {metrics.branchSummaries?.length} facilities reporting
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Branch Facility</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5 text-center">Doctors</th>
                <th className="px-6 py-3.5 text-center">Patients</th>
                <th className="px-6 py-3.5 text-center">Appointments</th>
                <th className="px-6 py-3.5 text-center">Admissions</th>
                <th className="px-6 py-3.5 text-center">Bed Occupancy</th>
                <th className="px-6 py-3.5 text-right">Settled Revenue</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.branchSummaries?.map((b: any) => (
                <tr key={b.hospitalId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                        {b.branchCode}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{b.hospitalName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Tenant ID: {b.hospitalId}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.city}, {b.state}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center font-semibold text-slate-800">{b.doctorCount}</td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-800">{b.patientCount}</td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-800">{b.appointmentCount}</td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-800">{b.admissionCount}</td>

                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{b.bedOccupancyRate}%</span>
                      <span className="text-[10px] text-slate-400">
                        ({b.activeAdmissions}/{b.totalBeds})
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    ₹{b.revenue.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Operational
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-900">
              <tr>
                <td className="px-6 py-3.5" colSpan={2}>
                  Consolidated Network Totals
                </td>
                <td className="px-6 py-3.5 text-center">{metrics.totalDoctors}</td>
                <td className="px-6 py-3.5 text-center">{metrics.totalPatients}</td>
                <td className="px-6 py-3.5 text-center">{metrics.totalAppointments}</td>
                <td className="px-6 py-3.5 text-center">{metrics.totalAdmissions}</td>
                <td className="px-6 py-3.5 text-center">
                  {metrics.totalBeds > 0 ? Math.round((metrics.totalAdmissions / metrics.totalBeds) * 100) : 0}%
                </td>
                <td className="px-6 py-3.5 text-right text-brand-600">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </td>
                <td className="px-6 py-3.5 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};
