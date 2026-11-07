import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Award,
  Edit,
  Trash2,
  CheckCircle2,
  Download,
  Upload,
  Camera,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Doctor, User } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { compressImage } from '../../../utils/imageCompressor';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';
import { EmptyState } from '../../../components/ui/EmptyState';

export const DoctorManagement: React.FC = () => {
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const isHospitalAdmin =
    user?.role === 'hospital_admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'super_admin_manager';
  const isReceptionist = user?.role === 'receptionist';

  const [doctors, setDoctors] = useState<Doctor[]>(() => MockStorage.getDoctors(hospId));
  const currentPlan = MockStorage.getHospitalActivePlan(hospId);
  const currentDoctorCount = doctors.length;
  const isAtDoctorLimit = currentPlan && currentPlan.maxDoctors !== undefined && currentDoctorCount >= currentPlan.maxDoctors;
  const departments = MockStorage.getDepartments(hospId);
  const opdRooms = MockStorage.getOPDRooms(hospId);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const firstDept = departments[0];
  const defaultOPDRooms = opdRooms.filter((r) => r.departmentId === firstDept?.id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    departmentId: firstDept?.id || '',
    qualifications: '',
    experienceYears: 0,
    consultationFee: 0,
    availableHours: '',
    opdRoomId: defaultOPDRooms[0]?.id || '',
    roomNumber: defaultOPDRooms[0] ? `${defaultOPDRooms[0].name} / ${defaultOPDRooms[0].code}` : '',
    avatarUrl: '',
  });

  const refreshData = () => {
    setDoctors(MockStorage.getDoctors(hospId));
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.75);
        setFormData((prev) => ({ ...prev, avatarUrl: compressed }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const filtered = doctors.filter((d) => {
    const matchesSearch =
      (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.departmentName || (d as any).department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === 'all' ||
      d.departmentId === departmentFilter ||
      (d as any).department === departmentFilter ||
      d.departmentName === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleOpenAdd = () => {
    if (isReceptionist || !isHospitalAdmin) {
      showToast('Access Restricted', 'Receptionists cannot onboard medical specialists. Please contact your Hospital Administrator.', 'error');
      return;
    }

    const plan = MockStorage.getHospitalActivePlan(hospId);
    const currentDocs = MockStorage.getDoctors(hospId);
    if (plan && plan.maxDoctors !== undefined && currentDocs.length >= plan.maxDoctors) {
      showToast(
        'Doctor Quota Limit Reached',
        `Your hospital is on the "${plan.name}" plan which allows a maximum of ${plan.maxDoctors} medical doctors (${currentDocs.length}/${plan.maxDoctors} in use). Upgrade your subscription to onboard more specialists.`,
        'error'
      );
      setIsUpgradeModalOpen(true);
      return;
    }
    const deptId = departments[0]?.id || '';
    const deptRooms = opdRooms.filter((r) => r.departmentId === deptId);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      departmentId: deptId,
      qualifications: '',
      experienceYears: 0,
      consultationFee: 0,
      availableHours: '09:00 AM - 05:00 PM',
      opdRoomId: deptRooms[0]?.id || '',
      roomNumber: deptRooms[0] ? `${deptRooms[0].name} / ${deptRooms[0].code}` : '',
      avatarUrl: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    if (isReceptionist || !isHospitalAdmin) {
      showToast('Access Restricted', 'Receptionists cannot modify medical specialist profiles.', 'error');
      return;
    }
    setSelectedDoctor(doc);
    const existingSched = MockStorage.getDoctorScheduleByDoctorId(doc.id, hospId);
    const resolvedHours =
      doc.availableHours ||
      (existingSched ? `${existingSched.consultationStartTime} - ${existingSched.consultationEndTime}` : '09:00 AM - 05:00 PM');

    setFormData({
      name: doc.name,
      email: doc.email,
      password: '',
      phone: doc.phone || '',
      specialization: doc.specialization,
      departmentId: doc.departmentId,
      qualifications: doc.qualifications || '',
      experienceYears: doc.experienceYears || 0,
      consultationFee: doc.consultationFee || 0,
      availableHours: resolvedHours,
      opdRoomId: doc.opdRoomId || '',
      roomNumber: doc.opdRoomName || doc.roomNumber || '',
      avatarUrl: doc.avatarUrl || '',
    });
    setIsEditModalOpen(true);
  };

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReceptionist || !isHospitalAdmin) {
      showToast('Permission Denied', 'Receptionists do not have permission to onboard or edit doctors.', 'error');
      return;
    }
    if (!formData.name || !formData.specialization) {
      showToast('Validation Error', 'Name and Specialization are required.', 'error');
      return;
    }

    const dept = departments.find((d) => d.id === formData.departmentId);
    const selectedRoom = opdRooms.find((r) => r.id === formData.opdRoomId);
    const opdRoomDisplayName = selectedRoom ? `${selectedRoom.name} / ${selectedRoom.code}` : (formData.roomNumber || 'General OPD');

    const trimmedEmail = (formData.email || '').trim();

    if (isEditModalOpen && selectedDoctor) {
      const updated: Doctor = {
        ...selectedDoctor,
        ...formData,
        email: trimmedEmail,
        departmentName: dept?.name || selectedDoctor.departmentName,
        opdRoomId: selectedRoom?.id || formData.opdRoomId,
        opdRoomName: opdRoomDisplayName,
        roomNumber: opdRoomDisplayName,
        avatarUrl: formData.avatarUrl || selectedDoctor.avatarUrl || '',
      };
      const res = MockStorage.saveDoctor(updated);
      if (!res.success) {
        showToast('Save Failed', res.message || 'Unable to update specialist profile.', 'error');
        if (res.message?.includes('Subscription Limit')) {
          setIsUpgradeModalOpen(true);
        }
        return;
      }
      if (selectedRoom) {
        selectedRoom.assignedDoctorId = updated.id;
        selectedRoom.assignedDoctorName = updated.name;
        MockStorage.saveOPDRoom(selectedRoom);
      }

      if (trimmedEmail) {
        const existingUsers = MockStorage.getUsers();
        const existingUser = existingUsers.find(
          (u) => u.hospitalId === hospId && (u.email || '').trim().toLowerCase() === trimmedEmail.toLowerCase()
        );
        const userToSave: User = {
          id: existingUser?.id || `USR-${Date.now().toString(36).substring(2, 7)}`,
          name: formData.name,
          email: trimmedEmail,
          password: formData.password || existingUser?.password || 'Doctor@123',
          role: 'doctor',
          portal: 'hospital',
          hospitalId: hospId,
          hospitalName: currentHospital?.name || 'Hospital',
          department: dept?.name || '',
          phone: formData.phone || '',
          status: 'active',
          createdAt: existingUser?.createdAt || new Date().toISOString(),
        };
        const userRes = MockStorage.saveUser(userToSave);
        if (!userRes.success) {
          showToast('Duplicate Account', userRes.error || 'A user with this email already exists in this hospital.', 'error');
          return;
        }
      }

      showToast('Doctor Profile Saved', `${updated.name} profile updated.`);
      setIsEditModalOpen(false);
    } else {
      const newDoc: Doctor = {
        id: `DOC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        hospitalId: hospId,
        ...formData,
        email: trimmedEmail,
        departmentName: dept?.name || '',
        opdRoomId: selectedRoom?.id || formData.opdRoomId,
        opdRoomName: opdRoomDisplayName,
        roomNumber: opdRoomDisplayName,
        status: 'active',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        avatarUrl: formData.avatarUrl || '',
      };
      const res = MockStorage.saveDoctor(newDoc);
      if (!res.success) {
        if (res.message?.includes('Subscription Limit')) {
          showToast('Subscription Limit Reached', res.message, 'error');
          setIsUpgradeModalOpen(true);
        } else {
          showToast('Onboarding Blocked', res.message || 'Cannot onboard specialist with this email.', 'error');
        }
        return;
      }

      if (selectedRoom) {
        selectedRoom.assignedDoctorId = newDoc.id;
        selectedRoom.assignedDoctorName = newDoc.name;
        MockStorage.saveOPDRoom(selectedRoom);
      }

      // Create User login credentials when Hospital Admin explicitly enters login details
      if (trimmedEmail) {
        const newUser: User = {
          id: `USR-${Date.now().toString(36).substring(2, 7)}`,
          name: formData.name,
          email: trimmedEmail,
          password: formData.password || 'Doctor@123',
          role: 'doctor',
          portal: 'hospital',
          hospitalId: hospId,
          hospitalName: currentHospital?.name || 'Hospital',
          department: dept?.name || '',
          phone: formData.phone || '',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        const userRes = MockStorage.saveUser(newUser);
        if (!userRes.success) {
          // Revert doctor creation if user account creation failed due to duplicate email
          MockStorage.deleteDoctor(newDoc.id);
          showToast('Account Collision', userRes.error || 'A user with this email already exists in this hospital.', 'error');
          return;
        }
      }

      showToast('Specialist Onboarded', `${newDoc.name} added to medical roster with login credentials.`);
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleToggleStatus = (doc: Doctor) => {
    if (isReceptionist || !isHospitalAdmin) {
      showToast('Permission Denied', 'Receptionists cannot alter specialist duty status.', 'error');
      return;
    }
    const updated: Doctor = {
      ...doc,
      status: doc.status === 'active' ? 'on_leave' : 'active',
    };
    MockStorage.saveDoctor(updated);
    showToast('Status Updated', `${doc.name} marked as ${updated.status}.`);
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (isReceptionist || !isHospitalAdmin) {
      showToast('Permission Denied', 'Receptionists do not have permission to delete doctors.', 'error');
      return;
    }
    if (confirmDeleteId) {
      MockStorage.deleteDoctor(confirmDeleteId);
      showToast('Doctor Removed', 'Doctor record removed from roster.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Medical Specialists & Clinical Faculty"
        subtitle="Manage hospital physicians, consulting surgeons, OPD chambers, and clinical practice schedules."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Doctors' }]}
        actions={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {currentPlan && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  isAtDoctorLimit
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : currentDoctorCount >= (currentPlan.maxDoctors || 10) * 0.8
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title={`Current Plan: ${currentPlan.name}. Allowed: ${currentPlan.maxDoctors} Specialist Doctors.`}
              >
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Doctor Quota: <strong className="font-bold">{currentDoctorCount}</strong> / {currentPlan.maxDoctors ?? '∞'} in use
                </span>
                {isAtDoctorLimit && (
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="ml-1 text-[10px] uppercase font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Specialists_Directory', filtered)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Roster
            </Button>
            {isHospitalAdmin && (
              <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Onboard Doctor
              </Button>
            )}
          </div>
        }
      />

      {/* Filter and Search */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor by name, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs py-1.5 w-full sm:w-auto"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>

        {/* Doctor Cards Grid */}
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Stethoscope className="w-10 h-10 text-indigo-400" />}
              title="No Medical Specialists Found"
              description={
                searchQuery || departmentFilter !== 'all'
                  ? 'No specialists match your search criteria. Try adjusting your search query or department filter.'
                  : 'No medical specialists have been onboarded to this hospital roster yet.'
              }
              actionText={
                searchQuery || departmentFilter !== 'all'
                  ? 'Reset Filters'
                  : isHospitalAdmin
                  ? 'Onboard Specialist'
                  : undefined
              }
              onAction={
                searchQuery || departmentFilter !== 'all'
                  ? () => {
                      setSearchQuery('');
                      setDepartmentFilter('all');
                    }
                  : isHospitalAdmin
                  ? handleOpenAdd
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-4">
                    {doc.avatarUrl ? (
                      <img
                        src={doc.avatarUrl}
                        alt={doc.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base shrink-0">
                        {doc.name ? doc.name.replace(/^Dr\.\s*/i, '').charAt(0) : <Stethoscope className="w-6 h-6" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug truncate">{doc.name}</h3>
                        {doc.status === 'active' ? (
                          <Badge variant="success" size="sm" dot>Available</Badge>
                        ) : (
                          <Badge variant="warning" size="sm" dot>On Leave</Badge>
                        )}
                      </div>
                      <p className="text-xs text-indigo-600 font-medium truncate mt-0.5">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-400 truncate">{doc.departmentName || 'General OPD'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <p className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {doc.qualifications || 'Clinical Specialist'}
                        {doc.experienceYears ? ` (${doc.experienceYears}+ yrs exp)` : ''}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{doc.availableHours || 'Schedule in Clinical Roster'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{doc.opdRoomName || doc.roomNumber || 'Chamber Unassigned'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <span className="font-bold text-sm">₹</span>
                      <span>Consultation Fee: ₹{doc.consultationFee || 0}</span>
                    </p>
                  </div>
                </div>

                {isHospitalAdmin ? (
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleToggleStatus(doc)}
                    >
                      {doc.status === 'active' ? 'Mark On Leave' : 'Set Available'}
                    </Button>

                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(doc)}
                        title="Edit Profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => setConfirmDeleteId(doc.id)}
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${doc.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <span className="font-medium text-slate-600 capitalize">{doc.status === 'active' ? 'Active Specialist' : 'On Leave'}</span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Read-Only View</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit Doctor Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Specialist Profile' : 'Onboard Medical Specialist'}
        subtitle="Physician credentials and OPD chamber allocation"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveDoctor} className="space-y-4">
          {/* Doctor Profile Photo Upload */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Doctor Profile Photo / Avatar</label>
            <div className="flex items-center gap-4">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Doctor Avatar Preview"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                  </label>
                  <span className="text-[10px] text-slate-400">or enter image web URL below</span>
                </div>
                <Input
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="Image web URL (optional)"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doctor Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Robert Miller"
              required
            />
            <Input
              label="Clinical Specialization *"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Cardiologist"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department Assignment *"
              value={formData.departmentId}
              onChange={(e) => {
                const newDeptId = e.target.value;
                const availableRooms = opdRooms.filter((r) => r.departmentId === newDeptId);
                const firstRoom = availableRooms[0];
                setFormData({
                  ...formData,
                  departmentId: newDeptId,
                  opdRoomId: firstRoom?.id || '',
                  roomNumber: firstRoom ? `${firstRoom.name} / ${firstRoom.code}` : '',
                });
              }}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Input
              label="Medical Qualifications"
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              placeholder="e.g. MD, FACC, FSCAI"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Experience (Years)"
              type="number"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
            />
            <Input
              label="Consultation Fee (₹)"
              type="number"
              value={formData.consultationFee}
              onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
            />
            
            <div>
              <Select
                label="OPD Room / Chamber"
                value={formData.opdRoomId}
                onChange={(e) => {
                  const rId = e.target.value;
                  const roomObj = opdRooms.find((r) => r.id === rId);
                  setFormData({
                    ...formData,
                    opdRoomId: rId,
                    roomNumber: roomObj ? `${roomObj.name} / ${roomObj.code}` : '',
                  });
                }}
              >
                <option value="">-- Unassigned / Shared Clinic Pool --</option>
                {(() => {
                  const deptRooms = opdRooms.filter((r) => r.departmentId === formData.departmentId);
                  return deptRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ));
                })()}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
            />
            <Input
              label="Consultation Hours (Available Hours)"
              value={formData.availableHours}
              onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
              placeholder="e.g. 09:00 AM - 05:00 PM"
              title="Sets the Doctor Available From & To times for OPD consultation slots."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="doctor@hospital.org"
              required
            />
            <Input
              label="Account Login Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank or enter custom password"
            />
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
              {isEditModalOpen ? 'Save Changes' : 'Onboard Specialist'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Specialist from Roster?"
        message="Are you sure you want to remove this medical specialist? All future appointments will need rescheduling."
        confirmText="Yes, Remove Doctor"
      />

      <SubscriptionUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        hospitalId={hospId}
        hospitalName={currentHospital?.name}
        currentTier={currentHospital?.planTier || 'trial'}
      />
    </div>
  );
};
