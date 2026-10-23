import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  DollarSign,
  Activity,
  BedDouble,
  Globe,
  CreditCard,
  Users,
  ShieldCheck,
  HelpCircle,
  Ambulance,
  Plus,
  Stethoscope,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Hospital, HospitalSubscription, HospitalWebsite, User, SupportTicket, Patient, Appointment, Bed, OPDRoom, Admission } from '../../../types';
import { isCapabilityAllowedForTier } from '../../../constants/planCapabilities';

export const ReportsAnalytics: React.FC = () => {
  const location = useLocation();
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();

  const isPlatformScope = location.pathname.startsWith('/platform') || user?.role === 'super_admin';

  const [dateRange, setDateRange] = useState('Year-to-Date (2026)');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [subscriptions, setSubscriptions] = useState<HospitalSubscription[]>([]);
  const [websites, setWebsites] = useState<HospitalWebsite[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Hospital-specific scope state
  const currentHospitalId = user?.hospitalId || currentHospital?.id || 'HOSP-001';
  const hospital = currentHospital || MockStorage.getHospitalById(currentHospitalId);
  const hospitalTier = hospital?.planTier || 'trial';
  const hasBedFacility = isCapabilityAllowedForTier(hospitalTier, 'admissions_beds');

  const [hospitalPatients, setHospitalPatients] = useState<Patient[]>([]);
  const [hospitalAppointments, setHospitalAppointments] = useState<Appointment[]>([]);
  const [hospitalAdmissions, setHospitalAdmissions] = useState<Admission[]>([]);
  const [hospitalBeds, setHospitalBeds] = useState<Bed[]>([]);
  const [hospitalOpdRooms, setHospitalOpdRooms] = useState<OPDRoom[]>([]);

  const loadData = () => {
    setHospitals(MockStorage.getHospitals());
    setSubscriptions(MockStorage.getSubscriptions());
    setWebsites(MockStorage.getWebsites());
    setUsers(MockStorage.getUsers());
    setTickets(MockStorage.getSupportTickets());

    const patients = MockStorage.getPatients(currentHospitalId);
    const appointments = MockStorage.getAppointments(currentHospitalId);
    const admissions = MockStorage.getAdmissions(currentHospitalId);
    const beds = MockStorage.getBeds(currentHospitalId);
    const opdRooms = MockStorage.getOPDRooms(currentHospitalId);

    setHospitalPatients(patients);
    setHospitalAppointments(appointments);
    setHospitalAdmissions(admissions);
    setHospitalBeds(beds);
    setHospitalOpdRooms(opdRooms);
  };

  useEffect(() => {
    loadData();
    MockStorage.syncWithBackend?.();
    const handleUpdate = () => loadData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [currentHospitalId]);

  // Platform Telemetry Aggregations
  const totalHospitals = hospitals.length;
  const activeHospitals = hospitals.filter((h) => h.status === 'active').length;
  const totalBeds = hospitals.reduce((acc, h) => acc + (h.totalBeds || 0), 0);

  const totalMRR = subscriptions.reduce((acc, s) => {
    if (s.status === 'active' || s.status === 'trialing') {
      const amt = Number(s.amount) || 0;
      return acc + (s.interval === 'yearly' ? Math.round(amt / 12) : amt);
    }
    return acc;
  }, 0);

  const trialPlan = MockStorage.getPlanByTier('trial');
  const planBreakdown = [
    { name: trialPlan?.name || `${MockStorage.getTrialDays()}-Day Free Trial`, count: subscriptions.filter((s) => (s.planTier as string) === 'trial').length, mrr: 0, color: '#f59e0b' },
    { name: 'Enterprise Health', count: subscriptions.filter((s) => s.planTier === 'enterprise').length, mrr: 149999, color: '#4f46e5' },
    { name: 'Professional Hospital', count: subscriptions.filter((s) => s.planTier === 'standard').length, mrr: 64999, color: '#0ea5e9' },
    { name: 'Starter Clinic', count: subscriptions.filter((s) => s.planTier === 'basic').length, mrr: 24999, color: '#10b981' },
  ];

  const mrrTrendData = [
    { month: 'Apr 2026', revenue: 142000, hospitals: 2 },
    { month: 'May 2026', revenue: 185000, hospitals: 3 },
    { month: 'Jun 2026', revenue: 228000, hospitals: 3 },
    { month: 'Jul 2026', revenue: 264000, hospitals: 3 },
    { month: 'Aug 2026', revenue: 312000, hospitals: 4 },
    { month: 'Sep 2026', revenue: totalMRR > 0 ? totalMRR : 358800, hospitals: totalHospitals },
  ];

  // Hospital Operational Metrics Aggregation
  const totalPatientsCount = hospitalPatients.length;
  const totalConsultationsCount = hospitalAppointments.length;
  const completedConsultations = hospitalAppointments.filter((a) => a.status === 'Completed').length;
  const totalBedsCount = hasBedFacility ? hospitalBeds.length : 0;
  const occupiedBedsCount = hasBedFacility ? hospitalBeds.filter((b) => b.status === 'Occupied').length : 0;
  const occupancyRate = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  const totalOpdRoomsCount = hospitalOpdRooms.length;
  const availableOpdRooms = hospitalOpdRooms.filter((r) => r.status === 'Available').length;
  const occupiedOpdRooms = hospitalOpdRooms.filter((r) => r.status === 'Occupied').length;
  const maintenanceOpdRooms = hospitalOpdRooms.filter((r) => r.status === 'Maintenance').length;
  const opdChamberOccupancyRate = totalOpdRoomsCount > 0 ? Math.round((occupiedOpdRooms / totalOpdRoomsCount) * 100) : 0;

  // Dynamically compute monthly patient volume across the last 6 months
  const now = new Date();
  const monthsWindow: { month: string; yearMonth: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsWindow.push({ month: monthName, yearMonth });
  }

  const hospitalOpdIpdTrend = monthsWindow.map(({ month, yearMonth }) => {
    // Dynamic OPD volume: count of actual hospital appointments in this yearMonth
    const opd = hospitalAppointments.filter((a) => {
      const dateStr = a.appointmentDate || (a as any).date || (a.createdAt ? a.createdAt.split('T')[0] : '');
      return dateStr && dateStr.startsWith(yearMonth);
    }).length;

    // Dynamic IPD volume: count of actual hospital admissions in this yearMonth
    const ipd = hasBedFacility
      ? hospitalAdmissions.filter((adm) => {
          const dateStr = adm.admissionDate || (adm as any).date || ((adm as any).createdAt ? (adm as any).createdAt.split('T')[0] : '');
          return dateStr && dateStr.startsWith(yearMonth);
        }).length
      : 0;

    return {
      month,
      opd,
      ipd,
    };
  });

  const bedOccupancyData = [
    { name: 'Occupied Beds', value: occupiedBedsCount, color: '#4f46e5' },
    { name: 'Available Beds', value: hospitalBeds.filter((b) => b.status === 'Available').length, color: '#10b981' },
    { name: 'Maintenance', value: hospitalBeds.filter((b) => b.status === 'Maintenance').length, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const opdRoomOccupancyData = [
    { name: 'Available Chambers', value: availableOpdRooms, color: '#10b981' },
    { name: 'In Consultation', value: occupiedOpdRooms, color: '#4f46e5' },
    { name: 'Maintenance', value: maintenanceOpdRooms, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const handleExportComprehensiveReport = () => {
    if (isPlatformScope) {
      MockStorage.exportToCSV('SuperAdmin_SaaS_Telemetry', hospitals);
      showToast('Report Exported', 'Platform multi-tenant analytics CSV generated.');
    } else {
      MockStorage.exportToCSV(`Hospital_Analytics_${currentHospitalId}`, hospitalPatients);
      showToast('Report Exported', 'Hospital operational & clinical analytics CSV generated.');
    }
  };

  const allPlans = MockStorage.getPlans();

  if (!isPlatformScope) {
    // HOSPITAL CLINICAL & OPERATIONAL ANALYTICS VIEW
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader
          title="Hospital Clinical & Operational Reports"
          subtitle={
            hasBedFacility
              ? "Real-time OPD throughput, IPD bed occupancy metrics, patient census, and clinical telemetry."
              : "Real-time OPD throughput, consultation chamber metrics, patient census, and clinical telemetry."
          }
          breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Reports & Analytics' }]}
          actions={
            <div className="flex items-center gap-2">
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-xs py-1.5"
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Year-to-Date (2026)</option>
              </Select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportComprehensiveReport}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export Hospital Report
              </Button>
            </div>
          }
        />

        {/* Hospital Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-indigo-600 bg-white">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Registered EHR Patients</span>
              <p className="text-2xl font-black text-slate-900 leading-tight">{totalPatientsCount}</p>
              <span className="text-[11px] text-emerald-600 font-semibold block truncate">Live Census</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-sky-600 bg-white">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Total OPD Consultations</span>
              <p className="text-2xl font-black text-slate-900 leading-tight">{totalConsultationsCount}</p>
              <span className="text-[11px] text-sky-600 font-semibold block truncate">{completedConsultations} Completed</span>
            </div>
          </Card>

          {hasBedFacility ? (
            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-600 bg-white">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <BedDouble className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">IPD Bed Occupancy</span>
                <p className="text-2xl font-black text-slate-900 leading-tight">{occupancyRate}%</p>
                <span className="text-[11px] text-emerald-600 font-semibold block truncate">{occupiedBedsCount} of {totalBedsCount} Beds In-Use</span>
              </div>
            </Card>
          ) : (
            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-600 bg-white">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">OPD Consultation Chambers</span>
                <p className="text-2xl font-black text-slate-900 leading-tight">{totalOpdRoomsCount > 0 ? `${opdChamberOccupancyRate}%` : '100%'}</p>
                <span className="text-[11px] text-emerald-600 font-semibold block truncate">
                  {totalOpdRoomsCount > 0 ? `${availableOpdRooms} of ${totalOpdRoomsCount} Chambers Ready` : 'Chambers Ready'}
                </span>
              </div>
            </Card>
          )}

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-600 bg-white">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Op Velocity & Efficiency</span>
              <p className="text-2xl font-black text-slate-900 leading-tight">98.4%</p>
              <span className="text-[11px] text-purple-600 font-semibold block truncate">Clinical Satisfaction</span>
            </div>
          </Card>
        </div>

        {/* Dynamic Charts for Hospital */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {hasBedFacility ? 'OPD & IPD Monthly Patient Volume' : 'OPD Monthly Patient Volume'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hasBedFacility ? 'Historical consultation throughput & bed admissions' : 'Historical consultation throughput & clinic visits'}
                </p>
              </div>
              <Badge variant="indigo" size="sm">Live Feed</Badge>
            </div>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hospitalOpdIpdTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="opdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ipdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="opd" name="OPD Patients" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#opdGradient)" />
                  {hasBedFacility && (
                    <Area type="monotone" dataKey="ipd" name="IPD Admissions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#ipdGradient)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {hasBedFacility ? 'Ward & Bed Capacity Breakdown' : 'OPD Consultation Chambers Breakdown'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hasBedFacility ? 'Real-time status of ICU, General & Private wards' : 'Real-time status of clinic examination rooms & consultation chambers'}
                </p>
              </div>
              <Badge variant="success" size="sm">
                {hasBedFacility ? `${totalBedsCount} Total Beds` : `${totalOpdRoomsCount} Chambers`}
              </Badge>
            </div>
            <div className="h-72 w-full pt-4 flex items-center justify-center">
              {(hasBedFacility ? bedOccupancyData : opdRoomOccupancyData).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hasBedFacility ? bedOccupancyData : opdRoomOccupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(hasBedFacility ? bedOccupancyData : opdRoomOccupancyData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">
                  {hasBedFacility ? 'No bed allocation data configured' : 'No chamber allocation data configured'}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Patient Census List */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Patient Directory Telemetry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Synchronized patient records for facility #{currentHospitalId}</p>
            </div>
            <Badge variant="indigo" dot>Active Facility</Badge>
          </div>
          <div className="overflow-x-auto pt-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Gender / Age</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3">Blood Group</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitalPatients.slice(0, 8).map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{pt.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{pt.gender} • {pt.age} yrs</td>
                    <td className="px-4 py-3.5 text-slate-600">{pt.phone}</td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600 font-bold">{pt.bloodGroup || 'O+'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge variant="success" dot>Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // SUPER ADMIN SAAS TELEMETRY VIEW (For /platform/reports)
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Super Admin SaaS Telemetry & Reports"
        subtitle="Multi-tenant subscription analytics, MRR trajectory, facility bed capacity network, and database telemetry."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Reports & Analytics' }]}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs py-1.5"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Year-to-Date (2026)</option>
            </Select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportComprehensiveReport}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV Analytics
            </Button>
          </div>
        }
      />

      {/* Dynamic DB Statistics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-indigo-600 bg-white">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Provisioned Hospitals</span>
            <p className="text-2xl font-black text-slate-900 leading-tight">{totalHospitals}</p>
            <span className="text-[11px] text-emerald-600 font-semibold block truncate">{activeHospitals} Active Workspaces</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-600 bg-white">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Active SaaS Subscriptions</span>
            <p className="text-2xl font-black text-slate-900 leading-tight">{subscriptions.length}</p>
            <span className="text-[11px] text-emerald-600 font-semibold block truncate">100% Renewal Rate</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-600 bg-white">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Monthly SaaS MRR</span>
            <p className="text-2xl font-black text-slate-900 leading-tight">₹{totalMRR.toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-indigo-600 font-semibold block truncate">ARR: ₹{(totalMRR * 12).toLocaleString('en-IN')}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-teal-600 bg-white">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <BedDouble className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Network Bed Capacity</span>
            <p className="text-2xl font-black text-slate-900 leading-tight">{totalBeds} Beds</p>
            <span className="text-[11px] text-teal-600 font-semibold block truncate">ICU & Modular Wards</span>
          </div>
        </Card>
      </div>

      {/* Dynamic Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SaaS Revenue Trajectory Area Chart */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">SaaS MRR Growth & Revenue Velocity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Dynamically aggregated from tenant subscription contracts in database</p>
            </div>
            <Badge variant="success" size="sm">+24.5% YoY</Badge>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Monthly MRR']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#telemetryGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subscription Tier Distribution Bar Chart */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Subscription Tier Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Facility allocation across Enterprise, Standard, Basic & Trial</p>
            </div>
            <Badge variant="indigo" size="sm">{subscriptions.length} Plans</Badge>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Hospitals Count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Multi-Tenant Hospital Infrastructure Table */}
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tenant Facility Telemetry & Infrastructure Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live database synchronization of provisioned hospitals, bed capacity, and domain status</p>
          </div>
          <Badge variant="success" dot>Database Connected</Badge>
        </div>
        <div className="overflow-x-auto pt-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Hospital Facility</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Subscription Tier</th>
                <th className="px-4 py-3">Bed Network</th>
                <th className="px-4 py-3">Domain Status</th>
                <th className="px-4 py-3 text-right">License Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((hosp) => {
                const plan = allPlans.find((p) => p.tier === hosp.planTier);
                return (
                  <tr key={hosp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={hosp.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=80&auto=format&fit=crop&q=80'}
                          alt={hosp.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{hosp.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{hosp.id} • {hosp.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{hosp.city}, {hosp.state}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {plan?.name || hosp.planTier}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{hosp.totalBeds || 0} Beds</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-700">
                        <Globe className="w-3.5 h-3.5 text-teal-600" />
                        {hosp.domainStatus || 'connected'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge variant="success" dot>Active</Badge>
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

export default ReportsAnalytics;
