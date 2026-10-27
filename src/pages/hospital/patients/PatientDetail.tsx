import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  HeartPulse,
  Activity,
  AlertTriangle,
  Calendar,
  BedDouble,
  Receipt,
  FlaskConical,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowLeft,
  Droplet,
  ShieldAlert,
  FileText,
  CheckCircle2,
  Download,
  Plus,
  Printer,
} from 'lucide-react';
import { printPrescription } from '../../../utils/prescriptionPrint';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { NotFound } from '../../auth/NotFound';
import { isCapabilityAllowedForTier } from '../../../constants/planCapabilities';

import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Patient } from '../../../types';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const isNurseOrAdmin =
    user?.role === 'nurse' ||
    user?.role === 'hospital_admin' ||
    user?.role === 'super_admin';

  const [patient, setPatient] = useState<Patient | undefined>(() => MockStorage.getPatientById(id || ''));
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressure: '120/80 mmHg',
    heartRate: 72,
    temperature: 98.6,
    oxygenLevel: 99,
    weightKg: 70,
    allergies: '',
    medicalHistory: '',
  });

  const appointments = MockStorage.getAppointments(hospId).filter((a) => a.patientId === id);
  const consultations = MockStorage.getConsultations(hospId).filter((c) => c.patientId === id);
  const prescriptions = MockStorage.getPrescriptions(id, hospId);
  const admissions = MockStorage.getAdmissions(hospId).filter((a) => a.patientId === id);
  const invoices = MockStorage.getInvoices(hospId).filter((i) => i.patientId === id);
  const labOrders = MockStorage.getLabOrders(hospId).filter((l) => l.patientId === id);

  const [activeTab, setActiveTab] = useState('appointments');
  const currentTier = currentHospital?.planTier;
  const hasBedCapability = isCapabilityAllowedForTier(currentTier, 'admissions_beds');

  const isPatientCheckedIn =
    patient?.status === 'Inpatient' ||
    appointments.some(
      (a) =>
        a.status === 'Checked In' ||
        a.status === 'In Consultation' ||
        a.status === 'Completed'
    );

  if (!patient) {
    return <NotFound />;
  }

  const handleOpenVitalsModal = () => {
    if (!isNurseOrAdmin) {
      showToast(
        'Access Restricted',
        'Only Registered Nurses and Hospital Admins are authorized to record or update Clinical Vitals Intake and Clinical Warnings.',
        'error'
      );
      return;
    }
    if (!isPatientCheckedIn) {
      showToast(
        'Check-In Required',
        'Clinical Vitals Intake and Clinical Warnings can only be entered after the patient has checked in at reception.',
        'warning'
      );
      return;
    }
    setVitalsForm({
      bloodPressure: patient.vitals?.bloodPressure || '120/80 mmHg',
      heartRate: patient.vitals?.heartRate || 72,
      temperature: patient.vitals?.temperature || 98.6,
      oxygenLevel: patient.vitals?.oxygenLevel || 99,
      weightKg: patient.vitals?.weightKg || 70,
      allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : '',
      medicalHistory: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : '',
    });
    setIsVitalsModalOpen(true);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    if (!isNurseOrAdmin || !isPatientCheckedIn) {
      showToast('Validation Error', 'Authorized Nurse/Admin role and patient check-in required.', 'error');
      return;
    }

    const allergiesArray = vitalsForm.allergies
      ? vitalsForm.allergies.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const historyArray = vitalsForm.medicalHistory
      ? vitalsForm.medicalHistory.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const updated: Patient = {
      ...patient,
      allergies: allergiesArray,
      medicalHistory: historyArray,
      vitals: {
        bloodPressure: vitalsForm.bloodPressure || '120/80 mmHg',
        heartRate: Number(vitalsForm.heartRate) || 72,
        temperature: Number(vitalsForm.temperature) || 98.6,
        oxygenLevel: Number(vitalsForm.oxygenLevel) || 99,
        weightKg: Number(vitalsForm.weightKg) || 70,
        recordedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        recordedBy: user?.name,
        recordedRole: user?.role === 'nurse' ? 'Registered Nurse' : 'Hospital Admin',
      },
    };
    MockStorage.savePatient(updated);
    setPatient(updated);
    setIsVitalsModalOpen(false);
    showToast('Clinical Intake Recorded', `Vitals and clinical warnings for ${patient.name} successfully saved to EHR.`);
  };

  const vitals = patient.vitals || {
    bloodPressure: '120/80 mmHg',
    heartRate: 72,
    temperature: 98.6,
    oxygenLevel: 99,
    weightKg: 70,
    recordedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={patient.name}
        subtitle={`EHR Identification: ${patient.id} • Registered: ${patient.registeredDate}`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Patients', href: '/hospital/patients' },
          { label: patient.name },
        ]}
        badge={
          patient.status === 'Inpatient' ? (
            <Badge variant="purple" dot>Inpatient ({patient.roomBedNumber || 'ICU'})</Badge>
          ) : (
            <Badge variant="success" dot>{patient.status}</Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/patients')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Patients
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenVitalsModal}
              leftIcon={<Activity className="w-3.5 h-3.5" />}
            >
              Update Vitals
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                MockStorage.exportToCSV(`Patient_Chart_${patient.id}`, [patient]);
                showToast('Chart Exported', 'EHR summary downloaded.');
              }}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Chart
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/appointments')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Book OPD Visit
            </Button>
          </div>
        }
      />

      {/* Real-Time Clinical Vitals Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Blood Pressure</p>
          <p className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-500" />
            {vitals.bloodPressure}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pulse / Heart Rate</p>
          <p className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            {vitals.heartRate} <span className="text-xs font-normal text-slate-500">bpm</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Oxygen (SpO2)</p>
          <p className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            {vitals.oxygenLevel}%
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Temperature</p>
          <p className="text-base font-bold text-slate-900 mt-1">
            {vitals.temperature}°F
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Weight</p>
          <p className="text-base font-bold text-slate-900 mt-1">
            {vitals.weightKg} <span className="text-xs font-normal text-slate-500">kg</span>
          </p>
        </div>
      </div>

      {/* Allergies and Warnings Bar */}
      {patient.allergies.length > 0 && patient.allergies[0] !== 'None Reported' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wide text-rose-700">Clinical Allergy Alert</h4>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {patient.allergies.map((a, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                  ⚠️ {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patient Profile & Emergency Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Demographics Card */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader title="Patient Profile" subtitle="Demographics & identity" />
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Age & Gender</span>
                  <span className="font-bold text-slate-800">{patient.age} Yrs • {patient.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Blood Group</span>
                  <span className="font-bold text-rose-600">{patient.bloodGroup}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="text-slate-700">{patient.dateOfBirth}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Primary Phone</span>
                  <span className="font-semibold text-slate-800">{patient.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email Address</span>
                  <span className="text-slate-700 truncate max-w-[150px]">{patient.email}</span>
                </div>
                {patient.assignedDoctorName && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Assigned Doctor</span>
                    <span className="font-bold text-indigo-600">{patient.assignedDoctorName}</span>
                  </div>
                )}
                {patient.roomBedNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Room / Bed</span>
                    <span className="font-bold text-slate-800">{patient.roomBedNumber}</span>
                  </div>
                )}
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">Address:</span>
                  <span className="text-slate-700">{patient.address}</span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                  Emergency Contact
                </p>
                <p className="font-semibold text-slate-900">{patient.emergencyContactName}</p>
                <p className="text-slate-500 text-[11px]">{patient.emergencyContactPhone} ({patient.emergencyContactRelation})</p>
              </div>

              {/* Past Medical Conditions */}
              <div>
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1.5">
                  Chronic Conditions
                </p>
                <div className="flex flex-wrap gap-1">
                  {patient.medicalHistory.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Tabbed Medical History */}
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <Tabs
                tabs={[
                  { id: 'appointments', label: 'Consultations & OPD', count: appointments.length, icon: <Calendar className="w-3.5 h-3.5" /> },
                  { id: 'clinical_notes', label: 'EHR Clinical Notes', count: consultations.length, icon: <FileText className="w-3.5 h-3.5" /> },
                  { id: 'prescriptions', label: 'Prescriptions', count: prescriptions.length, icon: <Activity className="w-3.5 h-3.5" /> },
                  ...(hasBedCapability ? [{ id: 'admissions', label: 'IPD Stays', count: admissions.length, icon: <BedDouble className="w-3.5 h-3.5" /> }] : []),
                  { id: 'billing', label: 'Invoices', count: invoices.length, icon: <Receipt className="w-3.5 h-3.5" /> },
                  { id: 'laboratory', label: 'Diagnostics', count: labOrders.length, icon: <FlaskConical className="w-3.5 h-3.5" /> },
                ]}
                activeTab={activeTab}
                onChange={(t) => setActiveTab(t)}
                variant="pills"
              />
            </div>

            <CardContent className="flex-1 p-5">
              {/* Tab 1: Appointments */}
              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  {appointments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No recorded appointment history for this patient.</p>
                  ) : (
                    appointments.map((apt) => (
                      <div key={apt.id} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{apt.doctorName}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">{apt.departmentName}</span>
                          </div>
                          <Badge
                            variant={
                              apt.status === 'Completed'
                                ? 'success'
                                : apt.status === 'In Consultation'
                                ? 'indigo'
                                : apt.status === 'Checked In'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {apt.status}
                          </Badge>
                        </div>
                        <p className="text-slate-500 mt-1">Reason: <span className="text-slate-700">{apt.reason}</span></p>
                        {apt.notes && <p className="text-[11px] text-slate-500 mt-1 italic">Notes: {apt.notes}</p>}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>{apt.appointmentDate} at {apt.appointmentTime}</span>
                          <div className="flex items-center gap-2">
                            <span>Fee: ₹{apt.fee} ({apt.paymentStatus})</span>
                            {apt.status === 'Checked In' && (
                              <button
                                onClick={() => navigate(`/hospital/consultation/${apt.id}`)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                              >
                                Start Consultation
                              </button>
                            )}
                            {apt.status === 'In Consultation' && (
                              <button
                                onClick={() => navigate(`/hospital/consultation/${apt.id}`)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                              >
                                Resume Workspace
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Clinical Notes from Consultations */}
              {activeTab === 'clinical_notes' && (
                <div className="space-y-4">
                  {consultations.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No clinical consultation notes recorded yet.</p>
                  ) : (
                    consultations.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">Dr. {c.doctorName}</span>
                            <span className="text-slate-400 ml-2">({c.status})</span>
                          </div>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {c.finalizedAt ? new Date(c.finalizedAt).toLocaleString() : c.startedAt ? new Date(c.startedAt).toLocaleString() : ''}
                          </span>
                        </div>

                        {c.chiefComplaint && (
                          <div>
                            <span className="font-semibold text-slate-700">Chief Complaint: </span>
                            <span className="text-slate-800">{c.chiefComplaint}</span>
                          </div>
                        )}

                        {c.diagnosis && (
                          <div className="p-2.5 bg-teal-50/60 rounded-lg border border-teal-100">
                            <span className="font-semibold text-teal-900">Diagnosis: </span>
                            <span className="text-teal-950 font-bold">{c.diagnosis}</span>
                          </div>
                        )}

                        {c.symptoms && (
                          <div>
                            <span className="font-semibold text-slate-700">Presenting Symptoms: </span>
                            <span className="text-slate-600">{c.symptoms}</span>
                          </div>
                        )}

                        {c.examination && (
                          <div>
                            <span className="font-semibold text-slate-700">Physical Examination: </span>
                            <span className="text-slate-600">{c.examination}</span>
                          </div>
                        )}

                        {c.treatmentPlan && (
                          <div>
                            <span className="font-semibold text-slate-700">Treatment Plan: </span>
                            <span className="text-slate-600">{c.treatmentPlan}</span>
                          </div>
                        )}

                        {c.followUpInstructions && (
                          <div className="p-2 bg-slate-50 rounded text-slate-600">
                            <span className="font-semibold text-slate-700">Follow-up: </span>
                            {c.followUpInstructions}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Prescriptions */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {prescriptions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No prescriptions on record for this patient.</p>
                  ) : (
                    prescriptions.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-slate-900">Prescription {p.id}</span>
                            <span className="text-slate-500 ml-2">by Dr. {p.doctorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={p.status === 'Active' ? 'success' : 'neutral'} size="sm">
                              {p.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="xs"
                              leftIcon={<Printer className="w-3.5 h-3.5" />}
                              onClick={() =>
                                printPrescription(p, {
                                  hospitalName: currentHospital?.name,
                                  patientAge: patient.age,
                                  patientGender: patient.gender,
                                  patientPhone: patient.phone,
                                })
                              }
                            >
                              Print
                            </Button>
                          </div>
                        </div>
                        <div className="font-medium text-slate-700">Diagnosis: {p.diagnosis}</div>
                        <div className="space-y-1.5">
                          {p.medications.map((m, idx) => (
                            <div key={idx} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800">{m.medicineName}</span>
                                <span className="text-slate-500 ml-2">({m.dosage})</span>
                              </div>
                              <span className="text-slate-600">{m.frequency} • {m.duration}</span>
                            </div>
                          ))}
                        </div>
                        {p.notes && <p className="text-[11px] text-slate-500 italic">Instructions: {p.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: IPD Admissions */}
              {activeTab === 'admissions' && (
                <div className="space-y-3">
                  {admissions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No inpatient admissions on record.</p>
                  ) : (
                    admissions.map((adm) => (
                      <div key={adm.id} className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{adm.wardType} — {adm.bedNumber}</span>
                            <Badge
                              variant={
                                adm.status === 'Active' ? 'purple' :
                                adm.status === 'Discharge Initiated' ? 'amber' :
                                adm.status === 'Discharged' ? 'success' : 'neutral'
                              }
                              size="sm"
                            >
                              {adm.status}
                            </Badge>
                            {adm.billingStatus && (
                              <Badge variant={adm.billingStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                                Bill: {adm.billingStatus}
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">{adm.id}</span>
                        </div>
                        <p className="text-slate-600">Attending Specialist: <span className="font-semibold text-slate-800">{adm.doctorName}</span></p>
                        <p className="text-slate-500"><span className="font-medium text-slate-700">Diagnosis / Reason:</span> {adm.reason}</p>

                        {/* Nurse Observation & Vitals */}
                        {adm.nurseCondition && (
                          <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-100 text-[11px] space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-teal-900">🩺 Nurse Monitoring Update</span>
                                {(adm.nurseUpdatedBy || adm.nurseVitals?.recordedBy) && (
                                  <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-medium border border-teal-200">
                                    👩‍⚕️ Nurse: {adm.nurseUpdatedBy || adm.nurseVitals?.recordedBy}
                                  </span>
                                )}
                              </div>
                              <Badge variant={adm.nurseCondition === 'Ready for Discharge Review' ? 'success' : 'cyan'} size="sm">
                                {adm.nurseCondition}
                              </Badge>
                            </div>
                            {adm.nurseVitals && (
                              <div className="flex flex-wrap gap-2 text-[10px] text-teal-800 font-mono">
                                {adm.nurseVitals.bloodPressure && <span>BP: {adm.nurseVitals.bloodPressure}</span>}
                                {adm.nurseVitals.heartRate && <span>Pulse: {adm.nurseVitals.heartRate} bpm</span>}
                                {adm.nurseVitals.temperature && <span>Temp: {adm.nurseVitals.temperature}°F</span>}
                                {adm.nurseVitals.oxygenLevel && <span>SpO2: {adm.nurseVitals.oxygenLevel}%</span>}
                              </div>
                            )}
                            {adm.nurseNotes && <p className="text-teal-950 italic">"{adm.nurseNotes}"</p>}
                          </div>
                        )}

                        {/* Doctor Discharge Note */}
                        {adm.dischargeSummary && (
                          <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-indigo-900">👨‍⚕️ Specialist Discharge Summary</span>
                              <span className="text-[10px] text-indigo-600">By {adm.dischargeDoctorName}</span>
                            </div>
                            <p className="text-indigo-950">{adm.dischargeSummary}</p>
                            {adm.dischargeAdvice && (
                              <p className="text-[10px] text-indigo-800 font-medium">Advice: {adm.dischargeAdvice}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>Admitted: {adm.admissionDate}</span>
                          {adm.dischargeDate && <span>Discharged: {adm.dischargeDate}</span>}
                          <span>Deposit: ₹{adm.initialDeposit?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Invoices */}
              {activeTab === 'billing' && (
                <div className="space-y-3">
                  {invoices.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No billing invoices generated yet.</p>
                  ) : (
                    invoices.map((inv) => (
                      <div key={inv.id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{inv.id}</span>
                            <span className="text-[11px] text-slate-500 ml-2">Issued: {inv.issueDate}</span>
                          </div>
                          <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'} size="sm">
                            {inv.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>Total Amount: ₹{inv.totalAmount.toLocaleString()}</span>
                          <span className="text-emerald-600">Paid: ₹{inv.amountPaid.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Laboratory */}
              {activeTab === 'laboratory' && (
                <div className="space-y-3">
                  {labOrders.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No laboratory diagnostics on record.</p>
                  ) : (
                    labOrders.map((lab) => (
                      <div key={lab.id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{lab.testName}</span>
                          <Badge variant={lab.status === 'Completed' ? 'success' : 'warning'} size="sm">
                            {lab.status}
                          </Badge>
                        </div>
                        {lab.resultValue && (
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800">
                            Result: <span className="font-bold text-indigo-700">{lab.resultValue}</span> (Ref: {lab.referenceRange})
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400">Ordered by {lab.doctorName} on {lab.orderDate}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dynamic Vitals & Clinical Intake Update Modal */}
      <Modal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        title="Clinical Vitals & Medical History Intake"
        subtitle={`Recording clinical intake for ${patient.name}`}
      >
        <form onSubmit={handleSaveVitals} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Clinical Vitals Intake
            </h4>
            <Badge variant="success" size="sm" dot>
              {user?.role === 'nurse' ? 'Registered Nurse' : 'Hospital Admin'} Authorized
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Blood Pressure"
              value={vitalsForm.bloodPressure}
              onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
              placeholder="120/80 mmHg"
              required
            />
            <Input
              label="Pulse / Heart Rate (bpm)"
              type="number"
              value={vitalsForm.heartRate}
              onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: Number(e.target.value) })}
              placeholder="72"
              required
            />
            <Input
              label="Body Temp (°F)"
              type="number"
              step="0.1"
              value={vitalsForm.temperature}
              onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: Number(e.target.value) })}
              placeholder="98.6"
              required
            />
            <Input
              label="Oxygen Saturation SpO2 (%)"
              type="number"
              value={vitalsForm.oxygenLevel}
              onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenLevel: Number(e.target.value) })}
              placeholder="99"
              required
            />
            <Input
              label="Body Weight (kg)"
              type="number"
              step="0.1"
              value={vitalsForm.weightKg}
              onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: Number(e.target.value) })}
              placeholder="70"
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Clinical Warnings & Medical History
              </h4>
              <span className="text-[11px] text-slate-400">Post Check-In Intake</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Known Drug / Food Allergies"
                value={vitalsForm.allergies}
                onChange={(e) => setVitalsForm({ ...vitalsForm, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Peanuts, Sulfa"
              />
              <Input
                label="Past Medical Conditions"
                value={vitalsForm.medicalHistory}
                onChange={(e) => setVitalsForm({ ...vitalsForm, medicalHistory: e.target.value })}
                placeholder="e.g. Hypertension, Type 2 Diabetes"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsVitalsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Clinical Intake
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

