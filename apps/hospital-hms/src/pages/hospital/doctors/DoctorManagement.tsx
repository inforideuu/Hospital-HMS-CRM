import React, { useState } from 'react';
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
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const DoctorManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [doctors, setDoctors] = useState<Doctor[]>(() => MockStorage.getDoctors(hospId));
  const departments = MockStorage.getDepartments(hospId);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    departmentId: departments[0]?.id || 'DEP-101',
    qualifications: '',
    experienceYears: 10,
    consultationFee: 150,
    availableHours: '09:00 AM - 04:00 PM',
    roomNumber: 'Suite 301',
  });

  const refreshData = () => {
    setDoctors(MockStorage.getDoctors(hospId));
  };

  const filtered = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'all' || d.departmentId === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      departmentId: departments[0]?.id || 'DEP-101',
      qualifications: 'MD, FACP',
      experienceYears: 12,
      consultationFee: 150,
      availableHours: '09:00 AM - 04:00 PM',
      roomNumber: 'Suite 204 - OPD Wing',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setFormData({
      name: doc.name,
      email: doc.email,
      password: '',
      phone: doc.phone,
      specialization: doc.specialization,
      departmentId: doc.departmentId,
      qualifications: doc.qualifications,
      experienceYears: doc.experienceYears,
      consultationFee: doc.consultationFee,
      availableHours: doc.availableHours,
      roomNumber: doc.roomNumber,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.specialization) {
      showToast('Validation Error', 'Name and Specialization are required.', 'error');
      return;
    }

    const dept = departments.find((d) => d.id === formData.departmentId);

    if (isEditModalOpen && selectedDoctor) {
      const updated: Doctor = {
        ...selectedDoctor,
        ...formData,
        departmentName: dept?.name || selectedDoctor.departmentName,
      };
      MockStorage.saveDoctor(updated);
      showToast('Doctor Profile Saved', `${updated.name} profile updated.`);
      setIsEditModalOpen(false);
    } else {
      const newDoc: Doctor = {
        id: `DOC-${100 + doctors.length + 1}`,
        hospitalId: hospId,
        ...formData,
        departmentName: dept?.name || 'General OPD',
        status: 'active',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      };
      MockStorage.saveDoctor(newDoc);

      // Create User login credentials when Hospital Admin explicitly enters login details
      if (formData.email) {
        const newUser: User = {
          id: `USR-${Date.now().toString(36).substring(2, 7)}`,
          name: formData.name,
          email: formData.email,
          password: formData.password || 'Doctor@1234',
          role: 'doctor',
          portal: 'hospital',
          hospitalId: hospId,
          hospitalName: currentHospital?.name || 'Hospital',
          department: dept?.name || 'General OPD',
          phone: formData.phone,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        MockStorage.saveUser(newUser);
      }

      showToast('Specialist Onboarded', `${newDoc.name} added to medical roster with login credentials.`);
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleToggleStatus = (doc: Doctor) => {
    const updated: Doctor = {
      ...doc,
      status: doc.status === 'active' ? 'on_leave' : 'active',
    };
    MockStorage.saveDoctor(updated);
    showToast('Status Updated', `${doc.name} marked as ${updated.status}.`);
    refreshData();
  };

  const handleDeleteConfirm = () => {
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Specialists_Directory', filtered)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Roster
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Onboard Doctor
            </Button>
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
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-4">
                  <img
                    src={doc.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'}
                    alt={doc.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
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
                    <p className="text-[11px] text-slate-400 truncate">{doc.departmentName}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <p className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.qualifications} ({doc.experienceYears}+ yrs exp)</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.availableHours}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.roomNumber}</span>
                  </p>
                  <p className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Consultation Fee: ${doc.consultationFee}</span>
                  </p>
                </div>
              </div>

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
                    className="text-rose-600"
                    onClick={() => setConfirmDeleteId(doc.id)}
                    title="Delete Doctor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doctor Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Dr. Evelyn Reed, MD"
              required
            />
            <Input
              label="Clinical Specialization *"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Senior Interventional Cardiologist"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department Assignment *"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
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
              label="Consultation Fee ($)"
              type="number"
              value={formData.consultationFee}
              onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
            />
            <Input
              label="OPD Room / Chamber"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="Chamber 12"
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
              placeholder="Default: Doctor@1234"
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
    </div>
  );
};
