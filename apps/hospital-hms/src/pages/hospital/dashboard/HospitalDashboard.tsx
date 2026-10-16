import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Calendar,
  Pill,
  FlaskConical,
  Receipt,
  Truck,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Plus,
  Activity,
  FileText,
  UserPlus,
  BedDouble,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Stethoscope,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Patient, Appointment, Invoice, Bed, Admission, Doctor, HospitalSubscription } from '../../../types';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';
import { BillingSoftwareAddonModal } from '../../../components/common/BillingSoftwareAddonModal';
import { QrCode, Sparkles, CheckCircle } from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { currentHospital } = useAuth();
  const navigate = useNavigate();
  const hospId = currentHospital?.id || 'hosp-1';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [subscription, setSubscription] = useState<HospitalSubscription | undefined>(() =>
    MockStorage.getSubscriptionByHospitalId(hospId)
  );
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  // Controlled by Super Admin in Platform Settings
  const isAddonEnabled = MockStorage.getPlatformSettings().enableBillingAddonModule !== false;

  const loadData = () => {
    setPatients(MockStorage.getPatients(hospId));
    setAppointments(MockStorage.getAppointments(hospId));
    setInvoices(MockStorage.getInvoices(hospId));
    setBeds(MockStorage.getBeds(hospId));
    setAdmissions(MockStorage.getAdmissions(hospId));
    setDoctors(MockStorage.getDoctors(hospId));
    setSubscription(MockStorage.getSubscriptionByHospitalId(hospId));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [hospId]);

  const activePatients = patients.length;
  const todayAppointments = appointments.length;

  // Real bed capacity & status for current hospital
  const totalBedsCount = currentHospital?.totalBeds || (beds.length > 0 ? beds.length : 20);
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length || admissions.filter((a) => a.status === 'Active').length;
  const maintenanceBeds = beds.filter((b) => b.status === 'Maintenance').length;
  const availableBeds = Math.max(0, totalBedsCount - occupiedBeds - maintenanceBeds);

  const totalRevenue = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
  const pendingRevenue = invoices.reduce(
    (acc, i) => (i.status !== 'Paid' ? acc + ((i.totalAmount || 0) - (i.amountPaid || 0)) : acc),
    0
  );

  // Dynamic Weekly Trends derived strictly from actual appointments registered for this hospital
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyTrends = daysOfWeek.map((day, idx) => {
    const dayAppointments = appointments.filter((a) => {
      if (a.appointmentDate) {
        const d = new Date(a.appointmentDate);
        if (!isNaN(d.getTime())) {
          const dayIndex = (d.getDay() + 6) % 7;
          return dayIndex === idx;
        }
      }
      return false;
    });

    const apts = dayAppointments.length;
    const uniquePatients = new Set(dayAppointments.map((a) => a.patientId)).size;

    return {
      day,
      appointments: apts,
      patients: uniquePatients,
    };
  });

  // Dynamic Bed distribution data
  const bedData = [
    { name: 'Available Beds', value: availableBeds, color: '#10b981' },
    { name: 'Occupied (Inpatient)', value: occupiedBeds, color: '#6366f1' },
    { name: 'Maintenance', value: maintenanceBeds, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={`${currentHospital?.name || 'Hospital'} Operations Center`}
        subtitle="Real-time clinical throughput, OPD appointments, IPD bed allocation, and live DB telemetry."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Operations Dashboard' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isAddonEnabled && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddonModalOpen(true)}
                leftIcon={<Zap className="w-3.5 h-3.5" />}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
              >
                + Add On Billing Software
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/appointments')}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Book OPD Visit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/admissions')}
              leftIcon={<BedDouble className="w-3.5 h-3.5" />}
            >
              Admit Patient
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/patients')}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Register Patient
            </Button>
          </div>
        }
      />


      {/* Subscription Status Banner */}
      {(!subscription || subscription.status === 'trialing' || subscription.paymentStatus === 'pending_approval' || subscription.paymentStatus === 'rejected') && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-xs ${subscription?.paymentStatus === 'pending_approval'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : subscription?.paymentStatus === 'rejected'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-950 text-white border-indigo-700/50 shadow-md'
          }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${subscription?.paymentStatus === 'pending_approval'
                ? 'bg-amber-200/60 text-amber-800'
                : subscription?.paymentStatus === 'rejected'
                  ? 'bg-rose-200/60 text-rose-800'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
              {subscription?.paymentStatus === 'pending_approval' ? (
                <Clock className="w-5 h-5 animate-pulse" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold">
                  {subscription?.paymentStatus === 'pending_approval'
                    ? 'Subscription Payment Verification Pending'
                    : subscription?.paymentStatus === 'rejected'
                      ? 'Payment Rejected by Superadmin'
                      : 'Hospital Plan: 7-Day Free Trial Active'}
                </h3>
                <span className={`text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full ${subscription?.paymentStatus === 'pending_approval'
                    ? 'bg-amber-200 text-amber-900'
                    : subscription?.paymentStatus === 'rejected'
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-emerald-400 text-slate-950'
                  }`}>
                  {subscription?.paymentStatus === 'pending_approval'
                    ? 'Pending Approval'
                    : subscription?.paymentStatus === 'rejected'
                      ? 'Action Required'
                      : 'Trial Mode'}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90 max-w-2xl">
                {subscription?.paymentStatus === 'pending_approval'
                  ? `Your QR code payment (UTR: ${subscription.utrNumber || 'Submitted'}) for ${subscription.requestedTier || 'Selected Tier'} has been submitted and is currently being verified by Superadmin.`
                  : subscription?.paymentStatus === 'rejected'
                    ? 'Your payment submission could not be verified. Please click upgrade below to resubmit payment with a valid UTR number.'
                    : 'Superadmin provisioned this hospital on a 7-Day Free Trial. Upgrade anytime via QR Code payment to ensure uninterrupted access.'}
              </p>
            </div>
          </div>

          <Button
            variant={subscription?.paymentStatus === 'pending_approval' ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setIsUpgradeModalOpen(true)}
            leftIcon={<QrCode className="w-4 h-4" />}
            className="shrink-0 font-bold"
          >
            {subscription?.paymentStatus === 'pending_approval' ? 'View Payment Details' : 'Upgrade Plan (QR Code)'}
          </Button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Patients"
          value={activePatients}
          subtext="Registered in system"
          icon={<Users className="w-5 h-5 text-teal-600" />}
          accentColor="cyan"
          trend={{ value: '+12%', direction: 'up', label: 'this month' }}
        />
        <StatCard
          title="OPD Appointments"
          value={todayAppointments}
          subtext="Active consultations"
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
          accentColor="indigo"
          trend={{ value: 'Live', direction: 'up', label: 'DB Synced' }}
        />
        <StatCard
          title="Bed Occupancy"
          value={`${occupiedBeds} / ${totalBedsCount}`}
          subtext={`${availableBeds} beds available`}
          icon={<BedDouble className="w-5 h-5 text-amber-600" />}
          accentColor="amber"
          trend={{ value: `${Math.round((occupiedBeds / totalBedsCount) * 100)}%`, direction: 'neutral', label: 'capacity' }}
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtext={`$${pendingRevenue.toLocaleString()} pending`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
          trend={{ value: '84%', direction: 'up', label: 'Collection rate' }}
        />
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly OPD Patient Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly OPD Consultations & Patient Volume" subtitle="Live daily throughput computed dynamically from database" />
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="appointments" name="Appointments" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="patients" name="Unique Patients" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bed Capacity Distribution Pie Chart */}
        <Card>
          <CardHeader title="IPD Bed Allocation" subtitle="Real-time occupancy status" />
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {bedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {bedData.map((b) => (
                <div key={b.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{b.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{b.value} Beds</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <SubscriptionUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        hospitalId={hospId}
        hospitalName={currentHospital?.name}
        currentTier={subscription?.planTier}
      />

      <BillingSoftwareAddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
      />
    </div>
  );
};

export default HospitalDashboard;

