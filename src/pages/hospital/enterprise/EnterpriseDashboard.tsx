import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  GitBranch,
  Network,
  Users,
  BedDouble,
  Receipt,
  Stethoscope,
  TrendingUp,
  MapPin,
  ExternalLink,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  Globe,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { MockStorage } from '../../../services/mockStorage';
import { Organization, Hospital, SubscriptionPlan } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export const EnterpriseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentHospital, switchHospital } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const loadData = () => {
    // Resolve organization
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
      const met = MockStorage.getConsolidatedEnterpriseMetrics(org.id);
      setMetrics(met);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [user, currentHospital]);

  const handleSwitchToBranch = (hospId: string) => {
    switchHospital(hospId);
    navigate('/hospital/dashboard');
  };

  if (!organization || !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Enterprise Health Network Dashboard"
          subtitle="Consolidated multi-facility orchestration and network intelligence"
        />
        <Card className="p-8 text-center bg-slate-50 border-slate-200">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Enterprise Organization Assigned</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Your current hospital has not been linked to an active Enterprise Health Network organization.
          </p>
          <div className="mt-5">
            <Button variant="primary" onClick={() => navigate('/hospital/settings')}>
              View Subscription Options
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const branchCount = metrics.totalBranches || 1;
  const maxBranches = organization.maxBranches || 10;
  const quotaPercentage = Math.min(100, Math.round((branchCount / maxBranches) * 100));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Banner / Organization Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-500/30">
                <Network className="w-3.5 h-3.5 text-brand-400" />
                Enterprise Health Network
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Subscription Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              {organization.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Headquarters: {organization.headquartersCity || 'Chennai, India'}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Group ID: <span className="font-mono text-white font-semibold">{organization.id}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Member Since: {organization.createdAt || '2026'}
              </span>
            </div>
          </div>

          {/* Branch Allocation Quota Indicator */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 min-w-[260px] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Branch Capacity</span>
              <span className="font-bold text-white font-mono">
                {branchCount} / {maxBranches} Provisioned
              </span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-brand-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{maxBranches - branchCount} Slots Remaining</span>
              <Link to="/hospital/enterprise/branches" className="text-brand-300 hover:text-white font-semibold">
                Manage Branches →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/hospital/enterprise/branches')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Branch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hospital/enterprise/reports')}
            className="text-white border-slate-700 hover:bg-slate-800"
          >
            Consolidated Reports
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hospital/enterprise/branch-admins')}
            className="text-white border-slate-700 hover:bg-slate-800"
          >
            Branch Admin Directory
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hospital/enterprise/subscription')}
            className="text-white border-slate-700 hover:bg-slate-800"
          >
            Enterprise Subscription
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hospital/enterprise/profile')}
            className="text-white border-slate-700 hover:bg-slate-800"
          >
            Organization Profile
          </Button>
        </div>
      </div>

      {/* 5 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network Branches</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{branchCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">{metrics.activeBranches} Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Multi-facility network</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalPatients.toLocaleString()}</span>
            <span className="text-xs text-teal-600 font-semibold">Group-wide</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active patient EHR files</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OPD Appointments</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalAppointments.toLocaleString()}</span>
            <span className="text-xs text-brand-600 font-semibold">Scheduled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all outpatient rooms</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Beds & Admissions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalAdmissions}</span>
            <span className="text-xs text-slate-500">of {metrics.totalBeds} Beds</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.totalBeds > 0 ? Math.round((metrics.totalAdmissions / metrics.totalBeds) * 100) : 0}% Occupancy
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Group Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{metrics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Settled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Consolidated collections</p>
        </Card>
      </div>

      {/* Network Facilities Table & Management */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Healthcare Network Facilities</h2>
            <p className="text-xs text-slate-500">
              Active operating branches belonging to {organization.name}. Data and operations remain isolated per facility.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/hospital/enterprise/branches')}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.branchSummaries?.map((b: any) => {
            const isCurrentContext = currentHospital?.id === b.hospitalId;
            const isInitialBranch = organization.primaryHospitalId === b.hospitalId;

            return (
              <Card
                key={b.hospitalId}
                className={`p-5 transition-all border ${
                  isCurrentContext
                    ? 'border-brand-500 bg-brand-50/20 shadow-md ring-1 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {b.branchCode}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{b.hospitalName}</h3>
                      {isInitialBranch && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                          Primary Flagship
                        </span>
                      )}
                      {isCurrentContext && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          Active Workspace
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.city}, {b.state}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      b.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {b.status === 'active' ? 'Operational' : b.status}
                  </span>
                </div>

                {/* Branch Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-2 my-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patients</span>
                    <span className="text-sm font-bold text-slate-800">{b.patientCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Doctors</span>
                    <span className="text-sm font-bold text-slate-800">{b.doctorCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Beds</span>
                    <span className="text-sm font-bold text-slate-800">
                      {b.activeAdmissions} / {b.totalBeds}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Revenue</span>
                    <span className="text-sm font-bold text-slate-800">₹{(b.revenue / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                {/* Branch Footer & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-500">
                    <span className="text-slate-400 block text-[10px]">Branch Administrator</span>
                    <span className="font-semibold text-slate-700">{b.adminName || 'Admin Assigned'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Public Website Link */}
                    <a
                      href={`/hospital/${b.branchCode.toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                      title="Open Public Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>

                    <Button
                      size="sm"
                      variant={isCurrentContext ? 'outline' : 'secondary'}
                      onClick={() => handleSwitchToBranch(b.hospitalId)}
                    >
                      {isCurrentContext ? 'Open Operations' : 'Switch & Manage'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
