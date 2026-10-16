import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  KeyRound,
  Download,
  Building2,
  RefreshCw,
  Sparkles,
  UserCheck,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Zap,
  Image as ImageIcon,
  Check,
  AlertCircle,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { User, UserRole, PortalType, Hospital } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useNotification } from '../../../context/NotificationContext';
import { compressImage } from '../../../utils/imageCompressor';

const AVATAR_PRESETS = [
  {
    name: 'Super Admin (Exec)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    roleTag: 'Platform HQ',
  },
  {
    name: 'Platform Lead (Female)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    roleTag: 'HQ Manager',
  },
  {
    name: 'Medical Director (Male)',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
    roleTag: 'Hospital Admin',
  },
  {
    name: 'Hospital Director (Female)',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    roleTag: 'Hospital Admin',
  },
  {
    name: 'System Admin (Male)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    roleTag: 'Tech Ops',
  },
  {
    name: 'Operations Manager',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    roleTag: 'Operations',
  },
];

export const PlatformUsers: React.FC = () => {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<User[]>(() => MockStorage.getUsers());
  const [hospitals, setHospitals] = useState<Hospital[]>(() => MockStorage.getHospitals());
  const [searchQuery, setSearchQuery] = useState('');
  const [portalFilter, setPortalFilter] = useState<'all' | 'platform' | 'hospital'>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'super_admin_manager' as UserRole,
    portal: 'platform' as PortalType,
    department: 'Platform Operations & Support',
    phone: '',
    hospitalId: '',
    hospitalName: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  });

  const refreshData = () => {
    setUsers(MockStorage.getUsers());
    setHospitals(MockStorage.getHospitals());
  };

  useEffect(() => {
    const handleSync = () => {
      refreshData();
    };
    window.addEventListener('pulse_storage_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Strict Platform RBAC Scope: ONLY Super Admins, Super Admin Managers, Sales Executives, and Legitimate Hospital Admins
  const filteredUsers = users.filter((u) => {
    const isPlatformScope =
      u.role === 'super_admin' ||
      u.role === 'super_admin_manager' ||
      u.role === 'sales_executive' ||
      u.role === 'hospital_admin';

    if (!isPlatformScope) return false;

    // Filter out any legacy hardcoded mock hospital admins
    if (u.id === 'USR-HOSP-01' || (u.name === 'Dr. Arthur Vance' && u.role === 'hospital_admin')) {
      return false;
    }
    if (u.id.startsWith('USR-HAD-HOSP-00')) {
      return false;
    }

    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.hospitalName && u.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.hospitalId && u.hospitalId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPortal =
      portalFilter === 'all' ||
      (portalFilter === 'platform' && (u.portal === 'platform' || u.portal === 'sales' || u.role.startsWith('super_admin') || u.role === 'sales_executive')) ||
      (portalFilter === 'hospital' && u.role === 'hospital_admin');

    return matchesSearch && matchesPortal;
  });

  const totalPlatformHQ = filteredUsers.filter((u) => u.role === 'super_admin' || u.role === 'super_admin_manager' || u.role === 'sales_executive').length;
  const totalHospitalAdmins = filteredUsers.filter((u) => u.role === 'hospital_admin').length;

  const handleOpenAdd = () => {
    const defaultHosp = hospitals.length > 0 ? hospitals[0] : null;
    setFormData({
      name: '',
      email: '',
      password: `PulseAdmin@${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'super_admin_manager',
      portal: 'platform',
      department: 'Platform Operations & Support',
      phone: '',
      hospitalId: defaultHosp ? defaultHosp.id : '',
      hospitalName: defaultHosp ? defaultHosp.name : '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    });
    setShowPassword(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '••••••••',
      role: user.role,
      portal: user.portal,
      department: user.department || (user.role === 'hospital_admin' ? 'Hospital Executive Management' : 'Platform Engineering'),
      phone: user.phone || '',
      hospitalId: user.hospitalId || '',
      hospitalName: user.hospitalName || '',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    });
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      setFormData((prev) => ({ ...prev, avatar: compressedDataUrl }));
      showToast('Avatar Photo Loaded', 'Profile photo uploaded and ready to save.');
    } catch (err) {
      console.error(err);
      showToast('Upload Error', 'Failed to read the image file.', 'error');
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Pulse@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    showToast('Password Generated', 'Secure temporary password generated.');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Validation Error', 'Full Name and Email Address are required', 'error');
      return;
    }

    if (formData.role === 'hospital_admin' && !formData.hospitalId) {
      showToast('Validation Error', 'Please select an assigned Hospital Facility for this Hospital Admin.', 'error');
      return;
    }

    const selectedHospital = hospitals.find((h) => h.id === formData.hospitalId);
    const assignedHospitalName = selectedHospital ? selectedHospital.name : formData.hospitalName;

    const finalAvatar =
      formData.avatar ||
      (formData.role === 'hospital_admin'
        ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80');

    const targetPortal = formData.role === 'sales_executive' ? 'sales' : formData.role === 'hospital_admin' ? 'hospital' : 'platform';

    if (isEditModalOpen && selectedUser) {
      const updated: User = {
        ...selectedUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        portal: targetPortal,
        department: formData.department,
        phone: formData.phone,
        hospitalId: formData.role === 'hospital_admin' ? formData.hospitalId : undefined,
        hospitalName: formData.role === 'hospital_admin' ? assignedHospitalName : undefined,
        avatar: finalAvatar,
        password: formData.password && formData.password !== '••••••••' ? formData.password : selectedUser.password,
      };
      MockStorage.saveUser(updated);

      // Bi-directional sync with Hospital entity
      if (formData.role === 'hospital_admin' && formData.hospitalId && selectedHospital) {
        const updatedHospital: Hospital = {
          ...selectedHospital,
          adminName: formData.name,
          adminEmail: formData.email,
          adminPhone: formData.phone || selectedHospital.adminPhone,
        };
        MockStorage.saveHospital(updatedHospital);
      }

      showToast('User Updated', `${updated.name} credentials and role assignments updated.`);
      setIsEditModalOpen(false);
    } else {
      const newUser: User = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        portal: targetPortal,
        department: formData.department,
        phone: formData.phone,
        hospitalId: formData.role === 'hospital_admin' ? formData.hospitalId : undefined,
        hospitalName: formData.role === 'hospital_admin' ? assignedHospitalName : undefined,
        avatar: finalAvatar,
        password: formData.password || 'PulseAdmin@2026',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      MockStorage.saveUser(newUser);

      // Bi-directional sync with Hospital entity
      if (formData.role === 'hospital_admin' && formData.hospitalId && selectedHospital) {
        const updatedHospital: Hospital = {
          ...selectedHospital,
          adminName: formData.name,
          adminEmail: formData.email,
          adminPhone: formData.phone || selectedHospital.adminPhone,
        };
        MockStorage.saveHospital(updatedHospital);
      }

      showToast(
        'User Account Provisioned',
        `${newUser.name} account created and granted ${newUser.role.replace(/_/g, ' ')} access.`
      );
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleToggleStatus = (user: User) => {
    const updated: User = {
      ...user,
      status: user.status === 'active' ? 'inactive' : 'active',
    };
    MockStorage.saveUser(updated);
    showToast('Status Updated', `${user.name} is now ${updated.status}.`);
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      MockStorage.deleteUser(confirmDeleteId);
      showToast('User Deleted', 'User account permanently removed.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Super Admin Managers & Platform RBAC"
        subtitle="Manage Super Admin Managers, platform administrators, and registered hospital facility admin credentials."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Users & RBAC' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Platform_Users', filteredUsers)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Directory
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
              Add Member
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Managed Accounts</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{filteredUsers.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform HQ (Super Admins)</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{totalPlatformHQ}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Facility Admins</p>
            <p className="text-2xl font-extrabold text-teal-600 mt-1">{totalHospitalAdmins}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and User Grid */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, role, or hospital name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Select
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value as any)}
            className="text-xs py-1.5 w-full sm:w-auto"
          >
            <option value="all">All Managed Roles ({filteredUsers.length} Users)</option>
            <option value="platform">Platform HQ Only (Super Admin & Managers)</option>
            <option value="hospital">Hospital Facility Admins Only</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No User Accounts Found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'Try adjusting your search criteria or filter.' : 'Register a hospital or click "Add Member" to create user credentials.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">User Identity</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Workspace Scope</th>
                  <th className="px-4 py-3.5">Phone / Contact</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSuperAdminScope = u.portal === 'platform' || u.role.startsWith('super_admin');
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                              {u.name}
                              {isSuperAdminScope && (
                                <span className="p-0.5 rounded bg-indigo-50 text-indigo-600" title="Platform HQ Staff">
                                  <Shield className="w-3 h-3" />
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`capitalize px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                            u.role === 'super_admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'super_admin_manager'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-teal-50 text-teal-700 border-teal-200'
                          }`}
                        >
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isSuperAdminScope ? (
                          <span className="text-indigo-600 font-semibold flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 shrink-0" /> Platform Global HQ
                          </span>
                        ) : (
                          <span className="text-slate-800 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {u.hospitalName || u.hospitalId || 'Hospital Tenant'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {u.phone || '—'}
                      </td>

                      <td className="px-4 py-3.5">
                        {u.status === 'active' ? (
                          <Badge variant="success" dot>Active</Badge>
                        ) : (
                          <Badge variant="neutral" dot>Inactive</Badge>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User Credentials"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className={u.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => setConfirmDeleteId(u.id)}
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Platform / Hospital Admin User' : 'Add Platform Executive or Hospital Admin'}
        subtitle="Provision login credentials and configure role permissions synced across platform facilities"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {/* Avatar / Profile Photo Upload Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" /> User Identity Photo / Avatar *
              </label>
              {formData.avatar && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: '' })}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Reset Photo
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
                  }}
                />
                <label
                  className="absolute inset-0 bg-slate-900/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white shadow-md"
                  title="Upload New Photo"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileUpload}
                  />
                </label>
              </div>

              <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <label className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileUpload}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">or choose from presets below</span>
                </div>

                <input
                  type="text"
                  placeholder="Or paste image URL (https://...)"
                  value={formData.avatar.startsWith('data:') ? '(Uploaded Image Attached)' : formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div className="pt-2 border-t border-slate-200/60">
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Quick Presets:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: p.url })}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                      formData.avatar === p.url
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="truncate min-w-0">
                      <p className="truncate font-medium leading-tight">{p.name}</p>
                      <span className="text-[9px] text-slate-400">{p.roleTag}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. John Doe"
              required
            />

            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. admin@hospital.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="System Role *"
              value={formData.role}
              onChange={(e) => {
                const r = e.target.value as UserRole;
                const p = r.startsWith('super_admin') ? 'platform' : r === 'sales_executive' ? 'sales' : 'hospital';
                setFormData({
                  ...formData,
                  role: r,
                  portal: p,
                  department:
                    r === 'sales_executive'
                      ? 'Sales & Business Development'
                      : r === 'hospital_admin'
                      ? 'Hospital Executive Management'
                      : r === 'super_admin'
                      ? 'Global Executive HQ'
                      : 'Platform Operations & Support',
                });
              }}
            >
              <option value="super_admin_manager">Super Admin Manager (Platform HQ)</option>
              <option value="super_admin">Super Admin (Platform HQ)</option>
              <option value="sales_executive">Sales & Business Development Executive (Platform HQ)</option>
              <option value="hospital_admin">Hospital Admin (Hospital Facility Director)</option>
            </Select>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Login Password *
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter login password"
                    className="w-full text-xs py-2 pl-3 pr-8 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomPassword}
                  title="Generate Random Secure Password"
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
                  className="shrink-0 text-xs font-bold bg-amber-50/50 hover:bg-amber-100 border-amber-300 text-amber-900"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

          {/* Assigned Hospital Facility (Strictly shown when role is hospital_admin) */}
          {formData.role === 'hospital_admin' && (
            <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-teal-900">
                Assigned Hospital Facility (Synced with Network) *
              </label>
              {hospitals.length === 0 ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No registered hospitals found in database. Register a hospital in Hospital Facilities first.</span>
                </div>
              ) : (
                <select
                  value={formData.hospitalId}
                  onChange={(e) => {
                    const selectedHosp = hospitals.find((h) => h.id === e.target.value);
                    setFormData({
                      ...formData,
                      hospitalId: e.target.value,
                      hospitalName: selectedHosp ? selectedHosp.name : '',
                    });
                  }}
                  required
                  className="w-full text-xs py-2 px-3 border border-teal-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                >
                  <option value="">-- Choose Registered Hospital Facility --</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.id} • {h.city}, {h.state})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-teal-700">
                Linking this admin will automatically update the hospital facility profile and grant access to manage doctors, patients, billing, and appointments for this tenant.
              </p>
            </div>
          )}

          

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              {isEditModalOpen ? 'Save Changes' : 'Create User Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Account?"
        message="This action will revoke all permissions and permanently remove this user from the directory."
        confirmText="Yes, Delete User"
      />
    </div>
  );
};

export default PlatformUsers;
