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
  CheckCircle2,
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
import { Modal } from '../../../components/ui/Modal';

export const DepartmentManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [departments, setDepartments] = useState<Department[]>(() => MockStorage.getDepartments(hospId));
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headDoctorName: '',
    description: '',
    doctorCount: 5,
    staffCount: 15,
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
      headDoctorName: 'Dr. Physician Lead',
      description: 'Clinical specialty care and diagnostics.',
      doctorCount: 4,
      staffCount: 12,
      phoneExtension: `Ext. 40${departments.length + 1}`,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      headDoctorName: dept.headDoctorName || '',
      description: dept.description,
      doctorCount: dept.doctorCount,
      staffCount: dept.staffCount,
      phoneExtension: dept.phoneExtension,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

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
        headDoctorId: 'DOC-101',
        ...formData,
        status: 'active',
      };
      MockStorage.saveDepartment(newDept);
      showToast('Department Created', `${newDept.name} added to clinical hierarchy.`);
      setIsAddModalOpen(false);
    }
    refreshData();
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

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dept) => (
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
                  {dept.headDoctorName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <span className="font-bold text-indigo-900 text-sm block">{dept.doctorCount}</span>
                  <span className="text-[10px] text-indigo-700">Doctors</span>
                </div>
                <div className="p-2 rounded-lg bg-teal-50/50 border border-teal-100">
                  <span className="font-bold text-teal-900 text-sm block">{dept.staffCount}</span>
                  <span className="text-[10px] text-teal-700">Staff</span>
                </div>
              </div>
            </CardContent>

            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {dept.phoneExtension}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenEdit(dept)}
                leftIcon={<Edit className="w-3 h-3" />}
              >
                Configure
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Department' : 'Create Clinical Department'}
        subtitle="Configure department metadata and resource quotas"
        maxWidth="md"
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <Input
            label="Department Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Oncology & Radiation Sciences"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="ONC-07"
              required
            />
            <Input
              label="Phone Extension"
              value={formData.phoneExtension}
              onChange={(e) => setFormData({ ...formData, phoneExtension: e.target.value })}
              placeholder="Ext. 407"
            />
          </div>

          <Input
            label="Head of Department (Lead Physician)"
            value={formData.headDoctorName}
            onChange={(e) => setFormData({ ...formData, headDoctorName: e.target.value })}
            placeholder="Dr. Specialist Lead"
          />

          <Textarea
            label="Department Scope / Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Clinical specialty overview"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Doctors"
              type="number"
              value={formData.doctorCount}
              onChange={(e) => setFormData({ ...formData, doctorCount: Number(e.target.value) })}
            />
            <Input
              label="Staff"
              type="number"
              value={formData.staffCount}
              onChange={(e) => setFormData({ ...formData, staffCount: Number(e.target.value) })}
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
              {isEditModalOpen ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
