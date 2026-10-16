import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MockStorage } from '../../services/mockStorage';
import { LabOrder } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  FlaskConical,
  Search,
  Calendar,
  User,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Microscope,
  Info
} from 'lucide-react';

export const PatientLabReports: React.FC = () => {
  const { user } = useAuth();
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'In Progress' | 'Sample Collected' | 'Ordered'>('All');
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const patientId = user?.patientId || 'PAT-1001';

  const loadData = () => {
    const list = MockStorage.getLabOrders(undefined, patientId);
    setLabOrders(list);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [patientId]);

  const filteredOrders = labOrders.filter((order) => {
    const matchesSearch =
      order.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: LabOrder['status']) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'info';
      case 'Sample Collected':
        return 'warning';
      case 'Ordered':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getResultStatusBadge = (resStatus?: 'Normal' | 'Abnormal' | 'Critical') => {
    switch (resStatus) {
      case 'Normal':
        return <Badge variant="success" size="sm">Normal</Badge>;
      case 'Abnormal':
        return <Badge variant="warning" size="sm">Abnormal</Badge>;
      case 'Critical':
        return <Badge variant="error" size="sm">Critical Attention</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Pending Analysis</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic & Laboratory Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Access verified pathology results, diagnostic scans, reference metrics, and physician evaluations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="indigo" size="md">
            {labOrders.filter((o) => o.status === 'Completed').length} Verified Results
          </Badge>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <span className="font-semibold">Clinical Interpretation Notice:</span> Laboratory findings should always be reviewed in consultation with your attending physician. Reference ranges reflect standard standardized baselines.
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search diagnostic tests, categories..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {(['All', 'Completed', 'In Progress', 'Sample Collected', 'Ordered'] as const).map((st) => (
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

      {/* Lab Order List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<FlaskConical className="w-7 h-7" />}
            title="No Lab Reports Found"
            description="You currently have no diagnostic reports matching your search query."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="p-5 border-slate-200 hover:border-brand-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Test details */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{order.testName}</h3>
                      <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                        {order.status}
                      </Badge>
                      {order.status === 'Completed' && getResultStatusBadge(order.resultStatus)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="font-mono text-slate-400">ID: {order.id}</span>
                      <span>Category: <strong className="text-slate-700">{order.category}</strong></span>
                      <span>Sample: <strong className="text-slate-700">{order.sampleType}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Ordered by {order.doctorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Ordered: {order.orderDate}
                      </span>
                      {order.completedDate && (
                        <span className="text-emerald-600 font-medium">
                          Completed: {order.completedDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status / Value summary & Action */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
                  {order.status === 'Completed' && order.resultValue && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-right min-w-[160px]">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Observed Value</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{order.resultValue}</p>
                      <p className="text-[11px] text-slate-500">Ref: {order.referenceRange || 'N/A'}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant={order.status === 'Completed' ? 'primary' : 'outline'}
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {order.status === 'Completed' ? 'View Full Report' : 'Track Status'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lab Report Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Diagnostic Report — ${selectedOrder.testName}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-400 uppercase tracking-wider font-semibold">Official Clinical Report</p>
                <h3 className="text-xl font-bold mt-1">{selectedOrder.testName}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">Order ID: {selectedOrder.id} • Specimen: {selectedOrder.sampleType}</p>
              </div>
              <div className="text-right">
                <Badge variant={getStatusBadgeVariant(selectedOrder.status)} size="md">
                  {selectedOrder.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-400 font-medium">Patient</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.patientName}</p>
                <p className="text-slate-500">Age: {selectedOrder.patientAge} • {selectedOrder.patientGender}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-400 font-medium">Ordering Doctor</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.doctorName}</p>
                <p className="text-slate-500">Physician ID: {selectedOrder.doctorId}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-400 font-medium">Order Date</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.orderDate}</p>
                <p className="text-slate-500">{selectedOrder.completedDate ? `Released: ${selectedOrder.completedDate}` : 'In Lab'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-400 font-medium">Category</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.category}</p>
                <p className="text-slate-500">Test Fee: ${selectedOrder.fee}</p>
              </div>
            </div>

            {selectedOrder.status === 'Completed' ? (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Measurement Parameter</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Evaluation</span>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{selectedOrder.testName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Reference Baseline: <span className="font-mono font-medium text-slate-700">{selectedOrder.referenceRange}</span></p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-2xl font-black text-slate-900">{selectedOrder.resultValue}</p>
                      {getResultStatusBadge(selectedOrder.resultStatus)}
                    </div>
                  </div>
                </div>

                {selectedOrder.labTechnicianNotes && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">Technician Findings & Clinical Remarks:</p>
                    <p className="italic">{selectedOrder.labTechnicianNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-pulse" />
                <h4 className="font-bold text-slate-900">Diagnostic Analysis In Progress</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Your specimen is currently being processed by the pathology department. Results will be uploaded immediately upon pathologist sign-off.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Report
              </Button>
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

export default PatientLabReports;
