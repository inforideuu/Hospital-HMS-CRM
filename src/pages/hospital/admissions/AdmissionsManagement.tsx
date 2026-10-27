import React, { useState, useEffect } from 'react';
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
  Zap,
  Hash,
  BellRing,
  Clock,
  HeartPulse,
  CreditCard,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Admission, Bed, Ward, WardType, BedStatus, AdmissionRequest, NurseConditionStatus } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';
import { PatientCombobox } from '../../../components/common/PatientCombobox';

type MainTab = 'overview' | 'wards_beds' | 'requests' | 'admit' | 'history';

export const AdmissionsManagement: React.FC = () => {
  const { currentHospital, user } = useAuth();
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
  const maxBedsLimit = currentPlan?.maxBeds ?? 20;
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
    initialBedCount: 0,
    bedPrefix: '',
  });

  // Batch Provisioning Modal State
  const [isBatchBedModalOpen, setIsBatchBedModalOpen] = useState(false);
  const [batchTargetWard, setBatchTargetWard] = useState<Ward | null>(null);
  const [batchFormData, setBatchFormData] = useState({
    count: 10,
    prefix: '',
    startNumber: 1,
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
  const [patientSelectError, setPatientSelectError] = useState('');
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

  // Inpatient Discharge Workflow Modals
  const [isDoctorDischargeModalOpen, setIsDoctorDischargeModalOpen] = useState(false);
  const [selectedAdmForDoctorDischarge, setSelectedAdmForDoctorDischarge] = useState<Admission | null>(null);
  const [doctorDischargeForm, setDoctorDischargeForm] = useState({
    diagnosis: '',
    summary: '',
    advice: '',
    prescriptions: '',
  });

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedAdmForBilling, setSelectedAdmForBilling] = useState<Admission | null>(null);
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<'UPI' | 'Cash' | 'Credit Card' | 'Insurance'>('UPI');

  const [isFinalReleaseModalOpen, setIsFinalReleaseModalOpen] = useState(false);
  const [selectedAdmForFinalRelease, setSelectedAdmForFinalRelease] = useState<Admission | null>(null);

  // Doctor Admission Referrals Queue
  const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequest[]>(() => MockStorage.getAdmissionRequests(hospId));
  const [activeAdmissionRequestId, setActiveAdmissionRequestId] = useState<string | null>(null);
  const pendingAdmissionRequests = admissionRequests.filter((r) => r.status === 'Pending');

  const refreshData = () => {
    setWards(MockStorage.getWards(hospId));
    setBeds(MockStorage.getBeds(hospId));
    setAdmissions(MockStorage.getAdmissions(hospId));
    setAdmissionRequests(MockStorage.getAdmissionRequests(hospId));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('pulse_storage_updated', handleStorageChange);
    return () => window.removeEventListener('pulse_storage_updated', handleStorageChange);
  }, [hospId]);

  // Helper Metrics
  const activeAdmissions = admissions.filter((a) => a.status === 'Active');
  const dischargedAdmissions = admissions.filter((a) => a.status === 'Discharged');

  const availableBeds = beds.filter((b) => b.status === 'Available');
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied');
  const occupiedCount = Math.max(occupiedBeds.length, activeAdmissions.length);
  const maintenanceBeds = beds.filter((b) => b.status === 'Maintenance');
  const reservedBeds = beds.filter((b) => b.status === 'Reserved');

  const totalCapacity = beds.length;
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

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
      initialBedCount: 0,
      bedPrefix: '',
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
      initialBedCount: 0,
      bedPrefix: '',
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

    // If new ward and initial beds were requested, batch generate them immediately
    let batchMsg = '';
    if (!editingWard && wardFormData.initialBedCount > 0) {
      const prefix = wardFormData.bedPrefix.trim() || `${newWard.name.replace(/\s+Ward$/i, '').trim().toUpperCase()}-`;
      const bedsToCreate: Bed[] = [];
      const timestamp = Date.now();

      for (let i = 1; i <= wardFormData.initialBedCount; i++) {
        const paddedNum = String(i).padStart(2, '0');
        bedsToCreate.push({
          id: `BED-${newWard.id}-${i}-${timestamp}`,
          hospitalId: hospId,
          wardId: newWard.id,
          wardName: newWard.name,
          bedNumber: `${prefix}${paddedNum}`,
          wardType: newWard.wardType,
          floor: newWard.floor,
          status: 'Available',
          dailyRate: Number(wardFormData.dailyRate),
          notes: `Batch-provisioned under ${newWard.name}`,
        });
      }

      const res = MockStorage.batchSaveBeds(bedsToCreate);
      if (res.success) {
        batchMsg = ` and provisioned ${res.createdCount} initial beds (${prefix}01 to ${prefix}${String(res.createdCount).padStart(2, '0')})`;
        if (res.message) {
          showToast('Bed Quota Warning', res.message, 'warning');
        }
      } else {
        showToast('Bed Limit Reached', res.message || 'Could not provision initial beds.', 'error');
      }
    }

    showToast(
      editingWard ? 'Ward Updated' : 'Ward Created',
      `Ward "${newWard.name}" (${newWard.floor} - ${newWard.departmentName}) successfully saved${batchMsg}.`
    );
    setIsWardModalOpen(false);
    refreshData();
  };

  const handleOpenBatchBeds = (targetWard: Ward) => {
    // Check if hospital already at max limit
    if (beds.length >= maxBedsLimit) {
      showToast(
        'Subscription Capacity Limit Reached',
        `All wards combined have reached your ${currentPlan.name} plan maximum limit of ${maxBedsLimit} beds (${beds.length}/${maxBedsLimit} in use). Upgrade plan to expand capacity.`,
        'error'
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    const existingInWard = beds.filter((b) => b.wardId === targetWard.id);
    const cleanWardCode = targetWard.name.replace(/\s+Ward$/i, '').trim().toUpperCase();
    const suggestedPrefix = `${cleanWardCode}-`;
    const nextStartNum = existingInWard.length + 1;
    const remainingPlanCapacity = Math.max(1, maxBedsLimit - beds.length);
    const defaultBatchSize = Math.min(10, remainingPlanCapacity);

    setBatchTargetWard(targetWard);
    setBatchFormData({
      count: defaultBatchSize,
      prefix: suggestedPrefix,
      startNumber: nextStartNum,
      dailyRate: targetWard.dailyRate || 150,
    });
    setIsBatchBedModalOpen(true);
  };

  const handleBatchSaveBeds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTargetWard) return;

    if (batchFormData.count <= 0) {
      showToast('Validation Error', 'Please enter a bed count greater than 0.', 'error');
      return;
    }

    const prefix = batchFormData.prefix.trim() || `${batchTargetWard.name.slice(0, 3).toUpperCase()}-`;
    const start = Math.max(1, batchFormData.startNumber);
    const bedsToCreate: Bed[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < batchFormData.count; i++) {
      const num = start + i;
      const paddedNum = String(num).padStart(2, '0');
      bedsToCreate.push({
        id: `BED-${batchTargetWard.id}-${num}-${timestamp}`,
        hospitalId: hospId,
        wardId: batchTargetWard.id,
        wardName: batchTargetWard.name,
        bedNumber: `${prefix}${paddedNum}`,
        wardType: batchTargetWard.wardType,
        floor: batchTargetWard.floor,
        status: 'Available',
        dailyRate: Number(batchFormData.dailyRate),
        notes: `Batch-provisioned under ${batchTargetWard.name}`,
      });
    }

    const res = MockStorage.batchSaveBeds(bedsToCreate);
    if (!res.success) {
      showToast('Bed Limit Reached', res.message || 'Could not add beds due to subscription capacity.', 'error');
      setIsUpgradeModalOpen(true);
      return;
    }

    showToast(
      'Batch Beds Provisioned',
      `Successfully created ${res.createdCount} beds (${prefix}${String(start).padStart(2, '0')} to ${prefix}${String(start + res.createdCount - 1).padStart(2, '0')}) in ${batchTargetWard.name}.`
    );
    if (res.message) {
      showToast('Plan Limit Notice', res.message, 'warning');
    }
    setIsBatchBedModalOpen(false);
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
    setPatientSelectError('');

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

  const handleAdmitFromDoctorRequest = (req: AdmissionRequest) => {
    setActiveAdmissionRequestId(req.id);
    const targetW =
      wards.find((w) => w.wardType === req.recommendedWardType) ||
      wards.find((w) => w.id === req.recommendedWardType) ||
      wards[0];

    const wardAvailBeds = beds.filter(
      (b) => b.status === 'Available' && (!targetW?.id || b.wardId === targetW.id || b.wardType === targetW.wardType)
    );
    const firstFree = wardAvailBeds[0] || availableBeds[0];

    setAdmitSelectedWardId(targetW?.id || '');
    setAdmitFormData({
      patientId: req.patientId,
      doctorId: req.doctorId || doctors[0]?.id || '',
      wardId: targetW?.id || firstFree?.wardId || '',
      bedNumber: firstFree?.bedNumber || '',
      wardType: targetW?.wardType || firstFree?.wardType || req.recommendedWardType || 'General Ward',
      admissionType: req.priority === 'Emergency' ? 'Emergency' : 'Elective',
      reason: req.reason || req.diagnosis || 'Inpatient admission referral from specialist',
      notes: req.instructions ? `Doctor Directives: ${req.instructions}` : '',
      initialDeposit: firstFree ? firstFree.dailyRate * 3 : 1500,
    });
    setPatientSelectError('');
    setIsAdmitModalOpen(true);
  };

  const handleCancelAdmissionRequest = (reqId: string) => {
    MockStorage.updateAdmissionRequestStatus(reqId, 'Cancelled');
    showToast('Referral Dismissed', 'Admission request was marked as cancelled.', 'info');
    refreshData();
  };

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitFormData.patientId) {
      setPatientSelectError('Please select a registered patient to admit.');
      showToast('Validation Error', 'Please select a registered patient for admission.', 'error');
      return;
    }
    const pat = patients.find((p) => p.id === admitFormData.patientId) || MockStorage.getPatientById(admitFormData.patientId);
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

    if (activeAdmissionRequestId) {
      MockStorage.updateAdmissionRequestStatus(activeAdmissionRequestId, 'Admitted', newAdmission.id);
      setActiveAdmissionRequestId(null);
    }

    // Update patient status to Inpatient
    pat.status = 'Inpatient';
    pat.roomBedNumber = admitFormData.bedNumber;
    MockStorage.savePatient(pat);

    // Explicitly update bed status to Occupied
    if (chosenBed) {
      chosenBed.status = 'Occupied';
      chosenBed.currentPatientId = pat.id;
      chosenBed.currentPatientName = pat.name;
      MockStorage.updateBedStatus(chosenBed.id, 'Occupied');
    }

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

  // Step 2: Specialist Discharge Handlers
  const handleOpenDoctorDischargeModal = (adm: Admission) => {
    setSelectedAdmForDoctorDischarge(adm);
    setDoctorDischargeForm({
      diagnosis: adm.diagnosis || adm.reason || '',
      summary: adm.dischargeSummary || `Patient showed steady clinical improvement. Afebrile for 24h, vital parameters stabilized, tolerating oral diet and ambulating comfortably.`,
      advice: adm.dischargeAdvice || `Adequate fluid intake, wound care/dressing as advised. Avoid heavy lifting for 7 days. Review in OPD clinic after 1 week.`,
      prescriptions: adm.dischargePrescriptions || `1. Tab Cefixime 200mg BD x 5 days\n2. Tab Paracetamol 650mg SOS\n3. Tab Pantoprazole 40mg OD before breakfast x 5 days`,
    });
    setIsDoctorDischargeModalOpen(true);
  };

  const handleConfirmDoctorDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmForDoctorDischarge) return;

    const res = MockStorage.initiateDoctorDischarge(selectedAdmForDoctorDischarge.id, {
      dischargeSummary: doctorDischargeForm.summary.trim(),
      dischargeAdvice: doctorDischargeForm.advice.trim(),
      dischargePrescriptions: doctorDischargeForm.prescriptions.trim(),
      doctorId: selectedAdmForDoctorDischarge.doctorId,
      doctorName: selectedAdmForDoctorDischarge.doctorName,
    });

    if (res.success) {
      showToast(
        'Medical Discharge Initiated',
        `Discharge signed by Dr. ${selectedAdmForDoctorDischarge.doctorName}. Inpatient invoice generated for cashier settlement.`
      );
      setIsDoctorDischargeModalOpen(false);
      refreshData();
    }
  };

  // Step 3: Billing Settlement Handlers
  const handleOpenBillingModal = (adm: Admission) => {
    setSelectedAdmForBilling(adm);
    setIsBillingModalOpen(true);
  };

  const handleConfirmBillingSettlement = () => {
    if (!selectedAdmForBilling) return;
    MockStorage.settleInpatientBilling(selectedAdmForBilling.id, selectedAdmForBilling.invoiceId);
    showToast(
      'Billing Settled & Cleared',
      `Payment received via ${billingPaymentMethod}. Discharge gate pass issued for Bed ${selectedAdmForBilling.bedNumber}.`
    );
    setIsBillingModalOpen(false);
    refreshData();
  };

  // Step 4: Final Clearance & Bed Release Handlers
  const handleOpenFinalReleaseModal = (adm: Admission) => {
    if (adm.status !== 'Discharge Initiated') {
      showToast(
        'Action Blocked',
        'Doctor has not yet initiated medical discharge. Attending specialist must evaluate health and write discharge summary first.',
        'error'
      );
      return;
    }
    if (adm.billingStatus === 'Pending') {
      showToast(
        'Action Blocked',
        'Inpatient billing settlement is pending. Settle invoice at Cashier Desk before final release.',
        'error'
      );
      return;
    }
    setSelectedAdmForFinalRelease(adm);
    setIsFinalReleaseModalOpen(true);
  };

  const handleConfirmFinalRelease = () => {
    if (!selectedAdmForFinalRelease) return;
    const res = MockStorage.completeFinalDischarge(
      selectedAdmForFinalRelease.id,
      user?.name || 'Reception Desk',
      'Receptionist'
    );
    if (!res.success) {
      showToast('Discharge Blocked', res.error || 'Cannot complete discharge.', 'error');
      return;
    }
    showToast(
      'Discharge Complete',
      `${selectedAdmForFinalRelease.patientName} discharged. Bed ${selectedAdmForFinalRelease.bedNumber} is now Available.`
    );
    setIsFinalReleaseModalOpen(false);
    refreshData();
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Activity className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('wards_beds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${activeTab === 'wards_beds'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Building2 className="w-4 h-4" />
          Wards & Beds ({wards.length} Wards • {beds.length}/{maxBedsLimit} Beds)
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${activeTab === 'requests'
              ? 'bg-rose-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <BellRing className="w-4 h-4" />
          Doctor Referrals
          {pendingAdmissionRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs animate-pulse">
              {pendingAdmissionRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('admit');
            handleOpenAdmitModal();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${activeTab === 'admit'
              ? 'bg-indigo-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <UserPlus className="w-4 h-4" />
          Admit Inpatient
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${activeTab === 'history'
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
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${isBedLimitReached
            ? 'bg-amber-500/10 border-amber-300 text-amber-950'
            : 'bg-indigo-50/60 border-indigo-100 text-slate-800'
          }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${isBedLimitReached ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
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
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isBedLimitReached
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

      {/* Doctor Referrals Alert Banner on Overview */}
      {pendingAdmissionRequests.length > 0 && activeTab === 'overview' && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  {pendingAdmissionRequests.length} Doctor Inpatient Admission Order{pendingAdmissionRequests.length > 1 ? 's' : ''} Awaiting Bed Allocation
                </h3>
                <Badge variant="error" size="sm">Action Required</Badge>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                Specialists have recommended inpatient ward stays from OPD consultation chambers. Review orders and assign beds.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('requests')}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Review Referrals & Assign Beds
          </Button>
        </div>
      )}

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
            <span className="text-2xl font-bold text-indigo-600">{occupiedCount}</span>
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
                      <span className="text-xs font-medium text-slate-500">₹{ward.dailyRate}/day</span>
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
                        className={`h-full rounded-full transition-all duration-500 ${pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-indigo-600' : 'bg-emerald-500'
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
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${isAvail
                        ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 hover:bg-emerald-50'
                        : isOcc
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 hover:bg-indigo-50'
                          : 'bg-rose-50/40 border-rose-200 text-rose-950 hover:bg-rose-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{bed.bedNumber}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${isAvail ? 'bg-emerald-500' : isOcc ? 'bg-indigo-600' : 'bg-rose-500'
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
                        <span className="text-[10px] text-slate-400 font-medium">₹{bed.dailyRate}/day</span>
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
                          ₹{ward.dailyRate} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenBatchBeds(ward)}
                              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-xs"
                              leftIcon={<Zap className="w-3 h-3 text-indigo-600" />}
                            >
                              + Batch Add Beds
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
                wards.length > 0 ? (
                  <Button
                    variant={isBedLimitReached ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleOpenBatchBeds(wards[0])}
                    leftIcon={<Zap className="w-3.5 h-3.5" />}
                  >
                    + Batch Add Beds
                  </Button>
                ) : undefined
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
                          className={`text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200 outline-none ${bed.status === 'Available'
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
              <PatientCombobox
                label="Select Patient *"
                required
                hospitalId={hospId}
                selectedPatientId={admitFormData.patientId}
                onSelectPatient={(p) => {
                  setAdmitFormData((prev) => ({ ...prev, patientId: p ? p.id : '' }));
                  if (p) setPatientSelectError('');
                }}
                error={patientSelectError}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Step 2: Select Ward *"
                  value={admitSelectedWardId}
                  onChange={(e) => handleWardChangeInAdmit(e.target.value)}
                  required
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.floor} — Base ₹{w.dailyRate}/day)
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
                        {b.bedNumber} ({b.wardName || b.wardType} — ₹{b.dailyRate}/day)
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
                  label="Initial Deposit Amount (₹)"
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

      {/* TAB 4: DOCTOR ADMISSION REFERRALS QUEUE */}
      {activeTab === 'requests' && (
        <Card>
          <CardHeader
            title="Specialist Inpatient Admission Orders"
            subtitle="Admissions recommended by doctors during OPD / Emergency consultations. Allocate an available bed to admit."
            action={
              <div className="flex items-center gap-2">
                <Badge variant={pendingAdmissionRequests.length > 0 ? 'error' : 'neutral'} size="sm">
                  {pendingAdmissionRequests.length} Pending Bed Allocation
                </Badge>
              </div>
            }
          />
          <div className="p-6">
            {admissionRequests.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Doctor Referrals</h4>
                <p className="text-xs text-slate-400 mt-1">
                  When a specialist recommends inpatient admission during a consultation, it will appear here for bed allocation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-3">Patient Details</th>
                      <th className="py-3 px-3">Recommending Doctor</th>
                      <th className="py-3 px-3">Target Ward Type</th>
                      <th className="py-3 px-3">Clinical Indication & Directives</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admissionRequests.map((req) => {
                      const isPending = req.status === 'Pending';
                      const priorityColor =
                        req.priority === 'Emergency'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : req.priority === 'Urgent'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : req.priority === 'Routine'
                          ? 'bg-sky-100 text-sky-800 border-sky-200'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-200';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityColor}`}>
                              {req.priority === 'Emergency' && '🚨 '}
                              {req.priority === 'Urgent' && '⚡ '}
                              {req.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{req.patientName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {req.patientId} • {req.patientAge ? `${req.patientAge}y` : ''} {req.patientGender || ''}
                            </div>
                            {req.patientPhone && (
                              <div className="text-[10px] text-slate-500 mt-0.5">{req.patientPhone}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{req.doctorName}</div>
                            <div className="text-[11px] text-slate-500">{req.departmentName || 'Specialist'}</div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {req.recommendedWardType}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-medium text-slate-800 line-clamp-1">{req.reason}</div>
                            {req.instructions && (
                              <div className="text-[11px] text-rose-700 line-clamp-1 italic mt-0.5">
                                Care: {req.instructions}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge
                              variant={
                                req.status === 'Pending'
                                  ? 'warning'
                                  : req.status === 'Admitted'
                                  ? 'success'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {req.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="primary"
                                  size="xs"
                                  onClick={() => handleAdmitFromDoctorRequest(req)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                >
                                  Allocate Bed & Admit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleCancelAdmissionRequest(req.id)}
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  Dismiss
                                </Button>
                              </div>
                            ) : req.status === 'Admitted' ? (
                              <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Admitted to Bed
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3.5">Admission Code & Patient</th>
                  <th className="px-4 py-3.5">Allocated Ward & Bed</th>
                  <th className="px-4 py-3.5">Attending Specialist</th>
                  <th className="px-4 py-3.5">Nurse Monitoring & Updates</th>
                  <th className="px-4 py-3.5">Discharge Lifecycle Stage</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmissions.map((adm) => {
                  const isDischargeInitiated = adm.status === 'Discharge Initiated';
                  const isDischarged = adm.status === 'Discharged';
                  const isBillingPaid = adm.billingStatus === 'Paid' || adm.billingStatus === 'Cleared';
                  const conditionColor =
                    adm.nurseCondition === 'Ready for Discharge Review'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : adm.nurseCondition === 'Critical / High Attention'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{adm.patientName}</p>
                        <p className="text-[10px] text-indigo-600 font-mono">{adm.id} • {adm.patientId}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{adm.diagnosis || adm.reason}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          Bed {adm.bedNumber}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{adm.wardType}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{adm.doctorName}</p>
                        <p className="text-[10px] text-slate-400">{adm.departmentName}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {adm.nurseVitals ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border">
                                BP {adm.nurseVitals.bloodPressure || '120/80'}
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
                          <span className="text-[10px] text-slate-400 italic">Vitals monitoring underway</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isDischarged ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Discharged ({adm.dischargeDate})
                          </span>
                        ) : isDischargeInitiated ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 block w-max">
                              🩺 Doctor Discharge Initiated
                            </span>
                            {isBillingPaid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 block w-max">
                                💳 Billing Settled & Paid
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 block w-max">
                                💳 Invoice #{adm.invoiceId || 'Settlement Pending'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Inpatient Care Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {adm.status === 'Active' && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-indigo-600 hover:bg-indigo-50 border-indigo-200 font-semibold"
                              onClick={() => handleOpenDoctorDischargeModal(adm)}
                              leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                            >
                              Doctor: Initiate Discharge
                            </Button>
                          )}

                          {isDischargeInitiated && !isBillingPaid && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-amber-700 hover:bg-amber-50 border-amber-300 font-semibold"
                              onClick={() => handleOpenBillingModal(adm)}
                              leftIcon={<CreditCard className="w-3.5 h-3.5 text-amber-600" />}
                            >
                              Settle Bill at Cashier
                            </Button>
                          )}

                          {isDischargeInitiated && isBillingPaid && (
                            <Button
                              variant="primary"
                              size="xs"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              onClick={() => handleOpenFinalReleaseModal(adm)}
                              leftIcon={<LogOut className="w-3.5 h-3.5" />}
                            >
                              Release Bed & Discharge
                            </Button>
                          )}

                          {isDischarged && (
                            <span className="text-[10px] text-slate-400 font-medium flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Complete
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              label="Base Daily Rate (₹) *"
              type="number"
              value={wardFormData.dailyRate}
              onChange={(e) => setWardFormData({ ...wardFormData, dailyRate: Number(e.target.value) })}
              required
            />
          </div>

          {!editingWard && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">
                  Quick Provisioning — Pre-create Beds for this Ward (Optional)
                </span>
              </div>
              <p className="text-[11px] text-indigo-700">
                Specify how many beds to automatically generate under this ward upon creation (e.g., 10, 20, 30).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Initial Bed Capacity (Count)"
                  type="number"
                  min="0"
                  max={Math.max(0, maxBedsLimit - beds.length)}
                  value={wardFormData.initialBedCount || ''}
                  onChange={(e) =>
                    setWardFormData({ ...wardFormData, initialBedCount: Math.max(0, Number(e.target.value) || 0) })
                  }
                  placeholder="e.g. 20 (leave 0 to add later)"
                  helperText={`Capacity limit: ${maxBedsLimit - beds.length} beds available on current plan`}
                />
                <Input
                  label="Bed Number Prefix (Optional)"
                  value={wardFormData.bedPrefix}
                  onChange={(e) => setWardFormData({ ...wardFormData, bedPrefix: e.target.value })}
                  placeholder={`e.g. ${wardFormData.name ? wardFormData.name.replace(/\s+Ward$/i, '').trim().toUpperCase() + '-' : 'A-'}`}
                  helperText="Bed numbers will be auto-generated (e.g. A-01, A-02...)"
                />
              </div>
            </div>
          )}

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
              {editingWard ? 'Save Ward Configuration' : wardFormData.initialBedCount > 0 ? `Create Ward & ${wardFormData.initialBedCount} Beds` : 'Save Ward Configuration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* BATCH BED PROVISIONING MODAL */}
      <Modal
        isOpen={isBatchBedModalOpen}
        onClose={() => setIsBatchBedModalOpen(false)}
        title={`Batch Provision Beds — ${batchTargetWard?.name || 'Ward'}`}
        subtitle={`Quickly generate N beds with sequential numbering. (Plan Capacity: ${beds.length}/${maxBedsLimit} used).`}
        maxWidth="md"
      >
        <form onSubmit={handleBatchSaveBeds} className="space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-700">
              <span className="font-semibold">Target Ward:</span>
              <span className="font-bold text-slate-900">{batchTargetWard?.name} ({batchTargetWard?.floor})</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="font-semibold">Current Beds in Ward:</span>
              <span className="font-bold text-indigo-700">{beds.filter((b) => b.wardId === batchTargetWard?.id).length} Beds</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="font-semibold">Available Subscription Quota:</span>
              <span className="font-bold text-emerald-700">{Math.max(0, maxBedsLimit - beds.length)} Beds Remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Number of Beds to Create (Count) *"
              type="number"
              min="1"
              max={Math.max(1, maxBedsLimit - beds.length)}
              value={batchFormData.count}
              onChange={(e) => setBatchFormData({ ...batchFormData, count: Math.max(1, Number(e.target.value) || 1) })}
              required
              helperText={`e.g. 10, 20, 30 beds`}
            />

            <Input
              label="Bed Code Prefix *"
              value={batchFormData.prefix}
              onChange={(e) => setBatchFormData({ ...batchFormData, prefix: e.target.value })}
              placeholder="e.g. A-, B-, ICU-"
              required
              helperText="Precedes the sequential number"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Starting Sequence Number *"
              type="number"
              min="1"
              value={batchFormData.startNumber}
              onChange={(e) => setBatchFormData({ ...batchFormData, startNumber: Math.max(1, Number(e.target.value) || 1) })}
              required
              helperText="First bed number in sequence"
            />

            <Input
              label="Daily Tariff Rate (₹) *"
              type="number"
              min="0"
              value={batchFormData.dailyRate}
              onChange={(e) => setBatchFormData({ ...batchFormData, dailyRate: Number(e.target.value) || 0 })}
              required
              helperText="Inherited from ward base rate"
            />
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
            <p className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Live Sequential Bed Code Preview:
            </p>
            <p className="text-[11px] text-emerald-800 font-mono">
              {batchFormData.prefix}
              {String(batchFormData.startNumber).padStart(2, '0')}&nbsp; ➔ &nbsp;
              {batchFormData.prefix}
              {String(batchFormData.startNumber + Math.max(1, batchFormData.count) - 1).padStart(2, '0')}
              &nbsp; ({batchFormData.count} total beds generated at ₹{batchFormData.dailyRate}/day)
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBatchBedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Zap className="w-3.5 h-3.5" />}>
              Generate {batchFormData.count} Beds Now
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT BED MODAL */}
      <Modal
        isOpen={isBedModalOpen}
        onClose={() => setIsBedModalOpen(false)}
        title="Edit Bed Details"
        subtitle="Update individual bed numbering, daily rate, or special clinical notes."
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
                {w.name} ({w.floor}) — Base ₹{w.dailyRate}/day
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
              label="Daily Rate (₹) *"
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
          <PatientCombobox
            label="Select Patient *"
            required
            hospitalId={hospId}
            selectedPatientId={admitFormData.patientId}
            onSelectPatient={(p) => {
              setAdmitFormData((prev) => ({ ...prev, patientId: p ? p.id : '' }));
              if (p) setPatientSelectError('');
            }}
            error={patientSelectError}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Ward *"
              value={admitSelectedWardId}
              onChange={(e) => handleWardChangeInAdmit(e.target.value)}
              required
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.floor}) — Base ₹{w.dailyRate}/day
                </option>
              ))}
            </Select>

            <Select
              label="Select Available Bed *"
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
                    {b.bedNumber} ({b.wardName || b.wardType} — ₹{b.dailyRate}/day)
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
              label="Initial Admission Deposit (₹)"
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

      {/* STEP 2 MODAL: Specialist Doctor Discharge Order & Summary */}
      <Modal
        isOpen={isDoctorDischargeModalOpen}
        onClose={() => setIsDoctorDischargeModalOpen(false)}
        title="Specialist Medical Discharge Order & Summary"
        subtitle={`Patient: ${selectedAdmForDoctorDischarge?.patientName} • Bed: ${selectedAdmForDoctorDischarge?.bedNumber} • Attending: Dr. ${selectedAdmForDoctorDischarge?.doctorName}`}
        maxWidth="lg"
      >
        {selectedAdmForDoctorDischarge && (
          <form onSubmit={handleConfirmDoctorDischarge} className="space-y-4 text-xs">
            {/* Nurse's latest monitoring review */}
            {selectedAdmForDoctorDischarge.nurseVitals && (
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                    Nurse's Bedside Clinical Update
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-purple-700 border border-purple-200">
                    {selectedAdmForDoctorDischarge.nurseCondition || 'Stable & Improving'}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] text-purple-900">
                  <span>BP: <strong>{selectedAdmForDoctorDischarge.nurseVitals.bloodPressure || '120/80'}</strong></span>
                  <span>Pulse: <strong>{selectedAdmForDoctorDischarge.nurseVitals.heartRate || 75} bpm</strong></span>
                  <span>SpO2: <strong>{selectedAdmForDoctorDischarge.nurseVitals.oxygenLevel || 98}%</strong></span>
                  <span>Temp: <strong>{selectedAdmForDoctorDischarge.nurseVitals.temperature || 98.6}°F</strong></span>
                </div>
                {selectedAdmForDoctorDischarge.nurseNotes && (
                  <p className="text-[11px] text-purple-900 italic">
                    Nurse Notes: "{selectedAdmForDoctorDischarge.nurseNotes}"
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Final Discharge Diagnosis *
              </label>
              <Input
                value={doctorDischargeForm.diagnosis}
                onChange={(e) => setDoctorDischargeForm({ ...doctorDischargeForm, diagnosis: e.target.value })}
                placeholder="e.g. Acute Gastroenteritis - Resolved"
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Clinical Summary of Hospital Course & Treatment *
              </label>
              <Textarea
                rows={3}
                value={doctorDischargeForm.summary}
                onChange={(e) => setDoctorDischargeForm({ ...doctorDischargeForm, summary: e.target.value })}
                placeholder="Document patient's recovery trajectory, diagnostic findings, and clinical milestones..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Take-Home Discharge Prescriptions
                </label>
                <Textarea
                  rows={3}
                  value={doctorDischargeForm.prescriptions}
                  onChange={(e) => setDoctorDischargeForm({ ...doctorDischargeForm, prescriptions: e.target.value })}
                  placeholder="e.g. 1. Tab Cefixime 200mg BD x 5 days"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Home Care Advice & Follow-Up Instructions
                </label>
                <Textarea
                  rows={3}
                  value={doctorDischargeForm.advice}
                  onChange={(e) => setDoctorDischargeForm({ ...doctorDischargeForm, advice: e.target.value })}
                  placeholder="e.g. Follow-up in OPD after 7 days, diet guidelines, emergency warning signs..."
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Next Workflow Step:</strong> Submitting this medical discharge signs off clinical care and automatically issues an Inpatient Bill for cashier settlement before bed release.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDoctorDischargeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Stethoscope className="w-4 h-4" />}>
                Sign Off & Initiate Discharge
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* STEP 3 MODAL: Inpatient Billing Settlement Modal */}
      <Modal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        title="Inpatient Billing & Financial Settlement"
        subtitle={`Patient: ${selectedAdmForBilling?.patientName} • Bed: ${selectedAdmForBilling?.bedNumber}`}
        maxWidth="md"
      >
        {selectedAdmForBilling && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Invoice #{selectedAdmForBilling.invoiceId || 'IPD-BILL'}</span>
                <Badge variant="warning" size="sm">Settlement Pending</Badge>
              </div>

              <div className="divide-y divide-slate-200 text-slate-700 text-xs">
                <div className="flex justify-between py-1.5">
                  <span>Inpatient Bed & Ward Daily Rate ({selectedAdmForBilling.wardType}):</span>
                  <span className="font-mono font-semibold">Included</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>24/7 Nursing & Vitals Telemetry Care:</span>
                  <span className="font-mono font-semibold">Included</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Specialist Daily Inpatient Rounds (Dr. {selectedAdmForBilling.doctorName}):</span>
                  <span className="font-mono font-semibold">Included</span>
                </div>
                <div className="flex justify-between py-1.5 text-emerald-700">
                  <span>Less Admission Advance Deposit Paid:</span>
                  <span className="font-mono font-bold">- ₹{selectedAdmForBilling.initialDeposit}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-900 font-bold text-sm bg-slate-100/80 px-2 rounded-lg mt-1">
                  <span>Net Balance Payable:</span>
                  <span className="font-mono text-indigo-700">₹{selectedAdmForBilling.finalBilledAmount ? Math.max(0, selectedAdmForBilling.finalBilledAmount - selectedAdmForBilling.initialDeposit) : 2500}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Select Settlement Payment Method *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['UPI', 'Cash', 'Credit Card', 'Insurance'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setBillingPaymentMethod(method)}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold text-xs transition-all ${
                      billingPaymentMethod === method
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Confirming payment marks the bill as <strong>Paid</strong> and authorizes the Receptionist/Nurse to issue the Gate Pass and release the bed.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsBillingModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmBillingSettlement}
                leftIcon={<CreditCard className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Confirm Payment & Clear Billing
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* STEP 4 MODAL: Final Bed Release & Discharge Completion Modal */}
      <Modal
        isOpen={isFinalReleaseModalOpen}
        onClose={() => setIsFinalReleaseModalOpen(false)}
        title="Complete Discharge & Release Hospital Bed"
        subtitle={`Patient: ${selectedAdmForFinalRelease?.patientName} • Bed: ${selectedAdmForFinalRelease?.bedNumber}`}
        maxWidth="md"
      >
        {selectedAdmForFinalRelease && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Discharge Clearance Protocol Complete
              </div>
              <ul className="space-y-1 text-emerald-800 text-xs">
                <li>• 🩺 Doctor Discharge: Signed by Dr. {selectedAdmForFinalRelease.doctorName}</li>
                <li>• 📋 Summary: {selectedAdmForFinalRelease.dischargeSummary || 'Clinical recovery achieved'}</li>
                <li>• 💳 Billing Settlement: Paid in full (Invoice: {selectedAdmForFinalRelease.invoiceId || 'Settled'})</li>
              </ul>
            </div>

            <p className="text-slate-600">
              Issuing final clearance will mark <strong>{selectedAdmForFinalRelease.patientName}</strong> as <strong>Discharged</strong>, archive this stay to history, and release <strong>Bed {selectedAdmForFinalRelease.bedNumber}</strong> back to <strong>Available</strong> status.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsFinalReleaseModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmFinalRelease}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Complete Final Discharge & Free Bed
              </Button>
            </div>
          </div>
        )}
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
