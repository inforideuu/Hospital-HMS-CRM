import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Stethoscope,
  Users,
  Building2,
  Edit,
  Trash2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Department } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const DepartmentManagement: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  // Role check: Only Hospital Admin / Super Admin can delete departments
  const isHospitalAdmin =
    user?.role === 'hospital_admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'super_admin_manager';

  const [departments, setDepartments] = useState<Department[]>(() => MockStorage.getDepartments(hospId));
  const [searchQuery, setSearchQuery] = useState('');

  const doctors = MockStorage.getDoctors(hospId);
  const staffList = MockStorage.getStaff(hospId);
  const wards = MockStorage.getWards(hospId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deleteConfirmDeptId, setDeleteConfirmDeptId] = useState<string | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headDoctorId: '',
    description: '',
    phoneExtension: '',
  });

  const refreshData = () => {
    setDepartments(MockStorage.getDepartments(hospId));
  };

  useEffect(() => {
    refreshData();
    MockStorage.syncWithBackend?.();
    const handleUpdate = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [hospId]);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.headDoctorName && d.headDoctorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: '',
      headDoctorId: '',
      description: '',
      phoneExtension: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      headDoctorId: dept.headDoctorId || '',
      description: dept.description,
      phoneExtension: dept.phoneExtension,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      showToast('Validation Error', 'Department Name and Department Code are required.', 'error');
      return;
    }

    // Resolve Head of Department doctor name if selected
    let headDocName = 'Not Assigned';
    if (formData.headDoctorId) {
      const doc = doctors.find((d) => d.id === formData.headDoctorId);
      if (doc) {
        headDocName = doc.name;
      }
    }

    if (isEditModalOpen && selectedDept) {
      const updated: Department = {
        ...selectedDept,
        name: formData.name,
        code: formData.code,
        headDoctorId: formData.headDoctorId || undefined,
        headDoctorName: headDocName,
        description: formData.description,
        phoneExtension: formData.phoneExtension,
      };
      MockStorage.saveDepartment(updated);
      showToast('Department Updated', `${updated.name} configuration saved.`);
      setIsEditModalOpen(false);
      const newDept: Department = {
        id: `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        hospitalId: hospId,
        name: formData.name,
        code: formData.code,
        headDoctorId: formData.headDoctorId || undefined,
        headDoctorName: headDocName,
        description: formData.description,
        phoneExtension: formData.phoneExtension,
        doctorCount: 0,
        staffCount: 0,
        status: 'active',
      };
      MockStorage.saveDepartment(newDept);
      showToast('Department Created', `${newDept.name} added to clinical hierarchy.`);
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleDeleteDeptConfirm = () => {
    if (deleteConfirmDeptId) {
      const deptToDelete = departments.find((d) => d.id === deleteConfirmDeptId);
      MockStorage.deleteDepartment(deleteConfirmDeptId);
      showToast(
        'Department Deleted',
        `Department "${deptToDelete?.name || ''}" has been removed by Hospital Admin.`
      );
      setDeleteConfirmDeptId(null);
      refreshData();
    }
  };

  // Get eligible doctors for HOD assignment (belonging to selected department)
  const getEligibleHodDoctors = (dept: Department | null) => {
    if (!dept) return [];
    return doctors.filter(
      (d) => d.departmentId === dept.id || d.departmentName.toLowerCase() === dept.name.toLowerCase()
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Clinical Departments & Centers of Excellence"
        subtitle="Configure hospital divisions, medical specialties, department leadership, and staffing allocations."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Departments' }]}
        actions={
          <div className="flex items-center gap-2">
            {departments.length > 0 && isHospitalAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearAllDialogOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Delete All Existing
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Department
            </Button>
          </div>
        }
      />

      {/* Department Cards Grid */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Clinical Departments Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'No clinical departments matched your search filter.'
              : 'No clinical departments are currently configured. Create a department to begin structuring your clinical divisions.'}
          </p>
          <div className="mt-4">
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create First Department
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dept) => {
          // Dynamic actual counts registered in mockStorage for this department
          const realDocs = doctors.filter((d) => d.departmentId === dept.id || d.departmentName.toLowerCase() === dept.name.toLowerCase()).length;
          const realStaff = staffList.filter((s) => s.department.toLowerCase() === dept.name.toLowerCase() || s.department.toLowerCase() === dept.code.toLowerCase()).length;
          const deptWards = wards.filter((w) => w.departmentId === dept.id || w.departmentName.toLowerCase() === dept.name.toLowerCase()).length;

          return (
            <Card key={dept.id} className="flex flex-col justify-between overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {dept.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-2 leading-tight">{dept.name}</h3>
                </div>
                <Badge variant="success" size="sm" dot>Active</Badge>
              </div>

              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{dept.description}</p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Head of Department</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    {dept.headDoctorName || 'Not Assigned'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
                    <span className="font-bold text-indigo-900 text-sm block">
                      {realDocs}
                    </span>
                    <span className="text-[10px] text-indigo-700">Doctors</span>
                  </div>
                  <div className="p-2 rounded-lg bg-teal-50/50 border border-teal-100">
                    <span className="font-bold text-teal-900 text-sm block">
                      {realStaff}
                    </span>
                    <span className="text-[10px] text-teal-700">Staff</span>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-100 text-purple-900 text-center">
                    <span className="font-bold text-sm block">
                      {deptWards}
                    </span>
                    <span className="text-[10px] text-purple-700">Wards</span>
                  </div>
                </div>
              </CardContent>

              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> {dept.phoneExtension}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenEdit(dept)}
                    leftIcon={<Edit className="w-3 h-3" />}
                  >
                    Configure
                  </Button>
                  {isHospitalAdmin && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-rose-600 hover:bg-rose-50 border border-rose-200/60"
                      onClick={() => setDeleteConfirmDeptId(dept.id)}
                      leftIcon={<Trash2 className="w-3 h-3" />}
                      title="Delete Department (Hospital Admin Only)"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Department' : 'Create Clinical Department'}
        subtitle="Define department name, code, phone extension, leadership, and specialty scope"
        maxWidth="md"
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <Input
            label="Department Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Cardiology & Cardiovascular Sciences"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. CARD-01"
              required
            />
            <Input
              label="Phone Extension"
              value={formData.phoneExtension}
              onChange={(e) => setFormData({ ...formData, phoneExtension: e.target.value })}
              placeholder="Ext. 401"
            />
          </div>

          <Select
            label="Head of Department (Lead Physician)"
            value={formData.headDoctorId}
            onChange={(e) => setFormData({ ...formData, headDoctorId: e.target.value })}
          >
            <option value="">Not Assigned</option>
            {isEditModalOpen && selectedDept ? (
              getEligibleHodDoctors(selectedDept).length > 0 ? (
                getEligibleHodDoctors(selectedDept).map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No doctors onboarded in this department yet
                </option>
              )
            ) : (
              doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.departmentName || doc.specialization})
                </option>
              ))
            )}
          </Select>

          <Textarea
            label="Department Scope / Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Clinical specialty overview and scope of care"
          />

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
              {isEditModalOpen ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteConfirmDeptId}
        onClose={() => setDeleteConfirmDeptId(null)}
        onConfirm={handleDeleteDeptConfirm}
        title="Delete Clinical Department?"
        message="Are you sure you want to delete this clinical department? This action is restricted to Hospital Admin."
        confirmText="Delete Department"
        variant="danger"
      />

      {/* Delete All Existing Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllDialogOpen}
        onClose={() => setIsClearAllDialogOpen(false)}
        onConfirm={() => {
          MockStorage.clearDepartments(hospId);
          showToast('Departments Purged', 'All clinical department records have been deleted.');
          setIsClearAllDialogOpen(false);
          refreshData();
        }}
        title="Delete All Existing Departments?"
        message="Are you sure you want to permanently delete all department records for this hospital? This will reset the departments directory to empty."
        confirmText="Yes, Delete All"
        variant="danger"
      />
    </div>
  );
};
