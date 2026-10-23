import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  Phone,
  Mail,
  HeartPulse,
  Droplet,
  User as UserIcon,
  Activity,
  ShieldAlert,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Patient, Gender, BloodGroup, PatientStatus, User, Doctor, Appointment } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';

export const PatientManagement: React.FC = () => {
  const navigate = useNavigate();
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const isNurseOrAdmin =
    user?.role === 'nurse' ||
    user?.role === 'hospital_admin' ||
    user?.role === 'super_admin';

  const [patients, setPatients] = useState<Patient[]>(() => MockStorage.getPatients(hospId));
  const [doctors, setDoctors] = useState<Doctor[]>(() => MockStorage.getDoctors(hospId));
  const [appointments, setAppointments] = useState<Appointment[]>(() => MockStorage.getAppointments(hospId));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [bloodFilter, setBloodFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    age: 0,
    gender: 'Male' as Gender,
    bloodGroup: 'O+' as BloodGroup,
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    status: 'Outpatient' as PatientStatus,
    allergies: '',
    medicalHistory: '',
    assignedDoctorId: '',
    roomBedNumber: '',
    bloodPressure: '120/80 mmHg',
    heartRate: 72,
    temperature: 98.6,
    oxygenLevel: 99,
    weightKg: 70,
  });

  const refreshData = () => {
    setPatients(MockStorage.getPatients(hospId));
    setDoctors(MockStorage.getDoctors(hospId));
    setAppointments(MockStorage.getAppointments(hospId));
  };

  const isPatientCheckedIn = (patId?: string): boolean => {
    if (!patId) return false;
    const pat = patients.find((p) => p.id === patId);
    if (pat?.status === 'Inpatient') return true;
    return appointments.some(
      (a) =>
        a.patientId === patId &&
        (a.status === 'Checked In' ||
          a.status === 'In Consultation' ||
          a.status === 'Completed')
    );
  };

  useEffect(() => {
    refreshData();
    MockStorage.syncWithBackend?.().then?.(() => refreshData()).catch?.(() => {});
    const handleStorageUpdate = () => {
      refreshData();
    };
    window.addEventListener('pulse_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [hospId]);

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    const matchesBlood = bloodFilter === 'all' || p.bloodGroup === bloodFilter;
    return matchesSearch && matchesStatus && matchesGender && matchesBlood;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDobChange = (dob: string) => {
    let calculatedAge = formData.age;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      calculatedAge = age >= 0 ? age : 0;
    }
    setFormData((prev) => ({ ...prev, dateOfBirth: dob, age: calculatedAge }));
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      age: 0,
      gender: 'Male',
      bloodGroup: 'O+',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      status: 'Outpatient',
      allergies: '',
      medicalHistory: '',
      assignedDoctorId: doctors[0]?.id || '',
      roomBedNumber: '',
      bloodPressure: '120/80 mmHg',
      heartRate: 72,
      temperature: 98.6,
      oxygenLevel: 99,
      weightKg: 70,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name || '',
      email: patient.email || '',
      password: '',
      phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth || '',
      age: patient.age || 0,
      gender: patient.gender || 'Male',
      bloodGroup: patient.bloodGroup || 'O+',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      emergencyContactRelation: patient.emergencyContactRelation || '',
      status: patient.status || 'Outpatient',
      allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : '',
      medicalHistory: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : '',
      assignedDoctorId: patient.assignedDoctorId || '',
      roomBedNumber: patient.roomBedNumber || '',
      bloodPressure: patient.vitals?.bloodPressure || '120/80 mmHg',
      heartRate: patient.vitals?.heartRate || 72,
      temperature: patient.vitals?.temperature || 98.6,
      oxygenLevel: patient.vitals?.oxygenLevel || 99,
      weightKg: patient.vitals?.weightKg || 70,
    });
    setIsEditModalOpen(true);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('Validation Error', 'Name and Phone number are required.', 'error');
      return;
    }

    const isCheckedIn = isEditModalOpen && selectedPatient ? isPatientCheckedIn(selectedPatient.id) : false;
    const canRecordIntake = isNurseOrAdmin && isCheckedIn;

    const allergiesArray = canRecordIntake
      ? (formData.allergies ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [])
      : (selectedPatient?.allergies || []);

    const historyArray = canRecordIntake
      ? (formData.medicalHistory ? formData.medicalHistory.split(',').map((s) => s.trim()).filter(Boolean) : [])
      : (selectedPatient?.medicalHistory || []);

    const vitalsData = canRecordIntake && (formData.bloodPressure || formData.heartRate)
      ? {
          bloodPressure: formData.bloodPressure || '120/80 mmHg',
          heartRate: Number(formData.heartRate) || 72,
          temperature: Number(formData.temperature) || 98.6,
          oxygenLevel: Number(formData.oxygenLevel) || 99,
          weightKg: Number(formData.weightKg) || 70,
          recordedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          recordedBy: user?.name,
          recordedRole: user?.role === 'nurse' ? 'Registered Nurse' : 'Hospital Admin',
        }
      : selectedPatient?.vitals;

    if (isEditModalOpen && selectedPatient) {
      const updated: Patient = {
        ...selectedPatient,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        age: Number(formData.age) || 0,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelation: formData.emergencyContactRelation,
        status: formData.status,
        allergies: allergiesArray,
        medicalHistory: historyArray,
        vitals: vitalsData,
      };
      MockStorage.savePatient(updated);
      showToast('Patient Record Updated', `${updated.name} profile saved.`);
      setIsEditModalOpen(false);
    } else {
      const newPatientId = `PAT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const newPatient: Patient = {
        id: newPatientId,
        hospitalId: hospId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        age: Number(formData.age) || 0,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelation: formData.emergencyContactRelation,
        status: formData.status || 'Outpatient',
        allergies: [],
        medicalHistory: [],
        registeredDate: new Date().toISOString().split('T')[0],
        assignedDoctorId: undefined,
        assignedDoctorName: undefined,
        roomBedNumber: undefined,
        vitals: undefined,
      };
      MockStorage.savePatient(newPatient);

      // Create Patient Portal User login credentials automatically/explicitly
      if (formData.email) {
        const newUser: User = {
          id: `USR-${Date.now().toString(36).substring(2, 7)}`,
          name: formData.name,
          email: formData.email,
          password: formData.password || 'Patient@1234',
          role: 'patient',
          portal: 'patient',
          hospitalId: hospId,
          hospitalName: currentHospital?.name || 'Hospital',
          patientId: newPatient.id,
          phone: formData.phone,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        const userRes = MockStorage.saveUser(newUser);
        if (!userRes.success) {
          MockStorage.deletePatient(newPatient.id);
          showToast('Duplicate Account', userRes.error || 'A user with this email already exists in this hospital.', 'error');
          return;
        }
      }

      showToast('Patient Registered & Credentials Created', `${newPatient.name} registered with Patient Portal login (${formData.email || 'Phone ID'}).`);
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      MockStorage.deletePatient(confirmDeleteId);
      showToast('Patient Deactivated', 'Patient medical chart has been archived.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  const handleExport = () => {
    MockStorage.exportToCSV('Patient_Registry', filtered);
    showToast('Export Successful', 'Patient records downloaded.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Electronic Health Records (EHR) & Patient Registry"
        subtitle="Manage longitudinal medical records, clinical vitals, allergies, and patient intake profiles."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Patients' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export Patients
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
              Register New Patient
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, PAT-ID, phone, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5"
            >
              <option value="all">All Care Statuses</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Observation">Observation</option>
              <option value="Discharged">Discharged</option>
            </Select>

            <Select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>

            <Select
              value={bloodFilter}
              onChange={(e) => {
                setBloodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5"
            >
              <option value="all">All Blood Groups</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </Select>
          </div>
        </div>

        {/* Patients Table */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No Patient Records Found"
            description="No matching patients found in this hospital workspace."
            actionText="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setGenderFilter('all');
              setBloodFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Age / Gender</th>
                  <th className="px-4 py-3.5">Blood Group</th>
                  <th className="px-4 py-3.5">Contact Info</th>
                  <th className="px-4 py-3.5">Care Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                      <p className="text-[11px] text-indigo-600 font-mono font-semibold mt-0.5">{p.id}</p>
                      {p.roomBedNumber && (
                        <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          {p.roomBedNumber}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      <p className="font-medium">{p.age} Yrs</p>
                      <p className="text-[11px] text-slate-400">{p.gender}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-xs">
                        <Droplet className="w-3 h-3" /> {p.bloodGroup}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{p.email}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      {p.status === 'Inpatient' && <Badge variant="purple" dot>Inpatient</Badge>}
                      {p.status === 'Outpatient' && <Badge variant="success" dot>Outpatient</Badge>}
                      {p.status === 'Observation' && <Badge variant="warning" dot>Observation</Badge>}
                      {p.status === 'Discharged' && <Badge variant="neutral" dot>Discharged</Badge>}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => navigate(`/hospital/patients/${p.id}`)}
                        title="View Full Medical Chart"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(p)}
                        title="Edit Patient"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600"
                        onClick={() => setConfirmDeleteId(p.id)}
                        title="Archive Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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

      {/* Add / Edit Patient Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Patient Demographics' : 'Register New Hospital Patient'}
        subtitle="Electronic Health Records (EHR) Registration"
        maxWidth="2xl"
      >
        <form onSubmit={handleSavePatient} className="space-y-4">
          {/* Patient EHR ID Auto-Generated Banner */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Electronic Health Record (EHR) ID
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {isEditModalOpen ? (
                  <>Patient ID: <span className="font-mono font-bold text-indigo-700">{selectedPatient?.id}</span></>
                ) : (
                  <>Patient ID: <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Auto-Generated by System</span></>
                )}
              </span>
            </div>
            <Badge variant="purple" size="sm">Auto Generated</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Eleanor Vance"
              required
            />
            <Input
              label="Primary Contact Phone *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleDobChange(e.target.value)}
            />
            <Input
              label="Age (Years)"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
            />
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Blood Group"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </Select>

            <Select
              label="Clinical Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PatientStatus })}
            >
              <option value="Outpatient">Outpatient</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Observation">Observation</option>
              <option value="Discharged">Discharged</option>
            </Select>

            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="patient@example.com"
              required
            />
          </div>

          {/* Clinical Vitals Intake & Clinical Warnings Policy Enforcement */}
          {isAddModalOpen && (
            <div className="pt-2 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Clinical Intake Post Check-In Only</p>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    <strong>Clinical Vitals Intake</strong> and <strong>Clinical Warnings & Medical History</strong> are restricted to <strong>Registered Nurses</strong> and <strong>Hospital Admins</strong> and can only be recorded once the patient arrives and checks in at reception.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isEditModalOpen && !isNurseOrAdmin && (
            <div className="pt-2 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-900">Restricted Clinical Fields</p>
                  <p className="text-amber-700 mt-0.5 leading-relaxed">
                    Only <strong>Registered Nurses</strong> and <strong>Hospital Admins</strong> are authorized to record or update <strong>Clinical Vitals Intake</strong> and <strong>Clinical Warnings & Medical History</strong>.
                  </p>
                  {selectedPatient?.vitals && (
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-medium">BP: {selectedPatient.vitals.bloodPressure || 'N/A'}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-medium">Pulse: {selectedPatient.vitals.heartRate || 'N/A'} bpm</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-medium">Temp: {selectedPatient.vitals.temperature || 'N/A'} °F</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-medium">SpO2: {selectedPatient.vitals.oxygenLevel || 'N/A'}%</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-medium">Weight: {selectedPatient.vitals.weightKg || 'N/A'} kg</span>
                    </div>
                  )}
                  {selectedPatient?.allergies && selectedPatient.allergies.length > 0 && (
                    <div className="mt-1.5 text-[11px] text-rose-700 font-medium">
                      Allergies on file: {selectedPatient.allergies.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isEditModalOpen && isNurseOrAdmin && !isPatientCheckedIn(selectedPatient?.id) && (
            <div className="pt-2 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-rose-900">Patient Check-In Required</p>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">
                    Clinical Vitals Intake and Clinical Warnings & Medical History can only be entered <strong>after the patient has checked in</strong> for an appointment at reception. This patient currently has no active check-in.
                  </p>
                  {selectedPatient?.vitals && (
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 font-medium">Last BP: {selectedPatient.vitals.bloodPressure || 'N/A'}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 font-medium">Last Pulse: {selectedPatient.vitals.heartRate || 'N/A'} bpm</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 font-medium">Last Temp: {selectedPatient.vitals.temperature || 'N/A'} °F</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 font-medium">SpO2: {selectedPatient.vitals.oxygenLevel || 'N/A'}%</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 font-medium">Weight: {selectedPatient.vitals.weightKg || 'N/A'} kg</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isEditModalOpen && isNurseOrAdmin && isPatientCheckedIn(selectedPatient?.id) && (
            <>
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Clinical Vitals Intake
                  </h4>
                  <Badge variant="success" size="sm" dot>
                    Patient Checked In • {user?.role === 'nurse' ? 'Registered Nurse' : 'Hospital Admin'} Authorized
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <Input
                    label="Blood Pressure"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    placeholder="120/80 mmHg"
                  />
                  <Input
                    label="Heart Rate (bpm)"
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: Number(e.target.value) })}
                    placeholder="72"
                  />
                  <Input
                    label="Temp (°F)"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                    placeholder="98.6"
                  />
                  <Input
                    label="SpO2 (%)"
                    type="number"
                    value={formData.oxygenLevel}
                    onChange={(e) => setFormData({ ...formData, oxygenLevel: Number(e.target.value) })}
                    placeholder="99"
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    placeholder="70"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    Clinical Warnings & Medical History
                  </h4>
                  <Badge variant="success" size="sm" dot>
                    Intake Open
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Known Drug / Food Allergies (Comma separated)"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Peanuts"
                  />
                  <Input
                    label="Past Medical Conditions"
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    placeholder="e.g. Hypertension, Asthma"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Patient Portal Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Default: Patient@1234"
            />
            <Input
              label="Residential Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address, City, State"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Emergency Contact & Relations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Contact Name"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="Full Name"
              />
              <Input
                label="Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
              <Input
                label="Relation"
                value={formData.emergencyContactRelation}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                placeholder="Spouse / Parent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {isEditModalOpen ? 'Save Changes' : 'Register Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Archive Patient EHR Record?"
        message="Are you sure you want to deactivate this patient record? The clinical chart will be moved to archives."
        confirmText="Yes, Archive Record"
      />
    </div>
  );
};
