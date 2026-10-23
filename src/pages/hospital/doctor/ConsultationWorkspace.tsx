import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  User,
  HeartPulse,
  Activity,
  AlertTriangle,
  FileText,
  Save,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Plus,
  Trash2,
  Pill,
  ShieldAlert,
  Calendar,
  DoorOpen,
  Lock,
  Eye,
  Check,
  RotateCw,
  CalendarCheck,
  Sparkles,
  History,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { ApiService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Appointment, Consultation, Doctor, Patient } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { NotFound } from '../../auth/NotFound';

interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const ConsultationWorkspace: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'hosp-1';

  // State
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Structured Clinical Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [notes, setNotes] = useState('');

  // Step 1: Follow-Up Recommendation State
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(() => {
    return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  });
  const [followUpIntervalDays, setFollowUpIntervalDays] = useState<number | undefined>(7);
  const [followUpReason, setFollowUpReason] = useState('Review recovery & treatment response');

  const handleSelectFollowUpInterval = (days: number) => {
    setFollowUpIntervalDays(days);
    const targetDate = new Date(Date.now() + days * 86400000);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    setFollowUpDate(`${y}-${m}-${d}`);
  };

  // Vitals State
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState<number | ''>('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [oxygenLevel, setOxygenLevel] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([
    { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily (BD)', duration: '5 days', instructions: 'After food' },
  ]);

  // Load and initialize consultation data
  useEffect(() => {
    if (!appointmentId) return;

    const allApts = MockStorage.getAppointments(hospId);
    let apt = allApts.find((a) => a.id === appointmentId);
    if (!apt) {
      apt = MockStorage.getAppointmentById(appointmentId);
    }

    if (!apt) {
      return;
    }

    setAppointment(apt);

    // Load Patient
    const pat = MockStorage.getPatientById(apt.patientId) || null;
    setPatient(pat);

    // Auto-transition to In Consultation if Checked In
    if (apt.status === 'Checked In') {
      const nowIso = new Date().toISOString();
      MockStorage.updateAppointmentStatus(apt.id, 'In Consultation', { consultationStartedAt: nowIso });
      ApiService.startConsultation?.(apt.id, user?.id).catch(() => {});
      apt.status = 'In Consultation';
      apt.consultationStartedAt = nowIso;
      setAppointment({ ...apt });
    }

    // Retrieve existing consultation draft or create fresh instance
    let existingConsult = MockStorage.getConsultationByAppointmentId(apt.id);
    if (!existingConsult) {
      existingConsult = {
        id: `CON-${apt.id.replace('APT-', '')}-${Date.now().toString().slice(-4)}`,
        hospitalId: apt.hospitalId || hospId,
        appointmentId: apt.id,
        patientId: apt.patientId,
        patientName: apt.patientName,
        doctorId: apt.doctorId || user?.id || 'DOC-101',
        doctorName: apt.doctorName || user?.name || 'Dr. Specialist',
        status: 'Draft',
        chiefComplaint: apt.reason || '',
        symptoms: '',
        examination: '',
        vitals: pat?.vitals || {},
        diagnosis: '',
        treatmentPlan: '',
        prescriptionItems: [],
        followUpInstructions: 'Review in 7 days or SOS if symptoms aggravate',
        notes: '',
        startedAt: apt.consultationStartedAt || new Date().toISOString(),
      };
      MockStorage.saveConsultation(existingConsult);
      ApiService.createConsultation?.({
        id: existingConsult.id,
        hospital: existingConsult.hospitalId,
        appointment: apt.id,
        patient: apt.patientId,
        doctor: existingConsult.doctorId,
        doctor_name: existingConsult.doctorName,
        patient_name: existingConsult.patientName,
        status: 'Draft',
        chief_complaint: existingConsult.chiefComplaint,
      }).catch(() => {});
    }

    setConsultation(existingConsult);

    // Populate clinical fields from existing draft/record
    setChiefComplaint(existingConsult.chiefComplaint || apt.reason || '');
    setSymptoms(existingConsult.symptoms || '');
    setExamination(existingConsult.examination || '');
    setDiagnosis(existingConsult.diagnosis || '');
    setTreatmentPlan(existingConsult.treatmentPlan || '');
    setFollowUpInstructions(existingConsult.followUpInstructions || 'Review in 7 days or SOS if symptoms aggravate');
    setNotes(existingConsult.notes || '');

    // Populate vitals
    const v = existingConsult.vitals || pat?.vitals;
    if (v) {
      setBloodPressure(v.bloodPressure || '');
      setHeartRate(v.heartRate || '');
      setTemperature(v.temperature || '');
      setOxygenLevel(v.oxygenLevel || '');
      setWeightKg(v.weightKg || '');
    }

    // Populate medications
    if (existingConsult.prescriptionItems && existingConsult.prescriptionItems.length > 0) {
      setPrescriptionItems(existingConsult.prescriptionItems);
    }

    // Populate follow-up fields
    if (existingConsult.needsFollowUp !== undefined) {
      setNeedsFollowUp(existingConsult.needsFollowUp);
      if (existingConsult.followUpDate) setFollowUpDate(existingConsult.followUpDate);
      if (existingConsult.followUpIntervalDays) setFollowUpIntervalDays(existingConsult.followUpIntervalDays);
      if (existingConsult.followUpReason) setFollowUpReason(existingConsult.followUpReason);
    }
  }, [appointmentId, hospId]);

  // Step 4: Previous Visit Context for Follow-Up Consultations
  const previousConsultation = useMemo(() => {
    if (!appointment?.patientId) return undefined;
    const all = MockStorage.getConsultations(hospId).filter(
      (c) => c.patientId === appointment.patientId && c.id !== consultation?.id && c.status === 'Finalized'
    );
    return all.sort((a, b) => new Date(b.finalizedAt || 0).getTime() - new Date(a.finalizedAt || 0).getTime())[0];
  }, [appointment?.patientId, hospId, consultation?.id]);

  if (!appointmentId || !appointment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Clinical Consultation Workspace"
          subtitle="Electronic health documentation, OPD encounter notes, and prescription sign-off."
          breadcrumbs={[
            { label: 'Hospital HMS', href: '/hospital/dashboard' },
            { label: 'Doctor Console', href: '/hospital/dashboard' },
            { label: 'Consultation' },
          ]}
        />
        <Card className="p-8 text-center">
          <EmptyState
            title="No Appointment Selected"
            description="Please select an active checked-in patient from your queue to open the consultation workspace."
            actionText="Go to Today's Queue"
            onAction={() => navigate('/hospital/doctor/queue')}
          />
        </Card>
      </div>
    );
  }

  const isFinalized = consultation?.status === 'Finalized' || appointment.status === 'Completed';

  // Medicine items handlers
  const handleAddMedicine = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily (BD)', duration: '5 days', instructions: 'After food' },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof PrescriptionItem, val: string) => {
    const updated = [...prescriptionItems];
    updated[index] = { ...updated[index], [field]: val };
    setPrescriptionItems(updated);
  };

  // Compile full current consultation payload
  const buildConsultationPayload = (statusVal: 'Draft' | 'Finalized'): Consultation => {
    const validPrescriptions = prescriptionItems.filter((p) => p.medicineName.trim().length > 0);
    return {
      id: consultation?.id || `CON-${appointment.id.replace('APT-', '')}`,
      hospitalId: appointment.hospitalId || hospId,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: appointment.doctorId || user?.id || 'DOC-101',
      doctorName: appointment.doctorName || user?.name || 'Dr. Specialist',
      status: statusVal,
      chiefComplaint: chiefComplaint.trim(),
      symptoms: symptoms.trim(),
      examination: examination.trim(),
      vitals: {
        bloodPressure: bloodPressure || undefined,
        heartRate: heartRate !== '' ? Number(heartRate) : undefined,
        temperature: temperature !== '' ? Number(temperature) : undefined,
        oxygenLevel: oxygenLevel !== '' ? Number(oxygenLevel) : undefined,
        weightKg: weightKg !== '' ? Number(weightKg) : undefined,
        recordedAt: new Date().toISOString(),
      },
      diagnosis: diagnosis.trim(),
      treatmentPlan: treatmentPlan.trim(),
      prescriptionItems: validPrescriptions,
      followUpInstructions: followUpInstructions.trim(),
      needsFollowUp,
      followUpDate: needsFollowUp ? followUpDate : undefined,
      followUpIntervalDays: needsFollowUp ? followUpIntervalDays : undefined,
      followUpReason: needsFollowUp ? followUpReason.trim() : undefined,
      notes: notes.trim(),
      startedAt: consultation?.startedAt || appointment.consultationStartedAt || new Date().toISOString(),
      finalizedAt: statusVal === 'Finalized' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (isFinalized) return;
    setIsSavingDraft(true);
    setValidationError('');
    try {
      const payload = buildConsultationPayload('Draft');
      MockStorage.saveConsultation(payload);
      setConsultation(payload);

      // Async backend sync
      await ApiService.saveConsultationDraft?.(payload.id, {
        chief_complaint: payload.chiefComplaint,
        symptoms: payload.symptoms,
        examination: payload.examination,
        vitals: payload.vitals,
        diagnosis: payload.diagnosis,
        treatment_plan: payload.treatmentPlan,
        prescription_items: payload.prescriptionItems,
        follow_up_instructions: payload.followUpInstructions,
        notes: payload.notes,
      }).catch(() => {});

      showToast('Draft Saved', 'Clinical documentation saved. You can safely reload or resume anytime.');
    } catch (e: any) {
      showToast('Draft Saved Locally', 'Draft preserved in local storage.', 'info');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Finalize Consultation Handler
  const handleFinalize = async () => {
    if (isFinalized) return;

    // Required Field Validation
    if (!diagnosis.trim() && !chiefComplaint.trim()) {
      setValidationError('Please enter a clinical diagnosis or chief complaint before finalizing.');
      showToast('Validation Required', 'Diagnosis or Chief Complaint is mandatory to finalize.', 'error');
      return;
    }

    setIsFinalizing(true);
    setValidationError('');

    try {
      const payload = buildConsultationPayload('Finalized');

      // 1. Persist Finalized Consultation & Update Patient EHR
      MockStorage.saveConsultation(payload);
      MockStorage.updateAppointmentStatus(appointment.id, 'Completed', {
        consultationCompletedAt: payload.finalizedAt,
      });

      setConsultation(payload);
      setAppointment({ ...appointment, status: 'Completed', consultationCompletedAt: payload.finalizedAt });

      // 2. Persist to Django REST Framework backend
      await ApiService.finalizeConsultation?.(payload.id, {
        diagnosis: payload.diagnosis,
        treatment_plan: payload.treatmentPlan,
        chief_complaint: payload.chiefComplaint,
        symptoms: payload.symptoms,
        examination: payload.examination,
        vitals: payload.vitals,
        prescription_items: payload.prescriptionItems,
        follow_up_instructions: payload.followUpInstructions,
        notes: payload.notes,
      }).catch(() => {});

      setIsReviewModalOpen(false);
      showToast(
        'Consultation Finalized',
        `Encounter completed. EHR updated with diagnosis "${payload.diagnosis || payload.chiefComplaint}".`
      );

      // Navigate back to queue or patient EHR after short visual confirmation
      setTimeout(() => {
        navigate('/hospital/doctor/queue');
      }, 1500);
    } catch (err: any) {
      showToast('Finalization Notice', err?.message || 'Consultation finalized.', 'info');
      setIsReviewModalOpen(false);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={
          isFinalized
            ? `Finalized Clinical Encounter • ${appointment.patientName}`
            : `Consultation Workspace • ${appointment.patientName}`
        }
        subtitle={`Encounter ID: ${consultation?.id || appointment.id} • ${appointment.doctorName} • OPD Room: ${appointment.opdRoomName || 'Chamber 101'}`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Doctor Console', href: '/hospital/dashboard' },
          { label: "Today's Queue", href: '/hospital/doctor/queue' },
          { label: appointment.patientName },
        ]}
        badge={
          isFinalized ? (
            <Badge variant="purple" dot>Finalized & Signed Off</Badge>
          ) : (
            <Badge variant="warning" dot>In Consultation</Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/doctor/queue')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Queue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/hospital/patients/${appointment.patientId}`)}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              View Full EHR
            </Button>
            {!isFinalized && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(true)}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Review & Finalize
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Patient Demographic & Clinical Allergy Warning Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-base shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">{appointment.patientName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {appointment.patientId}
                </span>
                <Badge variant="indigo" size="sm">
                  {appointment.patientAge} Yrs • {appointment.patientGender}
                </Badge>
                {patient?.bloodGroup && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Blood Group: {patient.bloodGroup}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Appointment ID: <strong className="font-mono text-slate-700">{appointment.id}</strong> • Slot:{' '}
                <strong className="text-slate-700">{appointment.appointmentTime}</strong> • {appointment.appointmentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Consulting Doctor: <strong className="text-slate-800">{appointment.doctorName}</strong>
            </span>
          </div>
        </div>

        {/* Allergy Alert */}
        {patient?.allergies && patient.allergies.length > 0 && patient.allergies[0] !== 'None' && patient.allergies[0] !== 'None Reported' && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-xs uppercase tracking-wide text-rose-700 mr-2">Allergy Warning:</span>
              <span className="text-xs font-medium">{patient.allergies.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Chronic Conditions */}
        {patient?.medicalHistory && patient.medicalHistory.length > 0 && patient.medicalHistory[0] !== 'None' && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 font-semibold">Medical History:</span>
            {patient.medicalHistory.map((cond, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                {cond}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Finalized Notice Banner */}
      {isFinalized && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-purple-800">
                Consultation Finalized & Locked
              </h4>
              <p className="text-xs text-purple-700 mt-0.5">
                This encounter was finalized and signed by {appointment.doctorName}. Clinical documentation is preserved in the patient's EHR audit record.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-purple-800 font-semibold shrink-0">
            <Lock className="w-3.5 h-3.5" /> Locked Record
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Step 4: Follow-up Encounter Baseline & Previous Visit Context */}
      {(appointment.isFollowUp || appointment.type === 'Follow-up' || previousConsultation) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 via-cyan-50 to-indigo-50 border border-teal-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-200/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-600 text-white shadow-xs">
                <RotateCw className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-teal-950">Step 4 — Follow-Up Encounter in Progress</h3>
                  <Badge variant="cyan" size="sm">Follow-Up Review</Badge>
                </div>
                <p className="text-xs text-teal-800 mt-0.5">
                  {appointment.followUpReason 
                    ? `Doctor's Clinical Objective: "${appointment.followUpReason}"`
                    : 'Reviewing clinical response to previous regimen & baseline symptom resolution.'}
                </p>
              </div>
            </div>
            {previousConsultation?.finalizedAt && (
              <span className="text-[11px] font-mono text-teal-800 bg-white/80 px-2.5 py-1 rounded-md border border-teal-200 flex items-center gap-1.5 shrink-0">
                <History className="w-3.5 h-3.5 text-teal-600" />
                Previous Encounter: {new Date(previousConsultation.finalizedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {previousConsultation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white/90 border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Previous Diagnosis</span>
                <p className="font-semibold text-slate-800 line-clamp-2">
                  {previousConsultation.diagnosis || previousConsultation.chiefComplaint || 'Unspecified'}
                </p>
                {previousConsultation.treatmentPlan && (
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                    Plan: {previousConsultation.treatmentPlan}
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-white/90 border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Prior Prescriptions</span>
                {previousConsultation.prescriptionItems && previousConsultation.prescriptionItems.length > 0 ? (
                  <ul className="space-y-0.5 text-[11px] text-slate-700">
                    {previousConsultation.prescriptionItems.slice(0, 2).map((med, i) => (
                      <li key={i} className="truncate font-medium text-emerald-800">
                        • {med.medicineName} ({med.dosage})
                      </li>
                    ))}
                    {previousConsultation.prescriptionItems.length > 2 && (
                      <li className="text-[10px] text-slate-400">+{previousConsultation.prescriptionItems.length - 2} more</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">No medications recorded</p>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-white/90 border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Previous Vitals Baseline</span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className="text-slate-600">BP: <strong className="text-slate-800">{previousConsultation.vitals?.bloodPressure || '—'}</strong></span>
                  <span className="text-slate-600">HR: <strong className="text-slate-800">{previousConsultation.vitals?.heartRate ? `${previousConsultation.vitals.heartRate} bpm` : '—'}</strong></span>
                  <span className="text-slate-600">Temp: <strong className="text-slate-800">{previousConsultation.vitals?.temperature ? `${previousConsultation.vitals.temperature}°F` : '—'}</strong></span>
                  <span className="text-slate-600">SpO2: <strong className="text-slate-800">{previousConsultation.vitals?.oxygenLevel ? `${previousConsultation.vitals.oxygenLevel}%` : '—'}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinical Workspace Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Clinical Findings, Diagnosis & Treatment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Chief Complaint & Symptoms */}
          <Card>
            <CardHeader
              title="1. Chief Complaint & Subjective History"
              subtitle="Presenting symptoms, onset, and patient's clinical history."
            />
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chief Complaint <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Acute migraine with light sensitivity, persistent cough for 4 days..."
                  disabled={isFinalized}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  History of Present Illness & Symptoms
                </label>
                <Textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe severity, duration, aggravating or relieving factors, associated symptoms..."
                  rows={3}
                  disabled={isFinalized}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Clinical Examination */}
          <Card>
            <CardHeader
              title="2. Clinical & Physical Examination"
              subtitle="Objective findings, systemic evaluation, and physical signs."
            />
            <CardContent>
              <Textarea
                value={examination}
                onChange={(e) => setExamination(e.target.value)}
                placeholder="e.g. General condition fair. Chest: clear to auscultation bilaterally. CVS: S1 S2 heard, no murmurs. Abdomen: soft, non-tender..."
                rows={3}
                disabled={isFinalized}
              />
            </CardContent>
          </Card>

          {/* Section 3: Diagnosis & Assessment */}
          <Card className="border-indigo-200/80 shadow-xs">
            <CardHeader
              title="3. Clinical Diagnosis & Assessment"
              subtitle="Primary diagnosis, ICD-10 or clinical condition (persisted to patient EHR)."
            />
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Clinical Diagnosis <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Essential Hypertension (I10), Acute Bronchitis, Migraine with Aura..."
                  className="font-bold text-slate-900 border-indigo-300 focus:ring-indigo-500"
                  disabled={isFinalized}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Treatment & Care Plan
                </label>
                <Textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Clinical treatment strategy, therapeutic interventions, lifestyle modifications, dietary advice..."
                  rows={3}
                  disabled={isFinalized}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Prescription & Medications */}
          <Card>
            <CardHeader
              title="4. Prescription & Medications"
              subtitle="Prescribed pharmacotherapy with dosage, frequency, and instructions."
              action={
                !isFinalized && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleAddMedicine}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    Add Medication
                  </Button>
                )
              }
            />
            <CardContent className="space-y-3">
              {prescriptionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-emerald-600" /> Medicine #{idx + 1}
                    </span>
                    {!isFinalized && prescriptionItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Medicine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Medicine Name</label>
                      <Input
                        value={item.medicineName}
                        onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                        placeholder="e.g. Amoxicillin 500mg, Paracetamol"
                        className="text-xs py-1"
                        disabled={isFinalized}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Dosage</label>
                      <Input
                        value={item.dosage}
                        onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 1 tab, 5ml"
                        className="text-xs py-1"
                        disabled={isFinalized}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Frequency</label>
                      <Input
                        value={item.frequency}
                        onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                        placeholder="e.g. TID, Once daily"
                        className="text-xs py-1"
                        disabled={isFinalized}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Duration</label>
                      <Input
                        value={item.duration}
                        onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                        placeholder="e.g. 5 days, 1 month"
                        className="text-xs py-1"
                        disabled={isFinalized}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Special Instructions</label>
                    <Input
                      value={item.instructions}
                      onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                      placeholder="e.g. Take after food, avoid alcohol, take with warm water"
                      className="text-xs py-1 text-slate-600"
                      disabled={isFinalized}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 5: Step 1 Doctor Follow-Up Initiation & Instructions */}
          <Card className={needsFollowUp ? 'border-teal-300 ring-1 ring-teal-300/50' : ''}>
            <CardHeader
              title="5. Follow-Up Recommendation & Discharge Instructions"
              subtitle="Step 1: Clinician initiates follow-up order for receptionist scheduling."
            />
            <CardContent className="space-y-4">
              {/* Doctor Follow-up toggle */}
              <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="needsFollowUp"
                      checked={needsFollowUp}
                      onChange={(e) => setNeedsFollowUp(e.target.checked)}
                      disabled={isFinalized}
                      className="w-4 h-4 rounded text-teal-600 border-teal-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="needsFollowUp" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Patient Requires Clinical Follow-Up Appointment
                    </label>
                  </div>
                  {needsFollowUp && (
                    <Badge variant="cyan" size="sm" className="font-semibold">
                      Follow-Up Active
                    </Badge>
                  )}
                </div>

                {needsFollowUp && (
                  <div className="pt-2 border-t border-teal-200/70 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                        Recommended Interval (Days)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '3 Days (SOS/Acute)', days: 3 },
                          { label: '5 Days', days: 5 },
                          { label: '7 Days (1 Week)', days: 7 },
                          { label: '14 Days (2 Weeks)', days: 14 },
                          { label: '30 Days (1 Month)', days: 30 },
                        ].map((item) => (
                          <button
                            key={item.days}
                            type="button"
                            onClick={() => handleSelectFollowUpInterval(item.days)}
                            disabled={isFinalized}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              followUpIntervalDays === item.days
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Target Follow-Up Date <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => {
                            setFollowUpDate(e.target.value);
                            setFollowUpIntervalDays(undefined);
                          }}
                          disabled={isFinalized}
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Clinical Reason for Follow-Up <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={followUpReason}
                          onChange={(e) => setFollowUpReason(e.target.value)}
                          placeholder="e.g. Review recovery & lab reports, check BP, suture removal"
                          disabled={isFinalized}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Quick Clinical Reasons:</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          'Review recovery & symptom resolution',
                          'Pathology / Lab report evaluation',
                          'Medication titration & efficacy',
                          'Wound dressing / Suture removal',
                          'Post-op monitoring',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setFollowUpReason(chip)}
                            disabled={isFinalized}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-700"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-teal-800 bg-teal-100/60 p-2 rounded-lg">
                      💡 <strong>Workflow Note:</strong> Finalizing this encounter automatically sends this request to the <strong>Reception Desk Queue (Step 2)</strong> and triggers a patient portal confirmation notice (Step 3).
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discharge & Follow-Up Instructions for Patient
                </label>
                <Input
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  placeholder="e.g. Review after 1 week with blood test report, SOS in emergency room if fever > 102°F"
                  disabled={isFinalized}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Internal Clinical Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Confidential clinician observations, differential diagnoses considered, referral remarks..."
                  rows={2}
                  disabled={isFinalized}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Vitals Strip & Encounter Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Objective Clinical Vitals Panel */}
          <Card>
            <CardHeader
              title="Objective Clinical Vitals"
              subtitle="Physiological measurements during this encounter."
            />
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" /> Blood Pressure (mmHg)
                </label>
                <Input
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                  disabled={isFinalized}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> Heart Rate (bpm)
                </label>
                <Input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : '')}
                  placeholder="72"
                  disabled={isFinalized}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Oxygen Saturation SpO2 (%)
                </label>
                <Input
                  type="number"
                  value={oxygenLevel}
                  onChange={(e) => setOxygenLevel(e.target.value ? Number(e.target.value) : '')}
                  placeholder="98"
                  disabled={isFinalized}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  Temperature (°F)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : '')}
                  placeholder="98.6"
                  disabled={isFinalized}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                  placeholder="70"
                  disabled={isFinalized}
                />
              </div>
            </CardContent>
          </Card>

          {/* Encounter Actions Panel */}
          <Card className="border-emerald-200/90 shadow-sm">
            <CardHeader
              title="Encounter Sign-Off"
              subtitle="Save draft or finalize consultation with digital clinical signature."
            />
            <CardContent className="space-y-3">
              {!isFinalized ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsReviewModalOpen(true)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 shadow-sm"
                  >
                    Review & Finalize Encounter
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    className="w-full"
                  >
                    {isSavingDraft ? 'Saving Draft...' : 'Save As In-Progress Draft'}
                  </Button>

                  <p className="text-[11px] text-slate-500 leading-relaxed text-center pt-1">
                    Finalizing updates the patient's EHR chart, marks the appointment completed, and logs the prescription to the hospital registry.
                  </p>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-purple-50 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Consultation Finalized</h4>
                  <p className="text-[11px] text-slate-500">
                    Signed by {appointment.doctorName} on{' '}
                    {consultation?.finalizedAt ? new Date(consultation.finalizedAt).toLocaleDateString() : 'Today'}.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/hospital/patients/${appointment.patientId}`)}
                    className="w-full mt-2"
                  >
                    Go to Patient EHR
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review & Finalize Confirmation Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review Clinical Encounter Before Sign-Off"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">{appointment.patientName}</h4>
            <p className="text-slate-500 mt-0.5">
              Patient ID: <span className="font-mono text-indigo-600 font-semibold">{appointment.patientId}</span> • Attending Clinician: {appointment.doctorName}
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Chief Complaint</span>
              <p className="font-semibold text-slate-900 mt-0.5">{chiefComplaint || 'None specified'}</p>
            </div>

            <div className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50">
              <span className="text-[10px] font-bold text-indigo-500 uppercase block">Clinical Diagnosis</span>
              <p className="font-bold text-indigo-900 text-sm mt-0.5">{diagnosis || chiefComplaint || 'Not Specified'}</p>
            </div>

            {treatmentPlan && (
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Treatment & Care Plan</span>
                <p className="text-slate-700 mt-0.5">{treatmentPlan}</p>
              </div>
            )}

            {prescriptionItems.some((p) => p.medicineName.trim().length > 0) && (
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prescribed Pharmacotherapy</span>
                <ul className="space-y-1">
                  {prescriptionItems
                    .filter((p) => p.medicineName.trim().length > 0)
                    .map((p, idx) => (
                      <li key={idx} className="text-slate-800 flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="font-bold text-emerald-700">• {p.medicineName}</span>
                        <span className="text-slate-500 text-[11px]">{p.dosage} — {p.frequency} ({p.duration})</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {followUpInstructions && (
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Follow-Up Instructions</span>
                <p className="text-slate-700 mt-0.5">{followUpInstructions}</p>
              </div>
            )}

            {needsFollowUp ? (
              <div className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/70">
                <span className="text-[10px] font-bold text-teal-700 uppercase block">Step 1: Clinical Follow-Up Requested</span>
                <p className="font-semibold text-teal-900 mt-0.5">
                  Target Date: <span className="font-mono">{followUpDate}</span> ({followUpIntervalDays ? `${followUpIntervalDays} days` : 'Custom Date'})
                </p>
                <p className="text-xs text-teal-800 mt-0.5">Reason: {followUpReason || 'Routine clinical review'}</p>
                <span className="text-[10px] text-teal-600 italic block mt-1">
                  Will appear in Receptionist Queue for booking (Step 2) and notify patient (Step 3).
                </span>
              </div>
            ) : (
              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[11px]">
                No follow-up appointment requested for this encounter.
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
            <strong>Clinical Notice:</strong> Finalizing this consultation locks the medical documentation, updates the patient's EHR records, and completes appointment <span className="font-mono font-semibold">{appointment.id}</span>.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={isFinalizing}
            >
              Back to Editing
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isFinalizing ? 'Finalizing...' : 'Confirm & Finalize Consultation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConsultationWorkspace;
