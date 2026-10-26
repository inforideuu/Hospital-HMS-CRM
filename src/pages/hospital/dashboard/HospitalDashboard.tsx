import React, { useState, useEffect, useMemo } from 'react';
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
  IndianRupee,
  ShoppingCart,
  ClipboardList,
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
import { Patient, Appointment, Invoice, Bed, Admission, Doctor, HospitalSubscription, OPDRoom } from '../../../types';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';
import { isCapabilityAllowedForTier } from '../../../constants/planCapabilities';
import { QrCode, Sparkles, CheckCircle } from 'lucide-react';
import { DoctorDashboard } from '../doctor/DoctorDashboard';
import { LaboratoryDashboard } from '../laboratory/LaboratoryDashboard';
import { NurseDashboard } from '../nurse/NurseDashboard';
import { PharmacistDashboard } from '../pharmacist/PharmacistDashboard';

export const HospitalDashboard: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();

  // If authenticated user is a doctor, show the dedicated Doctor Dashboard
  if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  }

  // If authenticated user is a lab technician, show the dedicated Laboratory Dashboard
  if (user?.role === 'lab_technician') {
    return <LaboratoryDashboard />;
  }

  // If authenticated user is a nurse, show the dedicated Nurse Station Dashboard
  if (user?.role === 'nurse') {
    return <NurseDashboard />;
  }

  // If authenticated user is a pharmacist, show the dedicated Pharmacist Dashboard
  if (user?.role === 'pharmacist') {
    return <PharmacistDashboard />;
  }

  const hospId = currentHospital?.id || 'hosp-1';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [opdRooms, setOpdRooms] = useState<OPDRoom[]>([]);
  const [subscription, setSubscription] = useState<HospitalSubscription | undefined>(() =>
    MockStorage.getSubscriptionByHospitalId(hospId)
  );
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const loadData = () => {
    setPatients(MockStorage.getPatients(hospId));
    setAppointments(MockStorage.getAppointments(hospId));
    setInvoices(MockStorage.getInvoices(hospId));
    setBeds(MockStorage.getBeds(hospId));
    setAdmissions(MockStorage.getAdmissions(hospId));
    setDoctors(MockStorage.getDoctors(hospId));
    setOpdRooms(MockStorage.getOPDRooms(hospId));
    setSubscription(MockStorage.getSubscriptionByHospitalId(hospId));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [hospId]);

  const activePatients = patients.length;
  const todayAppointments = appointments.length;

  const currentTier = currentHospital?.planTier || subscription?.planTier || 'trial';
  const hasBedCapability = isCapabilityAllowedForTier(currentTier, 'admissions_beds');

  // Real bed capacity & status for current hospital
  const currentPlan = MockStorage.getPlanByTier(currentTier);
  const planMaxBeds = currentPlan?.maxBeds ?? (hasBedCapability ? 120 : 0);
  const totalBedsCount = beds.length > 0 ? beds.length : (currentHospital?.totalBeds || planMaxBeds);
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length || admissions.filter((a) => a.status === 'Active').length;
  const maintenanceBeds = beds.filter((b) => b.status === 'Maintenance').length;
  const availableBeds = Math.max(0, totalBedsCount - occupiedBeds - maintenanceBeds);

  // Real OPD Chamber metrics for outpatient facilities
  const totalRoomsCount = opdRooms.length;
  const availableRoomsCount = opdRooms.filter((r) => r.status === 'Available').length;
  const occupiedRoomsCount = opdRooms.filter((r) => r.status === 'Occupied').length;
  const maintenanceRoomsCount = opdRooms.filter((r) => r.status === 'Maintenance').length;

  const totalRevenue = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
  const pendingRevenue = invoices.reduce(
    (acc, i) => (i.status !== 'Paid' ? acc + ((i.totalAmount || 0) - (i.amountPaid || 0)) : acc),
    0
  );

  // Pharmacy Revenue Split: Hospital Patients (Doctor Rx) vs Walk-in Patients (OTC)
  const pharmacyInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.items.some(
          (item) => item.category === 'Pharmacy' || item.description?.toLowerCase().includes('rx') || item.description?.toLowerCase().includes('batch')
        ) ||
        inv.id.includes('PHARM') ||
        inv.id.includes('OTC') ||
        inv.notes?.toLowerCase().includes('pharmacy')
    );
  }, [invoices]);

  const walkInPharmacyInvoices = useMemo(() => {
    return pharmacyInvoices.filter(
      (inv) =>
        inv.id.includes('OTC') ||
        inv.patientId?.startsWith('WALK-IN') ||
        inv.patientName?.toLowerCase().includes('walk-in') ||
        inv.notes?.toLowerCase().includes('walk-in') ||
        inv.notes?.toLowerCase().includes('otc')
    );
  }, [pharmacyInvoices]);

  const hospitalPatientPharmacyInvoices = useMemo(() => {
    return pharmacyInvoices.filter((inv) => !walkInPharmacyInvoices.includes(inv));
  }, [pharmacyInvoices, walkInPharmacyInvoices]);

  const pharmacyWalkInRevenue = useMemo(() => {
    return walkInPharmacyInvoices.reduce((acc, i) => acc + (i.amountPaid || i.totalAmount || 0), 0);
  }, [walkInPharmacyInvoices]);

  const pharmacyHospitalPatientRevenue = useMemo(() => {
    return hospitalPatientPharmacyInvoices.reduce((acc, i) => acc + (i.amountPaid || i.totalAmount || 0), 0);
  }, [hospitalPatientPharmacyInvoices]);

  const totalPharmacyRevenue = pharmacyWalkInRevenue + pharmacyHospitalPatientRevenue;
  const clinicalServicesRevenue = Math.max(0, totalRevenue - totalPharmacyRevenue);

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

  // Dynamic Capacity distribution data
  const bedData = [
    { name: 'Available Beds', value: availableBeds, color: '#10b981' },
    { name: 'Occupied (Inpatient)', value: occupiedBeds, color: '#6366f1' },
    { name: 'Maintenance', value: maintenanceBeds, color: '#f43f5e' },
  ];

  const opdChamberData = [
    { name: 'Available Chambers', value: availableRoomsCount, color: '#10b981' },
    { name: 'Occupied (Consulting)', value: occupiedRoomsCount, color: '#6366f1' },
    { name: 'Maintenance', value: maintenanceRoomsCount, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={`${currentHospital?.name || 'Hospital'} Operations Center`}
        subtitle={
          hasBedCapability
            ? "Real-time clinical throughput, OPD appointments, IPD bed allocation, and live DB telemetry."
            : "Real-time clinical throughput, OPD appointments, consultation chambers, and live DB telemetry."
        }
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Operations Dashboard' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/appointments')}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Book OPD Visit
            </Button>
            {hasBedCapability ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/hospital/admissions')}
                leftIcon={<BedDouble className="w-3.5 h-3.5" />}
              >
                Admit Patient
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/hospital/opd-rooms')}
                leftIcon={<Building2 className="w-3.5 h-3.5" />}
              >
                OPD Chambers
              </Button>
            )}
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
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-xs ${
          subscription?.paymentStatus === 'pending_approval'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : subscription?.paymentStatus === 'rejected'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-950 text-white border-indigo-700/50 shadow-md'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              subscription?.paymentStatus === 'pending_approval'
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
                    : (() => {
                        const startDate = subscription?.startDate ? new Date(subscription.startDate) : new Date();
                        const now = new Date();
                        const diffTime = now.getTime() - startDate.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        const totalTrialDays = MockStorage.getTrialDays();
                        const remainingDays = Math.max(0, totalTrialDays - diffDays);
                        return `Hospital Plan: ${totalTrialDays}-Day Free Trial (${remainingDays} Day${remainingDays === 1 ? '' : 's'} Remaining)`;
                      })()}
                </h3>
                <span className={`text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  subscription?.paymentStatus === 'pending_approval'
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
                  : `Superadmin provisioned this hospital on a ${MockStorage.getTrialDays()}-Day Free Trial. Free trial plans cannot be renewed as a trial — upgrade to a paid subscription tier via QR Code payment to ensure uninterrupted access.`}
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
        {hasBedCapability ? (
          <StatCard
            title="Bed Occupancy"
            value={beds.length > 0 ? `${occupiedBeds} / ${beds.length}` : `${occupiedBeds} / ${planMaxBeds}`}
            subtext={
              beds.length > 0
                ? `${availableBeds} beds available (Max ${planMaxBeds})`
                : `${planMaxBeds} beds available (${currentPlan.name})`
            }
            icon={<BedDouble className="w-5 h-5 text-amber-600" />}
            accentColor="amber"
            trend={{
              value: `${totalBedsCount > 0 ? Math.round((occupiedBeds / totalBedsCount) * 100) : 0}%`,
              direction: 'neutral',
              label: beds.length > 0 ? 'in-use' : 'capacity',
            }}
          />
        ) : (
          <StatCard
            title="OPD Chambers"
            value={`${availableRoomsCount} / ${totalRoomsCount}`}
            subtext={`${availableRoomsCount} chambers ready for consultations`}
            icon={<Building2 className="w-5 h-5 text-amber-600" />}
            accentColor="amber"
            trend={{
              value: `${totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0}%`,
              direction: 'neutral',
              label: 'in-use',
            }}
          />
        )}
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtext={`Pharmacy: ₹${totalPharmacyRevenue.toLocaleString('en-IN')} (Rx: ₹${pharmacyHospitalPatientRevenue.toLocaleString('en-IN')} | OTC: ₹${pharmacyWalkInRevenue.toLocaleString('en-IN')})`}
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
          trend={{
            value: `${totalRevenue > 0 ? Math.round((totalPharmacyRevenue / totalRevenue) * 100) : 0}%`,
            direction: 'up',
            label: 'Pharmacy share',
          }}
          onClick={() => navigate('/hospital/billing')}
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

        {/* Capacity Distribution Pie Chart */}
        <Card>
          <CardHeader
            title={hasBedCapability ? "IPD Bed Allocation" : "OPD Chamber Status"}
            subtitle={hasBedCapability ? "Real-time occupancy status" : "Real-time consultation chamber status"}
          />
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {(hasBedCapability ? bedData : opdChamberData).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hasBedCapability ? bedData : opdChamberData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(hasBedCapability ? bedData : opdChamberData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-4">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-slate-500 font-medium">No OPD chambers configured</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => navigate('/hospital/opd-rooms')}
                  >
                    + Add Chamber
                  </Button>
                </div>
              )}
            </div>
            {(hasBedCapability ? bedData : opdChamberData).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {(hasBedCapability ? bedData : opdChamberData).map((b) => (
                  <div key={b.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{b.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {b.value} {hasBedCapability ? 'Beds' : 'Chambers'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown & Pharmacy Split Section */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Hospital Revenue Distribution & Pharmacy Audit</span>
            </div>
          }
          subtitle="Real-time financial audit separating Clinical Consultations from Central Pharmacy (Hospital Patients vs Walk-in Counter)"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/billing')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Invoices & Audit
            </Button>
          }
        />
        <CardContent className="space-y-5">
          {/* Visual Revenue Proportion Stacked Bar */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-700">
              <span>Overall Revenue Streams Proportion</span>
              <span>Total Collections: ₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div
                className="bg-indigo-600 h-full transition-all duration-500"
                style={{ width: `${totalRevenue > 0 ? (clinicalServicesRevenue / totalRevenue) * 100 : 0}%` }}
                title={`Clinical Services: ₹${clinicalServicesRevenue.toLocaleString('en-IN')}`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${totalRevenue > 0 ? (pharmacyHospitalPatientRevenue / totalRevenue) * 100 : 0}%` }}
                title={`Pharmacy Hospital Patients: ₹${pharmacyHospitalPatientRevenue.toLocaleString('en-IN')}`}
              />
              <div
                className="bg-teal-400 h-full transition-all duration-500"
                style={{ width: `${totalRevenue > 0 ? (pharmacyWalkInRevenue / totalRevenue) * 100 : 0}%` }}
                title={`Pharmacy Walk-in Patients: ₹${pharmacyWalkInRevenue.toLocaleString('en-IN')}`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                <span>Clinical Consultations & Bed Charges ({totalRevenue > 0 ? Math.round((clinicalServicesRevenue / totalRevenue) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Pharmacy: Hospital Patients ({totalRevenue > 0 ? Math.round((pharmacyHospitalPatientRevenue / totalRevenue) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
                <span>Pharmacy: Walk-in Retail ({totalRevenue > 0 ? Math.round((pharmacyWalkInRevenue / totalRevenue) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          {/* 3 Detail Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stream 1: Clinical Services */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <Badge variant="neutral">
                  {totalRevenue > 0 ? Math.round((clinicalServicesRevenue / totalRevenue) * 100) : 0}% of Total
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical & Hospital Services</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                  ₹{clinicalServicesRevenue.toLocaleString('en-IN')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Doctor consultations, OPD appointments, IPD bed admissions, and diagnostic lab investigations.
                </p>
              </div>
            </div>

            {/* Stream 2: Pharmacy - Hospital Patients */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <Badge variant="success">
                  {totalPharmacyRevenue > 0 ? Math.round((pharmacyHospitalPatientRevenue / totalPharmacyRevenue) * 100) : 0}% of Pharmacy
                </Badge>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Pharmacy: Hospital Patients</p>
                </div>
                <h4 className="text-xl font-bold text-emerald-950 mt-0.5">
                  ₹{pharmacyHospitalPatientRevenue.toLocaleString('en-IN')}
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Doctor e-prescriptions fulfilled for registered hospital outpatients (OPD) and admitted inpatients (IPD) ({hospitalPatientPharmacyInvoices.length} orders).
                </p>
              </div>
            </div>

            {/* Stream 3: Pharmacy - Walk-in OTC Patients */}
            <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <Badge variant="info">
                  {totalPharmacyRevenue > 0 ? Math.round((pharmacyWalkInRevenue / totalPharmacyRevenue) * 100) : 0}% of Pharmacy
                </Badge>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Pharmacy: Walk-in Patients</p>
                </div>
                <h4 className="text-xl font-bold text-teal-950 mt-0.5">
                  ₹{pharmacyWalkInRevenue.toLocaleString('en-IN')}
                </h4>
                <p className="text-xs text-teal-800 mt-1">
                  Direct retail POS sales at the dispensary counter for non-prescription drugs, first aid, and OTC healthcare ({walkInPharmacyInvoices.length} sales).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SubscriptionUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        hospitalId={hospId}
        hospitalName={currentHospital?.name}
        currentTier={subscription?.planTier}
      />
    </div>
  );
};

export default HospitalDashboard;
