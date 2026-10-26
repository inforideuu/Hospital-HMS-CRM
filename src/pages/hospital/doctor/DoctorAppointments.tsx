import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RotateCw,
  DoorOpen,
  FileText,
  Eye,
  Download,
  Activity,
  UserCheck,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { ApiService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Appointment, AppointmentStatus, Doctor, Patient } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { getHospitalTodayDate, formatDisplayDate } from '../../../utils/appointmentScheduling';

export const DoctorAppointments: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'hosp-1';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'today' | 'upcoming' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  // Appointments strictly scoped to logged-in doctor and authorized hospital
  const doctorAppointments = useMemo(() => {
    const docNameLower = doctorName.toLowerCase();
    return appointments.filter((a) => {
      const matchDoc =
        a.doctorId === doctorId ||
        (doctorId && a.doctorId && a.doctorId.toLowerCase() === doctorId.toLowerCase()) ||
        (a.doctorName && a.doctorName.toLowerCase() === docNameLower);
      return matchDoc;
    });
  }, [appointments, doctorId, doctorName]);

  // Tab filtering logic
  const filtered = useMemo(() => {
    return doctorAppointments.filter((apt) => {
      // Status & Date Filters
      if (activeFilter === 'today') {
        if (apt.appointmentDate !== todayActual) return false;
      } else if (activeFilter === 'upcoming') {
        if (
          apt.appointmentDate < todayActual ||
          (apt.status !== 'Scheduled' && apt.status !== 'Confirmed')
        )
          return false;
      } else if (activeFilter === 'waiting') {
        if (apt.status !== 'Checked In') return false;
      } else if (activeFilter === 'in_consultation') {
        if (apt.status !== 'In Consultation') return false;
      } else if (activeFilter === 'completed') {
        if (apt.status !== 'Completed') return false;
      } else if (activeFilter === 'cancelled') {
        if (apt.status !== 'Cancelled') return false;
      } else if (activeFilter === 'no_show') {
        if (apt.status !== 'No Show') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = apt.patientName?.toLowerCase().includes(query);
        const matchesId = apt.id?.toLowerCase().includes(query) || apt.patientId?.toLowerCase().includes(query);
        const matchesReason = apt.reason?.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesReason) return false;
      }

      return true;
    });
  }, [doctorAppointments, activeFilter, searchQuery, todayActual]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleMarkNoShow = (aptId: string) => {
    MockStorage.updateAppointmentStatus(aptId, 'No Show');
    ApiService.updateAppointmentStatus(aptId, 'No Show').catch(() => {});
    showToast('Updated', 'Appointment marked as No-Show.');
    loadData();
  };

  const handleCancelAppointment = (aptId: string) => {
    MockStorage.updateAppointmentStatus(aptId, 'Cancelled');
    ApiService.updateAppointmentStatus(aptId, 'Cancelled').catch(() => {});
    showToast('Cancelled', 'Appointment has been cancelled.');
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="My Appointments Pipeline"
        subtitle={`Appointments registered & authorized for ${doctorName} • ${currentHospital?.name || 'Hospital HMS'}`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Doctor Console', href: '/hospital/dashboard' },
          { label: 'My Appointments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                MockStorage.exportToCSV(`Doctor_Appointments_${doctorId}`, filtered);
                showToast('Exported', 'Exported appointments list.');
              }}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/doctor/queue')}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
            >
              Today's Live Queue
            </Button>
          </div>
        }
      />

      <Card>
        {/* Filter Navigation Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Appointments', count: doctorAppointments.length },
              {
                id: 'today',
                label: 'Today',
                count: doctorAppointments.filter((a) => a.appointmentDate === todayActual).length,
              },
              {
                id: 'waiting',
                label: 'Checked In / Waiting',
                count: doctorAppointments.filter((a) => a.status === 'Checked In').length,
              },
              {
                id: 'in_consultation',
                label: 'In Consultation',
                count: doctorAppointments.filter((a) => a.status === 'In Consultation').length,
              },
              {
                id: 'upcoming',
                label: 'Upcoming',
                count: doctorAppointments.filter(
                  (a) =>
                    a.appointmentDate >= todayActual &&
                    (a.status === 'Scheduled' || a.status === 'Confirmed')
                ).length,
              },
              {
                id: 'completed',
                label: 'Completed',
                count: doctorAppointments.filter((a) => a.status === 'Completed').length,
              },
              {
                id: 'cancelled',
                label: 'Cancelled',
                count: doctorAppointments.filter((a) => a.status === 'Cancelled').length,
              },
              {
                id: 'no_show',
                label: 'No-Show',
                count: doctorAppointments.filter((a) => a.status === 'No Show').length,
              },
            ]}
            activeTab={activeFilter}
            onChange={(t) => {
              setActiveFilter(t as any);
              setCurrentPage(1);
            }}
            variant="pills"
          />

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, ID, complaint..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Appointments Table */}
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <EmptyState
                title="No Appointments Found"
                description="No appointments match the selected filter criteria."
                actionText="View All Appointments"
                onAction={() => setActiveFilter('all')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Appointment & Patient</th>
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Clinical Department</th>
                    <th className="px-4 py-3.5">OPD Chamber</th>
                    <th className="px-4 py-3.5">Chief Complaint / Reason</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 leading-tight">{apt.patientName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-indigo-600 font-semibold">{apt.id}</span> •{' '}
                          <span className="text-slate-600 font-mono">{apt.patientId}</span> • {apt.patientAge}y, {apt.patientGender}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" /> {apt.appointmentTime}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{apt.appointmentDate}</p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {apt.departmentName || doctorProfile?.departmentName || 'General OPD'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <DoorOpen className="w-3 h-3 text-slate-400" />
                          {apt.opdRoomName || doctorProfile?.opdRoomName || 'Chamber 101'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px] mr-1 text-slate-700">
                          {apt.type}
                        </span>
                        {apt.reason || 'General Medical Consultation'}
                      </td>

                      <td className="px-4 py-3.5">
                        {apt.status === 'Checked In' && <Badge variant="success" dot>Checked In</Badge>}
                        {apt.status === 'In Consultation' && <Badge variant="warning" dot>In Consultation</Badge>}
                        {apt.status === 'Confirmed' && <Badge variant="info" dot>Confirmed</Badge>}
                        {apt.status === 'Scheduled' && <Badge variant="neutral" dot>Scheduled</Badge>}
                        {apt.status === 'Completed' && <Badge variant="purple" dot>Completed</Badge>}
                        {apt.status === 'Cancelled' && <Badge variant="error" dot>Cancelled</Badge>}
                        {apt.status === 'No Show' && <Badge variant="error" dot>No Show</Badge>}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setIsDetailModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {apt.status === 'Checked In' && (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleStartConsultation(apt)}
                              leftIcon={<Play className="w-3 h-3" />}
                              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                            >
                              Start
                            </Button>
                          )}

                          {apt.status === 'In Consultation' && (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => navigate(`/hospital/consultation/${apt.id}`)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                            >
                              Resume
                            </Button>
                          )}

                          {apt.status === 'Completed' && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => navigate(`/hospital/patients/${apt.patientId}`)}
                            >
                              EHR
                            </Button>
                          )}

                          {(apt.status === 'Scheduled' || apt.status === 'Confirmed') && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-amber-600 hover:bg-amber-50"
                              onClick={() => handleMarkNoShow(apt.id)}
                            >
                              No-Show
                            </Button>
                          )}

                          {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => handleCancelAppointment(apt.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Appointment Detail • ${selectedAppointment.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">{selectedAppointment.patientName}</h4>
              <p className="text-slate-500 mt-0.5">
                Patient ID: <span className="font-mono text-indigo-600">{selectedAppointment.patientId}</span> • Age: {selectedAppointment.patientAge}y • Gender: {selectedAppointment.patientGender}
              </p>
              {selectedAppointment.patientPhone && (
                <p className="text-slate-500 mt-0.5">Contact: {selectedAppointment.patientPhone}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scheduled Date & Time</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {selectedAppointment.appointmentDate} at {selectedAppointment.appointmentTime}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Status</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">{selectedAppointment.status}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">OPD Chamber</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {selectedAppointment.opdRoomName || 'General OPD Room'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Consultation Fee</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  ${selectedAppointment.fee} ({selectedAppointment.paymentStatus})
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Chief Complaint / Reason</span>
              <p className="text-slate-800 font-medium">{selectedAppointment.reason || 'None specified'}</p>
              {selectedAppointment.notes && (
                <p className="text-slate-500 italic mt-1">Notes: {selectedAppointment.notes}</p>
              )}
            </div>

            {selectedAppointment.checkedInAt && (
              <p className="text-[11px] text-slate-500">
                Checked in at: {new Date(selectedAppointment.checkedInAt).toLocaleString()}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate(`/hospital/patients/${selectedAppointment.patientId}`);
                }}
                leftIcon={<FileText className="w-3.5 h-3.5" />}
              >
                Open Patient EHR
              </Button>
              {selectedAppointment.status === 'Checked In' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleStartConsultation(selectedAppointment);
                  }}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Start Consultation
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorAppointments;
