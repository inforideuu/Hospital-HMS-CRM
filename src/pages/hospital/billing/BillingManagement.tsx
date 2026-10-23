import React, { useState } from 'react';
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

  // Create / Edit Invoice Form State (Real Hospital Fields)
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
  const [taxRate, setTaxRate] = useState(5);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('Due in 7 days. Thank you for choosing PulseCore Health.');

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

  const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalPending = invoices.reduce((acc, i) => (i.status !== 'Paid' ? acc + (i.totalAmount - i.amountPaid) : acc), 0);

  const filtered = invoices.filter((i) => {
    const matchesSearch =
      i.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.transactionRef && i.transactionRef.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    let pat = selectedPatient;
    if (!pat && selectedPatientId) {
      pat = MockStorage.getPatientById(selectedPatientId) || null;
    }
    if (!pat) {
      setPatientSelectError('Please search and select a patient');
      showToast('Patient Required', 'Please select a valid registered patient.', 'error');
      return;
    }

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
        encounterType,
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
      collector = immediateCollectedBy || user?.name || 'Marcus Sterling (Accountant)';
      desk = immediateCashierDesk || 'Main OPD Cashier Desk';
      if (settledAmount >= calculatedTotal && calculatedTotal > 0) {
        invStatus = 'Paid';
      } else if (settledAmount > 0) {
        invStatus = 'Partially Paid';
      }
    } else if (paymentType === 'Insurance / TPA' && claimApprovalNumber) {
      settlementMethod = 'Insurance';
      txnRef = `AUTH-${claimApprovalNumber.trim()}`;
    }

    const newInv: Invoice = {
      id: `INV-2026-${100 + invoices.length + 1}`,
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

      // Real hospital clinical & billing metadata
      encounterType,
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
    setPatientSelectError('');
    refreshData();
  };

  const handleOpenCreateModal = () => {
    setEditingInvoiceId(null);
    setSelectedPatient(null);
    setSelectedPatientId('');
    setPatientSelectError('');
    setEncounterType('OPD');
    setSelectedDoctorId(doctors[0]?.id || '');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setPaymentType('Self Pay');
    setInsuranceProvider('');
    setPolicyNumber('');
    setClaimApprovalNumber('');
    const defaultDocFee = doctors[0]?.consultationFee || 150;
    setItems([
      { id: `item-${Date.now()}`, description: `Specialist OPD Consultation${doctors[0] ? ` - ${doctors[0].name}` : ''}`, category: 'Consultation', quantity: 1, unitPrice: defaultDocFee, total: defaultDocFee },
    ]);
    setTaxRate(5);
    setDiscount(0);
    setDiscountReason('');
    setInvoiceNotes('Payment terms: Net 7 days. For billing questions contact Cashier Desk.');
    setCollectPaymentNow(false);
    setImmediatePayAmount(0);
    setImmediatePayMethod('Cash');
    setImmediateTxnRef(generateReceiptReference('Cash'));
    setImmediateCollectedBy(user?.name || 'Marcus Sterling (Accountant)');
    setImmediateCashierDesk('Main OPD Cashier Desk');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setSelectedPatientId(inv.patientId);
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
    setImmediateCashierDesk(inv.cashierDesk || 'Main OPD Cashier Desk');
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
        subtitle="Patient bill calculation, itemized hospital charges, insurance claims, and real-time payments."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Billing & Invoices' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isAddonEnabled && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddonModalOpen(true)}
                leftIcon={<Zap className="w-3.5 h-3.5" />}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
              >
                + Add On Billing Software
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Invoices_Ledger', filtered)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Invoices
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Patient Invoice
            </Button>
          </div>
        }
      />


      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced Amount</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Receivables</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">₹{totalPending.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Invoices Table */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice ID, patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Invoice ID & Patient</th>
                <th className="px-4 py-3.5">Issue Date</th>
                <th className="px-4 py-3.5">Billed Total</th>
                <th className="px-4 py-3.5">Amount Paid</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-900 leading-tight">{inv.patientName}</p>
                      {inv.encounterType && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {inv.encounterType}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-600 font-mono mt-0.5">{inv.id}</p>
                    {inv.doctorName && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-2.5 h-2.5 text-slate-400" /> {inv.doctorName}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-slate-600">
                    <p>{inv.issueDate}</p>
                    <p className="text-[10px] text-slate-400">Due: {inv.dueDate}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 text-xs">₹{inv.totalAmount.toLocaleString()}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-bold text-emerald-700 text-xs">₹{inv.amountPaid.toLocaleString()}</span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-600">
                    {inv.paymentMethod ? (
                      <div>
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                          <CreditCard className="w-3 h-3 text-slate-400" /> {inv.paymentMethod}
                        </span>
                        {inv.collectedBy && (
                          <p className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5" /> By: {inv.collectedBy}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unspecified</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    {inv.status === 'Paid' && <Badge variant="success" dot>Paid</Badge>}
                    {inv.status === 'Partially Paid' && <Badge variant="warning" dot>Partially Paid</Badge>}
                    {inv.status === 'Pending' && <Badge variant="neutral" dot>Pending</Badge>}
                    {inv.status === 'Overdue' && <Badge variant="error" dot>Overdue</Badge>}
                  </td>

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
              ))}
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
        title={editingInvoiceId ? `Modify Patient Invoice (${editingInvoiceId})` : 'Generate Patient Billing Invoice'}
        subtitle={
          editingInvoiceId
            ? 'Update clinical line items, pricing, attending doctor, and financial concessions'
            : 'Complete clinical charges, attending doctor, insurance TPA claims & cashier settlement'
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          {/* Section 1: Patient Search & Encounter Details */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <User className="w-3.5 h-3.5 text-indigo-600" /> 1. Patient & Encounter Details
            </h4>
            
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
                <option value="Pharmacy">Pharmacy / Outpatient Dispense</option>
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

          {/* Section 2: Payment Classification & Insurance / TPA */}
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

          {/* Section 3: Itemized Clinical Services */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" /> 3. Itemized Clinical Charges
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => addPresetItem('Consultation', 'Specialist Consultation', 500)}
                >
                  + Consultation (₹500)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => addPresetItem('Pharmacy', 'Prescribed Inpatient/OPD Medication', 250)}
                >
                  + Pharmacy (₹250)
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
                  onClick={() => addPresetItem('Bed Charge', 'Inpatient Ward Bed Daily Charge', 1200)}
                >
                  + Bed Stay (₹1,200)
                </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tax Rate (%)"
              type="number"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
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
        title="Official Patient Tax Receipt"
        subtitle="Formatted Hospital Invoice"
        maxWidth="2xl"
      >
        {selectedInvoice && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 text-xs text-slate-800">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">{currentHospital?.name || 'PulseCore Health'}</h3>
                <p className="text-[11px] text-slate-500">Facility ID: {hospId} • Tax EIN: EIN-84-9021948</p>
                <p className="text-[11px] text-slate-500">Emergency & OPD Billing Department</p>
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
                <p className="font-bold text-slate-900">Billed Patient:</p>
                <p className="font-semibold text-slate-800 text-xs">{selectedInvoice.patientName}</p>
                <p className="text-slate-500">ID: {selectedInvoice.patientId}</p>
                <p className="text-slate-500">Phone: {selectedInvoice.patientPhone}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">Clinical Encounter:</p>
                <p className="font-semibold text-slate-800">
                  {selectedInvoice.doctorName ? `Dr. ${selectedInvoice.doctorName.replace(/^Dr\.?\s*/i, '')}` : 'General Hospital Pool'}
                </p>
                <p className="text-slate-500">Dept: {selectedInvoice.departmentName || 'General Medicine'}</p>
                <p className="text-indigo-600 font-bold uppercase">{selectedInvoice.encounterType || 'OPD'} Patient</p>
              </div>
              <div className="text-right sm:text-left">
                <p className="font-bold text-slate-900">Billing Classification:</p>
                <p className="font-semibold text-slate-800">{selectedInvoice.paymentType || 'Self Pay'}</p>
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
        )}
      </Modal>

      <BillingSoftwareAddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
      />
    </div>
  );
};
