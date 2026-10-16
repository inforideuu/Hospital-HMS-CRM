import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Clock,
  Building2,
  Calendar,
  Edit,
  Trash2,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Staff, UserRole, User } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const StaffManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [staffList, setStaffList] = useState<Staff[]>(() => MockStorage.getStaff(hospId));
  const departments = MockStorage.getDepartments(hospId);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Nurse' as Staff['role'],
    systemRole: 'nurse' as UserRole,
    department: 'Intensive Care Unit (ICU)',
    shift: 'Morning' as Staff['shift'],
  });

  const refreshData = () => {
    setStaffList(MockStorage.getStaff(hospId));
  };

  const filtered = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'Nurse',
      systemRole: 'nurse',
      department: 'Intensive Care Unit (ICU)',
      shift: 'Morning',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '',
      phone: staff.phone,
      role: staff.role,
      systemRole: staff.systemRole,
      department: staff.department,
      shift: staff.shift,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Validation Error', 'Name and Email are required', 'error');
      return;
    }

    if (isEditModalOpen && selectedStaff) {
      const updated: Staff = {
        ...selectedStaff,
        ...formData,
      };
      MockStorage.saveStaff(updated);
      showToast('Staff Updated', `${updated.name} profile updated.`);
      setIsEditModalOpen(false);
    } else {
      const newStaff: Staff = {
        id: `STF-${300 + staffList.length + 1}`,
        hospitalId: hospId,
        ...formData,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      };
      MockStorage.saveStaff(newStaff);

      // Create corresponding User login credentials
      const newUser: User = {
        id: `USR-${Date.now().toString(36).substring(2, 7)}`,
        name: formData.name,
        email: formData.email,
        password: formData.password || 'Staff@1234',
        role: formData.systemRole,
        portal: 'hospital',
        hospitalId: hospId,
        hospitalName: currentHospital?.name || 'Hospital',
        department: formData.department,
        phone: formData.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      MockStorage.saveUser(newUser);

      showToast('Staff Onboarded & Login Created', `${newStaff.name} added as ${newStaff.role} with login (${formData.email}).`);
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleToggleStatus = (staff: Staff) => {
    const updated: Staff = {
      ...staff,
      status: staff.status === 'active' ? 'on_leave' : 'active',
    };
    MockStorage.saveStaff(updated);
    showToast('Status Updated', `${staff.name} is now ${updated.status}.`);
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      MockStorage.deleteStaff(confirmDeleteId);
      showToast('Staff Removed', 'Staff profile deleted from directory.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Clinical & Administrative Staff Directory"
        subtitle="Manage nurses, receptionists, pharmacists, accountants, lab technologists, and shift assignments."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Staff' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Hospital_Staff_Directory', filtered)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Staff
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
              Add Staff Member
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs py-1.5 w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="Nurse">Nurse</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Accountant">Accountant</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Lab Technician">Lab Technician</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Assigned Shift</th>
                <th className="px-4 py-3.5">Contact Info</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={s.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80'}
                        alt={s.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{s.name}</p>
                        <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">{s.role}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-slate-700">
                    {s.department}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" /> {s.shift}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-600">
                    <p>{s.phone}</p>
                    <p className="text-[11px] text-slate-400">{s.email}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    {s.status === 'active' ? (
                      <Badge variant="success" size="sm" dot>On Duty</Badge>
                    ) : (
                      <Badge variant="warning" size="sm" dot>On Leave</Badge>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right space-x-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleToggleStatus(s)}
                    >
                      {s.status === 'active' ? 'Set Leave' : 'Set Active'}
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenEdit(s)}
                      title="Edit Profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-rose-600"
                      onClick={() => setConfirmDeleteId(s.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Staff Profile' : 'Onboard Hospital Staff Member'}
        subtitle="Configure department and shift allocations"
        maxWidth="md"
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Sister Rachel Adams"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Staff Role"
              value={formData.role}
              onChange={(e) => {
                const role = e.target.value as Staff['role'];
                const sysRoleMap: Record<Staff['role'], UserRole> = {
                  Nurse: 'nurse',
                  Receptionist: 'receptionist',
                  Accountant: 'accountant',
                  Pharmacist: 'pharmacist',
                  'Lab Technician': 'lab_technician',
                  'Medical Doctor': 'doctor',
                  'Ambulance Driver': 'ambulance_driver',
                  Admin: 'hospital_admin',
                };
                setFormData({
                  ...formData,
                  role,
                  systemRole: sysRoleMap[role] || 'nurse',
                });
              }}
            >
              <option value="Medical Doctor">Medical Doctor (Physician)</option>
              <option value="Nurse">Registered Nurse</option>
              <option value="Receptionist">Front Desk Receptionist</option>
              <option value="Accountant">Accountant / Billing Manager</option>
              <option value="Pharmacist">Hospital Pharmacist</option>
              <option value="Lab Technician">Lab Technician</option>
              <option value="Ambulance Driver">Ambulance Driver</option>
            </Select>

            <Select
              label="Assigned Shift"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value as Staff['shift'] })}
            >
              <option value="Morning">Morning Shift (07:00 - 15:00)</option>
              <option value="Evening">Evening Shift (15:00 - 23:00)</option>
              <option value="Night">Night Shift (23:00 - 07:00)</option>
              <option value="Rotational">Rotational</option>
            </Select>
          </div>

          <Input
            label="Department Assignment"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="e.g. Intensive Care Unit (ICU)"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="staff@hospital.org"
              required
            />
            <Input
              label="Account Login Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Default: Staff@1234"
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
              {isEditModalOpen ? 'Save Changes' : 'Onboard Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Staff Profile?"
        message="Are you sure you want to remove this staff member from the active hospital directory?"
        confirmText="Yes, Remove Staff"
      />
    </div>
  );
};
