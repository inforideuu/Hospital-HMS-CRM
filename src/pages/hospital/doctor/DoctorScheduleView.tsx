import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Save,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { MockStorage } from '../../../services/mockStorage';
import { Doctor, Appointment } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useNavigate } from 'react-router-dom';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DoctorScheduleView: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for schedule customization
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [roomNumber, setRoomNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, hospId]);

  const loadData = () => {
    setLoading(true);
    const docs = MockStorage.getDoctors(hospId);
    let matchedDoc: Doctor | undefined;

    if (user?.role === 'doctor') {
      matchedDoc = docs.find(
        (d) =>
          d.id === user.id ||
          (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
          d.name.toLowerCase() === user.name.toLowerCase()
      );
    }

    if (!matchedDoc && docs.length > 0) {
      matchedDoc = docs[0];
    }

    if (matchedDoc) {
      setCurrentDoctor(matchedDoc);
      setAvailableDays(matchedDoc.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      setAvailableHours(matchedDoc.availableHours || '09:00 AM - 05:00 PM');
      setStatus(matchedDoc.status || 'active');
      setConsultationFee(matchedDoc.consultationFee || 0);
      setRoomNumber(matchedDoc.roomNumber || '');

      // Load appointments for this doctor
      const allAppts = MockStorage.getAppointments(hospId);
      const docAppts = allAppts.filter(
        (a) =>
          a.doctorId === matchedDoc?.id ||
          (a.doctorName && matchedDoc?.name && a.doctorName.toLowerCase().includes(matchedDoc.name.toLowerCase()))
      );
      setAppointments(docAppts);
    }
    setLoading(false);
  };

  const handleDayToggle = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveSchedule = () => {
    if (!currentDoctor) return;
    setIsSaving(true);
    try {
      const updated: Doctor = {
        ...currentDoctor,
        availableDays,
        availableHours,
        status,
        consultationFee,
        roomNumber,
      };
      const res = MockStorage.saveDoctor(updated);
      if (res.success) {
        setCurrentDoctor(updated);
        showToast('Schedule settings updated successfully', 'success');
      } else {
        showToast(res.message || 'Failed to update schedule', 'error');
      }
    } catch {
      showToast('An unexpected error occurred while saving schedule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a) => a.appointmentDate === todayStr);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My OPD Schedule & Duty Timings"
        subtitle={
          currentDoctor
            ? `Dr. ${currentDoctor.name} • ${currentDoctor.specialization} (${currentDoctor.departmentName})`
            : 'Manage your clinic consultation timings and availability'
        }
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/hospital/doctor/appointments')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSchedule}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Schedule Changes
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading schedule...</div>
      ) : !currentDoctor ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            No doctor profile found for your account. Please contact the hospital administrator.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Schedule Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold text-slate-800">Working Days & Availability</span>
                  </div>
                }
                action={
                  <Badge
                    variant={
                      status === 'active'
                        ? 'success'
                        : status === 'on_leave'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {status === 'active' ? 'Active on Duty' : status === 'on_leave' ? 'On Leave' : 'Inactive'}
                  </Badge>
                }
              />
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Consultation Days
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50/50 text-teal-800 shadow-sm'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span>{day}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Daily Consultation Hours"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    placeholder="e.g. 09:00 AM - 05:00 PM"
                    helperText="Specify your OPD duty hours"
                  />
                  <Select
                    label="Current Availability Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    options={[
                      { value: 'active', label: 'Active (Accepting Consultations)' },
                      { value: 'on_leave', label: 'On Leave (Blocked from Booking)' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Assigned OPD Chamber / Room"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. Room 102 - Cardiology Wing"
                  />
                  <Input
                    label="Standard Consultation Fee (₹)"
                    type="number"
                    value={consultationFee.toString()}
                    onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shift & Routine Info */}
            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-slate-800">Duty Protocol & Routine</span>
                  </div>
                }
              />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">SLOT DURATION</div>
                    <div className="text-lg font-bold text-slate-800 mt-1">15 - 20 Mins</div>
                    <div className="text-xs text-slate-400 mt-1">Standard clinical checkup</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">LUNCH BREAK</div>
                    <div className="text-lg font-bold text-slate-800 mt-1">01:00 PM - 02:00 PM</div>
                    <div className="text-xs text-slate-400 mt-1">Recess & ward review</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">OPD CHAMBER</div>
                    <div className="text-lg font-bold text-slate-800 mt-1">
                      {currentDoctor.roomNumber || 'Chamber 1'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{currentDoctor.departmentName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-800">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Note on OPD Check-in Flow:</span> Patients checked in at
                    the reception desk will instantly appear in your <strong>Today's Patient Queue</strong>{' '}
                    during your scheduled hours.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule Overview Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold text-slate-800">Today's OPD Summary</span>
                  </div>
                }
                action={<span className="text-xs font-medium text-slate-500">{todayStr}</span>}
              />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                    <div className="text-xs text-teal-700 font-medium">Today's Bookings</div>
                    <div className="text-2xl font-bold text-teal-900 mt-1">{todayAppts.length}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="text-xs text-amber-700 font-medium">Waiting / Queued</div>
                    <div className="text-2xl font-bold text-amber-900 mt-1">
                      {todayAppts.filter((a) => a.status === 'Checked In').length}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Upcoming Consultations
                  </div>
                  {todayAppts.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-400">
                      No appointments booked for today yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {todayAppts.slice(0, 6).map((appt) => (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs transition-colors"
                        >
                          <div>
                            <div className="font-medium text-slate-800">{appt.patientName}</div>
                            <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {appt.appointmentTime}
                            </div>
                          </div>
                          <Badge
                            variant={
                              appt.status === 'In Consultation'
                                ? 'indigo'
                                : appt.status === 'Checked In'
                                ? 'warning'
                                : appt.status === 'Completed'
                                ? 'success'
                                : 'neutral'
                            }
                          >
                            {appt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/hospital/doctor/queue')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Open Live Patient Queue
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-600" />
                    <span className="font-semibold text-slate-800">OPD Chamber Details</span>
                  </div>
                }
              />
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Chamber</span>
                  <span className="font-medium text-slate-800">{currentDoctor.roomNumber || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Department</span>
                  <span className="font-medium text-slate-800">{currentDoctor.departmentName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Hospital/Branch</span>
                  <span className="font-medium text-slate-800">{currentHospital?.name || 'Main Hospital'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Emergency OPD</span>
                  <span className="font-medium text-emerald-600">On Call</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
