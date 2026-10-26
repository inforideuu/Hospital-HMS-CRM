import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Clock,
  Play,
  RotateCw,
  DoorOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Activity,
  ArrowRight,
  FileText,
  Eye,
  Stethoscope,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { ApiService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Appointment, Doctor, Patient } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Tabs } from '../../../components/ui/Tabs';
import { getHospitalTodayDate, formatDisplayDate } from '../../../utils/appointmentScheduling';

export const DoctorPatientQueue: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'hosp-1';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress' | 'completed'>('waiting');

  const todayActual = useMemo(() => getHospitalTodayDate(hospId), [hospId]);

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
    setAppointments(MockStorage.getAppointments(hospId));
  };

  useEffect(() => {
    loadData();
    MockStorage.syncWithBackend?.().then?.(() => loadData()).catch?.(() => loadData());
    const handleStorageUpdate = () => {
      loadData();
    };
    window.addEventListener('pulse_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [hospId]);

  const myTodayAppointments = useMemo(() => {
    const docNameLower = doctorName.toLowerCase();
    return appointments.filter((a) => {
      const matchDoc =
        a.doctorId === doctorId ||
        (doctorId && a.doctorId && a.doctorId.toLowerCase() === doctorId.toLowerCase()) ||
        (a.doctorName && a.doctorName.toLowerCase() === docNameLower);
      const isToday = a.appointmentDate === todayActual;
      return matchDoc && isToday;
    });
  }, [appointments, doctorId, doctorName, todayActual]);

  const waitingQueue = useMemo(() => {
    return myTodayAppointments
      .filter((a) => a.status === 'Checked In')
      .sort((a, b) => {
        const timeA = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
        const timeB = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
        return timeA - timeB;
      });
  }, [myTodayAppointments]);

  const inProgressQueue = useMemo(() => {
    return myTodayAppointments.filter((a) => a.status === 'In Consultation');
  }, [myTodayAppointments]);

  const completedQueue = useMemo(() => {
    return myTodayAppointments.filter((a) => a.status === 'Completed');
  }, [myTodayAppointments]);

  const handleStartConsultation = async (apt: Appointment) => {
    try {
      const timestamp = new Date().toISOString();
      MockStorage.updateAppointmentStatus(apt.id, 'In Consultation', {
        consultationStartedAt: timestamp,
      });
      await ApiService.startConsultation?.(apt.id, doctorId).catch(() => {});
      showToast('Consultation Started', `Now consulting with ${apt.patientName}.`);
      navigate(`/hospital/consultation/${apt.id}`);
    } catch (e) {
      navigate(`/hospital/consultation/${apt.id}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Today's Live Patient Queue"
        subtitle={`Real-time OPD Consultation Queue for ${doctorName} • ${formatDisplayDate(todayActual)}`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Doctor Console', href: '/hospital/dashboard' },
          { label: "Today's Patient Queue" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                MockStorage.syncWithBackend?.().then?.(() => loadData()).catch?.(() => loadData());
                showToast('Queue Refreshed', 'Refreshed latest arrivals from reception.');
              }}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Sync Arrivals
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/doctor/appointments')}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              All Appointments
            </Button>
          </div>
        }
      />

      {/* OPD Status Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>OPD Chamber Queue: {doctorProfile?.opdRoomName || doctorProfile?.roomNumber || 'Chamber 101'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Specialist: <span className="font-semibold text-slate-700">{doctorName}</span> ({doctorProfile?.specialization || 'Consultant'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Queue Load</p>
            <p className="text-sm font-bold text-slate-800">
              <span className="text-emerald-600">{waitingQueue.length} waiting</span> •{' '}
              <span className="text-amber-600">{inProgressQueue.length} in room</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Tabs
            tabs={[
              { id: 'waiting', label: 'Checked In / Waiting', count: waitingQueue.length },
              { id: 'in_progress', label: 'Currently in Consultation', count: inProgressQueue.length },
              { id: 'completed', label: 'Completed Today', count: completedQueue.length },
            ]}
            activeTab={activeTab}
            onChange={(t) => setActiveTab(t as any)}
            variant="pills"
          />
        </div>

        <CardContent className="p-0">
          {/* TAB 1: WAITING PATIENTS */}
          {activeTab === 'waiting' && (
            <>
              {waitingQueue.length === 0 ? (
                <div className="p-10 text-center">
                  <EmptyState
                    title="No Patients Waiting in Queue"
                    description={`There are currently no checked-in patients waiting for ${doctorName}. Receptionist check-ins will appear here immediately.`}
                    actionText="Refresh Arrivals"
                    onAction={loadData}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="px-5 py-3.5">Queue #</th>
                        <th className="px-4 py-3.5">Patient Details</th>
                        <th className="px-4 py-3.5">Scheduled Slot</th>
                        <th className="px-4 py-3.5">Arrival / Check-In Time</th>
                        <th className="px-4 py-3.5">Visit Reason / Chief Complaint</th>
                        <th className="px-5 py-3.5 text-right">Consultation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {waitingQueue.map((apt, index) => (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold font-mono text-xs flex items-center justify-center border border-emerald-300 shadow-2xs">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900 text-sm leading-tight">{apt.patientName}</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              <span className="font-mono text-indigo-600 font-semibold">{apt.patientId}</span> • {apt.patientAge} Yrs, {apt.patientGender}
                              {apt.patientPhone && ` • ${apt.patientPhone}`}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              {apt.appointmentTime}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{apt.appointmentDate}</p>
                          </td>
                          <td className="px-4 py-4 text-emerald-700 font-medium">
                            <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 inline-block font-mono text-[11px]">
                              {apt.checkedInAt
                                ? new Date(apt.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Reception Checked In'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-700 max-w-[220px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px] mr-1.5 text-slate-700">
                              {apt.type}
                            </span>
                            <span className="font-medium">{apt.reason || 'General Medical Consultation'}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => navigate(`/hospital/patients/${apt.patientId}`)}
                                leftIcon={<FileText className="w-3.5 h-3.5" />}
                              >
                                EHR
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStartConsultation(apt)}
                                leftIcon={<Play className="w-3.5 h-3.5" />}
                                className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs"
                              >
                                Start Consultation
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TAB 2: IN PROGRESS CONSULTATIONS */}
          {activeTab === 'in_progress' && (
            <>
              {inProgressQueue.length === 0 ? (
                <div className="p-10 text-center">
                  <EmptyState
                    title="No Active Consultation"
                    description="No consultation is currently underway. Select a checked-in patient from the waiting queue to begin."
                    actionText="View Waiting Queue"
                    onAction={() => setActiveTab('waiting')}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="px-5 py-3.5">Patient Details</th>
                        <th className="px-4 py-3.5">Started At</th>
                        <th className="px-4 py-3.5">Chief Complaint</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Consultation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inProgressQueue.map((apt) => (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors bg-amber-50/30">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900 text-sm leading-tight">{apt.patientName}</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              <span className="font-mono text-indigo-600 font-semibold">{apt.patientId}</span> • {apt.patientAge}y, {apt.patientGender}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-amber-800 font-medium font-mono">
                            {apt.consultationStartedAt
                              ? new Date(apt.consultationStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'In Progress'}
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            {apt.reason || 'General Medical Consultation'}
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="warning" dot>In Consultation</Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/hospital/consultation/${apt.id}`)}
                              leftIcon={<Play className="w-3.5 h-3.5" />}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                              Resume Workspace
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TAB 3: COMPLETED CONSULTATIONS TODAY */}
          {activeTab === 'completed' && (
            <>
              {completedQueue.length === 0 ? (
                <div className="p-10 text-center">
                  <EmptyState
                    title="No Completed Consultations Today"
                    description="Consultations that are finalized today will appear here along with their sign-off records."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="px-5 py-3.5">Patient Details</th>
                        <th className="px-4 py-3.5">Scheduled Slot</th>
                        <th className="px-4 py-3.5">Completed Time</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {completedQueue.map((apt) => (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900 leading-tight">{apt.patientName}</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              <span className="font-mono text-indigo-600 font-semibold">{apt.patientId}</span> • {apt.patientAge}y, {apt.patientGender}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            {apt.appointmentTime}
                          </td>
                          <td className="px-4 py-4 text-purple-700 font-medium font-mono">
                            {apt.consultationCompletedAt
                              ? new Date(apt.consultationCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Finalized'}
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="purple" dot>Completed</Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => navigate(`/hospital/patients/${apt.patientId}`)}
                                leftIcon={<FileText className="w-3.5 h-3.5" />}
                              >
                                Patient EHR
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => navigate(`/hospital/consultation/${apt.id}`)}
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                              >
                                View Encounter
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorPatientQueue;
