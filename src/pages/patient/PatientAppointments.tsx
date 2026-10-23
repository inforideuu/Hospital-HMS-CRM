import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Stethoscope,
  Plus,
  Building2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCw,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Appointment, AppointmentType, FollowUpRequest } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const PatientAppointments: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const patientId = user?.patientId || '';

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    MockStorage.getAppointments(undefined, patientId)
  );
  const [followUpRequests, setFollowUpRequests] = useState<FollowUpRequest[]>(() =>
    MockStorage.getFollowUpRequests()
  );
  const hospitals = MockStorage.getHospitals();
  const doctors = MockStorage.getDoctors();
  const departments = MockStorage.getDepartments();

  const [activeTab, setActiveTab] = useState('upcoming');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Booking Form State
  const [formData, setFormData] = useState({
    hospitalId: hospitals[0]?.id || '',
    departmentId: departments[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00 AM',
    type: 'Consultation' as AppointmentType,
    reason: '',
  });

  const refreshData = () => {
    setAppointments(MockStorage.getAppointments(undefined, patientId));
    setFollowUpRequests(MockStorage.getFollowUpRequests());
  };

  useEffect(() => {
    refreshData();
    MockStorage.syncWithBackend?.().then?.(() => refreshData()).catch?.(() => {});
    const handleUpdate = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [patientId]);

  const pendingDoctorFollowUps = followUpRequests.filter(
    (f) =>
      (f.patientId === patientId || (user?.phone && f.patientPhone === user.phone)) &&
      f.status === 'Pending'
  );

  const upcomingList = appointments.filter(
    (a) => a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'Checked In'
  );
  const pastList = appointments.filter(
    (a) => a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'No Show'
  );

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hosp = hospitals.find((h) => h.id === formData.hospitalId);
    const doc = doctors.find((d) => d.id === formData.doctorId);
    const dept = departments.find((d) => d.id === formData.departmentId);
    const patientProfile = patientId ? MockStorage.getPatientById(patientId) : undefined;

    const newApt: Appointment = {
      id: `APT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      hospitalId: formData.hospitalId,
      patientId: patientId || user?.id || 'PAT-USER',
      patientName: patientProfile?.name || user?.name || 'Patient',
      patientPhone: patientProfile?.phone || user?.phone || '',
      patientAge: patientProfile?.age || (user as any)?.age || 30,
      patientGender: patientProfile?.gender || (user as any)?.gender || 'Other',
      doctorId: doc?.id || formData.doctorId,
      doctorName: doc?.name || 'Doctor',
      doctorSpecialization: doc?.specialization || 'Clinical Specialist',
      departmentId: dept?.id || formData.departmentId || '',
      departmentName: dept?.name || 'General OPD',
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      type: formData.type,
      status: 'Confirmed',
      reason: formData.reason || 'Routine Consultation Request',
      fee: doc?.consultationFee || 150,
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString().split('T')[0],
    };

    MockStorage.saveAppointment(newApt);
    ApiService.createAppointment({
      id: newApt.id,
      hospital: newApt.hospitalId,
      patient: newApt.patientId,
      doctor: newApt.doctorId,
      date: newApt.appointmentDate,
      time: newApt.appointmentTime,
      type: newApt.type,
      status: newApt.status,
      notes: newApt.reason,
    }).catch(() => {});

    showToast('Appointment Booked', `Confirmed with ${newApt.doctorName} on ${newApt.appointmentDate}.`);
    setIsBookModalOpen(false);
    refreshData();
  };

  const handleCancelConfirm = () => {
    if (cancelConfirmId) {
      MockStorage.updateAppointmentStatus(cancelConfirmId, 'Cancelled');
      ApiService.updateAppointmentStatus(cancelConfirmId, 'Cancelled').catch(() => {});
      showToast('Appointment Cancelled', 'Your consultation slot has been released.');
      setCancelConfirmId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="My Medical Appointments & Consultations"
        subtitle="Book OPD visits, view specialist schedules, and manage consultation bookings."
        breadcrumbs={[{ label: 'Patient Portal', href: '/patient/dashboard' }, { label: 'Appointments' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsBookModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Book New Appointment
          </Button>
        }
      />

      {/* Step 3: Pending Doctor Follow-Up Notice Banner */}
      {pendingDoctorFollowUps.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-indigo-500/10 border border-teal-200 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-600 text-white">
              <RotateCw className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-bold text-sm text-teal-950">Step 3: Clinical Follow-Up Initiated by Doctor</h4>
              <p className="text-xs text-teal-800">
                Your attending clinician recommended a follow-up consultation. Hospital reception desk is scheduling your slot.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {pendingDoctorFollowUps.map((req) => (
              <div key={req.id} className="p-3 rounded-xl bg-white/95 border border-teal-200 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{req.doctorName}</span>
                  <Badge variant="cyan" size="sm">Target: {req.suggestedDate}</Badge>
                </div>
                <p className="text-slate-600 mt-1 font-medium">Objective: {req.reason}</p>
                {req.notes && <p className="text-slate-400 text-[11px] mt-0.5">Note: {req.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-slate-100">
          <Tabs
            tabs={[
              { id: 'upcoming', label: 'Upcoming Consultations', count: upcomingList.length },
              { id: 'past', label: 'Past & Completed Visits', count: pastList.length },
            ]}
            activeTab={activeTab}
            onChange={(t) => setActiveTab(t)}
            variant="pills"
          />
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {(activeTab === 'upcoming' ? upcomingList : pastList).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No {activeTab} appointments found.
              </div>
            ) : (
              (activeTab === 'upcoming' ? upcomingList : pastList).map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-100">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{apt.doctorName}</h4>
                        <Badge variant="indigo" size="sm">{apt.status}</Badge>
                        {(apt.isFollowUp || apt.type === 'Follow-up') && (
                          <Badge variant="cyan" size="sm">
                            Step 3: Follow-Up Confirmed
                          </Badge>
                        )}
                        {apt.rescheduledFromDate && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-medium">
                            Rescheduled from {apt.rescheduledFromDate}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-700 font-medium">{apt.doctorSpecialization}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{apt.departmentName}</p>
                      <p className="text-xs text-slate-600 mt-2">
                        <span className="font-semibold text-slate-700">Reason:</span> {apt.reason}
                      </p>
                      {apt.followUpReason && apt.followUpReason !== apt.reason && (
                        <p className="text-xs text-teal-800 mt-0.5">
                          <span className="font-semibold text-teal-900">Doctor's Follow-Up Objective:</span> {apt.followUpReason}
                        </p>
                      )}
                      {apt.rescheduleReason && (
                        <p className="text-[11px] text-amber-800 mt-0.5 italic">
                          Reschedule Note: {apt.rescheduleReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-xs text-slate-900 block">{apt.appointmentDate}</span>
                      <span className="text-xs text-teal-700 font-semibold">{apt.appointmentTime}</span>
                    </div>

                    {activeTab === 'upcoming' && apt.status !== 'Cancelled' && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => setCancelConfirmId(apt.id)}
                      >
                        Cancel Visit
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Specialist Consultation"
        subtitle="Select preferred physician and time slot"
        maxWidth="lg"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <Select
            label="Select Hospital Facility *"
            value={formData.hospitalId}
            onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Medical Department *"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Select
              label="Consulting Doctor *"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} (${doc.consultationFee})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Preferred Date *"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              required
            />
            <Select
              label="Available Slot *"
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
            >
              <option value="09:00 AM">09:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:15 AM">11:15 AM</option>
              <option value="02:30 PM">02:30 PM</option>
              <option value="04:00 PM">04:00 PM</option>
            </Select>
            <Select
              label="Visit Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="Consultation">Consultation</option>
              <option value="General Checkup">General Checkup</option>
              <option value="Follow-up">Follow-up</option>
            </Select>
          </div>

          <Input
            label="Chief Complaint / Reason for Consultation *"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="e.g. Follow up on blood pressure readings"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Book Visit (₹{doctors.find((d) => d.id === formData.doctorId)?.consultationFee || 500})
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelConfirmId}
        onClose={() => setCancelConfirmId(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this scheduled consultation? The doctor's time slot will be opened for other patients."
        confirmText="Yes, Cancel Booking"
      />
    </div>
  );
};
