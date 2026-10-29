import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Printer,
  ShieldCheck,
  QrCode,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Tag,
  FileCheck,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Layers,
  X,
  Filter,
  Stethoscope,
  Syringe,
  UserCheck,
  Activity,
  CheckSquare,
  Download,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { LabOrder, LabTestCatalog, LabResultItem, LabTestParameter, Patient } from '../../../types';
import { PatientCombobox } from '../../../components/common/PatientCombobox';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

interface LaboratoryManagementProps {
  defaultTab?: 'orders' | 'catalog' | 'new-order';
}

export const LaboratoryManagement: React.FC<LaboratoryManagementProps> = ({ defaultTab = 'orders' }) => {
  const { user, currentHospital } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'HOSP-001';

  // Master Data
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => MockStorage.getLabOrders(hospId));
  const [labCatalog, setLabCatalog] = useState<LabTestCatalog[]>(() => MockStorage.getLabCatalog(hospId));
  const patients = MockStorage.getPatients(hospId);
  const doctors = MockStorage.getDoctors(hospId);
  const hospitalNurses = useMemo(() => MockStorage.getHospitalNurses(hospId), [hospId]);

  // Selected Patient state for combobox
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientError, setPatientError] = useState('');

  // Active view tab resolved dynamically from URL
  const resolveTabFromPath = (): 'orders' | 'catalog' | 'new-order' => {
    if (location.pathname.includes('/catalog')) return 'catalog';
    if (location.pathname.includes('/new-order')) return 'new-order';
    if (location.pathname.includes('/orders')) return 'orders';
    return defaultTab;
  };

  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'new-order'>(resolveTabFromPath);

  useEffect(() => {
    setActiveTab(resolveTabFromPath());
  }, [location.pathname, defaultTab]);

  // Filters for Orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Filters for Diagnostic Test Catalog & Multi-Parameter Panels
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');
  const [catalogSampleTypeFilter, setCatalogSampleTypeFilter] = useState('all');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState('all');
  const [catalogPanelTypeFilter, setCatalogPanelTypeFilter] = useState<'all' | 'panels' | 'single'>('all');
  const [expandedCatalogTestIds, setExpandedCatalogTestIds] = useState<Set<string>>(new Set());

  const toggleExpandCatalogTest = (testId: string) => {
    setExpandedCatalogTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isDoctorReviewModalOpen, setIsDoctorReviewModalOpen] = useState(false);
  const [isNurseExecModalOpen, setIsNurseExecModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Active Selections
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
    tubeColor: initialTest?.tubeColor || 'Lavender / EDTA Tube',
    priority: 'Routine' as 'Routine' | 'Urgent',
    notes: '',
  });

  // Test Catalog Form State with Dynamic Parameters
  const [catalogForm, setCatalogForm] = useState<{
    testName: string;
    code: string;
    category: string;
    sampleType: string;
    tubeColor: string;
    turnaroundHours: number;
    normalRange: string;
    price: number;
    status: 'active' | 'inactive';
    parameters: LabTestParameter[];
  }>({
    testName: '',
    code: '',
    category: 'Hematology',
    sampleType: 'Blood',
    tubeColor: 'Lavender / EDTA Tube',
    turnaroundHours: 24,
    normalRange: '',
    price: 500,
    status: 'active',
    parameters: [],
  });

  const handleAddParameterToForm = () => {
    const newParam: LabTestParameter = {
      id: `param_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: '',
      unit: '',
      referenceRange: '',
    };
    setCatalogForm((prev) => ({
      ...prev,
      parameters: [...prev.parameters, newParam],
    }));
  };

  const handleUpdateParameterInForm = (idx: number, field: keyof LabTestParameter, val: string) => {
    setCatalogForm((prev) => {
      const nextParams = [...prev.parameters];
      nextParams[idx] = { ...nextParams[idx], [field]: val };
      return { ...prev, parameters: nextParams };
    });
  };

  const handleRemoveParameterFromForm = (idx: number) => {
    setCatalogForm((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== idx),
    }));
  };

  // Nurse Preparation & Specimen Collection State
  const [collectBarcode, setCollectBarcode] = useState('');
  const [collectTubeColor, setCollectTubeColor] = useState('');
  const [selectedCollectorNurseId, setSelectedCollectorNurseId] = useState('');
  const [nurseCollectorName, setNurseCollectorName] = useState(() => (user?.role === 'nurse' && user?.name) ? user.name : 'Sister Sunita (Staff Nurse)');
  const [patientPrepConfirmed, setPatientPrepConfirmed] = useState(true);
  const [patientPrepNotes, setPatientPrepNotes] = useState('Patient dual-ID verified. Fasting protocol checked. Aseptic venipuncture performed.');

  // Lab Technician Specimen Accessioning & Analyzer State
  const [receiveTechnicianName, setReceiveTechnicianName] = useState(() => (user?.role === 'lab_technician' && user?.name) ? user.name : 'Liam Zhang (Medical Lab Technologist)');
  const [specimenIntegrityConfirmed, setSpecimenIntegrityConfirmed] = useState(true);
  const [analyzerInstrument, setAnalyzerInstrument] = useState('Automated 5-Part Hematology / Clinical Chemistry Analyzer');

  // Doctor Clinical Review & Directives State
  const [reviewDoctorName, setReviewDoctorName] = useState('');
  const [doctorClinicalImpression, setDoctorClinicalImpression] = useState('');
  const [doctorInstructions, setDoctorInstructions] = useState('');

  // Nurse Follow-Up & Directive Execution State
  const [selectedExecNurseId, setSelectedExecNurseId] = useState('');
  const [executingNurseName, setExecutingNurseName] = useState(() => (user?.role === 'nurse' && user?.name) ? user.name : 'Sister Sunita (Staff Nurse)');
  const [nurseExecutionNotes, setNurseExecutionNotes] = useState('');
  const [nurseExecutionConfirmed, setNurseExecutionConfirmed] = useState(true);

  // Multi-parameter Result Form State
  const [parameterInputs, setParameterInputs] = useState<Record<string, { value: string; isAbnormal: boolean; isCritical: boolean }>>({});
  const [singleResultValue, setSingleResultValue] = useState('');
  const [overallResultStatus, setOverallResultStatus] = useState<'Normal' | 'Abnormal' | 'Critical'>('Normal');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Pathologist Verification State (100% Dynamic resolution from hospital doctors)
  const defaultPathologist = useMemo(() => {
    const doc = doctors.find(
      (d) =>
        d.specialization?.toLowerCase().includes('patholog') ||
        d.department?.toLowerCase().includes('patholog')
    );
    if (doc) return `Dr. ${doc.name}`;
    if (doctors[0]) return `Dr. ${doctors[0].name}`;
    return 'Consultant Pathologist & Lab Director';
  }, [doctors]);

  const [pathologistName, setPathologistName] = useState(defaultPathologist);
  const [pathologistNotes, setPathologistNotes] = useState('Specimen morphology verified. Results correlate with clinical presentation.');

  // Sample Rejection State
  const [rejectionReason, setRejectionReason] = useState('Hemolyzed Specimen (Free Hb interfering with photometric assay)');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [requestRedraw, setRequestRedraw] = useState(true);

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

  // Metric Computations (End-to-End Clinical Lifecycle)
  const pendingOrdersCount = labOrders.filter(
    (o) => o.status === 'Ordered' || o.status === 'Pending Sample'
  ).length;

  const samplesCollectedCount = labOrders.filter(
    (o) => o.status === 'Sample Collected'
  ).length;

  const processingCount = labOrders.filter(
    (o) => o.status === 'In Progress' || o.status === 'Processing'
  ).length;

  const awaitingSignOffCount = labOrders.filter(
    (o) => o.status === 'Completed'
  ).length;

  const verifiedCount = labOrders.filter(
    (o) => o.status === 'Verified'
  ).length;

  const doctorReviewedCount = labOrders.filter(
    (o) => o.status === 'Doctor Reviewed'
  ).length;

  const actionCompletedCount = labOrders.filter(
    (o) => o.status === 'Action Completed'
  ).length;

  const rejectedCount = labOrders.filter(
    (o) => o.status === 'Sample Rejected'
  ).length;

  // Filtered Orders
  const filteredOrders = labOrders.filter((order) => {
    const matchesSearch =
      order.patientName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.testName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (order.barcodeNumber && order.barcodeNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()));

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

  // Dynamic Catalog Categories & Specimen Types
  const catalogCategories = useMemo(() => {
    const cats = new Set<string>();
    labCatalog.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [labCatalog]);

  const catalogSampleTypes = useMemo(() => {
    const types = new Set<string>();
    labCatalog.forEach((t) => {
      if (t.sampleType) types.add(t.sampleType);
    });
    return Array.from(types).sort();
  }, [labCatalog]);

  const catalogStats = useMemo(() => {
    const total = labCatalog.length;
    const panels = labCatalog.filter((t) => (t.parameters?.length || 0) > 0).length;
    const single = labCatalog.filter((t) => !t.parameters || t.parameters.length === 0).length;
    const active = labCatalog.filter((t) => (t.status || 'active') === 'active').length;
    const inactive = labCatalog.filter((t) => t.status === 'inactive').length;
    return { total, panels, single, active, inactive };
  }, [labCatalog]);

  // Dynamic Filtered Test Catalog (Deep multi-field query matching test title, code, category, specimen, tube cap color, and individual parameters)
  const filteredCatalog = useMemo(() => {
    const q = catalogSearchQuery.trim().toLowerCase();
    return labCatalog.filter((test) => {
      const matchesSearch =
        !q ||
        test.testName.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q) ||
        (test.category && test.category.toLowerCase().includes(q)) ||
        (test.sampleType && test.sampleType.toLowerCase().includes(q)) ||
        (test.tubeColor && test.tubeColor.toLowerCase().includes(q)) ||
        (test.normalRange && test.normalRange.toLowerCase().includes(q)) ||
        (test.parameters &&
          test.parameters.some(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.unit.toLowerCase().includes(q) ||
              p.referenceRange.toLowerCase().includes(q)
          ));

      const matchesCategory =
        catalogCategoryFilter === 'all' || test.category === catalogCategoryFilter;

      const matchesSampleType =
        catalogSampleTypeFilter === 'all' || test.sampleType === catalogSampleTypeFilter;

      const testStatus = test.status || 'active';
      const matchesStatus =
        catalogStatusFilter === 'all' || testStatus === catalogStatusFilter;

      const isMultiParam = (test.parameters?.length || 0) > 0;
      const matchesPanelType =
        catalogPanelTypeFilter === 'all' ||
        (catalogPanelTypeFilter === 'panels' && isMultiParam) ||
        (catalogPanelTypeFilter === 'single' && !isMultiParam);

      return matchesSearch && matchesCategory && matchesSampleType && matchesStatus && matchesPanelType;
    });
  }, [
    labCatalog,
    catalogSearchQuery,
    catalogCategoryFilter,
    catalogSampleTypeFilter,
    catalogStatusFilter,
    catalogPanelTypeFilter,
  ]);

  // Tube Cap Badge Helper
  const renderTubeBadge = (tubeColor?: string) => {
    if (!tubeColor) return null;
    const lower = tubeColor.toLowerCase();
    let bg = 'bg-slate-100 text-slate-800 border-slate-200';
    let dot = 'bg-slate-500';

    if (lower.includes('lavender') || lower.includes('edta') || lower.includes('purple')) {
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      dot = 'bg-purple-600';
    } else if (lower.includes('gold') || lower.includes('sst') || lower.includes('gel')) {
      bg = 'bg-amber-50 text-amber-800 border-amber-300';
      dot = 'bg-amber-500';
    } else if (lower.includes('red') || lower.includes('plain')) {
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      dot = 'bg-rose-500';
    } else if (lower.includes('grey') || lower.includes('gray') || lower.includes('fluoride')) {
      bg = 'bg-slate-100 text-slate-700 border-slate-300';
      dot = 'bg-slate-500';
    } else if (lower.includes('blue') || lower.includes('citrate')) {
      bg = 'bg-sky-50 text-sky-700 border-sky-300';
      dot = 'bg-sky-500';
    } else if (lower.includes('green') || lower.includes('heparin')) {
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      dot = 'bg-emerald-500';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
        {tubeColor}
      </span>
    );
  };

  // --- Handlers for Order Lab Test ---
  const handleOpenOrderModal = () => {
    const defaultTest = activeCatalogTests[0];
    setSelectedPatient(null);
    setPatientError('');
    setOrderForm({
      patientId: '',
      doctorId: doctors[0]?.id || '',
      testId: defaultTest?.id || '',
      specimenType: defaultTest?.sampleType || 'Blood',
      tubeColor: defaultTest?.tubeColor || 'Lavender / EDTA Tube',
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
      tubeColor: test?.tubeColor || prev.tubeColor,
    }));
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const pat =
      selectedPatient ||
      patients.find((p) => p.id === orderForm.patientId) ||
      (orderForm.patientId ? MockStorage.getPatientById(orderForm.patientId) : undefined);
    const doc = doctors.find((d) => d.id === orderForm.doctorId);
    const test = labCatalog.find((t) => t.id === orderForm.testId);

    if (!pat || !doc || !test) {
      if (!pat) setPatientError('Please search and select a patient.');
      showToast('Validation Error', 'Please select patient, doctor, and lab test.', 'error');
      return;
    }

    const newBarcode = `BC-LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

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
      tubeColor: orderForm.tubeColor || test.tubeColor,
      barcodeNumber: newBarcode,
      referenceRange: test.normalRange,
      fee: test.price,
      priority: orderForm.priority,
      notes: orderForm.notes,
    };

    MockStorage.saveLabOrder(newOrder);
    showToast('Lab Order Created', `Order ${newOrder.id} (${newOrder.barcodeNumber}) generated for ${pat.name}.`);
    setIsOrderModalOpen(false);
    setSelectedPatient(null);
    setPatientError('');
    refreshData();
    setActiveTab('orders');
    navigate('/hospital/laboratory/orders');
  };

  // --- Nurse Patient Preparation & Specimen Collection Handlers ---
  const handleOpenCollectModal = (order: LabOrder) => {
    setSelectedOrder(order);
    const test = labCatalog.find((t) => t.id === order.testId || t.testName === order.testName);
    setCollectBarcode(order.barcodeNumber || `BC-LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`);
    setCollectTubeColor(order.tubeColor || test?.tubeColor || 'Lavender / EDTA Tube');
    setPatientPrepConfirmed(true);
    setPatientPrepNotes('Patient dual-ID verified. Fasting protocol checked. Aseptic venipuncture performed.');

    const matching = hospitalNurses.find(
      (n) => (user?.name && n.name.toLowerCase().includes(user.name.toLowerCase())) ||
             (user?.id && n.id === user.id)
    ) || hospitalNurses[0];

    setSelectedCollectorNurseId(matching?.id || 'NUR-CUSTOM');
    setNurseCollectorName(user?.role === 'nurse' && user?.name ? user.name : (matching?.name || 'Sister Sunita (Staff Nurse)'));
    setIsCollectModalOpen(true);
  };

  const handleSelectCollectorNurse = (nurseId: string) => {
    setSelectedCollectorNurseId(nurseId);
    const n = hospitalNurses.find((item) => item.id === nurseId);
    if (n) {
      setNurseCollectorName(n.name);
    }
  };

  const handleConfirmCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    MockStorage.collectLabSampleByNurse(
      selectedOrder.id,
      nurseCollectorName,
      patientPrepConfirmed,
      patientPrepNotes,
      collectTubeColor,
      collectBarcode,
      selectedCollectorNurseId !== 'NUR-CUSTOM' ? selectedCollectorNurseId : undefined
    );

    showToast(
      'Specimen Collected by Nurse',
      `Patient prepared and sample collected by Nurse ${nurseCollectorName}${selectedCollectorNurseId && selectedCollectorNurseId !== 'NUR-CUSTOM' ? ` (${selectedCollectorNurseId})` : ''}. Barcode: ${collectBarcode}`
    );
    setIsCollectModalOpen(false);
    refreshData();
  };

  // --- Lab Technician Specimen Accessioning & Analyzer Handlers ---
  const handleOpenReceiveModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setSpecimenIntegrityConfirmed(true);
    setAnalyzerInstrument('Automated 5-Part Hematology / Clinical Chemistry Analyzer');
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceiveAndProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    MockStorage.receiveAndProcessLabSample(
      selectedOrder.id,
      receiveTechnicianName,
      analyzerInstrument
    );

    showToast('Specimen Accessioned & Analyzer Run Started', `${selectedOrder.testName} accessioned by ${receiveTechnicianName} on ${analyzerInstrument}.`);
    setIsReceiveModalOpen(false);
    refreshData();
  };

  // --- Multi-parameter / Structured Results Handlers ---
  const handleOpenEnterResult = (order: LabOrder) => {
    setSelectedOrder(order);
    const catalogItem = labCatalog.find((t) => t.id === order.testId || t.testName === order.testName);
    const parameters = catalogItem?.parameters || [];

    // Pre-populate parameter inputs if multi-parameter test
    const initialInputs: Record<string, { value: string; isAbnormal: boolean; isCritical: boolean }> = {};
    if (order.resultItems && order.resultItems.length > 0) {
      order.resultItems.forEach((item) => {
        initialInputs[item.parameterId] = {
          value: item.value,
          isAbnormal: !!item.isAbnormal,
          isCritical: !!item.isCritical,
        };
      });
    } else if (parameters.length > 0) {
      parameters.forEach((p) => {
        initialInputs[p.id] = {
          value: '',
          isAbnormal: false,
          isCritical: false,
        };
      });
    }

    setParameterInputs(initialInputs);
    setSingleResultValue(order.resultValue || '');
    setOverallResultStatus(order.resultStatus || 'Normal');
    setTechnicianNotes(order.labTechnicianNotes || '');
    setIsResultModalOpen(true);
  };

  const handleParameterValueChange = (paramId: string, val: string) => {
    setParameterInputs((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        value: val,
      },
    }));
  };

  const handleParameterFlagToggle = (paramId: string, flag: 'isAbnormal' | 'isCritical') => {
    setParameterInputs((prev) => {
      const current = prev[paramId] || { value: '', isAbnormal: false, isCritical: false };
      const next = { ...current, [flag]: !current[flag] };
      // If setting critical, also mark abnormal
      if (flag === 'isCritical' && next.isCritical) {
        next.isAbnormal = true;
      }
      return { ...prev, [paramId]: next };
    });
  };

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const catalogItem = labCatalog.find((t) => t.id === selectedOrder.testId || t.testName === selectedOrder.testName);
    const parameters = catalogItem?.parameters || [];

    let resultItems: LabResultItem[] = [];
    let hasCritical = false;
    let hasAbnormal = false;

    if (parameters.length > 0) {
      resultItems = parameters.map((param) => {
        const inp = parameterInputs[param.id] || { value: '', isAbnormal: false, isCritical: false };
        if (inp.isCritical) hasCritical = true;
        if (inp.isAbnormal) hasAbnormal = true;

        return {
          parameterId: param.id,
          parameterName: param.name,
          value: inp.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: inp.isAbnormal,
          isCritical: inp.isCritical,
        };
      });
    }

    const calculatedStatus: 'Normal' | 'Abnormal' | 'Critical' =
      hasCritical || overallResultStatus === 'Critical'
        ? 'Critical'
        : hasAbnormal || overallResultStatus === 'Abnormal'
        ? 'Abnormal'
        : 'Normal';

    // Form summary value string for quick display
    const finalResultValue =
      parameters.length > 0
        ? `${resultItems.filter((i) => i.value).length} / ${parameters.length} Parameters Evaluated (${calculatedStatus})`
        : singleResultValue;

    const updated: LabOrder = {
      ...selectedOrder,
      resultValue: finalResultValue,
      resultItems: resultItems.length > 0 ? resultItems : undefined,
      resultStatus: calculatedStatus,
      labTechnicianNotes: technicianNotes,
      status: 'Completed', // Two-tier verification: Completed means Awaiting Pathologist Sign-Off
      completedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    MockStorage.saveLabOrder(updated);

    if (calculatedStatus === 'Critical') {
      showToast(
        'CRITICAL ALERT TRIGGERED',
        `Critical panic value detected for ${selectedOrder.patientName}. Pathologist and ordering physician alerted.`,
        'error'
      );
    } else {
      showToast('Results Submitted', `Results recorded for ${selectedOrder.id}. Awaiting Pathologist sign-off.`);
    }

    setIsResultModalOpen(false);
    refreshData();
  };

  // --- Pathologist Verification Handlers ---
  const handleOpenVerifyModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setPathologistName('Dr. Anita Roy, MD (Pathology)');
    setPathologistNotes(order.pathologistNotes || 'Specimen morphology verified. Results correlate with clinical presentation.');
    setIsVerifyModalOpen(true);
  };

  const handleConfirmVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    MockStorage.verifyLabOrder(selectedOrder.id, pathologistName, pathologistNotes);
    showToast('Report Digitally Verified & Signed', `Official diagnostic report released under ${pathologistName}. Ready for Doctor Review.`);
    setIsVerifyModalOpen(false);
    refreshData();
  };

  // --- Doctor Review & Clinical Directives Handlers ---
  const handleOpenDoctorReview = (order: LabOrder) => {
    setSelectedOrder(order);
    const doctorObj = doctors.find((d) => d.id === order.doctorId || d.name === order.doctorName);
    setReviewDoctorName(order.doctorName || doctorObj?.name || (user?.name ? `Dr. ${user.name}` : 'Dr. Arvind Sharma'));
    setDoctorClinicalImpression(
      order.doctorClinicalImpression ||
      (order.resultStatus === 'Critical'
        ? 'Critical diagnostic abnormality noted. Urgent clinical intervention required.'
        : order.resultStatus === 'Abnormal'
        ? 'Diagnostic values outside reference interval. Therapeutic management indicated.'
        : 'Diagnostic findings within acceptable biological reference limits. Maintain routine care.')
    );
    setDoctorInstructions(
      order.doctorInstructions ||
      (order.resultStatus === 'Critical'
        ? 'STAT: Administer corrective treatment immediately. Continuous vitals monitoring. Repeat panel in 6 hours.'
        : order.resultStatus === 'Abnormal'
        ? 'Adjust oral therapy as prescribed. Monitor bedside vitals and document patient clinical response.'
        : 'Continue current treatment protocol and standard diet. Reassess at scheduled follow-up.')
    );
    setIsDoctorReviewModalOpen(true);
  };

  const handleConfirmDoctorReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    MockStorage.reviewLabReportByDoctor(
      selectedOrder.id,
      selectedOrder.doctorId || 'DOC-DEFAULT',
      reviewDoctorName,
      doctorClinicalImpression,
      doctorInstructions
    );

    showToast('Doctor Review Recorded & Directive Issued', `Clinical orders issued by ${reviewDoctorName}. Assigned to nursing station.`);
    setIsDoctorReviewModalOpen(false);
    refreshData();
  };

  // --- Nurse Follow-Up & Directive Execution Handlers ---
  const handleOpenNurseExec = (order: LabOrder) => {
    setSelectedOrder(order);
    const matching = hospitalNurses.find(
      (n) => (user?.name && n.name.toLowerCase().includes(user.name.toLowerCase())) ||
             (user?.id && n.id === user.id)
    ) || hospitalNurses[0];

    setSelectedExecNurseId(matching?.id || 'NUR-CUSTOM');
    setExecutingNurseName((user?.role === 'nurse' && user?.name) ? user.name : (matching?.name || 'Sister Sunita (Staff Nurse)'));
    setNurseExecutionNotes(
      order.nurseExecutionNotes ||
      `Reviewed Dr. ${order.reviewedByDoctorName || order.doctorName}'s directives. Administered prescribed therapeutic care at bedside. Patient vitals stable and documented.`
    );
    setNurseExecutionConfirmed(true);
    setIsNurseExecModalOpen(true);
  };

  const handleSelectExecNurse = (nurseId: string) => {
    setSelectedExecNurseId(nurseId);
    const n = hospitalNurses.find((item) => item.id === nurseId);
    if (n) {
      setExecutingNurseName(n.name);
    }
  };

  const handleConfirmNurseExec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    MockStorage.executeDoctorInstructionByNurse(
      selectedOrder.id,
      executingNurseName,
      nurseExecutionNotes,
      selectedExecNurseId !== 'NUR-CUSTOM' ? selectedExecNurseId : undefined
    );

    showToast(
      'Doctor Orders Followed & Documented',
      `Nurse ${executingNurseName}${selectedExecNurseId && selectedExecNurseId !== 'NUR-CUSTOM' ? ` (${selectedExecNurseId})` : ''} completed clinical directives for ${selectedOrder.patientName}. Loop closed.`
    );
    setIsNurseExecModalOpen(false);
    refreshData();
  };

  // --- Sample Rejection Handlers ---
  const handleOpenRejectModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setRejectionReason('Hemolyzed Specimen (Free Hb interfering with photometric assay)');
    setRejectionNotes('');
    setRequestRedraw(true);
    setIsRejectModalOpen(true);
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const fullReason = rejectionNotes ? `${rejectionReason} — ${rejectionNotes}` : rejectionReason;
    MockStorage.rejectLabSample(selectedOrder.id, fullReason, 'Sarah Jenkins (Lab In-Charge)');

    // Optionally auto-order redraw with Urgent priority
    if (requestRedraw) {
      const redrawOrder: LabOrder = {
        id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
        hospitalId: selectedOrder.hospitalId,
        patientId: selectedOrder.patientId,
        patientName: selectedOrder.patientName,
        patientAge: selectedOrder.patientAge,
        patientGender: selectedOrder.patientGender,
        doctorId: selectedOrder.doctorId,
        doctorName: selectedOrder.doctorName,
        testId: selectedOrder.testId,
        testName: selectedOrder.testName,
        category: selectedOrder.category,
        orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Ordered',
        sampleType: selectedOrder.sampleType,
        tubeColor: selectedOrder.tubeColor,
        barcodeNumber: `BC-LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        referenceRange: selectedOrder.referenceRange,
        fee: 0, // Free redraw
        priority: 'Urgent',
        notes: `AUTOMATED SPECIMEN REDRAW: Previous sample rejected (${rejectionReason})`,
      };
      MockStorage.saveLabOrder(redrawOrder);
      showToast('Specimen Rejected & Redraw Issued', `Sample rejected. Urgent redraw order ${redrawOrder.id} scheduled.`);
    } else {
      showToast('Specimen Rejected', `Lab order ${selectedOrder.id} marked as Sample Rejected.`);
    }

    setIsRejectModalOpen(false);
    refreshData();
  };

  // --- Print / Official Report Handlers ---
  const handleOpenPrintReport = (order: LabOrder) => {
    setSelectedOrder(order);
    setIsPrintModalOpen(true);
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
      tubeColor: 'Lavender / EDTA Tube',
      turnaroundHours: 24,
      normalRange: '',
      price: 500,
      status: 'active',
      parameters: [],
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
      tubeColor: test.tubeColor || 'Lavender / EDTA Tube',
      turnaroundHours: test.turnaroundHours,
      normalRange: test.normalRange || '',
      price: test.price,
      status: test.status || 'active',
      parameters: test.parameters ? test.parameters.map((p) => ({ ...p })) : [],
    });
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogTest = (e: React.FormEvent) => {
    e.preventDefault();
    const validParams = catalogForm.parameters.filter((p) => p.name.trim().length > 0);

    const newTest: LabTestCatalog = {
      id: editingTest ? editingTest.id : `CAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      hospitalId: hospId,
      testName: catalogForm.testName.trim(),
      code: catalogForm.code.trim().toUpperCase(),
      category: catalogForm.category,
      sampleType: catalogForm.sampleType,
      tubeColor: catalogForm.tubeColor,
      turnaroundHours: Number(catalogForm.turnaroundHours),
      normalRange: validParams.length > 0 ? 'Multiple Parameters (See Panel)' : (catalogForm.normalRange || 'Standard Limits'),
      price: Number(catalogForm.price),
      status: catalogForm.status,
      parameters: validParams.length > 0 ? validParams : undefined,
    };

    MockStorage.saveLabTestCatalog(newTest);
    showToast(
      editingTest ? 'Test Updated' : 'Test Added',
      `${catalogForm.testName} configured in Laboratory Catalog.`
    );
    setIsCatalogModalOpen(false);
    refreshData();
  };

  const handleToggleCatalogStatus = (test: LabTestCatalog) => {
    const nextStatus = test.status === 'inactive' ? 'active' : 'inactive';
    MockStorage.updateLabTestCatalogStatus(test.id, nextStatus);
    showToast('Catalog Status Changed', `${test.testName} is now ${nextStatus.toUpperCase()}.`);
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
        title={
          activeTab === 'orders'
            ? 'Diagnostic Work Orders'
            : activeTab === 'new-order'
            ? 'Place Diagnostic Lab Order'
            : 'Laboratory Test Catalog'
        }
        subtitle={
          activeTab === 'orders'
            ? 'Full lifecycle tracking: phlebotomy barcoding, multi-parameter results entry, and pathologist sign-offs'
            : activeTab === 'new-order'
            ? 'Submit a laboratory requisition with automated vacutainer tube selection & clinical priority'
            : 'Master directory of diagnostic tests, structured parameters, reference intervals, and fee schedules in INR (₹)'
        }
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          {
            label:
              activeTab === 'orders'
                ? 'Diagnostic Work Orders'
                : activeTab === 'new-order'
                ? 'Place Lab Order'
                : 'Test Catalog',
          },
        ]}
        actions={
          activeTab === 'orders' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  MockStorage.exportToCSV('Diagnostic_Work_Orders', filteredOrders);
                  showToast('Export Successful', 'Laboratory work orders downloaded as CSV.');
                }}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setActiveTab('new-order');
                  navigate('/hospital/laboratory/new-order');
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Place Lab Order
              </Button>
            </div>
          ) : activeTab === 'catalog' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  MockStorage.exportToCSV('Diagnostic_Test_Catalog', labCatalog);
                  showToast('Export Successful', 'Diagnostic test catalog downloaded as CSV.');
                }}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export Catalog
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenAddTest}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Diagnostic Test
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setActiveTab('orders');
                navigate('/hospital/laboratory/orders');
              }}
            >
              Back to Work Orders
            </Button>
          )
        }
      />

      {/* Operational Summary Cards (End-to-End Clinical Lifecycle) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Draw</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{pendingOrdersCount}</p>
              <p className="text-[9px] text-amber-700 font-medium">Nurse Queue</p>
            </div>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collected</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{samplesCollectedCount}</p>
              <p className="text-[9px] text-blue-700 font-medium">Nurse Done</p>
            </div>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Syringe className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">In Analysis</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{processingCount}</p>
              <p className="text-[9px] text-indigo-700 font-medium">Lab Tech</p>
            </div>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sign-Off</p>
              <p className="text-lg font-bold text-purple-700 mt-0.5">{awaitingSignOffCount}</p>
              <p className="text-[9px] text-purple-700 font-medium">Pathologist</p>
            </div>
            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Doctor Review</p>
              <p className="text-lg font-bold text-teal-700 mt-0.5">{verifiedCount}</p>
              <p className="text-[9px] text-teal-700 font-medium">Awaiting MD</p>
            </div>
            <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
              <Stethoscope className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nurse Action</p>
              <p className="text-lg font-bold text-orange-700 mt-0.5">{doctorReviewedCount}</p>
              <p className="text-[9px] text-orange-700 font-medium">Directives Issued</p>
            </div>
            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
              <CheckSquare className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Closed Loop</p>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{actionCompletedCount}</p>
              <p className="text-[9px] text-emerald-700 font-medium">Care Executed</p>
            </div>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      

      {/* SECTION 1: Diagnostic Work Orders Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader
            title="Clinical Diagnostic Orders"
            subtitle="Full lifecycle tracking: physician requisition, nurse specimen collection, automated laboratory analysis, doctor review, and bedside nursing execution"
          />

          <CardContent className="p-4 space-y-4">
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, barcode, test, directives..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="all">All Clinical Statuses</option>
                <option value="Pending Sample">Pending Nurse Collection</option>
                <option value="Sample Collected">Sample Collected (Nurse)</option>
                <option value="Processing">In Analyzer (Lab Tech)</option>
                <option value="Completed">Completed (Awaiting Sign-Off)</option>
                <option value="Verified">Verified (Awaiting Doctor Review)</option>
                <option value="Doctor Reviewed">Doctor Reviewed (Awaiting Nurse Action)</option>
                <option value="Action Completed">Action Completed (Closed Loop)</option>
                <option value="Sample Rejected">Sample Rejected</option>
              </select>

              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="all">All Ordering Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full min-w-[1280px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="w-[230px] min-w-[210px] px-4 py-3.5">Order & Barcode</th>
                    <th className="w-[170px] min-w-[150px] px-4 py-3.5">Patient Demographics</th>
                    <th className="w-[170px] min-w-[150px] px-4 py-3.5">Specimen & Tube Cap</th>
                    <th className="w-[150px] min-w-[130px] px-4 py-3.5">Ordering Physician</th>
                    <th className="w-[320px] min-w-[280px] px-4 py-3.5">Diagnostic Findings</th>
                    <th className="w-[160px] min-w-[140px] px-4 py-3.5">Workflow Status</th>
                    <th className="w-[190px] min-w-[180px] px-4 py-3.5 text-right">Clinical Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No laboratory orders found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Place a new lab requisition or change search filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isPendingSample = order.status === 'Ordered' || order.status === 'Pending Sample';
                      const isCollected = order.status === 'Sample Collected';
                      const isProcessing = order.status === 'In Progress' || order.status === 'Processing';
                      const isCompleted = order.status === 'Completed';
                      const isVerified = order.status === 'Verified';
                      const isDoctorReviewed = order.status === 'Doctor Reviewed';
                      const isActionCompleted = order.status === 'Action Completed';
                      const isRejected = order.status === 'Sample Rejected';
                      const isCritical = order.resultStatus === 'Critical';

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-slate-50/80 transition-colors align-top ${
                            isCritical ? 'bg-rose-50/40' : isRejected ? 'bg-slate-50/60 opacity-80' : ''
                          }`}
                        >
                          {/* Order & Barcode */}
                          <td className="px-4 py-3.5 align-top">
                            <p className="font-bold text-slate-900 leading-snug">{order.testName}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] font-mono font-medium text-indigo-600">{order.id}</span>
                              {order.barcodeNumber && (
                                <span className="font-mono text-[9px] bg-slate-100 text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded font-semibold tracking-wider">
                                  {order.barcodeNumber}
                                </span>
                              )}
                              {order.priority === 'Urgent' && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold animate-pulse">
                                  STAT
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Patient */}
                          <td className="px-4 py-3.5 align-top text-slate-800">
                            <p className="font-semibold text-slate-900">{order.patientName}</p>
                            <p className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
                              {order.patientAge}y • {order.patientGender}
                            </p>
                            <span className="font-mono text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-1">
                              ID: {order.patientId}
                            </span>
                          </td>

                          {/* Specimen & Tube */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11px]">
                                🧪 {order.sampleType || 'Blood'}
                              </span>
                              <div>{renderTubeBadge(order.tubeColor)}</div>
                              {order.collectedByNurseName && (
                                <div className="flex items-center gap-1 text-[10px] text-blue-700 font-medium pt-0.5">
                                  <span className="truncate">💉 {order.collectedByNurseName}</span>
                                  {order.collectedByNurseId && (
                                    <span className="shrink-0 text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-mono font-semibold">
                                      {order.collectedByNurseId}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Ordering Doctor */}
                          <td className="px-4 py-3.5 align-top text-slate-700">
                            <p className="font-semibold text-slate-800">{order.doctorName}</p>
                            <p className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">{order.orderDate}</p>
                          </td>

                          {/* Diagnostic Findings */}
                          <td className="px-4 py-3.5 align-top">
                            {order.resultValue ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`font-bold text-xs ${
                                      isCritical
                                        ? 'text-rose-600'
                                        : order.resultStatus === 'Abnormal'
                                        ? 'text-amber-600'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {order.resultValue}
                                  </span>
                                  {isCritical && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold uppercase">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                {order.resultItems && order.resultItems.length > 0 && (
                                  <p className="text-[10px] text-indigo-600 font-medium">
                                    {order.resultItems.filter((i) => i.isAbnormal || i.isCritical).length > 0
                                      ? `⚠️ ${order.resultItems.filter((i) => i.isAbnormal || i.isCritical).length} Flagged Parameters`
                                      : '✓ All Parameters in Range'}
                                  </p>
                                )}
                                {order.doctorInstructions && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-purple-50/70 border border-purple-100/80 text-[10px] space-y-1">
                                    <p className="text-purple-950 font-medium leading-relaxed" title={order.doctorInstructions}>
                                      👨‍⚕️ <strong className="font-bold">Directive:</strong> {order.doctorInstructions}
                                    </p>
                                    {order.nurseActionStatus === 'Completed' && (
                                      <div className="pt-1 border-t border-purple-200/60 text-emerald-900 font-medium leading-relaxed">
                                        <p className="truncate" title={order.nurseExecutionNotes}>
                                          👩‍⚕️ <strong className="font-bold text-emerald-950">Administered:</strong> {order.nurseExecutionNotes}
                                        </p>
                                        {order.executedByNurseName && (
                                          <span className="block mt-0.5 text-[9px] font-semibold text-emerald-800">
                                            — Nurse {order.executedByNurseName} {order.executedByNurseId ? `(${order.executedByNurseId})` : ''}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : isRejected ? (
                              <div className="text-rose-600 text-[11px] p-2 bg-rose-50 border border-rose-100 rounded-lg">
                                <span className="font-semibold">Rejected:</span> {order.rejectionReason}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Pending Laboratory Run</span>
                            )}
                          </td>

                          {/* Workflow Status */}
                          <td className="px-4 py-3.5 align-top whitespace-nowrap">
                            {isPendingSample && <Badge variant="neutral" dot>Pending Sample</Badge>}
                            {isCollected && <Badge variant="info" dot>Sample Collected</Badge>}
                            {isProcessing && <Badge variant="warning" dot>In Analysis</Badge>}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" /> Awaiting Sign-off
                              </span>
                            )}
                            {isVerified && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                <ShieldCheck className="w-3 h-3" /> Verified & Signed
                              </span>
                            )}
                            {isDoctorReviewed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                <Stethoscope className="w-3 h-3" /> Doctor Reviewed
                              </span>
                            )}
                            {isActionCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Action Completed
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <XCircle className="w-3 h-3" /> Sample Rejected
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1) Pending Sample -> Nurse prepares patient & collects sample */}
                              {isPendingSample && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleOpenCollectModal(order)}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                                    leftIcon={<Syringe className="w-3 h-3" />}
                                  >
                                    Prepare & Collect
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleOpenRejectModal(order)}
                                    title="Reject Sample"
                                    className="text-rose-600 hover:bg-rose-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}

                              {/* 2) Sample Collected -> Lab tech receives & processes sample */}
                              {isCollected && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleOpenReceiveModal(order)}
                                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold"
                                    leftIcon={<Activity className="w-3 h-3" />}
                                  >
                                    Receive & Process
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => handleOpenEnterResult(order)}
                                  >
                                    Enter Results
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleOpenRejectModal(order)}
                                    title="Reject Specimen (Hemolysis/Clotted)"
                                    className="text-rose-600 hover:bg-rose-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}

                              {/* 3) In Analysis -> Lab tech enters & finalizes results */}
                              {isProcessing && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => handleOpenEnterResult(order)}
                                  >
                                    Enter & Finalize
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleOpenRejectModal(order)}
                                    title="Reject Specimen"
                                    className="text-rose-600 hover:bg-rose-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}

                              {/* 4) Completed -> Pathologist Sign-Off */}
                              {isCompleted && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => handleOpenVerifyModal(order)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                                    leftIcon={<ShieldCheck className="w-3 h-3" />}
                                  >
                                    Sign Off
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleOpenPrintReport(order)}
                                    title="View Printable Diagnostic Report"
                                  >
                                    <Printer className="w-3 h-3" />
                                  </Button>
                                </>
                              )}

                              {/* 5) Verified -> Doctor Reviews Report & Issues Instructions */}
                              {isVerified && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => handleOpenDoctorReview(order)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                    leftIcon={<Stethoscope className="w-3 h-3" />}
                                  >
                                    Review & Advise
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleOpenPrintReport(order)}
                                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    leftIcon={<Printer className="w-3 h-3" />}
                                  >
                                    Report
                                  </Button>
                                </>
                              )}

                              {/* 6) Doctor Reviewed -> Nurse follows doctor instructions */}
                              {isDoctorReviewed && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => handleOpenNurseExec(order)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    leftIcon={<CheckSquare className="w-3 h-3" />}
                                  >
                                    Execute Directives
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleOpenPrintReport(order)}
                                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                    leftIcon={<Printer className="w-3 h-3" />}
                                  >
                                    Report
                                  </Button>
                                </>
                              )}

                              {/* Action Completed -> Closed Loop */}
                              {isActionCompleted && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleOpenPrintReport(order)}
                                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold"
                                  leftIcon={<Printer className="w-3 h-3" />}
                                >
                                  Report
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleViewOrder(order)}
                                title="Audit Log & Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
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
          </CardContent>
        </Card>
      )}

      {/* SECTION: Dedicated Place Lab Order Page */}
      {activeTab === 'new-order' && (
        <Card className="max-w-4xl mx-auto shadow-sm">
          <CardHeader
            title="Place Diagnostic Lab Requisition"
            subtitle="Submit a laboratory work order with automated vacutainer tube selection & clinical priority"
          />
          <CardContent className="p-6">
            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PatientCombobox
                  label="Search & Select Patient *"
                  required
                  hospitalId={hospId}
                  selectedPatientId={orderForm.patientId}
                  onSelectPatient={(p) => {
                    setSelectedPatient(p);
                    setOrderForm((prev) => ({ ...prev, patientId: p?.id || '' }));
                    if (p) setPatientError('');
                  }}
                  error={patientError}
                />

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Diagnostic Lab Test / Panel *"
                  value={orderForm.testId}
                  onChange={(e) => handleTestSelectionChange(e.target.value)}
                  required
                >
                  {activeCatalogTests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.testName} (₹{t.price.toLocaleString('en-IN')} — {t.tubeColor || t.sampleType})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Clinical Priority *"
                  value={orderForm.priority}
                  onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value as any })}
                >
                  <option value="Routine">Routine (Standard Turnaround)</option>
                  <option value="Urgent">STAT / Urgent (Emergency Priority)</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Specimen Matrix"
                  value={orderForm.specimenType}
                  onChange={(e) => setOrderForm({ ...orderForm, specimenType: e.target.value })}
                  placeholder="e.g. Blood, Serum, Urine"
                />

                <Input
                  label="Vacutainer Tube Cap Color"
                  value={orderForm.tubeColor}
                  onChange={(e) => setOrderForm({ ...orderForm, tubeColor: e.target.value })}
                  placeholder="e.g. Lavender / EDTA Tube"
                />
              </div>

              <Textarea
                label="Clinical Indication / Physician Remarks"
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                placeholder="Clinical symptoms, provisional diagnosis, or specimen draw instructions..."
                rows={3}
              />

              {/* Dynamic Live Preview Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Requisition Summary & Vacutainer Assignment
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Selected Investigation:</span>
                    <p className="font-bold text-slate-900">
                      {labCatalog.find((t) => t.id === orderForm.testId)?.testName || 'Investigation'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Assigned Cap Color:</span>
                    <div className="mt-1">{renderTubeBadge(orderForm.tubeColor)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Diagnostic Fee:</span>
                    <p className="font-bold text-slate-900 font-mono text-sm">
                      ₹{(labCatalog.find((t) => t.id === orderForm.testId)?.price || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Turnaround Time:</span>
                    <p className="font-semibold text-slate-800">
                      {labCatalog.find((t) => t.id === orderForm.testId)?.turnaroundHours || 24} Hours
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setActiveTab('orders');
                    navigate('/hospital/laboratory/orders');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                  Confirm & Issue Barcoded Lab Order
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: Laboratory Test Catalog Tab */}
      {activeTab === 'catalog' && (
        <Card>
          <CardHeader
            title="Laboratory Diagnostic Catalog & Multi-Parameter Panels"
            subtitle="Configure clinical tests, specimen cap requirements, automated reference ranges, and fee schedules in INR (₹)"
          />

          <CardContent className="p-4 space-y-4">
            {/* Quick Filter Pills Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCatalogPanelTypeFilter('all');
                    setCatalogStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    catalogPanelTypeFilter === 'all' && catalogStatusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Investigations ({catalogStats.total})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCatalogPanelTypeFilter('panels');
                    setCatalogStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${
                    catalogPanelTypeFilter === 'panels'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Multi-Parameter Panels ({catalogStats.panels})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCatalogPanelTypeFilter('single');
                    setCatalogStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    catalogPanelTypeFilter === 'single'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Single Tests ({catalogStats.single})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCatalogStatusFilter('active');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    catalogStatusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  Active ({catalogStats.active})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCatalogStatusFilter('inactive');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    catalogStatusFilter === 'inactive'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Inactive ({catalogStats.inactive})
                </button>
              </div>

              {(catalogSearchQuery ||
                catalogCategoryFilter !== 'all' ||
                catalogSampleTypeFilter !== 'all' ||
                catalogStatusFilter !== 'all' ||
                catalogPanelTypeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearchQuery('');
                    setCatalogCategoryFilter('all');
                    setCatalogSampleTypeFilter('all');
                    setCatalogStatusFilter('all');
                    setCatalogPanelTypeFilter('all');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              )}
            </div>

            {/* Dynamic Search & Multi-Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
              {/* Live Search Input with Parameter Deep Search */}
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search test name, code, parameter (e.g. Hemoglobin), specimen, tube..."
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                />
                {catalogSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Department / Category Filter */}
              <select
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="all">All Clinical Departments</option>
                {catalogCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Specimen / Sample Type Filter */}
              <select
                value={catalogSampleTypeFilter}
                onChange={(e) => setCatalogSampleTypeFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="all">All Specimen Types</option>
                {catalogSampleTypes.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* Investigation Type & Status Filter */}
              <select
                value={catalogPanelTypeFilter}
                onChange={(e) => setCatalogPanelTypeFilter(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="all">All Investigation Types</option>
                <option value="panels">Multi-Parameter Panels Only</option>
                <option value="single">Single Parameter Tests Only</option>
              </select>
            </div>

            {/* Filter Results Summary Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1">
              <p>
                Showing <strong className="text-slate-800">{filteredCatalog.length}</strong> of{' '}
                <strong className="text-slate-800">{labCatalog.length}</strong> clinical investigations & panels
                {catalogSearchQuery && (
                  <span>
                    {' '}matching &quot;<span className="text-indigo-600 font-semibold">{catalogSearchQuery}</span>&quot;
                  </span>
                )}
              </p>
              {catalogStats.panels > 0 && (
                <span className="text-[11px] text-teal-700 font-medium">
                  💡 Tip: Click on &quot;Clinical Parameters&quot; badge to expand and inspect panel intervals
                </span>
              )}
            </div>

            {/* Test Catalog Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Test Title & Code</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Specimen & Vacutainer Tube</th>
                    <th className="px-4 py-3">Turnaround Time</th>
                    <th className="px-4 py-3">Structured Parameters</th>
                    <th className="px-4 py-3">Fee Rate (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">
                          {labCatalog.length === 0
                            ? 'Test catalog is empty'
                            : 'No diagnostic tests match your search criteria'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {labCatalog.length === 0
                            ? 'Configure standard hospital lab tests and panels.'
                            : 'Try adjusting your search query, department, or specimen filters.'}
                        </p>
                        {labCatalog.length === 0 ? (
                          <Button variant="outline" size="sm" onClick={handleOpenAddTest} className="mt-3">
                            Add Diagnostic Test
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCatalogSearchQuery('');
                              setCatalogCategoryFilter('all');
                              setCatalogSampleTypeFilter('all');
                              setCatalogStatusFilter('all');
                              setCatalogPanelTypeFilter('all');
                            }}
                            className="mt-3"
                          >
                            Clear Search & Filters
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map((test) => {
                      const isInactive = test.status === 'inactive';
                      const paramCount = test.parameters?.length || 0;
                      const isExpanded = expandedCatalogTestIds.has(test.id);

                      return (
                        <React.Fragment key={test.id}>
                          <tr
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isInactive ? 'bg-slate-50/40 text-slate-400' : ''
                            } ${isExpanded ? 'bg-teal-50/30' : ''}`}
                          >
                            <td className="px-4 py-3.5">
                              <p className={`font-bold ${isInactive ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                {test.testName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] font-mono text-slate-400">{test.code}</span>
                                {paramCount > 0 && (
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                                    Panel
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                                {test.category}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              <p className="font-medium text-slate-700">{test.sampleType}</p>
                              <div className="mt-0.5">{renderTubeBadge(test.tubeColor)}</div>
                            </td>

                            <td className="px-4 py-3.5 text-slate-600">
                              {test.turnaroundHours} Hours
                            </td>

                            <td className="px-4 py-3.5">
                              {paramCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandCatalogTest(test.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] border transition-colors ${
                                    isExpanded
                                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                      : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                                  }`}
                                  title="Click to view structured panel parameters"
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>{paramCount} Clinical Parameters</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 ml-0.5" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 ml-0.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Single Value ({test.normalRange || 'Standard'})</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              ₹{test.price.toLocaleString('en-IN')}
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
                                  title="Edit Test & Parameters"
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

                          {/* Accordion Expanded Row for Multi-Parameter Panel Inspection */}
                          {isExpanded && paramCount > 0 && (
                            <tr className="bg-slate-50/90 border-b border-teal-100">
                              <td colSpan={8} className="p-4">
                                <div className="bg-white rounded-xl border border-teal-200/80 p-4 shadow-sm space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                                        <Layers className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                          <span>{test.testName}</span>
                                          <span className="font-mono text-[10px] text-slate-400">({test.code})</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-500">
                                          Multi-Parameter Clinical Profile • {paramCount} Defined Automated Parameters
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={() => handleOpenEditTest(test)}
                                      leftIcon={<Edit2 className="w-3 h-3" />}
                                    >
                                      Edit Panel & Parameters
                                    </Button>
                                  </div>

                                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                                          <th className="px-3 py-2 w-12 text-center">#</th>
                                          <th className="px-3 py-2">Clinical Parameter Name</th>
                                          <th className="px-3 py-2">Standard Biological Reference Interval</th>
                                          <th className="px-3 py-2">Unit</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {test.parameters?.map((param, pIdx) => (
                                          <tr key={param.id || pIdx} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">{pIdx + 1}</td>
                                            <td className="px-3 py-2 font-medium text-slate-900">{param.name}</td>
                                            <td className="px-3 py-2 font-mono text-slate-700">{param.referenceRange || 'Standard Limits'}</td>
                                            <td className="px-3 py-2 font-mono text-indigo-700 font-semibold">{param.unit || '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: Place Lab Order */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Place Diagnostic Lab Requisition"
        subtitle="Submit a laboratory work order with automated vacutainer tube selection"
        maxWidth="md"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <PatientCombobox
            label="Search & Select Patient *"
            required
            hospitalId={hospId}
            selectedPatientId={orderForm.patientId}
            onSelectPatient={(p) => {
              setSelectedPatient(p);
              setOrderForm((prev) => ({ ...prev, patientId: p?.id || '' }));
              if (p) setPatientError('');
            }}
            error={patientError}
          />

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
            label="Diagnostic Lab Test / Panel *"
            value={orderForm.testId}
            onChange={(e) => handleTestSelectionChange(e.target.value)}
            required
          >
            {activeCatalogTests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.testName} (₹{t.price} — {t.tubeColor || t.sampleType})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Specimen Type"
              value={orderForm.specimenType}
              onChange={(e) => setOrderForm({ ...orderForm, specimenType: e.target.value })}
              placeholder="e.g. Blood, Serum"
            />
            <Input
              label="Vacutainer Tube Cap"
              value={orderForm.tubeColor}
              onChange={(e) => setOrderForm({ ...orderForm, tubeColor: e.target.value })}
              placeholder="e.g. Lavender / EDTA"
            />
          </div>

          <Select
            label="Clinical Priority"
            value={orderForm.priority}
            onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value as any })}
          >
            <option value="Routine">Routine (Standard Turnaround)</option>
            <option value="Urgent">STAT / Urgent (Emergency Priority)</option>
          </Select>

          <Textarea
            label="Clinical Indication / Physician Remarks"
            value={orderForm.notes}
            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
            placeholder="Clinical diagnosis, symptoms, or special specimen precautions..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Issue Barcode
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Nurse Patient Preparation & Specimen Collection */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title="Patient Preparation & Specimen Collection"
        subtitle={`Requisition ${selectedOrder?.id} — ${selectedOrder?.patientName}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmCollection} className="space-y-4">
            {/* Visual Barcode Vacutainer Label Preview - Clean Light Clinical Specimen Label */}
            <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {currentHospital?.name ? `${currentHospital.name.toUpperCase()} • SPECIMEN` : 'TERTIARY HOSPITAL LAB SPECIMEN'}
                </span>
                <span
                  className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    selectedOrder.priority === 'Urgent'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedOrder.priority === 'Urgent' ? 'STAT / URGENT' : 'ROUTINE'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{selectedOrder.patientName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ID: <span className="font-mono font-medium text-slate-700">{selectedOrder.patientId}</span> • {selectedOrder.patientAge}y / {selectedOrder.patientGender}
                  </p>
                  <p className="text-xs text-indigo-700 font-semibold mt-1 truncate">
                    🧪 {selectedOrder.testName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="bg-white border border-slate-300 rounded-lg p-2 shadow-2xs inline-block text-center">
                    {/* High contrast barcode stripes (Black on White for authentic clinical scanning) */}
                    <div className="flex items-center justify-center gap-0.5 h-6 px-1" aria-hidden="true">
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1.5 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-2 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-1.5 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1.5 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-2 h-full bg-slate-900"></div>
                      <div className="w-0.5 h-full bg-slate-900"></div>
                      <div className="w-1 h-full bg-slate-900"></div>
                    </div>
                    <p className="font-mono text-[10px] font-bold text-slate-800 tracking-wider mt-1">{collectBarcode}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientPrepConfirmed}
                  onChange={(e) => setPatientPrepConfirmed(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                  required
                />
                <div>
                  <span className="text-xs font-bold text-blue-950">Patient Dual-ID & Clinical Preparation Confirmed *</span>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Verified patient wristband/MRN, confirmed pre-test preparation (fasting protocol, medications withheld as needed), and aseptic site disinfection.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Assigned Barcode ID *"
                value={collectBarcode}
                onChange={(e) => setCollectBarcode(e.target.value)}
                required
              />
              <Input
                label="Required Tube Cap *"
                value={collectTubeColor}
                onChange={(e) => setCollectTubeColor(e.target.value)}
                required
              />
            </div>

            {/* Nurse Selection from Hospital Nurses */}
            <div className="space-y-2">
              <Select
                label="Assigned Phlebotomy / Staff Nurse *"
                value={selectedCollectorNurseId}
                onChange={(e) => handleSelectCollectorNurse(e.target.value)}
                required
              >
                {hospitalNurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name} — {nurse.department || 'General Ward'} ({nurse.shift || 'General Shift'}) [ID: {nurse.id}]
                  </option>
                ))}
                <option value="NUR-CUSTOM">Other / Custom Nurse Name</option>
              </Select>

              {selectedCollectorNurseId === 'NUR-CUSTOM' && (
                <Input
                  label="Enter Nurse Full Name & Staff ID *"
                  value={nurseCollectorName}
                  onChange={(e) => setNurseCollectorName(e.target.value)}
                  placeholder="e.g. Sister Kavita Nair (Staff Nurse - Ward 4B)"
                  required
                />
              )}
            </div>

            <Textarea
              label="Preparation & Phlebotomy Notes"
              value={patientPrepNotes}
              onChange={(e) => setPatientPrepNotes(e.target.value)}
              placeholder="Patient preparation verification and venipuncture notes..."
              rows={2}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCollectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Syringe className="w-4 h-4" />}>
                Confirm Preparation & Collect Sample
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2B: Lab Technician Specimen Accessioning & Processing */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Specimen Accessioning & Analyzer Run"
        subtitle={`Specimen ${selectedOrder?.barcodeNumber || selectedOrder?.id} — ${selectedOrder?.testName}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmReceiveAndProcess} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{selectedOrder.patientName} (ID: {selectedOrder.patientId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Investigation:</span>
                <span className="font-bold text-indigo-700">{selectedOrder.testName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specimen & Tube:</span>
                <span className="font-semibold text-slate-800">{selectedOrder.sampleType} • {selectedOrder.tubeColor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Collected By:</span>
                <span className="font-semibold text-blue-700">
                  {selectedOrder.collectedByNurseName || 'Nursing Station'}
                  {selectedOrder.collectedByNurseId ? ` (${selectedOrder.collectedByNurseId})` : ''}
                  {' '}({selectedOrder.specimenCollectionDate || 'Recorded'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Barcode:</span>
                <span className="font-mono font-bold text-slate-800">{selectedOrder.barcodeNumber}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={specimenIntegrityConfirmed}
                  onChange={(e) => setSpecimenIntegrityConfirmed(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                  required
                />
                <div>
                  <span className="text-xs font-bold text-indigo-950">Pre-Analytical Specimen Integrity Verified *</span>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Inspected specimen volume (QNS check), checked for hemolysis, lipemia, or micro-clotting. Tube scanned and ready for analyzer accessioning.
                  </p>
                </div>
              </label>
            </div>

            <Input
              label="Medical Lab Technologist (Receiving) *"
              value={receiveTechnicianName}
              onChange={(e) => setReceiveTechnicianName(e.target.value)}
              placeholder="e.g. Liam Zhang (MLT)"
              required
            />

            <Select
              label="Assigned Clinical Analyzer / Workstation *"
              value={analyzerInstrument}
              onChange={(e) => setAnalyzerInstrument(e.target.value)}
              required
            >
              <option value="Automated 5-Part Hematology Analyzer (Sysmex XN-Series)">
                Automated 5-Part Hematology Analyzer (Sysmex XN-Series)
              </option>
              <option value="High-Throughput Clinical Chemistry Analyzer (Roche Cobas c501)">
                High-Throughput Clinical Chemistry Analyzer (Roche Cobas c501)
              </option>
              <option value="Chemiluminescent Immunoassay System (Abbott Architect)">
                Chemiluminescent Immunoassay System (Abbott Architect)
              </option>
              <option value="Automated Coagulation Analyzer (Stago STA-R)">
                Automated Coagulation Analyzer (Stago STA-R)
              </option>
              <option value="Automated Urine Chemistry & Microscopy Workstation">
                Automated Urine Chemistry & Microscopy Workstation
              </option>
              <option value="Molecular PCR Thermal Cycler & GeneXpert System">
                Molecular PCR Thermal Cycler & GeneXpert System
              </option>
            </Select>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsReceiveModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" leftIcon={<Activity className="w-4 h-4" />}>
                Receive & Load on Analyzer
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: Structured Multi-Parameter Result Entry */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Clinical Diagnostic Results Entry"
        subtitle={`Order ${selectedOrder?.id} — ${selectedOrder?.testName} (${selectedOrder?.barcodeNumber || 'No Barcode'})`}
        maxWidth="lg"
      >
        {selectedOrder && (() => {
          const catalogItem = labCatalog.find((t) => t.id === selectedOrder.testId || t.testName === selectedOrder.testName);
          const parameters = catalogItem?.parameters || [];

          return (
            <form onSubmit={handleSaveResult} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500">Patient:</span>
                  <p className="font-bold text-slate-900">{selectedOrder.patientName} ({selectedOrder.patientAge}y/{selectedOrder.patientGender})</p>
                </div>
                <div>
                  <span className="text-slate-500">Specimen / Cap:</span>
                  <p className="font-semibold text-slate-800">{selectedOrder.sampleType} • {selectedOrder.tubeColor}</p>
                </div>
                <div>
                  <span className="text-slate-500">Barcode:</span>
                  <p className="font-mono font-bold text-indigo-700">{selectedOrder.barcodeNumber}</p>
                </div>
              </div>

              {/* Multi-Parameter Grid */}
              {parameters.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Investigation Parameters ({parameters.length})
                    </p>
                    <span className="text-[11px] text-slate-400">Click Abn / Crit to flag out-of-range values</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Parameter</th>
                          <th className="px-3 py-2">Measured Value</th>
                          <th className="px-3 py-2">Unit</th>
                          <th className="px-3 py-2">Biological Reference</th>
                          <th className="px-3 py-2 text-right">Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parameters.map((p) => {
                          const state = parameterInputs[p.id] || { value: '', isAbnormal: false, isCritical: false };
                          return (
                            <tr
                              key={p.id}
                              className={state.isCritical ? 'bg-rose-50' : state.isAbnormal ? 'bg-amber-50/50' : ''}
                            >
                              <td className="px-3 py-2 font-medium text-slate-900">
                                {p.name}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={state.value}
                                  onChange={(e) => handleParameterValueChange(p.id, e.target.value)}
                                  placeholder="Enter value"
                                  className={`w-28 px-2 py-1 text-xs border rounded focus:outline-none ${
                                    state.isCritical
                                      ? 'border-rose-400 font-bold text-rose-700'
                                      : state.isAbnormal
                                      ? 'border-amber-400 font-semibold text-amber-700'
                                      : 'border-slate-300'
                                  }`}
                                />
                              </td>
                              <td className="px-3 py-2 text-slate-500 font-mono">{p.unit}</td>
                              <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{p.referenceRange}</td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleParameterFlagToggle(p.id, 'isAbnormal')}
                                    className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors ${
                                      state.isAbnormal
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    High/Low
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleParameterFlagToggle(p.id, 'isCritical')}
                                    className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors ${
                                      state.isCritical
                                        ? 'bg-rose-600 text-white animate-pulse'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    Critical!
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Observed Result Value *"
                    value={singleResultValue}
                    onChange={(e) => setSingleResultValue(e.target.value)}
                    placeholder="e.g. 14.2 g/dL or Reactive / Non-Reactive"
                    required
                  />
                  <Select
                    label="Evaluation Status"
                    value={overallResultStatus}
                    onChange={(e) => setOverallResultStatus(e.target.value as any)}
                  >
                    <option value="Normal">Normal (Within Reference Interval)</option>
                    <option value="Abnormal">Abnormal (Outside Biological Limits)</option>
                    <option value="Critical">Critical Panic Value (Requires Immediate Telephonic Alert)</option>
                  </Select>
                </div>
              )}

              <Textarea
                label="Technologist Bench Observations / Instrument Flags"
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="Equipment telemetry, calibration notes, slide morphology observation..."
                rows={2}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsResultModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Submit Results (Awaiting Verification)
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* MODAL 4: Pathologist Digital Sign-Off */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Pathologist Verification & Digital Sign-Off"
        subtitle={`Order ${selectedOrder?.id} — ${selectedOrder?.testName} for ${selectedOrder?.patientName}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmVerification} className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-1.5 text-purple-900">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-950">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                Two-Tier Clinical Sign-Off Protocol
              </div>
              <p className="text-[11px] text-purple-700">
                You are verifying analytical diagnostic findings before releasing this report to the patient and attending physician.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Test:</span>
                <span className="font-bold text-slate-900">{selectedOrder.testName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Result Summary:</span>
                <span className="font-bold text-indigo-700">{selectedOrder.resultValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Finding Status:</span>
                <Badge variant={selectedOrder.resultStatus === 'Critical' ? 'error' : selectedOrder.resultStatus === 'Abnormal' ? 'warning' : 'success'}>
                  {selectedOrder.resultStatus || 'Normal'}
                </Badge>
              </div>
              {selectedOrder.labTechnicianNotes && (
                <div className="pt-1 border-t border-slate-200 mt-1">
                  <span className="text-slate-500">Tech Notes:</span>
                  <p className="text-slate-700 font-mono text-[11px]">{selectedOrder.labTechnicianNotes}</p>
                </div>
              )}
            </div>

            <Input
              label="Verifying Pathologist Name / Credentials *"
              value={pathologistName}
              onChange={(e) => setPathologistName(e.target.value)}
              required
            />

            <Textarea
              label="Pathology Verification Remarks / Microscopic Impression"
              value={pathologistNotes}
              onChange={(e) => setPathologistNotes(e.target.value)}
              placeholder="e.g. Peripheral smear correlated. Normocytic normochromic RBCs. No atypical blasts seen."
              rows={3}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsVerifyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" leftIcon={<ShieldCheck className="w-4 h-4" />}>
                Digitally Sign & Release Report
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4B: Doctor Review of Lab Report & Post-Diagnostic Directives */}
      <Modal
        isOpen={isDoctorReviewModalOpen}
        onClose={() => setIsDoctorReviewModalOpen(false)}
        title="Doctor Clinical Review & Patient Directives"
        subtitle={`Order ${selectedOrder?.id} — ${selectedOrder?.testName} for ${selectedOrder?.patientName}`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmDoctorReview} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1.5 text-indigo-950">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-950">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                Attending Physician Diagnostic Review
              </div>
              <p className="text-[11px] text-indigo-800">
                Review the digitally verified laboratory findings, document your clinical interpretation, and issue specific patient directives for nursing execution.
              </p>
            </div>

            {/* Diagnostic Findings Snapshot */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <span className="text-slate-500">Patient:</span>
                  <p className="font-bold text-slate-900">{selectedOrder.patientName} ({selectedOrder.patientAge}y / {selectedOrder.patientGender})</p>
                </div>
                <div>
                  <span className="text-slate-500">Test:</span>
                  <p className="font-bold text-slate-900">{selectedOrder.testName}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Finding:</span>
                  <div>
                    <Badge variant={selectedOrder.resultStatus === 'Critical' ? 'error' : selectedOrder.resultStatus === 'Abnormal' ? 'warning' : 'success'}>
                      {selectedOrder.resultStatus || 'Normal'}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedOrder.resultItems && selectedOrder.resultItems.length > 0 ? (
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0">
                      <tr>
                        <th className="py-1 px-2">Parameter</th>
                        <th className="py-1 px-2">Observed</th>
                        <th className="py-1 px-2">Reference</th>
                        <th className="py-1 px-2 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedOrder.resultItems.map((item) => (
                        <tr key={item.parameterId} className={item.isCritical ? 'bg-rose-50 font-bold' : item.isAbnormal ? 'bg-amber-50' : ''}>
                          <td className="py-1 px-2">{item.parameterName}</td>
                          <td className="py-1 px-2 font-mono font-semibold">{item.value} {item.unit}</td>
                          <td className="py-1 px-2 font-mono text-slate-500">{item.referenceRange}</td>
                          <td className="py-1 px-2 text-right">
                            {item.isCritical ? (
                              <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold">CRITICAL</span>
                            ) : item.isAbnormal ? (
                              <span className="px-1 py-0.2 rounded bg-amber-500 text-white text-[9px] font-bold">ABNORMAL</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Result Value:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.resultValue}</span>
                </div>
              )}

              {selectedOrder.pathologistNotes && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800">Pathologist Note:</span> {selectedOrder.pathologistNotes} (Signed: {selectedOrder.verifiedBy})
                </div>
              )}
            </div>

            <Input
              label="Reviewing Physician Name *"
              value={reviewDoctorName}
              onChange={(e) => setReviewDoctorName(e.target.value)}
              placeholder="e.g. Dr. Arvind Sharma"
              required
            />

            <Textarea
              label="Doctor Clinical Interpretation & Impression *"
              value={doctorClinicalImpression}
              onChange={(e) => setDoctorClinicalImpression(e.target.value)}
              placeholder="Summary impression of the test findings and diagnostic diagnosis..."
              rows={2}
              required
            />

            <Textarea
              label="Clinical Orders / Instructions for Nursing Staff *"
              value={doctorInstructions}
              onChange={(e) => setDoctorInstructions(e.target.value)}
              placeholder="Specific bedside action: e.g. Administer 500ml normal saline STAT, withhold ACE inhibitors, monitor BP every 2 hours..."
              rows={3}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDoctorReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" leftIcon={<Stethoscope className="w-4 h-4" />}>
                Record Review & Dispatch Directives to Nurse
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4C: Nurse Follow-Up & Directive Execution */}
      <Modal
        isOpen={isNurseExecModalOpen}
        onClose={() => setIsNurseExecModalOpen(false)}
        title="Nurse Follow-Up & Directive Execution"
        subtitle={`Order ${selectedOrder?.id} — ${selectedOrder?.patientName}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmNurseExec} className="space-y-4">
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-purple-950 text-sm">
                <Stethoscope className="w-4 h-4 text-purple-700" />
                Attending Physician Clinical Directives
              </div>
              <p className="text-purple-900 font-semibold text-xs bg-white/80 p-2.5 rounded-lg border border-purple-100">
                "{selectedOrder.doctorInstructions || 'Follow routine post-diagnostic bedside protocol.'}"
              </p>
              <p className="text-[10px] text-purple-700">
                Ordered by Dr. {selectedOrder.reviewedByDoctorName || selectedOrder.doctorName} on {selectedOrder.doctorReviewDate || 'Today'}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nurseExecutionConfirmed}
                  onChange={(e) => setNurseExecutionConfirmed(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  required
                />
                <div>
                  <span className="text-xs font-bold text-emerald-950">Directives Executed & Patient Care Rendered *</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    I confirm that the physician's instructions have been administered at the bedside, vital signs monitored, and recorded in patient chart.
                  </p>
                </div>
              </label>
            </div>

            {/* Nurse Selection from Hospital Nurses */}
            <div className="space-y-2">
              <Select
                label="Executing Staff Nurse (Loop Closure) *"
                value={selectedExecNurseId}
                onChange={(e) => handleSelectExecNurse(e.target.value)}
                required
              >
                {hospitalNurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name} — {nurse.department || 'ICU / Inpatient Ward'} ({nurse.shift || 'On Duty'}) [ID: {nurse.id}]
                  </option>
                ))}
                <option value="NUR-CUSTOM">Other / Custom Nurse Name</option>
              </Select>

              {selectedExecNurseId === 'NUR-CUSTOM' && (
                <Input
                  label="Enter Executing Nurse Full Name *"
                  value={executingNurseName}
                  onChange={(e) => setExecutingNurseName(e.target.value)}
                  placeholder="e.g. Sister Kavita Nair (Staff Nurse)"
                  required
                />
              )}
            </div>

            <Textarea
              label="Nursing Bedside Notes & Clinical Response *"
              value={nurseExecutionNotes}
              onChange={(e) => setNurseExecutionNotes(e.target.value)}
              placeholder="e.g. Administered prescribed medication. Patient vitals stable (BP 124/82, HR 74). Resting comfortably."
              rows={3}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNurseExecModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" leftIcon={<CheckSquare className="w-4 h-4" />}>
                Complete Action & Close Lifecycle
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 5: Sample Rejection Workflow */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Specimen Rejection & Recollection"
        subtitle={`Order ${selectedOrder?.id} — ${selectedOrder?.patientName}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmRejection} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Standard Pre-Analytical Rejection Protocol</p>
                <p className="text-[11px] mt-0.5">
                  Sub-standard samples lead to erroneous clinical decisions. Rejection logs provide CAP/NABL compliance tracking.
                </p>
              </div>
            </div>

            <Select
              label="Clinical Rejection Reason *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            >
              <option value="Hemolyzed Specimen (Free Hb interfering with photometric assay)">
                Hemolyzed Specimen (Free Hb / RBC lysis)
              </option>
              <option value="Clotted Blood (EDTA microclots invalidating cell count)">
                Clotted Blood (Microclots in EDTA vacutainer)
              </option>
              <option value="Quantity Not Sufficient (QNS / Underfilled Tube)">
                Quantity Not Sufficient (QNS / Underfilled Tube)
              </option>
              <option value="Wrong Vacutainer Tube / Incompatible Additive">
                Wrong Vacutainer Tube / Incompatible Additive
              </option>
              <option value="Patient Identification Discrepancy on Label">
                Patient Identification / Label Discrepancy
              </option>
              <option value="Severe Lipemia / Icteric Specimen">
                Severe Lipemia / Icteric Specimen
              </option>
              <option value="Transit Delay Exceeding Stability Limit">
                Transit Delay Exceeding Stability Limit
              </option>
            </Select>

            <Textarea
              label="Additional Laboratory Remarks"
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="e.g. Visual inspection showed 3+ hemolysis. Phlebotomy contacted for redraw."
              rows={2}
            />

            <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={requestRedraw}
                onChange={(e) => setRequestRedraw(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-800 font-medium">
                Immediately Schedule Free Specimen Redraw (Urgent STAT Requisition)
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" leftIcon={<XCircle className="w-4 h-4" />}>
                Confirm Sample Rejection
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 6: Official Hospital Diagnostic Report (Printable) */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Official Diagnostic Laboratory Report"
        subtitle={`NABL Accredited Clinical Pathology & Molecular Diagnostic Services`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Printable Report Document */}
            <div id="printable-lab-report" className="p-6 bg-white border border-slate-300 rounded-xl text-slate-900 space-y-4 font-sans shadow-sm">
              {/* Hospital Header */}
              <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-indigo-950 uppercase tracking-tight">
                    {currentHospital?.name || 'Apex City Medical Center & Research Institute'}
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-600">
                    Department of Laboratory Medicine & Molecular Pathology
                  </p>
                  <p className="text-[10px] text-slate-500">
                    NABL Accredited • ISO 15189:2012 Certified Laboratory • Cert. No: MC-4921
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-300">
                    {selectedOrder.barcodeNumber || selectedOrder.id}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Report ID: REP-{selectedOrder.id}</p>
                </div>
              </div>

              {/* Patient Demographics & Reference Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Patient Name</span>
                  <p className="font-bold text-slate-900">{selectedOrder.patientName}</p>
                  <p className="text-[10px] text-slate-500">{selectedOrder.patientAge} Yrs / {selectedOrder.patientGender}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Patient ID / MRN</span>
                  <p className="font-mono font-semibold text-slate-800">{selectedOrder.patientId}</p>
                  <span className="text-[10px] uppercase text-slate-500 font-bold mt-1 block">Priority</span>
                  <span className={`text-[10px] font-extrabold ${selectedOrder.priority === 'Urgent' ? 'text-rose-600' : 'text-slate-700'}`}>
                    {selectedOrder.priority || 'Routine'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Referring Physician</span>
                  <p className="font-semibold text-slate-800">{selectedOrder.doctorName}</p>
                  <span className="text-[10px] uppercase text-slate-500 font-bold mt-1 block">Specimen / Cap</span>
                  <p className="text-[11px] text-slate-700">{selectedOrder.sampleType} • {selectedOrder.tubeColor}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Collected On</span>
                  <p className="text-[11px] text-slate-700">{selectedOrder.specimenCollectionDate || selectedOrder.orderDate}</p>
                  {selectedOrder.collectedByNurseName && (
                    <p className="text-[10px] text-blue-700 font-medium">
                      By: {selectedOrder.collectedByNurseName}
                      {selectedOrder.collectedByNurseId && ` (${selectedOrder.collectedByNurseId})`}
                    </p>
                  )}
                  <span className="text-[10px] uppercase text-slate-500 font-bold mt-1 block">Reported On</span>
                  <p className="text-[11px] text-slate-700">{selectedOrder.completedDate || selectedOrder.orderDate}</p>
                </div>
              </div>

              {/* Investigation Title */}
              <div className="bg-indigo-50 text-indigo-900 px-3 py-1.5 rounded font-bold text-xs flex justify-between items-center">
                <span>INVESTIGATION: {selectedOrder.testName.toUpperCase()}</span>
                <span className="text-[11px] font-normal">Method: Automated Spectrophotometry / Flow Cytometry</span>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-2 px-1">Test Parameter</th>
                      <th className="py-2 px-1">Observed Value</th>
                      <th className="py-2 px-1">Flag</th>
                      <th className="py-2 px-1">Unit</th>
                      <th className="py-2 px-1">Biological Reference Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOrder.resultItems && selectedOrder.resultItems.length > 0 ? (
                      selectedOrder.resultItems.map((item) => (
                        <tr key={item.parameterId} className={item.isCritical ? 'bg-rose-50/60 font-semibold' : ''}>
                          <td className="py-2 px-1 font-medium text-slate-900">{item.parameterName}</td>
                          <td className="py-2 px-1 font-bold text-slate-900">{item.value || '—'}</td>
                          <td className="py-2 px-1">
                            {item.isCritical ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold">CRITICAL</span>
                            ) : item.isAbnormal ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold">ABNORMAL</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Normal</span>
                            )}
                          </td>
                          <td className="py-2 px-1 font-mono text-slate-600">{item.unit}</td>
                          <td className="py-2 px-1 font-mono text-slate-600">{item.referenceRange}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2 px-1 font-medium text-slate-900">{selectedOrder.testName}</td>
                        <td className="py-2 px-1 font-bold text-slate-900">{selectedOrder.resultValue}</td>
                        <td className="py-2 px-1">
                          {selectedOrder.resultStatus === 'Critical' ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold">CRITICAL</span>
                          ) : selectedOrder.resultStatus === 'Abnormal' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold">ABNORMAL</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Normal</span>
                          )}
                        </td>
                        <td className="py-2 px-1 font-mono text-slate-600">—</td>
                        <td className="py-2 px-1 font-mono text-slate-600">{selectedOrder.referenceRange || 'Standard Limits'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Clinical Impressions & Signatures */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-700 text-[11px] mb-1">Pathologist Opinion & Correlation:</p>
                  <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                    {selectedOrder.pathologistNotes || selectedOrder.labTechnicianNotes || 'Results clinically correlated with patient symptoms. Values out of reference limits highlighted.'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <QrCode className="w-5 h-5 text-slate-700" />
                    <span>Scan QR code with any hospital terminal to verify authenticity</span>
                  </div>
                </div>

                <div className="flex flex-col justify-end items-end text-right">
                  <div className="border border-purple-200 bg-purple-50/60 p-3 rounded-lg max-w-[260px] text-right">
                    <div className="flex items-center justify-end gap-1 text-purple-700 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Digitally Verified
                    </div>
                    <p className="font-bold text-slate-900 mt-1">{selectedOrder.verifiedBy || 'Dr. Anita Roy, MD'}</p>
                    <p className="text-[10px] text-slate-500">Consultant Pathologist & Lab Director</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">Signed: {selectedOrder.verifiedDate || selectedOrder.completedDate}</p>
                  </div>
                </div>
              </div>

              {/* Attending Physician Review & Nurse Execution Tracking */}
              {(selectedOrder.doctorInstructions || selectedOrder.nurseActionStatus) && (
                <div className="pt-3 border-t-2 border-dashed border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-[11px]">
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                      Attending Physician Review & Directives
                    </div>
                    <p className="text-slate-800 font-medium bg-white p-2 rounded border border-indigo-100 text-[11px]">
                      {selectedOrder.doctorInstructions}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Reviewed by: Dr. {selectedOrder.reviewedByDoctorName || selectedOrder.doctorName} ({selectedOrder.doctorReviewDate || 'Recorded'})
                    </p>
                  </div>
                  {selectedOrder.nurseExecutionNotes && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px]">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Nursing Bedside Care & Directive Execution
                      </div>
                      <p className="text-slate-800 font-medium bg-white p-2 rounded border border-emerald-100 text-[11px]">
                        {selectedOrder.nurseExecutionNotes}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Administered by: {selectedOrder.executedByNurseName} {selectedOrder.executedByNurseId ? `(Staff ID: ${selectedOrder.executedByNurseId})` : ''} ({selectedOrder.nurseExecutionDate || 'Recorded'})
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Fee Paid: ₹{selectedOrder.fee || 0} • Status: {selectedOrder.status}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    MockStorage.exportToCSV(`Lab_Report_${selectedOrder.id}`, [
                      {
                        Order_ID: selectedOrder.id,
                        Test_Name: selectedOrder.testName,
                        Category: selectedOrder.category,
                        Patient_Name: selectedOrder.patientName,
                        UHID: selectedOrder.patientId,
                        Doctor: selectedOrder.doctorName,
                        Status: selectedOrder.status,
                        Sample_Type: selectedOrder.sampleType,
                        Result_Value: selectedOrder.resultValue || 'Pending',
                        Reference_Range: selectedOrder.referenceRange || 'N/A',
                        Notes: selectedOrder.labTechnicianNotes || 'None',
                        Date: selectedOrder.orderDate,
                      },
                    ]);
                    showToast('Report Downloaded', `Lab report ${selectedOrder.id} downloaded as CSV.`);
                  }}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Official Diagnostic Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 7: View Full Order Details */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Diagnostic Order Audit Summary"
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
                <span className="text-slate-500">Barcode ID:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedOrder.barcodeNumber || 'Pending Draw'}</span>
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
                <span className="text-slate-500">Vacutainer Tube:</span>
                <span className="font-semibold text-slate-800">{selectedOrder.tubeColor || selectedOrder.sampleType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Priority:</span>
                <span className={`font-bold ${selectedOrder.priority === 'Urgent' ? 'text-rose-600' : 'text-slate-900'}`}>
                  {selectedOrder.priority || 'Routine'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <Badge variant={selectedOrder.status === 'Verified' || selectedOrder.status === 'Action Completed' ? 'success' : selectedOrder.status === 'Sample Rejected' ? 'error' : 'info'}>
                  {selectedOrder.status}
                </Badge>
              </div>
            </div>

            {selectedOrder.collectedByNurseName && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-slate-900">
                <p className="font-bold text-xs text-blue-950 flex items-center gap-1">
                  <Syringe className="w-3.5 h-3.5 text-blue-700" /> Specimen Phlebotomy & Preparation
                </p>
                <p className="text-xs text-blue-900 mt-1">
                  Collected by {selectedOrder.collectedByNurseName}
                  {selectedOrder.collectedByNurseId && (
                    <span className="ml-1.5 font-mono text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold border border-blue-200">
                      ID: {selectedOrder.collectedByNurseId}
                    </span>
                  )}
                  {' on '}{selectedOrder.specimenCollectionDate}
                </p>
                {selectedOrder.patientPreparationNotes && (
                  <p className="text-[11px] text-blue-800 mt-0.5 italic">Note: {selectedOrder.patientPreparationNotes}</p>
                )}
              </div>
            )}

            {selectedOrder.receivedByTechnician && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-slate-900">
                <p className="font-bold text-xs text-indigo-950 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-700" /> Laboratory Accessioning & Analyzer Run
                </p>
                <p className="text-xs text-indigo-900 mt-1">Processed by {selectedOrder.receivedByTechnician} on {selectedOrder.sampleReceivedDate}</p>
                {selectedOrder.analyzerInstrument && (
                  <p className="text-[11px] text-indigo-800 mt-0.5">Instrument: {selectedOrder.analyzerInstrument}</p>
                )}
              </div>
            )}

            {selectedOrder.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                <p className="font-bold">Specimen Rejection Recorded:</p>
                <p className="text-[11px] mt-0.5">{selectedOrder.rejectionReason}</p>
                <p className="text-[10px] text-rose-600 mt-1">Logged by: {selectedOrder.rejectedBy} on {selectedOrder.rejectionDate}</p>
              </div>
            )}

            {selectedOrder.resultValue && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Diagnostic Findings:</p>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-slate-900">
                  <p className="font-bold text-sm text-emerald-950">{selectedOrder.resultValue}</p>
                  <p className="text-[11px] text-slate-600 mt-1">Evaluation: {selectedOrder.resultStatus}</p>
                  {selectedOrder.verifiedBy && (
                    <p className="text-[10px] text-emerald-700 mt-1 pt-1 border-t border-emerald-200">
                      ✓ Verified by {selectedOrder.verifiedBy} ({selectedOrder.verifiedDate})
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.doctorInstructions && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-slate-900">
                <p className="font-bold text-xs text-purple-950 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-700" /> Attending Physician Clinical Directives
                </p>
                <p className="text-xs text-purple-900 mt-1">{selectedOrder.doctorInstructions}</p>
                <p className="text-[10px] text-purple-600 mt-1">Issued by Dr. {selectedOrder.reviewedByDoctorName || selectedOrder.doctorName} on {selectedOrder.doctorReviewDate}</p>
              </div>
            )}

            {selectedOrder.nurseExecutionNotes && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-slate-900">
                <p className="font-bold text-xs text-emerald-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Nursing Execution Record
                </p>
                <p className="text-xs text-emerald-900 mt-1">{selectedOrder.nurseExecutionNotes}</p>
                <p className="text-[10px] text-emerald-600 mt-1">
                  Administered by {selectedOrder.executedByNurseName}
                  {selectedOrder.executedByNurseId && (
                    <span className="ml-1.5 font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                      ID: {selectedOrder.executedByNurseId}
                    </span>
                  )}
                  {' on '}{selectedOrder.nurseExecutionDate}
                </p>
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

      {/* MODAL 8: Add / Edit Diagnostic Catalog Test */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title={editingTest ? 'Edit Diagnostic Test & Panels' : 'Add Diagnostic Investigation'}
        subtitle="Configure lab test parameters, tube cap color, structured reference intervals, and fee schedules in INR (₹)"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCatalogTest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Test Title *"
              value={catalogForm.testName}
              onChange={(e) => setCatalogForm({ ...catalogForm, testName: e.target.value })}
              placeholder="e.g. Complete Blood Count (CBC) or Lipid Profile"
              required
            />
            <Input
              label="Test Code *"
              value={catalogForm.code}
              onChange={(e) => setCatalogForm({ ...catalogForm, code: e.target.value })}
              placeholder="e.g. CBC-001 or LIPID-001"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category / Department *"
              value={catalogForm.category}
              onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
              required
            >
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Immunology">Immunology / Serology</option>
              <option value="Microbiology">Microbiology & Culture</option>
              <option value="Clinical Pathology">Clinical Pathology</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Molecular Diagnostics">Molecular Diagnostics</option>
            </Select>

            <Select
              label="Sample Specimen *"
              value={catalogForm.sampleType}
              onChange={(e) => setCatalogForm({ ...catalogForm, sampleType: e.target.value })}
              required
            >
              <option value="Blood">Blood (Whole)</option>
              <option value="Serum">Serum</option>
              <option value="Plasma">Plasma</option>
              <option value="Urine">Urine</option>
              <option value="Stool">Stool</option>
              <option value="Swab">Swab / Culture</option>
              <option value="CSF">CSF / Body Fluid</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Vacutainer Tube Cap *"
              value={catalogForm.tubeColor}
              onChange={(e) => setCatalogForm({ ...catalogForm, tubeColor: e.target.value })}
              required
            >
              <option value="Lavender / EDTA Tube">Lavender / EDTA Tube</option>
              <option value="Gold / SST Gel Clot Tube">Gold / SST Gel Clot Tube</option>
              <option value="Red / Plain Clot Tube">Red / Plain Clot Tube</option>
              <option value="Grey / Sodium Fluoride Tube">Grey / Sodium Fluoride Tube</option>
              <option value="Light Blue / Sodium Citrate Tube">Light Blue / Citrate Tube</option>
              <option value="Green / Sodium Heparin Tube">Green / Heparin Tube</option>
              <option value="Yellow / ACD Solution Tube">Yellow / ACD Solution Tube</option>
              <option value="Sterile Container (Urine/Stool)">Sterile Container (Urine/Stool)</option>
            </Select>

            <Input
              label="Fee Rate (₹) *"
              type="number"
              value={catalogForm.price}
              onChange={(e) => setCatalogForm({ ...catalogForm, price: Number(e.target.value) })}
              required
            />

            <Input
              label="Turnaround Time (Hours) *"
              type="number"
              value={catalogForm.turnaroundHours}
              onChange={(e) => setCatalogForm({ ...catalogForm, turnaroundHours: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Status *"
              value={catalogForm.status}
              onChange={(e) => setCatalogForm({ ...catalogForm, status: e.target.value as any })}
              required
            >
              <option value="active">Active (Available for Orders)</option>
              <option value="inactive">Inactive (Decommissioned)</option>
            </Select>

            {catalogForm.parameters.length === 0 && (
              <Input
                label="Normal Reference Range"
                value={catalogForm.normalRange}
                onChange={(e) => setCatalogForm({ ...catalogForm, normalRange: e.target.value })}
                placeholder="e.g. 13.0 - 17.0 g/dL or < 100 mg/dL"
              />
            )}
          </div>

          {/* Structured Multi-Parameter Panel Editor */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  Structured Clinical Parameters ({catalogForm.parameters.length})
                </h4>
                {catalogForm.parameters.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                    Multi-Parameter Panel
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {catalogForm.parameters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCatalogForm((prev) => ({ ...prev, parameters: [] }))}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Clear Parameters (Convert to Single Test)
                  </button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddParameterToForm}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-teal-600" />}
                >
                   Add Clinical Parameter
                </Button>
              </div>
            </div>

            {catalogForm.parameters.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                This investigation is currently configured as a single-value diagnostic test. Click &quot;+ Add Clinical Parameter&quot; above to convert it into a multi-parameter diagnostic panel (e.g. CBC, Lipid Profile, LFT, KFT).
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {catalogForm.parameters.map((param, idx) => (
                  <div
                    key={param.id || idx}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Parameter Name (e.g. Hemoglobin)"
                        value={param.name}
                        onChange={(e) => handleUpdateParameterInForm(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                        required
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Biological Reference Interval (e.g. 13.0 - 17.0)"
                        value={param.referenceRange}
                        onChange={(e) => handleUpdateParameterInForm(idx, 'referenceRange', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unit (e.g. g/dL)"
                        value={param.unit}
                        onChange={(e) => handleUpdateParameterInForm(idx, 'unit', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700"
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveParameterFromForm(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove Parameter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCatalogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Diagnostic Test & Panel
            </Button>
          </div>
        </form>
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
