import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  BedDouble,
  Stethoscope,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Activity,
  Edit,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';
import { NotFound } from '../../auth/NotFound';

export const HospitalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { switchHospital, switchRole } = useAuth();
  const { showToast } = useNotification();

  const hospital = MockStorage.getHospitalById(id || '');
  const subscription = hospital ? MockStorage.getSubscriptionByHospitalId(hospital.id) : undefined;
  const activityLogs = MockStorage.getActivityLogs().filter(
    (l) => l.hospitalId === hospital?.id || l.target.includes(hospital?.name || '')
  );

  if (!hospital) {
    return <NotFound />;
  }

  const handleEnterWorkspace = () => {
    switchHospital(hospital.id);
    switchRole('hospital_admin');
    showToast('Hospital Workspace Activated', `Switched to ${hospital.name} as Hospital Admin.`);
    navigate('/hospital/dashboard');
  };

  const handleStatusToggle = (newStatus: typeof hospital.status) => {
    MockStorage.updateHospitalStatus(hospital.id, newStatus);
    showToast('Status Updated', `${hospital.name} is now ${newStatus.toUpperCase()}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={hospital.name}
        subtitle={`${hospital.type} • Facility License: ${hospital.regNumber}`}
        breadcrumbs={[
          { label: 'Platform HQ', href: '/platform/dashboard' },
          { label: 'Hospitals', href: '/platform/hospitals' },
          { label: hospital.name },
        ]}
        badge={
          hospital.status === 'active' ? (
            <Badge variant="success" dot>Active Workspace</Badge>
          ) : hospital.status === 'pending' ? (
            <Badge variant="warning" dot>Pending Approval</Badge>
          ) : (
            <Badge variant="error" dot>Suspended</Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/hospitals')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to List
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEnterWorkspace}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Enter HMS Workspace
            </Button>
          </div>
        }
      />

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={hospital.totalPatients.toLocaleString()}
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          accentColor="indigo"
        />
        <StatCard
          title="Medical Specialists"
          value={hospital.totalDoctors}
          icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
        />
        <StatCard
          title="Bed Capacity"
          value={hospital.totalBeds}
          icon={<BedDouble className="w-5 h-5 text-cyan-600" />}
          accentColor="cyan"
        />
        <StatCard
          title="Current Subscription"
          value={hospital.planTier.toUpperCase()}
          icon={<CreditCard className="w-5 h-5 text-purple-600" />}
          subtext={subscription?.interval === 'yearly' ? 'Annual Billing' : 'Monthly Billing'}
          accentColor="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Profile & Contact Details */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader
              title="Hospital Profile & Governance"
              subtitle="Registered physical location, administrative point of contact, and portal metadata"
            />
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Facility Location
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hospital.address}, {hospital.city}, {hospital.state} {hospital.postalCode}, {hospital.country}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hospital.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hospital.phone}</span>
                    </p>
                    {hospital.websiteUrl && (
                      <p className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                        <a href={hospital.websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                          {hospital.websiteUrl}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Hospital Administrator
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <p className="font-bold text-slate-900 text-sm">{hospital.adminName}</p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hospital.adminEmail}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hospital.adminPhone}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Onboarded: {hospital.createdAt}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Management Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Tenant Management:</span>
                  {hospital.status !== 'active' && (
                    <Button variant="success" size="xs" onClick={() => handleStatusToggle('active')}>
                      Activate Facility
                    </Button>
                  )}
                  {hospital.status === 'active' && (
                    <Button variant="outline" size="xs" className="text-amber-600" onClick={() => handleStatusToggle('suspended')}>
                      Suspend Workspace
                    </Button>
                  )}
                  {hospital.status === 'pending' && (
                    <Button variant="danger" size="xs" onClick={() => handleStatusToggle('rejected')}>
                      Reject Registration
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline for this Hospital */}
          <Card>
            <CardHeader title="Facility Audit Trail" subtitle="Recent tenant operational updates and admin actions" />
            <CardContent>
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-500">No recent activity recorded for this hospital tenant.</p>
              ) : (
                <div className="space-y-3.5">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">{log.action}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{log.target}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{log.actorName} • {log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Subscription Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader title="SaaS Plan & Billing" subtitle="Active multi-tenant contract" />
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    {subscription?.planName || 'Enterprise Health Network'}
                  </span>
                  <Badge variant="purple" size="sm">Active</Badge>
                </div>
                <div className="text-2xl font-bold">
                  ${subscription?.amount.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400">/{subscription?.interval}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Renews on: <span className="text-slate-200 font-semibold">{subscription?.renewalDate || '2027-01-15'}</span>
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-800">{subscription?.paymentMethod || 'Corporate ACH'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Auto Renewal</span>
                  <span className="font-semibold text-emerald-600">Enabled</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>HIPAA Compliance BAA</span>
                  <span className="font-semibold text-slate-800">Executed & Signed</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/platform/subscriptions')}
              >
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
