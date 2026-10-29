import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  BedDouble,
  Receipt,
  Search,
  Plus,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  Trash2,
  Eye,
  FileText,
  DollarSign,
  User,
  Shield,
  ArrowRight,
  ExternalLink,
  Pill,
  Download,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { MockStorage } from '../../../services/mockStorage';
import { calculateStayDays, formatStayDuration } from '../../../utils/admissionStay';
import { calculateItemizedDepartmentalGST, getDepartmentalGSTRate } from '../../../utils/gstCalculation';
import {
  Admission,
  Bed,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PaymentMethod,
  PaymentType,
  EncounterType,
} from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';

export const DischargeInvoicingManagement: React.FC = () => {
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  // Live hospital data state
  const [admissions, setAdmissions] = useState<Admission[]>(() => MockStorage.getAdmissions(hospId));
  const [beds, setBeds] = useState<Bed[]>(() => MockStorage.getBeds(hospId));
  const [invoices, setInvoices] = useState<Invoice[]>(() => MockStorage.getInvoices(hospId));
  const [labOrders, setLabOrders] = useState(() => MockStorage.getLabOrders(hospId));
  const [labCatalog, setLabCatalog] = useState(() => MockStorage.getLabCatalog(hospId));
  const doctors = MockStorage.getDoctors(hospId);
  const [settings, setSettings] = useState(() => MockStorage.getHospitalSettings(hospId));

  // Sync on window storage update
  useEffect(() => {
    const handleUpdate = () => {
      setAdmissions(MockStorage.getAdmissions(hospId));
      setBeds(MockStorage.getBeds(hospId));
      setInvoices(MockStorage.getInvoices(hospId));
      setLabOrders(MockStorage.getLabOrders(hospId));
      setLabCatalog(MockStorage.getLabCatalog(hospId));
      setSettings(MockStorage.getHospitalSettings(hospId));
    };
    window.addEventListener('pulse_storage_updated', handleUpdate);
    return () => window.removeEventListener('pulse_storage_updated', handleUpdate);
  }, [hospId]);

  const refreshData = () => {
    setAdmissions(MockStorage.getAdmissions(hospId));
    setBeds(MockStorage.getBeds(hospId));
    setInvoices(MockStorage.getInvoices(hospId));
    setLabOrders(MockStorage.getLabOrders(hospId));
    setLabCatalog(MockStorage.getLabCatalog(hospId));
    setSettings(MockStorage.getHospitalSettings(hospId));
  };

  // Helper: Computes itemized charges (Bed + Attending Specialist Care + Actual Lab Tests Taken)
  const getInpatientAccruedCharges = (adm: Admission) => {
    const bed = beds.find((b) => b.bedNumber === adm.bedNumber);
    const dailyRate = bed?.dailyRate || 1500;
    const dischargeD = adm.dischargeDate || new Date().toISOString().split('T')[0];
    const stayDays = calculateStayDays(adm.admissionDate, dischargeD);
    const totalBedCharge = stayDays * dailyRate;

    const assignedDoc = doctors.find(
      (d) => d.id === (adm.dischargeDoctorId || adm.doctorId)
    );
    const docFee = assignedDoc?.consultationFee || 500;
    const totalDocFee = stayDays * docFee;

    // Actual lab orders taken by this patient during admission (only included if actually taken!)
    const patientLabOrders = labOrders.filter(
      (o) => o.patientId === adm.patientId && o.status !== 'Cancelled' && o.status !== 'Sample Rejected'
    );
    const totalLabCharges = patientLabOrders.reduce((sum, order) => {
      const catalogItem = labCatalog.find((c) => c.id === order.testId || c.testName === order.testName);
      return sum + (catalogItem?.price || 350);
    }, 0);

    const deposit = Number(adm.initialDeposit) || 0;
    const subtotal = totalBedCharge + totalDocFee + totalLabCharges;

    // Departmental GST rates configured by Hospital Admin in Settings
    const isGstEnabled = settings.enableGSTBilling !== false;
    const bedGSTRate = getDepartmentalGSTRate('Bed Charge', undefined, settings);
    const docGSTRate = getDepartmentalGSTRate('Consultation', undefined, settings);
    const labGSTRate = getDepartmentalGSTRate('Laboratory', undefined, settings);

    const bedTax = isGstEnabled ? Math.round((totalBedCharge * bedGSTRate) / 100) : 0;
    const docTax = isGstEnabled ? Math.round((totalDocFee * docGSTRate) / 100) : 0;
    const labTax = isGstEnabled ? Math.round((totalLabCharges * labGSTRate) / 100) : 0;
    const totalTax = bedTax + docTax + labTax;

    const grossTotal = subtotal + totalTax;
    const netDue = Math.max(0, grossTotal - deposit);

    return {
      dailyRate,
      dischargeD,
      stayDays,
      totalBedCharge,
      assignedDoc,
      docFee,
      totalDocFee,
      patientLabOrders,
      totalLabCharges,
      deposit,
      subtotal,
      isGstEnabled,
      bedGSTRate,
      docGSTRate,
      labGSTRate,
      bedTax,
      docTax,
      labTax,
      totalTax,
      grossTotal,
      netDue,
      gstType: settings.gstType || 'CGST_SGST',
    };
  };

  // Filter & Search
  const [activeTab, setActiveTab] = useState<'pending' | 'settled' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Discharged Admissions
  const allDischargeAdmissions = useMemo(() => {
    return admissions.filter(
      (a) => a.status === 'Discharge Initiated' || a.status === 'Discharged' || Boolean(a.dischargeDate)
    );
  }, [admissions]);

  const pendingDischarges = useMemo(() => {
    return admissions.filter(
      (a) => a.status === 'Discharge Initiated' && (!a.invoiceId || a.billingStatus !== 'Paid')
    );
  }, [admissions]);

  const settledDischarges = useMemo(() => {
    return admissions.filter(
      (a) => (a.status === 'Discharge Initiated' || a.status === 'Discharged') && a.billingStatus === 'Paid'
    );
  }, [admissions]);

  // Aggregate Metrics (Bed + Doctor Rounds + Actual Labs - Deposit)
  const totalPendingUnbilled = useMemo(() => {
    return pendingDischarges.reduce((acc, adm) => {
      const { netDue } = getInpatientAccruedCharges(adm);
      return acc + netDue;
    }, 0);
  }, [pendingDischarges, beds, labOrders, labCatalog]);

  const filteredAdmissions = useMemo(() => {
    let list =
      activeTab === 'pending'
        ? pendingDischarges
        : activeTab === 'settled'
        ? settledDischarges
        : allDischargeAdmissions;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.patientId.toLowerCase().includes(q) ||
          a.bedNumber.toLowerCase().includes(q) ||
          a.wardType.toLowerCase().includes(q) ||
          (a.dischargeDoctorName && a.dischargeDoctorName.toLowerCase().includes(q)) ||
          (a.reason && a.reason.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeTab, pendingDischarges, settledDischarges, allDischargeAdmissions, searchQuery]);

  // Modals State
  const [selectedAdmForInvoice, setSelectedAdmForInvoice] = useState<Admission | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [selectedAdmForSummary, setSelectedAdmForSummary] = useState<Admission | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Manual Invoice Creation Form State
  const [invoiceIssueDate, setInvoiceIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState<string>(
    () => new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [paymentType, setPaymentType] = useState<PaymentType>('Self Pay');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [claimApprovalNumber, setClaimApprovalNumber] = useState('');

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  const [collectPaymentNow, setCollectPaymentNow] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payTxnRef, setPayTxnRef] = useState<string>('');
  const [payCollector, setPayCollector] = useState<string>(() => user?.name || 'Marcus Sterling (Accountant)');
  const [payCashierDesk, setPayCashierDesk] = useState<string>('IPD Cashier Desk');

  // Math totals for invoice form adhering to Departmental GST Presets
  const taxResult = useMemo(() => {
    return calculateItemizedDepartmentalGST(invoiceItems, settings, discountAmount);
  }, [invoiceItems, settings, discountAmount]);

  const calculatedSubtotal = taxResult.subtotal;
  const calculatedTax = taxResult.totalTax;
  const calculatedTotal = taxResult.totalAmount;
  const effectiveTaxRate = taxResult.effectiveTaxRate;

  // Action: Open Create Manual Invoice Modal
  const handleOpenCreateInvoice = (adm: Admission) => {
    const {
      dailyRate,
      dischargeD,
      stayDays,
      totalBedCharge,
      assignedDoc,
      docFee,
      totalDocFee,
      patientLabOrders,
      deposit,
      netDue,
    } = getInpatientAccruedCharges(adm);

    setSelectedAdmForInvoice(adm);
    setInvoiceIssueDate(new Date().toISOString().split('T')[0]);
    setInvoiceDueDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
    setPaymentType('Self Pay');
    setInsuranceProvider('');
    setPolicyNumber('');
    setClaimApprovalNumber('');

    // Pre-populate accurate itemized charges:
    // 1. Bed Stay Charges (Stay Days * Bed Rate)
    // 2. Attending Specialist Inpatient Rounds (Stay Days * Doctor Fee)
    // 3. Laboratory Investigations (ONLY tests actually ordered for this patient!)
    const initialItems: InvoiceItem[] = [
      {
        id: `item-bed-${Date.now()}`,
        description: `Bed Stay Charges (${stayDays} Day${stayDays > 1 ? 's' : ''} in ${adm.wardType} - ${adm.bedNumber}) [${adm.admissionDate} to ${dischargeD}]`,
        category: 'Bed Charge',
        quantity: stayDays,
        unitPrice: dailyRate,
        total: totalBedCharge,
      },
      {
        id: `item-doc-${Date.now() + 1}`,
        description: `Attending Specialist Daily Inpatient Care & Rounds (${stayDays} Day${stayDays > 1 ? 's' : ''} - Dr. ${assignedDoc?.name || adm.doctorName})`,
        category: 'Consultation',
        quantity: stayDays,
        unitPrice: docFee,
        total: totalDocFee,
      },
    ];

    // Add each lab test actually ordered
    patientLabOrders.forEach((order, idx) => {
      const catalogItem = labCatalog.find(
        (c) => c.id === order.testId || c.testName === order.testName
      );
      const testPrice = catalogItem?.price || 350;
      initialItems.push({
        id: `item-lab-${order.id || idx}-${Date.now()}`,
        description: `Lab Investigation: ${order.testName} (${order.category || 'Diagnostics'}) [Order: ${order.id || 'LAB'}]`,
        category: 'Laboratory',
        quantity: 1,
        unitPrice: testPrice,
        total: testPrice,
      });
    });

    setInvoiceItems(initialItems);

    if (deposit > 0) {
      setDiscountAmount(deposit);
      setDiscountReason(`Admission Advance Deposit Adjusted (₹${deposit})`);
    } else {
      setDiscountAmount(0);
      setDiscountReason('');
    }

    setCollectPaymentNow(false);
    setPayAmount(netDue);
    setPayMethod('Cash');
    setPayTxnRef(`REC-IPD-${Date.now().toString().slice(-6)}`);
    setPayCollector(user?.name || 'Marcus Sterling (Accountant)');
    setPayCashierDesk('IPD Cashier Desk');
    setInvoiceNotes(
      `Final Inpatient Discharge Settlement for Bed ${adm.bedNumber}. Admitted: ${adm.admissionDate}, Discharged: ${dischargeD} (${stayDays} days). Attending Doctor: ${adm.dischargeDoctorName || adm.doctorName}.`
    );

    setIsInvoiceModalOpen(true);
  };

  // Add Custom Item in Invoice Modal
  const handleAddCustomItem = () => {
    setInvoiceItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: 'Hospital Inpatient Ancillary Service',
        category: 'Bed Charge',
        quantity: 1,
        unitPrice: 500,
        total: 500,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        item.total = Number(item.quantity) * Number(item.unitPrice);
      }
      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Action: Confirm & Save Invoice
  const handleConfirmSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmForInvoice) return;

    if (invoiceItems.length === 0) {
      showToast('Items Required', 'Please include at least one bed or service charge item.', 'error');
      return;
    }

    const assignedDoc = doctors.find(
      (d) => d.id === (selectedAdmForInvoice.dischargeDoctorId || selectedAdmForInvoice.doctorId)
    );

    let settledAmount = 0;
    let invStatus: InvoiceStatus = 'Pending';
    let settlementMethod: PaymentMethod | undefined = undefined;
    let txnRef: string | undefined = undefined;
    let collector: string | undefined = undefined;
    let desk: string | undefined = undefined;

    if (collectPaymentNow) {
      settledAmount = payAmount > 0 ? Number(payAmount) : calculatedTotal;
      settlementMethod = payMethod;
      txnRef = payTxnRef.trim() || `REC-${Date.now().toString().slice(-6)}`;
      collector = payCollector || user?.name || 'Marcus Sterling (Accountant)';
      desk = payCashierDesk || 'IPD Cashier Desk';

      if (settledAmount >= calculatedTotal && calculatedTotal > 0) {
        invStatus = 'Paid';
      } else if (settledAmount > 0) {
        invStatus = 'Partially Paid';
      }
    } else if (paymentType === 'Insurance / TPA' && claimApprovalNumber) {
      settlementMethod = 'Insurance';
      txnRef = `AUTH-${claimApprovalNumber.trim()}`;
    }

    const invId = `INV-IPD-${Date.now().toString().slice(-6)}`;

    const newInv: Invoice = {
      id: invId,
      hospitalId: hospId,
      patientId: selectedAdmForInvoice.patientId,
      patientName: selectedAdmForInvoice.patientName,
      patientPhone: '9876543210',
      issueDate: invoiceIssueDate,
      dueDate: invoiceDueDate,
      items: invoiceItems,
      subtotal: calculatedSubtotal,
      taxRate: effectiveTaxRate,
      taxAmount: calculatedTax,
      discount: discountAmount,
      discountReason: discountAmount > 0 ? discountReason : undefined,
      totalAmount: calculatedTotal,
      amountPaid: settledAmount,
      status: invStatus,
      paymentMethod: settlementMethod,
      transactionRef: txnRef,
      notes: invoiceNotes,
      billingCategory: 'Hospital Service',
      encounterType: 'IPD',
      doctorId: assignedDoc?.id || selectedAdmForInvoice.dischargeDoctorId || selectedAdmForInvoice.doctorId,
      doctorName: assignedDoc?.name || selectedAdmForInvoice.dischargeDoctorName || selectedAdmForInvoice.doctorName,
      departmentName: selectedAdmForInvoice.wardType,
      paymentType,
      insuranceProvider: paymentType === 'Insurance / TPA' ? insuranceProvider : undefined,
      policyNumber: paymentType === 'Insurance / TPA' ? policyNumber : undefined,
      claimApprovalNumber: paymentType === 'Insurance / TPA' ? claimApprovalNumber : undefined,
      collectedBy: collector,
      cashierDesk: desk,
    };

    // Save invoice and link admission
    MockStorage.saveInvoice(newInv);
    MockStorage.linkAdmissionInvoice(
      selectedAdmForInvoice.id,
      newInv.id,
      newInv.totalAmount,
      settledAmount
    );

    showToast(
      'Inpatient Invoice Generated',
      `Invoice ${newInv.id} created for ${selectedAdmForInvoice.patientName} (₹${newInv.totalAmount}). Status: ${invStatus}.`
    );

    setIsInvoiceModalOpen(false);
    setSelectedAdmForInvoice(null);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Doctor-Discharged Inpatients Awaiting"
        subtitle="Dedicated accountant workspace to review specialist discharge orders, verify bed occupancy duration (Discharge Date − Admission Date), adjust initial deposits, and manually generate invoices."
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Billing & Invoices', href: '/hospital/billing' },
          { label: 'Discharge Invoicing Queue' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const listToExport = filteredAdmissions.map((adm) => {
                  const stay = calculateStayDays(adm.admissionDate, adm.dischargeDate || new Date().toISOString().split('T')[0]);
                  return {
                    Admission_ID: adm.id,
                    Patient_Name: adm.patientName,
                    UHID: adm.patientId,
                    Ward: adm.wardType,
                    Bed: adm.bedNumber,
                    Admission_Date: adm.admissionDate,
                    Discharge_Date: adm.dischargeDate || '',
                    Stay_Days: stay,
                    Doctor: adm.dischargeDoctorName || adm.doctorName,
                    Initial_Deposit: adm.initialDeposit || 0,
                    Invoice_Status: adm.invoiceId ? 'Invoiced' : 'Pending Invoice',
                    Invoice_ID: adm.invoiceId || 'N/A',
                  };
                });
                MockStorage.exportToCSV('Discharge_Invoicing_Queue', listToExport);
                showToast('Export Successful', 'Discharge invoicing queue exported as CSV.');
              }}
              leftIcon={<Download className="w-4 h-4 text-slate-500" />}
              className="font-medium"
            >
              Export CSV
            </Button>
            <Link to="/hospital/billing">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Receipt className="w-4 h-4 text-indigo-600" />}
                className="font-medium"
              >
                All Hospital Invoices
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Invoice</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingDischarges.length}</p>
            <p className="text-[10px] text-amber-700/80 mt-0.5 font-medium">Discharge signed by doctor</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Bed Revenue</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalPendingUnbilled.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Across {pendingDischarges.length} inpatient stays</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoiced & Settled</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{settledDischarges.length}</p>
            <p className="text-[10px] text-emerald-700/80 mt-0.5 font-medium">Cleared for bed release</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Discharges</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{allDischargeAdmissions.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Lifetime medical orders</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Roster Container */}
      <Card>
        {/* Navigation Tabs & Search Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting Manual Invoice</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pendingDischarges.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settled')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settled'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Invoiced & Settled</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'settled' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {settledDischarges.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>All ({allDischargeAdmissions.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, bed number, doctor, ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Discharge List */}
        {filteredAdmissions.length === 0 ? (
          <div className="py-14 text-center">
            <EmptyState
              icon={<FileCheck className="w-8 h-8 text-amber-500" />}
              title={
                activeTab === 'pending'
                  ? 'No Discharges Awaiting Invoicing'
                  : activeTab === 'settled'
                  ? 'No Settled Discharge Invoices Found'
                  : 'No Discharge Records Found'
              }
              description={
                activeTab === 'pending'
                  ? 'All doctor-discharged inpatients have been invoiced and settled.'
                  : 'Try adjusting your search criteria.'
              }
            />
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdmissions.map((adm) => {
              const {
                dailyRate,
                dischargeD,
                stayDays,
                totalBedCharge,
                assignedDoc,
                docFee,
                totalDocFee,
                patientLabOrders,
                totalLabCharges,
                deposit,
                isGstEnabled,
                bedGSTRate,
                docGSTRate,
                labGSTRate,
                totalTax,
                netDue,
              } = getInpatientAccruedCharges(adm);
              const isSettled = adm.billingStatus === 'Paid';

              return (
                <div
                  key={adm.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isSettled
                      ? 'bg-white border-slate-200/90 shadow-2xs'
                      : 'bg-amber-50/50 border-amber-300/80 shadow-xs ring-1 ring-amber-200/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{adm.patientName}</h4>
                        <p className="text-[11px] text-slate-500">ID: {adm.patientId}</p>
                      </div>
                      <Badge variant={isSettled ? 'success' : 'amber'} size="sm">
                        {isSettled ? 'Invoice Settled' : 'Awaiting Invoicing'}
                      </Badge>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Bed & Ward:</span>
                        <strong className="font-mono text-indigo-700 font-bold">
                          {adm.bedNumber} ({adm.wardType})
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Attending Specialist:</span>
                        <strong className="text-slate-800 text-[11px]">
                          {adm.dischargeDoctorName || adm.doctorName || assignedDoc?.name}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Admission Date:</span>
                        <strong className="font-mono text-slate-900">{adm.admissionDate}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Discharge Date:</span>
                        <strong className="font-mono text-indigo-700">{dischargeD}</strong>
                      </div>
                    </div>

                    {/* Formula Breakdown Card - Complete Itemized Accrual */}
                    <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-xs space-y-1.5">
                      <div className="flex justify-between text-indigo-950 font-semibold text-[11px]">
                        <span>Stay Duration ({dischargeD} − {adm.admissionDate}):</span>
                        <span className="font-mono text-indigo-700 font-bold">{formatStayDuration(stayDays)}</span>
                      </div>

                      <div className="pt-1 border-t border-indigo-200/70 space-y-1 text-[11px]">
                        {/* 1. Bed Charges */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">🛏️ Bed Stay ({stayDays}d × ₹{dailyRate}):</span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{totalBedCharge.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* 2. Doctor Rounds */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700 truncate pr-1">🩺 Specialist Rounds ({stayDays}d × ₹{docFee}):</span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{totalDocFee.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* 3. Lab Tests (Only if actually taken) */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">🧪 Lab Tests ({patientLabOrders.length} taken):</span>
                          <span className="font-mono font-bold text-slate-900">
                            {patientLabOrders.length > 0 ? `₹${totalLabCharges.toLocaleString('en-IN')}` : '₹0 (None)'}
                          </span>
                        </div>

                        {/* Departmental GST (Hospital Admin Rates) */}
                        {isGstEnabled && (
                          <div className="flex justify-between items-center text-indigo-900 pt-0.5 font-medium">
                            <span className="truncate pr-1 text-[10px]">
                              🏛️ Departmental GST ({bedGSTRate}% Bed, {docGSTRate}% Doc, {labGSTRate}% Lab):
                            </span>
                            <span className="font-mono font-bold">
                              +₹{totalTax.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Advance Deposit */}
                        {deposit > 0 && (
                          <div className="flex justify-between text-emerald-700 font-medium">
                            <span>Advance Deposit Paid:</span>
                            <span className="font-mono font-bold">−₹{deposit.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-indigo-200 flex justify-between items-center font-bold text-indigo-950">
                        <span>Net Inpatient Balance Due:</span>
                        <span className="font-mono text-indigo-900 text-sm font-extrabold">
                          ₹{netDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {adm.invoiceId && (
                      <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono flex items-center justify-between">
                        <span>Invoice Linked:</span>
                        <strong>{adm.invoiceId}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setSelectedAdmForSummary(adm);
                        setIsSummaryModalOpen(true);
                      }}
                      leftIcon={<FileText className="w-3.5 h-3.5 text-slate-500" />}
                      className="text-slate-700 font-medium text-xs flex-1 justify-center"
                    >
                      Summary
                    </Button>

                    {!isSettled ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="xs"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenCreateInvoice(adm)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex-1 justify-center shadow-xs"
                      >
                        Create Invoice (₹{netDue.toLocaleString('en-IN')})
                      </Button>
                    ) : (
                      <Link to="/hospital/billing" className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          leftIcon={<ExternalLink className="w-3.5 h-3.5 text-emerald-600" />}
                          className="w-full text-emerald-700 border-emerald-300 font-semibold text-xs justify-center"
                        >
                          View Bill
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* MODAL 1: Create Manual Invoice for Discharged Patient */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Manual Inpatient Discharge Invoicing"
        subtitle={`Patient: ${selectedAdmForInvoice?.patientName} • Bed: ${selectedAdmForInvoice?.bedNumber} (${selectedAdmForInvoice?.wardType})`}
        maxWidth="2xl"
      >
        {selectedAdmForInvoice && (
          <form onSubmit={handleConfirmSaveInvoice} className="space-y-4 text-xs">
            {/* Calculation Card */}
            {(() => {
              const {
                dailyRate,
                dischargeD,
                stayDays,
                totalBedCharge,
                assignedDoc,
                docFee,
                totalDocFee,
                patientLabOrders,
                totalLabCharges,
                deposit,
                subtotal,
                netDue,
              } = getInpatientAccruedCharges(selectedAdmForInvoice);

              return (
                <div className="p-3 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-indigo-600" />
                      Inpatient Accrued Charges Calculation
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-600">
                        Total Accrued: ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                        Net Balance Due: ₹{netDue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <p className="text-slate-500 text-[10px]">🛏️ Bed Stay ({stayDays}d × ₹{dailyRate})</p>
                      <p className="font-bold font-mono text-slate-900">₹{totalBedCharge.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <p className="text-slate-500 text-[10px]">🩺 Specialist Rounds ({stayDays}d × ₹{docFee})</p>
                      <p className="font-bold font-mono text-indigo-700">₹{totalDocFee.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <p className="text-slate-500 text-[10px]">🧪 Lab Tests ({patientLabOrders.length} taken)</p>
                      <p className="font-bold font-mono text-emerald-700">₹{totalLabCharges.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <p className="text-slate-500 text-[10px]">Advance Deposit Paid</p>
                      <p className="font-bold font-mono text-amber-700">{deposit > 0 ? `−₹${deposit.toLocaleString('en-IN')}` : '₹0'}</p>
                    </div>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-indigo-100 text-[11px] text-slate-700 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Stay Period: {selectedAdmForInvoice.admissionDate} to {dischargeD} ({formatStayDuration(stayDays)})</span>
                      <span>Doctor: {assignedDoc?.name || selectedAdmForInvoice.dischargeDoctorName || selectedAdmForInvoice.doctorName}</span>
                    </div>
                    {patientLabOrders.length > 0 ? (
                      <p className="text-[10px] text-slate-600">
                        <strong className="text-indigo-900">Patient Lab Orders ({patientLabOrders.length}):</strong>{' '}
                        {patientLabOrders.map((o) => o.testName).join(', ')}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No laboratory tests were ordered during this stay (₹0 lab charges).</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Dates & Doctor info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Invoice Issue Date *"
                type="date"
                value={invoiceIssueDate}
                onChange={(e) => setInvoiceIssueDate(e.target.value)}
                required
              />
              <Input
                label="Payment Due Date *"
                type="date"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
                required
              />
              <Input
                label="Attending Specialist"
                value={selectedAdmForInvoice.dischargeDoctorName || selectedAdmForInvoice.doctorName}
                disabled
                className="bg-slate-100 text-slate-700"
              />
            </div>

            {/* Payment Classification */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                Payment Classification
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Self Pay', 'Insurance / TPA', 'Corporate'] as PaymentType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setPaymentType(type)}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentType === type
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {paymentType !== 'Self Pay' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  <Input
                    label="Insurance / TPA Provider *"
                    placeholder="e.g. Star Health, BlueCross"
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    required
                  />
                  <Input
                    label="Policy / Member ID *"
                    placeholder="e.g. POL-992104"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    required
                  />
                  <Input
                    label="Approval Reference #"
                    placeholder="e.g. AUTH-48210"
                    value={claimApprovalNumber}
                    onChange={(e) => setClaimApprovalNumber(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Itemized Charges Table */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Itemized Inpatient Charges
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddCustomItem}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  + Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {invoiceItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        placeholder="Service description"
                        className="w-full text-xs font-medium border border-slate-200 rounded px-2 py-1"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 text-center"
                        title="Quantity"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 text-right"
                        title="Unit Price"
                        required
                      />
                    </div>
                    <div className="col-span-1 text-right font-bold font-mono text-slate-900 text-xs">
                      ₹{item.total}
                    </div>
                    <div className="col-span-1 text-right">
                      {invoiceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Deductions & Financial Summary */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Departmental GST Tax Summary adhering to Hospital Admin rates */}
                <div className="pt-1.5 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-semibold flex items-center gap-1">
                      Departmental GST {taxResult.isGstEnabled ? `(${taxResult.effectiveTaxRate}% effective)` : '(Disabled in Settings)'}:
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      +₹{calculatedTax.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {taxResult.isGstEnabled && taxResult.departmentalBreakdown.length > 0 && (
                    <div className="p-2 rounded bg-slate-50 border border-slate-200/80 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider">
                        <span>Department Category</span>
                        <span>Rate Preset</span>
                        <span>Tax Amount</span>
                      </div>
                      {taxResult.departmentalBreakdown.map((b) => (
                        <div key={b.department} className="flex items-center justify-between text-slate-700">
                          <span>{b.department} (₹{b.taxableAmount.toLocaleString('en-IN')})</span>
                          <span className="font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                            {b.gstRate}%
                          </span>
                          <span className="font-mono font-bold">₹{b.taxAmount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-slate-200 text-slate-500 flex justify-between">
                        <span>Tax Scheme: {taxResult.gstType === 'CGST_SGST' ? 'Intra-State (CGST 50% + SGST 50%)' : 'Inter-State (IGST 100%)'}</span>
                        <span className="font-mono font-semibold">
                          {taxResult.gstType === 'CGST_SGST'
                            ? `CGST: ₹${taxResult.cgstAmount} | SGST: ₹${taxResult.sgstAmount}`
                            : `IGST: ₹${taxResult.igstAmount}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] text-slate-500">Advance Deposit / Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Discount / Deposit Reason</label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="e.g. Admission Advance Deposit"
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Amount Due:</span>
                  <span className="font-mono text-emerald-700 text-base font-extrabold">
                    ₹{calculatedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Immediate Cashier Collection Option */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectPaymentNow}
                  onChange={(e) => setCollectPaymentNow(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-900 text-xs">
                  Collect Payment Immediately at Cashier Desk
                </span>
              </label>

              {collectPaymentNow && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] text-slate-500">Amount Paid (₹) *</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded px-2 py-1 text-emerald-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Payment Method *</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                      <option value="Insurance">Insurance Settlement</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Receipt / Txn Ref #</label>
                    <input
                      type="text"
                      value={payTxnRef}
                      onChange={(e) => setPayTxnRef(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Cashier Desk</label>
                    <input
                      type="text"
                      value={payCashierDesk}
                      onChange={(e) => setPayCashierDesk(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Settlement Remarks & Invoice Notes
              </label>
              <textarea
                rows={2}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional billing or settlement remarks..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Receipt className="w-4 h-4" />}>
                Confirm & Create Invoice (₹{calculatedTotal.toLocaleString('en-IN')})
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: View Clinical Discharge Summary */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Attending Specialist Discharge Summary & Audit"
        subtitle={`Patient: ${selectedAdmForSummary?.patientName} • Bed: ${selectedAdmForSummary?.bedNumber}`}
        maxWidth="lg"
      >
        {selectedAdmForSummary && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
              <div>
                <p className="text-slate-500 text-[10px]">Attending Specialist Doctor</p>
                <p className="font-bold text-slate-900">
                  {selectedAdmForSummary.dischargeDoctorName || selectedAdmForSummary.doctorName}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">Medical Discharge Date</p>
                <p className="font-bold text-indigo-700 font-mono">
                  {selectedAdmForSummary.dischargeDate || 'Today'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-800">Primary Admission Reason / Diagnosis:</span>
              <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                {selectedAdmForSummary.diagnosis || selectedAdmForSummary.reason || 'Medical Observation'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-800">Specialist Clinical Discharge Summary:</span>
              <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 whitespace-pre-line">
                {selectedAdmForSummary.dischargeSummary ||
                  'Patient showed steady clinical improvement. Vital parameters stabilized.'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-800">Home Care & Follow-Up Advice:</span>
              <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 whitespace-pre-line">
                {selectedAdmForSummary.dischargeAdvice || 'Adequate hydration, follow-up after 1 week.'}
              </p>
            </div>

            {selectedAdmForSummary.dischargePrescriptions && (
              <div className="space-y-1">
                <span className="font-bold text-slate-800">Take-Home Medication Orders:</span>
                <p className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono whitespace-pre-line">
                  {selectedAdmForSummary.dischargePrescriptions}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSummaryModalOpen(false)}>
                Close Summary
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
