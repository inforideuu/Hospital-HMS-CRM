import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Pill,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  Edit,
  Trash2,
  Download,
  DollarSign,
  ClipboardList,
  ShoppingCart,
  Printer,
  ShieldAlert,
  MapPin,
  Calendar,
  Stethoscope,
  X,
  Check,
  RefreshCw,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Medicine, Prescription, Invoice, Patient, PaymentMethod, InvoiceStatus } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Pagination } from '../../../components/ui/Pagination';
import { MedicineCombobox } from '../../../components/common/MedicineCombobox';
import { MedicineFormModal } from '../../../components/common/MedicineFormModal';

const getFutureDate = (yearsAhead = 2) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsAhead);
  return d.toISOString().split('T')[0];
};

export const PharmacyManagement: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hospId = user?.hospitalId || currentHospital?.id || 'HOSP-001';

  // Active view tab resolved directly from sidebar route (?tab=...)
  const currentTab = (searchParams.get('tab') as 'prescriptions' | 'pos' | 'inventory' | 'expiry' | 'invoices') || 'inventory';

  // Data States
  const [medicines, setMedicines] = useState<Medicine[]>(() => MockStorage.getMedicines(hospId));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => MockStorage.getPrescriptions(undefined, hospId));
  const [invoices, setInvoices] = useState<Invoice[]>(() => MockStorage.getInvoices(hospId));
  const [patients, setPatients] = useState<Patient[]>(() => MockStorage.getPatients(hospId));
  const [hospitalSettings, setHospitalSettings] = useState(() => MockStorage.getHospitalSettings(hospId));
  const pharmacyGstRate = hospitalSettings.enableGSTBilling !== false ? (hospitalSettings.pharmacyGSTRate ?? 5) : 0;

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Prescription Queue Filters (Undispensed vs Dispensed)
  const urlStatus = searchParams.get('status') as 'all' | 'undispensed' | 'dispensed' | null;
  const [rxStatusFilter, setRxStatusFilter] = useState<'all' | 'undispensed' | 'dispensed'>(urlStatus || 'undispensed');
  const [rxSearchQuery, setRxSearchQuery] = useState('');

  useEffect(() => {
    if (urlStatus && (urlStatus === 'all' || urlStatus === 'undispensed' || urlStatus === 'dispensed')) {
      setRxStatusFilter(urlStatus);
    }
  }, [urlStatus]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

  // Dispensing Modal State
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [dispensePaymentMode, setDispensePaymentMode] = useState<PaymentMethod>('Cash');
  const [dispensePaymentStatus, setDispensePaymentStatus] = useState<InvoiceStatus>('Paid');
  const [dispenseItems, setDispenseItems] = useState<{
    id: string;
    prescribedMedicineName: string;
    prescribedDosage?: string;
    prescribedInstructions?: string;
    prescribedQuantity?: number;
    medicineId?: string;
    medicineName: string;
    genericName?: string;
    dosage: string;
    instructions: string;
    availableStock: number;
    batchNumber: string;
    locationRack: string;
    quantity: number;
    unitPrice: number;
    omitted?: boolean;
  }[]>([]);

  // Invoice Payment Collection Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payCollectionMethod, setPayCollectionMethod] = useState<PaymentMethod>('Cash');
  const [payCollectionRef, setPayCollectionRef] = useState('');

  // OTC POS State
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posPaymentMode, setPosPaymentMode] = useState<PaymentMethod>('Cash');
  const [posCart, setPosCart] = useState<{
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    unitPrice: number;
    quantity: number;
    maxStock: number;
  }[]>([]);
  const [selectedPosMedId, setSelectedPosMedId] = useState('');
  const [posQtyToAdd, setPosQtyToAdd] = useState(1);

  // Restock & Quarantine
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedMedForRestock, setSelectedMedForRestock] = useState<Medicine | null>(null);
  const [restockQty, setRestockQty] = useState(50);
  const [isQuarantineModalOpen, setIsQuarantineModalOpen] = useState(false);
  const [selectedMedForQuarantine, setSelectedMedForQuarantine] = useState<Medicine | null>(null);
  const [quarantineReason, setQuarantineReason] = useState('Expired batch quarantined from clinical dispensing');
  const [expirySubTab, setExpirySubTab] = useState<'all' | 'near_expiry' | 'quarantined'>('all');

  // Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [receiptRx, setReceiptRx] = useState<Prescription | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    sku: '',
    batchNumber: '',
    category: 'Antibiotics' as Medicine['category'],
    stockQuantity: 100,
    minThreshold: 20,
    unitPrice: 15.0,
    expiryDate: getFutureDate(2),
    manufacturer: '',
    locationRack: '',
    requiresPrescription: true,
  });

  const refreshData = () => {
    setMedicines(MockStorage.getMedicines(hospId));
    setPrescriptions(MockStorage.getPrescriptions(undefined, hospId));
    setInvoices(MockStorage.getInvoices(hospId));
    setPatients(MockStorage.getPatients(hospId));
    setHospitalSettings(MockStorage.getHospitalSettings(hospId));
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [hospId]);

  // Derived counts
  const lowStockMeds = medicines.filter((m) => m.status !== 'Quarantined' && m.stockQuantity <= (m.minThreshold || 25));
  const totalStockUnits = medicines.reduce((acc, m) => acc + (m.status !== 'Quarantined' ? m.stockQuantity : 0), 0);
  const isRxDispensed = (rx: Prescription) => rx.status === 'Dispensed' || Boolean(rx.dispensedAt);
  const pendingPrescriptions = prescriptions.filter(
    (rx) => !isRxDispensed(rx) && rx.status !== 'Completed'
  );
  const dispensedPrescriptions = prescriptions.filter((rx) => isRxDispensed(rx));

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      const isDispensed = isRxDispensed(rx);

      // Status Filter
      if (rxStatusFilter === 'undispensed' && isDispensed) return false;
      if (rxStatusFilter === 'dispensed' && !isDispensed) return false;

      // Search Query
      if (rxSearchQuery.trim()) {
        const q = rxSearchQuery.toLowerCase();
        const matchesPatient = rx.patientName?.toLowerCase().includes(q) || rx.patientId?.toLowerCase().includes(q);
        const matchesDoctor = rx.doctorName?.toLowerCase().includes(q);
        const matchesId = rx.id?.toLowerCase().includes(q);
        const matchesDiagnosis = rx.diagnosis?.toLowerCase().includes(q);
        const matchesMed = rx.medications?.some((m) => m.medicineName?.toLowerCase().includes(q));
        if (!matchesPatient && !matchesDoctor && !matchesId && !matchesDiagnosis && !matchesMed) {
          return false;
        }
      }

      return true;
    });
  }, [prescriptions, rxStatusFilter, rxSearchQuery]);
  const expiringSoonItems = medicines.filter((m) => {
    if (m.status === 'Quarantined') return false;
    const exp = new Date(m.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 90;
  });
  const quarantinedItems = medicines.filter((m) => m.status === 'Quarantined');

  const radarItems = useMemo(() => {
    if (expirySubTab === 'near_expiry') return expiringSoonItems;
    if (expirySubTab === 'quarantined') return quarantinedItems;
    return [...quarantinedItems, ...expiringSoonItems];
  }, [expirySubTab, expiringSoonItems, quarantinedItems]);
  const pharmacyInvoices = invoices.filter((inv) =>
    inv.items.some(
      (item) => item.category === 'Pharmacy' || item.description?.toLowerCase().includes('rx') || item.description?.toLowerCase().includes('batch')
    )
  );

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filteredMedicines.length / pageSize) || 1;
  const paginatedMedicines = filteredMedicines.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setSelectedMed(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setSelectedMed(med);
    setIsAddModalOpen(true);
  };

  const handleReleaseFromQuarantine = (med: Medicine) => {
    MockStorage.releaseFromQuarantine(med.id, user?.name || 'Chief Pharmacist', hospId);
    showToast('Batch Released', `${med.name} (${med.batchNumber}) returned to active clinical inventory.`, 'success');
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      MockStorage.deleteMedicine(confirmDeleteId);
      showToast('Medicine Removed', 'Item removed from inventory.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  // Dispense handler
  const handleOpenDispenseModal = (rx: Prescription) => {
    setSelectedRx(rx);
    setDispensePaymentMode('Cash');
    setDispensePaymentStatus('Paid');

    const mappedItems = rx.medications.map((med, idx) => {
      const medSearch = (med.medicineName || '').trim().toLowerCase();
      // Try to find best match from current inventory (by exact name, generic name, or substring)
      const matched = medicines.find(
        (m) =>
          m.status !== 'Quarantined' &&
          (m.name.toLowerCase() === medSearch ||
            (m.genericName && m.genericName.toLowerCase() === medSearch) ||
            m.name.toLowerCase().includes(medSearch) ||
            medSearch.includes(m.name.toLowerCase()) ||
            (m.genericName && medSearch.includes(m.genericName.toLowerCase())))
      );

      const defaultQty = med.quantity || (med.duration?.includes('Month') ? 30 : med.duration?.includes('5') ? 10 : 15);
      const price = matched ? matched.unitPrice : 0;

      return {
        id: `DISP-${idx}-${Date.now()}`,
        prescribedMedicineName: med.medicineName || 'Prescribed Medicine',
        prescribedDosage: med.dosage || '',
        prescribedInstructions: med.instructions || `${med.frequency || ''} ${med.duration ? `for ${med.duration}` : ''}`.trim(),
        prescribedQuantity: med.quantity,
        medicineId: matched?.id || '',
        medicineName: matched ? matched.name : '',
        genericName: matched?.genericName || '',
        dosage: med.dosage || '',
        instructions: med.instructions || `${med.frequency || ''} ${med.duration ? `for ${med.duration}` : ''}`.trim(),
        availableStock: matched ? matched.stockQuantity : 0,
        batchNumber: matched ? matched.batchNumber : '',
        locationRack: matched ? matched.locationRack : '',
        quantity: defaultQty,
        unitPrice: price,
        omitted: false,
      };
    });

    setDispenseItems(mappedItems);
    setIsDispenseModalOpen(true);
  };

  const handleConfirmDispense = () => {
    if (!selectedRx) return;

    const activeItems = dispenseItems.filter((it) => !it.omitted);
    if (activeItems.length === 0) {
      showToast('No Medicines Selected', 'Please select at least one medicine item to dispense.', 'error');
      return;
    }

    const unmappedItems = activeItems.filter((it) => !it.medicineId || !it.medicineName);
    if (unmappedItems.length > 0) {
      showToast(
        'Medicine Pick Required',
        `Please select an in-stock pharmacy medicine for doctor's prescription "${unmappedItems[0].prescribedMedicineName}".`,
        'error'
      );
      return;
    }

    const outOfStockItems = activeItems.filter((it) => it.availableStock < it.quantity);
    if (outOfStockItems.length > 0) {
      const first = outOfStockItems[0];
      showToast(
        'Insufficient Stock',
        `Cannot dispense ${first.medicineName} (${first.availableStock} in vault, ${first.quantity} requested). Please adjust quantity or restock.`,
        'error'
      );
      return;
    }

    const pharmacistName = user?.name || 'Chief Pharmacist';
    const result = MockStorage.dispensePrescription(
      selectedRx.id,
      activeItems,
      pharmacistName,
      hospId,
      dispensePaymentMode,
      dispensePaymentStatus
    );

    if (result.success) {
      showToast('Prescription Dispensed', `Medicines dispensed. Invoice #${result.invoiceId} generated (${dispensePaymentStatus}).`, 'success');
      setIsDispenseModalOpen(false);

      if (result.invoiceId) {
        const inv = MockStorage.getInvoiceById(result.invoiceId);
        if (inv) {
          setReceiptInvoice(inv);
          setReceiptRx(selectedRx);
          setIsReceiptModalOpen(true);
        }
      }
      refreshData();
    } else {
      showToast('Dispense Failed', result.error || 'Failed to complete dispensing', 'error');
    }
  };

  // Dispensary Invoice Payment Collection Handlers
  const handleOpenCollectPayment = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPayCollectionMethod((inv.paymentMethod as PaymentMethod) || 'Cash');
    setPayCollectionRef('');
  };

  const handleConfirmCollectPayment = () => {
    if (!payingInvoice) return;
    const unpaidAmount = payingInvoice.totalAmount - (payingInvoice.amountPaid || 0);
    MockStorage.recordPayment(
      payingInvoice.id,
      unpaidAmount > 0 ? unpaidAmount : payingInvoice.totalAmount,
      payCollectionMethod,
      payCollectionRef || `TXN-POS-${Date.now().toString().slice(-6)}`,
      user?.name || 'Chief Pharmacist',
      'Pharmacy Dispensary Counter'
    );
    showToast('Payment Collected', `Invoice #${payingInvoice.id} has been marked as Paid (${payCollectionMethod}).`, 'success');
    setPayingInvoice(null);
    refreshData();
  };

  // OTC POS Cart
  const handleAddPosCart = () => {
    if (!selectedPosMedId) {
      showToast('Select Medicine', 'Please choose a medicine item.', 'warning');
      return;
    }
    const med = medicines.find((m) => m.id === selectedPosMedId);
    if (!med) return;

    if (posQtyToAdd > med.stockQuantity) {
      showToast('Stock Exceeded', `Only ${med.stockQuantity} units available.`, 'warning');
      return;
    }

    const existingIdx = posCart.findIndex((item) => item.medicineId === med.id);
    if (existingIdx >= 0) {
      const updated = [...posCart];
      const newQty = updated[existingIdx].quantity + posQtyToAdd;
      if (newQty > med.stockQuantity) {
        showToast('Stock Exceeded', `Cannot exceed ${med.stockQuantity} units.`, 'warning');
        return;
      }
      updated[existingIdx].quantity = newQty;
      setPosCart(updated);
    } else {
      setPosCart([
        ...posCart,
        {
          medicineId: med.id,
          medicineName: med.name,
          batchNumber: med.batchNumber,
          unitPrice: med.unitPrice,
          quantity: posQtyToAdd,
          maxStock: med.stockQuantity,
        },
      ]);
    }
    setSelectedPosMedId('');
    setPosQtyToAdd(1);
  };

  const handleCompletePosSale = () => {
    if (posCart.length === 0) {
      showToast('Cart Empty', 'Please add at least one medicine item.', 'warning');
      return;
    }

    const pharmacistName = user?.name || 'Duty Pharmacist';
    const result = MockStorage.createOTCPurchase(
      posCustomerName || 'Walk-in Patient',
      posCustomerPhone,
      posCart,
      posPaymentMode,
      pharmacistName,
      hospId
    );

    if (result.success) {
      showToast('POS Sale Settled', `OTC sale confirmed. Bill #${result.invoiceId} generated.`, 'success');
      setPosCart([]);
      setPosCustomerName('');
      setPosCustomerPhone('');

      if (result.invoiceId) {
        const inv = MockStorage.getInvoiceById(result.invoiceId);
        if (inv) {
          setReceiptInvoice(inv);
          setReceiptRx(null);
          setIsReceiptModalOpen(true);
        }
      }
      refreshData();
    } else {
      showToast('Sale Error', result.error || 'Failed to complete sale', 'error');
    }
  };

  const handleConfirmRestock = () => {
    if (!selectedMedForRestock) return;
    MockStorage.restockMedicine(selectedMedForRestock.id, Number(restockQty), undefined, undefined, user?.name);
    showToast('Stock Replenished', `Added +${restockQty} units to ${selectedMedForRestock.name}`, 'success');
    setIsRestockModalOpen(false);
    refreshData();
  };

  const handleConfirmQuarantine = () => {
    if (!selectedMedForQuarantine) return;
    MockStorage.quarantineMedicine(selectedMedForQuarantine.id, quarantineReason, user?.name || 'Pharmacist', hospId);
    showToast('Batch Quarantined', `${selectedMedForQuarantine.name} has been isolated from active stock.`, 'warning');
    setIsQuarantineModalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <PageHeader
        title="Central Pharmacy & Pharmaceutical Dispensary"
        subtitle="Manage doctor e-prescription fulfillment, walk-in OTC POS counter, batch expiry quarantine, and formulary inventory."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Pharmacy' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Pharmacy_Stock', filteredMedicines)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Medicine
            </Button>
          </div>
        }
      />

      {/* Content for the active pharmacy view selected from the sidebar */}
      {/* TAB: Prescriptions Queue */}
      {currentTab === 'prescriptions' && (
        <div className="space-y-4">
          {/* Queue Filter Bar & Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  Prescription Dispensing Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Doctor electronic prescriptions ready for pharmacist inventory picking, substitution, and patient fulfillment.
                </p>
              </div>

              {/* Status Segmented Tabs: Undispensed vs Dispensed vs All */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setRxStatusFilter('undispensed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rxStatusFilter === 'undispensed'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Undispensed</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      rxStatusFilter === 'undispensed' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendingPrescriptions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRxStatusFilter('dispensed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rxStatusFilter === 'dispensed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dispensed</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      rxStatusFilter === 'dispensed' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {dispensedPrescriptions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRxStatusFilter('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rxStatusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All ({prescriptions.length})</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search prescription queue by patient name, UHID, doctor, diagnosis, or medicine..."
                value={rxSearchQuery}
                onChange={(e) => setRxSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {rxSearchQuery && (
                <button
                  onClick={() => setRxSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredPrescriptions.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  {rxStatusFilter === 'undispensed' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ClipboardList className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {rxStatusFilter === 'undispensed'
                      ? 'All Caught Up! No Undispensed Prescriptions in Queue'
                      : rxStatusFilter === 'dispensed'
                      ? 'No Dispensed Prescriptions Found'
                      : 'No Prescriptions Matching Your Search'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {rxStatusFilter === 'undispensed'
                      ? 'All active doctor prescriptions have been fulfilled. New doctor orders will appear here automatically.'
                      : 'Try clearing your search query or switching to another filter tab.'}
                  </p>
                </div>
                {rxSearchQuery && (
                  <Button variant="outline" size="sm" onClick={() => setRxSearchQuery('')}>
                    Clear Search Filter
                  </Button>
                )}
              </div>
            ) : (
              filteredPrescriptions.map((rx) => {
                const isDispensed = rx.status === 'Dispensed';

                return (
                  <div
                    key={rx.id}
                    className={`bg-white rounded-xl p-4 border transition-all ${
                      isDispensed
                        ? 'border-slate-200'
                        : 'border-amber-300 bg-amber-50/20 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {rx.id}
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {rx.patientName}
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            UHID: {rx.patientId}
                          </span>
                          {isDispensed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Dispensed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Undispensed (Pending)
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                          <span>Doctor: <strong>{rx.doctorName}</strong> ({rx.doctorSpecialization})</span>
                          <span>•</span>
                          <span>Diagnosis: <strong>{rx.diagnosis}</strong></span>
                          <span>•</span>
                          <span>Prescribed Date: {rx.date}</span>
                          {isDispensed && rx.dispensedAt && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">
                                Dispensed: {new Date(rx.dispensedAt).toLocaleDateString()} {rx.dispensedBy ? `by ${rx.dispensedBy}` : ''}
                              </span>
                            </>
                          )}
                        </div>

                        {rx.allergyWarning && (
                          <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span><strong>Allergy Alert:</strong> {rx.allergyWarning}</span>
                          </div>
                        )}

                        <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="font-bold text-slate-500 text-[10px] uppercase">Prescribed Medicines:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {rx.medications.map((m, idx) => (
                              <div key={idx} className="bg-white p-2.5 rounded-md border border-slate-200">
                                <div className="font-bold text-slate-900">{m.medicineName}</div>
                                <div className="text-[11px] text-slate-500">{m.dosage} • {m.frequency}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        {!isDispensed ? (
                          <Button
                            variant="primary"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            onClick={() => handleOpenDispenseModal(rx)}
                          >
                            <Pill className="w-4 h-4 mr-1.5" /> Review & Dispense
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const inv = rx.dispensedInvoiceId ? MockStorage.getInvoiceById(rx.dispensedInvoiceId) : null;
                              setReceiptInvoice(inv || null);
                              setReceiptRx(rx);
                              setIsReceiptModalOpen(true);
                            }}
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" /> Print Slip
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: Walk-in / OTC POS Counter */}
      {currentTab === 'pos' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              Walk-in & Retail POS Dispense Counter
            </h3>
            <p className="text-xs text-slate-500">Sell medicines directly to outpatients and retail visitors without a doctor order.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Customer / Patient Name</label>
              <input
                type="text"
                placeholder="e.g. Anjali Sharma"
                value={posCustomerName}
                onChange={(e) => setPosCustomerName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +91 98450 12345"
                value={posCustomerPhone}
                onChange={(e) => setPosCustomerPhone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1">
                <MedicineCombobox
                  medicines={medicines}
                  selectedMedicineId={selectedPosMedId}
                  onSelectMedicine={(med) => setSelectedPosMedId(med ? med.id : '')}
                  placeholder="Search 100+ medicines by Brand Name, Generic Molecule, or SKU..."
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={posQtyToAdd}
                    onChange={(e) => setPosQtyToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center text-xs font-bold bg-transparent focus:outline-none"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddPosCart}
                  disabled={!selectedPosMedId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-[34px]"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add to Cart
                </Button>
              </div>
            </div>

            {/* Quick Fast-Moving OTC Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Fast-Movers:</span>
              {medicines
                .filter((m) => m.status !== 'Quarantined' && m.stockQuantity > 0)
                .slice(0, 6)
                .map((quickMed) => (
                  <button
                    key={quickMed.id}
                    type="button"
                    onClick={() => {
                      setSelectedPosMedId(quickMed.id);
                    }}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                      selectedPosMedId === quickMed.id
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    + {quickMed.name} ({quickMed.stockQuantity})
                  </button>
                ))}
            </div>
          </div>

          {/* Cart Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between border-b border-slate-200">
              <span>Cart Items ({posCart.length})</span>
              <span>Subtotal</span>
            </div>

            {posCart.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Cart is empty. Select a medicine above to add.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {posCart.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.medicineName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Batch: {item.batchNumber} • ₹{item.unitPrice} × {item.quantity} units
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                      <button onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Payment:</span>
              {(['Cash', 'UPI', 'Credit Card'] as PaymentMethod[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPosPaymentMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    posPaymentMode === mode ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500">Total with {pharmacyGstRate}% GST:</span>
              <div className="text-lg font-black text-emerald-700">
                ₹{Math.round(posCart.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0) * (1 + pharmacyGstRate / 100)).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              onClick={handleCompletePosSale}
              disabled={posCart.length === 0}
            >
              <Check className="w-4 h-4 mr-1.5" /> Settle Sale & Print Receipt
            </Button>
          </div>
        </div>
      )}

      {/* TAB: Inventory & Stock */}
      {currentTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalogued SKUs</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{medicines.length} Drugs</p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Pill className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units in Vault</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{totalStockUnits.toLocaleString()} Units</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{lowStockMeds.length} Items</p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <Card>
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search medicine, SKU, batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-1.5 w-full sm:w-auto"
              >
                <option value="all">All Drug Categories</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Respiratory">Respiratory</option>
                <option value="Emergency Drugs">Emergency Drugs</option>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Medicine & Generic</th>
                    <th className="px-4 py-3.5">SKU & Batch</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Rack Location</th>
                    <th className="px-4 py-3.5 text-center">Stock</th>
                    <th className="px-4 py-3.5 text-right">Price</th>
                    <th className="px-4 py-3.5">Expiry Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMedicines.map((med) => {
                    const isLow = med.stockQuantity <= (med.minThreshold || 25);
                    const isQuarantined = med.status === 'Quarantined';

                    return (
                      <tr key={med.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{med.name}</div>
                          <div className="text-[11px] text-slate-500">{med.genericName}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          <div>{med.sku}</div>
                          <div className="text-slate-500">Batch: {med.batchNumber}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {med.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{med.locationRack || 'Shelf A1'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isQuarantined ? (
                            <span className="px-2 py-0.5 rounded font-bold text-rose-700 bg-rose-50 border border-rose-200">QUARANTINED</span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                isLow ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {med.stockQuantity} Units
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black">
                          ₹{med.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {med.expiryDate}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-emerald-600 hover:text-emerald-700 p-1"
                              onClick={() => {
                                setSelectedMedForRestock(med);
                                setRestockQty(50);
                                setIsRestockModalOpen(true);
                              }}
                              title="Restock units"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs p-1"
                              onClick={() => handleOpenEdit(med)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-rose-500 hover:text-rose-700 p-1"
                              onClick={() => setConfirmDeleteId(med.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredMedicines.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB: Expiry & Quarantine */}
      {currentTab === 'expiry' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                Batch Expiry Radar & Quarantine
              </h3>
              <p className="text-xs text-slate-500">Monitor near-expiry batches (≤ 90 days) and isolated quarantined stock.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="font-bold">
                {expiringSoonItems.length} Near Expiry
              </Badge>
              <Badge variant="error" className="font-bold">
                {quarantinedItems.length} Quarantined
              </Badge>
            </div>
          </div>

          {/* Subtab Segmented Pills */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start border border-slate-200/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setExpirySubTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                expirySubTab === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Monitored ({expiringSoonItems.length + quarantinedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setExpirySubTab('near_expiry')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                expirySubTab === 'near_expiry'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Near Expiry ({expiringSoonItems.length})
            </button>
            <button
              type="button"
              onClick={() => setExpirySubTab('quarantined')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                expirySubTab === 'quarantined'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarantined Stock ({quarantinedItems.length})
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Medicine & Batch</th>
                  <th className="p-3">Rack Location</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-center">Status / Remaining</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {radarItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {expirySubTab === 'quarantined'
                        ? 'No quarantined medicines found. Active stock is verified safe.'
                        : expirySubTab === 'near_expiry'
                        ? 'No medicines approaching expiration within the next 90 days.'
                        : 'No medicines require quarantine or expiry attention at this time.'}
                    </td>
                  </tr>
                ) : (
                  radarItems.map((med) => {
                    const isQuarantined = med.status === 'Quarantined';
                    const diffDays = Math.ceil(
                      (new Date(med.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr
                        key={med.id}
                        className={isQuarantined ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'}
                      >
                        <td className="p-3 font-bold">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-900">{med.name}</span>
                            <span className="text-slate-500 font-mono text-[11px]">({med.batchNumber})</span>
                            {isQuarantined && (
                              <Badge variant="error" size="sm">
                                Quarantined
                              </Badge>
                            )}
                          </div>
                          {isQuarantined && med.quarantineReason && (
                            <div className="text-[11px] text-rose-700 font-normal mt-0.5">
                              Reason: {med.quarantineReason}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{med.locationRack}</td>
                        <td className="p-3 text-slate-700">{med.expiryDate}</td>
                        <td className="p-3 text-center">
                          {isQuarantined ? (
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Quarantined
                            </span>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                diffDays <= 0
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : diffDays <= 30
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                              }`}
                            >
                              {diffDays <= 0 ? 'Expired' : `${diffDays} Days Left`}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">{med.stockQuantity}</td>
                        <td className="p-3 text-center">
                          {isQuarantined ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold"
                                onClick={() => handleReleaseFromQuarantine(med)}
                              >
                                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Release to Stock
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-rose-600 hover:bg-rose-100 hover:text-rose-800"
                                onClick={() => setConfirmDeleteId(med.id)}
                                title="Dispose / Remove Batch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              className="text-xs font-semibold"
                              onClick={() => {
                                setSelectedMedForQuarantine(med);
                                setIsQuarantineModalOpen(true);
                              }}
                            >
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Quarantine Batch
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Dispense Invoices */}
      {currentTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                Dispensary Invoices & History
              </h3>
              <p className="text-xs text-slate-500">Track all pharmacy point-of-sale and doctor prescription dispensing transactions.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                {pharmacyInvoices.filter((i) => i.status === 'Paid').length} Paid
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                {pharmacyInvoices.filter((i) => i.status !== 'Paid').length} Unpaid / Pending
              </span>
              <div className="text-xs text-slate-500 font-medium pl-2 border-l border-slate-200">
                {pharmacyInvoices.length} Transactions
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pharmacyInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No pharmacy invoices found. Dispense a prescription or perform a walk-in sale.
                    </td>
                  </tr>
                ) : (
                  pharmacyInvoices.map((inv) => {
                    const isPaid = inv.status === 'Paid';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-700">#{inv.id}</td>
                        <td className="p-3 font-bold text-slate-900">{inv.patientName}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              inv.id.includes('OTC') ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {inv.id.includes('OTC') ? 'Walk-in OTC' : 'e-Prescription'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{inv.issueDate || inv.createdAt?.split('T')[0] || 'Today'}</td>
                        <td className="p-3 text-slate-700 font-medium">{inv.paymentMethod || 'Cash'}</td>
                        <td className="p-3">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              {inv.status || 'Unpaid'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isPaid && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 font-bold px-2 py-1 h-7"
                                onClick={() => handleOpenCollectPayment(inv)}
                              >
                                <Check className="w-3 h-3 mr-1" /> Mark Paid
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs px-2 py-1 h-7 text-slate-600 hover:text-slate-900"
                              onClick={() => {
                                setReceiptInvoice(inv);
                                setReceiptRx(null);
                                setIsReceiptModalOpen(true);
                              }}
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" /> Receipt
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Medicine Modal */}
      {/* Standardized Shared Add/Edit Medicine Modal */}
      <MedicineFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedMed(null);
        }}
        medicineToEdit={selectedMed}
        hospitalId={hospId}
        onSaved={() => refreshData()}
      />

      {/* Dispense Modal: Pharmacist Pick & Deliver Workflow */}
      {isDispenseModalOpen && selectedRx && (
        <Modal
          isOpen={isDispenseModalOpen}
          onClose={() => setIsDispenseModalOpen(false)}
          title={`Dispense Prescription #${selectedRx.id}`}
        >
          <div className="space-y-4 text-xs">
            {/* Patient & Doctor Banner */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-sm text-slate-900">{selectedRx.patientName}</div>
                <div className="text-slate-500 text-[11px]">
                  Doctor: <span className="font-semibold text-slate-700">{selectedRx.doctorName}</span> • Diagnosis:{' '}
                  <span className="font-semibold text-slate-700">{selectedRx.diagnosis}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 sm:text-right font-mono">
                Prescription Date: {selectedRx.date || 'Today'}
              </div>
            </div>

            {/* Pharmacist Guidance Note */}
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-2.5 rounded-lg flex items-start gap-2">
              <Pill className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Pharmacist Verification & Dispensing:</strong> Doctor prescribed terms or abbreviations can differ from stock names. Review each prescribed item below and select the exact matching brand or generic equivalent from active pharmacy inventory.
              </div>
            </div>

            {/* Prescribed Items & Pharmacist Pick Cards */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {dispenseItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`border rounded-xl p-3.5 transition-all space-y-2.5 ${
                    item.omitted
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : !item.medicineId
                      ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                      : item.availableStock < item.quantity
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Top Line: Doctor's Original Prescription */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wider">
                          Doctor Prescribed #{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{item.prescribedMedicineName}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {item.prescribedDosage && (
                          <span className="font-semibold text-slate-700 mr-2">Dosage: {item.prescribedDosage}</span>
                        )}
                        {item.prescribedInstructions && (
                          <span className="text-slate-500">Directions: {item.prescribedInstructions}</span>
                        )}
                        {item.prescribedQuantity ? (
                          <span className="text-indigo-600 font-medium ml-2">Prescribed Qty: {item.prescribedQuantity}</span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...dispenseItems];
                        updated[idx].omitted = !updated[idx].omitted;
                        setDispenseItems(updated);
                      }}
                      className={`text-[11px] px-2 py-1 rounded font-semibold transition-all ${
                        item.omitted
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      {item.omitted ? 'Include Item' : 'Omit / Skip'}
                    </button>
                  </div>

                  {!item.omitted && (
                    <div className="space-y-2.5 pt-1">
                      {/* Pharmacist Drug Picker */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Dispense with In-Stock Medicine (Brand / Generic):
                        </label>
                        <MedicineCombobox
                          medicines={medicines}
                          selectedMedicineId={item.medicineId}
                          onSelectMedicine={(selected) => {
                            const updated = [...dispenseItems];
                            if (selected) {
                              updated[idx].medicineId = selected.id;
                              updated[idx].medicineName = selected.name;
                              updated[idx].genericName = selected.genericName;
                              updated[idx].availableStock = selected.stockQuantity;
                              updated[idx].batchNumber = selected.batchNumber;
                              updated[idx].locationRack = selected.locationRack;
                              updated[idx].unitPrice = selected.unitPrice;
                            } else {
                              updated[idx].medicineId = '';
                              updated[idx].medicineName = '';
                              updated[idx].genericName = '';
                              updated[idx].availableStock = 0;
                              updated[idx].batchNumber = '';
                              updated[idx].locationRack = '';
                              updated[idx].unitPrice = 0;
                            }
                            setDispenseItems(updated);
                          }}
                          placeholder={`Search inventory for "${item.prescribedMedicineName}" or generic molecule...`}
                        />
                      </div>

                      {/* Stock, Location, Quantity & Price Row */}
                      {item.medicineId ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Batch: <strong>{item.batchNumber || 'N/A'}</strong>
                            </span>
                            <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Rack: <strong>{item.locationRack || 'Shelf'}</strong>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                item.availableStock >= item.quantity
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Stock: {item.availableStock}
                            </span>
                            <span className="text-slate-500">@ ₹{item.unitPrice.toFixed(2)} / unit</span>
                          </div>

                          <div className="flex items-center gap-3 ml-auto">
                            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...dispenseItems];
                                  updated[idx].quantity = Math.max(1, updated[idx].quantity - 1);
                                  setDispenseItems(updated);
                                }}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  const updated = [...dispenseItems];
                                  updated[idx].quantity = val;
                                  setDispenseItems(updated);
                                }}
                                className="w-12 text-center text-xs font-bold bg-transparent focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...dispenseItems];
                                  updated[idx].quantity = updated[idx].quantity + 1;
                                  setDispenseItems(updated);
                                }}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-black text-sm text-slate-900 w-20 text-right">
                              ₹{(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>Doctor wrote "{item.prescribedMedicineName}". Search and pick the matching inventory medicine above.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Add Extra Medicine / Consumable Button */}
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="w-full text-xs border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                onClick={() => {
                  setDispenseItems([
                    ...dispenseItems,
                    {
                      id: `DISP-EXTRA-${Date.now()}`,
                      prescribedMedicineName: 'Additional Drug / Consumable',
                      prescribedDosage: '',
                      prescribedInstructions: '',
                      prescribedQuantity: 1,
                      medicineId: '',
                      medicineName: '',
                      dosage: '',
                      instructions: '',
                      availableStock: 0,
                      batchNumber: '',
                      locationRack: '',
                      quantity: 1,
                      unitPrice: 0,
                      omitted: false,
                    },
                  ]);
                }}
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1 text-indigo-600" /> + Add Another Medicine / Consumable
              </Button>
            </div>

            {/* Payment Mode & Payment Status Selector */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Payment Method */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">Payment Mode:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['Cash', 'UPI', 'Credit Card'] as PaymentMethod[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDispensePaymentMode(mode)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          dispensePaymentMode === mode
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Status (Paid vs Unpaid) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">Payment Status:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDispensePaymentStatus('Paid')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                        dispensePaymentStatus === 'Paid'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paid (Collected)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispensePaymentStatus('Unpaid')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                        dispensePaymentStatus === 'Unpaid'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Unpaid (Pending Bill)
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-600 font-semibold">Total Payable (incl. {pharmacyGstRate}% GST):</span>
                <div className="text-base font-black text-emerald-700">
                  ₹{Math.round(
                    dispenseItems
                      .filter((it) => !it.omitted)
                      .reduce((acc, it) => acc + it.quantity * it.unitPrice, 0) * (1 + pharmacyGstRate / 100)
                  ).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDispenseModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDispense}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Check className="w-4 h-4 mr-1.5" /> Confirm Dispensing
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Collection Modal for Dispensary Invoices */}
      {payingInvoice && (
        <Modal
          isOpen={!!payingInvoice}
          onClose={() => setPayingInvoice(null)}
          title={`Collect Payment — Invoice #${payingInvoice.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{payingInvoice.patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Invoice Amount:</span>
                <span className="font-black text-sm text-emerald-700">
                  ₹{payingInvoice.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current Status:</span>
                <Badge variant="warning">{payingInvoice.status || 'Unpaid'}</Badge>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Select Payment Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Cash', 'UPI', 'Credit Card'] as PaymentMethod[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPayCollectionMethod(mode)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      payCollectionMethod === mode
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transaction / Reference ID (Optional)</label>
              <input
                type="text"
                value={payCollectionRef}
                onChange={(e) => setPayCollectionRef(e.target.value)}
                placeholder="e.g. UPI Ref / Cash Memo #"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setPayingInvoice(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={handleConfirmCollectPayment}
              >
                <Check className="w-4 h-4 mr-1.5" /> Confirm Payment & Mark Paid
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && selectedMedForRestock && (
        <Modal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          title={`Restock ${selectedMedForRestock.name}`}
        >
          <div className="space-y-3 text-xs">
            <div>Current Stock: <strong>{selectedMedForRestock.stockQuantity} units</strong></div>
            <div>
              <label className="font-bold block mb-1">Add Units (+)</label>
              <input
                type="number"
                min="10"
                value={restockQty}
                onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded font-bold text-center text-base bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsRestockModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleConfirmRestock}>Confirm Restock</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quarantine Modal */}
      {isQuarantineModalOpen && selectedMedForQuarantine && (
        <Modal
          isOpen={isQuarantineModalOpen}
          onClose={() => setIsQuarantineModalOpen(false)}
          title="Quarantine Batch"
        >
          <div className="space-y-3 text-xs">
            <div className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-200">
              <strong>{selectedMedForQuarantine.name}</strong> • Batch: {selectedMedForQuarantine.batchNumber}
            </div>
            <div>
              <label className="font-bold block mb-1">Reason for Quarantine</label>
              <textarea
                rows={2}
                value={quarantineReason}
                onChange={(e) => setQuarantineReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsQuarantineModalOpen(false)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleConfirmQuarantine}>Confirm Quarantine</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptModalOpen && receiptInvoice && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Print Dispensing Slip"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 border border-slate-300 rounded-xl bg-white text-slate-900 space-y-3">
              <div className="text-center border-b pb-2">
                <div className="font-bold text-sm">{currentHospital?.name || 'CENTRAL CLINICAL PHARMACY'}</div>
                <div className="text-[10px] text-slate-500">DL: DL-2026-PHARM-889 • GSTIN: 36AAAAA0000A1Z5</div>
              </div>
              <div className="flex justify-between text-[11px]">
                <div>Bill: #{receiptInvoice.id}</div>
                <div>Date: {receiptInvoice.issueDate}</div>
              </div>
              <div className="text-[11px]">Patient: <strong>{receiptInvoice.patientName}</strong></div>

              <table className="w-full border-t border-b text-[11px] py-1">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Rate</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiptInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{it.description}</td>
                      <td className="text-center py-1">{it.quantity}</td>
                      <td className="text-right py-1">₹{it.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-1 font-bold">₹{it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right space-y-0.5 text-[11px]">
                <div>Subtotal: ₹{receiptInvoice.subtotal.toFixed(2)}</div>
                <div>GST (5%): ₹{receiptInvoice.taxAmount.toFixed(2)}</div>
                <div className="font-black text-sm border-t pt-1">Total: ₹{receiptInvoice.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsReceiptModalOpen(false)}>Close</Button>
              <Button variant="primary" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1" /> Print Slip
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Single Medicine Confirm */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title="Remove Medicine"
        message="Are you sure you want to remove this medicine item from the hospital inventory?"
        confirmText="Remove Item"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default PharmacyManagement;
