import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  MessageSquare,
  Send,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { ApiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Appointment, AppointmentType, FollowUpRequest, PatientAppointmentRequest } from '../../types';
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
  const patient = MockStorage.getPatientById(patientId);
  const patientHospitalId = patient?.hospitalId || user?.hospitalId || 'HOSP-001';
  const hospital = MockStorage.getHospitalById(patientHospitalId);

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    MockStorage.getAppointments(undefined, patientId)
  );
  const [followUpRequests, setFollowUpRequests] = useState<FollowUpRequest[]>(() =>
    MockStorage.getFollowUpRequests()
  );
  const [appointmentRequests, setAppointmentRequests] = useState<PatientAppointmentRequest[]>(() =>
    MockStorage.getAppointmentRequests(undefined, patientId)
  );
  const doctors = MockStorage.getDoctors(patientHospitalId);
  const departments = MockStorage.getDepartments(patientHospitalId);

  const [activeTab, setActiveTab] = useState('upcoming');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'request') {
      setIsBookModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Appointment Request Form State
  const [formData, setFormData] = useState({
    hospitalId: patientHospitalId,
    departmentId: departments[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointmentTime: '',
    type: 'Consultation' as AppointmentType,
    reason: '',
    notes: '',
  });

  const refreshData = () => {
    setAppointments(MockStorage.getAppointments(undefined, patientId));
    setFollowUpRequests(MockStorage.getFollowUpRequests());
    setAppointmentRequests(MockStorage.getAppointmentRequests(undefined, patientId));
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

  const myRequests = appointmentRequests.filter(
    (r) => r.patientId === patientId || (user?.phone && r.patientPhone === user.phone)
  );
  const pendingPatientRequests = myRequests.filter((r) => r.status === 'Pending');
  const declinedRequestsWithNotes = myRequests.filter((r) => r.status === 'Declined' && r.receptionistNote);

  const upcomingList = appointments.filter(
    (a) => a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'Checked In'
  );
  const pastList = appointments.filter(
    (a) => a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'No Show'
  );

  const handleOpenRequest = (prefill?: Partial<typeof formData>) => {
    if (prefill) {
      setFormData((prev) => ({ ...prev, ...prefill }));
    }
    setIsBookModalOpen(true);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find((d) => d.id === formData.doctorId);
    const dept = departments.find((d) => d.id === formData.departmentId);
    const patientProfile = patientId ? MockStorage.getPatientById(patientId) : undefined;

    const req: PatientAppointmentRequest = {
      id: `REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      hospitalId: formData.hospitalId || 'HOSP-001',
      patientId: patientId || user?.id || 'PAT-USER',
      patientName: patientProfile?.name || user?.name || 'Patient',
      patientPhone: patientProfile?.phone || user?.phone || '+91 98765 43210',
      patientAge: patientProfile?.age || (user as any)?.age || 30,
      patientGender: patientProfile?.gender || (user as any)?.gender || 'Other',
      doctorId: doc?.id || formData.doctorId,
      doctorName: doc?.name || 'Specialist Doctor',
      doctorSpecialization: doc?.specialization || 'Clinical Specialist',
      departmentId: dept?.id || formData.departmentId || '',
      departmentName: dept?.name || 'Outpatient Clinic',
      preferredDate: formData.appointmentDate,
      preferredTime: formData.appointmentTime,
      type: formData.type,
      reason: formData.reason || 'Medical Consultation Request',
      notes: formData.notes || undefined,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    MockStorage.saveAppointmentRequest(req);
    showToast(
      'Appointment Request Sent',
      `Requested with ${req.doctorName} on ${req.preferredDate} at ${req.preferredTime}. Receptionist will review slot availability.`,
      'success'
    );
    setIsBookModalOpen(false);
    refreshData();
    setActiveTab('requests');
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
          <Button variant="primary" size="sm" onClick={() => handleOpenRequest()} leftIcon={<Calendar className="w-3.5 h-3.5" />}>
            Request Appointment
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

      {/* RECEPTIONIST NOTE: SLOT UNAVAILABLE BANNER */}
      {declinedRequestsWithNotes.length > 0 && (
        <div className="space-y-3">
          {declinedRequestsWithNotes.map((req) => (
            <div key={req.id} className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-sm space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-amber-950">Hospital Reception Note: Requested Slot Unavailable</h4>
                    <p className="text-xs text-amber-800">
                      Doctor <span className="font-semibold">{req.doctorName}</span> • Requested for <span className="font-semibold">{req.preferredDate} ({req.preferredTime})</span>
                    </p>
                  </div>
                </div>
                <Badge variant="warning" size="sm">Slot Unavailable</Badge>
              </div>

              <div className="p-3 bg-white/95 rounded-xl border border-amber-200 text-xs shadow-2xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider text-amber-900">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Message from Receptionist ({req.respondedBy || 'Front Desk'}):
                </span>
                <p className="italic text-slate-900 font-medium pl-2 border-l-2 border-amber-400">
                  "{req.receptionistNote}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-amber-800">You can submit a new request with alternative timings.</span>
                <Button
                  variant="primary"
                  size="xs"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  onClick={() => handleOpenRequest({
                    hospitalId: req.hospitalId,
                    departmentId: req.departmentId,
                    doctorId: req.doctorId,
                    reason: req.reason,
                    type: req.type,
                  })}
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                >
                  Request Another Slot / Date
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PENDING APPOINTMENT REQUESTS BANNER */}
      {pendingPatientRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-bold text-sm text-blue-950">Appointment Request Under Review</h4>
              <p className="text-xs text-blue-800">
                Hospital reception is reviewing doctor availability for your requested date & time. Confirmed appointments will appear in Upcoming Consultations.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {pendingPatientRequests.map((req) => (
              <div key={req.id} className="p-3 rounded-xl bg-white/95 border border-blue-200 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{req.doctorName}</span>
                  <Badge variant="warning" size="sm">Pending Reception</Badge>
                </div>
                <p className="text-slate-600 mt-1">Requested: <span className="font-semibold text-slate-900">{req.preferredDate} ({req.preferredTime})</span></p>
                <p className="text-slate-500 text-[11px] mt-0.5 truncate">Reason: {req.reason}</p>
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
              { id: 'requests', label: 'My Requests & Notes', count: myRequests.length },
              { id: 'past', label: 'Past & Completed Visits', count: pastList.length },
            ]}
            activeTab={activeTab}
            onChange={(t) => setActiveTab(t)}
            variant="pills"
          />
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {activeTab === 'requests' ? (
              myRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No appointment requests submitted yet. Click "Request Appointment" to request a consultation date and time.
                </div>
              ) : (
                myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{req.doctorName}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{req.id}</span>
                          </div>
                          <p className="text-xs text-slate-500">{req.departmentName} • {req.type}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          req.status === 'Approved' ? 'success' : req.status === 'Declined' ? 'error' : 'warning'
                        }
                        size="sm"
                      >
                        {req.status === 'Approved' ? 'Approved & Booked' : req.status === 'Declined' ? 'Slot Unavailable' : 'Pending Receptionist Review'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Requested Date & Time Slot:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> {req.preferredDate} ({req.preferredTime})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Reason / Complaint:</span>
                        <span className="text-slate-700 font-medium">{req.reason}</span>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-600">Your Notes to Reception:</span> {req.notes}
                      </div>
                    )}

                    {/* Receptionist Response Note if Declined */}
                    {req.status === 'Declined' && req.receptionistNote && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                        <span className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Note from Receptionist ({req.respondedBy || 'Front Desk'}):
                        </span>
                        <p className="italic text-slate-800 pl-2 border-l-2 border-amber-400 font-medium">"{req.receptionistNote}"</p>
                      </div>
                    )}

                    {/* Confirmed info if Approved */}
                    {req.status === 'Approved' && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-900 block">Appointment Confirmed by Reception</span>
                          <span className="text-emerald-700">Scheduled for {req.scheduledDate} ({req.scheduledTime}). View details in Upcoming Consultations.</span>
                        </div>
                        <Button variant="ghost" size="xs" onClick={() => setActiveTab('upcoming')}>
                          View in Upcoming
                        </Button>
                      </div>
                    )}

                    {req.status === 'Declined' && (
                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Button
                          variant="primary"
                          size="xs"
                          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                          onClick={() => handleOpenRequest({
                            hospitalId: req.hospitalId,
                            departmentId: req.departmentId,
                            doctorId: req.doctorId,
                            reason: req.reason,
                            type: req.type,
                          })}
                          leftIcon={<Calendar className="w-3.5 h-3.5" />}
                        >
                          Request Another Slot
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (activeTab === 'upcoming' ? upcomingList : pastList).length === 0 ? (
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
        title="Request Specialist Consultation"
        subtitle="Enter your preferred physician, date, and desired time"
        maxWidth="lg"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Request Your Preferred Date & Time</p>
              <p className="mt-0.5 text-teal-800 text-[11px]">
                {hospital ? `${hospital.name} • ` : ''}Hospital reception will check doctor availability for your requested slot. If available, they will confirm your booking and it will appear in Upcoming Consultations. If unavailable, the receptionist will write you a note.
              </p>
            </div>
          </div>

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
                  {doc.name} (₹{doc.consultationFee})
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
            <Input
              label="Preferred Time *"
              type="text"
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              placeholder="e.g. 10:30 AM or 04:00 PM"
              required
            />
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
            placeholder="e.g. Persistent headache, blood pressure review"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes for Receptionist (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Prefer morning slot if possible, or need consultation before 12 PM"
              className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Appointment Request
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
