import React, { useState } from 'react';
import {
  BedDouble,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Stethoscope,
  Building2,
  Calendar,
  LogOut,
  Download,
  DollarSign,
  Layers,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Admission, Bed, Ward, WardType, BedStatus } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';

export const AdmissionsManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [admissions, setAdmissions] = useState<Admission[]>(() => MockStorage.getAdmissions(hospId));
  const [wards, setWards] = useState<Ward[]>(() => MockStorage.getWards(hospId));
  const [beds, setBeds] = useState<Bed[]>(() => MockStorage.getBeds(hospId));
  const patients = MockStorage.getPatients(hospId);
  const doctors = MockStorage.getDoctors(hospId);
  const departments = MockStorage.getDepartments(hospId);

  // Current Subscription Plan (Trial Max = 20 Beds)
  const currentPlan = MockStorage.getPlanByTier(currentHospital?.planTier || 'trial');
  const maxBedsLimit = currentPlan.maxBeds || 20;

  const [activeTab, setActiveTab] = useState<'matrix' | 'wards' | 'admissions'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);
  const [dischargeConfirmId, setDischargeConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    wardId: wards[0]?.id || '',
    bedNumber: beds[0]?.bedNumber || '',
    admissionType: 'Emergency' as Admission['admissionType'],
    reason: '',
    notes: '',
    initialDeposit: 1000,
  });

  const [wardFormData, setWardFormData] = useState({
    name: '',
    wardType: 'General Ward' as WardType,
    departmentId: departments[0]?.id || '',
    floor: '1st Floor',
    dailyRate: 150,
    initialBedsCount: 0,
    description: '',
  });

  const [bedFormData, setBedFormData] = useState({
    wardId: wards[0]?.id || '',
    bedNumber: '',
    dailyRate: 150,
    notes: '',
  });

  const refreshData = () => {
    setAdmissions(MockStorage.getAdmissions(hospId));
    setWards(MockStorage.getWards(hospId));
    setBeds(MockStorage.getBeds(hospId));
  };

  const activeAdmissions = admissions.filter((a) => a.status === 'Active');
  const availableBeds = beds.filter((b) => b.status === 'Available');
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied');
  const maintenanceBeds = beds.filter((b) => b.status === 'Maintenance');

  const handleOpenAddWard = () => {
    setWardFormData({
      name: '',
      wardType: 'General Ward',
      departmentId: departments[0]?.id || '',
      floor: '1st Floor',
      dailyRate: 150,
      initialBedsCount: 0,
      description: '',
    });
    setIsAddWardModalOpen(true);
  };

  const handleAddWardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === wardFormData.departmentId);
    if (!dept) {
      showToast('Validation Error', 'Please select a valid associated department.', 'error');
      return;
    }

    const initialBeds = Number(wardFormData.initialBedsCount || 0);
    if (beds.length + initialBeds > maxBedsLimit) {
      showToast(
        'Subscription Bed Limit Exceeded',
        `All wards combined cannot exceed your subscription plan limit of ${maxBedsLimit} beds. Currently allocating ${beds.length} beds across all combined wards.`,
        'error'
      );
      return;
    }

    const newWard: Ward = {
      id: `WARD-${100 + wards.length + 1}`,
      hospitalId: hospId,
      name: wardFormData.name,
      wardType: wardFormData.wardType,
      floor: wardFormData.floor,
      departmentId: dept.id,
      departmentName: dept.name,
      dailyRate: Number(wardFormData.dailyRate),
      description: wardFormData.description,
    };

    MockStorage.saveWard(newWard);

    // Auto-create initial beds if specified
    if (initialBeds > 0) {
      for (let i = 1; i <= initialBeds; i++) {
        const bedNum = `${wardFormData.name.slice(0, 3).toUpperCase()}-${String(i).padStart(2, '0')}`;
        const newBed: Bed = {
          id: `BED-${Date.now()}-${i}`,
          hospitalId: hospId,
          wardId: newWard.id,
          wardName: newWard.name,
          bedNumber: bedNum,
          wardType: newWard.wardType,
          floor: newWard.floor,
          status: 'Available',
          dailyRate: Number(wardFormData.dailyRate),
        };
        MockStorage.saveBed(newBed);
      }
    }

    showToast('Ward Created', `Ward "${newWard.name}" created under ${newWard.departmentName}${initialBeds > 0 ? ` with ${initialBeds} beds` : ''}.`);
    setIsAddWardModalOpen(false);
    refreshData();
  };

  const handleOpenAddBed = () => {
    if (beds.length >= maxBedsLimit) {
      showToast(
        'Subscription Bed Limit Reached',
        `All wards combined cannot exceed your subscription plan limit of ${maxBedsLimit} beds (${beds.length}/${maxBedsLimit} used). Upgrade your plan to add more beds.`,
        'error'
      );
      return;
    }

    const firstWard = wards[0];
    setBedFormData({
      wardId: firstWard?.id || '',
      bedNumber: `BED-${100 + beds.length + 1}`,
      dailyRate: firstWard?.dailyRate || 150,
      notes: '',
    });
    setIsAddBedModalOpen(true);
  };

  const handleAddBedSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check Hospital-Level Subscription Bed Limit across all wards combined
    if (beds.length >= maxBedsLimit) {
      showToast(
        'Subscription Bed Limit Reached',
        `All wards combined cannot exceed your subscription plan limit of ${maxBedsLimit} beds (${beds.length}/${maxBedsLimit} used). Upgrade your plan to add more beds.`,
        'error'
      );
      return;
    }

    const ward = wards.find((w) => w.id === bedFormData.wardId);
    if (!ward) {
      showToast('Validation Error', 'Please select a valid Ward.', 'error');
      return;
    }

    // Check bed number uniqueness across hospital
    if (beds.some((b) => b.bedNumber.toLowerCase() === bedFormData.bedNumber.toLowerCase())) {
      showToast('Validation Error', `Bed code "${bedFormData.bedNumber}" already exists in this hospital.`, 'error');
      return;
    }

    const newBed: Bed = {
      id: `BED-${Date.now().toString().slice(-4)}`,
      hospitalId: hospId,
      wardId: ward.id,
      wardName: ward.name,
      bedNumber: bedFormData.bedNumber,
      wardType: ward.wardType,
      floor: ward.floor,
      status: 'Available',
      dailyRate: Number(bedFormData.dailyRate || ward.dailyRate),
      notes: bedFormData.notes,
    };

    MockStorage.saveBed(newBed);
    showToast('Bed Created', `Physical bed ${newBed.bedNumber} added under ${ward.name}.`);
    setIsAddBedModalOpen(false);
    refreshData();
  };

  const handleOpenAdmit = () => {
    const firstFreeBed = availableBeds[0];
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      wardId: firstFreeBed?.wardId || wards[0]?.id || '',
      bedNumber: firstFreeBed?.bedNumber || '',
      admissionType: 'Emergency',
      reason: 'Acute Medical Inpatient Observation',
      notes: '',
      initialDeposit: 1500,
    });
    setIsAdmitModalOpen(true);
  };

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === formData.patientId);
    const doc = doctors.find((d) => d.id === formData.doctorId);

    if (!pat || !doc) {
      showToast('Validation Error', 'Please select a valid patient and attending physician.', 'error');
      return;
    }

    const targetBed = beds.find((b) => b.bedNumber === formData.bedNumber);
    if (!targetBed || targetBed.status !== 'Available') {
      showToast('Validation Error', 'Selected bed is not currently available for intake.', 'error');
      return;
    }

    const newAdmission: Admission = {
      id: `ADM-50${10 + admissions.length}`,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      doctorId: doc.id,
      doctorName: doc.name,
      departmentName: doc.departmentName,
      wardType: targetBed.wardType,
      bedNumber: formData.bedNumber,
      admissionDate: new Date().toISOString().split('T')[0],
      admissionType: formData.admissionType,
      reason: formData.reason,
      notes: formData.notes,
      status: 'Active',
      initialDeposit: formData.initialDeposit,
    };

    MockStorage.saveAdmission(newAdmission);

    // Update patient status to Inpatient
    pat.status = 'Inpatient';
    pat.roomBedNumber = formData.bedNumber;
    MockStorage.savePatient(pat);

    showToast('Patient Admitted', `${pat.name} admitted to ${formData.bedNumber}.`);
    setIsAdmitModalOpen(false);
    refreshData();
  };

  const handleDischargeConfirm = () => {
    if (dischargeConfirmId) {
      MockStorage.dischargeAdmission(dischargeConfirmId);
      showToast('Patient Discharged', 'Bed released and marked available for intake.');
      setDischargeConfirmId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Inpatient (IPD) Admissions & Bed Ward Allocation"
        subtitle="Live ward telemetry, critical care bed occupancy, and patient discharge workflow."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Admissions & Beds' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Admissions_Log', admissions)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Roster
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenAddWard} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Ward
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenAddBed} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add New Bed ({beds.length}/{maxBedsLimit})
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdmit} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Admit Inpatient
            </Button>
          </div>
        }
      />

      {/* Bed Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Subscription Beds</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{beds.length} / {maxBedsLimit} Max</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Free Beds</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{availableBeds.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupied (IPD)</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">{occupiedBeds.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Wards</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{wards.length}</p>
        </div>
      </div>

      {/* Interactive Visual Bed Matrix */}
      <Card>
        <CardHeader
          title="Hospital Ward Bed Matrix (Floor Plan)"
          subtitle="Real-time physical bed status across critical care, deluxe private, and general wards"
          action={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Occupied
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Maintenance
              </span>
            </div>
          }
        />
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {beds.map((bed) => {
            const isOcc = bed.status === 'Occupied';
            const isAvail = bed.status === 'Available';
            const isMaint = bed.status === 'Maintenance';

            return (
              <div
                key={bed.id}
                className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                  isAvail
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                    : isOcc
                    ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                    : 'bg-rose-50/50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{bed.bedNumber}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAvail ? 'bg-emerald-500' : isOcc ? 'bg-indigo-600' : 'bg-rose-500'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">{bed.wardName || bed.wardType}</p>
                {isOcc ? (
                  <p className="text-[11px] font-bold text-indigo-900 truncate">
                    👤 {bed.currentPatientName || 'Patient In Bed'}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">
                    ${bed.dailyRate}/day
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Active IPD Admissions Table */}
      <Card>
        <CardHeader
          title="Current Inpatient (IPD) Admissions Roster"
          subtitle="Patients currently admitted in medical wards"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Admission & Patient</th>
                <th className="px-4 py-3.5">Ward & Bed Allocation</th>
                <th className="px-4 py-3.5">Attending Specialist</th>
                <th className="px-4 py-3.5">Admission Date</th>
                <th className="px-4 py-3.5">Care Reason</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeAdmissions.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900 leading-tight">{adm.patientName}</p>
                    <p className="text-[11px] text-indigo-600 font-mono mt-0.5">{adm.id} • {adm.patientId}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {adm.bedNumber}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">{adm.wardType}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">{adm.doctorName}</p>
                    <p className="text-[10px] text-slate-400">{adm.departmentName}</p>
                  </td>

                  <td className="px-4 py-3.5 text-slate-700">
                    <p className="font-medium">{adm.admissionDate}</p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {adm.admissionType}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-600 max-w-[220px] truncate">
                    {adm.reason}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      onClick={() => setDischargeConfirmId(adm.id)}
                      leftIcon={<LogOut className="w-3.5 h-3.5" />}
                    >
                      Discharge Patient
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admit Patient Modal */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Admit Inpatient to Medical Ward"
        subtitle="Assign patient, attending specialist, and reserve physical bed"
        maxWidth="lg"
      >
        <form onSubmit={handleAdmitSubmit} className="space-y-4">
          <Select
            label="Select Patient *"
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            required
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — Status: {p.status}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Attending Physician / Specialist *"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              required
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization})
                </option>
              ))}
            </Select>

            <Select
              label="Select Available Bed *"
              value={formData.bedNumber}
              onChange={(e) => {
                const b = beds.find((bed) => bed.bedNumber === e.target.value);
                setFormData({
                  ...formData,
                  bedNumber: e.target.value,
                  wardId: b?.wardId || formData.wardId,
                });
              }}
              required
            >
              {availableBeds.map((b) => (
                <option key={b.id} value={b.bedNumber}>
                  {b.bedNumber} ({b.wardName || b.wardType} — ${b.dailyRate}/day)
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Admission Type"
              value={formData.admissionType}
              onChange={(e) => setFormData({ ...formData, admissionType: e.target.value as any })}
            >
              <option value="Emergency">Emergency Intake</option>
              <option value="Elective">Elective / Scheduled Surgery</option>
              <option value="Transfer">Transfer from another facility</option>
              <option value="Maternity">Maternity / Delivery</option>
            </Select>

            <Input
              label="Initial Admission Deposit (₹)"
              type="number"
              value={formData.initialDeposit}
              onChange={(e) => setFormData({ ...formData, initialDeposit: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Diagnosis / Admission Reason *"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="e.g. Acute Coronary Syndrome, telemetry monitoring"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Inpatient Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Ward Modal */}
      <Modal
        isOpen={isAddWardModalOpen}
        onClose={() => setIsAddWardModalOpen(false)}
        title="Create Physical Ward"
        subtitle="Configure physical patient-care area under an associated clinical department"
        maxWidth="md"
      >
        <form onSubmit={handleAddWardSubmit} className="space-y-4">
          <Input
            label="Ward Name *"
            value={wardFormData.name}
            onChange={(e) => setWardFormData({ ...wardFormData, name: e.target.value })}
            placeholder="e.g. Cardiology ICU Ward"
            required
          />

          <Select
            label="Associated Clinical Department *"
            value={wardFormData.departmentId}
            onChange={(e) => setWardFormData({ ...wardFormData, departmentId: e.target.value })}
            required
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Ward Category *"
              value={wardFormData.wardType}
              onChange={(e) => setWardFormData({ ...wardFormData, wardType: e.target.value as WardType })}
            >
              <option value="General Ward">General Ward</option>
              <option value="ICU">ICU (Intensive Care)</option>
              <option value="NICU">NICU (Neonatal ICU)</option>
              <option value="CCU">CCU (Cardiac Care)</option>
              <option value="Pediatric Ward">Pediatric Ward</option>
              <option value="Maternity Ward">Maternity Ward</option>
              <option value="Deluxe Private">Deluxe Private</option>
              <option value="Emergency Bay">Emergency Bay</option>
            </Select>

            <Input
              label="Base Daily Rate (₹)"
              type="number"
              value={wardFormData.dailyRate}
              onChange={(e) => setWardFormData({ ...wardFormData, dailyRate: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Floor / Location *"
              value={wardFormData.floor}
              onChange={(e) => setWardFormData({ ...wardFormData, floor: e.target.value })}
              placeholder="e.g. 3rd Floor - Critical Care Block A"
              required
            />
            <div>
              <Input
                label={`Initial Beds (${beds.length}/${maxBedsLimit} Max)`}
                type="number"
                min="0"
                max={Math.max(0, maxBedsLimit - beds.length)}
                value={wardFormData.initialBedsCount}
                onChange={(e) => setWardFormData({ ...wardFormData, initialBedsCount: Number(e.target.value) })}
                placeholder="0"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                All wards combined limit: {maxBedsLimit} beds
              </span>
            </div>
          </div>

          <Textarea
            label="Ward Description / Amenities"
            value={wardFormData.description}
            onChange={(e) => setWardFormData({ ...wardFormData, description: e.target.value })}
            placeholder="Ward equipment, telemetry monitors, and nurse station details"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddWardModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Ward
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add New Bed Modal */}
      <Modal
        isOpen={isAddBedModalOpen}
        onClose={() => setIsAddBedModalOpen(false)}
        title="Add New Physical Bed"
        subtitle={`Create physical bed under a Ward (${beds.length}/${maxBedsLimit} subscription limit used)`}
        maxWidth="md"
      >
        <form onSubmit={handleAddBedSubmit} className="space-y-4">
          <Select
            label="Select Ward *"
            value={bedFormData.wardId}
            onChange={(e) => {
              const selectedWard = wards.find((w) => w.id === e.target.value);
              setBedFormData({
                ...bedFormData,
                wardId: e.target.value,
                dailyRate: selectedWard ? selectedWard.dailyRate : bedFormData.dailyRate,
              });
            }}
            required
          >
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.departmentName} — {w.wardType})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bed Number / Code *"
              value={bedFormData.bedNumber}
              onChange={(e) => setBedFormData({ ...bedFormData, bedNumber: e.target.value })}
              placeholder="e.g. CAR-01"
              required
            />

            <Input
              label="Daily Rate (₹)"
              type="number"
              value={bedFormData.dailyRate}
              onChange={(e) => setBedFormData({ ...bedFormData, dailyRate: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Equipment & Special Bed Notes"
            value={bedFormData.notes}
            onChange={(e) => setBedFormData({ ...bedFormData, notes: e.target.value })}
            placeholder="e.g. Ventilator hookup, electric adjustable posture"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddBedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Physical Bed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Confirmation */}
      <ConfirmDialog
        isOpen={!!dischargeConfirmId}
        onClose={() => setDischargeConfirmId(null)}
        onConfirm={handleDischargeConfirm}
        title="Discharge Inpatient?"
        message="Are you sure you want to discharge this patient? This will release their allocated ward bed and generate final clearance."
        confirmText="Confirm Discharge"
        variant="primary"
      />
    </div>
  );
};
