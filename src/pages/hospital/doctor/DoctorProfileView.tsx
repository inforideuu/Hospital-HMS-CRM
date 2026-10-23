import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Award,
  Stethoscope,
  MapPin,
  Clock,
  DollarSign,
  Save,
  CheckCircle2,
  Calendar,
  Building,
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

export const DoctorProfileView: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [roomNumber, setRoomNumber] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');

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
      setName(matchedDoc.name);
      setEmail(matchedDoc.email);
      setPhone(matchedDoc.phone || '');
      setSpecialization(matchedDoc.specialization || '');
      setQualifications(matchedDoc.qualifications || '');
      setExperienceYears(matchedDoc.experienceYears || 0);
      setConsultationFee(matchedDoc.consultationFee || 0);
      setRoomNumber(matchedDoc.roomNumber || '');
      setStatus(matchedDoc.status || 'active');

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

  const handleSaveProfile = () => {
    if (!currentDoctor) return;
    setIsSaving(true);
    try {
      const updated: Doctor = {
        ...currentDoctor,
        name,
        email,
        phone,
        specialization,
        qualifications,
        experienceYears,
        consultationFee,
        roomNumber,
        status,
      };

      const res = MockStorage.saveDoctor(updated);
      if (res.success) {
        setCurrentDoctor(updated);
        showToast('Doctor profile updated successfully', 'success');
      } else {
        showToast(res.message || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('An unexpected error occurred while saving profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const inProgressCount = appointments.filter((a) => a.status === 'In Consultation').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => a.appointmentDate === todayStr).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Profile & Credentials"
        subtitle="Manage your personal details, professional qualifications, and OPD credentials"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/hospital/doctor/schedule')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              My Schedule
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Profile Changes
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading doctor profile...</div>
      ) : !currentDoctor ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            No doctor profile found for your account. Please contact the hospital administrator.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-teal-100 border-4 border-white shadow-md flex items-center justify-center text-teal-800 text-3xl font-bold mb-4">
                  {currentDoctor.avatarUrl ? (
                    <img
                      src={currentDoctor.avatarUrl}
                      alt={currentDoctor.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    currentDoctor.name.charAt(0)
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900">Dr. {currentDoctor.name}</h3>
                <p className="text-sm font-medium text-teal-700 mt-1">{currentDoctor.specialization}</p>
                <p className="text-xs text-slate-500">{currentDoctor.departmentName}</p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Badge
                    variant={
                      status === 'active'
                        ? 'success'
                        : status === 'on_leave'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {status === 'active' ? 'Active Specialist' : status === 'on_leave' ? 'On Leave' : 'Inactive'}
                  </Badge>
                  <Badge variant="indigo">{currentDoctor.id}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-100">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 font-medium">Today</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{todayCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 font-medium">In Consult</div>
                    <div className="text-lg font-bold text-teal-600 mt-0.5">{inProgressCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 font-medium">Finished</div>
                    <div className="text-lg font-bold text-emerald-600 mt-0.5">{completedCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-slate-600" />
                    <span className="font-semibold text-slate-800">Affiliation & Branch</span>
                  </div>
                }
              />
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Hospital</span>
                  <span className="font-medium text-slate-800">{currentHospital?.name || 'Main Hospital'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Department</span>
                  <span className="font-medium text-slate-800">{currentDoctor.departmentName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">OPD Chamber</span>
                  <span className="font-medium text-slate-800">{currentDoctor.roomNumber || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Duty Hours</span>
                  <span className="font-medium text-slate-800">{currentDoctor.availableHours || '09:00 AM - 05:00 PM'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold text-slate-800">Personal & Professional Information</span>
                  </div>
                }
              />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name (with Title)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    required
                  />
                  <Input
                    label="Specialization / Discipline"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Consultant Cardiologist"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Official Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    required
                  />
                  <Input
                    label="Contact Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Medical Qualifications & Degrees"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="e.g. MBBS, MD, DM (Cardiology)"
                  />
                  <Input
                    label="Years of Clinical Experience"
                    type="number"
                    value={experienceYears.toString()}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Standard Consultation Fee (₹)"
                    type="number"
                    value={consultationFee.toString()}
                    onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Assigned Chamber / Room"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. Room 102 - Cardiology Wing"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Operational Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    options={[
                      { value: 'active', label: 'Active (Available for consultations)' },
                      { value: 'on_leave', label: 'On Leave (Unavailable)' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-slate-800">Clinical Privileges & Accreditations</span>
                  </div>
                }
              />
              <CardContent className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">OPD Consultation & Clinical Examination</div>
                      <div className="text-xs text-slate-500">Licensed for outpatient prescription and diagnosis</div>
                    </div>
                  </div>
                  <Badge variant="success">Authorized</Badge>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Electronic Health Record (EHR) Sign-off</div>
                      <div className="text-xs text-slate-500">Authorized to finalize clinical records and treatment plans</div>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">OPD Chamber Priority Queue</div>
                      <div className="text-xs text-slate-500">Live reception check-in triage integration</div>
                    </div>
                  </div>
                  <Badge variant="indigo">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
