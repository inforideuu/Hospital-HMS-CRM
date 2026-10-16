import React, { useState } from 'react';
import {
  DoorOpen,
  Plus,
  Search,
  Building2,
  Stethoscope,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Layers,
  Filter,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { OPDRoom, OPDRoomStatus, Department } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const OPDRoomManagement: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const isHospitalAdmin =
    user?.role === 'hospital_admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'super_admin_manager';

  const [opdRooms, setOpdRooms] = useState<OPDRoom[]>(() => MockStorage.getOPDRooms(hospId));
  const departments = MockStorage.getDepartments(hospId);
  const doctors = MockStorage.getDoctors(hospId);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<OPDRoom | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: departments[0]?.id || '',
    location: '',
    status: 'Available' as OPDRoomStatus,
    description: '',
  });

  const refreshData = () => {
    setOpdRooms(MockStorage.getOPDRooms(hospId));
  };

  const filtered = opdRooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'all' || room.departmentId === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleOpenAdd = () => {
    const defaultDept = departments[0];
    setFormData({
      name: '',
      code: `OPD-${(opdRooms.length + 1) * 100 + 1}`,
      departmentId: defaultDept?.id || '',
      location: 'Ground Floor – Block A',
      status: 'Available',
      description: 'Standard outpatient consultation room with diagnostic equipment.',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (room: OPDRoom) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      code: room.code,
      departmentId: room.departmentId,
      location: room.location,
      status: room.status,
      description: room.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.departmentId || !formData.location) {
      showToast('Validation Error', 'Room Name, Code, Associated Department, and Location are required.', 'error');
      return;
    }

    const dept = departments.find((d) => d.id === formData.departmentId);
    if (!dept) {
      showToast('Validation Error', 'Selected department does not exist.', 'error');
      return;
    }

    if (isEditModalOpen && selectedRoom) {
      const updated: OPDRoom = {
        ...selectedRoom,
        ...formData,
        departmentName: dept.name,
      };
      MockStorage.saveOPDRoom(updated);
      showToast('OPD Room Updated', `${updated.name} configuration saved.`);
      setIsEditModalOpen(false);
    } else {
      const newRoom: OPDRoom = {
        id: `OPD-${Date.now().toString(36).substring(2, 7)}`,
        hospitalId: hospId,
        ...formData,
        departmentName: dept.name,
      };
      MockStorage.saveOPDRoom(newRoom);
      showToast('OPD Room Created', `${newRoom.name} added under ${dept.name}.`);
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleToggleStatus = (room: OPDRoom) => {
    const nextStatus: OPDRoomStatus = room.status === 'Available' ? 'Inactive' : 'Available';
    MockStorage.updateOPDRoomStatus(room.id, nextStatus);
    showToast('Room Status Changed', `${room.name} marked as ${nextStatus}.`);
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      const roomToDelete = opdRooms.find((r) => r.id === confirmDeleteId);
      MockStorage.deleteOPDRoom(confirmDeleteId);
      showToast('OPD Room Removed', `OPD Room "${roomToDelete?.name}" deleted.`);
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="OPD Rooms & Consultation Chambers"
        subtitle="Manage outpatient consultation rooms, department allocations, and clinical chamber availability."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'OPD Rooms' }]}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Create OPD Room
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search OPD room by name, code, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
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
        </div>

        {/* OPD Rooms Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <DoorOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-sm">No OPD Rooms Found</h3>
              <p className="text-xs text-slate-500 mt-1">Create OPD rooms for your hospital departments to begin assigning doctors.</p>
              <Button variant="outline" size="sm" onClick={handleOpenAdd} className="mt-4">
                + Create First OPD Room
              </Button>
            </div>
          ) : (
            filtered.map((room) => {
              const assignedDocs = doctors.filter(
                (d) => d.opdRoomId === room.id || d.roomNumber.includes(room.code)
              );

              return (
                <div
                  key={room.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {room.code}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1.5 leading-snug">{room.name}</h3>
                      </div>
                      {room.status === 'Available' ? (
                        <Badge variant="success" size="sm" dot>Available</Badge>
                      ) : room.status === 'Occupied' ? (
                        <Badge variant="info" size="sm" dot>Occupied</Badge>
                      ) : room.status === 'Maintenance' ? (
                        <Badge variant="warning" size="sm" dot>Maintenance</Badge>
                      ) : (
                        <Badge variant="error" size="sm" dot>Inactive</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <p className="flex items-center gap-2 font-medium text-indigo-700">
                        <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Department: {room.departmentName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Location: {room.location}</span>
                      </p>
                      {room.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {room.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Assigned Specialist(s)
                      </span>
                      {assignedDocs.length > 0 ? (
                        <div className="space-y-1">
                          {assignedDocs.map((doc) => (
                            <p key={doc.id} className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Stethoscope className="w-3 h-3 text-teal-600 shrink-0" />
                              {doc.name}
                            </p>
                          ))}
                        </div>
                      ) : room.assignedDoctorName ? (
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Stethoscope className="w-3 h-3 text-teal-600 shrink-0" />
                          {room.assignedDoctorName}
                        </p>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned (Ready for Doctor)</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleToggleStatus(room)}
                    >
                      {room.status === 'Available' ? 'Deactivate' : 'Activate Room'}
                    </Button>

                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(room)}
                        title="Configure Room"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      {isHospitalAdmin && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-rose-600"
                          onClick={() => setConfirmDeleteId(room.id)}
                          title="Delete OPD Room"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add / Edit OPD Room Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit OPD Room / Chamber' : 'Create OPD Room / Chamber'}
        subtitle="Configure outpatient consultation chamber and department assignment"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <Input
            label="Room Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. General Medicine OPD"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Room Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. OPD-101"
              required
            />

            <Select
              label="Associated Department *"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              required
            >
              {departments.length === 0 ? (
                <option value="">No departments available</option>
              ) : (
                departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Floor / Location *"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Ground Floor – Block A"
              required
            />

            <Select
              label="Operational Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as OPDRoomStatus })}
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>

          <Textarea
            label="Description / Facilities"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Equipment, examination couch, diagnostic tools..."
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
              {isEditModalOpen ? 'Save Changes' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete OPD Room?"
        message="Are you sure you want to delete this OPD room? Doctors assigned to this chamber will need relocation."
        confirmText="Yes, Delete Room"
      />
    </div>
  );
};

export default OPDRoomManagement;
