import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Building2,
  Stethoscope,
  Users,
  BedDouble,
  Phone,
  Edit,
  Trash2,
  CheckCircle2,
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
import { SubscriptionUpgradeModal } from '../../../components/common/SubscriptionUpgradeModal';
import { isCapabilityAllowedForTier } from '../../../constants/planCapabilities';

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
  const beds = MockStorage.getBeds(hospId);

  // Subscription Plan Limits
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const currentTier = currentHospital?.planTier || 'trial';
  const hasBedCapability = isCapabilityAllowedForTier(currentTier, 'admissions_beds');
  const currentPlan = MockStorage.getPlanByTier(currentTier);
  const maxBedsLimit = currentPlan.maxBeds || (hasBedCapability ? 20 : 0);
  const maxDoctorsLimit = currentPlan.maxDoctors || 3;
  const maxStaffLimit = currentPlan.maxStaff || 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deleteConfirmDeptId, setDeleteConfirmDeptId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headDoctorId: '',
    headDoctorName: 'Not Assigned',
    description: '',
    phoneExtension: 'Ext. 401',
  });

  const refreshData = () => {
    setDepartments(MockStorage.getDepartments(hospId));
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.headDoctorName && d.headDoctorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: `DEP-0${departments.length + 1}`,
      headDoctorId: '',
      headDoctorName: 'Not Assigned',
      description: 'Clinical specialty care and diagnostics.',
      phoneExtension: `Ext. 40${departments.length + 1}`,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      headDoctorId: dept.headDoctorId || '',
      headDoctorName: dept.headDoctorName || 'Not Assigned',
      description: dept.description,
      phoneExtension: dept.phoneExtension,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (isEditModalOpen && selectedDept) {
      const updated: Department = {
        ...selectedDept,
        ...formData,
      };
      MockStorage.saveDepartment(updated);
      showToast('Department Updated', `${updated.name} configuration saved.`);
      setIsEditModalOpen(false);
    } else {
      const newDept: Department = {
        id: `DEP-${100 + departments.length + 1}`,
        hospitalId: hospId,
        ...formData,
        headDoctorName: formData.headDoctorName || 'Not Assigned',
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Clinical Departments & Centers of Excellence"
        subtitle="Configure hospital divisions, department directors, and medical staff ratios."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Departments' }]}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Create Department
          </Button>
        }
      />

      {/* Subscription Capacity Telemetry Banner */}
      <div className="p-4 rounded-xl border bg-indigo-50/60 border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Hospital Subscription Telemetry ({currentPlan.name} Plan)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
              <span>
                <strong>Doctors:</strong> {doctors.length} / {maxDoctorsLimit} Max
              </span>
              <span>•</span>
              <span>
                <strong>Staff:</strong> {staffList.length} / {maxStaffLimit} Max
              </span>
              {hasBedCapability && (
                <>
                  <span>•</span>
                  <span>
                    <strong>Hospital Beds:</strong> {beds.length} / {maxBedsLimit} Max Beds
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsUpgradeModalOpen(true)}
          leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
          className="shrink-0"
        >
          Upgrade Capacity Plan
        </Button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dept) => {
          // Dynamic actual counts registered in mockStorage for this department
          const realDocs = doctors.filter((d) => d.departmentId === dept.id || d.departmentName === dept.name).length;
          const realStaff = staffList.filter((s) => s.department === dept.name || s.department === dept.code).length;

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

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
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
                </div>
              </CardContent>

              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {dept.phoneExtension}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Configure Department & HOD' : 'Create Clinical Department'}
        subtitle="Specify clinical department metadata (HOD optional during creation)"
        maxWidth="md"
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <Input
            label="Department Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. General Medicine"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. GEN-01"
              required
            />
            <Input
              label="Phone Extension"
              value={formData.phoneExtension}
              onChange={(e) => setFormData({ ...formData, phoneExtension: e.target.value })}
              placeholder="Ext. 401"
            />
          </div>

          <div>
            <Select
              label="Head of Department (Lead Physician)"
              value={formData.headDoctorId}
              onChange={(e) => {
                const docId = e.target.value;
                const foundDoc = doctors.find((d) => d.id === docId);
                setFormData({
                  ...formData,
                  headDoctorId: docId,
                  headDoctorName: foundDoc ? foundDoc.name : 'Not Assigned',
                });
              }}
            >
              <option value="">Not Assigned</option>
              {(() => {
                const deptDoctors = selectedDept
                  ? doctors.filter((d) => d.departmentId === selectedDept.id || d.departmentName === selectedDept.name)
                  : [];
                return deptDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </option>
                ));
              })()}
            </Select>
            <p className="text-[11px] text-slate-500 mt-1">
              💡 Head of Department is optional during creation. Only doctors onboarded to this department can be selected as HOD.
            </p>
          </div>

          <Textarea
            label="Department Scope / Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Clinical specialty overview"
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

      {/* DELETE CONFIRMATION DIALOG (RESTRICTED TO HOSPITAL ADMIN) */}
      <ConfirmDialog
        isOpen={!!deleteConfirmDeptId}
        onClose={() => setDeleteConfirmDeptId(null)}
        onConfirm={handleDeleteDeptConfirm}
        title="Delete Clinical Department?"
        message="Are you sure you want to delete this clinical department? This action is restricted to Hospital Admin."
        confirmText="Delete Department"
        variant="danger"
      />

      {/* SUBSCRIPTION UPGRADE MODAL */}
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
