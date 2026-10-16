import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Stethoscope,
  Download,
  Edit,
  Activity,
  Layers,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { LabOrder, LabTestCatalog, LabTestStatus } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Tabs } from '../../../components/ui/Tabs';

export const LaboratoryManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => MockStorage.getLabOrders(hospId));
  const [labCatalog, setLabCatalog] = useState<LabTestCatalog[]>(() => MockStorage.getLabCatalog(hospId));
  const patients = MockStorage.getPatients(hospId);
  const doctors = MockStorage.getDoctors(hospId);

  const [activeTab, setActiveTab] = useState('orders');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  // Result entry state
  const [resultValue, setResultValue] = useState('');
  const [resultStatus, setResultStatus] = useState<'Normal' | 'Abnormal' | 'Critical'>('Normal');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // New Order State
  const [orderForm, setOrderForm] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    testId: labCatalog[0]?.id || '',
  });

  const refreshData = () => {
    setLabOrders(MockStorage.getLabOrders(hospId));
    setLabCatalog(MockStorage.getLabCatalog(hospId));
  };

  const filteredOrders = labOrders.filter(
    (o) =>
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenOrder = () => {
    setOrderForm({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      testId: labCatalog[0]?.id || '',
    });
    setIsOrderModalOpen(true);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === orderForm.patientId);
    const doc = doctors.find((d) => d.id === orderForm.doctorId);
    const test = labCatalog.find((t) => t.id === orderForm.testId);

    if (!pat || !doc || !test) {
      showToast('Validation Error', 'Please select patient, doctor, and lab test.', 'error');
      return;
    }

    const newOrder: LabOrder = {
      id: `LAB-80${10 + labOrders.length}`,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      patientAge: pat.age,
      patientGender: pat.gender,
      doctorId: doc.id,
      doctorName: doc.name,
      testId: test.id,
      testName: test.testName,
      category: test.category,
      orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'In Progress',
      sampleType: test.sampleType,
      referenceRange: test.normalRange,
      fee: test.price,
    };

    MockStorage.saveLabOrder(newOrder);
    showToast('Lab Diagnostic Ordered', `${test.testName} requested for ${pat.name}.`);
    setIsOrderModalOpen(false);
    refreshData();
  };

  const handleOpenEnterResult = (order: LabOrder) => {
    setSelectedOrder(order);
    setResultValue(order.resultValue || '');
    setResultStatus(order.resultStatus || 'Normal');
    setTechnicianNotes(order.labTechnicianNotes || '');
    setIsResultModalOpen(true);
  };

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      const updated: LabOrder = {
        ...selectedOrder,
        resultValue,
        resultStatus,
        labTechnicianNotes: technicianNotes,
        status: 'Completed',
        completedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      MockStorage.saveLabOrder(updated);
      showToast('Diagnostic Results Recorded', `Report released for ${selectedOrder.patientName}.`);
      setIsResultModalOpen(false);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Pathology & Laboratory Diagnostics"
        subtitle="Manage diagnostic test catalog, specimen barcode tracking, automated result entry, and clinical reports."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Laboratory' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Lab_Orders_Report', filteredOrders)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Report
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenOrder} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Order Lab Diagnostic
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Tabs
            tabs={[
              { id: 'orders', label: 'Diagnostic Orders & Requests', count: labOrders.length },
              { id: 'catalog', label: 'Laboratory Test Catalog', count: labCatalog.length },
            ]}
            activeTab={activeTab}
            onChange={(t) => setActiveTab(t)}
            variant="pills"
          />

          {activeTab === 'orders' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient, test name, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Order ID & Test</th>
                  <th className="px-4 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Ordering Doctor</th>
                  <th className="px-4 py-3.5">Specimen Type</th>
                  <th className="px-4 py-3.5">Diagnostic Result</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 leading-tight">{order.testName}</p>
                      <p className="text-[11px] text-indigo-600 font-mono mt-0.5">{order.id} • {order.category}</p>
                    </td>

                    <td className="px-4 py-3.5 text-slate-800">
                      <p className="font-semibold">{order.patientName}</p>
                      <p className="text-[10px] text-slate-400">{order.patientAge}y • {order.patientGender}</p>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      <p>{order.doctorName}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        🧪 {order.sampleType}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {order.resultValue ? (
                        <div>
                          <span className={`font-bold text-xs ${order.resultStatus === 'Abnormal' ? 'text-rose-600' : 'text-slate-900'}`}>
                            {order.resultValue}
                          </span>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">Ref: {order.referenceRange}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Awaiting Lab Processing</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {order.status === 'Completed' && <Badge variant="success" dot>Completed</Badge>}
                      {order.status === 'In Progress' && <Badge variant="warning" dot>Processing</Badge>}
                      {order.status === 'Ordered' && <Badge variant="neutral" dot>Ordered</Badge>}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant={order.status === 'Completed' ? 'outline' : 'primary'}
                        size="xs"
                        onClick={() => handleOpenEnterResult(order)}
                      >
                        {order.status === 'Completed' ? 'View Report' : 'Enter Result'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Catalog Table */}
        {activeTab === 'catalog' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Test Title & Code</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Sample Specimen</th>
                  <th className="px-4 py-3.5">Turnaround Time</th>
                  <th className="px-4 py-3.5">Normal Reference Range</th>
                  <th className="px-5 py-3.5 text-right">Fee Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labCatalog.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{t.testName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{t.code}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{t.sampleType}</td>
                    <td className="px-4 py-3.5 text-slate-600">{t.turnaroundHours} Hours</td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[220px] truncate">{t.normalRange}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">${t.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Test Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Order Diagnostic Pathology Test"
        subtitle="Link clinical test request to patient chart"
        maxWidth="md"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <Select
            label="Select Patient *"
            value={orderForm.patientId}
            onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
            required
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — {p.gender}, {p.age}y
              </option>
            ))}
          </Select>

          <Select
            label="Ordering Physician *"
            value={orderForm.doctorId}
            onChange={(e) => setOrderForm({ ...orderForm, doctorId: e.target.value })}
            required
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialization})
              </option>
            ))}
          </Select>

          <Select
            label="Diagnostic Lab Test *"
            value={orderForm.testId}
            onChange={(e) => setOrderForm({ ...orderForm, testId: e.target.value })}
            required
          >
            {labCatalog.map((t) => (
              <option key={t.id} value={t.id}>
                {t.testName} (${t.price} — {t.sampleType})
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Lab Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enter Result Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Diagnostic Pathology Report"
        subtitle={`Result Record for ${selectedOrder?.id} — ${selectedOrder?.testName}`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <form onSubmit={handleSaveResult} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{selectedOrder.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Normal Reference Range:</span>
                <span className="font-mono text-slate-700">{selectedOrder.referenceRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sample Specimen:</span>
                <span className="font-semibold text-slate-800">{selectedOrder.sampleType}</span>
              </div>
            </div>

            <Input
              label="Quantitative / Qualitative Result Value *"
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="e.g. 0.012 ng/mL or Hb: 13.5 g/dL"
              required
            />

            <Select
              label="Diagnostic Finding Evaluation"
              value={resultStatus}
              onChange={(e) => setResultStatus(e.target.value as any)}
            >
              <option value="Normal">Normal Finding (Within Reference Interval)</option>
              <option value="Abnormal">Abnormal Finding</option>
              <option value="Critical">Critical Alert (Notify Attending Doctor)</option>
            </Select>

            <Textarea
              label="Lab Technologist Observations / Notes"
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Equipment telemetry, calibration notes"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsResultModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Release Report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
