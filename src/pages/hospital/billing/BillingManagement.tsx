import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
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
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../../../types';
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

export const BillingManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [invoices, setInvoices] = useState<Invoice[]>(() => MockStorage.getInvoices(hospId));
  const patients = MockStorage.getPatients(hospId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Controlled by Super Admin in Platform Settings
  const isAddonEnabled = MockStorage.getPlatformSettings().enableBillingAddonModule !== false;

  // Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Credit Card');

  // Create Invoice Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 'item-1', description: 'Specialist OPD Consultation', category: 'Consultation', quantity: 1, unitPrice: 150, total: 150 },
  ]);
  const [taxRate, setTaxRate] = useState(5);
  const [discount, setDiscount] = useState(0);

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

  // Line Items Helper
  const addItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, description: 'Pharmacy / Diagnostic Item', category: 'Pharmacy', quantity: 1, unitPrice: 50, total: 50 },
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
  const calculatedTotal = calculatedSubtotal + calculatedTax - discount;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === selectedPatientId);
    if (!pat) {
      showToast('Error', 'Please select a valid patient', 'error');
      return;
    }

    const newInv: Invoice = {
      id: `INV-2026-${100 + invoices.length + 1}`,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      patientPhone: pat.phone,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items,
      subtotal: calculatedSubtotal,
      taxRate,
      taxAmount: calculatedTax,
      discount,
      totalAmount: calculatedTotal,
      amountPaid: 0,
      status: 'Pending',
      notes: 'Due in 7 days. Thank you for choosing PulseCore Health.',
    };

    MockStorage.saveInvoice(newInv);
    showToast('Invoice Generated', `${newInv.id} issued for ${pat.name} ($${newInv.totalAmount}).`);
    setIsCreateModalOpen(false);
    refreshData();
  };

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.totalAmount - inv.amountPaid);
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoice && payAmount > 0) {
      MockStorage.recordPayment(selectedInvoice.id, payAmount, payMethod);
      showToast('Payment Recorded', `Received $${payAmount} via ${payMethod}.`);
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
              onClick={() => setIsCreateModalOpen(true)}
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
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalBilled.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Receivables</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">${totalPending.toLocaleString()}</p>
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
                    <p className="font-bold text-slate-900 leading-tight">{inv.patientName}</p>
                    <p className="text-[11px] text-indigo-600 font-mono mt-0.5">{inv.id}</p>
                  </td>

                  <td className="px-4 py-3.5 text-slate-600">
                    <p>{inv.issueDate}</p>
                    <p className="text-[10px] text-slate-400">Due: {inv.dueDate}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 text-xs">${inv.totalAmount.toLocaleString()}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-bold text-emerald-700 text-xs">${inv.amountPaid.toLocaleString()}</span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-600">
                    {inv.paymentMethod ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                        <CreditCard className="w-3 h-3 text-slate-400" /> {inv.paymentMethod}
                      </span>
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

                  <td className="px-5 py-3.5 text-right space-x-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenPrint(inv)}
                      leftIcon={<Printer className="w-3.5 h-3.5" />}
                    >
                      Print Receipt
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

      {/* Create Patient Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Patient Billing Invoice"
        subtitle="Itemized clinical charges with automated tax & deduction calculations"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Select
            label="Select Patient *"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            required
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — {p.phone}
              </option>
            ))}
          </Select>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Itemized Clinical Services</label>
              <Button type="button" variant="outline" size="xs" onClick={addItem} leftIcon={<Plus className="w-3 h-3" />}>
                Add Service Line
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      value={it.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div className="col-span-2 text-right font-bold text-xs text-slate-800">
                    ${it.total}
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

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Input
              label="Tax Rate (%)"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
            <Input
              label="Concession / Discount ($)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex justify-between items-center text-xs">
            <div>
              <span>Subtotal: ${calculatedSubtotal} • Tax: ${calculatedTax.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Net Payable</span>
              <span className="text-lg font-black text-teal-400">${calculatedTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Invoice
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
              <span className="font-bold text-slate-900">${selectedInvoice?.totalAmount}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Outstanding Balance:</span>
              <span>${selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.amountPaid : 0}</span>
            </div>
          </div>

          <Input
            label="Payment Amount to Collect ($) *"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            required
          />

          <Select
            label="Payment Method"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
          >
            <option value="Credit Card">Credit Card (POS Terminal)</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Cash">Cash Counter</option>
            <option value="Insurance">Health Insurance TPA Claim</option>
            <option value="Bank Transfer">Bank Wire Transfer</option>
            <option value="UPI">UPI / Digital QR</option>
          </Select>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-900 text-xs">Billed Patient:</p>
                <p className="font-semibold text-slate-800">{selectedInvoice.patientName}</p>
                <p className="text-slate-500">ID: {selectedInvoice.patientId}</p>
                <p className="text-slate-500">Phone: {selectedInvoice.patientPhone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900 text-xs">Payment Settlement:</p>
                <p className="text-slate-700">Method: {selectedInvoice.paymentMethod || 'Pending'}</p>
                <p className="font-mono text-[10px] text-slate-400">Ref: {selectedInvoice.transactionRef || 'N/A'}</p>
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
                    <td className="py-2 px-3 text-right">${it.unitPrice}</td>
                    <td className="py-2 px-3 text-right font-semibold">${it.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>${selectedInvoice.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax ({selectedInvoice.taxRate}%):</span>
                  <span>${selectedInvoice.taxAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-1 text-slate-900">
                  <span>Grand Total:</span>
                  <span>${selectedInvoice.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1">
                  <span>Amount Paid:</span>
                  <span>${selectedInvoice.amountPaid}</span>
                </div>
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
