import React, { useState } from 'react';
import {
  BedDouble,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Stethoscope,
  Building2,
  Calendar,
  LogOut,
  Download,
  Layers,
  Activity,
  Edit2,
  Trash2,
  Filter,
  UserPlus,
  History,
  FileText,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Admission, Bed, Ward, WardType, BedStatus } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';

type MainTab = 'overview' | 'wards_beds' | 'admit' | 'history';

export const AdmissionsManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [activeTab, setActiveTab] = useState<MainTab>('overview');

  // State collections
  const [wards, setWards] = useState<Ward[]>(() => MockStorage.getWards(hospId));
  const [beds, setBeds] = useState<Bed[]>(() => MockStorage.getBeds(hospId));
  const [admissions, setAdmissions] = useState<Admission[]>(() => MockStorage.getAdmissions(hospId));

  const patients = MockStorage.getPatients(hospId);
  const doctors = MockStorage.getDoctors(hospId);
  const departments = MockStorage.getDepartments(hospId);

  // Subscription Plan Enforcement
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const currentPlan = MockStorage.getPlanByTier(currentHospital?.planTier || 'trial');
  const maxBedsLimit = currentPlan.maxBeds || 20;
  const isBedLimitReached = beds.length >= maxBedsLimit;

  // Filters & Searches
  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [historyTab, setHistoryTab] = useState<'active' | 'discharged' | 'all'>('active');

  // Modal States
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [wardFormData, setWardFormData] = useState({
    name: '',
    wardType: 'General Ward' as WardType,
    floor: '2nd Floor',
    departmentName: departments[0]?.name || 'General Medicine',
    description: '',
    dailyRate: 150,
  });

  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [bedFormData, setBedFormData] = useState({
    wardId: wards[0]?.id || '',
    bedNumber: '',
    wardType: 'General Ward' as WardType,
    floor: '2nd Floor',
    status: 'Available' as BedStatus,
    dailyRate: 150,
    notes: '',
  });

  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitSelectedWardId, setAdmitSelectedWardId] = useState<string>('');
  const [admitFormData, setAdmitFormData] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    wardId: '',
    bedNumber: '',
    wardType: 'General Ward' as WardType,
    admissionType: 'Emergency' as Admission['admissionType'],
    reason: '',
    notes: '',
    initialDeposit: 1000,
  });

  // Discharge & Delete Confirmations
  const [dischargeConfirmId, setDischargeConfirmId] = useState<string | null>(null);
  const [deleteWardConfirmId, setDeleteWardConfirmId] = useState<string | null>(null);
  const [deleteBedConfirmId, setDeleteBedConfirmId] = useState<string | null>(null);

  const refreshData = () => {
    setWards(MockStorage.getWards(hospId));
    setBeds(MockStorage.getBeds(hospId));
    setAdmissions(MockStorage.getAdmissions(hospId));
  };

  // Helper Metrics
  const activeAdmissions = admissions.filter((a) => a.status === 'Active');
  const dischargedAdmissions = admissions.filter((a) => a.status === 'Discharged');

  const availableBeds = beds.filter((b) => b.status === 'Available');
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied');
  const maintenanceBeds = beds.filter((b) => b.status === 'Maintenance');
  const reservedBeds = beds.filter((b) => b.status === 'Reserved');

  const totalCapacity = beds.length;
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds.length / totalCapacity) * 100) : 0;

  // Wards & Beds handlers with Subscription Limits
  const handleOpenCreateWard = () => {
    setEditingWard(null);
    setWardFormData({
      name: '',
      wardType: 'General Ward',
      floor: '2nd Floor',
      departmentName: departments[0]?.name || 'General Medicine',
      description: '',
      dailyRate: 150,
    });
    setIsWardModalOpen(true);
  };

  const handleOpenEditWard = (ward: Ward) => {
    setEditingWard(ward);
    setWardFormData({
      name: ward.name,
      wardType: ward.wardType,
      floor: ward.floor,
      departmentName: ward.departmentName,
      description: ward.description || '',
      dailyRate: ward.dailyRate,
    });
    setIsWardModalOpen(true);
  };

  const handleSaveWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardFormData.name.trim()) {
      showToast('Validation Error', 'Please enter a valid Ward name.', 'error');
      return;
    }

    const newWard: Ward = {
      id: editingWard ? editingWard.id : `WARD-00${wards.length + 1}`,
      hospitalId: hospId,
      name: wardFormData.name,
      wardType: wardFormData.wardType,
      floor: wardFormData.floor,
      departmentName: wardFormData.departmentName,
      description: wardFormData.description,
      dailyRate: Number(wardFormData.dailyRate),
    };

    MockStorage.saveWard(newWard);
    showToast(
      editingWard ? 'Ward Updated' : 'Ward Created',
      `Ward "${newWard.name}" (${newWard.floor} - ${newWard.departmentName}) successfully saved.`
    );
    setIsWardModalOpen(false);
    refreshData();
  };

  const handleDeleteWardConfirm = () => {
    if (deleteWardConfirmId) {
      const wardBeds = beds.filter((b) => b.wardId === deleteWardConfirmId);
      const occupiedInWard = wardBeds.some((b) => b.status === 'Occupied');

      if (occupiedInWard) {
        showToast('Action Blocked', 'Cannot delete a ward with active occupied beds. Discharge or relocate patients first.', 'error');
        setDeleteWardConfirmId(null);
        return;
      }

      MockStorage.deleteWard(deleteWardConfirmId);
      showToast('Ward Deleted', 'The ward and unallocated beds have been removed.');
      setDeleteWardConfirmId(null);
      refreshData();
    }
  };

  const handleOpenAddBed = (targetWardId?: string) => {
    // ENFORCE SUBSCRIPTION LIMIT ACROSS ALL COMBINED WARDS
    if (beds.length >= maxBedsLimit) {
      showToast(
        'Subscription Capacity Limit Reached',
        `All wards combined cannot exceed your ${currentPlan.name} plan maximum limit of ${maxBedsLimit} beds (${beds.length}/${maxBedsLimit} used across all wards). Upgrade plan to expand capacity.`,
        'error'
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    setEditingBed(null);
    const selectedW = wards.find((w) => w.id === targetWardId) || wards[0];
    const existingInWard = beds.filter((b) => b.wardId === selectedW?.id);
    const defaultNumber = selectedW
      ? `Bed-${selectedW.name.slice(0, 3).toUpperCase()}-${String(existingInWard.length + 1).padStart(2, '0')}`
      : `Bed-01`;

    setBedFormData({
      wardId: selectedW?.id || '',
      bedNumber: defaultNumber,
      wardType: selectedW?.wardType || 'General Ward',
      floor: selectedW?.floor || '1st Floor',
      status: 'Available',
      dailyRate: selectedW?.dailyRate || 150,
      notes: '',
    });
    setIsBedModalOpen(true);
  };

  const handleOpenEditBed = (bed: Bed) => {
    setEditingBed(bed);
    setBedFormData({
      wardId: bed.wardId || '',
      bedNumber: bed.bedNumber,
      wardType: bed.wardType,
      floor: bed.floor,
      status: bed.status,
      dailyRate: bed.dailyRate,
      notes: bed.notes || '',
    });
    setIsBedModalOpen(true);
  };

  const handleSaveBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedFormData.bedNumber.trim()) {
      showToast('Validation Error', 'Please enter a bed number/code.', 'error');
      return;
    }

    // ENFORCE SUBSCRIPTION LIMIT FOR NEW BEDS ACROSS ALL COMBINED WARDS
    if (!editingBed && beds.length >= maxBedsLimit) {
      showToast(
        'Subscription Capacity Exceeded',
        `All wards combined cannot exceed your ${currentPlan.name} plan maximum capacity of ${maxBedsLimit} beds (${beds.length}/${maxBedsLimit} used). Upgrade your subscription plan.`,
        'error'
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    const linkedWard = wards.find((w) => w.id === bedFormData.wardId);

    const newBed: Bed = {
      id: editingBed ? editingBed.id : `BED-${100 + beds.length + 1}`,
      hospitalId: hospId,
      wardId: linkedWard?.id || bedFormData.wardId,
      wardName: linkedWard?.name || 'General Ward',
      bedNumber: bedFormData.bedNumber,
      wardType: linkedWard?.wardType || bedFormData.wardType,
      floor: linkedWard?.floor || bedFormData.floor,
      status: bedFormData.status,
      currentPatientId: editingBed?.currentPatientId,
      currentPatientName: editingBed?.currentPatientName,
      dailyRate: Number(bedFormData.dailyRate),
      notes: bedFormData.notes,
    };

    const res = MockStorage.saveBed(newBed);
    if (!res.success) {
      showToast('Subscription Limit Reached', res.message || 'Capacity limit exceeded', 'error');
      setIsUpgradeModalOpen(true);
      return;
    }

    showToast(
      editingBed ? 'Bed Updated' : 'Bed Created',
      `Bed "${newBed.bedNumber}" in ${newBed.wardName} saved.`
    );
    setIsBedModalOpen(false);
    refreshData();
  };

  const handleDeleteBedConfirm = () => {
    if (deleteBedConfirmId) {
      const targetBed = beds.find((b) => b.id === deleteBedConfirmId);
      if (targetBed?.status === 'Occupied') {
        showToast('Action Blocked', 'Cannot delete an occupied bed.', 'error');
        setDeleteBedConfirmId(null);
        return;
      }
      MockStorage.deleteBed(deleteBedConfirmId);
      showToast('Bed Deleted', 'Bed successfully removed from inventory.');
      setDeleteBedConfirmId(null);
      refreshData();
    }
  };

  const handleQuickStatusChange = (bedId: string, newStatus: BedStatus) => {
    MockStorage.updateBedStatus(bedId, newStatus);
    showToast('Bed Status Updated', `Status changed to ${newStatus}.`);
    refreshData();
  };

  // Admission Workflow Handlers
  const handleOpenAdmitModal = (preselectWardId?: string) => {
    const selectedW = wards.find((w) => w.id === preselectWardId) || wards[0];
    setAdmitSelectedWardId(selectedW?.id || '');

    const wardAvailBeds = beds.filter(
      (b) => b.status === 'Available' && (!selectedW?.id || b.wardId === selectedW.id || b.wardType === selectedW.wardType)
    );
    const firstFree = wardAvailBeds[0] || availableBeds[0];

    setAdmitFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      wardId: selectedW?.id || firstFree?.wardId || '',
      bedNumber: firstFree?.bedNumber || '',
      wardType: selectedW?.wardType || firstFree?.wardType || 'General Ward',
      admissionType: 'Emergency',
      reason: 'Acute Medical Inpatient Observation & Telemetry',
      notes: '',
      initialDeposit: firstFree ? firstFree.dailyRate * 3 : 1000,
    });

    setIsAdmitModalOpen(true);
  };

  const handleWardChangeInAdmit = (wId: string) => {
    setAdmitSelectedWardId(wId);
    const selectedW = wards.find((w) => w.id === wId);
    const wardAvailBeds = beds.filter(
      (b) => b.status === 'Available' && (b.wardId === wId || (selectedW && b.wardType === selectedW.wardType))
    );
    const firstFree = wardAvailBeds[0];

    setAdmitFormData((prev) => ({
      ...prev,
      wardId: wId,
      bedNumber: firstFree?.bedNumber || '',
      wardType: selectedW?.wardType || prev.wardType,
      initialDeposit: firstFree ? firstFree.dailyRate * 3 : prev.initialDeposit,
    }));
  };

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === admitFormData.patientId);
    const doc = doctors.find((d) => d.id === admitFormData.doctorId);
    const chosenBed = beds.find((b) => b.bedNumber === admitFormData.bedNumber);

    if (!pat || !doc) {
      showToast('Validation Error', 'Please select a valid patient and attending physician.', 'error');
      return;
    }

    if (!admitFormData.bedNumber || chosenBed?.status !== 'Available') {
      showToast('Bed Selection Error', 'Please select an available bed for admission.', 'error');
      return;
    }

    const newAdmission: Admission = {
      id: `ADM-50${10 + admissions.length}`,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      doctorId: doc.id,
      doctorName: doc.name,
      departmentName: doc.departmentName,
      wardType: chosenBed?.wardType || admitFormData.wardType,
      bedNumber: admitFormData.bedNumber,
      admissionDate: new Date().toISOString().split('T')[0],
      admissionType: admitFormData.admissionType,
      reason: admitFormData.reason,
      notes: admitFormData.notes,
      status: 'Active',
      initialDeposit: Number(admitFormData.initialDeposit),
    };

    MockStorage.saveAdmission(newAdmission);

    // Update patient status to Inpatient
    pat.status = 'Inpatient';
    pat.roomBedNumber = admitFormData.bedNumber;
    MockStorage.savePatient(pat);

    showToast(
      'Patient Admitted Successfully',
      `${pat.name} admitted to ${admitFormData.bedNumber} in ${chosenBed?.wardName || admitFormData.wardType}. Bed automatically set to Occupied.`
    );
    setIsAdmitModalOpen(false);
    refreshData();
    setActiveTab('history');
  };

  const handleDischargeConfirm = () => {
    if (dischargeConfirmId) {
      const adm = admissions.find((a) => a.id === dischargeConfirmId);
      MockStorage.dischargeAdmission(dischargeConfirmId);

      // Update patient status to Discharged
      if (adm) {
        const pat = patients.find((p) => p.id === adm.patientId);
        if (pat) {
          pat.status = 'Discharged';
          pat.roomBedNumber = undefined;
          MockStorage.savePatient(pat);
        }
      }

      showToast(
        'Patient Discharged',
        `Admission released. Bed ${adm?.bedNumber || ''} is now Available.`
      );
      setDischargeConfirmId(null);
      refreshData();
    }
  };

  // Filtered lists for rendering
  const filteredBeds = beds.filter((b) => {
    const matchesSearch =
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.wardName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.currentPatientName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWard = wardFilter === 'all' || b.wardId === wardFilter || b.wardType === wardFilter;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesWard && matchesStatus;
  });

  const filteredAdmissions = admissions.filter((a) => {
    const matchesTab =
      historyTab === 'all'
        ? true
        : historyTab === 'active'
        ? a.status === 'Active'
        : a.status === 'Discharged';
    const matchesSearch =
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <PageHeader
        title="Admissions & Bed Management"
        subtitle="Hospital Admin controls physical ward capacity, bed inventory, inpatient intake, and discharge workflows."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Admissions & Beds' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Hospital_Admissions_Roster', admissions)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreateWard}
              leftIcon={<Building2 className="w-3.5 h-3.5 text-indigo-600" />}
            >
              + Create Ward
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAdmitModal()}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Admit Inpatient
            </Button>
          </div>
        }
      />

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('wards_beds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'wards_beds'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Wards & Beds ({wards.length} Wards • {beds.length}/{maxBedsLimit} Beds)
        </button>
        <button
          onClick={() => {
            setActiveTab('admit');
            handleOpenAdmitModal();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'admit'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Admit Inpatient
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Admissions History ({activeAdmissions.length} Active)
        </button>
      </div>

      {/* Subscription Capacity Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          isBedLimitReached
            ? 'bg-amber-500/10 border-amber-300 text-amber-950'
            : 'bg-indigo-50/60 border-indigo-100 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isBedLimitReached ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Subscription Plan Capacity: {currentPlan.name}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isBedLimitReached
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {beds.length} / {maxBedsLimit} Beds Max Allowed
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isBedLimitReached
                ? `Hospital bed capacity limit reached (${beds.length} of ${maxBedsLimit} beds created). Upgrade your subscription tier to unlock additional bed slots.`
                : `Your subscription tier allows up to ${maxBedsLimit} beds. Currently ${maxBedsLimit - beds.length} bed slots remaining.`}
            </p>
          </div>
        </div>
        <Button
          variant={isBedLimitReached ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setIsUpgradeModalOpen(true)}
          leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
          className="shrink-0"
        >
          Upgrade Capacity Plan
        </Button>
      </div>

      {/* KPI Overview Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hospital Wards</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{wards.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Configured Units</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Bed Capacity</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900">{totalCapacity}</span>
            <span className="text-xs font-semibold text-slate-400">/ {maxBedsLimit} Max</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{currentPlan.name} Plan</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Available Free</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{availableBeds.length}</p>
          <p className="text-[10px] text-emerald-600/80 mt-0.5">Ready for Intake</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Occupied (IPD)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-600">{occupiedBeds.length}</span>
            <span className="text-xs font-semibold text-indigo-500">({occupancyRate}%)</span>
          </div>
          <p className="text-[10px] text-indigo-400 mt-0.5">Current Inpatients</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Maintenance & Rest</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{maintenanceBeds.length + reservedBeds.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Out of Service</p>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Ward Telemetry Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {wards.map((ward) => {
              const wardBeds = beds.filter((b) => b.wardId === ward.id || b.wardType === ward.wardType);
              const wOcc = wardBeds.filter((b) => b.status === 'Occupied').length;
              const wAvail = wardBeds.filter((b) => b.status === 'Available').length;
              const pct = wardBeds.length > 0 ? Math.round((wOcc / wardBeds.length) * 100) : 0;

              return (
                <div
                  key={ward.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {ward.floor}
                      </span>
                      <span className="text-xs font-medium text-slate-500">${ward.dailyRate}/day</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{ward.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{ward.departmentName}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600">{wOcc} / {wardBeds.length} Beds Occupied</span>
                      <span className="font-bold text-indigo-600">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-indigo-600' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-emerald-700 font-medium">{wAvail} Free Beds</span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenAdmitModal(ward.id)}
                      disabled={wAvail === 0}
                    >
                      Admit to Ward
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Visual Floor Plan / Matrix */}
          <Card>
            <CardHeader
              title="Hospital Ward Bed Telemetry (Visual Matrix)"
              subtitle="Real-time physical status of all registered beds across hospital wards"
              action={
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available ({availableBeds.length})
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Occupied ({occupiedBeds.length})
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Maintenance ({maintenanceBeds.length})
                  </span>
                </div>
              }
            />
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {beds.map((bed) => {
                const isOcc = bed.status === 'Occupied';
                const isAvail = bed.status === 'Available';
                const isMaint = bed.status === 'Maintenance';

                return (
                  <div
                    key={bed.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                      isAvail
                        ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 hover:bg-emerald-50'
                        : isOcc
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 hover:bg-indigo-50'
                        : 'bg-rose-50/40 border-rose-200 text-rose-950 hover:bg-rose-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{bed.bedNumber}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isAvail ? 'bg-emerald-500' : isOcc ? 'bg-indigo-600' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {bed.wardName || bed.wardType}
                    </p>
                    {isOcc ? (
                      <p className="text-[11px] font-bold text-indigo-900 truncate">
                        👤 {bed.currentPatientName || 'Inpatient'}
                      </p>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">${bed.dailyRate}/day</span>
                        <button
                          onClick={() => handleQuickStatusChange(bed.id, isAvail ? 'Maintenance' : 'Available')}
                          className="text-[10px] underline text-slate-500 hover:text-slate-800"
                        >
                          {isAvail ? 'Set Maint' : 'Set Free'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: WARDS & BEDS MANAGEMENT */}
      {activeTab === 'wards_beds' && (
        <div className="space-y-6">
          {/* Section 1: Wards Management */}
          <Card>
            <CardHeader
              title="Hospital Wards Directory"
              subtitle="Hospital Admin configures physical floor wards, clinical departments, base daily rates, and ward capacity."
              action={
                <Button variant="primary" size="sm" onClick={handleOpenCreateWard} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Create New Ward
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Ward Name & Category</th>
                    <th className="px-4 py-3.5">Floor & Department</th>
                    <th className="px-4 py-3.5">Beds & Occupancy</th>
                    <th className="px-4 py-3.5">Daily Rate</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wards.map((ward) => {
                    const wardBeds = beds.filter((b) => b.wardId === ward.id || b.wardType === ward.wardType);
                    const occupiedCount = wardBeds.filter((b) => b.status === 'Occupied').length;
                    const freeCount = wardBeds.filter((b) => b.status === 'Available').length;

                    return (
                      <tr key={ward.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900 text-xs">{ward.name}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {ward.wardType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{ward.floor}</p>
                          <p className="text-[10px] text-slate-500">{ward.departmentName}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{wardBeds.length} Total Beds</span>
                            <span className="text-[10px] font-medium text-emerald-600">({freeCount} Available)</span>
                          </div>
                          <p className="text-[10px] text-indigo-600 font-medium">{occupiedCount} Occupied</p>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          ${ward.dailyRate} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenAddBed(ward.id)}
                              leftIcon={<Plus className="w-3 h-3" />}
                            >
                              Add Bed
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleOpenEditWard(ward)}
                              leftIcon={<Edit2 className="w-3 h-3 text-slate-600" />}
                            />
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => setDeleteWardConfirmId(ward.id)}
                              leftIcon={<Trash2 className="w-3 h-3" />}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 2: Beds Inventory & Status Control */}
          <Card>
            <CardHeader
              title="Bed Inventory & Capacity Management"
              subtitle={`Manage physical beds (Allocated: ${beds.length} / ${maxBedsLimit} Max Beds on ${currentPlan.name} Plan).`}
              action={
                <Button
                  variant={isBedLimitReached ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleOpenAddBed()}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  + Add New Bed
                </Button>
              }
            />

            {/* Filter controls */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search bed code, ward, or patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="text-xs"
                >
                  <option value="all">All Wards</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.floor})
                    </option>
                  ))}
                </Select>

                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Reserved">Reserved</option>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Bed Code</th>
                    <th className="px-4 py-3.5">Assigned Ward & Floor</th>
                    <th className="px-4 py-3.5">Daily Rate</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Current Occupant</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBeds.map((bed) => (
                    <tr key={bed.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{bed.bedNumber}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{bed.wardName || bed.wardType}</p>
                        <p className="text-[10px] text-slate-500">{bed.floor}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">${bed.dailyRate}/day</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={bed.status}
                          disabled={bed.status === 'Occupied'}
                          onChange={(e) => handleQuickStatusChange(bed.id, e.target.value as BedStatus)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200 outline-none ${
                            bed.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : bed.status === 'Occupied'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <option value="Available">Available</option>
                          <option value="Occupied" disabled>
                            Occupied (Via Admission)
                          </option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Reserved">Reserved</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {bed.status === 'Occupied' ? (
                          <div>
                            <p className="font-bold text-indigo-900">{bed.currentPatientName}</p>
                            <p className="text-[10px] text-indigo-600 font-mono">{bed.currentPatientId}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unoccupied</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenEditBed(bed)}
                            leftIcon={<Edit2 className="w-3 h-3 text-slate-600" />}
                          />
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-rose-600 hover:bg-rose-50"
                            disabled={bed.status === 'Occupied'}
                            onClick={() => setDeleteBedConfirmId(bed.id)}
                            leftIcon={<Trash2 className="w-3 h-3" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: ADMIT INPATIENT FORM */}
      {activeTab === 'admit' && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader
            title="Admit Inpatient Patient Workflow"
            subtitle="Select patient, target ward, available bed, and attending physician to issue bed allocation."
          />
          <div className="p-6">
            <form onSubmit={handleAdmitSubmit} className="space-y-4">
              <Select
                label="Step 1: Select Patient *"
                value={admitFormData.patientId}
                onChange={(e) => setAdmitFormData({ ...admitFormData, patientId: e.target.value })}
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — Status: {p.status}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Step 2: Select Ward *"
                  value={admitSelectedWardId}
                  onChange={(e) => handleWardChangeInAdmit(e.target.value)}
                  required
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.floor} — Base ${w.dailyRate}/day)
                    </option>
                  ))}
                </Select>

                <Select
                  label="Step 3: Select Available Bed *"
                  value={admitFormData.bedNumber}
                  onChange={(e) => {
                    const b = beds.find((bed) => bed.bedNumber === e.target.value);
                    setAdmitFormData({
                      ...admitFormData,
                      bedNumber: e.target.value,
                      wardType: b?.wardType || admitFormData.wardType,
                      initialDeposit: b ? b.dailyRate * 3 : admitFormData.initialDeposit,
                    });
                  }}
                  required
                >
                  <option value="">-- Choose Available Bed --</option>
                  {beds
                    .filter(
                      (b) =>
                        b.status === 'Available' &&
                        (!admitSelectedWardId || b.wardId === admitSelectedWardId)
                    )
                    .map((b) => (
                      <option key={b.id} value={b.bedNumber}>
                        {b.bedNumber} ({b.wardName || b.wardType} — ${b.dailyRate}/day)
                      </option>
                    ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Attending Physician / Specialist *"
                  value={admitFormData.doctorId}
                  onChange={(e) => setAdmitFormData({ ...admitFormData, doctorId: e.target.value })}
                  required
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Admission Intake Category"
                  value={admitFormData.admissionType}
                  onChange={(e) =>
                    setAdmitFormData({ ...admitFormData, admissionType: e.target.value as any })
                  }
                >
                  <option value="Emergency">Emergency Intake</option>
                  <option value="Elective">Elective / Scheduled Surgery</option>
                  <option value="Transfer">Transfer from External Facility</option>
                  <option value="Maternity">Maternity & Delivery</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Initial Deposit Amount ($)"
                  type="number"
                  value={admitFormData.initialDeposit}
                  onChange={(e) =>
                    setAdmitFormData({ ...admitFormData, initialDeposit: Number(e.target.value) })
                  }
                  placeholder="1000"
                />
                <Input
                  label="Diagnosis / Admission Reason *"
                  value={admitFormData.reason}
                  onChange={(e) => setAdmitFormData({ ...admitFormData, reason: e.target.value })}
                  placeholder="e.g. Acute Coronary Syndrome observation"
                  required
                />
              </div>

              <Textarea
                label="Clinical Care Instructions & Initial Notes"
                rows={3}
                value={admitFormData.notes}
                onChange={(e) => setAdmitFormData({ ...admitFormData, notes: e.target.value })}
                placeholder="Enter nursing notes, dietary orders, or emergency precautions..."
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('overview')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                  Confirm Inpatient Admission & Occupy Bed
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* TAB 4: ADMISSIONS HISTORY & ACTIVE ROSTER */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader
            title="Inpatient Admissions Log & Roster"
            subtitle="Track current active inpatient stays and historical patient discharges."
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant={historyTab === 'active' ? 'primary' : 'outline'}
                  size="xs"
                  onClick={() => setHistoryTab('active')}
                >
                  Active ({activeAdmissions.length})
                </Button>
                <Button
                  variant={historyTab === 'discharged' ? 'primary' : 'outline'}
                  size="xs"
                  onClick={() => setHistoryTab('discharged')}
                >
                  Discharged ({dischargedAdmissions.length})
                </Button>
                <Button
                  variant={historyTab === 'all' ? 'primary' : 'outline'}
                  size="xs"
                  onClick={() => setHistoryTab('all')}
                >
                  All Logs
                </Button>
              </div>
            }
          />

          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search patient, doctor, or admission code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Admission Code & Patient</th>
                  <th className="px-4 py-3.5">Allocated Ward & Bed</th>
                  <th className="px-4 py-3.5">Attending Specialist</th>
                  <th className="px-4 py-3.5">Intake Date & Type</th>
                  <th className="px-4 py-3.5">Diagnosis / Reason</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{adm.patientName}</p>
                      <p className="text-[10px] text-indigo-600 font-mono">{adm.id} • {adm.patientId}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {adm.bedNumber}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{adm.wardType}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{adm.doctorName}</p>
                      <p className="text-[10px] text-slate-400">{adm.departmentName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-700">{adm.admissionDate}</p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {adm.admissionType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">{adm.reason}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          adm.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {adm.status === 'Active' ? (
                        <Button
                          variant="outline"
                          size="xs"
                          className="text-rose-600 hover:bg-rose-50 border-rose-200"
                          onClick={() => setDischargeConfirmId(adm.id)}
                          leftIcon={<LogOut className="w-3.5 h-3.5" />}
                        >
                          Discharge Patient
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Discharged {adm.dischargeDate}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE / EDIT WARD MODAL */}
      <Modal
        isOpen={isWardModalOpen}
        onClose={() => setIsWardModalOpen(false)}
        title={editingWard ? 'Edit Hospital Ward' : 'Create New Hospital Ward'}
        subtitle="Configure ward location, clinical specialization, category, and base daily bed rate."
        maxWidth="md"
      >
        <form onSubmit={handleSaveWard} className="space-y-4">
          <Input
            label="Ward Name *"
            value={wardFormData.name}
            onChange={(e) => setWardFormData({ ...wardFormData, name: e.target.value })}
            placeholder="e.g. General Ward - 2nd Floor East"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Ward Category *"
              value={wardFormData.wardType}
              onChange={(e) => setWardFormData({ ...wardFormData, wardType: e.target.value as WardType })}
            >
              <option value="General Ward">General Ward</option>
              <option value="ICU">ICU (Intensive Care)</option>
              <option value="NICU">NICU (Neonatal ICU)</option>
              <option value="CCU">CCU (Cardiac Care)</option>
              <option value="Pediatric Ward">Pediatric Ward</option>
              <option value="Maternity Ward">Maternity Ward</option>
              <option value="Deluxe Private">Deluxe Private Suite</option>
              <option value="Emergency Bay">Emergency Observation Bay</option>
            </Select>

            <Input
              label="Floor / Location *"
              value={wardFormData.floor}
              onChange={(e) => setWardFormData({ ...wardFormData, floor: e.target.value })}
              placeholder="e.g. 2nd Floor, Wing B"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Associated Department *"
              value={wardFormData.departmentName}
              onChange={(e) => setWardFormData({ ...wardFormData, departmentName: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Input
              label="Base Daily Rate ($) *"
              type="number"
              value={wardFormData.dailyRate}
              onChange={(e) => setWardFormData({ ...wardFormData, dailyRate: Number(e.target.value) })}
              required
            />
          </div>

          <Textarea
            label="Ward Description / Amenities"
            rows={2}
            value={wardFormData.description}
            onChange={(e) => setWardFormData({ ...wardFormData, description: e.target.value })}
            placeholder="e.g. Multi-bed ward equipped with central oxygen and nursing call system."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsWardModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Ward Configuration
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT BED MODAL */}
      <Modal
        isOpen={isBedModalOpen}
        onClose={() => setIsBedModalOpen(false)}
        title={editingBed ? 'Edit Bed Details' : 'Add Bed to Ward'}
        subtitle={`Assign bed code, link to ward, daily rate. (Current Plan: ${currentPlan.name} • Max ${maxBedsLimit} Beds).`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveBed} className="space-y-4">
          <Select
            label="Select Ward *"
            value={bedFormData.wardId}
            onChange={(e) => {
              const selectedW = wards.find((w) => w.id === e.target.value);
              setBedFormData({
                ...bedFormData,
                wardId: e.target.value,
                wardType: selectedW?.wardType || bedFormData.wardType,
                floor: selectedW?.floor || bedFormData.floor,
                dailyRate: selectedW?.dailyRate || bedFormData.dailyRate,
              });
            }}
            required
          >
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.floor}) — Base ${w.dailyRate}/day
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bed Number / Code *"
              value={bedFormData.bedNumber}
              onChange={(e) => setBedFormData({ ...bedFormData, bedNumber: e.target.value })}
              placeholder="e.g. Bed G-01"
              required
            />

            <Input
              label="Daily Rate ($) *"
              type="number"
              value={bedFormData.dailyRate}
              onChange={(e) => setBedFormData({ ...bedFormData, dailyRate: Number(e.target.value) })}
              required
            />
          </div>

          <Select
            label="Bed Operational Status *"
            value={bedFormData.status}
            onChange={(e) => setBedFormData({ ...bedFormData, status: e.target.value as BedStatus })}
            disabled={editingBed?.status === 'Occupied'}
          >
            <option value="Available">Available for Intake</option>
            <option value="Maintenance">Under Maintenance / Cleaning</option>
            <option value="Reserved">Reserved for Incoming Transfer</option>
            {editingBed?.status === 'Occupied' && <option value="Occupied">Occupied (Active Patient)</option>}
          </Select>

          <Textarea
            label="Equipment & Special Bed Notes"
            rows={2}
            value={bedFormData.notes}
            onChange={(e) => setBedFormData({ ...bedFormData, notes: e.target.value })}
            placeholder="e.g. Motorized ICU bed with ventilator bracket."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Bed Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADMIT INPATIENT MODAL (FOR DIRECT BUTTONS) */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Admit Inpatient to Medical Ward"
        subtitle="Select patient, ward, available bed, and attending specialist to issue bed allocation."
        maxWidth="lg"
      >
        <form onSubmit={handleAdmitSubmit} className="space-y-4">
          <Select
            label="Step 1: Select Patient *"
            value={admitFormData.patientId}
            onChange={(e) => setAdmitFormData({ ...admitFormData, patientId: e.target.value })}
            required
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — Current: {p.status}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Step 2: Select Ward *"
              value={admitSelectedWardId}
              onChange={(e) => handleWardChangeInAdmit(e.target.value)}
              required
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.floor}) — Base ${w.dailyRate}/day
                </option>
              ))}
            </Select>

            <Select
              label="Step 3: Select Available Bed *"
              value={admitFormData.bedNumber}
              onChange={(e) => {
                const b = beds.find((bed) => bed.bedNumber === e.target.value);
                setAdmitFormData({
                  ...admitFormData,
                  bedNumber: e.target.value,
                  wardType: b?.wardType || admitFormData.wardType,
                  initialDeposit: b ? b.dailyRate * 3 : admitFormData.initialDeposit,
                });
              }}
              required
            >
              <option value="">-- Select Available Bed --</option>
              {beds
                .filter(
                  (b) =>
                    b.status === 'Available' &&
                    (!admitSelectedWardId || b.wardId === admitSelectedWardId)
                )
                .map((b) => (
                  <option key={b.id} value={b.bedNumber}>
                    {b.bedNumber} ({b.wardName || b.wardType} — ${b.dailyRate}/day)
                  </option>
                ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Attending Physician / Specialist *"
              value={admitFormData.doctorId}
              onChange={(e) => setAdmitFormData({ ...admitFormData, doctorId: e.target.value })}
              required
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization})
                </option>
              ))}
            </Select>

            <Select
              label="Admission Category"
              value={admitFormData.admissionType}
              onChange={(e) => setAdmitFormData({ ...admitFormData, admissionType: e.target.value as any })}
            >
              <option value="Emergency">Emergency Intake</option>
              <option value="Elective">Elective / Scheduled Surgery</option>
              <option value="Transfer">Transfer from another facility</option>
              <option value="Maternity">Maternity / Delivery</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Admission Deposit ($)"
              type="number"
              value={admitFormData.initialDeposit}
              onChange={(e) => setAdmitFormData({ ...admitFormData, initialDeposit: Number(e.target.value) })}
            />
            <Input
              label="Diagnosis / Admission Reason *"
              value={admitFormData.reason}
              onChange={(e) => setAdmitFormData({ ...admitFormData, reason: e.target.value })}
              placeholder="e.g. Acute Coronary Syndrome telemetry monitoring"
              required
            />
          </div>

          <Textarea
            label="Special Clinical / Dietary Notes"
            rows={2}
            value={admitFormData.notes}
            onChange={(e) => setAdmitFormData({ ...admitFormData, notes: e.target.value })}
            placeholder="Enter additional intake remarks..."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Inpatient Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUBSCRIPTION UPGRADE MODAL */}
      <SubscriptionUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        hospitalId={hospId}
        hospitalName={currentHospital?.name}
        currentTier={currentHospital?.planTier || 'trial'}
      />

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog
        isOpen={!!dischargeConfirmId}
        onClose={() => setDischargeConfirmId(null)}
        onConfirm={handleDischargeConfirm}
        title="Discharge Inpatient?"
        message="Are you sure you want to discharge this inpatient? This will automatically mark their assigned bed as Available and record the discharge date."
        confirmText="Confirm Discharge"
        variant="primary"
      />

      <ConfirmDialog
        isOpen={!!deleteWardConfirmId}
        onClose={() => setDeleteWardConfirmId(null)}
        onConfirm={handleDeleteWardConfirm}
        title="Delete Hospital Ward?"
        message="Are you sure you want to delete this ward? This operation cannot be undone."
        confirmText="Delete Ward"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteBedConfirmId}
        onClose={() => setDeleteBedConfirmId(null)}
        onConfirm={handleDeleteBedConfirm}
        title="Delete Bed?"
        message="Are you sure you want to remove this bed from inventory?"
        confirmText="Delete Bed"
        variant="danger"
      />
    </div>
  );
};
