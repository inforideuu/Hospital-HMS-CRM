import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FlaskConical,
  Edit2,
  Trash2,
  Power,
  Eye,
  FileText,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { LabOrder, LabTestCatalog } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const LaboratoryManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  // Master Data
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => MockStorage.getLabOrders(hospId));
  const [labCatalog, setLabCatalog] = useState<LabTestCatalog[]>(() => MockStorage.getLabCatalog(hospId));
  const patients = MockStorage.getPatients(hospId);
  const doctors = MockStorage.getDoctors(hospId);

  // Filters for Orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals & Active Selections
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [editingTest, setEditingTest] = useState<LabTestCatalog | null>(null);
  const [testToDeleteId, setTestToDeleteId] = useState<string | null>(null);

  // Order Form State
  const activeCatalogTests = labCatalog.filter((t) => t.status !== 'inactive');
  const initialTest = activeCatalogTests[0];

  const [orderForm, setOrderForm] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    testId: initialTest?.id || '',
    specimenType: initialTest?.sampleType || '',
    priority: 'Routine' as 'Routine' | 'Urgent',
    notes: '',
  });

  // Test Catalog Form State
  const [catalogForm, setCatalogForm] = useState({
    testName: '',
    code: '',
    category: 'Hematology',
    sampleType: 'Blood',
    turnaroundHours: 24,
    normalRange: '',
    price: 0,
    status: 'active' as 'active' | 'inactive',
  });

  // Result Form State
  const [resultValue, setResultValue] = useState('');
  const [resultStatus, setResultStatus] = useState<'Normal' | 'Abnormal' | 'Critical'>('Normal');
  const [technicianNotes, setTechnicianNotes] = useState('');

  const refreshData = () => {
    setLabOrders(MockStorage.getLabOrders(hospId));
    setLabCatalog(MockStorage.getLabCatalog(hospId));
  };

  useEffect(() => {
    refreshData();
    MockStorage.syncWithBackend?.();
    const handleUpdate = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [hospId]);

  // Metric Computations
  const pendingOrdersCount = labOrders.filter(
    (o) => o.status === 'Ordered' || o.status === 'Pending Sample'
  ).length;

  const samplesCollectedCount = labOrders.filter(
    (o) => o.status === 'Sample Collected'
  ).length;

  const processingCount = labOrders.filter(
    (o) => o.status === 'In Progress'
  ).length;

  const completedCount = labOrders.filter(
    (o) => o.status === 'Completed'
  ).length;

  // Filtered Orders
  const filteredOrders = labOrders.filter((order) => {
    const matchesSearch =
      order.patientName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.testName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(orderSearchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'Pending Sample'
        ? order.status === 'Ordered' || order.status === 'Pending Sample'
        : statusFilter === 'Processing'
        ? order.status === 'In Progress' || order.status === 'Processing'
        : order.status === statusFilter;

    const matchesDoctor = doctorFilter === 'all' || order.doctorId === doctorFilter;

    const matchesDate = !dateFilter || (order.orderDate && order.orderDate.startsWith(dateFilter));

    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
  });

  // --- Handlers for Order Lab Test ---
  const handleOpenOrderModal = () => {
    const defaultTest = activeCatalogTests[0];
    setOrderForm({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      testId: defaultTest?.id || '',
      specimenType: defaultTest?.sampleType || 'Blood',
      priority: 'Routine',
      notes: '',
    });
    setIsOrderModalOpen(true);
  };

  const handleTestSelectionChange = (testId: string) => {
    const test = labCatalog.find((t) => t.id === testId);
    setOrderForm((prev) => ({
      ...prev,
      testId,
      specimenType: test?.sampleType || prev.specimenType,
    }));
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
      id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
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
      status: 'Ordered',
      sampleType: orderForm.specimenType || test.sampleType,
      referenceRange: test.normalRange,
      fee: test.price,
      priority: orderForm.priority,
      notes: orderForm.notes,
    };

    MockStorage.saveLabOrder(newOrder);
    showToast('Lab Order Created', `Order ${newOrder.id} created for ${pat.name}.`);
    setIsOrderModalOpen(false);
    refreshData();
  };

  // --- Order Action Status Transitions ---
  const handleCollectSample = (order: LabOrder) => {
    const updated: LabOrder = {
      ...order,
      status: 'Sample Collected',
    };
    MockStorage.saveLabOrder(updated);
    showToast('Sample Collected', `Specimen specimen updated for ${order.id}.`);
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
      showToast('Results Recorded', `Lab result updated and report released for ${selectedOrder.patientName}.`);
      setIsResultModalOpen(false);
      refreshData();
    }
  };

  const handleViewOrder = (order: LabOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  // --- Catalog CRUD Handlers ---
  const handleOpenAddTest = () => {
    setEditingTest(null);
    setCatalogForm({
      testName: '',
      code: `TST-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Hematology',
      sampleType: 'Blood',
      turnaroundHours: 24,
      normalRange: '',
      price: 50,
      status: 'active',
    });
    setIsCatalogModalOpen(true);
  };

  const handleOpenEditTest = (test: LabTestCatalog) => {
    setEditingTest(test);
    setCatalogForm({
      testName: test.testName,
      code: test.code,
      category: test.category,
      sampleType: test.sampleType,
      turnaroundHours: test.turnaroundHours,
      normalRange: test.normalRange,
      price: test.price,
      status: test.status || 'active',
    });
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogTest = (e: React.FormEvent) => {
    e.preventDefault();
    const newTest: LabTestCatalog = {
      id: editingTest ? editingTest.id : `CAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      hospitalId: hospId,
      testName: catalogForm.testName,
      code: catalogForm.code,
      category: catalogForm.category,
      sampleType: catalogForm.sampleType,
      turnaroundHours: Number(catalogForm.turnaroundHours),
      normalRange: catalogForm.normalRange,
      price: Number(catalogForm.price),
      status: catalogForm.status,
    };

    MockStorage.saveLabTestCatalog(newTest);
    showToast(
      editingTest ? 'Test Updated' : 'Test Added',
      `${catalogForm.testName} saved in Laboratory Test Catalog.`
    );
    setIsCatalogModalOpen(false);
    refreshData();
  };

  const handleToggleCatalogStatus = (test: LabTestCatalog) => {
    const nextStatus = test.status === 'inactive' ? 'active' : 'inactive';
    MockStorage.updateLabTestCatalogStatus(test.id, nextStatus);
    showToast(
      'Catalog Status Changed',
      `${test.testName} is now ${nextStatus.toUpperCase()}.`
    );
    refreshData();
  };

  const handleConfirmDeleteTest = (id: string) => {
    setTestToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteTest = () => {
    if (testToDeleteId) {
      MockStorage.deleteLabTestCatalog(testToDeleteId);
      showToast('Test Deleted', 'Diagnostic test removed from catalog.');
      setIsDeleteConfirmOpen(false);
      setTestToDeleteId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Laboratory Diagnostics"
        subtitle="Manage daily laboratory work orders, sample collection tracking, clinical results entry, and test catalog configuration."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Laboratory Diagnostics' }]}
        actions={
          <Button variant="primary" size="md" onClick={handleOpenOrderModal} leftIcon={<Plus className="w-4 h-4" />}>
             Order Lab Test
          </Button>
        }
      />

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{pendingOrdersCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Samples Collected</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{samplesCollectedCount}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <FlaskConical className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processing</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{processingCount}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{completedCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: Diagnostic Orders & Requests */}
      <Card>
        <CardHeader
          title="Diagnostic Orders & Requests"
          subtitle="Active diagnostic requisitions and status workflow"
        />

        <CardContent className="p-4 space-y-4">
          {/* Table Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, test, order ID..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Sample">Pending Sample</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="Processing">Processing / In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Doctor Filter */}
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Ordering Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            />
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Order ID & Test</th>
                  <th className="px-4 py-3">Patient Details</th>
                  <th className="px-4 py-3">Ordering Doctor</th>
                  <th className="px-4 py-3">Specimen Type</th>
                  <th className="px-4 py-3">Diagnostic Result</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No lab orders found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isPendingSample = order.status === 'Ordered' || order.status === 'Pending Sample';
                    const isProcessing = order.status === 'Sample Collected' || order.status === 'In Progress' || order.status === 'Processing';
                    const isCompleted = order.status === 'Completed';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{order.testName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-indigo-600 font-mono font-medium">{order.id}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500">{order.category}</span>
                            {order.priority === 'Urgent' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                                URGENT
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-800">
                          <p className="font-semibold">{order.patientName}</p>
                          <p className="text-[10px] text-slate-400">{order.patientAge}y • {order.patientGender}</p>
                        </td>

                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {order.doctorName}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            🧪 {order.sampleType || 'Specimen'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {order.resultValue ? (
                            <div>
                              <span className={`font-bold text-xs ${order.resultStatus === 'Abnormal' || order.resultStatus === 'Critical' ? 'text-rose-600' : 'text-slate-900'}`}>
                                {order.resultValue}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">Ref: {order.referenceRange || 'N/A'}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Awaiting Test Entry</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {isCompleted && <Badge variant="success" dot>Completed</Badge>}
                          {isProcessing && <Badge variant="warning" dot>Processing</Badge>}
                          {isPendingSample && <Badge variant="neutral" dot>Pending Sample</Badge>}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleViewOrder(order)}
                              title="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </Button>

                            {isPendingSample && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleCollectSample(order)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                Collect Sample
                              </Button>
                            )}

                            {isProcessing && (
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleOpenEnterResult(order)}
                              >
                                Enter Result
                              </Button>
                            )}

                            {isCompleted && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleOpenEnterResult(order)}
                                leftIcon={<FileText className="w-3 h-3" />}
                              >
                                View Report
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Laboratory Test Catalog */}
      <Card>
        <CardHeader
          title="Laboratory Test Catalog"
          subtitle="Master directory of diagnostic tests, reference ranges, specimen requirements, and fees"
          action={
            <Button variant="outline" size="sm" onClick={handleOpenAddTest} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              + Add Diagnostic Test
            </Button>
          }
        />

        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Test Title & Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Sample Specimen</th>
                  <th className="px-4 py-3">Turnaround Time</th>
                  <th className="px-4 py-3">Normal Reference Range</th>
                  <th className="px-4 py-3">Fee Rate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <FlaskConical className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700 text-sm">No Diagnostic Tests in Catalog</p>
                        <p className="text-xs text-slate-400 mt-1">
                          The hospital laboratory test catalog is currently empty. Configure diagnostic tests to allow doctors and pathologists to place lab orders.
                        </p>
                        <Button variant="outline" size="sm" onClick={handleOpenAddTest} className="mt-3">
                          + Add Diagnostic Test
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  labCatalog.map((test) => {
                    const isInactive = test.status === 'inactive';

                    return (
                    <tr key={test.id} className={`hover:bg-slate-50/80 transition-colors ${isInactive ? 'bg-slate-50/40 text-slate-400' : ''}`}>
                      <td className="px-4 py-3.5">
                        <p className={`font-bold ${isInactive ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{test.testName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{test.code}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                          {test.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {test.sampleType}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {test.turnaroundHours} Hours
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate">
                        {test.normalRange || 'Standard Range'}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ${test.price}
                      </td>

                      <td className="px-4 py-3.5">
                        {isInactive ? (
                          <Badge variant="neutral">Inactive</Badge>
                        ) : (
                          <Badge variant="success" dot>Active</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenEditTest(test)}
                            title="Edit Test"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleToggleCatalogStatus(test)}
                            title={isInactive ? 'Activate Test' : 'Deactivate Test'}
                          >
                            <Power className={`w-3.5 h-3.5 ${isInactive ? 'text-emerald-600' : 'text-amber-600'}`} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleConfirmDeleteTest(test.id)}
                            title="Delete Test"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: Order Lab Test */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Order Diagnostic Test"
        subtitle="Submit a new laboratory test order for a patient"
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
            onChange={(e) => handleTestSelectionChange(e.target.value)}
            required
          >
            {activeCatalogTests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.testName} (${t.price} — Specimen: {t.sampleType})
              </option>
            ))}
          </Select>

          <Input
            label="Specimen Type"
            value={orderForm.specimenType}
            onChange={(e) => setOrderForm({ ...orderForm, specimenType: e.target.value })}
            placeholder="Auto-filled from selected test"
            helperText="Auto-populated based on test catalog configuration"
          />

          <Select
            label="Priority"
            value={orderForm.priority}
            onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value as any })}
          >
            <option value="Routine">Routine</option>
            <option value="Urgent">Urgent</option>
          </Select>

          <Textarea
            label="Clinical Notes / Special Instructions"
            value={orderForm.notes}
            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
            placeholder="Add relevant patient symptoms or physician instructions..."
            rows={2}
          />

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

      {/* MODAL 2: Add / Edit Diagnostic Test Catalog */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title={editingTest ? 'Edit Diagnostic Test' : 'Add Diagnostic Test'}
        subtitle="Configure lab test parameters in the catalog"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCatalogTest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Test Title *"
              value={catalogForm.testName}
              onChange={(e) => setCatalogForm({ ...catalogForm, testName: e.target.value })}
              placeholder="e.g. Complete Blood Count (CBC)"
              required
            />
            <Input
              label="Test Code *"
              value={catalogForm.code}
              onChange={(e) => setCatalogForm({ ...catalogForm, code: e.target.value })}
              placeholder="e.g. CBC-001"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category *"
              value={catalogForm.category}
              onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
              required
            >
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Pathology">Pathology</option>
              <option value="Radiology">Radiology</option>
            </Select>

            <Select
              label="Sample Specimen *"
              value={catalogForm.sampleType}
              onChange={(e) => setCatalogForm({ ...catalogForm, sampleType: e.target.value })}
              required
            >
              <option value="Blood">Blood</option>
              <option value="Serum">Serum</option>
              <option value="Urine">Urine</option>
              <option value="Stool">Stool</option>
              <option value="Swab">Swab</option>
              <option value="Tissue Biopsy">Tissue Biopsy</option>
              <option value="CSF">CSF</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Turnaround Time (Hours) *"
              type="number"
              value={catalogForm.turnaroundHours}
              onChange={(e) => setCatalogForm({ ...catalogForm, turnaroundHours: Number(e.target.value) })}
              required
            />
            <Input
              label="Fee Rate ($) *"
              type="number"
              value={catalogForm.price}
              onChange={(e) => setCatalogForm({ ...catalogForm, price: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Normal Reference Range"
            value={catalogForm.normalRange}
            onChange={(e) => setCatalogForm({ ...catalogForm, normalRange: e.target.value })}
            placeholder="e.g. 4.5 - 11.0 x10^3/uL"
          />

          <Select
            label="Status *"
            value={catalogForm.status}
            onChange={(e) => setCatalogForm({ ...catalogForm, status: e.target.value as any })}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCatalogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Diagnostic Test
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Enter Result / View Report */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title={selectedOrder?.status === 'Completed' ? 'Laboratory Diagnostic Report' : 'Enter Diagnostic Result'}
        subtitle={`Order ${selectedOrder?.id} — ${selectedOrder?.testName}`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <form onSubmit={handleSaveResult} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{selectedOrder.patientName} ({selectedOrder.patientAge}y • {selectedOrder.patientGender})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ordering Doctor:</span>
                <span className="font-medium text-slate-800">{selectedOrder.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sample Specimen:</span>
                <span className="font-semibold text-slate-800">🧪 {selectedOrder.sampleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Normal Reference Range:</span>
                <span className="font-mono text-slate-700">{selectedOrder.referenceRange || 'N/A'}</span>
              </div>
            </div>

            <Input
              label="Quantitative / Qualitative Result Value *"
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="e.g. 13.5 g/dL or Negative"
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
              placeholder="Equipment telemetry, calibration notes, or observations..."
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsResultModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Release Report
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: View Order Details */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Diagnostic Order Summary"
        subtitle={`Order Reference: ${selectedOrder?.id}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Test Name:</span>
                <span className="font-bold text-slate-900">{selectedOrder.testName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.patientName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Ordering Doctor:</span>
                <span className="text-slate-800">{selectedOrder.doctorName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Specimen Type:</span>
                <span className="font-semibold text-slate-800">🧪 {selectedOrder.sampleType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Priority:</span>
                <span className="font-bold text-slate-900">{selectedOrder.priority || 'Routine'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Order Date:</span>
                <span className="text-slate-700">{selectedOrder.orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <Badge variant={selectedOrder.status === 'Completed' ? 'success' : 'warning'}>
                  {selectedOrder.status}
                </Badge>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Clinical Notes:</p>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-600">
                  {selectedOrder.notes}
                </div>
              </div>
            )}

            {selectedOrder.resultValue && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Diagnostic Results:</p>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-slate-900">
                  <p className="font-bold text-sm text-emerald-900">{selectedOrder.resultValue}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Status: {selectedOrder.resultStatus}</p>
                  {selectedOrder.labTechnicianNotes && (
                    <p className="text-[11px] text-slate-600 mt-1 border-t border-emerald-200 pt-1">
                      Notes: {selectedOrder.labTechnicianNotes}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTest}
        title="Delete Diagnostic Test"
        message="Are you sure you want to remove this diagnostic test from the laboratory catalog? This action cannot be undone."
        confirmText="Delete Test"
        variant="danger"
      />
    </div>
  );
};
