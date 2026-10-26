import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileCheck,
  Tag,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Printer,
  Eye,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import {
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
import { useNotification } from '../../../context/NotificationContext';
import { LabOrder, LabTestCatalog } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';

const STATUS_COLORS: Record<string, string> = {
  Ordered: '#f59e0b',
  'Pending Sample': '#f59e0b',
  'Sample Collected': '#3b82f6',
  'In Progress': '#6366f1',
  Processing: '#6366f1',
  Completed: '#8b5cf6',
  Verified: '#10b981',
  'Sample Rejected': '#ef4444',
};

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const LaboratoryDashboard: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'HOSP-001';

  // Dynamic state loaded strictly from storage/backend
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => MockStorage.getLabOrders(hospId));
  const [labCatalog, setLabCatalog] = useState<LabTestCatalog[]>(() => MockStorage.getLabCatalog(hospId));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setLabOrders(MockStorage.getLabOrders(hospId));
    setLabCatalog(MockStorage.getLabCatalog(hospId));
    setTimeout(() => setIsRefreshing(false), 400);
  };

  useEffect(() => {
    refreshData();
    MockStorage.syncWithBackend?.();
    const handleUpdate = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [hospId]);

  // Dynamic KPI Metric Computations
  const totalOrdersCount = labOrders.length;

  const pendingCollectionCount = useMemo(
    () => labOrders.filter((o) => o.status === 'Ordered' || o.status === 'Pending Sample').length,
    [labOrders]
  );

  const inAnalysisCount = useMemo(
    () =>
      labOrders.filter(
        (o) => o.status === 'Sample Collected' || o.status === 'In Progress' || o.status === 'Processing'
      ).length,
    [labOrders]
  );

  const awaitingSignOffCount = useMemo(
    () => labOrders.filter((o) => o.status === 'Completed').length,
    [labOrders]
  );

  const verifiedCount = useMemo(
    () => labOrders.filter((o) => o.status === 'Verified').length,
    [labOrders]
  );

  const criticalCount = useMemo(
    () => labOrders.filter((o) => o.resultStatus === 'Critical').length,
    [labOrders]
  );

  const rejectedCount = useMemo(
    () => labOrders.filter((o) => o.status === 'Sample Rejected').length,
    [labOrders]
  );

  const activeCatalogCount = useMemo(
    () => labCatalog.filter((t) => t.status !== 'inactive').length,
    [labCatalog]
  );

  const totalFeeRevenue = useMemo(
    () => labOrders.reduce((sum, o) => sum + (o.fee || 0), 0),
    [labOrders]
  );

  // Urgent & STAT Priority Queue
  const urgentOrders = useMemo(
    () =>
      labOrders.filter(
        (o) =>
          (o.priority === 'Urgent' || o.resultStatus === 'Critical') &&
          o.status !== 'Verified' &&
          o.status !== 'Sample Rejected'
      ),
    [labOrders]
  );

  // Department Workload Distribution (Dynamic Recharts data)
  const departmentWorkloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    labOrders.forEach((order) => {
      const cat = order.category || 'General Pathology';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      orders: count,
    }));
  }, [labOrders]);

  // Status Breakdown (Dynamic Recharts data)
  const statusBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {
      'Pending Draw': 0,
      'In Analysis': 0,
      'Awaiting Sign-off': 0,
      'Verified & Signed': 0,
      'Sample Rejected': 0,
    };

    labOrders.forEach((o) => {
      if (o.status === 'Ordered' || o.status === 'Pending Sample') counts['Pending Draw']++;
      else if (o.status === 'Sample Collected' || o.status === 'In Progress' || o.status === 'Processing')
        counts['In Analysis']++;
      else if (o.status === 'Completed') counts['Awaiting Sign-off']++;
      else if (o.status === 'Verified') counts['Verified & Signed']++;
      else if (o.status === 'Sample Rejected') counts['Sample Rejected']++;
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color:
          name === 'Pending Draw'
            ? '#f59e0b'
            : name === 'In Analysis'
            ? '#6366f1'
            : name === 'Awaiting Sign-off'
            ? '#8b5cf6'
            : name === 'Verified & Signed'
            ? '#10b981'
            : '#ef4444',
      }));
  }, [labOrders]);

  // Specimen Types Distribution (Dynamic)
  const specimenBreakdown = useMemo(() => {
    const specimens: Record<string, number> = {};
    labOrders.forEach((o) => {
      const sample = o.sampleType || 'Whole Blood';
      specimens[sample] = (specimens[sample] || 0) + 1;
    });
    return Object.entries(specimens).sort((a, b) => b[1] - a[1]);
  }, [labOrders]);

  // Recent 6 Orders
  const recentOrders = useMemo(() => {
    return [...labOrders].slice(0, 6);
  }, [labOrders]);

  // Helper for tube badge
  const renderTubeBadge = (tubeColor?: string) => {
    if (!tubeColor) return null;
    const lower = tubeColor.toLowerCase();
    let bg = 'bg-slate-100 text-slate-800 border-slate-200';
    let dot = 'bg-slate-500';

    if (lower.includes('lavender') || lower.includes('edta') || lower.includes('purple')) {
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      dot = 'bg-purple-600';
    } else if (lower.includes('gold') || lower.includes('sst') || lower.includes('gel')) {
      bg = 'bg-amber-50 text-amber-800 border-amber-300';
      dot = 'bg-amber-500';
    } else if (lower.includes('red') || lower.includes('plain')) {
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      dot = 'bg-rose-500';
    } else if (lower.includes('grey') || lower.includes('gray') || lower.includes('fluoride')) {
      bg = 'bg-slate-100 text-slate-700 border-slate-300';
      dot = 'bg-slate-500';
    } else if (lower.includes('blue') || lower.includes('citrate')) {
      bg = 'bg-sky-50 text-sky-700 border-sky-300';
      dot = 'bg-sky-500';
    } else if (lower.includes('green') || lower.includes('heparin')) {
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      dot = 'bg-emerald-500';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
        {tubeColor}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Dynamic Header */}
      <PageHeader
        title="Laboratory Operations Dashboard"
        subtitle={`Real-time diagnostic telemetry, phlebotomy tracking, and clinical pathology workflow for ${
          currentHospital?.name || 'Central Hospital'
        }`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Laboratory Console' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={refreshData}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Sync Analyzer Data
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/hospital/laboratory/new-order')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Place Lab Order
            </Button>
          </div>
        }
      />

      {/* Critical Panic Alert Banner (if any critical orders exist) */}
      {criticalCount > 0 && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 text-white rounded-lg animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                CRITICAL PANIC VALUE ALERT: {criticalCount} Diagnostic {criticalCount === 1 ? 'Finding' : 'Findings'} Exceed Panic Limits
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Immediate telephonic notification to ordering physician required under NABL/CAP clinical guidelines.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => navigate('/hospital/laboratory/orders')}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Review Critical Alerts
          </Button>
        </div>
      )}

      {/* Dynamic Operational KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Pending Draw"
          value={pendingCollectionCount}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          accentColor="amber"
          subtext="Awaiting phlebotomy"
          onClick={() => navigate('/hospital/laboratory/orders')}
        />

        <StatCard
          title="In Analytical Run"
          value={inAnalysisCount}
          icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
          accentColor="indigo"
          subtext="Specimen in analyzer"
          onClick={() => navigate('/hospital/laboratory/orders')}
        />

        <StatCard
          title="Awaiting Sign-off"
          value={awaitingSignOffCount}
          icon={<FileCheck className="w-5 h-5 text-purple-600" />}
          accentColor="purple"
          subtext="Pending Pathologist"
          onClick={() => navigate('/hospital/laboratory/orders')}
        />

        <StatCard
          title="Verified Reports"
          value={verifiedCount}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
          subtext="Signed & released"
          onClick={() => navigate('/hospital/laboratory/orders')}
        />

        <StatCard
          title="Critical Alerts"
          value={criticalCount}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          accentColor="rose"
          subtext="Panic thresholds"
          onClick={() => navigate('/hospital/laboratory/orders')}
        />

        <StatCard
          title="Active Test Panels"
          value={activeCatalogCount}
          icon={<Tag className="w-5 h-5 text-cyan-600" />}
          accentColor="cyan"
          subtext="Configured in catalog"
          onClick={() => navigate('/hospital/laboratory/catalog')}
        />
      </div>

      {/* Urgent & STAT Diagnostic Priority Queue */}
      <Card className="border-l-4 border-l-rose-500">
        <CardHeader
          title="Emergency & STAT Diagnostic Queue"
          subtitle="Priority investigation requisitions requiring immediate turnaround"
          action={
            <Badge variant={urgentOrders.length > 0 ? 'error' : 'neutral'} dot>
              {urgentOrders.length} STAT Pending
            </Badge>
          }
        />
        <CardContent className="p-4">
          {urgentOrders.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-700 text-sm">No Urgent STAT Requisitions Pending</p>
              <p className="text-xs text-slate-400 mt-0.5">
                All STAT blood work, troponins, and emergency panels are currently processed and clear.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="px-3 py-2.5">Priority</th>
                    <th className="px-3 py-2.5">Order ID & Test</th>
                    <th className="px-3 py-2.5">Patient Details</th>
                    <th className="px-3 py-2.5">Ordering Doctor</th>
                    <th className="px-3 py-2.5">Specimen & Tube</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {urgentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-rose-50/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold animate-pulse">
                          STAT URGENT
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {order.testName}
                        <p className="font-mono text-[10px] text-indigo-600 font-normal">{order.id} • {order.barcodeNumber}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-900">{order.patientName}</p>
                        <p className="text-[10px] text-slate-500">{order.patientAge}y • {order.patientGender}</p>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">
                        {order.doctorName}
                      </td>
                      <td className="px-3 py-2.5">
                        {renderTubeBadge(order.tubeColor)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="warning">{order.status}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => navigate('/hospital/laboratory/orders')}
                        >
                          Process Order
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Visualizations: Department Workload & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workload Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Workload Distribution by Clinical Department"
            subtitle="Volume of diagnostic tests processed across pathology subdivisions"
          />
          <CardContent className="p-4">
            {departmentWorkloadData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No diagnostic test data available yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Bar dataKey="orders" name="Test Orders" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {departmentWorkloadData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Status Workflow Distribution */}
        <Card>
          <CardHeader
            title="Clinical Workflow Breakdown"
            subtitle="Current status split across active lab requisitions"
          />
          <CardContent className="p-4">
            {statusBreakdownData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No orders recorded.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 text-xs">
                  {statusBreakdownData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Work Orders Feed & Specimen Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Work Orders Table */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Diagnostic Requisitions"
            subtitle="Latest orders received from OPD chambers, Emergency & Inpatient wards"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/hospital/laboratory/orders')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Full Queue
              </Button>
            }
          />
          <CardContent className="p-4">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No diagnostic orders created yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="px-3 py-2.5">Order ID & Test</th>
                      <th className="px-3 py-2.5">Patient</th>
                      <th className="px-3 py-2.5">Specimen / Cap</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-900">{order.testName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-indigo-600 font-medium">{order.id}</span>
                            {order.barcodeNumber && (
                              <span className="font-mono text-[9px] bg-slate-900 text-teal-300 px-1 py-0.2 rounded font-semibold">
                                {order.barcodeNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-900">{order.patientName}</p>
                          <p className="text-[10px] text-slate-400">{order.patientAge}y • {order.patientGender}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          {renderTubeBadge(order.tubeColor)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={
                              order.status === 'Verified'
                                ? 'success'
                                : order.status === 'Completed'
                                ? 'purple'
                                : order.status === 'Sample Rejected'
                                ? 'error'
                                : 'warning'
                            }
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate('/hospital/laboratory/orders')}
                            title="Inspect in Queue"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specimen Telemetry & Quick Links */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Specimens Processed Today"
              subtitle="Analytical sample breakdown by specimen matrix"
            />
            <CardContent className="p-4 space-y-3">
              {specimenBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400">No specimen data recorded.</p>
              ) : (
                specimenBreakdown.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      🧪 {type}
                    </span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                      {count} samples
                    </span>
                  </div>
                ))
              )}

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Gross Laboratory Revenue:</span>
                  <span className="font-bold text-slate-900 font-mono">₹{totalFeeRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">LIS Analyzer Link:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Online (24/7)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border-0 shadow-lg">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h4 className="font-bold text-sm">Laboratory Technician Shortcuts</h4>
              </div>
              <p className="text-xs text-indigo-200">
                Quickly access diagnostic panels, configure vacutainer tube caps, or issue urgent phlebotomy draws.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/hospital/laboratory/new-order')}
                  className="w-full justify-center bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold border-0"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Place Lab Requisition
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/hospital/laboratory/catalog')}
                  className="w-full justify-center text-black border-indigo-700 hover:bg-indigo-800"
                  leftIcon={<Tag className="w-4 h-4" />}
                >
                  Manage Test Catalog
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
