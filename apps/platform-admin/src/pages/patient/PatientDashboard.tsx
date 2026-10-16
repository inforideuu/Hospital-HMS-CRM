import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Calendar,
  Pill,
  FlaskConical,
  Receipt,
  Truck,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Plus,
  Activity,
  FileText,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const patientId = user?.patientId || 'PAT-1001';
  const patient = MockStorage.getPatientById(patientId);
  const appointments = MockStorage.getAppointments(undefined, patientId);
  const prescriptions = MockStorage.getPrescriptions(patientId);
  const labOrders = MockStorage.getLabOrders(undefined, patientId);
  const invoices = MockStorage.getInvoices(undefined, patientId);
  const emergencyRequests = MockStorage.getEmergencyRequests(undefined, patientId);

  const upcomingApt = appointments.find((a) => a.status === 'Confirmed' || a.status === 'Scheduled' || a.status === 'Checked In');
  const activeRx = prescriptions.find((p) => p.status === 'Active');
  const recentLab = labOrders[0];
  const pendingInvoice = invoices.find((i) => i.status !== 'Paid');
  const activeEmergency = emergencyRequests.find((r) => r.status !== 'Completed' && r.status !== 'Cancelled');

  const vitals = patient?.vitals || {
    bloodPressure: '128/84 mmHg',
    heartRate: 74,
    temperature: 98.6,
    oxygenLevel: 98,
    weightKg: 68.5,
    recordedAt: '2026-09-24 08:30',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-10 [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold border border-teal-400/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Patient EHR Portal • Secure HIPAA Protected
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {patient?.name || user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Your personal healthcare command center. Access specialist consultations, laboratory findings, active medication regimens, and 24/7 ambulance dispatch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="white"
              size="sm"
              onClick={() => navigate('/patient/appointments')}
              leftIcon={<Calendar className="w-3.5 h-3.5 text-teal-700" />}
              className="font-bold text-teal-900"
            >
              Book Appointment
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => navigate('/patient/ambulance')}
              leftIcon={<Truck className="w-3.5 h-3.5" />}
              className="font-bold shadow-lg"
            >
              Emergency 911 Ambulance
            </Button>
          </div>
        </div>
      </div>

      {/* Active Emergency Tracker Alert (If ambulance requested) */}
      {activeEmergency && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Active Emergency Dispatch</p>
              <h4 className="text-sm font-bold text-rose-950">Status: {activeEmergency.status}</h4>
              <p className="text-xs text-rose-800">Assigned: {activeEmergency.assignedAmbulanceReg || 'Unit Dispatching'}</p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => navigate('/patient/ambulance')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Track Ambulance
          </Button>
        </div>
      )}

      {/* Health Vitals Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Blood Pressure</p>
          <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600" /> {vitals.bloodPressure}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Heart Rate</p>
          <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-500" /> {vitals.heartRate} <span className="text-xs font-normal text-slate-400">bpm</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Blood Group</p>
          <p className="text-lg font-bold text-rose-600 mt-1">
            {patient?.bloodGroup || 'O+'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">SpO2 Oxygen</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">
            {vitals.oxygenLevel}%
          </p>
        </div>
      </div>

      {/* Main Patient Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Widget 1: Upcoming Appointment */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Next Scheduled Consultation"
            subtitle="Your upcoming specialist visit"
            action={
              upcomingApt ? (
                <Badge variant="indigo" size="sm" dot>{upcomingApt.status}</Badge>
              ) : undefined
            }
          />
          <CardContent>
            {upcomingApt ? (
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{upcomingApt.doctorName}</h4>
                    <p className="text-xs text-indigo-700 font-medium">{upcomingApt.doctorSpecialization}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{upcomingApt.departmentName}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-slate-900 block">{upcomingApt.appointmentDate}</span>
                    <span className="text-xs text-indigo-600 font-semibold">{upcomingApt.appointmentTime}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-2 border-t border-indigo-100/60">
                  <p><span className="font-semibold text-slate-700">Reason:</span> {upcomingApt.reason}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No upcoming consultations scheduled.
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">{appointments.length} Total visits on record</span>
            <Button variant="ghost" size="xs" onClick={() => navigate('/patient/appointments')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Manage Appointments
            </Button>
          </div>
        </Card>

        {/* Widget 2: Active Prescriptions */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Active Prescription Regimen"
            subtitle="Medications currently prescribed"
            action={<Badge variant="success" size="sm">Active</Badge>}
          />
          <CardContent>
            {activeRx ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-800">
                  Prescribed by {activeRx.doctorName} ({activeRx.date})
                </p>
                <div className="space-y-2">
                  {activeRx.medications.slice(0, 2).map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{m.medicineName}</span>
                        <span className="text-[11px] font-semibold text-indigo-600">{m.frequency}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.dosage} • {m.instructions}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No active drug prescriptions found.
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Always follow doctor instructions</span>
            <Button variant="ghost" size="xs" onClick={() => navigate('/patient/prescriptions')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              All Prescriptions
            </Button>
          </div>
        </Card>

        {/* Widget 3: Recent Lab Diagnostics */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Latest Laboratory Findings"
            subtitle="Diagnostic test reports released by pathology"
          />
          <CardContent>
            {recentLab ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{recentLab.testName}</span>
                  <Badge variant={recentLab.status === 'Completed' ? 'success' : 'warning'} size="sm">
                    {recentLab.status}
                  </Badge>
                </div>
                {recentLab.resultValue && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-900">
                    Finding: <span className="font-bold text-teal-700">{recentLab.resultValue}</span>
                    <span className="text-slate-400 block text-[10px] mt-0.5">Ref Interval: {recentLab.referenceRange}</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Ordered by {recentLab.doctorName} • {recentLab.orderDate}</p>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">No lab diagnostics recorded.</div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Verified by Medical Laboratory Technologist</span>
            <Button variant="ghost" size="xs" onClick={() => navigate('/patient/labs')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Reports
            </Button>
          </div>
        </Card>

        {/* Widget 4: Outstanding Bills */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Billing & Payment Balances"
            subtitle="Invoices and insurance co-pays"
          />
          <CardContent>
            {pendingInvoice ? (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{pendingInvoice.id}</span>
                  <Badge variant="warning" size="sm">Due: {pendingInvoice.dueDate}</Badge>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-600">Pending Amount:</span>
                  <span className="text-xl font-black text-slate-900">
                    ${pendingInvoice.totalAmount - pendingInvoice.amountPaid}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Billed for ICU bed charges & specialist rounds.</p>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-emerald-600 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6" />
                <span>All invoices are settled in full. No outstanding balance.</span>
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Hassle-free digital payment settlement</span>
            <Button variant="ghost" size="xs" onClick={() => navigate('/patient/billing')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Billing History
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
