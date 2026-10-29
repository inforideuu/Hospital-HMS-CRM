import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MockStorage } from '../../services/mockStorage';
import { Prescription } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { printPrescription } from '../../utils/prescriptionPrint';
import {
  Pill,
  Search,
  Calendar,
  User,
  FileText,
  Clock,
  Printer,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Stethoscope,
  Info
} from 'lucide-react';

export const PatientPrescriptions: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const patientId = user?.patientId || 'PAT-1001';

  const loadData = () => {
    const list = MockStorage.getPrescriptions(patientId);
    setPrescriptions(list);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [patientId]);

  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.medications.some((m) => m.medicineName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = (p: Prescription) => {
    printPrescription(p, {
      hospitalName: 'PulseCore Super Specialty Hospital',
    });
  };

  const getStatusBadgeVariant = (status: Prescription['status']) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Refill Requested':
        return 'warning';
      case 'Completed':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Prescriptions & Medications</h1>
          <p className="text-sm text-slate-500 mt-1">
            View active treatments, daily dosages, and physician guidance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              MockStorage.exportToCSV(`Patient_Prescriptions_${patientId}`, filteredPrescriptions);
              showToast('Export Successful', 'Prescriptions exported as CSV.');
            }}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Badge variant="indigo" size="md">
            {prescriptions.filter((p) => p.status === 'Active').length} Active Courses
          </Badge>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Patient Medication Advisory:</span> Always adhere strictly to prescribed dosages and schedules. Never stop antibiotic courses prematurely without consulting your prescribing doctor. For urgent allergic reactions, request immediate medical triage.
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search medication, diagnosis, doctor..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {(['All', 'Active', 'Completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Prescription Cards Grid */}
      {filteredPrescriptions.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Pill className="w-7 h-7" />}
            title="No Prescriptions Found"
            description="You do not have any prescriptions matching your active filters."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPrescriptions.map((prescription) => (
            <Card
              key={prescription.id}
              className="p-5 flex flex-col justify-between border-slate-200 hover:border-brand-300 hover:shadow-md transition-all duration-200"
            >
              <div>
                {/* Header bar */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{prescription.diagnosis}</span>
                        <Badge variant={getStatusBadgeVariant(prescription.status)} size="sm">
                          {prescription.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Rx: {prescription.id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {prescription.date}
                  </span>
                </div>

                {/* Doctor info */}
                <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-lg text-xs text-slate-700">
                  <Stethoscope className="w-4 h-4 text-brand-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">{prescription.doctorName}</span>
                    <span className="text-slate-500"> • {prescription.doctorSpecialization}</span>
                  </div>
                </div>

                {/* Medication Items List */}
                <div className="space-y-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Prescribed Medications ({prescription.medications.length})
                  </span>
                  <div className="divide-y divide-slate-100 bg-white rounded-lg border border-slate-100">
                    {prescription.medications.map((med, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                            {med.medicineName}
                          </p>
                          <p className="text-slate-500 pl-3">
                            {med.dosage} • {med.frequency}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium text-[11px]">
                            {med.duration}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{med.instructions}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.notes && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-4 flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="italic">{prescription.notes}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setSelectedPrescription(prescription);
                    setIsDetailModalOpen(true);
                  }}
                >
                  View Details
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => handlePrint(prescription)}
                  >
                    Print
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Prescription Details — ${selectedPrescription.id}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="p-4 bg-brand-50/60 rounded-xl border border-brand-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-700 font-semibold uppercase tracking-wider">Clinical Diagnosis</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedPrescription.diagnosis}</h3>
                <p className="text-xs text-slate-500 mt-1">Prescribed on {selectedPrescription.date}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedPrescription.status)} size="md">
                {selectedPrescription.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-400 uppercase font-semibold">Prescribing Physician</p>
                <p className="text-slate-900 font-bold text-sm mt-1">{selectedPrescription.doctorName}</p>
                <p className="text-slate-500">{selectedPrescription.doctorSpecialization}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-400 uppercase font-semibold">Patient Record</p>
                <p className="text-slate-900 font-bold text-sm mt-1">{selectedPrescription.patientName}</p>
                <p className="text-slate-500">ID: {selectedPrescription.patientId}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Medication Schedule</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedPrescription.medications.map((m, idx) => (
                  <div key={idx} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.medicineName}</p>
                      <p className="text-xs text-slate-500">
                        Dosage: <span className="font-medium text-slate-700">{m.dosage}</span> • Frequency:{' '}
                        <span className="font-medium text-slate-700">{m.frequency}</span>
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="px-2 py-0.5 bg-brand-50 text-brand-700 font-semibold rounded">
                        {m.duration}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">{m.instructions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPrescription.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-semibold text-slate-700">Special Instructions / Doctor Notes:</span>
                <p className="text-slate-600 mt-1 whitespace-pre-line">{selectedPrescription.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const rows = (selectedPrescription.medications || []).map((m, idx) => ({
                      Prescription_ID: selectedPrescription.id,
                      Item: idx + 1,
                      Patient: selectedPrescription.patientName,
                      Doctor: selectedPrescription.doctorName,
                      Date: selectedPrescription.date,
                      Medicine: m.medicineName,
                      Dosage: m.dosage,
                      Frequency: m.frequency,
                      Duration: m.duration,
                      Instructions: m.instructions || 'As directed',
                      Diagnosis: selectedPrescription.diagnosis,
                    }));
                    MockStorage.exportToCSV(`Prescription_${selectedPrescription.id}`, rows);
                    showToast('Prescription Downloaded', `Prescription ${selectedPrescription.id} downloaded successfully.`);
                  }}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download CSV
                </Button>
                <Button variant="outline" onClick={() => handlePrint(selectedPrescription)} leftIcon={<Printer className="w-4 h-4" />}>
                  Print / Save PDF
                </Button>
              </div>
              <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientPrescriptions;
