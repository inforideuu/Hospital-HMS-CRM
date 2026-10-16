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
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { NotFound } from '../../auth/NotFound';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const patient = MockStorage.getPatientById(id || '');
  const appointments = MockStorage.getAppointments(hospId).filter((a) => a.patientId === id);
  const admissions = MockStorage.getAdmissions(hospId).filter((a) => a.patientId === id);
  const invoices = MockStorage.getInvoices(hospId).filter((i) => i.patientId === id);
  const labOrders = MockStorage.getLabOrders(hospId).filter((l) => l.patientId === id);

  const [activeTab, setActiveTab] = useState('appointments');

  if (!patient) {
    return <NotFound />;
  }

  const vitals = patient.vitals || {
    bloodPressure: '120/80 mmHg',
    heartRate: 72,
    temperature: 98.6,
    oxygenLevel: 99,
    weightKg: 70,
    recordedAt: '2026-09-24 08:30',
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
                  { id: 'appointments', label: 'Consultations', count: appointments.length, icon: <Calendar className="w-3.5 h-3.5" /> },
                  { id: 'admissions', label: 'IPD Stays', count: admissions.length, icon: <BedDouble className="w-3.5 h-3.5" /> },
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
                          <Badge variant="indigo" size="sm">{apt.status}</Badge>
                        </div>
                        <p className="text-slate-500 mt-1">Reason: <span className="text-slate-700">{apt.reason}</span></p>
                        {apt.notes && <p className="text-[11px] text-slate-500 mt-1 italic">Notes: {apt.notes}</p>}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>{apt.appointmentDate} at {apt.appointmentTime}</span>
                          <span>Fee: ${apt.fee} ({apt.paymentStatus})</span>
                        </div>
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
                      <div key={adm.id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{adm.wardType} — {adm.bedNumber}</span>
                            <Badge variant={adm.status === 'Active' ? 'purple' : 'neutral'} size="sm">
                              {adm.status}
                            </Badge>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">{adm.id}</span>
                        </div>
                        <p className="text-slate-600">Attending Specialist: <span className="font-semibold text-slate-800">{adm.doctorName}</span></p>
                        <p className="text-slate-500">{adm.reason}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>Admitted: {adm.admissionDate}</span>
                          <span>Initial Deposit: ${adm.initialDeposit}</span>
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
                          <span>Total Amount: ${inv.totalAmount.toLocaleString()}</span>
                          <span className="text-emerald-600">Paid: ${inv.amountPaid.toLocaleString()}</span>
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
    </div>
  );
};
