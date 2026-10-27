import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Syringe,
  CheckSquare,
  Stethoscope,
  FlaskConical,
  Activity,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  BedDouble,
  Printer,
  Eye,
  RefreshCw,
  Search,
  FileCheck,
  Filter,
  ShieldCheck,
  QrCode,
  Layers,
  HeartPulse,
  CreditCard,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { LabOrder, Admission, Bed, Patient, NurseConditionStatus } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';

export const NurseDashboard: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'HOSP-001';

  // Active Data State
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => MockStorage.getLabOrders(hospId));
  const [admissions, setAdmissions] = useState<Admission[]>(() => MockStorage.getAdmissions(hospId));
  const [beds, setBeds] = useState<Bed[]>(() => MockStorage.getBeds(hospId));
  const [patients, setPatients] = useState<Patient[]>(() => MockStorage.getPatients(hospId));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'collection' | 'directives' | 'trail' | 'inpatients'>('collection');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Routine' | 'Urgent'>('all');

  // Modal States
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  // Dynamic Hospital Nurses Roster
  const hospitalNurses = useMemo(() => MockStorage.getHospitalNurses(hospId), [hospId]);

  // Specimen Collection Form State
  const [collectBarcode, setCollectBarcode] = useState('');
  const [collectTubeColor, setCollectTubeColor] = useState('');
  const [selectedCollectorNurseId, setSelectedCollectorNurseId] = useState('');
  const [nurseCollectorName, setNurseCollectorName] = useState('');
  const [patientPrepConfirmed, setPatientPrepConfirmed] = useState(true);
  const [patientPrepNotes, setPatientPrepNotes] = useState('Patient dual-ID verified. Fasting protocol checked. Aseptic venipuncture performed.');

  // Directive Execution Form State
  const [selectedExecNurseId, setSelectedExecNurseId] = useState('');
  const [executingNurseName, setExecutingNurseName] = useState('');
  const [nurseExecutionNotes, setNurseExecutionNotes] = useState('');
  const [nurseExecutionConfirmed, setNurseExecutionConfirmed] = useState(true);

  // Inpatient Monitoring & Vitals Modal
  const [isNurseVitalsModalOpen, setIsNurseVitalsModalOpen] = useState(false);
  const [selectedAdmissionForVitals, setSelectedAdmissionForVitals] = useState<Admission | null>(null);
  const [nurseVitalsForm, setNurseVitalsForm] = useState({
    bloodPressure: '120/80',
    heartRate: '76',
    temperature: '98.6',
    oxygenLevel: '99',
    nurseCondition: 'Stable & Improving' as NurseConditionStatus,
    nurseNotes: '',
    nurseName: '',
  });

  // Final Discharge Modal for Nurse
  const [isFinalDischargeModalOpen, setIsFinalDischargeModalOpen] = useState(false);
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState<Admission | null>(null);

  const handleOpenNurseVitals = (adm: Admission) => {
    setSelectedAdmissionForVitals(adm);
    setNurseVitalsForm({
      bloodPressure: adm.nurseVitals?.bloodPressure || '120/80',
      heartRate: adm.nurseVitals?.heartRate ? String(adm.nurseVitals.heartRate) : '76',
      temperature: adm.nurseVitals?.temperature ? String(adm.nurseVitals.temperature) : '98.6',
      oxygenLevel: adm.nurseVitals?.oxygenLevel ? String(adm.nurseVitals.oxygenLevel) : '99',
      nurseCondition: adm.nurseCondition || 'Stable & Improving',
      nurseNotes: adm.nurseNotes || '',
      nurseName: adm.nurseUpdatedBy || adm.nurseVitals?.recordedBy || user?.name || 'Staff Nurse',
    });
    setIsNurseVitalsModalOpen(true);
  };

  const handleSaveNurseVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionForVitals) return;

    const reportingNurseName = nurseVitalsForm.nurseName.trim() || user?.name || 'Ward Staff Nurse';

    MockStorage.updateNurseMonitoring(selectedAdmissionForVitals.id, {
      nurseNotes: nurseVitalsForm.nurseNotes.trim(),
      nurseCondition: nurseVitalsForm.nurseCondition,
      vitals: {
        bloodPressure: nurseVitalsForm.bloodPressure,
        heartRate: Number(nurseVitalsForm.heartRate) || 75,
        temperature: Number(nurseVitalsForm.temperature) || 98.6,
        oxygenLevel: Number(nurseVitalsForm.oxygenLevel) || 98,
      },
      recordedBy: reportingNurseName,
    });

    showToast(
      'Clinical Update Submitted',
      `Vitals & status for ${selectedAdmissionForVitals.patientName} submitted to Attending Doctor ${selectedAdmissionForVitals.doctorName}.`
    );
    setIsNurseVitalsModalOpen(false);
    refreshData();
  };

  const handleConfirmFinalDischarge = () => {
    if (!selectedAdmissionForDischarge) return;
    const res = MockStorage.completeFinalDischarge(
      selectedAdmissionForDischarge.id,
      user?.name || 'Staff Nurse',
      'Nurse'
    );
    if (!res.success) {
      showToast('Discharge Blocked', res.error || 'Cannot complete discharge.', 'error');
      return;
    }
    showToast(
      'Patient Discharged',
      `${selectedAdmissionForDischarge.patientName} discharged. Bed ${selectedAdmissionForDischarge.bedNumber} is now Available.`
    );
    setIsFinalDischargeModalOpen(false);
    refreshData();
  };

  const refreshData = () => {
    setIsRefreshing(true);
    setLabOrders(MockStorage.getLabOrders(hospId));
    setAdmissions(MockStorage.getAdmissions(hospId));
    setBeds(MockStorage.getBeds(hospId));
    setPatients(MockStorage.getPatients(hospId));
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [hospId]);

  // Metric Computations
  const pendingCollectionOrders = useMemo(
    () => labOrders.filter((o) => o.status === 'Ordered' || o.status === 'Pending Sample'),
    [labOrders]
  );

  const doctorDirectivesOrders = useMemo(
    () => labOrders.filter((o) => o.status === 'Doctor Reviewed'),
    [labOrders]
  );

  const completedTrailOrders = useMemo(
    () => labOrders.filter((o) => o.status === 'Action Completed'),
    [labOrders]
  );

  const activeAdmissionsList = useMemo(
    () => admissions.filter((a) => a.status === 'Active' || a.status === 'Discharge Initiated'),
    [admissions]
  );

  // Filtered Collection Queue
  const filteredCollectionOrders = useMemo(() => {
    return pendingCollectionOrders.filter((order) => {
      const matchesSearch =
        order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.barcodeNumber && order.barcodeNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [pendingCollectionOrders, searchQuery, priorityFilter]);

  // Filtered Directives Queue
  const filteredDirectivesOrders = useMemo(() => {
    return doctorDirectivesOrders.filter((order) => {
      const matchesSearch =
        order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.doctorInstructions && order.doctorInstructions.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [doctorDirectivesOrders, searchQuery, priorityFilter]);

  // Handlers: Specimen Collection
  const handleOpenCollectModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setCollectBarcode(order.barcodeNumber || `BC-LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`);
    setCollectTubeColor(order.tubeColor || 'Lavender / EDTA Tube');
    setPatientPrepConfirmed(true);
    setPatientPrepNotes('Patient dual-ID verified. Fasting protocol checked. Aseptic venipuncture performed.');

    const matching = hospitalNurses.find(
      (n) => (user?.name && n.name.toLowerCase().includes(user.name.toLowerCase())) ||
             (user?.id && n.id === user.id)
    ) || hospitalNurses[0];

    setSelectedCollectorNurseId(matching?.id || 'NUR-CUSTOM');
    setNurseCollectorName(user?.role === 'nurse' && user?.name ? user.name : (matching?.name || 'Sister Sunita Rao'));
    setIsCollectModalOpen(true);
  };

  const handleSelectCollectorNurse = (nurseId: string) => {
    setSelectedCollectorNurseId(nurseId);
    const n = hospitalNurses.find((item) => item.id === nurseId);
    if (n) {
      setNurseCollectorName(n.name);
    }
  };

  const handleConfirmCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    MockStorage.collectLabSampleByNurse(
      selectedOrder.id,
      nurseCollectorName,
      patientPrepConfirmed,
      patientPrepNotes,
      collectTubeColor,
      collectBarcode,
      selectedCollectorNurseId !== 'NUR-CUSTOM' ? selectedCollectorNurseId : undefined
    );

    showToast(
      'Specimen Collected by Nurse',
      `Patient prepared and sample collected by Nurse ${nurseCollectorName}${selectedCollectorNurseId && selectedCollectorNurseId !== 'NUR-CUSTOM' ? ` (${selectedCollectorNurseId})` : ''}. Transferred to laboratory.`
    );
    setIsCollectModalOpen(false);
    refreshData();
  };

  // Handlers: Doctor Directive Execution
  const handleOpenExecModal = (order: LabOrder) => {
    setSelectedOrder(order);
    const matching = hospitalNurses.find(
      (n) => (user?.name && n.name.toLowerCase().includes(user.name.toLowerCase())) ||
             (user?.id && n.id === user.id)
    ) || hospitalNurses[0];

    setSelectedExecNurseId(matching?.id || 'NUR-CUSTOM');
    setExecutingNurseName(user?.role === 'nurse' && user?.name ? user.name : (matching?.name || 'Sister Sunita Rao'));
    setNurseExecutionNotes(
      order.nurseExecutionNotes ||
      `Directives of Dr. ${order.reviewedByDoctorName || order.doctorName} administered at bedside. Patient vitals monitored and stable.`
    );
    setNurseExecutionConfirmed(true);
    setIsExecModalOpen(true);
  };

  const handleSelectExecNurse = (nurseId: string) => {
    setSelectedExecNurseId(nurseId);
    const n = hospitalNurses.find((item) => item.id === nurseId);
    if (n) {
      setExecutingNurseName(n.name);
    }
  };

  const handleConfirmExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    MockStorage.executeDoctorInstructionByNurse(
      selectedOrder.id,
      executingNurseName,
      nurseExecutionNotes,
      selectedExecNurseId !== 'NUR-CUSTOM' ? selectedExecNurseId : undefined
    );

    showToast(
      'Directives Executed & Loop Closed',
      `Clinical directives administered by Nurse ${executingNurseName}${selectedExecNurseId && selectedExecNurseId !== 'NUR-CUSTOM' ? ` (${selectedExecNurseId})` : ''}. Care loop completed.`
    );
    setIsExecModalOpen(false);
    refreshData();
  };

  const handleOpenReportModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setIsReportModalOpen(true);
  };

  const renderTubeBadge = (color?: string) => {
    const c = color?.toLowerCase() || '';
    let bg = 'bg-slate-100 text-slate-800 border-slate-300';
    if (c.includes('lavender') || c.includes('purple') || c.includes('edta')) {
      bg = 'bg-purple-100 text-purple-800 border-purple-300';
    } else if (c.includes('red') || c.includes('serum') || c.includes('plain')) {
      bg = 'bg-rose-100 text-rose-800 border-rose-300';
    } else if (c.includes('blue') || c.includes('citrate') || c.includes('coag')) {
      bg = 'bg-sky-100 text-sky-800 border-sky-300';
    } else if (c.includes('grey') || c.includes('gray') || c.includes('fluoride')) {
      bg = 'bg-slate-200 text-slate-800 border-slate-400';
    } else if (c.includes('green') || c.includes('heparin')) {
      bg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (c.includes('yellow') || c.includes('gold') || c.includes('sst')) {
      bg = 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${bg}`}>
        <span className="w-2 h-2 rounded-full bg-current opacity-70" />
        {color || 'Standard Vacutainer'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Nurse Dashboard"
        subtitle={`Welcome, ${user?.name || 'Staff Nurse'} — Active shift duties: patient pre-test preparation, specimen collection, and bedside doctor directive execution`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Nurse Dashboard' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh Queues
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/laboratory/orders')}
              leftIcon={<FlaskConical className="w-4 h-4" />}
            >
              Diagnostic Work Orders
            </Button>
          </div>
        }
      />

      {/* KPI Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Specimen Collection Queue"
          value={pendingCollectionOrders.length}
          subtext="Pending phlebotomy"
          accentColor="cyan"
          icon={<Syringe className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Doctor Directives to Execute"
          value={doctorDirectivesOrders.length}
          subtext="Post-diagnostic orders"
          accentColor="purple"
          icon={<Stethoscope className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          title="Active Inpatients (IPD)"
          value={activeAdmissionsList.length}
          subtext="Beds under observation"
          accentColor="emerald"
          icon={<BedDouble className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Completed Care Loops"
          value={completedTrailOrders.length}
          subtext="Directives administered"
          accentColor="indigo"
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
        />
      </div>

      {/* Main Clinical Station Card */}
      <Card>
        <div className="border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between p-4 gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('collection')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'collection'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                Specimen Collection Queue
                {pendingCollectionOrders.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'collection' ? 'bg-white/30 text-white' : 'bg-blue-200 text-blue-900'}`}>
                    {pendingCollectionOrders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('directives')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'directives'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Doctor Directives Execution
                {doctorDirectivesOrders.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'directives' ? 'bg-white/30 text-white' : 'bg-purple-200 text-purple-900'}`}>
                    {doctorDirectivesOrders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trail')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'trail'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed Care Trail ({completedTrailOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inpatients')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'inpatients'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
                Inpatient Observation ({activeAdmissionsList.length})
              </button>
            </div>

            {/* Quick Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient or test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
                />
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="py-1.5 px-2 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white text-slate-700"
              >
                <option value="all">All Priorities</option>
                <option value="Urgent">STAT / Urgent</option>
                <option value="Routine">Routine</option>
              </select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* TAB 1: Specimen Collection Queue */}
          {activeTab === 'collection' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Patient Demographics</th>
                    <th className="px-4 py-3">Requisitioned Test</th>
                    <th className="px-4 py-3">Required Specimen & Tube</th>
                    <th className="px-4 py-3">Ordering Physician</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Nursing Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCollectionOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Syringe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No pending specimen collections</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">All patient samples have been prepared and collected.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCollectionOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{order.patientName}</p>
                          <p className="text-[10px] text-slate-400">{order.patientAge}y • {order.patientGender} • ID: {order.patientId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{order.testName}</p>
                          <span className="font-mono text-[10px] text-indigo-600 font-medium">{order.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-700 font-medium">🧪 {order.sampleType || 'Blood'}</span>
                            <div>{renderTubeBadge(order.tubeColor)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p className="font-medium">{order.doctorName}</p>
                          <p className="text-[10px] text-slate-400">{order.orderDate}</p>
                        </td>
                        <td className="px-4 py-3">
                          {order.priority === 'Urgent' ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-extrabold text-[10px] animate-pulse">
                              STAT
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Routine</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" dot>Pending Sample</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleOpenCollectModal(order)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            leftIcon={<Syringe className="w-3.5 h-3.5" />}
                          >
                            Prepare & Collect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Doctor Directives Execution Queue */}
          {activeTab === 'directives' && (
            <div className="p-4 space-y-4">
              {filteredDirectivesOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No active doctor directives pending</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All physician post-diagnostic instructions have been carried out.</p>
                </div>
              ) : (
                filteredDirectivesOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 hover:bg-purple-50/50 transition-colors space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{order.patientName}</span>
                          <span className="text-xs text-slate-400">({order.patientAge}y / {order.patientGender})</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-300">
                            MRN: {order.patientId}
                          </span>
                          {order.priority === 'Urgent' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold animate-pulse">
                              STAT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Investigation: <strong className="text-slate-800">{order.testName}</strong> • Barcode: <span className="font-mono">{order.barcodeNumber}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenReportModal(order)}
                          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          leftIcon={<Printer className="w-3 h-3" />}
                        >
                          Report
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleOpenExecModal(order)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                          leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
                        >
                          Execute Directives
                        </Button>
                      </div>
                    </div>

                    {/* Diagnostic Findings Summary */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-500">Verified Findings:</span>{' '}
                        <strong className="text-slate-900">{order.resultValue}</strong>
                      </div>
                      <div>
                        <Badge variant={order.resultStatus === 'Critical' ? 'error' : order.resultStatus === 'Abnormal' ? 'warning' : 'success'}>
                          {order.resultStatus || 'Normal'}
                        </Badge>
                      </div>
                      {order.verifiedBy && (
                        <span className="text-[11px] text-slate-500">
                          Signed by {order.verifiedBy} ({order.verifiedDate})
                        </span>
                      )}
                    </div>

                    {/* Prominent Physician Directive Box */}
                    <div className="p-3 bg-purple-100/70 border border-purple-300 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
                        <Stethoscope className="w-4 h-4 text-purple-700" />
                        Attending Physician Clinical Directives for Bedside Nursing:
                      </div>
                      <p className="text-purple-950 font-semibold text-xs bg-white/90 p-2.5 rounded border border-purple-200">
                        {order.doctorInstructions}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-purple-700 pt-0.5">
                        <span>Issued by: Dr. {order.reviewedByDoctorName || order.doctorName}</span>
                        <span>{order.doctorReviewDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Completed Clinical Care Trail */}
          {activeTab === 'trail' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Investigation</th>
                    <th className="px-4 py-3">Specimen Draw</th>
                    <th className="px-4 py-3">Doctor Directives</th>
                    <th className="px-4 py-3">Nursing Bedside Execution</th>
                    <th className="px-4 py-3 text-right">Status / Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedTrailOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No completed care loops logged yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Executed orders will appear here once nursing action is completed.</p>
                      </td>
                    </tr>
                  ) : (
                    completedTrailOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{order.patientName}</p>
                          <p className="text-[10px] text-slate-400">{order.patientAge}y • {order.patientGender} • ID: {order.patientId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{order.testName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{order.id}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p className="font-semibold text-blue-700 text-[11px]">✓ {order.collectedByNurseName || 'Sister Sunita'}</p>
                          {order.collectedByNurseId && (
                            <span className="font-mono text-[9px] bg-blue-50 text-blue-800 px-1 py-0.2 rounded border border-blue-200">
                              ID: {order.collectedByNurseId}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">{order.specimenCollectionDate}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-purple-800 font-medium text-[11px] line-clamp-2" title={order.doctorInstructions}>
                            👨‍⚕️ {order.doctorInstructions}
                          </p>
                          <p className="text-[10px] text-slate-400">Dr. {order.reviewedByDoctorName || order.doctorName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-emerald-800 font-medium text-[11px] line-clamp-2" title={order.nurseExecutionNotes}>
                            👩‍⚕️ {order.nurseExecutionNotes}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-emerald-900 text-[10px]">{order.executedByNurseName}</span>
                            {order.executedByNurseId && (
                              <span className="font-mono text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded border border-emerald-200">
                                ID: {order.executedByNurseId}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{order.nurseExecutionDate}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Closed
                            </span>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenReportModal(order)}
                              title="Print Official Diagnostic Report"
                            >
                              <Printer className="w-3 h-3 text-slate-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: Inpatient Bed Observation */}
          {activeTab === 'inpatients' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Patient & UHID</th>
                    <th className="px-4 py-3">Bed & Ward</th>
                    <th className="px-4 py-3">Attending Doctor</th>
                    <th className="px-4 py-3">Nurse Monitoring & Vitals</th>
                    <th className="px-4 py-3">Discharge Lifecycle Stage</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeAdmissionsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No active inpatient admissions</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">All inpatient beds are currently vacant.</p>
                      </td>
                    </tr>
                  ) : (
                    activeAdmissionsList.map((adm) => {
                      const isDischargeInitiated = adm.status === 'Discharge Initiated';
                      const isBillingPaid = adm.billingStatus === 'Paid' || adm.billingStatus === 'Cleared';
                      const conditionColor =
                        adm.nurseCondition === 'Ready for Discharge Review'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : adm.nurseCondition === 'Critical / High Attention'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                      return (
                        <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{adm.patientName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">UHID: {adm.patientId}</p>
                            <p className="text-[10px] text-slate-500">{adm.diagnosis || adm.reason}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              Bed {adm.bedNumber}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{adm.wardType} • {adm.departmentName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{adm.doctorName}</p>
                            <span className="text-[10px] text-slate-400">Admitted {adm.admissionDate}</span>
                          </td>
                          <td className="px-4 py-3">
                            {adm.nurseVitals ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border">
                                    BP {adm.nurseVitals.bloodPressure || '120/80'}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border">
                                    Pulse {adm.nurseVitals.heartRate || 75}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border">
                                    SpO2 {adm.nurseVitals.oxygenLevel || 98}%
                                  </span>
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${conditionColor}`}>
                                  {adm.nurseCondition || 'Stable & Improving'}
                                </span>
                                {adm.nurseNotes && (
                                  <p className="text-[10px] text-slate-500 italic line-clamp-1">
                                    "{adm.nurseNotes}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block font-medium">
                                ⚠️ Vitals & Update Required
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!isDischargeInitiated ? (
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                                <Clock className="w-3 h-3" /> Inpatient Care Active
                              </span>
                            ) : isBillingPaid ? (
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3" /> Ready for Final Discharge
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                                <CreditCard className="w-3 h-3" /> Dr. Approved • Billing Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleOpenNurseVitals(adm)}
                                leftIcon={<HeartPulse className="w-3.5 h-3.5 text-rose-500" />}
                                className="font-semibold"
                              >
                                Log Vitals & Update Doctor
                              </Button>

                              {isDischargeInitiated && isBillingPaid ? (
                                <Button
                                  variant="primary"
                                  size="xs"
                                  onClick={() => {
                                    setSelectedAdmissionForDischarge(adm);
                                    setIsFinalDischargeModalOpen(true);
                                  }}
                                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                  Complete Discharge
                                </Button>
                              ) : isDischargeInitiated && !isBillingPaid ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  disabled
                                  className="text-slate-400 text-[10px]"
                                  title="Cannot discharge until billing is settled"
                                >
                                  Awaiting Cashier
                                </Button>
                              ) : null}

                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => navigate(`/hospital/patients/${adm.patientId}`)}
                              >
                                View EHR
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Nurse Patient Preparation & Specimen Collection */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title="Patient Preparation & Specimen Collection"
        subtitle={`Requisition ${selectedOrder?.id} — ${selectedOrder?.patientName}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmCollection} className="space-y-4">
            {/* Visual Barcode Vacutainer Label Preview - Clean Light Clinical Specimen Label */}
            <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {currentHospital?.name ? `${currentHospital.name.toUpperCase()} • SPECIMEN` : 'TERTIARY HOSPITAL LAB SPECIMEN'}
                </span>
                <span
                  className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    selectedOrder.priority === 'Urgent'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedOrder.priority === 'Urgent' ? 'STAT / URGENT' : 'ROUTINE'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{selectedOrder.patientName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ID: <span className="font-mono font-medium text-slate-700">{selectedOrder.patientId}</span> • {selectedOrder.patientAge}y / {selectedOrder.patientGender}
                  </p>
                  <p className="text-xs text-indigo-700 font-semibold mt-1 truncate">
                    🧪 {selectedOrder.testName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="bg-white border border-slate-300 rounded-lg p-2 shadow-2xs inline-block text-center">
                    {/* High contrast barcode stripes (Black on White for authentic clinical scanning) */}
                    <div className="flex items-center justify-center gap-0.5 h-6 px-1" aria-hidden="true">
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1.5 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-2 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-1.5 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1.5 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-2 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                    </div>
                    <p className="font-mono text-[10px] font-bold text-slate-800 tracking-wider mt-1">{collectBarcode}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientPrepConfirmed}
                  onChange={(e) => setPatientPrepConfirmed(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                  required
                />
                <div>
                  <span className="text-xs font-bold text-blue-950">Patient Dual-ID & Clinical Preparation Confirmed *</span>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Verified patient wristband/MRN, checked pre-test preparation (fasting protocol, medications withheld as needed), and aseptic site disinfection.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Assigned Barcode ID *"
                value={collectBarcode}
                onChange={(e) => setCollectBarcode(e.target.value)}
                required
              />
              <Input
                label="Required Tube Cap *"
                value={collectTubeColor}
                onChange={(e) => setCollectTubeColor(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Select
                label="Assign Performing Staff Nurse *"
                value={selectedCollectorNurseId}
                onChange={(e) => handleSelectCollectorNurse(e.target.value)}
                required
              >
                {hospitalNurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name} — {nurse.department} ({nurse.shift}) [{nurse.id}]
                  </option>
                ))}
                <option value="NUR-CUSTOM">Other / Custom Nurse Name</option>
              </Select>
              {selectedCollectorNurseId === 'NUR-CUSTOM' && (
                <Input
                  label="Enter Nurse Full Name & Staff ID *"
                  value={nurseCollectorName}
                  onChange={(e) => setNurseCollectorName(e.target.value)}
                  placeholder="e.g. Sister Anita Mathew (ICU Staff Nurse)"
                  required
                />
              )}
            </div>

            <Textarea
              label="Preparation & Phlebotomy Notes"
              value={patientPrepNotes}
              onChange={(e) => setPatientPrepNotes(e.target.value)}
              placeholder="Patient preparation verification and venipuncture notes..."
              rows={2}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCollectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold" leftIcon={<Syringe className="w-4 h-4" />}>
                Confirm Preparation & Collect Sample
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: Nurse Follow-Up & Directive Execution */}
      <Modal
        isOpen={isExecModalOpen}
        onClose={() => setIsExecModalOpen(false)}
        title="Nurse Follow-Up & Directive Execution"
        subtitle={`Order ${selectedOrder?.id} — ${selectedOrder?.patientName}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmExecution} className="space-y-4">
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-purple-950 text-sm">
                <Stethoscope className="w-4 h-4 text-purple-700" />
                Attending Physician Clinical Directives
              </div>
              <p className="text-purple-900 font-semibold text-xs bg-white/80 p-2.5 rounded-lg border border-purple-100">
                "{selectedOrder.doctorInstructions || 'Follow routine post-diagnostic bedside protocol.'}"
              </p>
              <p className="text-[10px] text-purple-700">
                Ordered by Dr. {selectedOrder.reviewedByDoctorName || selectedOrder.doctorName} on {selectedOrder.doctorReviewDate || 'Today'}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nurseExecutionConfirmed}
                  onChange={(e) => setNurseExecutionConfirmed(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  required
                />
                <div>
                  <span className="text-xs font-bold text-emerald-950">Directives Executed & Patient Care Rendered *</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    I confirm that the physician's instructions have been administered at the bedside, vital signs monitored, and recorded in patient chart.
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <Select
                label="Executing Staff Nurse (On Duty) *"
                value={selectedExecNurseId}
                onChange={(e) => handleSelectExecNurse(e.target.value)}
                required
              >
                {hospitalNurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name} — {nurse.department} ({nurse.shift}) [{nurse.id}]
                  </option>
                ))}
                <option value="NUR-CUSTOM">Other / Custom Nurse Name</option>
              </Select>
              {selectedExecNurseId === 'NUR-CUSTOM' && (
                <Input
                  label="Enter Nurse Full Name & Staff ID *"
                  value={executingNurseName}
                  onChange={(e) => setExecutingNurseName(e.target.value)}
                  placeholder="e.g. Sister Anita Mathew (ICU Staff Nurse)"
                  required
                />
              )}
            </div>

            <Textarea
              label="Nursing Bedside Notes & Clinical Response *"
              value={nurseExecutionNotes}
              onChange={(e) => setNurseExecutionNotes(e.target.value)}
              placeholder="e.g. Administered prescribed medication. Patient vitals stable (BP 124/82, HR 74). Resting comfortably."
              rows={3}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsExecModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" leftIcon={<CheckSquare className="w-4 h-4" />}>
                Complete Action & Close Lifecycle
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: Printable Diagnostic Report */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Official Diagnostic Laboratory Report"
        subtitle={`NABL Accredited Clinical Pathology & Molecular Diagnostic Services`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div id="printable-nurse-lab-report" className="p-6 bg-white border border-slate-300 rounded-xl text-slate-900 space-y-4 font-sans shadow-sm">
              <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-indigo-950 uppercase tracking-tight">
                    {currentHospital?.name || 'Apex City Medical Center & Research Institute'}
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-600">
                    Department of Laboratory Medicine & Molecular Pathology
                  </p>
                  <p className="text-[10px] text-slate-500">
                    NABL Accredited • ISO 15189:2012 Certified Laboratory
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-300">
                    {selectedOrder.barcodeNumber || selectedOrder.id}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Report ID: REP-{selectedOrder.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Patient Name</span>
                  <p className="font-bold text-slate-900">{selectedOrder.patientName}</p>
                  <p className="text-[10px] text-slate-500">{selectedOrder.patientAge} Yrs / {selectedOrder.patientGender}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Patient ID / MRN</span>
                  <p className="font-mono font-semibold text-slate-800">{selectedOrder.patientId}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Referring Physician</span>
                  <p className="font-semibold text-slate-800">{selectedOrder.doctorName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Specimen / Tube</span>
                  <p className="text-[11px] text-slate-700">{selectedOrder.sampleType} • {selectedOrder.tubeColor}</p>
                </div>
              </div>

              <div className="bg-indigo-50 text-indigo-900 px-3 py-1.5 rounded font-bold text-xs flex justify-between items-center">
                <span>INVESTIGATION: {selectedOrder.testName.toUpperCase()}</span>
                <span className="text-[11px] font-normal">Method: Automated Spectrophotometry / Flow Cytometry</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-2 px-1">Test Parameter</th>
                      <th className="py-2 px-1">Observed Value</th>
                      <th className="py-2 px-1">Flag</th>
                      <th className="py-2 px-1">Unit</th>
                      <th className="py-2 px-1">Biological Reference Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOrder.resultItems && selectedOrder.resultItems.length > 0 ? (
                      selectedOrder.resultItems.map((item) => (
                        <tr key={item.parameterId} className={item.isCritical ? 'bg-rose-50/60 font-semibold' : ''}>
                          <td className="py-2 px-1 font-medium text-slate-900">{item.parameterName}</td>
                          <td className="py-2 px-1 font-bold text-slate-900">{item.value || '—'}</td>
                          <td className="py-2 px-1">
                            {item.isCritical ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold">CRITICAL</span>
                            ) : item.isAbnormal ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold">ABNORMAL</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Normal</span>
                            )}
                          </td>
                          <td className="py-2 px-1 font-mono text-slate-600">{item.unit}</td>
                          <td className="py-2 px-1 font-mono text-slate-600">{item.referenceRange}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2 px-1 font-medium text-slate-900">{selectedOrder.testName}</td>
                        <td className="py-2 px-1 font-bold text-slate-900">{selectedOrder.resultValue}</td>
                        <td className="py-2 px-1">
                          {selectedOrder.resultStatus === 'Critical' ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold">CRITICAL</span>
                          ) : selectedOrder.resultStatus === 'Abnormal' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold">ABNORMAL</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Normal</span>
                          )}
                        </td>
                        <td className="py-2 px-1 font-mono text-slate-600">—</td>
                        <td className="py-2 px-1 font-mono text-slate-600">{selectedOrder.referenceRange || 'Standard Limits'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Directives & Bedside Execution Trail */}
              {(selectedOrder.doctorInstructions || selectedOrder.nurseActionStatus) && (
                <div className="pt-3 border-t-2 border-dashed border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-[11px]">
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                      Attending Physician Directives
                    </div>
                    <p className="text-slate-800 font-medium bg-white p-2 rounded border border-indigo-100 text-[11px]">
                      {selectedOrder.doctorInstructions}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Dr. {selectedOrder.reviewedByDoctorName || selectedOrder.doctorName} ({selectedOrder.doctorReviewDate || 'Recorded'})
                    </p>
                  </div>
                  {selectedOrder.nurseExecutionNotes && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px]">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Nursing Bedside Care Execution
                      </div>
                      <p className="text-slate-800 font-medium bg-white p-2 rounded border border-emerald-100 text-[11px]">
                        {selectedOrder.nurseExecutionNotes}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Administered by: {selectedOrder.executedByNurseName} {selectedOrder.executedByNurseId ? `(Staff ID: ${selectedOrder.executedByNurseId})` : ''} ({selectedOrder.nurseExecutionDate || 'Recorded'})
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Fee: ₹{selectedOrder.fee || 0} • Current Status: {selectedOrder.status}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: Nurse Inpatient Vitals & Condition Update to Specialist */}
      <Modal
        isOpen={isNurseVitalsModalOpen}
        onClose={() => setIsNurseVitalsModalOpen(false)}
        title="Bedside Monitoring: Log Vitals & Update Specialist"
        subtitle={`Patient: ${selectedAdmissionForVitals?.patientName} • Bed: ${selectedAdmissionForVitals?.bedNumber} • Attending: Dr. ${selectedAdmissionForVitals?.doctorName}`}
        maxWidth="md"
      >
        {selectedAdmissionForVitals && (
          <form onSubmit={handleSaveNurseVitals} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{selectedAdmissionForVitals.patientName}</span>
                <p className="text-[11px] text-slate-500 font-mono">ID: {selectedAdmissionForVitals.patientId} • {selectedAdmissionForVitals.wardType}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                Bed {selectedAdmissionForVitals.bedNumber}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/80">
              <label className="block text-[11px] font-bold text-teal-900 mb-1">
                Reporting Nurse / Duty Nurse Signature *
              </label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-200/80 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                  👩‍⚕️
                </div>
                <Input
                  value={nurseVitalsForm.nurseName}
                  onChange={(e) => setNurseVitalsForm({ ...nurseVitalsForm, nurseName: e.target.value })}
                  placeholder="e.g. Staff Nurse Clara Vance"
                  required
                  className="text-xs bg-white font-medium"
                />
              </div>
              <p className="text-[10px] text-teal-700 mt-1">
                Your name will be visible to Dr. <strong>{selectedAdmissionForVitals.doctorName}</strong> on their Inpatients care dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Pressure</label>
                <Input
                  value={nurseVitalsForm.bloodPressure}
                  onChange={(e) => setNurseVitalsForm({ ...nurseVitalsForm, bloodPressure: e.target.value })}
                  placeholder="120/80"
                  required
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pulse (bpm)</label>
                <Input
                  value={nurseVitalsForm.heartRate}
                  onChange={(e) => setNurseVitalsForm({ ...nurseVitalsForm, heartRate: e.target.value })}
                  placeholder="76"
                  type="number"
                  required
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temperature (°F)</label>
                <Input
                  value={nurseVitalsForm.temperature}
                  onChange={(e) => setNurseVitalsForm({ ...nurseVitalsForm, temperature: e.target.value })}
                  placeholder="98.6"
                  type="number"
                  step="0.1"
                  required
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2 (%)</label>
                <Input
                  value={nurseVitalsForm.oxygenLevel}
                  onChange={(e) => setNurseVitalsForm({ ...nurseVitalsForm, oxygenLevel: e.target.value })}
                  placeholder="99"
                  type="number"
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Patient Clinical Condition & Recovery Status *
              </label>
              <select
                value={nurseVitalsForm.nurseCondition}
                onChange={(e) => setNurseVitalsForm({ ...nurseVitalsForm, nurseCondition: e.target.value as NurseConditionStatus })}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Stable & Improving">Stable & Improving (Patient recovering well)</option>
                <option value="Ready for Discharge Review">Ready for Discharge Review (Vitals normal, fit for doctor discharge evaluation)</option>
                <option value="Observation Continues">Observation Continues (Needs continued medication/fluids)</option>
                <option value="Critical / High Attention">Critical / High Attention (Requires immediate doctor visit)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Clinical Observation Notes for Attending Doctor *
              </label>
              <Textarea
                rows={3}
                value={nurseVitalsForm.nurseNotes}
                onChange={(e) => setNurseVitalsForm({ ...nurseVitalsForm, nurseNotes: e.target.value })}
                placeholder="e.g. Patient afebrile for 24h, oral diet tolerated, surgical incision clean, pain score 1/10. Ready for specialist discharge assessment."
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs">
              💡 <strong>Hospital Flow:</strong> Submitting this observation sends this report directly to Dr. <strong>{selectedAdmissionForVitals.doctorName}</strong>. The specialist uses this update to initiate the official medical discharge.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNurseVitalsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<HeartPulse className="w-4 h-4" />}>
                Submit Clinical Update to Specialist
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 5: Nurse Final Discharge & Bed Release */}
      <Modal
        isOpen={isFinalDischargeModalOpen}
        onClose={() => setIsFinalDischargeModalOpen(false)}
        title="Complete Patient Discharge & Release Bed"
        subtitle={`Patient: ${selectedAdmissionForDischarge?.patientName} • Bed: ${selectedAdmissionForDischarge?.bedNumber}`}
        maxWidth="md"
      >
        {selectedAdmissionForDischarge && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                All Discharge Prerequisite Checks Passed
              </div>
              <ul className="space-y-1 text-emerald-800 text-[11px]">
                <li>• 🩺 Doctor Medical Discharge: Signed by Dr. {selectedAdmissionForDischarge.doctorName}</li>
                <li>• 📋 Discharge Summary: {selectedAdmissionForDischarge.dischargeSummary || 'Clinical recovery achieved'}</li>
                <li>• 💳 Inpatient Billing: Paid & Cleared (Invoice: {selectedAdmissionForDischarge.invoiceId || 'Settled'})</li>
              </ul>
            </div>

            <p className="text-slate-600">
              Confirming final discharge will remove cannula/lines, deliver discharge medication advice to the family, and reset <strong>Bed {selectedAdmissionForDischarge.bedNumber}</strong> to <strong>Available</strong> for new inpatient intakes.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsFinalDischargeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmFinalDischarge}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Confirm Final Discharge & Release Bed
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
