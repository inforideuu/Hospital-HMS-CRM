import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  RotateCw,
  Clock,
  Stethoscope,
  FileCheck,
  AlertCircle,
  Eye,
  Plus,
  Thermometer,
  ShieldAlert,
  ClipboardList,
  Pill,
  Trash2,
  Printer,
} from 'lucide-react';
import { printPrescription } from '../../../utils/prescriptionPrint';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Admission, Doctor, Patient, NurseConditionStatus, Prescription } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';

export const DoctorInpatients: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'HOSP-001';

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');

  // Doctor Discharge Modal States
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedAdmForDischarge, setSelectedAdmForDischarge] = useState<Admission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [dischargeAdvice, setDischargeAdvice] = useState('');
  const [dischargePrescriptions, setDischargePrescriptions] = useState('');

  // Doctor Round Note Modal States
  const [isRoundNoteModalOpen, setIsRoundNoteModalOpen] = useState(false);
  const [selectedAdmForRoundNote, setSelectedAdmForRoundNote] = useState<Admission | null>(null);
  const [doctorRoundNote, setDoctorRoundNote] = useState('');

  // Dedicated Inpatient Prescription Modal States
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [selectedAdmForRx, setSelectedAdmForRx] = useState<Admission | null>(null);
  const [inpatientRxItems, setInpatientRxItems] = useState<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[]>([
    { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily (BD)', duration: '5 days', instructions: 'After food' },
  ]);
  const [inpatientRxNotes, setInpatientRxNotes] = useState('');

  // Resolve current authenticated doctor profile
  const doctorProfile = useMemo(() => {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    return (
      doctors.find(
        (d) =>
          (d.email && d.email.trim().toLowerCase() === userEmail) ||
          d.id === user?.id ||
          d.name.trim().toLowerCase() === userName
      ) ||
      doctors[0] ||
      null
    );
  }, [doctors, user]);

  const doctorId = doctorProfile?.id || user?.id || '';
  const doctorName = doctorProfile?.name || user?.name || 'Dr. Specialist';

  const loadData = () => {
    setDoctors(MockStorage.getDoctors(hospId));
    setPatients(MockStorage.getPatients(hospId));
    const allAdmissions = MockStorage.getAdmissions(hospId);
    setAdmissions(allAdmissions);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    MockStorage.syncWithBackend?.().then?.(() => loadData()).catch?.(() => {});
    const handleStorageUpdate = () => loadData();
    window.addEventListener('pulse_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [hospId]);

  // Doctor's assigned inpatients
  const myInpatients = useMemo(() => {
    const docNameLower = doctorName.toLowerCase();
    return admissions.filter((a) => {
      const matchDoc =
        !doctorId ||
        a.doctorId === doctorId ||
        (doctorId && a.doctorId && a.doctorId.toLowerCase() === doctorId.toLowerCase()) ||
        (a.doctorName && (
          a.doctorName.toLowerCase() === docNameLower ||
          a.doctorName.toLowerCase().includes(docNameLower.replace(/^dr\.\s*/i, '')) ||
          docNameLower.includes(a.doctorName.toLowerCase().replace(/^dr\.\s*/i, ''))
        ));
      return matchDoc && (a.status === 'Active' || a.status === 'Discharge Initiated');
    });
  }, [admissions, doctorId, doctorName]);

  // Enriched inpatients with fallback to patient EHR vitals if nurse haven't logged yet
  const enrichedInpatients = useMemo(() => {
    return myInpatients.map((adm) => {
      const pat = patients.find((p) => p.id === adm.patientId);
      const effectiveVitals = adm.nurseVitals || (pat?.vitals ? {
        bloodPressure: pat.vitals.bloodPressure || '120/80',
        heartRate: pat.vitals.heartRate || 74,
        temperature: pat.vitals.temperature || 98.6,
        oxygenLevel: pat.vitals.oxygenLevel || 99,
        recordedAt: pat.vitals.recordedAt || adm.admissionDate,
        recordedBy: pat.vitals.recordedBy || 'Ward Staff Nurse',
      } : undefined);

      const effectiveCondition: NurseConditionStatus = adm.nurseCondition || 'Stable & Improving';
      const effectiveNotes = adm.nurseNotes || (effectiveVitals ? 'Patient vitals stable. No acute complaints reported.' : 'Awaiting bedside nursing review');
      const effectiveNurseName =
        adm.nurseUpdatedBy ||
        adm.nurseVitals?.recordedBy ||
        pat?.vitals?.recordedBy ||
        (adm.nurseNotes ? 'Ward Staff Nurse' : undefined);

      return {
        ...adm,
        effectiveVitals,
        effectiveCondition,
        effectiveNotes,
        effectiveNurseName,
        effectiveUpdatedAt: adm.nurseUpdatedAt || effectiveVitals?.recordedAt || adm.admissionDate,
      };
    });
  }, [myInpatients, patients]);

  // Metric counts
  const readyForDischargeCount = useMemo(
    () => enrichedInpatients.filter((a) => a.effectiveCondition === 'Ready for Discharge Review' && a.status === 'Active').length,
    [enrichedInpatients]
  );

  const criticalCount = useMemo(
    () => enrichedInpatients.filter((a) => a.effectiveCondition === 'Critical / High Attention').length,
    [enrichedInpatients]
  );

  const stableCount = useMemo(
    () => enrichedInpatients.filter((a) => a.effectiveCondition === 'Stable & Improving').length,
    [enrichedInpatients]
  );

  // Filtered List
  const filteredInpatients = useMemo(() => {
    return enrichedInpatients.filter((adm) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        adm.patientName.toLowerCase().includes(q) ||
        adm.patientId.toLowerCase().includes(q) ||
        adm.bedNumber.toLowerCase().includes(q) ||
        adm.wardType.toLowerCase().includes(q) ||
        (adm.reason && adm.reason.toLowerCase().includes(q));

      const matchesCondition =
        conditionFilter === 'all' || adm.effectiveCondition === conditionFilter;

      const matchesWard =
        wardFilter === 'all' || adm.wardType === wardFilter;

      const matchesLifecycle =
        lifecycleFilter === 'all' ||
        (lifecycleFilter === 'active' && adm.status === 'Active') ||
        (lifecycleFilter === 'discharge_initiated' && adm.status === 'Discharge Initiated');

      return matchesSearch && matchesCondition && matchesWard && matchesLifecycle;
    });
  }, [enrichedInpatients, searchQuery, conditionFilter, wardFilter, lifecycleFilter]);

  // Unique wards for filter
  const uniqueWards = useMemo(() => {
    return Array.from(new Set(enrichedInpatients.map((a) => a.wardType)));
  }, [enrichedInpatients]);

  // Action: Open Discharge Modal
  const handleOpenDischargeModal = (adm: Admission) => {
    setSelectedAdmForDischarge(adm);
    setDischargeSummary(
      adm.reason
        ? `Patient admitted for ${adm.reason}. Inpatient ward course completed successfully with vitals stabilization.`
        : 'Inpatient course completed. Vitals stabilized and afebrile.'
    );
    setDischargeAdvice('Rest for 3-5 days. Complete take-home medications. Follow up in Outpatient Clinic in 7 days or SOS if vitals change.');
    setDischargePrescriptions('1. Tab Paracetamol 650mg TDS x 3 days\n2. Tab Pantoprazole 40mg OD AC x 5 days\n3. Tab Multivitamin OD x 15 days');
    setIsDischargeModalOpen(true);
  };

  // Action: Confirm Doctor Discharge
  const handleConfirmDischarge = () => {
    if (!selectedAdmForDischarge) return;
    if (!dischargeSummary.trim()) {
      showToast('Missing Summary', 'Please provide a clinical discharge summary.', 'error');
      return;
    }
    const res = MockStorage.initiateDoctorDischarge(selectedAdmForDischarge.id, {
      dischargeSummary,
      dischargeAdvice,
      dischargePrescriptions,
      doctorId,
      doctorName,
    });
    if (res.success) {
      showToast(
        'Medical Discharge Initiated',
        `Discharge initiated for ${selectedAdmForDischarge.patientName}. Invoice #${res.invoiceId} generated for cashier settlement.`
      );
      setIsDischargeModalOpen(false);
      setSelectedAdmForDischarge(null);
      loadData();
    } else {
      showToast('Discharge Failed', 'Could not record doctor discharge.', 'error');
    }
  };

  // Action: Open Round Note Modal
  const handleOpenRoundNoteModal = (adm: Admission) => {
    setSelectedAdmForRoundNote(adm);
    setDoctorRoundNote('');
    setIsRoundNoteModalOpen(true);
  };

  // Action: Save Round Note
  const handleSaveRoundNote = () => {
    if (!selectedAdmForRoundNote || !doctorRoundNote.trim()) return;

    // Log doctor round activity and append to admission notes
    const updatedNotes = selectedAdmForRoundNote.notes
      ? `${selectedAdmForRoundNote.notes}\n[Doctor Round by ${doctorName} at ${new Date().toLocaleTimeString()}]: ${doctorRoundNote}`
      : `[Doctor Round by ${doctorName} at ${new Date().toLocaleTimeString()}]: ${doctorRoundNote}`;

    const updated = {
      ...selectedAdmForRoundNote,
      notes: updatedNotes,
    };
    MockStorage.saveAdmission(updated);

    showToast(
      'Doctor Round Recorded',
      `Clinical observation note saved for ${selectedAdmForRoundNote.patientName} (${selectedAdmForRoundNote.bedNumber}).`
    );
    setIsRoundNoteModalOpen(false);
    setSelectedAdmForRoundNote(null);
    loadData();
  };

  // Action: Open Dedicated Inpatient Prescription Modal
  const handleOpenRxModal = (adm: Admission) => {
    setSelectedAdmForRx(adm);
    setInpatientRxNotes(`Inpatient Bed Medication Order • Bed ${adm.bedNumber} (${adm.wardType})`);
    setInpatientRxItems([
      { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily (BD)', duration: '5 days', instructions: 'After food' },
    ]);
    setIsRxModalOpen(true);
  };

  const handleAddInpatientMed = () => {
    setInpatientRxItems([
      ...inpatientRxItems,
      { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily (BD)', duration: '5 days', instructions: 'After food' },
    ]);
  };

  const handleRemoveInpatientMed = (index: number) => {
    setInpatientRxItems(inpatientRxItems.filter((_, i) => i !== index));
  };

  const handleInpatientMedChange = (index: number, field: string, val: string) => {
    const updated = [...inpatientRxItems];
    (updated[index] as any)[field] = val;
    setInpatientRxItems(updated);
  };

  const handleQuickAddMed = (medName: string, dosage: string, freq: string, inst: string) => {
    const filtered = inpatientRxItems.filter((m) => m.medicineName.trim().length > 0);
    setInpatientRxItems([
      ...filtered,
      { medicineName: medName, dosage, frequency: freq, duration: 'During Inpatient Stay', instructions: inst },
    ]);
  };

  const handleSaveInpatientRx = (andPrint = false) => {
    if (!selectedAdmForRx) return;
    const validItems = inpatientRxItems.filter((i) => i.medicineName.trim().length > 0);
    if (validItems.length === 0) {
      showToast('Validation Error', 'Please enter at least one medicine name.', 'error');
      return;
    }

    const rxId = `RX-IPD-${Date.now().toString().slice(-6)}`;
    const newPrescription: Prescription = {
      id: rxId,
      hospitalId: selectedAdmForRx.hospitalId || hospId,
      patientId: selectedAdmForRx.patientId,
      patientName: selectedAdmForRx.patientName,
      doctorId: selectedAdmForRx.doctorId || doctorId || 'DOC-101',
      doctorName: selectedAdmForRx.doctorName || doctorName || 'Dr. Specialist',
      doctorSpecialization: (user as any)?.specialization || 'Attending Specialist',
      date: new Date().toISOString().split('T')[0],
      diagnosis: selectedAdmForRx.reason || 'Inpatient Bed Care Pharmacotherapy',
      medications: validItems,
      status: 'Active',
      notes: `[Inpatient Bed Order - Bed ${selectedAdmForRx.bedNumber}] ${inpatientRxNotes.trim()}`,
    };

    MockStorage.savePrescription(newPrescription);
    const admRef = selectedAdmForRx;
    setIsRxModalOpen(false);
    setSelectedAdmForRx(null);
    showToast(
      'Inpatient Prescription Issued',
      `Prescription #${rxId} with ${validItems.length} medication(s) for ${admRef.patientName} (Bed ${admRef.bedNumber}) transmitted to Pharmacy & Nursing Station.`,
      'success'
    );

    if (andPrint) {
      const pat = MockStorage.getPatientById(admRef.patientId);
      printPrescription(newPrescription, {
        hospitalName: currentHospital?.name,
        patientAge: pat?.age,
        patientGender: pat?.gender,
        patientPhone: pat?.phone,
      });
    }
  };

  const handlePrintLatestRx = (adm: Admission) => {
    const patientPrescriptions = MockStorage.getPrescriptions(adm.patientId, hospId);
    if (!patientPrescriptions || patientPrescriptions.length === 0) {
      showToast(
        'No Prescription Issued',
        `No prescription on record yet for ${adm.patientName}. Click "Prescribe Rx" to write inpatient medication orders.`,
        'warning'
      );
      return;
    }
    const latestRx = patientPrescriptions[0];
    const pat = MockStorage.getPatientById(adm.patientId);
    printPrescription(latestRx, {
      hospitalName: currentHospital?.name,
      patientAge: pat?.age,
      patientGender: pat?.gender,
      patientPhone: pat?.phone,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={`Inpatients Under My Care • Dr. ${doctorName.replace(/^Dr\.\s*/i, '')}`}
        subtitle={`Inpatients Under My Care, Nurse Bedside Updates & Clinical Observations • ${currentHospital?.name || 'Hospital HMS'}`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Doctor Dashboard', href: '/hospital/doctor/dashboard' },
          { label: 'Inpatients Under My Care & Nurse Updates' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/doctor/dashboard')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Doctor Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                MockStorage.syncWithBackend?.().then?.(() => loadData()).catch?.(() => loadData());
                showToast('Refreshed', 'Inpatient monitoring records synchronized.');
              }}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/admissions')}
              leftIcon={<BedDouble className="w-3.5 h-3.5" />}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              Admissions Dept
            </Button>
          </div>
        }
      />

      {/* Specialist Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold text-xl shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">{doctorName}</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {doctorProfile?.specialization || 'Attending Specialist'}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {doctorProfile?.departmentName || 'Inpatient Services'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>Active Inpatient Roster: <strong className="text-white font-mono">{enrichedInpatients.length} Patients</strong></span>
                <span>•</span>
                <span>Discharge Approvals Pending: <strong className="text-emerald-400 font-semibold">{readyForDischargeCount}</strong></span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Assigned Inpatients"
          value={enrichedInpatients.length}
          subtext="Admitted bed cases"
          icon={<BedDouble className="w-5 h-5 text-indigo-600" />}
          accentColor="indigo"
        />
        <StatCard
          title="Ready for Discharge"
          value={readyForDischargeCount}
          subtext="Nurse recommended"
          icon={<HeartPulse className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
        />
        <StatCard
          title="Critical Attention"
          value={criticalCount}
          subtext="Priority clinical review"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          accentColor="rose"
        />
        <StatCard
          title="Stable & Improving"
          value={stableCount}
          subtext="Normal clinical progress"
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
          accentColor="emerald"
        />
      </div>

      {/* Critical Inpatient Urgent Banner */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-700 shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                Critical Inpatient Attention Required ({criticalCount})
              </h4>
              <p className="text-xs text-red-800 mt-0.5">
                Ward nurse flagged inpatient vitals as "Critical / High Attention". Prompt specialist clinical round recommended.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConditionFilter('Critical / High Attention')}
            className="bg-red-600 hover:bg-red-700 text-white shrink-0"
          >
            Filter Critical Cases
          </Button>
        </div>
      )}

      {/* Nurse Recommendation Banner */}
      {readyForDischargeCount > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
              <FileCheck className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                Nurse Discharge Recommendations ({readyForDischargeCount})
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Ward nurses have marked {readyForDischargeCount} patient(s) as "Ready for Discharge Review". Vitals are normalized.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConditionFilter('Ready for Discharge Review')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
          >
            Review Discharge Ready Patients
          </Button>
        </div>
      )}

      {/* Search, Filter Bar and Inpatients List Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader
          title="Inpatients Under My Care & Nurse Updates"
          subtitle={`Real-time bedside vitals, condition status updates, and nurse reports for patients assigned to ${doctorName}.`}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, bed, UHID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Conditions</option>
                <option value="Ready for Discharge Review">⭐ Ready for Discharge</option>
                <option value="Critical / High Attention">🚨 Critical / High Attention</option>
                <option value="Stable & Improving">Stable & Improving</option>
                <option value="Observation Continues">Observation Continues</option>
              </select>

              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Wards</option>
                {uniqueWards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>

              <select
                value={lifecycleFilter}
                onChange={(e) => setLifecycleFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Stages</option>
                <option value="active">Active Inpatient Care</option>
                <option value="discharge_initiated">Discharge Initiated</option>
              </select>
            </div>
          }
        />

        <CardContent className="p-0">
          {filteredInpatients.length === 0 ? (
            <div className="p-10 text-center">
              <EmptyState
                title="No Inpatients Found"
                description={
                  searchQuery || conditionFilter !== 'all' || wardFilter !== 'all'
                    ? 'No admitted patients matched your search or filter criteria.'
                    : 'You currently have no admitted inpatients assigned under your care.'
                }
                actionText="Reset Filters"
                onAction={() => {
                  setSearchQuery('');
                  setConditionFilter('all');
                  setWardFilter('all');
                  setLifecycleFilter('all');
                }}
              />
            </div>
          ) : (
            /* Inpatients Under My Care & Nurse Updates Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Patient & UHID</th>
                    <th className="px-4 py-3">Bed & Ward</th>
                    <th className="px-4 py-3">Nurse Monitoring & Vitals</th>
                    <th className="px-4 py-3">Status / Billing Stage</th>
                    <th className="px-4 py-3 text-right">Specialist Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInpatients.map((adm) => (
                    <tr
                      key={adm.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        adm.effectiveCondition === 'Ready for Discharge Review'
                          ? 'bg-emerald-50/40'
                          : adm.effectiveCondition === 'Critical / High Attention'
                          ? 'bg-rose-50/40'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 leading-tight">{adm.patientName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-indigo-600 font-semibold">{adm.patientId}</span> • Adm: {adm.admissionDate}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                          Diagnosis: {adm.reason}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 font-mono text-[12px]">{adm.bedNumber}</span>
                        <p className="text-[11px] text-slate-500">{adm.wardType}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5 max-w-[340px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant={
                                adm.effectiveCondition === 'Ready for Discharge Review'
                                  ? 'success'
                                  : adm.effectiveCondition === 'Critical / High Attention'
                                  ? 'error'
                                  : adm.effectiveCondition === 'Stable & Improving'
                                  ? 'cyan'
                                  : 'purple'
                              }
                              size="sm"
                            >
                              {adm.effectiveCondition === 'Ready for Discharge Review' && '⭐ '}
                              {adm.effectiveCondition}
                            </Badge>
                            {adm.effectiveNurseName && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/80 text-[10px] font-semibold">
                                👩‍⚕️ Nurse: {adm.effectiveNurseName}
                              </span>
                            )}
                            {adm.effectiveUpdatedAt && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(adm.effectiveUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          {adm.effectiveVitals && (
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                              {adm.effectiveVitals.bloodPressure && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  BP: <strong>{adm.effectiveVitals.bloodPressure}</strong>
                                </span>
                              )}
                              {adm.effectiveVitals.heartRate && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  HR: <strong>{adm.effectiveVitals.heartRate} bpm</strong>
                                </span>
                              )}
                              {adm.effectiveVitals.temperature && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  Temp: <strong>{adm.effectiveVitals.temperature}°F</strong>
                                </span>
                              )}
                              {adm.effectiveVitals.oxygenLevel && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  SpO2: <strong>{adm.effectiveVitals.oxygenLevel}%</strong>
                                </span>
                              )}
                            </div>
                          )}

                          {adm.effectiveNotes && (
                            <p className="text-[11px] text-slate-600 italic bg-white/80 p-1.5 rounded border border-slate-100">
                              "{adm.effectiveNotes}"
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <Badge
                            variant={
                              adm.status === 'Active'
                                ? 'purple'
                                : adm.status === 'Discharge Initiated'
                                ? 'amber'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {adm.status === 'Active' ? 'Inpatient Care' : adm.status}
                          </Badge>
                          {adm.billingStatus && (
                            <p className="text-[10px]">
                              Billing:{' '}
                              <strong className={adm.billingStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>
                                {adm.billingStatus}
                              </strong>
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {adm.status === 'Active' ? (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleOpenDischargeModal(adm)}
                              leftIcon={<FileCheck className="w-3 h-3" />}
                              className={
                                adm.effectiveCondition === 'Ready for Discharge Review'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }
                            >
                              {adm.effectiveCondition === 'Ready for Discharge Review' ? 'Review & Discharge' : 'Initiate Discharge'}
                            </Button>
                          ) : (
                            <Badge variant="amber" size="sm">
                              Discharge Initiated
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenRxModal(adm)}
                            leftIcon={<Pill className="w-3 h-3 text-emerald-600" />}
                            className="hover:border-emerald-500 hover:text-emerald-700 font-medium"
                          >
                            Prescribe Rx
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handlePrintLatestRx(adm)}
                            leftIcon={<Printer className="w-3 h-3 text-teal-600" />}
                            className="hover:border-teal-500 hover:text-teal-700 font-medium"
                            title="Print medical prescription"
                          >
                            Print Rx
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenRoundNoteModal(adm)}
                            leftIcon={<Plus className="w-3 h-3" />}
                          >
                            Round Note
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate(`/hospital/patients/${adm.patientId}`)}
                          >
                            EHR
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specialist Medical Discharge Modal */}
      <Modal
        isOpen={isDischargeModalOpen}
        onClose={() => {
          setIsDischargeModalOpen(false);
          setSelectedAdmForDischarge(null);
        }}
        title="Specialist Medical Discharge Order"
        maxWidth="lg"
      >
        {selectedAdmForDischarge && (
          <div className="space-y-4 text-xs">
            {/* Patient & Nurse Context Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{selectedAdmForDischarge.patientName}</span>
                <span className="font-mono text-slate-500 font-semibold">{selectedAdmForDischarge.bedNumber} ({selectedAdmForDischarge.wardType})</span>
              </div>
              <p className="text-slate-600"><span className="font-medium text-slate-700">Admission Diagnosis:</span> {selectedAdmForDischarge.reason}</p>

              {selectedAdmForDischarge.nurseCondition && (
                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-teal-900">🩺 Nurse Bedside Condition Update</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold border border-teal-200">
                        👩‍⚕️ Nurse: {selectedAdmForDischarge.nurseUpdatedBy || selectedAdmForDischarge.nurseVitals?.recordedBy || 'Ward Staff Nurse'}
                      </span>
                    </div>
                    <Badge variant={selectedAdmForDischarge.nurseCondition === 'Ready for Discharge Review' ? 'success' : 'cyan'} size="sm">
                      {selectedAdmForDischarge.nurseCondition}
                    </Badge>
                  </div>
                  {selectedAdmForDischarge.nurseVitals && (
                    <div className="flex flex-wrap gap-2 text-[10px] text-teal-800 font-mono">
                      {selectedAdmForDischarge.nurseVitals.bloodPressure && <span>BP: {selectedAdmForDischarge.nurseVitals.bloodPressure}</span>}
                      {selectedAdmForDischarge.nurseVitals.heartRate && <span>Pulse: {selectedAdmForDischarge.nurseVitals.heartRate} bpm</span>}
                      {selectedAdmForDischarge.nurseVitals.temperature && <span>Temp: {selectedAdmForDischarge.nurseVitals.temperature}°F</span>}
                      {selectedAdmForDischarge.nurseVitals.oxygenLevel && <span>SpO2: {selectedAdmForDischarge.nurseVitals.oxygenLevel}%</span>}
                    </div>
                  )}
                  {selectedAdmForDischarge.nurseNotes && (
                    <p className="text-teal-950 italic">"{selectedAdmForDischarge.nurseNotes}"</p>
                  )}
                </div>
              )}
            </div>

            <Textarea
              label="Clinical Discharge Summary & Hospital Course"
              value={dischargeSummary}
              onChange={(e) => setDischargeSummary(e.target.value)}
              rows={3}
              placeholder="Summary of inpatient stay, diagnostics, and recovery status..."
            />

            <Textarea
              label="Take-Home Prescription & Dosages"
              value={dischargePrescriptions}
              onChange={(e) => setDischargePrescriptions(e.target.value)}
              rows={3}
              placeholder="Medicines prescribed for at-home recovery..."
            />

            <Textarea
              label="Discharge Advice, Diet & SOS Follow-Up Instructions"
              value={dischargeAdvice}
              onChange={(e) => setDischargeAdvice(e.target.value)}
              rows={2}
              placeholder="Activity limits, dietary instructions, when to contact hospital..."
            />

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Initiating discharge transitions the patient to Financial Clearance and generates an Inpatient Invoice for Cashier settlement.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDischargeModalOpen(false);
                  setSelectedAdmForDischarge(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDischarge}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                Sign & Initiate Medical Discharge
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Doctor Round Note Modal */}
      <Modal
        isOpen={isRoundNoteModalOpen}
        onClose={() => {
          setIsRoundNoteModalOpen(false);
          setSelectedAdmForRoundNote(null);
        }}
        title="Record Clinical Ward Round Note"
        maxWidth="md"
      >
        {selectedAdmForRoundNote && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-900">{selectedAdmForRoundNote.patientName}</p>
              <p className="text-slate-500 font-mono text-[11px]">{selectedAdmForRoundNote.bedNumber} • {selectedAdmForRoundNote.wardType}</p>
            </div>

            <Textarea
              label="Doctor's Clinical Progress Note"
              value={doctorRoundNote}
              onChange={(e) => setDoctorRoundNote(e.target.value)}
              rows={4}
              placeholder="e.g. Morning rounds completed. Patient afebrile, lungs clear to auscultation. Tolerating oral diet well. Continue current IV antibiotics for 24h..."
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRoundNoteModalOpen(false);
                  setSelectedAdmForRoundNote(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRoundNote}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                Save Round Note
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dedicated Inpatient Prescription & Medications Order Modal */}
      <Modal
        isOpen={isRxModalOpen}
        onClose={() => {
          setIsRxModalOpen(false);
          setSelectedAdmForRx(null);
        }}
        title="Inpatient Bed Prescription & Medication Order"
        maxWidth="lg"
      >
        {selectedAdmForRx && (
          <div className="space-y-4 text-xs">
            {/* Admitted Patient Information Banner */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedAdmForRx.patientName}</h4>
                <p className="text-slate-600 mt-0.5">
                  UHID: <span className="font-mono text-indigo-700 font-semibold">{selectedAdmForRx.patientId}</span> • 
                  Bed: <strong className="font-mono text-emerald-800">{selectedAdmForRx.bedNumber}</strong> ({selectedAdmForRx.wardType})
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Diagnosis: <span className="font-medium text-slate-800">{selectedAdmForRx.reason}</span>
                </p>
              </div>
              <div className="text-right">
                <Badge variant="success" size="sm">Active Inpatient Care</Badge>
                <p className="text-[10px] text-slate-400 mt-1">
                  Transmits to Ward Nurse & Pharmacy
                </p>
              </div>
            </div>

            {/* Quick Medicine Preset Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Quick Inpatient Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'IV Normal Saline 500ml', dose: '500 ml', freq: 'Continuous IV', inst: 'Infuse @ 75ml/hr' },
                  { name: 'Tab Paracetamol 650mg', dose: '1 tab', freq: 'Three times daily (TDS)', inst: 'After food for fever' },
                  { name: 'Inj Pantoprazole 40mg IV', dose: '1 amp', freq: 'Once daily (OD)', inst: 'Slow IV push before meals' },
                  { name: 'Inj Ondansetron 4mg IV', dose: '1 amp', freq: 'SOS / As needed', inst: 'For nausea or vomiting' },
                  { name: 'Tab Cefixime 200mg', dose: '1 tab', freq: 'Twice daily (BD)', inst: 'Post meals x 5 days' },
                  { name: 'Inj Tramadol 50mg IV', dose: '1 amp', freq: 'SOS / Stat', inst: 'Dilute with 100ml NS for severe pain' },
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleQuickAddMed(preset.name, preset.dose, preset.freq, preset.inst)}
                    className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors text-[10px] font-medium"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescribed Medications Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" /> Medication Items ({inpatientRxItems.length})
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleAddInpatientMed}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Add Medicine
                </Button>
              </div>

              {inpatientRxItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-[11px]">Medication #{idx + 1}</span>
                    {inpatientRxItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInpatientMed(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Medicine Name *</label>
                      <Input
                        value={item.medicineName}
                        onChange={(e) => handleInpatientMedChange(idx, 'medicineName', e.target.value)}
                        placeholder="e.g. IV Normal Saline, Tab Pantoprazole 40mg"
                        className="text-xs py-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Dosage</label>
                      <Input
                        value={item.dosage}
                        onChange={(e) => handleInpatientMedChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 1 tab, 500ml"
                        className="text-xs py-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Frequency</label>
                      <Input
                        value={item.frequency}
                        onChange={(e) => handleInpatientMedChange(idx, 'frequency', e.target.value)}
                        placeholder="BD, TDS, IV"
                        className="text-xs py-1"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Duration</label>
                      <Input
                        value={item.duration}
                        onChange={(e) => handleInpatientMedChange(idx, 'duration', e.target.value)}
                        placeholder="During stay, 5 days"
                        className="text-xs py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nurse / Patient Administration Instructions</label>
                    <Input
                      value={item.instructions}
                      onChange={(e) => handleInpatientMedChange(idx, 'instructions', e.target.value)}
                      placeholder="e.g. Administer IV infusion slowly over 2 hours, monitor BP after dose"
                      className="text-xs py-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Textarea
              label="Doctor Clinical Instructions for Nursing & Pharmacy"
              value={inpatientRxNotes}
              onChange={(e) => setInpatientRxNotes(e.target.value)}
              rows={2}
              placeholder="Special instructions, IV drip rate, stat administration remarks..."
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRxModalOpen(false);
                  setSelectedAdmForRx(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveInpatientRx(true)}
                leftIcon={<Printer className="w-3.5 h-3.5 text-emerald-700" />}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold"
              >
                Sign & Print Slip
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveInpatientRx(false)}
                leftIcon={<Pill className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Sign & Issue Prescription
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorInpatients;
