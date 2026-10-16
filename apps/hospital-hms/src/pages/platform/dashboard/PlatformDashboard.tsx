import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Download,
  ShieldCheck,
  Globe,
  ExternalLink,
  CreditCard,
  HeartPulse,
  HelpCircle,
  Ambulance,
  Radio,
  Calendar,
  Layers,
  ArrowRight,
  Activity,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BarChart3,
  Server,
  ShieldAlert,
  Search
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
  Legend,
} from 'recharts';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Hospital, HospitalType, SubscriptionPlanTier, User } from '../../../types';
import { StatCard } from '../../../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

export const PlatformDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [dateRange, setDateRange] = useState<'6m' | '12m' | 'ytd'>('6m');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [subscriptions, setSubscriptions] = useState(MockStorage.getSubscriptions());
  const [users, setUsers] = useState(MockStorage.getUsers());
  const [patients, setPatients] = useState(MockStorage.getPatients());
  const [tickets, setTickets] = useState(MockStorage.getSupportTickets());
  const [ambulances, setAmbulances] = useState(MockStorage.getAmbulances());
  const [emergencyRequests, setEmergencyRequests] = useState(MockStorage.getEmergencyRequests());
  const [websites, setWebsites] = useState(MockStorage.getWebsites());
  const [activityLogs, setActivityLogs] = useState(MockStorage.getActivityLogs());

  // Quick Onboard Modal state
  const [isAddHospitalModalOpen, setIsAddHospitalModalOpen] = useState(false);
  const [newHospitalData, setNewHospitalData] = useState({
    name: '',
    slug: '',
    type: 'Multi-Specialty Hospital',
    city: '',
    state: '',
    address: '',
    phone: '',
    email: '',
    planTier: 'enterprise' as SubscriptionPlanTier,
    totalBeds: 500,
  });

  const loadData = () => {
    setHospitals(MockStorage.getHospitals());
    setSubscriptions(MockStorage.getSubscriptions());
    setUsers(MockStorage.getUsers());
    setPatients(MockStorage.getPatients());
    setTickets(MockStorage.getSupportTickets());
    setAmbulances(MockStorage.getAmbulances());
    setEmergencyRequests(MockStorage.getEmergencyRequests());
    setWebsites(MockStorage.getWebsites());
    setActivityLogs(MockStorage.getActivityLogs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, []);

  // Time-based dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // KPI Calculations
  const totalHospitals = hospitals.length;
  const activeHospitals = hospitals.filter((h) => h.status === 'active').length;
  const pendingHospitals = hospitals.filter((h) => h.status === 'pending').length;
  const totalUsers = users.length;
  const totalPatients = patients.length;
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing').length;
  const pendingTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const totalAmbulances = ambulances.length;
  const activeEmergencies = emergencyRequests.filter((r) => r.status !== 'Completed' && r.status !== 'Cancelled').length;

  // MRR Calculation
  const totalMRR = subscriptions.reduce((acc, s) => {
    if (s.status === 'active' || s.status === 'trialing') {
      return acc + (s.interval === 'yearly' ? Math.round(s.amount / 12) : s.amount);
    }
    return acc;
  }, 0);

  // Revenue chart dataset options based on date range
  const revenueChartData = {
    '6m': [
      { month: 'Apr 2026', revenue: 14200, growth: 12.4, hospitals: 2 },
      { month: 'May 2026', revenue: 18500, growth: 15.1, hospitals: 3 },
      { month: 'Jun 2026', revenue: 22800, growth: 14.8, hospitals: 3 },
      { month: 'Jul 2026', revenue: 26400, growth: 16.2, hospitals: 3 },
      { month: 'Aug 2026', revenue: 31200, growth: 18.5, hospitals: 4 },
      { month: 'Sep 2026', revenue: 35880, growth: 24.5, hospitals: 4 },
    ],
    '12m': [
      { month: 'Oct 2025', revenue: 8400, growth: 8.2, hospitals: 1 },
      { month: 'Nov 2025', revenue: 9800, growth: 9.4, hospitals: 1 },
      { month: 'Dec 2025', revenue: 11200, growth: 10.1, hospitals: 2 },
      { month: 'Jan 2026', revenue: 12500, growth: 11.0, hospitals: 2 },
      { month: 'Feb 2026', revenue: 13100, growth: 11.8, hospitals: 2 },
      { month: 'Mar 2026', revenue: 13800, growth: 12.0, hospitals: 2 },
      { month: 'Apr 2026', revenue: 14200, growth: 12.4, hospitals: 2 },
      { month: 'May 2026', revenue: 18500, growth: 15.1, hospitals: 3 },
      { month: 'Jun 2026', revenue: 22800, growth: 14.8, hospitals: 3 },
      { month: 'Jul 2026', revenue: 26400, growth: 16.2, hospitals: 3 },
      { month: 'Aug 2026', revenue: 31200, growth: 18.5, hospitals: 4 },
      { month: 'Sep 2026', revenue: 35880, growth: 24.5, hospitals: 4 },
    ],
    ytd: [
      { month: 'Jan', revenue: 12500, hospitals: 2 },
      { month: 'Feb', revenue: 13100, hospitals: 2 },
      { month: 'Mar', revenue: 13800, hospitals: 2 },
      { month: 'Apr', revenue: 14200, hospitals: 2 },
      { month: 'May', revenue: 18500, hospitals: 3 },
      { month: 'Jun', revenue: 22800, hospitals: 3 },
      { month: 'Jul', revenue: 26400, hospitals: 3 },
      { month: 'Aug', revenue: 31200, hospitals: 4 },
      { month: 'Sep', revenue: 35880, hospitals: 4 },
    ],
  };

  // Hospital Growth & Registration Data
  const hospitalGrowthData = [
    { quarter: 'Q3 2025', registered: 1, active: 1, beds: 250 },
    { quarter: 'Q4 2025', registered: 2, active: 2, beds: 650 },
    { quarter: 'Q1 2026', registered: 2, active: 2, beds: 650 },
    { quarter: 'Q2 2026', registered: 3, active: 3, beds: 1100 },
    { quarter: 'Q3 2026', registered: 4, active: 4, beds: 1850 },
  ];

  // Subscription Plan Distribution
  const planDistribution = [
    { name: 'Enterprise Health Network', value: subscriptions.filter((s) => s.planTier === 'enterprise').length || 2, color: '#4f46e5', rate: '$1,799/mo' },
    { name: 'Professional Hospital (Standard)', value: subscriptions.filter((s) => s.planTier === 'standard').length || 1, color: '#0ea5e9', rate: '$799/mo' },
    { name: 'Starter Clinic (Basic)', value: subscriptions.filter((s) => s.planTier === 'basic').length || 1, color: '#10b981', rate: '$299/mo' },
  ];

  const handleExportAudit = () => {
    MockStorage.exportToCSV('Platform_Activity_Audit', activityLogs);
    showToast('Audit Exported', 'Platform-wide event audit log CSV generated successfully.', 'success');
  };

  const handleApproveHospital = (id: string, name: string) => {
    MockStorage.updateHospitalStatus(id, 'active');
    showToast('Hospital Approved', `${name} has been provisioned and activated.`, 'success');
  };

  const handleQuickOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospitalData.name || !newHospitalData.city) {
      showToast('Validation Error', 'Please enter hospital name and location.', 'error');
      return;
    }

    const newHosp: Hospital = {
      id: `HOSP-${(totalHospitals + 1).toString().padStart(3, '0')}`,
      name: newHospitalData.name,
      regNumber: `REG-${Date.now().toString().slice(-6)}`,
      type: (newHospitalData.type as HospitalType) || 'Multi-Specialty Center',
      city: newHospitalData.city,
      state: newHospitalData.state || 'NY',
      country: 'USA',
      postalCode: '10001',
      address: newHospitalData.address || `${newHospitalData.city}, ${newHospitalData.state}`,
      phone: newHospitalData.phone || '+1 (555) 010-9900',
      email: newHospitalData.email || `admin@${(newHospitalData.slug || 'hospital').toLowerCase()}.org`,
      adminName: 'Chief Medical Officer',
      adminEmail: newHospitalData.email || `admin@${(newHospitalData.slug || 'hospital').toLowerCase()}.org`,
      adminPhone: newHospitalData.phone || '+1 (555) 010-9900',
      planTier: newHospitalData.planTier,
      status: 'active',
      totalDoctors: 24,
      totalPatients: 140,
      totalBeds: newHospitalData.totalBeds,
      createdAt: new Date().toISOString().split('T')[0],
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&auto=format&fit=crop&q=80',
    };

    MockStorage.saveHospital(newHosp);
    showToast('Hospital Onboarded', `${newHosp.name} successfully registered to PulseCore SaaS network.`, 'success');
    setIsAddHospitalModalOpen(false);
    setNewHospitalData({
      name: '',
      slug: '',
      type: 'Multi-Specialty Hospital',
      city: '',
      state: '',
      address: '',
      phone: '',
      email: '',
      planTier: 'enterprise',
      totalBeds: 500,
    });
  };

  // Activity Log Category Icon Resolver
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="w-3.5 h-3.5 text-brand-600" />;
      case 'billing':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'ambulance':
        return <Ambulance className="w-3.5 h-3.5 text-rose-600" />;
      case 'clinical':
        return <HeartPulse className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. EXECUTIVE WELCOME & GREETING BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-700/80">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational • 99.99% Uptime
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {currentDateFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {getGreeting()}, {user?.name || 'Alexander Vance'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time multi-tenant health network telemetry, MRR velocity, clinical bed capacity, and hospital compliance across all provisioned facilities.
            </p>
          </div>

          {/* Quick Actions Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddHospitalModalOpen(true)}
              className="shadow-lg shadow-brand-500/30"
            >
              Add Hospital
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CreditCard className="w-4 h-4 text-indigo-400" />}
              onClick={() => navigate('/platform/subscriptions')}
              className="bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700"
            >
              Subscription Plans
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Globe className="w-4 h-4 text-teal-400" />}
              onClick={() => navigate('/platform/websites')}
              className="bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700"
            >
              Manage Websites
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BarChart3 className="w-4 h-4 text-purple-400" />}
              onClick={() => navigate('/platform/reports')}
              className="bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700"
            >
              View Reports
            </Button>
          </div>
        </div>

        {/* Decorative Background Accents */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. PLATFORM KPI CARDS (8 METRICS GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Hospitals */}
        <StatCard
          title="Total Hospitals"
          value={totalHospitals}
          icon={<Building2 className="w-5 h-5" />}
          trend={{ value: '+1 this month', direction: 'up', label: 'Registered facilities' }}
          accentColor="indigo"
          subtext="Multi-specialty healthcare networks"
          onClick={() => navigate('/platform/hospitals')}
        />

        {/* KPI 2: Active Hospitals */}
        <StatCard
          title="Active Hospitals"
          value={activeHospitals}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ value: '100% Active', direction: 'up', label: 'Zero downtime' }}
          accentColor="emerald"
          subtext="Fully provisioned tenant workspaces"
          onClick={() => navigate('/platform/hospitals')}
        />

        {/* KPI 3: Total Registered Users */}
        <StatCard
          title="Platform Users"
          value={totalUsers}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: '+8.4% MoM', direction: 'up', label: 'Across all facilities' }}
          accentColor="cyan"
          subtext="Doctors, staff, accountants & admins"
          onClick={() => navigate('/platform/users')}
        />

        {/* KPI 4: Provisioned Hospital Websites */}
        <StatCard
          title="Provisioned Websites"
          value={websites.length}
          icon={<Globe className="w-5 h-5" />}
          trend={{ value: `${websites.filter((w) => w.status === 'published').length} Live`, direction: 'up', label: 'Published tenant sites' }}
          accentColor="purple"
          subtext="CMS & Domain provisioned"
          onClick={() => navigate('/platform/websites')}
        />

        {/* KPI 5: Monthly Recurring Revenue */}
        <StatCard
          title="Monthly Revenue (MRR)"
          value={`$${totalMRR.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: '+14.8%', direction: 'up', label: 'ARR: $430,560' }}
          accentColor="indigo"
          subtext="100% recurring collection rate"
          onClick={() => navigate('/platform/subscriptions')}
        />

        {/* KPI 6: Active Subscriptions */}
        <StatCard
          title="Active Subscriptions"
          value={activeSubs}
          icon={<CreditCard className="w-5 h-5" />}
          trend={{ value: '100% Retained', direction: 'up', label: 'Zero churn' }}
          accentColor="emerald"
          subtext="Enterprise, Standard & Basic tiers"
          onClick={() => navigate('/platform/subscriptions')}
        />

        {/* KPI 7: Pending Support Tickets */}
        <StatCard
          title="Pending Support Tickets"
          value={pendingTickets}
          icon={<HelpCircle className="w-5 h-5" />}
          trend={{ value: 'SLA: 99.4%', direction: 'neutral', label: 'Avg response: 12m' }}
          accentColor="amber"
          subtext="Requires Super Admin review"
          onClick={() => navigate('/platform/support')}
        />

        {/* KPI 8: Active Ambulances */}
        <StatCard
          title="Ambulance Fleet"
          value={totalAmbulances}
          icon={<Ambulance className="w-5 h-5" />}
          trend={{ value: `${activeEmergencies} Active Trips`, direction: 'neutral', label: 'Telemetry live' }}
          accentColor="rose"
          subtext="ALS/BLS rapid response units"
          onClick={() => navigate('/platform/ambulance')}
        />
      </div>

      {/* 3. TWO-COLUMN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column A: Revenue Analytics Area Chart */}
        <div className="lg:col-span-8">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">SaaS Revenue Velocity & Financial Trajectory</h3>
                    <Badge variant="success" size="sm">
                      +24.5% YoY Growth
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly recurring revenue aggregation across Enterprise, Standard, and Basic hospital subscriptions.
                  </p>
                </div>

                {/* Date range filter buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['6m', '12m', 'ytd'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setDateRange(r)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        dateRange === r
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r === '6m' ? '6 Months' : r === '12m' ? '12 Months' : 'YTD 2026'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Header metrics bar */}
              <div className="grid grid-cols-3 gap-4 py-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Current MRR</p>
                  <p className="text-xl font-black text-slate-900">${totalMRR.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Projected ARR</p>
                  <p className="text-xl font-black text-indigo-600">${(totalMRR * 12).toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Net Retention Rate</p>
                  <p className="text-xl font-black text-emerald-600">118%</p>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData[dateRange]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Monthly Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Column B: Hospital Growth & Plan Distribution */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hospital Growth & Capacity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quarterly registered healthcare facilities</p>
                </div>
                <Badge variant="indigo" size="sm">
                  {totalHospitals} Facilities
                </Badge>
              </div>

              {/* Bar Chart of Hospital Growth */}
              <div className="h-44 w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hospitalGrowthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="active" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Active Hospitals" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Tier Distribution Summary */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Subscription Plan Share
              </span>
              {planDistribution.map((plan) => (
                <div key={plan.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">{plan.name}</span>
                    <span className="font-bold text-slate-900">{plan.value} ({Math.round((plan.value / totalHospitals) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(plan.value / totalHospitals) * 100}%`,
                        backgroundColor: plan.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 4. HOSPITAL MANAGEMENT OVERVIEW (RECENTLY ADDED HOSPITALS TABLE) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Recently Added Hospital Workspaces</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active multi-tenant healthcare facilities, bed occupancy rates, and license verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/hospitals')}
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              View All Hospitals ({totalHospitals})
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddHospitalModalOpen(true)}
            >
              Onboard Hospital
            </Button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Hospital Entity</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Staff & Capacity</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.slice(0, 5).map((hosp) => (
                <tr key={hosp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={hosp.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=80&auto=format&fit=crop&q=80'}
                        alt={hosp.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{hosp.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{hosp.id} • {hosp.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {hosp.city}, {hosp.state}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        hosp.planTier === 'enterprise'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : hosp.planTier === 'standard'
                          ? 'bg-sky-50 text-sky-700 border border-sky-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {hosp.planTier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <p className="font-semibold">{hosp.totalBeds} Beds Capacity</p>
                    <p className="text-[11px] text-slate-400">{hosp.totalDoctors} Doctors • {hosp.totalPatients || 120} Patients</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{hosp.createdAt}</td>
                  <td className="py-3.5 px-4">
                    {hosp.status === 'active' && <Badge variant="success" dot>Active</Badge>}
                    {hosp.status === 'pending' && <Badge variant="warning" dot>Pending Review</Badge>}
                    {hosp.status === 'suspended' && <Badge variant="error" dot>Suspended</Badge>}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    {hosp.status === 'pending' ? (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleApproveHospital(hosp.id, hosp.name)}
                      >
                        Approve
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => navigate(`/platform/hospitals/${hosp.id}`)}
                      >
                        View Details
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. SUBSCRIPTION & PLAN OVERVIEW SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Subscriptions</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeSubs} Facilities</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">100% Contract Compliance</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trial Subscriptions</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">0 in Trial</p>
          <p className="text-xs text-slate-500 font-medium mt-1">100% converted to paid plans</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring Subscriptions</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">0 Expiring Soon</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Auto-renewals active for all</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-600 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manage Plans</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/platform/subscriptions')}
            className="w-full mt-2"
          >
            Manage Subscriptions
          </Button>
        </Card>
      </div>

      {/* 6. TWO-COLUMN WIDGET ROW: WEBSITES & AMBULANCE OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Hospital Website Builder Overview */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Hospital Website Builder & Portal Health</h3>
              </div>
              <Badge variant="indigo" size="sm">
                {websites.length} Websites
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Published</span>
                <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                  {websites.filter((w) => w.status === 'published').length || 3} Live
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Drafts</span>
                <p className="text-lg font-extrabold text-amber-600 mt-0.5">
                  {websites.filter((w) => w.status === 'draft').length || 1}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SSL Security</span>
                <p className="text-lg font-extrabold text-teal-600 mt-0.5">TLS 1.3</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Patient booking engines, domain provisioning, and emergency banners are actively published across all tenant hospital subdomains.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Monthly Visitors: <strong>142,500+</strong></span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Globe className="w-4 h-4" />}
              onClick={() => navigate('/platform/websites')}
            >
              Open Website Builder
            </Button>
          </div>
        </Card>

        {/* Widget 2: Ambulance & Emergency Overview */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Global Ambulance & 911 Emergency Fleet</h3>
              </div>
              <Badge variant="error" size="sm">
                {activeEmergencies} Active Trips
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Fleet</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{totalAmbulances} Units</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Available Standby</span>
                <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                  {ambulances.filter((a) => a.status === 'Available').length} Ready
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Response</span>
                <p className="text-lg font-extrabold text-indigo-600 mt-0.5">6.8 mins</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time GPS telemetry and emergency paramedic coordination synchronized across all hospital emergency triage centers.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">911 Triage Status: <strong className="text-emerald-600">Active</strong></span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Ambulance className="w-4 h-4" />}
              onClick={() => navigate('/platform/ambulance')}
            >
              Open Ambulance Fleet
            </Button>
          </div>
        </Card>
      </div>

      {/* 7. PLATFORM ACTIVITY AUDIT & SUPPORT CENTER (TWO COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Live Platform Activity Audit Trail */}
        <div className="lg:col-span-8">
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Real-Time Platform Activity Audit Trail</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated compliance logging for SaaS and tenant events</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportAudit}
              >
                Export Audit CSV
              </Button>
            </div>

            <div className="divide-y divide-slate-100 pt-2">
              {activityLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3.5 text-xs hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getActivityIcon(log.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">{log.action}</p>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5 truncate">{log.target}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-slate-700">{log.actorName}</span>
                      <span>•</span>
                      <span>{log.actorRole}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 2: Support Center Overview Card */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Support Center</h3>
                </div>
                <Badge variant={pendingTickets > 0 ? 'warning' : 'success'} size="sm">
                  {pendingTickets} Pending
                </Badge>
              </div>

              {/* Support ticket counts */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Open Inquiries</span>
                  <p className="text-xl font-black text-rose-600 mt-1">{pendingTickets} Tickets</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Resolved SLA</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">99.4%</p>
                </div>
              </div>

              {/* Recent urgent tickets */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Priority Tickets Queue
                </span>
                {tickets.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate('/platform/support')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[160px]">{ticket.title}</span>
                      <Badge
                        variant={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-1">{ticket.hospitalName}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<HelpCircle className="w-4 h-4" />}
              onClick={() => navigate('/platform/support')}
              className="w-full mt-4"
            >
              Open Support Center
            </Button>
          </Card>
        </div>
      </div>

      {/* 8. QUICK ONBOARD HOSPITAL MODAL */}
      <Modal
        isOpen={isAddHospitalModalOpen}
        onClose={() => setIsAddHospitalModalOpen(false)}
        title="Onboard New Healthcare Facility"
        maxWidth="lg"
      >
        <form onSubmit={handleQuickOnboardSubmit} className="space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <span>
              Onboarding a new hospital will provision a secure isolated tenant database, configure default administrator credentials, and initialize EHR schemas.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hospital Entity Name</label>
            <Input
              required
              placeholder="e.g. Pacific Crest Health System"
              value={newHospitalData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewHospitalData({ ...newHospitalData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hospital Classification</label>
              <select
                value={newHospitalData.type}
                onChange={(e) => setNewHospitalData({ ...newHospitalData, type: e.target.value })}
                className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
              >
                <option value="Multi-Specialty Hospital">Multi-Specialty Hospital</option>
                <option value="General Hospital">General Hospital</option>
                <option value="Pediatrics Care">Pediatrics Care</option>
                <option value="Cardiology & Trauma Center">Cardiology & Trauma Center</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subscription Tier</label>
              <select
                value={newHospitalData.planTier}
                onChange={(e) =>
                  setNewHospitalData({ ...newHospitalData, planTier: e.target.value as SubscriptionPlanTier })
                }
                className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
              >
                <option value="enterprise">Enterprise ($1,799/mo)</option>
                <option value="standard">Standard ($799/mo)</option>
                <option value="basic">Basic ($299/mo)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">City</label>
              <Input
                required
                placeholder="e.g. Seattle"
                value={newHospitalData.city}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewHospitalData({ ...newHospitalData, city: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">State / Province</label>
              <Input
                required
                placeholder="e.g. WA"
                value={newHospitalData.state}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewHospitalData({ ...newHospitalData, state: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Admin Contact Email</label>
              <Input
                type="email"
                placeholder="director@hospital.org"
                value={newHospitalData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewHospitalData({ ...newHospitalData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Licensed Bed Capacity</label>
              <Input
                type="number"
                value={newHospitalData.totalBeds}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewHospitalData({ ...newHospitalData, totalBeds: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddHospitalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Provision & Activate Hospital
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlatformDashboard;
