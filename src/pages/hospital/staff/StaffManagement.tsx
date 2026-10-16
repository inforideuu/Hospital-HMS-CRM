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
  Upload,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Staff, UserRole, User } from '../../../types';
import { isCapabilityAllowedForTier } from '../../../constants/planCapabilities';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';

export const StaffManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  // Subscription plan capabilities for role onboarding
  const planTier = currentHospital?.planTier || 'trial';
  const isPharmacyAllowed = isCapabilityAllowedForTier(planTier, 'pharmacy_stock');
  const isLabAllowed = isCapabilityAllowedForTier(planTier, 'laboratory_diagnostics');
  const isAmbulanceAllowed = isCapabilityAllowedForTier(planTier, 'ambulance_emergency');

  const [staffList, setStaffList] = useState<Staff[]>(() => MockStorage.getStaff(hospId));
  const departments = MockStorage.getDepartments(hospId);

  // Departments list for staff assignment dropdown
  const coreHospitalUnits = [
    'General Ward',
    'Intensive Care Unit (ICU)',
    'Outpatient Department (OPD)',
    'Emergency & Trauma',
    'Pediatrics & Child Care',
    'Operation Theatre (OT)',
    'Front Desk & Reception',
    'Billing & Accounts Desk',
    'Pharmacy & Dispensary',
    'Pathology & Laboratory',
    'Administration & Operations',
  ];
  const allDepartmentOptions = Array.from(
    new Set([
      ...departments.map((d) => d.name),
      ...coreHospitalUnits,
    ])
  );

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
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  });

  const refreshData = () => {
    setStaffList(MockStorage.getStaff(hospId));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    const isDriver = staff.role === 'Ambulance Driver';
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '',
      phone: staff.phone,
      role: staff.role,
      systemRole: staff.systemRole,
      department: isDriver ? 'Emergency Fleet / Ambulance Unit' : staff.department,
      shift: staff.shift,
      avatarUrl: staff.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    });
    setIsEditModalOpen(true);
  };

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Validation Error', 'Name and Email are required', 'error');
      return;
    }

    // Enforce subscription plan capability restrictions on role onboarding
    if (formData.role === 'Pharmacist' && !isPharmacyAllowed) {
      showToast('Role Locked on Current Plan', 'Hospital Pharmacist onboarding requires the Professional Hospital plan as Pharmacy & Stock is locked on your current plan.', 'error');
      setIsUpgradeModalOpen(true);
      return;
    }
    if (formData.role === 'Lab Technician' && !isLabAllowed) {
      showToast('Role Locked on Current Plan', 'Lab Technician onboarding requires the Professional Hospital plan as Laboratory & Diagnostics is locked on your current plan.', 'error');
      setIsUpgradeModalOpen(true);
      return;
    }
    if (formData.role === 'Ambulance Driver' && !isAmbulanceAllowed) {
      showToast('Role Locked on Current Plan', 'Ambulance Driver onboarding requires the Professional Hospital plan as Ambulance & Emergency is locked on your current plan.', 'error');
      setIsUpgradeModalOpen(true);
      return;
    }

    if (isEditModalOpen && selectedStaff) {
      const updated: Staff = {
        ...selectedStaff,
        ...formData,
      };
      const res = MockStorage.saveStaff(updated);
      if (!res.success) {
        showToast('Subscription Limit Reached', res.message || 'Staff limit exceeded for subscription plan.', 'error');
        setIsUpgradeModalOpen(true);
        return;
      }
      showToast('Staff Updated', `${updated.name} profile updated.`);
      setIsEditModalOpen(false);
    } else {
      const newStaff: Staff = {
        id: `STF-${300 + staffList.length + 1}`,
        hospitalId: hospId,
        ...formData,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
        avatarUrl: formData.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      };
      const res = MockStorage.saveStaff(newStaff);
      if (!res.success) {
        showToast('Subscription Limit Reached', res.message || 'Staff quota limit exceeded for subscription plan.', 'error');
        setIsUpgradeModalOpen(true);
        return;
      }

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
        avatar: formData.avatarUrl,
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
            <option value="Pharmacist" disabled={!isPharmacyAllowed}>
              Pharmacist {!isPharmacyAllowed ? '🔒 (Locked)' : ''}
            </option>
            <option value="Lab Technician" disabled={!isLabAllowed}>
              Lab Technician {!isLabAllowed ? '🔒 (Locked)' : ''}
            </option>
            <option value="Ambulance Driver" disabled={!isAmbulanceAllowed}>
              Ambulance Driver {!isAmbulanceAllowed ? '🔒 (Locked)' : ''}
            </option>
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
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed">
            <span className="font-semibold">Note on Doctor Onboarding:</span> Medical Specialists & Physicians should be onboarded via the <strong>Onboard Medical Specialist</strong> roster page (<a href="/hospital/doctors" className="underline font-bold text-blue-900">Doctors Page</a>) to ensure clinical credentials, OPD chambers, and consultation fees are captured.
          </div>

          {/* Staff Profile Photo Upload */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Staff Profile Photo / Avatar</label>
            <div className="flex items-center gap-4">
              <img
                src={formData.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'}
                alt="Staff Avatar Preview"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xs shrink-0"
              />
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
                  placeholder="https://images.unsplash.com/photo-..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Plan Role Restriction Callout */}
          {(!isPharmacyAllowed || !isLabAllowed || !isAmbulanceAllowed) && (
            <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Starter Clinic Plan Role Locking</span>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  Hospital Pharmacist, Lab Technician, and Ambulance Driver roles are locked because Pharmacy, Laboratory Diagnostics, and Ambulance modules require the Professional Hospital plan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="text-[11px] font-bold text-indigo-700 underline hover:text-indigo-900 shrink-0 self-center cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          )}

          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Sister Rachel Adams"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Staff Role *"
              value={formData.role}
              onChange={(e) => {
                const role = e.target.value as Staff['role'];
                if (role === 'Pharmacist' && !isPharmacyAllowed) {
                  showToast('Role Locked', 'Hospital Pharmacist requires Professional Hospital plan.', 'warning');
                  setIsUpgradeModalOpen(true);
                  return;
                }
                if (role === 'Lab Technician' && !isLabAllowed) {
                  showToast('Role Locked', 'Lab Technician requires Professional Hospital plan.', 'warning');
                  setIsUpgradeModalOpen(true);
                  return;
                }
                if (role === 'Ambulance Driver' && !isAmbulanceAllowed) {
                  showToast('Role Locked', 'Ambulance Driver requires Professional Hospital plan.', 'warning');
                  setIsUpgradeModalOpen(true);
                  return;
                }

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
                const isDriver = role === 'Ambulance Driver';
                setFormData({
                  ...formData,
                  role,
                  systemRole: sysRoleMap[role] || 'nurse',
                  department: isDriver ? 'Emergency Fleet / Ambulance Unit' : (formData.department === 'Emergency Fleet / Ambulance Unit' ? 'General Ward' : formData.department),
                });
              }}
            >
              <option value="Nurse">Registered Nurse</option>
              <option value="Receptionist">Front Desk Receptionist</option>
              <option value="Accountant">Accountant / Billing Manager</option>
              <option value="Pharmacist" disabled={!isPharmacyAllowed}>
                Hospital Pharmacist {!isPharmacyAllowed ? '🔒 (Requires Professional Hospital)' : ''}
              </option>
              <option value="Lab Technician" disabled={!isLabAllowed}>
                Lab Technician {!isLabAllowed ? '🔒 (Requires Professional Hospital)' : ''}
              </option>
              <option value="Ambulance Driver" disabled={!isAmbulanceAllowed}>
                Ambulance Driver {!isAmbulanceAllowed ? '🔒 (Requires Professional Hospital)' : ''}
              </option>
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

          <div>
            <Select
              label="Department Assignment *"
              value={formData.role === 'Ambulance Driver' ? 'Emergency Fleet / Ambulance Unit' : formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              disabled={formData.role === 'Ambulance Driver'}
              className={formData.role === 'Ambulance Driver' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}
              required
            >
              {formData.role === 'Ambulance Driver' ? (
                <option value="Emergency Fleet / Ambulance Unit">Emergency Fleet / Ambulance Unit</option>
              ) : (
                <>
                  <option value="" disabled>Select Department</option>
                  {Array.from(new Set([...allDepartmentOptions, ...(formData.department ? [formData.department] : [])])).map((deptName) => (
                    <option key={deptName} value={deptName}>
                      {deptName}
                    </option>
                  ))}
                </>
              )}
            </Select>
            {formData.role === 'Ambulance Driver' && (
              <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 p-1.5 rounded-lg mt-1">
                ⚠️ Department assignment is blocked for Ambulance Drivers (automatically assigned to Emergency Fleet & 911 Desk).
              </p>
            )}
          </div>

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
