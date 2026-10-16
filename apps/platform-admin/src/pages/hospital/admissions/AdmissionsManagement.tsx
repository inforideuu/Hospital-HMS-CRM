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
import { Admission, Bed, WardType, BedStatus } from '../../../types';
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
  const [beds, setBeds] = useState<Bed[]>(() => MockStorage.getBeds(hospId));
  const patients = MockStorage.getPatients(hospId);
  const doctors = MockStorage.getDoctors(hospId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState('all');

  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [dischargeConfirmId, setDischargeConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    wardType: 'General Ward' as WardType,
    bedNumber: 'GEN-Bed-11',
    admissionType: 'Emergency' as Admission['admissionType'],
    reason: '',
    notes: '',
    initialDeposit: 1000,
  });

  const refreshData = () => {
    setAdmissions(MockStorage.getAdmissions(hospId));
    setBeds(MockStorage.getBeds(hospId));
  };

  const activeAdmissions = admissions.filter((a) => a.status === 'Active');

  const availableBeds = beds.filter((b) => b.status === 'Available');
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied');
  const maintenanceBeds = beds.filter((b) => b.status === 'Maintenance');

  const handleOpenAdmit = () => {
    const firstFreeBed = availableBeds[0];
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      wardType: firstFreeBed?.wardType || 'General Ward',
      bedNumber: firstFreeBed?.bedNumber || 'GEN-Bed-11',
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

    const newAdmission: Admission = {
      id: `ADM-50${10 + admissions.length}`,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      doctorId: doc.id,
      doctorName: doc.name,
      departmentName: doc.departmentName,
      wardType: formData.wardType,
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
            <Button variant="primary" size="sm" onClick={handleOpenAdmit} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Admit Inpatient
            </Button>
          </div>
        }
      />

      {/* Bed Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ward Beds</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{beds.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Free</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{availableBeds.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupied (IPD)</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">{occupiedBeds.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Maintenance</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{maintenanceBeds.length}</p>
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
                <p className="text-[10px] text-slate-500 font-medium truncate">{bed.wardType}</p>
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
                  wardType: b?.wardType || formData.wardType,
                });
              }}
              required
            >
              {availableBeds.map((b) => (
                <option key={b.id} value={b.bedNumber}>
                  {b.bedNumber} ({b.wardType} — ${b.dailyRate}/day)
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
              label="Initial Admission Deposit ($)"
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
