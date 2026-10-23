import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  UserCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ArrowRight,
  Plus,
  Play,
  RotateCw,
  DoorOpen,
  CalendarDays,
  FileText,
  User,
  ShieldCheck,
  TrendingUp,
  BedDouble,
  FlaskConical,
  Ambulance,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { ApiService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Appointment, Consultation, Doctor, Patient } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getHospitalTodayDate, formatDisplayDate } from '../../../utils/appointmentScheduling';

export const DoctorDashboard: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'hosp-1';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayActual = useMemo(() => getHospitalTodayDate(hospId), [hospId]);

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
    const allDoctors = MockStorage.getDoctors(hospId);
    setDoctors(allDoctors.length > 0 ? allDoctors : MockStorage.getDoctors());
    const allPatients = MockStorage.getPatients(hospId);
    setPatients(allPatients.length > 0 ? allPatients : MockStorage.getPatients());
    const allAppointments = MockStorage.getAppointments(hospId);
    setAppointments(allAppointments);
    const allConsultations = MockStorage.getConsultations(hospId);
    setConsultations(allConsultations);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    MockStorage.syncWithBackend?.().then?.(() => loadData()).catch?.(() => {});
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

  // Doctor's scoped appointments
  const myAppointments = useMemo(() => {
    const docNameLower = doctorName.toLowerCase();
    return appointments.filter((a) => {
      const matchDoc =
        a.doctorId === doctorId ||
        (doctorId && a.doctorId && a.doctorId.toLowerCase() === doctorId.toLowerCase()) ||
        (a.doctorName && a.doctorName.toLowerCase() === docNameLower);
      return matchDoc;
    });
  }, [appointments, doctorId, doctorName]);

  // Metrics derived strictly from actual persisted appointments for this doctor & hospital
  const todayAppointments = useMemo(() => {
    return myAppointments.filter(
      (a) => a.appointmentDate === todayActual && a.status !== 'Cancelled'
    );
  }, [myAppointments, todayActual]);

  const waitingPatients = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'Checked In');
  }, [todayAppointments]);

  const inProgressConsultations = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'In Consultation');
  }, [todayAppointments]);

  const completedToday = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'Completed');
  }, [todayAppointments]);

  const upcomingAppointments = useMemo(() => {
    return myAppointments.filter(
      (a) =>
        a.appointmentDate >= todayActual &&
        (a.status === 'Scheduled' || a.status === 'Confirmed')
    );
  }, [myAppointments, todayActual]);

  const handleStartConsultation = async (apt: Appointment) => {
    try {
      const timestamp = new Date().toISOString();
      MockStorage.updateAppointmentStatus(apt.id, 'In Consultation', {
        consultationStartedAt: timestamp,
      });
      await ApiService.startConsultation?.(apt.id, doctorId).catch(() => {});
      showToast('Consultation Started', `Consultation opened for ${apt.patientName}.`);
      navigate(`/hospital/consultation/${apt.id}`);
    } catch (e) {
      navigate(`/hospital/consultation/${apt.id}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={`Doctor Console • ${doctorName}`}
        subtitle={`Clinical OPD Practice & Consultation Workspace • ${currentHospital?.name || 'Hospital Workspace'}`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Doctor Dashboard' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                MockStorage.syncWithBackend?.().then?.(() => loadData()).catch?.(() => loadData());
                showToast('Refreshed', 'Queue data synced with records.');
              }}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Refresh Queue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/doctor/appointments')}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              My Appointments
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/doctor/queue')}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
            >
              Live OPD Queue ({waitingPatients.length})
            </Button>
          </div>
        }
      />

      {/* Specialist OPD Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300 font-bold text-xl shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">{doctorName}</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {doctorProfile?.specialization || 'Clinical Specialist'}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {doctorProfile?.departmentName || 'Outpatient Department'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>OPD Chamber: <strong className="text-white font-mono">{doctorProfile?.opdRoomName || doctorProfile?.roomNumber || 'Chamber 101'}</strong></span>
                <span>•</span>
                <span>Today's Date: <strong className="text-white">{formatDisplayDate(todayActual)}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/doctor/schedule')}
              className="border-slate-700 bg-slate-800/80 text-black hover:bg-slate-700 hover:text-white text-xs"
              leftIcon={<CalendarDays className="w-3.5 h-3.5 text-brand-400" />}
            >
              Consulting Roster
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/doctor/profile')}
              className="border-slate-700 bg-slate-800/80 text-black hover:bg-slate-700 hover:text-white text-xs"
              leftIcon={<User className="w-3.5 h-3.5 text-brand-400" />}
            >
              Doctor Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          subtext="Registered for today"
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
          accentColor="indigo"
        />
        <StatCard
          title="Waiting in Queue"
          value={waitingPatients.length}
          subtext="Checked in by reception"
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
        />
        <StatCard
          title="In Consultation"
          value={inProgressConsultations.length}
          subtext="Active encounter"
          icon={<Activity className="w-5 h-5 text-amber-600" />}
          accentColor="amber"
        />
        <StatCard
          title="Completed Today"
          value={completedToday.length}
          subtext="Finalized consultations"
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
          accentColor="purple"
        />
        <StatCard
          title="Upcoming OPD"
          value={upcomingAppointments.length}
          subtext="Future schedule"
          icon={<TrendingUp className="w-5 h-5 text-cyan-600" />}
          accentColor="cyan"
        />
      </div>

      {/* Active Consultations Alert Banner if any in progress */}
      {inProgressConsultations.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Consultation In Progress ({inProgressConsultations.length})
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {inProgressConsultations[0].patientName} ({inProgressConsultations[0].id}) is currently in consultation. Clinical notes draft is open.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/hospital/consultation/${inProgressConsultations[0].id}`)}
            leftIcon={<Play className="w-3.5 h-3.5" />}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            Resume Workspace
          </Button>
        </div>
      )}

      {/* Today's Live Patient Queue Section */}
      <Card>
        <CardHeader
          title="Today's Live Patient Waiting Queue"
          subtitle={`Patients checked in by reception and awaiting consultation with ${doctorName}.`}
          action={
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate('/hospital/doctor/queue')}
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              View Full Queue Console
            </Button>
          }
        />
        <CardContent className="p-0">
          {waitingPatients.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                title="Waiting Queue is Clear"
                description={`No patients are currently checked in and waiting for ${doctorName} at this moment.`}
                actionText="Refresh Appointments"
                onAction={loadData}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Queue #</th>
                    <th className="px-4 py-3">Patient Details</th>
                    <th className="px-4 py-3">Scheduled Slot</th>
                    <th className="px-4 py-3">Visit Reason / Complaint</th>
                    <th className="px-4 py-3">OPD Room</th>
                    <th className="px-4 py-3">Check-In Time</th>
                    <th className="px-5 py-3 text-right">Consultation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingPatients.map((apt, index) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-xs flex items-center justify-center border border-emerald-300">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 leading-tight">{apt.patientName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-indigo-600 font-semibold">{apt.patientId}</span> • {apt.patientAge}y, {apt.patientGender}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          {apt.appointmentTime}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 max-w-[200px] truncate">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium text-[10px] mr-1 text-slate-600">
                          {apt.type}
                        </span>
                        {apt.reason || 'General Medical Examination'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <DoorOpen className="w-3 h-3 text-slate-400" />
                          {apt.opdRoomName || doctorProfile?.opdRoomName || 'Chamber 101'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-emerald-700 font-medium">
                        {apt.checkedInAt
                          ? new Date(apt.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Checked In'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleStartConsultation(apt)}
                            leftIcon={<Play className="w-3 h-3" />}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
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
        </CardContent>
      </Card>

      {/* Recent Completed Consultations & Patient Care History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completed Consultations Today */}
        <Card>
          <CardHeader
            title="Completed Consultations Today"
            subtitle="Finalized encounters with documented diagnoses and care plans."
          />
          <CardContent className="space-y-3">
            {completedToday.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No consultations have been finalized yet today.
              </p>
            ) : (
              completedToday.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between text-xs gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{apt.patientName}</span>
                      <Badge variant="purple" size="sm">Completed</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {apt.reason || 'Consultation'} • {apt.appointmentTime}
                    </p>
                    {apt.consultationCompletedAt && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Completed at: {new Date(apt.consultationCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate(`/hospital/patients/${apt.patientId}`)}
                      leftIcon={<FileText className="w-3 h-3" />}
                    >
                      Patient EHR
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate(`/hospital/consultation/${apt.id}`)}
                    >
                      View Notes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Clinical Navigation & Hospital Directives */}
        <Card>
          <CardHeader
            title="Clinical Tools & Fast Shortcuts"
            subtitle="Direct access to your clinical schedule, queue, and patient records."
          />
          <CardContent className="space-y-3">
            <div
              onClick={() => navigate('/hospital/doctor/queue')}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-900">Today's Patient Queue</h4>
                  <p className="text-[11px] text-slate-500">View real-time OPD waiting list and call the next patient.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>

            <div
              onClick={() => navigate('/hospital/doctor/appointments')}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-900">My Appointments Pipeline</h4>
                  <p className="text-[11px] text-slate-500">Filter upcoming, today, checked-in, and past consultations.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>

            <div
              onClick={() => navigate('/hospital/patients')}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-900">Patient Directory & EHR</h4>
                  <p className="text-[11px] text-slate-500">Access comprehensive electronic medical records & past charts.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>

            <div
              onClick={() => navigate('/hospital/doctor/schedule')}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 text-teal-700 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-900">Consultation Schedule & Leaves</h4>
                  <p className="text-[11px] text-slate-500">Check consulting hours, OPD chambers, and mark unavailable days.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>

            <div
              onClick={() => navigate('/hospital/admissions')}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-900">Inpatient Admissions & Beds</h4>
                  <p className="text-[11px] text-slate-500">Track ward occupancy, admit patients, and oversee inpatient care.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>

            <div
              onClick={() => navigate('/hospital/laboratory')}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-900">Laboratory & Diagnostics</h4>
                  <p className="text-[11px] text-slate-500">Review lab orders, diagnostic test findings, and pathology reports.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>

            <div
              onClick={() => navigate('/hospital/ambulance')}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-700 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-900">Ambulance & 911 Emergency Desk</h4>
                  <p className="text-[11px] text-slate-500">Monitor active emergency dispatch and critical incoming patient transit.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
