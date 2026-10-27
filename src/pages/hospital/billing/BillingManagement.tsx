import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Download,
  Trash2,
  FileText,
  Building2,
  Zap,
  Stethoscope,
  Shield,
  Calendar,
  Sparkles,
  User,
  Tag,
  Edit2,
  UserCheck,
  RefreshCw,
  Pill,
  ShoppingCart,
  Layers,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PaymentMethod,
  Patient,
  EncounterType,
  PaymentType,
  BillingCategory,
} from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { BillingSoftwareAddonModal } from '../../../components/common/BillingSoftwareAddonModal';
import { PatientCombobox } from '../../../components/common/PatientCombobox';

export const getInvoiceBillingCategory = (inv: Invoice): BillingCategory => {
  if (inv.billingCategory) return inv.billingCategory;
  if (
    inv.id.startsWith('INV-OTC') ||
    inv.patientId?.startsWith('WALK-IN') ||
    inv.patientName?.toLowerCase().includes('walk-in') ||
    inv.notes?.toLowerCase().includes('walk-in') ||
    inv.notes?.toLowerCase().includes('otc')
  ) {
    return 'Walk-in Pharmacy';
  }
  if (
    inv.id.startsWith('INV-PHARM') ||
    Boolean(inv.prescriptionId) ||
    inv.notes?.toLowerCase().includes('prescription') ||
    inv.notes?.toLowerCase().includes('dispensed') ||
    inv.encounterType === 'Pharmacy' ||
    (inv.items && inv.items.length > 0 && inv.items.every((it) => it.category === 'Pharmacy') && !inv.patientName?.toLowerCase().includes('walk-in'))
  ) {
    return 'Pharmacy Service';
  }
  return 'Hospital Service';
};

export type ActiveStreamTab = 'all' | 'hospital' | 'pharmacy' | 'walkin';

export const generateReceiptReference = (method?: PaymentMethod): string => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getFullYear();
  switch (method) {
    case 'UPI':
      return `UPI-${year}-${rand}`;
    case 'Credit Card':
      return `POS-CR-${rand}`;
    case 'Debit Card':
      return `POS-DB-${rand}`;
    case 'Cash':
      return `CASH-REC-${rand}`;
    case 'Insurance':
      return `TPA-SETTL-${rand}`;
    case 'Bank Transfer':
      return `NEFT-${year}-${rand}`;
    default:
      return `RCPT-${year}-${rand}`;
  }
};

export const BillingManagement: React.FC = () => {
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [invoices, setInvoices] = useState<Invoice[]>(() => MockStorage.getInvoices(hospId));
  const settings = MockStorage.getHospitalSettings(hospId);

  // Stream Navigation & Synchronization via URL
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStream = searchParams.get('stream') as ActiveStreamTab | null;
  const [activeStream, setActiveStream] = useState<ActiveStreamTab>(() => {
    if (urlStream && ['all', 'hospital', 'pharmacy', 'walkin'].includes(urlStream)) {
      return urlStream;
    }
    return 'all';
  });

  useEffect(() => {
    if (urlStream && ['all', 'hospital', 'pharmacy', 'walkin'].includes(urlStream)) {
      setActiveStream(urlStream);
    }
  }, [urlStream]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals & Editing State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Doctors for attending physician selection
  const doctors = MockStorage.getDoctors(hospId);

  // Controlled by Super Admin in Platform Settings
  const isAddonEnabled = MockStorage.getPlatformSettings().enableBillingAddonModule !== false;

  // Payment Form (Standalone Collect Payment Modal with Cashier Audit)
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Credit Card');
  const [payCollectorName, setPayCollectorName] = useState(() => user?.name || 'Marcus Sterling (Accountant)');
  const [payCashierDesk, setPayCashierDesk] = useState('Main OPD Cashier Desk');
  const [payTxnRef, setPayTxnRef] = useState('');

  // Create / Edit Invoice Form State (Stream Classification & Fields)
  const [formCategory, setFormCategory] = useState<BillingCategory>('Hospital Service');
  const [walkInCustomerName, setWalkInCustomerName] = useState<string>('');
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState<string>('');
  const [prescriptionId, setPrescriptionId] = useState<string>('');

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSelectError, setPatientSelectError] = useState<string>('');
  const [encounterType, setEncounterType] = useState<EncounterType>('OPD');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  // Insurance / TPA Billing
  const [paymentType, setPaymentType] = useState<PaymentType>('Self Pay');
  const [insuranceProvider, setInsuranceProvider] = useState<string>('');
  const [policyNumber, setPolicyNumber] = useState<string>('');
  const [claimApprovalNumber, setClaimApprovalNumber] = useState<string>('');

  // Line Items & Deductions
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 'item-1', description: 'Specialist OPD Consultation', category: 'Consultation', quantity: 1, unitPrice: 150, total: 150 },
  ]);
  const [taxRate, setTaxRate] = useState<number>(() =>
    settings.enableGSTBilling !== false ? (settings.defaultGSTRate ?? 5) : 0
  );
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>(() => settings.invoiceNotes || 'Due in 7 days. Thank you for choosing PulseCore Health.');

  // Immediate Cashier Collection Option (Track Who Collects Pay)
  const [collectPaymentNow, setCollectPaymentNow] = useState<boolean>(false);
  const [immediatePayAmount, setImmediatePayAmount] = useState<number>(0);
  const [immediatePayMethod, setImmediatePayMethod] = useState<PaymentMethod>('Cash');
  const [immediateTxnRef, setImmediateTxnRef] = useState<string>('');
  const [immediateCollectedBy, setImmediateCollectedBy] = useState<string>(() => user?.name || 'Marcus Sterling (Accountant)');
  const [immediateCashierDesk, setImmediateCashierDesk] = useState<string>('Main OPD Cashier Desk');

  const refreshData = () => {
    setInvoices(MockStorage.getInvoices(hospId));
  };

  // Segregated invoice lists by category
  const hospitalInvoices = invoices.filter((i) => getInvoiceBillingCategory(i) === 'Hospital Service');
  const pharmacyInvoices = invoices.filter((i) => getInvoiceBillingCategory(i) === 'Pharmacy Service');
  const walkInInvoices = invoices.filter((i) => getInvoiceBillingCategory(i) === 'Walk-in Pharmacy');

  // Stream-specific financial metrics
  const streamInvoices =
    activeStream === 'hospital'
      ? hospitalInvoices
      : activeStream === 'pharmacy'
      ? pharmacyInvoices
      : activeStream === 'walkin'
      ? walkInInvoices
      : invoices;

  const totalStreamBilled = streamInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalStreamPaid = streamInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalStreamPending = streamInvoices.reduce((acc, i) => (i.status !== 'Paid' ? acc + (i.totalAmount - i.amountPaid) : acc), 0);

  // Overall hospital aggregates
  const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalPending = invoices.reduce((acc, i) => (i.status !== 'Paid' ? acc + (i.totalAmount - i.amountPaid) : acc), 0);

  // Stream breakdown metrics
  const totalHospitalBilled = hospitalInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalHospitalPaid = hospitalInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const pendingHospital = hospitalInvoices.reduce((acc, i) => (i.status !== 'Paid' ? acc + (i.totalAmount - i.amountPaid) : acc), 0);

  const totalPharmacyBilled = pharmacyInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPharmacyPaid = pharmacyInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const pendingPharmacy = pharmacyInvoices.reduce((acc, i) => (i.status !== 'Paid' ? acc + (i.totalAmount - i.amountPaid) : acc), 0);

  const totalWalkInBilled = walkInInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalWalkInPaid = walkInInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const pendingWalkIn = walkInInvoices.reduce((acc, i) => (i.status !== 'Paid' ? acc + (i.totalAmount - i.amountPaid) : acc), 0);

  const filtered = streamInvoices.filter((i) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      i.patientName.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      (i.transactionRef && i.transactionRef.toLowerCase().includes(q)) ||
      (i.doctorName && i.doctorName.toLowerCase().includes(q)) ||
      (i.prescriptionId && i.prescriptionId.toLowerCase().includes(q)) ||
      (i.cashierDesk && i.cashierDesk.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSelectStream = (stream: ActiveStreamTab) => {
    setActiveStream(stream);
    setCurrentPage(1);
    if (stream === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ stream });
    }
  };

  // Line Items Helpers & Presets
  const addItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, description: 'Clinical Service / Procedure', category: 'Procedure', quantity: 1, unitPrice: 50, total: 50 },
    ]);
  };

  const addPresetItem = (category: string, description: string, unitPrice: number) => {
    setItems([
      ...items,
      { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, description, category, quantity: 1, unitPrice, total: unitPrice },
    ]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const copy = [...items];
    const item = { ...copy[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = Number(item.quantity) * Number(item.unitPrice);
    }
    copy[index] = item;
    setItems(copy);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculatedSubtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const calculatedTax = (calculatedSubtotal * taxRate) / 100;
  const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedTax - discount);

  const handleSelectModalCategory = (cat: BillingCategory) => {
    setFormCategory(cat);
    if (cat === 'Hospital Service') {
      setEncounterType('OPD');
      setTaxRate(settings.enableGSTBilling !== false ? (settings.defaultGSTRate ?? 5) : 0);
      setImmediateCashierDesk('Main OPD Cashier Desk');
    } else if (cat === 'Pharmacy Service') {
      setEncounterType('Pharmacy');
      setTaxRate(settings.enableGSTBilling !== false ? (settings.pharmacyGSTRate ?? 5) : 0);
      setImmediateCashierDesk('Pharmacy Cash Counter');
    } else {
      // Walk-in Pharmacy
      setEncounterType('Pharmacy');
      setTaxRate(settings.enableGSTBilling !== false ? (settings.pharmacyGSTRate ?? 5) : 0);
      setImmediateCashierDesk('Pharmacy Cash Counter');
      if (!walkInCustomerName) {
        setWalkInCustomerName('Walk-in Customer');
      }
      setCollectPaymentNow(true);
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    let pat = selectedPatient;
    if (formCategory === 'Walk-in Pharmacy') {
      const name = walkInCustomerName.trim() || 'Walk-in Customer';
      pat = {
        id: `WALK-IN-${Date.now().toString().slice(-4)}`,
        name,
        phone: walkInCustomerPhone.trim(),
      } as any;
    } else {
      if (!pat && selectedPatientId) {
        pat = MockStorage.getPatientById(selectedPatientId) || null;
      }
      if (!pat) {
        setPatientSelectError('Please search and select a patient');
        showToast('Patient Required', 'Please select a valid registered patient.', 'error');
        return;
      }
    }

    if (!pat) return;

    if (items.length === 0) {
      showToast('Error', 'Please include at least one clinical service or pharmacy item.', 'error');
      return;
    }

    const assignedDoc = doctors.find((d) => d.id === selectedDoctorId);

    // If Editing Existing Invoice
    if (editingInvoiceId) {
      const existingInv = invoices.find((i) => i.id === editingInvoiceId);
      const prevPaid = existingInv?.amountPaid || 0;
      let newPaid = prevPaid;
      let newStatus: InvoiceStatus = existingInv?.status || 'Pending';
      let settlementMethod = existingInv?.paymentMethod;
      let txnRef = existingInv?.transactionRef;
      let collectedBy = existingInv?.collectedBy;
      let cashierDesk = existingInv?.cashierDesk;

      if (collectPaymentNow) {
        const addPay = immediatePayAmount > 0 ? Number(immediatePayAmount) : (calculatedTotal - prevPaid);
        newPaid = Math.min(calculatedTotal, prevPaid + addPay);
        settlementMethod = immediatePayMethod;
        txnRef = immediateTxnRef.trim() || generateReceiptReference(immediatePayMethod);
        collectedBy = immediateCollectedBy || user?.name || 'Marcus Sterling (Accountant)';
        cashierDesk = immediateCashierDesk || 'Main OPD Cashier Desk';
      }

      if (newPaid >= calculatedTotal && calculatedTotal > 0) {
        newStatus = 'Paid';
      } else if (newPaid > 0) {
        newStatus = 'Partially Paid';
      } else {
        newStatus = 'Pending';
      }

      const updatedInv: Invoice = {
        ...existingInv,
        id: editingInvoiceId,
        hospitalId: hospId,
        patientId: pat.id,
        patientName: pat.name,
        patientPhone: pat.phone,
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        items,
        subtotal: calculatedSubtotal,
        taxRate,
        taxAmount: calculatedTax,
        discount,
        discountReason: discount > 0 ? discountReason : undefined,
        totalAmount: calculatedTotal,
        amountPaid: newPaid,
        status: newStatus,
        paymentMethod: settlementMethod,
        transactionRef: txnRef,
        notes: invoiceNotes,
        billingCategory: formCategory,
        prescriptionId: formCategory === 'Pharmacy Service' ? (prescriptionId.trim() || undefined) : undefined,
        encounterType: formCategory === 'Hospital Service' ? encounterType : 'Pharmacy',
        doctorId: assignedDoc?.id,
        doctorName: assignedDoc?.name,
        departmentName: assignedDoc?.departmentName,
        paymentType,
        insuranceProvider: paymentType === 'Insurance / TPA' ? insuranceProvider : undefined,
        policyNumber: paymentType === 'Insurance / TPA' ? policyNumber : undefined,
        claimApprovalNumber: paymentType === 'Insurance / TPA' ? claimApprovalNumber : undefined,
        collectedBy,
        cashierDesk,
      };

      MockStorage.saveInvoice(updatedInv);
      showToast('Invoice Updated', `${editingInvoiceId} updated successfully for ${pat.name}.`);
      setIsCreateModalOpen(false);
      setEditingInvoiceId(null);
      setSelectedPatient(null);
      setSelectedPatientId('');
      setWalkInCustomerName('');
      setWalkInCustomerPhone('');
      setPrescriptionId('');
      setPatientSelectError('');
      refreshData();
      return;
    }

    // Creating New Invoice
    let settledAmount = 0;
    let invStatus: InvoiceStatus = 'Pending';
    let settlementMethod: PaymentMethod | undefined = undefined;
    let txnRef: string | undefined = undefined;
    let collector: string | undefined = undefined;
    let desk: string | undefined = undefined;

    if (collectPaymentNow) {
      settledAmount = immediatePayAmount > 0 ? Number(immediatePayAmount) : calculatedTotal;
      settlementMethod = immediatePayMethod;
      txnRef = immediateTxnRef.trim() || generateReceiptReference(immediatePayMethod);
      collector = immediateCollectedBy || user?.name || (formCategory === 'Hospital Service' ? 'Marcus Sterling (Accountant)' : 'Alex Vance (Pharmacist)');
      desk = immediateCashierDesk || (formCategory === 'Hospital Service' ? 'Main OPD Cashier Desk' : 'Pharmacy Cash Counter');
      if (settledAmount >= calculatedTotal && calculatedTotal > 0) {
        invStatus = 'Paid';
      } else if (settledAmount > 0) {
        invStatus = 'Partially Paid';
      }
    } else if (paymentType === 'Insurance / TPA' && claimApprovalNumber) {
      settlementMethod = 'Insurance';
      txnRef = `AUTH-${claimApprovalNumber.trim()}`;
    }

    const prefix =
      formCategory === 'Walk-in Pharmacy'
        ? 'INV-OTC'
        : formCategory === 'Pharmacy Service'
        ? 'INV-PHARM'
        : 'INV-2026';
    const newId = `${prefix}-${100 + invoices.length + 1}`;

    const newInv: Invoice = {
      id: newId,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      patientPhone: pat.phone,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items,
      subtotal: calculatedSubtotal,
      taxRate,
      taxAmount: calculatedTax,
      discount,
      discountReason: discount > 0 ? discountReason : undefined,
      totalAmount: calculatedTotal,
      amountPaid: settledAmount,
      status: invStatus,
      paymentMethod: settlementMethod,
      transactionRef: txnRef,
      notes: invoiceNotes,

      // Segregation & Clinical Metadata
      billingCategory: formCategory,
      prescriptionId: formCategory === 'Pharmacy Service' ? (prescriptionId.trim() || undefined) : undefined,
      encounterType: formCategory === 'Hospital Service' ? encounterType : 'Pharmacy',
      doctorId: assignedDoc?.id,
      doctorName: assignedDoc?.name,
      departmentName: assignedDoc?.departmentName,
      paymentType,
      insuranceProvider: paymentType === 'Insurance / TPA' ? insuranceProvider : undefined,
      policyNumber: paymentType === 'Insurance / TPA' ? policyNumber : undefined,
      claimApprovalNumber: paymentType === 'Insurance / TPA' ? claimApprovalNumber : undefined,
      collectedBy: collector,
      cashierDesk: desk,
    };

    MockStorage.saveInvoice(newInv);
    showToast('Invoice Generated', `${newInv.id} issued for ${pat.name} (₹${newInv.totalAmount}). Status: ${invStatus}`);
    setIsCreateModalOpen(false);
    setSelectedPatient(null);
    setSelectedPatientId('');
    setWalkInCustomerName('');
    setWalkInCustomerPhone('');
    setPrescriptionId('');
    setPatientSelectError('');
    refreshData();
  };

  const handleOpenCreateModal = (targetCategory?: BillingCategory) => {
    const cat: BillingCategory =
      targetCategory ||
      (activeStream === 'hospital'
        ? 'Hospital Service'
        : activeStream === 'pharmacy'
        ? 'Pharmacy Service'
        : activeStream === 'walkin'
        ? 'Walk-in Pharmacy'
        : 'Hospital Service');

    setFormCategory(cat);
    setEditingInvoiceId(null);
    setSelectedPatient(null);
    setSelectedPatientId('');
    setWalkInCustomerName(cat === 'Walk-in Pharmacy' ? 'Walk-in Customer' : '');
    setWalkInCustomerPhone('');
    setPrescriptionId('');
    setPatientSelectError('');
    setEncounterType(cat === 'Hospital Service' ? 'OPD' : 'Pharmacy');
    setSelectedDoctorId(doctors[0]?.id || '');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setPaymentType('Self Pay');
    setInsuranceProvider('');
    setPolicyNumber('');
    setClaimApprovalNumber('');

    if (cat === 'Hospital Service') {
      const defaultDocFee = doctors[0]?.consultationFee || 150;
      setItems([
        { id: `item-${Date.now()}`, description: `Specialist OPD Consultation${doctors[0] ? ` - ${doctors[0].name}` : ''}`, category: 'Consultation', quantity: 1, unitPrice: defaultDocFee, total: defaultDocFee },
      ]);
      setTaxRate(settings.enableGSTBilling !== false ? (settings.defaultGSTRate ?? 5) : 0);
      setImmediateCashierDesk('Main OPD Cashier Desk');
      setCollectPaymentNow(false);
      setImmediateCollectedBy(user?.name || 'Marcus Sterling (Accountant)');
      setInvoiceNotes(settings.invoiceNotes || 'Payment terms: Net 7 days. For billing questions contact Cashier Desk.');
    } else if (cat === 'Pharmacy Service') {
      setItems([
        { id: `item-${Date.now()}`, description: 'Amoxicillin 500mg (Strip of 10)', category: 'Pharmacy', quantity: 2, unitPrice: 45, total: 90 },
        { id: `item-${Date.now() + 1}`, description: 'Paracetamol 650mg (Strip of 15)', category: 'Pharmacy', quantity: 1, unitPrice: 20, total: 20 },
      ]);
      setTaxRate(settings.enableGSTBilling !== false ? (settings.pharmacyGSTRate ?? 5) : 0);
      setImmediateCashierDesk('Pharmacy Cash Counter');
      setCollectPaymentNow(true);
      setImmediateCollectedBy(user?.name || 'Alex Vance (Lead Pharmacist)');
      setInvoiceNotes('Doctor e-Prescription Fulfillment. Verified dosages dispensed by hospital pharmacist.');
    } else {
      // Walk-in Pharmacy
      setItems([
        { id: `item-${Date.now()}`, description: 'Paracetamol 500mg Fast Relief (Strip of 10)', category: 'Pharmacy', quantity: 2, unitPrice: 18, total: 36 },
        { id: `item-${Date.now() + 1}`, description: 'Vitamin C 500mg Chewable (Bottle of 30)', category: 'Pharmacy', quantity: 1, unitPrice: 95, total: 95 },
      ]);
      setTaxRate(settings.enableGSTBilling !== false ? (settings.pharmacyGSTRate ?? 5) : 0);
      setImmediateCashierDesk('Pharmacy Cash Counter');
      setCollectPaymentNow(true);
      setImmediateCollectedBy(user?.name || 'Alex Vance (Lead Pharmacist)');
      setInvoiceNotes('Walk-in OTC Retail POS Sale. Cashier settled at retail counter.');
    }

    setDiscount(0);
    setDiscountReason('');
    setImmediatePayAmount(0);
    setImmediatePayMethod(cat === 'Hospital Service' ? 'Credit Card' : 'Cash');
    setImmediateTxnRef(generateReceiptReference(cat === 'Hospital Service' ? 'Credit Card' : 'Cash'));
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (inv: Invoice) => {
    const cat = getInvoiceBillingCategory(inv);
    setFormCategory(cat);
    setEditingInvoiceId(inv.id);
    setSelectedPatientId(inv.patientId);
    setWalkInCustomerName(cat === 'Walk-in Pharmacy' ? inv.patientName : '');
    setWalkInCustomerPhone(cat === 'Walk-in Pharmacy' ? inv.patientPhone : '');
    setPrescriptionId(inv.prescriptionId || '');
    setSelectedPatient(
      MockStorage.getPatientById(inv.patientId) || {
        id: inv.patientId,
        name: inv.patientName,
        phone: inv.patientPhone,
      } as any
    );
    setPatientSelectError('');
    setEncounterType(inv.encounterType || 'OPD');
    setSelectedDoctorId(inv.doctorId || '');
    setIssueDate(inv.issueDate || new Date().toISOString().split('T')[0]);
    setDueDate(inv.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setPaymentType(inv.paymentType || 'Self Pay');
    setInsuranceProvider(inv.insuranceProvider || '');
    setPolicyNumber(inv.policyNumber || '');
    setClaimApprovalNumber(inv.claimApprovalNumber || '');
    setItems(
      inv.items && inv.items.length > 0
        ? inv.items.map((it) => ({ ...it }))
        : [
            {
              id: `item-${Date.now()}`,
              description: 'Specialist OPD Consultation',
              category: 'Consultation',
              quantity: 1,
              unitPrice: 150,
              total: 150,
            },
          ]
    );
    setTaxRate(inv.taxRate ?? 5);
    setDiscount(inv.discount ?? 0);
    setDiscountReason(inv.discountReason || '');
    setInvoiceNotes(inv.notes || 'Payment terms: Net 7 days. For billing questions contact Cashier Desk.');
    setCollectPaymentNow(false);
    setImmediatePayAmount(Math.max(0, inv.totalAmount - inv.amountPaid));
    setImmediatePayMethod(inv.paymentMethod || 'Cash');
    setImmediateTxnRef(inv.transactionRef || generateReceiptReference(inv.paymentMethod || 'Cash'));
    setImmediateCollectedBy(inv.collectedBy || user?.name || 'Marcus Sterling (Accountant)');
    setImmediateCashierDesk(inv.cashierDesk || (cat === 'Hospital Service' ? 'Main OPD Cashier Desk' : 'Pharmacy Cash Counter'));
    setIsCreateModalOpen(true);
  };

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.totalAmount - inv.amountPaid);
    setPayCollectorName(user?.name || 'Marcus Sterling (Accountant)');
    setPayCashierDesk('Main OPD Cashier Desk');
    const initialMethod: PaymentMethod = inv.paymentMethod || 'Credit Card';
    setPayMethod(initialMethod);
    setPayTxnRef(generateReceiptReference(initialMethod));
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoice && payAmount > 0) {
      const finalRef = payTxnRef.trim() || generateReceiptReference(payMethod);
      MockStorage.recordPayment(
        selectedInvoice.id,
        payAmount,
        payMethod,
        finalRef,
        payCollectorName.trim() || undefined,
        payCashierDesk.trim() || undefined
      );
      showToast(
        'Payment Recorded',
        `Received ₹${payAmount} via ${payMethod}. Ref: ${finalRef}. Collected by: ${payCollectorName}.`
      );
      setIsPayModalOpen(false);
      refreshData();
    }
  };

  const handleOpenPrint = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Financial Billing, Invoices & Cashier Desk"
        subtitle="Departmental revenue management split into Hospital Services (OPD/IPD/Diagnostics), Pharmacy Prescription Fulfillment, and Walk-in Retail POS Sales."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Billing & Invoices' }]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {isAddonEnabled && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddonModalOpen(true)}
                leftIcon={<Zap className="w-4 h-4" />}
                className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white font-medium shadow-xs whitespace-nowrap"
              >
                + Add On Billing Software
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Invoices_Ledger', filtered)}
              leftIcon={<Download className="w-4 h-4 text-slate-500" />}
              className="whitespace-nowrap font-medium"
            >
              Export Ledger
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreateModal()}
              leftIcon={<Plus className="w-4 h-4" />}
              className="whitespace-nowrap font-medium shadow-xs"
            >
              Create Patient Invoice
            </Button>
          </div>
        }
      />

      {/* 3 Departmental Revenue Desks (The Split) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Desk 1: Hospital Services */}
        <div
          onClick={() => handleSelectStream('hospital')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
            activeStream === 'hospital'
              ? 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/30 border-indigo-400 ring-2 ring-indigo-200 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Hospital Services
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {hospitalInvoices.length} Bills
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-medium text-slate-500">Billed: ₹{totalHospitalBilled.toLocaleString()} • Collected:</p>
            <p className="text-2xl font-bold text-indigo-900 mt-0.5">₹{totalHospitalPaid.toLocaleString()}</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Pending: <strong className="text-amber-700">₹{pendingHospital.toLocaleString()}</strong></span>
            <span className="text-indigo-600 font-semibold inline-flex items-center gap-0.5 hover:underline">
              {activeStream === 'hospital' ? 'Active Stream' : 'View Desk'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Desk 2: Pharmacy Services (Rx Dispensing) */}
        <div
          onClick={() => handleSelectStream('pharmacy')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
            activeStream === 'pharmacy'
              ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30 border-emerald-400 ring-2 ring-emerald-200 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Pill className="w-3.5 h-3.5 text-emerald-600" /> Pharmacy Services
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {pharmacyInvoices.length} Bills
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-medium text-slate-500">Doctor Rx Dispensed: ₹{totalPharmacyBilled.toLocaleString()} • Collected:</p>
            <p className="text-2xl font-bold text-emerald-900 mt-0.5">₹{totalPharmacyPaid.toLocaleString()}</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Pending: <strong className="text-amber-700">₹{pendingPharmacy.toLocaleString()}</strong></span>
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5 hover:underline">
              {activeStream === 'pharmacy' ? 'Active Stream' : 'View Desk'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Desk 3: Walk-in Pharmacy (OTC Retail POS) */}
        <div
          onClick={() => handleSelectStream('walkin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
            activeStream === 'walkin'
              ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 border-amber-400 ring-2 ring-amber-200 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600" /> Walk-in Pharmacy
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {walkInInvoices.length} POS Sales
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-medium text-slate-500">OTC Retail POS: ₹{totalWalkInBilled.toLocaleString()} • Collected:</p>
            <p className="text-2xl font-bold text-amber-950 mt-0.5">₹{totalWalkInPaid.toLocaleString()}</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Direct Retail: <strong className="text-emerald-700 font-semibold">100% Cash/UPI</strong></span>
            <span className="text-amber-800 font-semibold inline-flex items-center gap-0.5 hover:underline">
              {activeStream === 'walkin' ? 'Active Stream' : 'View Desk'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Financial KPIs (Dynamically scoped to selected stream) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {activeStream === 'all'
                  ? 'Total Invoiced (All)'
                  : activeStream === 'hospital'
                  ? 'Hospital Billed'
                  : activeStream === 'pharmacy'
                  ? 'Pharmacy Billed'
                  : 'Walk-in POS Billed'}
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalStreamBilled.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Across {streamInvoices.length} transactions</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalStreamPaid.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600/80 mt-0.5 font-medium">
              {totalStreamBilled > 0 ? `${Math.round((totalStreamPaid / totalStreamBilled) * 100)}% recovery rate` : 'All cleared'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Receivables</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">₹{totalStreamPending.toLocaleString()}</p>
            <p className="text-[10px] text-amber-600/80 mt-0.5 font-medium">Pending cashier settlement</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Invoices Table */}
      <Card>
        {/* Stream Filter Segmented Tabs */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSelectStream('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStream === 'all'
                  ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>All Billings</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeStream === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {invoices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectStream('hospital')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStream === 'hospital'
                  ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200 ring-1 ring-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hospital Services</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeStream === 'hospital' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {hospitalInvoices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectStream('pharmacy')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStream === 'pharmacy'
                  ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200 ring-1 ring-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pharmacy Services</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeStream === 'pharmacy' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {pharmacyInvoices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectStream('walkin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStream === 'walkin'
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-200 ring-1 ring-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
              <span>Walk-in Pharmacy</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeStream === 'walkin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {walkInInvoices.length}
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Showing {filtered.length} of {streamInvoices.length} invoices
          </span>
        </div>

        {/* Search & Status Filter Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice ID, patient, doctor, Rx ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 w-full sm:w-auto"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid in Full</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending Payment</option>
              <option value="Overdue">Overdue</option>
            </Select>

            {activeStream === 'walkin' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreateModal('Walk-in Pharmacy')}
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                className="whitespace-nowrap"
              >
                + Quick POS Bill
              </Button>
            ) : activeStream === 'pharmacy' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreateModal('Pharmacy Service')}
                leftIcon={<Pill className="w-3.5 h-3.5" />}
                className="whitespace-nowrap"
              >
                + Prescription Bill
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Invoice ID & Stream</th>
                <th className="px-4 py-3.5">Patient / Customer</th>
                <th className="px-4 py-3.5">Issue Date & Counter</th>
                <th className="px-4 py-3.5">Billed Total</th>
                <th className="px-4 py-3.5">Amount Paid</th>
                <th className="px-4 py-3.5">Payment & Audit</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <EmptyState
                      icon={
                        activeStream === 'pharmacy' ? (
                          <Pill className="w-7 h-7 stroke-[1.5] text-emerald-600" />
                        ) : activeStream === 'walkin' ? (
                          <ShoppingCart className="w-7 h-7 stroke-[1.5] text-amber-600" />
                        ) : (
                          <Building2 className="w-7 h-7 stroke-[1.5] text-indigo-600" />
                        )
                      }
                      title={
                        activeStream === 'pharmacy'
                          ? 'No Pharmacy Service Invoices'
                          : activeStream === 'walkin'
                          ? 'No Walk-in Pharmacy Bills'
                          : activeStream === 'hospital'
                          ? 'No Hospital Service Invoices'
                          : 'No Invoices Found'
                      }
                      description={
                        searchQuery || statusFilter !== 'all'
                          ? 'Try clearing the search query or status filters.'
                          : activeStream === 'pharmacy'
                          ? 'Doctor e-prescription fulfillment invoices will appear here once dispensed.'
                          : activeStream === 'walkin'
                          ? 'Counter retail sales and walk-in purchases will appear here.'
                          : 'Create an invoice or record inpatient / outpatient clinical services.'
                      }
                      actionText={
                        activeStream === 'walkin'
                          ? 'Create Walk-in Bill'
                          : activeStream === 'pharmacy'
                          ? 'Create Pharmacy Bill'
                          : 'Create Patient Invoice'
                      }
                      onAction={() => handleOpenCreateModal()}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((inv) => {
                  const category = getInvoiceBillingCategory(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice ID & Stream Classification */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-mono font-bold text-indigo-700">{inv.id}</p>
                        <div className="mt-1">
                          {category === 'Hospital Service' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Building2 className="w-2.5 h-2.5 text-indigo-600" /> Hospital Service
                            </span>
                          )}
                          {category === 'Pharmacy Service' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Pill className="w-2.5 h-2.5 text-emerald-600" /> Pharmacy Service
                            </span>
                          )}
                          {category === 'Walk-in Pharmacy' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                              <ShoppingCart className="w-2.5 h-2.5 text-amber-600" /> Walk-in Pharmacy
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient / Customer Details */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 leading-tight">{inv.patientName}</p>
                          {category === 'Hospital Service' && inv.encounterType && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {inv.encounterType}
                            </span>
                          )}
                        </div>

                        {category === 'Hospital Service' && inv.doctorName && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Stethoscope className="w-2.5 h-2.5 text-slate-400" /> {inv.doctorName}
                          </p>
                        )}

                        {category === 'Pharmacy Service' && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-emerald-700">
                            {inv.prescriptionId && (
                              <span className="font-mono font-semibold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                                Rx: {inv.prescriptionId}
                              </span>
                            )}
                            {inv.doctorName && <span>By {inv.doctorName}</span>}
                          </div>
                        )}

                        {category === 'Walk-in Pharmacy' && (
                          <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                            Retail Counter POS {inv.patientPhone ? `• ${inv.patientPhone}` : ''}
                          </p>
                        )}
                      </td>

                      {/* Issue Date & Cashier Counter */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <p className="font-medium text-slate-800">{inv.issueDate}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {inv.cashierDesk || (category === 'Hospital Service' ? 'Main OPD Cashier Desk' : 'Pharmacy Cash Counter')}
                        </p>
                      </td>

                      {/* Billed Total */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 text-xs">₹{inv.totalAmount.toLocaleString()}</span>
                        {inv.items && inv.items.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{inv.items.length} item{inv.items.length > 1 ? 's' : ''}</p>
                        )}
                      </td>

                      {/* Amount Paid */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-emerald-700 text-xs">₹{inv.amountPaid.toLocaleString()}</span>
                        {inv.totalAmount > inv.amountPaid && (
                          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            Due: ₹{(inv.totalAmount - inv.amountPaid).toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Payment Method & Audit */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {inv.paymentMethod ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                              <CreditCard className="w-3 h-3 text-slate-400" /> {inv.paymentMethod}
                            </span>
                            {inv.collectedBy && (
                              <p className="text-[10px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5 text-emerald-600" /> {inv.collectedBy}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unsettled</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {inv.status === 'Paid' && <Badge variant="success" dot>Paid</Badge>}
                        {inv.status === 'Partially Paid' && <Badge variant="warning" dot>Partially Paid</Badge>}
                        {inv.status === 'Pending' && <Badge variant="neutral" dot>Pending</Badge>}
                        {inv.status === 'Overdue' && <Badge variant="error" dot>Overdue</Badge>}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEditModal(inv)}
                          leftIcon={<Edit2 className="w-3 h-3" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenPrint(inv)}
                          leftIcon={<Printer className="w-3 h-3" />}
                        >
                          Print
                        </Button>
                        {inv.status !== 'Paid' && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleOpenPay(inv)}
                          >
                            Collect Pay
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </Card>

      {/* Create / Edit Patient Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingInvoiceId ? `Modify Invoice (${editingInvoiceId})` : `Generate ${formCategory} Invoice`}
        subtitle={
          editingInvoiceId
            ? 'Update clinical line items, pricing, attending doctor, and financial concessions'
            : formCategory === 'Walk-in Pharmacy'
            ? 'Direct retail counter Point-of-Sale with instant customer checkout'
            : formCategory === 'Pharmacy Service'
            ? 'Doctor e-prescription fulfillment & dispensary invoice generation'
            : 'Hospital clinical charges, room beds, attending doctor, insurance TPA & settlement'
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          {/* Section 0: Billing Service Stream Selector */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Billing Service Stream / Department *
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Select department revenue desk</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectModalCategory('Hospital Service')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  formCategory === 'Hospital Service'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${formCategory === 'Hospital Service' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Hospital Service</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">OPD, IPD Beds, Diagnostics & Clinical Procedures</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModalCategory('Pharmacy Service')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  formCategory === 'Pharmacy Service'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${formCategory === 'Pharmacy Service' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Pharmacy Service</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Doctor e-Prescription Dispensing & Inpatient Meds</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModalCategory('Walk-in Pharmacy')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  formCategory === 'Walk-in Pharmacy'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${formCategory === 'Walk-in Pharmacy' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Walk-in Pharmacy</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Retail Counter POS, Direct OTC Sales & Walk-ins</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 1: Patient / Customer & Encounter Details */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              {formCategory === 'Walk-in Pharmacy' ? '1. Walk-in Customer Details' : '1. Patient & Encounter Details'}
            </h4>

            {formCategory === 'Walk-in Pharmacy' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Customer / Buyer Name *"
                    placeholder="e.g. Vikas Verma or Walk-in Customer"
                    value={walkInCustomerName}
                    onChange={(e) => setWalkInCustomerName(e.target.value)}
                    required
                  />
                  <Input
                    label="Customer Contact Phone (Optional)"
                    placeholder="e.g. +91 98765 43210"
                    value={walkInCustomerPhone}
                    onChange={(e) => setWalkInCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Retail OTC Mode:</strong> Direct cash/card/UPI checkout at pharmacy counter. No mandatory UHID hospital registration required.</span>
                </div>
              </div>
            ) : (
              <>
                <PatientCombobox
                  label="Select Patient *"
                  required
                  hospitalId={hospId}
                  selectedPatientId={selectedPatientId}
                  onSelectPatient={(p) => {
                    setSelectedPatient(p);
                    setSelectedPatientId(p?.id || '');
                    if (p) {
                      setPatientSelectError('');
                    }
                  }}
                  error={patientSelectError}
                />

                {formCategory === 'Pharmacy Service' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Linked Doctor e-Prescription ID (Optional)"
                      placeholder="e.g. RX-2026-001"
                      value={prescriptionId}
                      onChange={(e) => setPrescriptionId(e.target.value)}
                      helperText="Links this invoice to the patient prescription record"
                    />
                    <Select
                      label="Prescribing / Attending Doctor"
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                    >
                      <option value="">-- Select Prescribing Doctor --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialization})
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {formCategory === 'Hospital Service' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Encounter / Visit Type *"
                      value={encounterType}
                      onChange={(e) => setEncounterType(e.target.value as EncounterType)}
                    >
                      <option value="OPD">OPD (Outpatient Consultation)</option>
                      <option value="IPD">IPD (Inpatient Ward / Bed Admission)</option>
                      <option value="Emergency">Emergency / ER</option>
                      <option value="Daycare">Daycare / Dialysis / Chemo</option>
                      <option value="Diagnostic">Laboratory / Diagnostic Center</option>
                    </Select>

                    <Select
                      label="Attending / Consulting Doctor"
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        const doc = doctors.find((d) => d.id === e.target.value);
                        if (doc && items.length === 1 && items[0].category === 'Consultation') {
                          setItems([
                            {
                              ...items[0],
                              description: `Specialist Consultation - ${doc.name}`,
                              unitPrice: doc.consultationFee,
                              total: doc.consultationFee,
                            },
                          ]);
                        }
                      }}
                    >
                      <option value="">-- General / Hospital Pool --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialization} - {doc.departmentName})
                        </option>
                      ))}
                    </Select>

                    <Input
                      label="Department"
                      value={doctors.find((d) => d.id === selectedDoctorId)?.departmentName || 'General OPD'}
                      disabled
                      className="bg-slate-100 text-slate-600"
                    />
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Invoice Issue Date *"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
              <Input
                label="Payment Due Date *"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 2: Payment Classification & Insurance / TPA (Only for Hospital & Pharmacy) */}
          {formCategory !== 'Walk-in Pharmacy' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" /> 2. Payment Classification & Insurance / TPA
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['Self Pay', 'Insurance / TPA', 'Corporate'] as PaymentType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setPaymentType(type)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentType === type
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {type === 'Self Pay' ? '💵 Self Pay (Direct)' : type === 'Insurance / TPA' ? '🏥 Health Insurance / TPA' : '🏢 Corporate Panel'}
                  </button>
                ))}
              </div>

              {paymentType !== 'Self Pay' && (
                <div className="p-3 bg-white border border-indigo-100 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Insurance / TPA Company *"
                      placeholder="e.g. Star Health, BlueCross, Aetna"
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      required
                    />
                    <Input
                      label="Policy / Member ID *"
                      placeholder="e.g. POL-8829104"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      required
                    />
                    <Input
                      label="Pre-Auth / Approval Reference #"
                      placeholder="e.g. AUTH-902184"
                      value={claimApprovalNumber}
                      onChange={(e) => setClaimApprovalNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Itemized Line Items & Presets */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                {formCategory === 'Walk-in Pharmacy'
                  ? '3. Retail OTC Medication Items'
                  : formCategory === 'Pharmacy Service'
                  ? '3. Prescribed Medication Items'
                  : '3. Itemized Clinical Charges'}
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {formCategory === 'Hospital Service' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Consultation', 'Specialist OPD Consultation', 250)}
                    >
                      + Consult (₹250)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Laboratory', '12-Lead Electrocardiogram (ECG)', 85)}
                    >
                      + ECG (₹85)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Laboratory', 'Diagnostic Lab Panel (CBC/Metabolic)', 450)}
                    >
                      + Lab Test (₹450)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Bed Charge', 'Inpatient Ward Bed Daily Charge', 350)}
                    >
                      + Ward Bed (₹350)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Bed Charge', 'ICU Special Care Bed Charge', 1200)}
                    >
                      + ICU Bed (₹1,200)
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Pharmacy', 'Paracetamol 650mg (Strip of 15)', 20)}
                    >
                      + Paracetamol (₹20)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Pharmacy', 'Amoxicillin 500mg (Strip of 10)', 45)}
                    >
                      + Amoxicillin (₹45)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Pharmacy', 'Pantoprazole 40mg (Strip of 10)', 75)}
                    >
                      + Pantoprazole (₹75)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Pharmacy', 'Sterile Adhesive Bandages (Pack of 20)', 80)}
                    >
                      + First Aid Kit (₹80)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addPresetItem('Pharmacy', 'Vitamin C 500mg Chewable (Bottle of 30)', 95)}
                    >
                      + Vitamin C (₹95)
                    </Button>
                  </>
                )}
                <Button type="button" variant="primary" size="xs" onClick={addItem} leftIcon={<Plus className="w-3 h-3" />}>
                   Custom Line
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id} className="p-2 rounded-xl bg-white border border-slate-200 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Service / Medication Description"
                      value={it.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={it.category}
                      onChange={(e) => updateItem(idx, 'category', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Bed Charge">Bed Charge</option>
                      <option value="Procedure">Procedure</option>
                      <option value="Nursing">Nursing</option>
                      <option value="Ambulance">Ambulance</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      min="0"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div className="col-span-1 text-right font-bold text-xs text-slate-800">
                    ₹{it.total}
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Concessions, Taxes & Financial Summary */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Input
                  label="Tax / GST Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
                <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                  <span className="text-slate-400 font-semibold">Admin Presets:</span>
                  <button
                    type="button"
                    onClick={() => setTaxRate(settings.defaultGSTRate ?? 5)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    General: {settings.defaultGSTRate ?? 5}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxRate(settings.pharmacyGSTRate ?? 5)}
                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold"
                  >
                    Pharm: {settings.pharmacyGSTRate ?? 5}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxRate(settings.consultationGSTRate ?? 0)}
                    className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold"
                  >
                    OPD: {settings.consultationGSTRate ?? 0}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxRate(settings.labDiagnosticGSTRate ?? 5)}
                    className="px-1.5 py-0.5 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-semibold"
                  >
                    Lab: {settings.labDiagnosticGSTRate ?? 5}%
                  </button>
                </div>
              </div>
              <Input
                label="Concession / Discount (₹)"
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            <Select
              label="Concession / Waiver Reason"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              disabled={discount <= 0}
            >
              <option value="">-- None / Standard --</option>
              <option value="Senior Citizen Concession">Senior Citizen Concession</option>
              <option value="Staff / Healthcare Worker Family">Staff / Family Concession</option>
              <option value="BPL / Financial Assistance">Financial Assistance / BPL</option>
              <option value="Medical Director Special Waiver">Director Approval Waiver</option>
              <option value="Volume / Promotional Discount">Promotional / Package Discount</option>
            </Select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex justify-between items-center text-xs">
            <div className="space-y-0.5">
              <span>Subtotal: <strong>₹{calculatedSubtotal}</strong></span>
              <span className="text-slate-400 mx-2">•</span>
              <span>Tax ({taxRate}%): <strong>+₹{calculatedTax.toFixed(2)}</strong></span>
              {discount > 0 && (
                <>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-amber-400">Discount: <strong>-₹{discount.toFixed(2)}</strong></span>
                </>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Net Payable</span>
              <span className="text-xl font-black text-teal-400">₹{calculatedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Section 5: Cashier Immediate Payment Collection */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={collectPaymentNow}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCollectPaymentNow(checked);
                    if (checked && immediatePayAmount === 0) {
                      setImmediatePayAmount(calculatedTotal);
                    }
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5 text-emerald-900">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  Collect Payment Now (Cashier Desk Settlement)
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                {collectPaymentNow ? 'Settling receipt immediately' : 'Will mark as Pending payment'}
              </span>
            </div>

            {collectPaymentNow && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Amount Collected (₹) *"
                    type="number"
                    min="1"
                    max={calculatedTotal}
                    value={immediatePayAmount}
                    onChange={(e) => setImmediatePayAmount(Number(e.target.value))}
                    required={collectPaymentNow}
                  />
                  <Select
                    label="Payment Method *"
                    value={immediatePayMethod}
                    onChange={(e) => {
                      const newMethod = e.target.value as PaymentMethod;
                      setImmediatePayMethod(newMethod);
                      setImmediateTxnRef(generateReceiptReference(newMethod));
                    }}
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="Credit Card">Credit Card (POS Terminal)</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="UPI">UPI / Digital QR Code</option>
                    <option value="Insurance">Insurance Pre-Auth Settlement</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                  </Select>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        POS / Receipt Ref #
                      </label>
                      <button
                        type="button"
                        onClick={() => setImmediateTxnRef(generateReceiptReference(immediatePayMethod))}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                        title="Auto-generate a new unique reference"
                      >
                        <RefreshCw className="w-3 h-3" /> Auto
                      </button>
                    </div>
                    <Input
                      placeholder="e.g. POS-CR-892183"
                      value={immediateTxnRef}
                      onChange={(e) => setImmediateTxnRef(e.target.value)}
                      helperText="Auto-generated. Override if POS slip provides a bank RRN."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Collected By (Cashier / Accountant) *"
                    value={immediateCollectedBy}
                    onChange={(e) => setImmediateCollectedBy(e.target.value)}
                    placeholder="Cashier Staff Name"
                    required={collectPaymentNow}
                  />
                  <Select
                    label="Cashier Counter / Desk *"
                    value={immediateCashierDesk}
                    onChange={(e) => setImmediateCashierDesk(e.target.value)}
                  >
                    <option value="Main OPD Cashier Desk">Main OPD Cashier Desk</option>
                    <option value="Emergency Billing Counter">Emergency Billing Counter</option>
                    <option value="IPD Discharge Desk">IPD Discharge Desk</option>
                    <option value="Pharmacy Cash Counter">Pharmacy Cash Counter</option>
                    <option value="Central Finance Desk">Central Finance Desk</option>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Notes & Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing Remarks & Disclaimers
            </label>
            <input
              type="text"
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              placeholder="e.g. Payment terms, valid for insurance reimbursement..."
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
              {editingInvoiceId ? 'Save & Update Invoice' : 'Generate & Issue Invoice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Patient Payment"
        subtitle={`Receipt for ${selectedInvoice?.id}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{selectedInvoice?.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Billed:</span>
              <span className="font-bold text-slate-900">₹{selectedInvoice?.totalAmount}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Outstanding Balance:</span>
              <span>₹{selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.amountPaid : 0}</span>
            </div>
          </div>

          <Input
            label="Payment Amount to Collect (₹) *"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Method"
              value={payMethod}
              onChange={(e) => {
                const newMethod = e.target.value as PaymentMethod;
                setPayMethod(newMethod);
                setPayTxnRef(generateReceiptReference(newMethod));
              }}
            >
              <option value="Credit Card">Credit Card (POS Terminal)</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash Counter</option>
              <option value="Insurance">Health Insurance TPA Claim</option>
              <option value="Bank Transfer">Bank Wire Transfer</option>
              <option value="UPI">UPI / Digital QR</option>
            </Select>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Transaction / POS Slip Ref #
                </label>
                <button
                  type="button"
                  onClick={() => setPayTxnRef(generateReceiptReference(payMethod))}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                  title="Auto-generate a new unique reference"
                >
                  <RefreshCw className="w-3 h-3" /> Auto
                </button>
              </div>
              <Input
                placeholder="e.g. POS-CR-892183"
                value={payTxnRef}
                onChange={(e) => setPayTxnRef(e.target.value)}
                helperText="Auto-generated. Override if POS slip provides a bank RRN."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Collected By (Cashier Name) *"
              value={payCollectorName}
              onChange={(e) => setPayCollectorName(e.target.value)}
              placeholder="Staff / Cashier Name"
              required
            />
            <Select
              label="Cashier Counter / Desk *"
              value={payCashierDesk}
              onChange={(e) => setPayCashierDesk(e.target.value)}
            >
              <option value="Main OPD Cashier Desk">Main OPD Cashier Desk</option>
              <option value="Emergency Billing Counter">Emergency Billing Counter</option>
              <option value="IPD Discharge Desk">IPD Discharge Desk</option>
              <option value="Pharmacy Cash Counter">Pharmacy Cash Counter</option>
              <option value="Central Finance Desk">Central Finance Desk</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print / View Invoice Modal Simulation */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={
          selectedInvoice
            ? getInvoiceBillingCategory(selectedInvoice) === 'Walk-in Pharmacy'
              ? 'Walk-in Pharmacy POS Cash Receipt'
              : getInvoiceBillingCategory(selectedInvoice) === 'Pharmacy Service'
              ? 'Hospital Pharmacy Dispensary Receipt'
              : 'Hospital Clinical Services Tax Invoice'
            : 'Official Patient Tax Receipt'
        }
        subtitle="Official Hospital Bill of Supply & Tax Invoice"
        maxWidth="2xl"
      >
        {selectedInvoice && (() => {
          const cat = getInvoiceBillingCategory(selectedInvoice);
          return (
            <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{settings.hospitalName || currentHospital?.name || 'PulseCore Health'}</h3>
                    {cat === 'Hospital Service' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Hospital Service
                      </span>
                    )}
                    {cat === 'Pharmacy Service' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Pharmacy Dispensary
                      </span>
                    )}
                    {cat === 'Walk-in Pharmacy' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        Walk-in OTC Retail
                      </span>
                    )}
                  </div>
                  {settings.tagline && <p className="text-[11px] text-indigo-700 italic font-medium">{settings.tagline}</p>}
                  <p className="text-[11px] text-slate-500">
                    Facility ID: {hospId} • Tax ID / GSTIN: {settings.taxRegistrationNumber || 'EIN-84-9021948'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {settings.address || 'Main Campus'} • Emergency: {settings.emergencyHelpline || '+1 (555) 911-0000'} • Phone: {settings.receptionPhone || currentHospital?.phone || 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Department: {cat === 'Hospital Service' ? 'Clinical Inpatient & Outpatient Billing' : 'Central Hospital Pharmacy & Retail Dispensary'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-indigo-700">{selectedInvoice.id}</span>
                  <p className="text-slate-500 text-[11px]">Issued: {selectedInvoice.issueDate}</p>
                  <div className="mt-1">
                    <Badge variant={selectedInvoice.status === 'Paid' ? 'success' : 'warning'} size="sm">
                      {selectedInvoice.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                <div>
                  <p className="font-bold text-slate-900">
                    {cat === 'Walk-in Pharmacy' ? 'Retail Buyer:' : 'Billed Patient:'}
                  </p>
                  <p className="font-semibold text-slate-800 text-xs">{selectedInvoice.patientName}</p>
                  <p className="text-slate-500">ID: {selectedInvoice.patientId}</p>
                  <p className="text-slate-500">Phone: {selectedInvoice.patientPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {cat === 'Walk-in Pharmacy' ? 'Counter POS Details:' : 'Clinical Encounter:'}
                  </p>
                  {cat === 'Walk-in Pharmacy' ? (
                    <>
                      <p className="font-semibold text-slate-800">Pharmacy Retail Counter</p>
                      <p className="text-slate-500">Direct OTC Purchase</p>
                      <p className="text-amber-800 font-bold uppercase">Cashier Verified</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-800">
                        {selectedInvoice.doctorName ? `Dr. ${selectedInvoice.doctorName.replace(/^Dr\.?\s*/i, '')}` : 'General Hospital Pool'}
                      </p>
                      <p className="text-slate-500">Dept: {selectedInvoice.departmentName || (cat === 'Pharmacy Service' ? 'Hospital Pharmacy' : 'General Medicine')}</p>
                      <p className="text-indigo-600 font-bold uppercase">
                        {cat === 'Pharmacy Service' && selectedInvoice.prescriptionId
                          ? `Rx: #${selectedInvoice.prescriptionId}`
                          : `${selectedInvoice.encounterType || 'OPD'} Patient`}
                      </p>
                    </>
                  )}
                </div>
                <div className="text-right sm:text-left">
                  <p className="font-bold text-slate-900">Billing Classification:</p>
                  <p className="font-semibold text-slate-800">{cat === 'Walk-in Pharmacy' ? 'Retail POS Direct Sale' : (selectedInvoice.paymentType || 'Self Pay')}</p>
                  {selectedInvoice.insuranceProvider && (
                    <p className="text-slate-500">Ins: {selectedInvoice.insuranceProvider} ({selectedInvoice.policyNumber || 'N/A'})</p>
                  )}
                  {selectedInvoice.claimApprovalNumber && (
                    <p className="text-emerald-700 font-mono">Auth: {selectedInvoice.claimApprovalNumber}</p>
                  )}
                </div>
              </div>

            {/* Itemized Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">
                  <th className="py-2 px-3">Service / Medication</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Rate</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedInvoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3">{it.description}</td>
                    <td className="py-2 px-3 text-center">{it.quantity}</td>
                    <td className="py-2 px-3 text-right">₹{it.unitPrice}</td>
                    <td className="py-2 px-3 text-right font-semibold">₹{it.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax ({selectedInvoice.taxRate}%):</span>
                  <span>₹{selectedInvoice.taxAmount}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Discount {selectedInvoice.discountReason ? `(${selectedInvoice.discountReason})` : ''}:</span>
                    <span>-₹{selectedInvoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-1 text-slate-900">
                  <span>Grand Total:</span>
                  <span>₹{selectedInvoice.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1">
                  <span>Amount Paid:</span>
                  <span>₹{selectedInvoice.amountPaid}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold pt-0.5">
                  <span>Balance Due:</span>
                  <span>₹{Math.max(0, selectedInvoice.totalAmount - selectedInvoice.amountPaid)}</span>
                </div>
              </div>
            </div>

            {/* Payment Audit & Who Collected Pay */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-700">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Collected / Received By: <span className="font-bold text-slate-900">{selectedInvoice.collectedBy || 'Hospital Cashier Desk'}</span>
                </p>
                <p className="text-slate-500">Counter / Desk: {selectedInvoice.cashierDesk || 'Main OPD Cashier Desk'}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p><span className="text-slate-500">Settlement Method:</span> <span className="font-semibold">{selectedInvoice.paymentMethod || 'Pending'}</span></p>
                <p><span className="text-slate-500">Txn / POS Ref:</span> <span className="font-mono">{selectedInvoice.transactionRef || 'N/A'}</span></p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
              This is a computer-generated simulated receipt from PulseCore Health Operating System.
            </div>
          </div>
          );
        })()}
      </Modal>

      <BillingSoftwareAddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
      />
    </div>
  );
};
