import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  CalendarCheck,
  UserCheck,
  Building2,
  DollarSign,
  Edit,
  Eye,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Appointment, AppointmentStatus, AppointmentType } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';

export const AppointmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [appointments, setAppointments] = useState<Appointment[]>(() => MockStorage.getAppointments(hospId));
  const patients = MockStorage.getPatients(hospId);
  const doctors = MockStorage.getDoctors(hospId);
  const departments = MockStorage.getDepartments(hospId);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const todayActual = new Date().toISOString().split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    departmentId: departments[0]?.id || '',
    appointmentDate: todayActual,
    appointmentTime: '10:00 AM',
    type: 'Consultation' as AppointmentType,
    reason: '',
    notes: '',
    fee: 150,
  });

  const refreshData = () => {
    setAppointments(MockStorage.getAppointments(hospId));
  };

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDoctor = selectedDoctorFilter === 'all' || a.doctorId === selectedDoctorFilter;

    let matchesTab = true;
    if (activeTab === 'today') {
      matchesTab = a.appointmentDate === todayActual;
    } else if (activeTab === 'confirmed') {
      matchesTab = a.status === 'Confirmed' || a.status === 'Checked In';
    } else if (activeTab === 'completed') {
      matchesTab = a.status === 'Completed';
    }

    return matchesSearch && matchesDoctor && matchesTab;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenBook = () => {
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      departmentId: departments[0]?.id || '',
      appointmentDate: todayActual,
      appointmentTime: '10:00 AM',
      type: 'Consultation',
      reason: 'General Medical Examination',
      notes: '',
      fee: 150,
    });
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === formData.patientId);
    const doc = doctors.find((d) => d.id === formData.doctorId);
    const dep = departments.find((d) => d.id === formData.departmentId);

    if (!pat || !doc) {
      showToast('Validation Error', 'Please select both a valid patient and doctor.', 'error');
      return;
    }

    const newApt: Appointment = {
      id: `APT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      patientPhone: pat.phone,
      patientAge: pat.age,
      patientGender: pat.gender,
      doctorId: doc.id,
      doctorName: doc.name,
      doctorSpecialization: doc.specialization,
      departmentId: dep?.id || '',
      departmentName: dep?.name || 'General',
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      type: formData.type,
      status: 'Confirmed',
      reason: formData.reason,
      notes: formData.notes,
      fee: doc.consultationFee || formData.fee,
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString().split('T')[0],
    };

    MockStorage.saveAppointment(newApt);
    showToast('Appointment Booked', `Booked with ${doc.name} for ${pat.name}.`);
    setIsBookModalOpen(false);
    refreshData();
  };

  const handleStatusUpdate = (aptId: string, status: AppointmentStatus) => {
    MockStorage.updateAppointmentStatus(aptId, status);
    showToast('Status Updated', `Appointment marked as ${status}.`);
    refreshData();
  };

  const handleViewDetail = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="OPD Appointments & Specialist Queue"
        subtitle="Manage patient booking pipelines, check-in workflows, calendar schedules, and doctor availability."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Appointments' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('OPD_Appointments', filtered)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Schedule
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenBook} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Book Appointment
            </Button>
          </div>
        }
      />

      {/* Tabs & Filters */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Appointments', count: appointments.length },
              { id: 'today', label: "Today's Schedule", count: appointments.filter((a) => a.appointmentDate === todayActual).length },
              { id: 'confirmed', label: 'Confirmed / Checked In', count: appointments.filter((a) => a.status === 'Confirmed' || a.status === 'Checked In').length },
              { id: 'completed', label: 'Completed', count: appointments.filter((a) => a.status === 'Completed').length },
            ]}
            activeTab={activeTab}
            onChange={(t) => {
              setActiveTab(t);
              setCurrentPage(1);
            }}
            variant="pills"
          />

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, doctor, reason..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Select
              value={selectedDoctorFilter}
              onChange={(e) => {
                setSelectedDoctorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5"
            >
              <option value="all">All Specialists</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No Appointments Found"
            description="No matching appointments found for this filter criteria."
            actionText="Book New Appointment"
            onAction={handleOpenBook}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Appointment & Patient</th>
                  <th className="px-4 py-3.5">Schedule Time</th>
                  <th className="px-4 py-3.5">Medical Specialist</th>
                  <th className="px-4 py-3.5">Visit Reason</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 leading-tight">{apt.patientName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono font-semibold text-indigo-600">{apt.id}</span> • {apt.patientAge}y, {apt.patientGender}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> {apt.appointmentTime}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{apt.appointmentDate}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{apt.doctorName}</p>
                      <p className="text-[10px] text-slate-400">{apt.departmentName}</p>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px] mr-1 text-slate-700">
                        {apt.type}
                      </span>
                      {apt.reason}
                    </td>

                    <td className="px-4 py-3.5">
                      {apt.status === 'Checked In' && <Badge variant="success" dot>Checked In</Badge>}
                      {apt.status === 'Confirmed' && <Badge variant="info" dot>Confirmed</Badge>}
                      {apt.status === 'Scheduled' && <Badge variant="neutral" dot>Scheduled</Badge>}
                      {apt.status === 'Completed' && <Badge variant="purple" dot>Completed</Badge>}
                      {apt.status === 'Cancelled' && <Badge variant="error" dot>Cancelled</Badge>}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleViewDetail(apt)}
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {apt.status === 'Scheduled' && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleStatusUpdate(apt.id, 'Confirmed')}
                          >
                            Confirm
                          </Button>
                        )}

                        {apt.status === 'Confirmed' && (
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => handleStatusUpdate(apt.id, 'Checked In')}
                          >
                            Check In
                          </Button>
                        )}

                        {apt.status === 'Checked In' && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleStatusUpdate(apt.id, 'Completed')}
                          >
                            Mark Completed
                          </Button>
                        )}

                        {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => handleStatusUpdate(apt.id, 'Cancelled')}
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
      </Card>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule OPD Specialist Appointment"
        subtitle="Book clinical consultation with patient EHR linkage"
        maxWidth="lg"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <Select
            label="Select Patient *"
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            required
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — {p.phone}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Attending Medical Specialist *"
              value={formData.doctorId}
              onChange={(e) => {
                const doc = doctors.find((d) => d.id === e.target.value);
                setFormData({
                  ...formData,
                  doctorId: e.target.value,
                  departmentId: doc?.departmentId || formData.departmentId,
                  fee: doc?.consultationFee || 150,
                });
              }}
              required
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization})
                </option>
              ))}
            </Select>

            <Select
              label="Clinical Department"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            >
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Appointment Date *"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              required
            />
            <Select
              label="Time Slot *"
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
            >
              <option value="09:00 AM">09:00 AM</option>
              <option value="09:30 AM">09:30 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="10:30 AM">10:30 AM</option>
              <option value="11:15 AM">11:15 AM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="03:30 PM">03:30 PM</option>
              <option value="04:15 PM">04:15 PM</option>
            </Select>
            <Select
              label="Consultation Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}
            >
              <option value="Consultation">Consultation</option>
              <option value="General Checkup">General Checkup</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
              <option value="Surgery">Surgery Prep</option>
            </Select>
          </div>

          <Input
            label="Chief Complaint / Reason for Visit *"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="e.g. Chronic chest tightness, ECG follow-up"
            required
          />

          <Input
            label="Clinical Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Pre-visit preparation notes"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Booking ($150)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Appointment Details — {selectedAppointment?.id}</span>
          </div>
        }
        subtitle="Complete OPD Consultation Metadata"
        maxWidth="md"
      >
        {selectedAppointment && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.patientName} ({selectedAppointment.patientId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialist:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{selectedAppointment.departmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-semibold text-indigo-700">{selectedAppointment.appointmentDate} at {selectedAppointment.appointmentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant="indigo" size="sm">{selectedAppointment.status}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold">Chief Complaint / Reason:</span>
              <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">{selectedAppointment.reason}</p>
            </div>

            {selectedAppointment.notes && (
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold">Clinical Notes:</span>
                <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 italic">{selectedAppointment.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
