import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MockStorage } from '../../services/mockStorage';
import { Invoice } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  CreditCard,
  Search,
  DollarSign,
  Calendar,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building,
  Receipt,
  Download
} from 'lucide-react';

export const PatientBilling: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Partially Paid'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'UPI' | 'Insurance'>('Credit Card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('•••');
  const [isProcessing, setIsProcessing] = useState(false);

  const patientId = user?.patientId || 'PAT-1001';

  const loadData = () => {
    const list = MockStorage.getInvoices(undefined, patientId);
    setInvoices(list);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [patientId]);

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'Paid')
    .reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items.some((item) => item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPay = (invoice: Invoice) => {
    setPayInvoice(invoice);
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = () => {
    if (!payInvoice) return;
    setIsProcessing(true);

    setTimeout(() => {
      const remaining = payInvoice.totalAmount - payInvoice.amountPaid;
      MockStorage.recordPayment(payInvoice.id, remaining, paymentMethod);
      setIsProcessing(false);
      setIsPayModalOpen(false);
      showToast('Payment Successful', `Successfully processed payment of $${remaining.toLocaleString()} for invoice ${payInvoice.id}.`, 'success');
      setPayInvoice(null);
    }, 800);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="success">Paid in Full</Badge>;
      case 'Partially Paid':
        return <Badge variant="warning">Partially Paid</Badge>;
      case 'Pending':
        return <Badge variant="error">Payment Due</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review hospital invoices, consultation fees, treatment charges, insurance adjustments, and settle balances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              MockStorage.exportToCSV(`Patient_Invoices_${patientId}`, filteredInvoices);
              showToast('Export Successful', 'Billing ledger exported as CSV.');
            }}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Invoices CSV
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoiced"
          value={`$${totalBilled.toLocaleString()}`}
          icon={<Receipt className="w-5 h-5" />}
          accentColor="indigo"
          subtext="All recorded treatments"
        />
        <StatCard
          title="Total Paid"
          value={`$${totalPaid.toLocaleString()}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
          subtext="Settled transactions"
        />
        <StatCard
          title="Outstanding Balance"
          value={`$${totalOutstanding.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="amber"
          subtext="Pending settlement"
        />
      </div>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search invoice number, procedure..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {(['All', 'Pending', 'Partially Paid', 'Paid'] as const).map((st) => (
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

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<CreditCard className="w-7 h-7" />}
            title="No Invoices Found"
            description="You do not have any invoices matching your selected filter criteria."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((inv) => {
            const balanceDue = inv.totalAmount - inv.amountPaid;
            return (
              <Card
                key={inv.id}
                className="p-5 border-slate-200 hover:border-brand-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Invoice header & line summary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{inv.id}</h3>
                          {getStatusBadge(inv.status)}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Issue Date: {inv.issueDate} • Due Date: <span className="text-slate-700 font-semibold">{inv.dueDate}</span>
                        </p>
                      </div>
                    </div>

                    {/* Items chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {inv.items.map((item) => (
                        <span
                          key={item.id}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                        >
                          {item.description} ({item.quantity}x)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Amounts & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-between lg:justify-end">
                    <div className="text-left sm:text-right space-y-0.5">
                      <p className="text-xs text-slate-400 font-semibold uppercase">Total Amount</p>
                      <p className="text-lg font-black text-slate-900">${inv.totalAmount.toLocaleString()}</p>
                      {balanceDue > 0 ? (
                        <p className="text-xs font-semibold text-rose-600">Balance: ${balanceDue.toLocaleString()}</p>
                      ) : (
                        <p className="text-xs font-semibold text-emerald-600">Paid in full</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileText className="w-4 h-4" />}
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        Receipt
                      </Button>
                      {balanceDue > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<CreditCard className="w-4 h-4" />}
                          onClick={() => handleOpenPay(inv)}
                        >
                          Pay Now (${balanceDue})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invoice Detail / Receipt Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Hospital Invoice / Statement — ${selectedInvoice.id}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Apex Medical Center</span>
                </div>
                <h3 className="text-xl font-bold mt-1">Invoice #{selectedInvoice.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Issued: {selectedInvoice.issueDate} • Due: {selectedInvoice.dueDate}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Information</p>
                <p className="text-slate-900 font-bold text-sm mt-0.5">{selectedInvoice.patientName}</p>
                <p className="text-slate-500">ID: {selectedInvoice.patientId} • Phone: {selectedInvoice.patientPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-semibold uppercase">Payment Details</p>
                <p className="text-slate-900 font-semibold mt-0.5">Method: {selectedInvoice.paymentMethod || 'Online Gateway'}</p>
                {selectedInvoice.transactionRef && (
                  <p className="text-slate-500 font-mono text-[11px]">Ref: {selectedInvoice.transactionRef}</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Itemized Charges</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Service / Procedure</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.description}
                          <span className="block text-[10px] text-slate-400">{item.category}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">${selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Hospital Surcharges ({selectedInvoice.taxRate}%):</span>
                <span>+${selectedInvoice.taxAmount.toFixed(2)}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Insurance Co-Pay / Hospital Discount:</span>
                  <span>-${selectedInvoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span>${selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-teal-700">
                <span>Amount Paid:</span>
                <span>-${selectedInvoice.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-rose-600 pt-1 border-t border-slate-200">
                <span>Remaining Balance Due:</span>
                <span>${(selectedInvoice.totalAmount - selectedInvoice.amountPaid).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                Print Receipt
              </Button>
              <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Checkout / Pay Online Modal */}
      {payInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Secure Hospital Bill Settlement"
          maxWidth="md"
        >
          <div className="space-y-5">
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-700 font-semibold">Payment for Invoice #{payInvoice.id}</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  ${(payInvoice.totalAmount - payInvoice.amountPaid).toFixed(2)}
                </p>
              </div>
              <ShieldCheck className="w-8 h-8 text-teal-600" />
            </div>

            {/* Payment method selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Select Payment Gateway</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Credit Card', 'Debit Card', 'UPI', 'Insurance'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Card form */}
            {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Card Number</label>
                  <Input value={cardNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date</label>
                    <Input value={cardExpiry} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardExpiry(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">CVV / CVC</label>
                    <Input value={cardCvc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardCvc(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleProcessPayment}
                isLoading={isProcessing}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Pay ${(payInvoice.totalAmount - payInvoice.amountPaid).toFixed(2)}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientBilling;
