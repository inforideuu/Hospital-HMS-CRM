import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { MockStorage } from '../../../services/mockStorage';
import {
  User,
  Ambulance,
  AmbulanceDriver,
  EmergencyRequest,
  EmergencyPriority,
  AmbulanceMaintenance,
  AmbulanceType,
  AmbulanceStatus,
  AmbulanceOwnershipType,
  AmbulanceFuelType,
  AmbulanceStaffRole,
  AmbulanceEmploymentType,
  AmbulanceDutyStatus,
  AmbulanceShiftType,
  AmbulanceAvailabilityStatus,
  MaintenanceCategory,
  MaintenanceStatus,
  VehicleAvailabilityDuringMaintenance,
  SafetyInspectionResult
} from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Tabs } from '../../../components/ui/Tabs';
import { StatCard } from '../../../components/ui/StatCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Ambulance as AmbulanceIcon,
  MapPin,
  Clock,
  Radio,
  Plus,
  Search,
  Download,
  Flame,
  CheckCircle2,
  Wrench,
  UserCheck,
  Fuel,
  Send,
  Navigation,
  Check,
  X,
  FileText,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Calendar,
  Layers,
  Heart,
  Upload,
  User as UserIcon,
  Phone,
  Mail,
  Truck,
  CheckSquare,
  Square,
  Edit,
  Trash2
} from 'lucide-react';

const STANDARD_EQUIPMENT_CHECKLIST = [
  'Oxygen Cylinder & Flowmeter',
  'Foldable Stretcher & Trolley',
  'Automated External Defibrillator (AED)',
  'Multi-Para Cardiac Monitor',
  'Suction Unit (Electric & Manual)',
  'Spine Board & Head Immobilizer',
  'Cervical Collars Kit',
  'Portable Ventilator',
  'IV Infusion Stand & Syringe Pump',
  'First Aid Trauma Dressing Bag',
  'Nebulizer Kit',
  'Emergency Resuscitation Drugs Box'
];

export const AmbulanceManagement: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospitalId = user?.hospitalId || 'HOSP-001';
  const hospitalName = currentHospital?.name || 'Apex Medical Center';

  const [activeTab, setActiveTab] = useState('dispatch');
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [drivers, setDrivers] = useState<AmbulanceDriver[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<AmbulanceMaintenance[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  // Modals for Actions
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedRequestForDispatch, setSelectedRequestForDispatch] = useState<EmergencyRequest | null>(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Emergency Queue Sub-filter & Clear State ('active' | 'completed' | 'all')
  const [emergencyFilter, setEmergencyFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [requestToClear, setRequestToClear] = useState<EmergencyRequest | null>(null);

  const activeEmergencies = useMemo(
    () => emergencyRequests.filter((r) => r.status !== 'Completed' && r.status !== 'Cancelled'),
    [emergencyRequests]
  );
  const completedEmergencies = useMemo(
    () => emergencyRequests.filter((r) => r.status === 'Completed'),
    [emergencyRequests]
  );
  const displayedEmergencies = useMemo(() => {
    if (emergencyFilter === 'active') return activeEmergencies;
    if (emergencyFilter === 'completed') return completedEmergencies;
    return emergencyRequests;
  }, [emergencyFilter, activeEmergencies, completedEmergencies, emergencyRequests]);

  // Modals for Detailed Views
  const [selectedAmbulanceDetails, setSelectedAmbulanceDetails] = useState<Ambulance | null>(null);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState<AmbulanceDriver | null>(null);
  const [selectedMaintenanceDetails, setSelectedMaintenanceDetails] = useState<AmbulanceMaintenance | null>(null);

  // State for Editing & Deleting
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null);
  const [ambulanceToDelete, setAmbulanceToDelete] = useState<Ambulance | null>(null);

  const [editingDriver, setEditingDriver] = useState<AmbulanceDriver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<AmbulanceDriver | null>(null);

  const [editingMaintenance, setEditingMaintenance] = useState<AmbulanceMaintenance | null>(null);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<AmbulanceMaintenance | null>(null);

  // Manual Emergency Dispatch Call Form State (for ambulance manager)
  const [isManualEmergencyModalOpen, setIsManualEmergencyModalOpen] = useState(false);
  const [manualEmergencyForm, setManualEmergencyForm] = useState({
    patientName: '',
    patientPhone: '',
    pickupLocation: '',
    emergencyType: 'Cardiac Arrest / Severe Chest Pain',
    priority: 'Critical / Code Blue' as EmergencyPriority,
    chiefComplaint: '',
    assignedAmbulanceId: '',
    assignedDriverId: '',
  });

  // 1. ADD AMBULANCE FORM STATE
  const [isAddAmbulanceModalOpen, setIsAddAmbulanceModalOpen] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({
    // Identification & registration
    regNumber: '',
    registrationDate: new Date().toISOString().split('T')[0],
    registrationExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    chassisNumber: '',
    engineNumber: '',
    ownershipType: 'Owned' as AmbulanceOwnershipType,

    // Specifications
    model: '',
    type: 'Advanced Life Support (ALS)' as AmbulanceType,
    manufacturingYear: new Date().getFullYear(),
    seatingCapacity: 4,
    patientCapacity: 1,
    odometerReading: 15000,
    mileageKm: 15000,
    fuelType: 'Diesel' as AmbulanceFuelType,
    fuelLevel: 100,

    // Operational details
    status: 'Available' as AmbulanceStatus,
    assignedDriverId: '',
    assignedDriverName: '',
    driverPhone: '',
    assignedParamedic: '',
    homeBranch: 'Apex Main Hospital',
    currentLocation: 'Base Station Alpha',

    // Compliance & documents
    insurancePolicyNumber: '',
    insuranceExpiryDate: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
    fitnessCertExpiryDate: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
    permitExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    pucExpiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],

    // Equipment & readiness
    equipmentCategory: 'Class A (Critical Telemetry)' as Ambulance['equipmentCategory'],
    oxygenCylinderAvailable: 'Yes' as 'Yes' | 'No',
    stretcherAvailable: 'Yes' as 'Yes' | 'No',
    defibrillatorAvailable: 'Yes' as 'Yes' | 'No' | 'Not Applicable',
    equipmentChecklist: ['Oxygen Cylinder & Flowmeter', 'Foldable Stretcher & Trolley', 'Multi-Para Cardiac Monitor', 'First Aid Trauma Dressing Bag'],
    lastSafetyInspectionDate: new Date().toISOString().split('T')[0],
    lastMaintenanceDate: new Date().toISOString().split('T')[0],
    nextMaintenanceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],

    // Additional details
    vehiclePhotoUrl: '',
    notes: '',
  });

  // 2. ADD DRIVER / PARAMEDIC FORM STATE
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    // Staff identification
    employeeId: '',
    name: '',
    role: 'Ambulance Driver' as AmbulanceStaffRole,
    avatarUrl: '',

    // Personal & contact details
    email: '',
    phone: '',
    alternativePhone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelationship: 'Spouse',

    // Licence and certification
    licenseNumber: '',
    licenseType: 'Commercial Heavy / EVOC',
    licenseIssueDate: new Date(Date.now() - 365 * 86400000 * 3).toISOString().split('T')[0],
    licenseExpiry: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],
    evocCertExpiry: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],
    cprCertExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    medicalClearanceExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],

    // Employment details
    dateOfJoining: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time' as AmbulanceEmploymentType,
    dutyStatus: 'Active' as AmbulanceDutyStatus,
    status: 'active',
    assignedBranch: 'Apex Main Hospital',

    // Duty and shift management
    shiftType: 'Morning' as AmbulanceShiftType,
    shiftStartTime: '08:00',
    shiftEndTime: '16:00',
    availabilityStatus: 'On Duty & Available' as AmbulanceAvailabilityStatus,
    assignedAmbulanceId: '',
    assignedAmbulanceReg: '',

    // Qualifications & experience
    emergencyExperienceYears: 5,
    qualificationDetails: 'Emergency Medical Vehicle Operations (EVOC) Certified',
    paramedicRegistrationNumber: '',
    certificationExpiryDate: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],

    // Additional details
    documentUrl: '',
    notes: '',
  });

  // 3. ADD MAINTENANCE FORM STATE
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    // Record details
    ambulanceId: '',
    serviceDate: new Date().toISOString().split('T')[0],
    category: 'Preventive' as MaintenanceCategory,
    maintenanceStatus: 'Completed' as MaintenanceStatus,

    // Service & inspection details
    serviceType: 'Routine Inspection',
    servicedBy: 'Metro Fleet Service Center',
    odometerAtService: 15400,
    reportedIssue: '',
    partsReplaced: '',
    technicianName: '',
    nextServiceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    nextServiceOdometerKm: 20000,

    // Cost & payment details
    partsCost: 3500,
    labourCost: 1500,
    otherCharges: 250,
    cost: 5250, // total
    invoiceNumber: '',
    invoiceAttachmentUrl: '',

    // Vehicle availability & safety
    vehicleAvailability: 'Available' as VehicleAvailabilityDuringMaintenance,
    safetyInspectionResult: 'Passed' as SafetyInspectionResult,
    returnToServiceDate: new Date().toISOString().split('T')[0],
    verifiedBy: 'Fleet Officer / Dr. Patel',

    // Additional details
    description: 'Scheduled preventive 15,000 km general service and equipment test.',
    notes: '',
    supportingDocsUrl: '',
  });

  const loadData = () => {
    setAmbulances(MockStorage.getAmbulances(hospitalId));
    setDrivers(MockStorage.getAmbulanceDrivers(hospitalId));
    setEmergencyRequests(MockStorage.getEmergencyRequests(hospitalId));
    setMaintenanceRecords(MockStorage.getAmbulanceMaintenance(hospitalId));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [hospitalId]);

  // Statistics
  const totalFleet = ambulances.length;
  const availableAmbulances = ambulances.filter((a) => a.status === 'Available').length;
  const activeTrips = emergencyRequests.filter((r) => r.status !== 'Completed' && r.status !== 'Cancelled').length;
  const onDutyDrivers = drivers.filter((d) => d.availabilityStatus === 'On Duty & Available' || d.availabilityStatus === 'Available' || d.availabilityStatus === 'On Duty').length;

  const handleOpenDispatch = (request: EmergencyRequest) => {
    setSelectedRequestForDispatch(request);
    const firstAvailAmb = ambulances.find((a) => a.status === 'Available');
    const firstAvailDrv = drivers.find((d) => d.availabilityStatus === 'On Duty & Available' || d.availabilityStatus === 'Available');
    setSelectedAmbulanceId(firstAvailAmb ? firstAvailAmb.id : '');
    setSelectedDriverId(firstAvailDrv ? firstAvailDrv.id : '');
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = () => {
    if (!selectedRequestForDispatch || !selectedAmbulanceId || !selectedDriverId) return;

    MockStorage.dispatchEmergency(selectedRequestForDispatch.id, selectedAmbulanceId, selectedDriverId);
    showToast('Ambulance Dispatched', `Ambulance unit successfully assigned and dispatched to ${selectedRequestForDispatch.patientName}.`, 'success');
    setIsDispatchModalOpen(false);
    setSelectedRequestForDispatch(null);
  };

  const handleUpdateStatus = (requestId: string, status: EmergencyRequest['status']) => {
    MockStorage.updateEmergencyStatus(requestId, status);
    loadData();
    showToast('Trip Status Updated', `Emergency request ${requestId} updated to ${status}.`, 'info');
  };

  const handleConfirmClearAllCompleted = () => {
    MockStorage.clearCompletedEmergencyRequests(hospitalId);
    loadData();
    setIsClearAllConfirmOpen(false);
    showToast('Queue Cleared', 'All completed emergency requests have been cleared.', 'info');
  };

  const handleConfirmClearSingle = () => {
    if (!requestToClear) return;
    MockStorage.deleteEmergencyRequest(requestToClear.id);
    loadData();
    showToast('Record Cleared', `Emergency request ${requestToClear.id} removed from queue.`, 'info');
    setRequestToClear(null);
  };

  // Handler for Ambulance Manager Manually Logging Emergency Call / Dispatch
  const handleSaveManualEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmergencyForm.patientName || !manualEmergencyForm.patientPhone || !manualEmergencyForm.pickupLocation) {
      showToast('Validation Error', 'Please enter caller/patient name, contact phone, and pickup location.', 'error');
      return;
    }

    const selectedAmb = ambulances.find((a) => a.id === manualEmergencyForm.assignedAmbulanceId);
    const selectedDrv = drivers.find((d) => d.id === manualEmergencyForm.assignedDriverId);
    const isAssigned = !!selectedAmb && !!selectedDrv;

    const newReq: EmergencyRequest = {
      id: `EMR-MAN-${Date.now().toString().slice(-4)}`,
      hospitalId,
      hospitalName: currentHospital?.name || 'Hospital Emergency Desk',
      patientName: manualEmergencyForm.patientName,
      patientPhone: manualEmergencyForm.patientPhone,
      pickupLocation: manualEmergencyForm.pickupLocation,
      destinationHospital: `${currentHospital?.name || 'Hospital'} Emergency Trauma Bay`,
      emergencyType: manualEmergencyForm.emergencyType as any,
      priority: manualEmergencyForm.priority,
      requestDate: new Date().toISOString().split('T')[0],
      requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isAssigned ? 'Dispatched' : 'Requested',
      chiefComplaint: manualEmergencyForm.chiefComplaint || 'Emergency call logged manually by ambulance manager',
      assignedAmbulanceId: selectedAmb?.id,
      assignedAmbulanceReg: selectedAmb?.regNumber,
      assignedDriverId: selectedDrv?.id,
      assignedDriverName: selectedDrv?.name,
      driverPhone: selectedDrv?.phone,
      fareEstimate: 150,
    };

    MockStorage.saveEmergencyRequest(newReq);

    // If unit and driver assigned at creation, dispatch and update their statuses
    if (selectedAmb && selectedDrv) {
      MockStorage.dispatchEmergency(newReq.id, selectedAmb.id, selectedDrv.id);
    }

    showToast(
      'Emergency Call Logged',
      `Emergency call ${newReq.id} recorded and logged into Live Emergency Triage Queue.`,
      'success'
    );

    setIsManualEmergencyModalOpen(false);
    setManualEmergencyForm({
      patientName: '',
      patientPhone: '',
      pickupLocation: '',
      emergencyType: 'Cardiac Arrest / Severe Chest Pain',
      priority: 'Critical / Code Blue',
      chiefComplaint: '',
      assignedAmbulanceId: '',
      assignedDriverId: '',
    });
    loadData();
  };

  // Handler for Updating Maintenance Status & Synchronizing Vehicle Availability
  const handleUpdateMaintenanceStatus = (
    maintenanceId: string,
    newStatus: MaintenanceStatus
  ) => {
    const mnt = maintenanceRecords.find((m) => m.id === maintenanceId);
    if (!mnt) return;

    const amb = ambulances.find((a) => a.id === mnt.ambulanceId || a.regNumber === mnt.ambulanceReg);

    const updatedMnt: AmbulanceMaintenance = {
      ...mnt,
      maintenanceStatus: newStatus,
      vehicleAvailability: (newStatus === 'Completed' || newStatus === 'Cancelled') ? 'Available' : 'Under Maintenance',
      returnToServiceDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : mnt.returnToServiceDate,
    };
    MockStorage.saveAmbulanceMaintenance(updatedMnt);

    if (amb) {
      let targetStatus: AmbulanceStatus = 'Available';
      if (newStatus === 'In Progress') {
        targetStatus = 'Maintenance';
      } else if (newStatus === 'Completed' || newStatus === 'Cancelled') {
        targetStatus = 'Available';
      } else if (newStatus === 'Scheduled') {
        const todayStr = new Date().toISOString().split('T')[0];
        targetStatus = mnt.serviceDate === todayStr ? 'Maintenance' : 'Available';
      }

      const updatedAmb: Ambulance = {
        ...amb,
        status: targetStatus,
        lastMaintenanceDate: newStatus === 'Completed' ? mnt.serviceDate : amb.lastMaintenanceDate,
      };
      MockStorage.saveAmbulance(updatedAmb);
    }

    showToast(
      'Maintenance Status Updated',
      `Log ${mnt.id} updated to ${newStatus}. Ambulance ${mnt.ambulanceReg} status synchronized to ${newStatus === 'In Progress' ? 'Maintenance' : 'Available'}.`,
      'info'
    );
    loadData();
  };

  // Handlers for Ambulance Add / Edit / Delete
  const handleOpenAddAmbulance = () => {
    setEditingAmbulance(null);
    setNewAmbulance({
      regNumber: '',
      registrationDate: new Date().toISOString().split('T')[0],
      registrationExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      chassisNumber: '',
      engineNumber: '',
      ownershipType: 'Owned' as AmbulanceOwnershipType,
      model: '',
      type: 'Advanced Life Support (ALS)' as AmbulanceType,
      manufacturingYear: new Date().getFullYear(),
      seatingCapacity: 4,
      patientCapacity: 1,
      odometerReading: 15000,
      mileageKm: 15000,
      fuelType: 'Diesel' as AmbulanceFuelType,
      fuelLevel: 100,
      status: 'Available' as AmbulanceStatus,
      assignedDriverId: '',
      assignedDriverName: '',
      driverPhone: '',
      assignedParamedic: '',
      homeBranch: hospitalName,
      currentLocation: 'Base Station Alpha',
      insurancePolicyNumber: '',
      insuranceExpiryDate: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
      fitnessCertExpiryDate: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
      permitExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      pucExpiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      equipmentCategory: 'Class A (Critical Telemetry)' as Ambulance['equipmentCategory'],
      oxygenCylinderAvailable: 'Yes' as 'Yes' | 'No',
      stretcherAvailable: 'Yes' as 'Yes' | 'No',
      defibrillatorAvailable: 'Yes' as 'Yes' | 'No' | 'Not Applicable',
      equipmentChecklist: ['Oxygen Cylinder & Flowmeter', 'Foldable Stretcher & Trolley', 'Multi-Para Cardiac Monitor', 'First Aid Trauma Dressing Bag'],
      lastSafetyInspectionDate: new Date().toISOString().split('T')[0],
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      vehiclePhotoUrl: '',
      notes: '',
    });
    setIsAddAmbulanceModalOpen(true);
  };

  const handleOpenEditAmbulance = (amb: Ambulance) => {
    setEditingAmbulance(amb);
    setNewAmbulance({
      regNumber: amb.regNumber || '',
      registrationDate: amb.registrationDate || new Date().toISOString().split('T')[0],
      registrationExpiryDate: amb.registrationExpiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      chassisNumber: amb.chassisNumber || '',
      engineNumber: amb.engineNumber || '',
      ownershipType: amb.ownershipType || ('Owned' as AmbulanceOwnershipType),
      model: amb.model || '',
      type: amb.type || ('Advanced Life Support (ALS)' as AmbulanceType),
      manufacturingYear: amb.manufacturingYear || new Date().getFullYear(),
      seatingCapacity: amb.seatingCapacity ?? 4,
      patientCapacity: amb.patientCapacity ?? 1,
      odometerReading: amb.odometerReading ?? amb.mileageKm ?? 0,
      mileageKm: amb.mileageKm ?? amb.odometerReading ?? 0,
      fuelType: amb.fuelType || ('Diesel' as AmbulanceFuelType),
      fuelLevel: amb.fuelLevel ?? 100,
      status: amb.status || ('Available' as AmbulanceStatus),
      assignedDriverId: amb.assignedDriverId || '',
      assignedDriverName: amb.assignedDriverName || '',
      driverPhone: amb.driverPhone || '',
      assignedParamedic: amb.assignedParamedic || '',
      homeBranch: amb.homeBranch || hospitalName,
      currentLocation: amb.currentLocation || 'Base Station Alpha',
      insurancePolicyNumber: amb.insurancePolicyNumber || '',
      insuranceExpiryDate: amb.insuranceExpiryDate || '',
      fitnessCertExpiryDate: amb.fitnessCertExpiryDate || '',
      permitExpiryDate: amb.permitExpiryDate || '',
      pucExpiryDate: amb.pucExpiryDate || '',
      equipmentCategory: amb.equipmentCategory || ('Class A (Critical Telemetry)' as Ambulance['equipmentCategory']),
      oxygenCylinderAvailable: (amb.oxygenCylinderAvailable === true || amb.oxygenCylinderAvailable === 'Yes') ? 'Yes' : 'No',
      stretcherAvailable: (amb.stretcherAvailable === true || amb.stretcherAvailable === 'Yes') ? 'Yes' : 'No',
      defibrillatorAvailable: amb.defibrillatorAvailable || 'Yes',
      equipmentChecklist: amb.equipmentChecklist || ['Oxygen Cylinder & Flowmeter', 'Foldable Stretcher & Trolley'],
      lastSafetyInspectionDate: amb.lastSafetyInspectionDate || '',
      lastMaintenanceDate: amb.lastMaintenanceDate || '',
      nextMaintenanceDate: amb.nextMaintenanceDate || '',
      vehiclePhotoUrl: amb.vehiclePhotoUrl || '',
      notes: amb.notes || '',
    });
    setIsAddAmbulanceModalOpen(true);
  };

  const handleConfirmDeleteAmbulance = () => {
    if (!ambulanceToDelete) return;
    MockStorage.deleteAmbulance(ambulanceToDelete.id);
    loadData();
    showToast('Ambulance Decommissioned', `Unit ${ambulanceToDelete.regNumber} has been removed from the fleet inventory.`, 'success');
    if (selectedAmbulanceDetails?.id === ambulanceToDelete.id) {
      setSelectedAmbulanceDetails(null);
    }
    setAmbulanceToDelete(null);
  };

  // Handle Add / Edit Ambulance
  const handleAddAmbulance = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAmbulance) {
      const amb: Ambulance = {
        ...editingAmbulance,
        hospitalId,
        hospitalName,
        regNumber: newAmbulance.regNumber.toUpperCase().trim(),
        registrationDate: newAmbulance.registrationDate,
        registrationExpiryDate: newAmbulance.registrationExpiryDate,
        chassisNumber: newAmbulance.chassisNumber,
        engineNumber: newAmbulance.engineNumber,
        ownershipType: newAmbulance.ownershipType,
        type: newAmbulance.type,
        model: newAmbulance.model,
        manufacturingYear: Number(newAmbulance.manufacturingYear) || new Date().getFullYear(),
        seatingCapacity: Number(newAmbulance.seatingCapacity) || 4,
        patientCapacity: Number(newAmbulance.patientCapacity) || 1,
        odometerReading: Number(newAmbulance.odometerReading) || 0,
        mileageKm: Number(newAmbulance.odometerReading) || Number(newAmbulance.mileageKm) || 0,
        fuelType: newAmbulance.fuelType,
        fuelLevel: Number(newAmbulance.fuelLevel) || 100,
        status: newAmbulance.status,
        assignedDriverId: newAmbulance.assignedDriverId || undefined,
        assignedDriverName: newAmbulance.assignedDriverName || undefined,
        driverPhone: newAmbulance.driverPhone || undefined,
        assignedParamedic: newAmbulance.assignedParamedic || undefined,
        homeBranch: newAmbulance.homeBranch || hospitalName,
        currentLocation: newAmbulance.currentLocation,
        insurancePolicyNumber: newAmbulance.insurancePolicyNumber || undefined,
        insuranceExpiryDate: newAmbulance.insuranceExpiryDate || undefined,
        fitnessCertExpiryDate: newAmbulance.fitnessCertExpiryDate || undefined,
        permitExpiryDate: newAmbulance.permitExpiryDate || undefined,
        pucExpiryDate: newAmbulance.pucExpiryDate || undefined,
        equipmentCategory: newAmbulance.equipmentCategory,
        oxygenCylinderAvailable: newAmbulance.oxygenCylinderAvailable,
        stretcherAvailable: newAmbulance.stretcherAvailable,
        defibrillatorAvailable: newAmbulance.defibrillatorAvailable,
        equipmentChecklist: newAmbulance.equipmentChecklist,
        lastSafetyInspectionDate: newAmbulance.lastSafetyInspectionDate,
        lastMaintenanceDate: newAmbulance.lastMaintenanceDate,
        nextMaintenanceDate: newAmbulance.nextMaintenanceDate,
        vehiclePhotoUrl: newAmbulance.vehiclePhotoUrl || undefined,
        notes: newAmbulance.notes || undefined,
      };

      MockStorage.saveAmbulance(amb);
      loadData();
      showToast('Ambulance Updated', `Unit ${amb.regNumber} (${amb.id}) specifications updated successfully.`, 'success');
      if (selectedAmbulanceDetails?.id === amb.id) {
        setSelectedAmbulanceDetails(amb);
      }
      setIsAddAmbulanceModalOpen(false);
      setEditingAmbulance(null);
      return;
    }

    const autoGenId = `AMB-${Date.now().toString().slice(-4)}`;
    const amb: Ambulance = {
      id: autoGenId,
      hospitalId,
      hospitalName,
      regNumber: newAmbulance.regNumber.toUpperCase().trim(),
      registrationDate: newAmbulance.registrationDate,
      registrationExpiryDate: newAmbulance.registrationExpiryDate,
      chassisNumber: newAmbulance.chassisNumber,
      engineNumber: newAmbulance.engineNumber,
      ownershipType: newAmbulance.ownershipType,
      type: newAmbulance.type,
      model: newAmbulance.model,
      manufacturingYear: Number(newAmbulance.manufacturingYear) || new Date().getFullYear(),
      seatingCapacity: Number(newAmbulance.seatingCapacity) || 4,
      patientCapacity: Number(newAmbulance.patientCapacity) || 1,
      odometerReading: Number(newAmbulance.odometerReading) || 0,
      mileageKm: Number(newAmbulance.odometerReading) || Number(newAmbulance.mileageKm) || 0,
      fuelType: newAmbulance.fuelType,
      fuelLevel: Number(newAmbulance.fuelLevel) || 100,
      status: newAmbulance.status,
      assignedDriverId: newAmbulance.assignedDriverId || undefined,
      assignedDriverName: newAmbulance.assignedDriverName || undefined,
      driverPhone: newAmbulance.driverPhone || undefined,
      assignedParamedic: newAmbulance.assignedParamedic || undefined,
      homeBranch: newAmbulance.homeBranch || hospitalName,
      currentLocation: newAmbulance.currentLocation,
      insurancePolicyNumber: newAmbulance.insurancePolicyNumber || undefined,
      insuranceExpiryDate: newAmbulance.insuranceExpiryDate || undefined,
      fitnessCertExpiryDate: newAmbulance.fitnessCertExpiryDate || undefined,
      permitExpiryDate: newAmbulance.permitExpiryDate || undefined,
      pucExpiryDate: newAmbulance.pucExpiryDate || undefined,
      equipmentCategory: newAmbulance.equipmentCategory,
      oxygenCylinderAvailable: newAmbulance.oxygenCylinderAvailable,
      stretcherAvailable: newAmbulance.stretcherAvailable,
      defibrillatorAvailable: newAmbulance.defibrillatorAvailable,
      equipmentChecklist: newAmbulance.equipmentChecklist,
      lastSafetyInspectionDate: newAmbulance.lastSafetyInspectionDate,
      lastMaintenanceDate: newAmbulance.lastMaintenanceDate,
      nextMaintenanceDate: newAmbulance.nextMaintenanceDate,
      vehiclePhotoUrl: newAmbulance.vehiclePhotoUrl || undefined,
      notes: newAmbulance.notes || undefined,
    };

    MockStorage.saveAmbulance(amb);
    loadData();
    showToast('Ambulance Registered', `Unit ${amb.regNumber} (${amb.id}) enrolled with full specifications & compliance.`, 'success');
    setIsAddAmbulanceModalOpen(false);
  };

  // Handlers for Driver Add / Edit / Delete
  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setNewDriver({
      employeeId: '',
      name: '',
      role: 'Ambulance Driver' as AmbulanceStaffRole,
      avatarUrl: '',
      email: '',
      phone: '',
      alternativePhone: '',
      address: '',
      emergencyContactName: '',
      emergencyContactRelationship: 'Spouse',
      licenseNumber: '',
      licenseType: 'Commercial Heavy / EVOC',
      licenseIssueDate: new Date(Date.now() - 365 * 86400000 * 3).toISOString().split('T')[0],
      licenseExpiry: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],
      evocCertExpiry: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],
      cprCertExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      medicalClearanceExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      dateOfJoining: new Date().toISOString().split('T')[0],
      employmentType: 'Full-Time' as AmbulanceEmploymentType,
      dutyStatus: 'Active' as AmbulanceDutyStatus,
      status: 'active',
      assignedBranch: hospitalName,
      shiftType: 'Morning' as AmbulanceShiftType,
      shiftStartTime: '08:00',
      shiftEndTime: '16:00',
      availabilityStatus: 'On Duty & Available' as AmbulanceAvailabilityStatus,
      assignedAmbulanceId: '',
      assignedAmbulanceReg: '',
      emergencyExperienceYears: 5,
      qualificationDetails: 'Emergency Medical Vehicle Operations (EVOC) Certified',
      paramedicRegistrationNumber: '',
      certificationExpiryDate: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],
      documentUrl: '',
      notes: '',
    });
    setIsAddDriverModalOpen(true);
  };

  const handleOpenEditDriver = (drv: AmbulanceDriver) => {
    setEditingDriver(drv);
    setNewDriver({
      employeeId: drv.employeeId || drv.id || '',
      name: drv.name || '',
      role: drv.role || ('Ambulance Driver' as AmbulanceStaffRole),
      avatarUrl: drv.avatarUrl || '',
      email: drv.email || '',
      phone: drv.phone || '',
      alternativePhone: drv.alternativePhone || '',
      address: drv.address || '',
      emergencyContactName: drv.emergencyContactName || '',
      emergencyContactRelationship: drv.emergencyContactRelationship || 'Spouse',
      licenseNumber: drv.licenseNumber || '',
      licenseType: drv.licenseType || 'Commercial Heavy / EVOC',
      licenseIssueDate: drv.licenseIssueDate || '',
      licenseExpiry: drv.licenseExpiry || '',
      evocCertExpiry: drv.evocCertExpiry || '',
      cprCertExpiry: drv.cprCertExpiry || '',
      medicalClearanceExpiry: drv.medicalClearanceExpiry || '',
      dateOfJoining: drv.dateOfJoining || new Date().toISOString().split('T')[0],
      employmentType: drv.employmentType || ('Full-Time' as AmbulanceEmploymentType),
      dutyStatus: drv.dutyStatus || ('Active' as AmbulanceDutyStatus),
      status: drv.status || 'active',
      assignedBranch: drv.assignedBranch || hospitalName,
      shiftType: drv.shiftType || ('Morning' as AmbulanceShiftType),
      shiftStartTime: drv.shiftStartTime || '08:00',
      shiftEndTime: drv.shiftEndTime || '16:00',
      availabilityStatus: drv.availabilityStatus || ('On Duty & Available' as AmbulanceAvailabilityStatus),
      assignedAmbulanceId: drv.assignedAmbulanceId || '',
      assignedAmbulanceReg: drv.assignedAmbulanceReg || '',
      emergencyExperienceYears: drv.emergencyExperienceYears || 0,
      qualificationDetails: drv.qualificationDetails || '',
      paramedicRegistrationNumber: drv.paramedicRegistrationNumber || '',
      certificationExpiryDate: drv.certificationExpiryDate || '',
      documentUrl: drv.documentUrl || '',
      notes: drv.notes || '',
    });
    setIsAddDriverModalOpen(true);
  };

  const handleConfirmDeleteDriver = () => {
    if (!driverToDelete) return;
    MockStorage.deleteAmbulanceDriver(driverToDelete.id);
    loadData();
    showToast('Staff Removed', `${driverToDelete.name} has been removed from the emergency crew roster.`, 'success');
    if (selectedDriverDetails?.id === driverToDelete.id) {
      setSelectedDriverDetails(null);
    }
    setDriverToDelete(null);
  };

  // Handle Add / Edit Driver / Paramedic
  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDriver) {
      const drv: AmbulanceDriver = {
        ...editingDriver,
        hospitalId,
        hospitalName,
        employeeId: newDriver.employeeId || editingDriver.employeeId || editingDriver.id,
        name: newDriver.name,
        email: newDriver.email,
        phone: newDriver.phone,
        alternativePhone: newDriver.alternativePhone || undefined,
        address: newDriver.address || undefined,
        emergencyContactName: newDriver.emergencyContactName || undefined,
        emergencyContactRelationship: newDriver.emergencyContactRelationship || undefined,
        role: newDriver.role,
        avatarUrl: newDriver.avatarUrl || undefined,
        licenseNumber: newDriver.licenseNumber,
        licenseType: newDriver.licenseType,
        licenseIssueDate: newDriver.licenseIssueDate,
        licenseExpiry: newDriver.licenseExpiry,
        evocCertExpiry: newDriver.evocCertExpiry || undefined,
        cprCertExpiry: newDriver.cprCertExpiry || undefined,
        medicalClearanceExpiry: newDriver.medicalClearanceExpiry || undefined,
        dateOfJoining: newDriver.dateOfJoining,
        employmentType: newDriver.employmentType,
        dutyStatus: newDriver.dutyStatus,
        status: newDriver.status,
        assignedBranch: newDriver.assignedBranch || hospitalName,
        shiftType: newDriver.shiftType,
        shiftStartTime: newDriver.shiftStartTime,
        shiftEndTime: newDriver.shiftEndTime,
        availabilityStatus: newDriver.availabilityStatus,
        assignedAmbulanceId: newDriver.assignedAmbulanceId || undefined,
        assignedAmbulanceReg: newDriver.assignedAmbulanceReg || undefined,
        emergencyExperienceYears: Number(newDriver.emergencyExperienceYears) || 0,
        qualificationDetails: newDriver.qualificationDetails,
        paramedicRegistrationNumber: newDriver.paramedicRegistrationNumber || undefined,
        certificationExpiryDate: newDriver.certificationExpiryDate || undefined,
        documentUrl: newDriver.documentUrl || undefined,
        notes: newDriver.notes || undefined,
      };

      MockStorage.saveAmbulanceDriver(drv);
      loadData();
      showToast('Staff Profile Updated', `${drv.name} (${drv.role}) profile updated successfully.`, 'success');
      if (selectedDriverDetails?.id === drv.id) {
        setSelectedDriverDetails(drv);
      }
      setIsAddDriverModalOpen(false);
      setEditingDriver(null);
      return;
    }

    const autoGenStaffId = `STF-DRV-${Date.now().toString().slice(-4)}`;
    const drv: AmbulanceDriver = {
      id: autoGenStaffId,
      employeeId: newDriver.employeeId || autoGenStaffId,
      hospitalId,
      hospitalName,
      name: newDriver.name,
      email: newDriver.email,
      phone: newDriver.phone,
      alternativePhone: newDriver.alternativePhone || undefined,
      address: newDriver.address || undefined,
      emergencyContactName: newDriver.emergencyContactName || undefined,
      emergencyContactRelationship: newDriver.emergencyContactRelationship || undefined,
      role: newDriver.role,
      avatarUrl: newDriver.avatarUrl || undefined,
      licenseNumber: newDriver.licenseNumber,
      licenseType: newDriver.licenseType,
      licenseIssueDate: newDriver.licenseIssueDate,
      licenseExpiry: newDriver.licenseExpiry,
      evocCertExpiry: newDriver.evocCertExpiry || undefined,
      cprCertExpiry: newDriver.cprCertExpiry || undefined,
      medicalClearanceExpiry: newDriver.medicalClearanceExpiry || undefined,
      dateOfJoining: newDriver.dateOfJoining,
      employmentType: newDriver.employmentType,
      dutyStatus: newDriver.dutyStatus,
      status: newDriver.status,
      assignedBranch: newDriver.assignedBranch || hospitalName,
      shiftType: newDriver.shiftType,
      shiftStartTime: newDriver.shiftStartTime,
      shiftEndTime: newDriver.shiftEndTime,
      availabilityStatus: newDriver.availabilityStatus,
      assignedAmbulanceId: newDriver.assignedAmbulanceId || undefined,
      assignedAmbulanceReg: newDriver.assignedAmbulanceReg || undefined,
      completedTrips: 0,
      emergencyExperienceYears: Number(newDriver.emergencyExperienceYears) || 0,
      qualificationDetails: newDriver.qualificationDetails,
      paramedicRegistrationNumber: newDriver.paramedicRegistrationNumber || undefined,
      certificationExpiryDate: newDriver.certificationExpiryDate || undefined,
      documentUrl: newDriver.documentUrl || undefined,
      notes: newDriver.notes || undefined,
    };

    MockStorage.saveAmbulanceDriver(drv);

    // Provision User login credentials so staff can log in like other hospital staff
    if (drv.email && drv.email.trim()) {
      const emailTrimmed = drv.email.trim();
      const existingUser = MockStorage.getUsers().find(
        (u) => (u.email || '').toLowerCase() === emailTrimmed.toLowerCase()
      );
      const userToSave: User = {
        id: existingUser?.id || `USR-DRV-${drv.id}`,
        name: drv.name,
        email: emailTrimmed,
        password: existingUser?.password || 'Staff@1234',
        role: 'ambulance_driver',
        portal: 'hospital',
        hospitalId,
        hospitalName: currentHospital?.name || drv.hospitalName || 'Hospital',
        department: 'Emergency Fleet / Ambulance Unit',
        phone: drv.phone,
        status: 'active',
        driverId: drv.id,
        createdAt: existingUser?.createdAt || new Date().toISOString(),
      };
      MockStorage.saveUser(userToSave);
    }

    loadData();
    showToast('Staff Onboarded & Login Created', `${drv.name} (${drv.role}) has been added with Staff ID ${drv.id}.`, 'success');
    setIsAddDriverModalOpen(false);
  };

  // Handlers for Maintenance Add / Edit / Delete
  const handleOpenAddMaintenance = () => {
    setEditingMaintenance(null);
    setNewMaintenance({
      ambulanceId: ambulances.length > 0 ? ambulances[0].id : '',
      serviceDate: new Date().toISOString().split('T')[0],
      category: 'Preventive' as MaintenanceCategory,
      maintenanceStatus: 'Completed' as MaintenanceStatus,
      serviceType: 'Routine Inspection',
      servicedBy: 'Metro Fleet Service Center',
      odometerAtService: ambulances.length > 0 ? (ambulances[0].odometerReading || ambulances[0].mileageKm || 15000) : 15000,
      reportedIssue: '',
      partsReplaced: '',
      technicianName: '',
      nextServiceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      nextServiceOdometerKm: 20000,
      partsCost: 3500,
      labourCost: 1500,
      otherCharges: 250,
      cost: 5250,
      invoiceNumber: '',
      invoiceAttachmentUrl: '',
      vehicleAvailability: 'Available' as VehicleAvailabilityDuringMaintenance,
      safetyInspectionResult: 'Passed' as SafetyInspectionResult,
      returnToServiceDate: new Date().toISOString().split('T')[0],
      verifiedBy: 'Fleet Officer / Dr. Patel',
      description: 'Scheduled preventive 15,000 km general service and equipment test.',
      notes: '',
      supportingDocsUrl: '',
    });
    setIsAddMaintenanceModalOpen(true);
  };

  const handleOpenEditMaintenance = (rec: AmbulanceMaintenance) => {
    setEditingMaintenance(rec);
    setNewMaintenance({
      ambulanceId: rec.ambulanceId || '',
      serviceDate: rec.serviceDate || new Date().toISOString().split('T')[0],
      category: rec.category || ('Preventive' as MaintenanceCategory),
      maintenanceStatus: rec.maintenanceStatus || ('Completed' as MaintenanceStatus),
      serviceType: rec.serviceType || 'Routine Inspection',
      servicedBy: rec.servicedBy || '',
      odometerAtService: rec.odometerAtService || 0,
      reportedIssue: rec.reportedIssue || '',
      partsReplaced: rec.partsReplaced || '',
      technicianName: rec.technicianName || '',
      nextServiceDate: rec.nextServiceDate || '',
      nextServiceOdometerKm: rec.nextServiceOdometerKm || 0,
      partsCost: rec.partsCost || 0,
      labourCost: rec.labourCost || 0,
      otherCharges: rec.otherCharges || 0,
      cost: rec.cost || 0,
      invoiceNumber: rec.invoiceNumber || '',
      invoiceAttachmentUrl: rec.invoiceAttachmentUrl || '',
      vehicleAvailability: rec.vehicleAvailability || ('Available' as VehicleAvailabilityDuringMaintenance),
      safetyInspectionResult: rec.safetyInspectionResult || ('Passed' as SafetyInspectionResult),
      returnToServiceDate: rec.returnToServiceDate || '',
      verifiedBy: rec.verifiedBy || '',
      description: rec.description || '',
      notes: rec.notes || '',
      supportingDocsUrl: rec.supportingDocsUrl || '',
    });
    setIsAddMaintenanceModalOpen(true);
  };

  const handleConfirmDeleteMaintenance = () => {
    if (!maintenanceToDelete) return;
    MockStorage.deleteAmbulanceMaintenance(maintenanceToDelete.id);
    loadData();
    showToast('Record Deleted', `Maintenance log ${maintenanceToDelete.id} has been deleted.`, 'success');
    if (selectedMaintenanceDetails?.id === maintenanceToDelete.id) {
      setSelectedMaintenanceDetails(null);
    }
    setMaintenanceToDelete(null);
  };

  // Handle Add / Edit Maintenance
  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const amb = ambulances.find((a) => a.id === newMaintenance.ambulanceId);
    if (!amb && !editingMaintenance) {
      showToast('Error', 'Please select an ambulance unit.', 'error');
      return;
    }

    const calculatedTotal = (Number(newMaintenance.partsCost) || 0) + (Number(newMaintenance.labourCost) || 0) + (Number(newMaintenance.otherCharges) || 0);
    const finalTotal = newMaintenance.cost > 0 ? newMaintenance.cost : calculatedTotal;

    if (editingMaintenance) {
      const mnt: AmbulanceMaintenance = {
        ...editingMaintenance,
        hospitalId,
        ambulanceId: newMaintenance.ambulanceId || editingMaintenance.ambulanceId,
        ambulanceReg: amb?.regNumber || editingMaintenance.ambulanceReg,
        serviceDate: newMaintenance.serviceDate,
        category: newMaintenance.category,
        maintenanceStatus: newMaintenance.maintenanceStatus,
        serviceType: newMaintenance.serviceType,
        servicedBy: newMaintenance.servicedBy,
        odometerAtService: Number(newMaintenance.odometerAtService) || 0,
        reportedIssue: newMaintenance.reportedIssue || undefined,
        partsReplaced: newMaintenance.partsReplaced || undefined,
        technicianName: newMaintenance.technicianName || undefined,
        nextServiceDate: newMaintenance.nextServiceDate,
        nextServiceOdometerKm: Number(newMaintenance.nextServiceOdometerKm) || undefined,
        partsCost: Number(newMaintenance.partsCost) || 0,
        labourCost: Number(newMaintenance.labourCost) || 0,
        otherCharges: Number(newMaintenance.otherCharges) || 0,
        cost: finalTotal,
        invoiceNumber: newMaintenance.invoiceNumber || undefined,
        invoiceAttachmentUrl: newMaintenance.invoiceAttachmentUrl || undefined,
        vehicleAvailability: newMaintenance.vehicleAvailability,
        safetyInspectionResult: newMaintenance.safetyInspectionResult,
        returnToServiceDate: newMaintenance.returnToServiceDate || undefined,
        verifiedBy: newMaintenance.verifiedBy || undefined,
        description: newMaintenance.description,
        notes: newMaintenance.notes || undefined,
        supportingDocsUrl: newMaintenance.supportingDocsUrl || undefined,
      };

      MockStorage.saveAmbulanceMaintenance(mnt);

      if (amb) {
        const updatedAmb: Ambulance = {
          ...amb,
          lastMaintenanceDate: mnt.serviceDate,
          nextMaintenanceDate: mnt.nextServiceDate,
          status: (mnt.maintenanceStatus === 'In Progress' || mnt.vehicleAvailability === 'Under Maintenance' || mnt.vehicleAvailability === 'Out of Service') ? 'Maintenance' : 'Available',
          odometerReading: mnt.odometerAtService || amb.odometerReading,
          mileageKm: mnt.odometerAtService || amb.mileageKm,
        };
        MockStorage.saveAmbulance(updatedAmb);
      }

      loadData();
      showToast('Maintenance Record Updated', `Log ${mnt.id} updated successfully.`, 'success');
      if (selectedMaintenanceDetails?.id === mnt.id) {
        setSelectedMaintenanceDetails(mnt);
      }
      setIsAddMaintenanceModalOpen(false);
      setEditingMaintenance(null);
      return;
    }

    const autoGenMntId = `MNT-LOG-${Date.now().toString().slice(-4)}`;

    const mnt: AmbulanceMaintenance = {
      id: autoGenMntId,
      hospitalId,
      ambulanceId: amb!.id,
      ambulanceReg: amb!.regNumber,
      serviceDate: newMaintenance.serviceDate,
      category: newMaintenance.category,
      maintenanceStatus: newMaintenance.maintenanceStatus,
      serviceType: newMaintenance.serviceType,
      servicedBy: newMaintenance.servicedBy,
      odometerAtService: Number(newMaintenance.odometerAtService) || amb!.odometerReading || amb!.mileageKm,
      reportedIssue: newMaintenance.reportedIssue || undefined,
      partsReplaced: newMaintenance.partsReplaced || undefined,
      technicianName: newMaintenance.technicianName || undefined,
      nextServiceDate: newMaintenance.nextServiceDate,
      nextServiceOdometerKm: Number(newMaintenance.nextServiceOdometerKm) || undefined,
      partsCost: Number(newMaintenance.partsCost) || 0,
      labourCost: Number(newMaintenance.labourCost) || 0,
      otherCharges: Number(newMaintenance.otherCharges) || 0,
      cost: finalTotal,
      invoiceNumber: newMaintenance.invoiceNumber || undefined,
      invoiceAttachmentUrl: newMaintenance.invoiceAttachmentUrl || undefined,
      vehicleAvailability: newMaintenance.vehicleAvailability,
      safetyInspectionResult: newMaintenance.safetyInspectionResult,
      returnToServiceDate: newMaintenance.returnToServiceDate || undefined,
      verifiedBy: newMaintenance.verifiedBy || undefined,
      description: newMaintenance.description,
      notes: newMaintenance.notes || undefined,
      supportingDocsUrl: newMaintenance.supportingDocsUrl || undefined,
    };

    MockStorage.saveAmbulanceMaintenance(mnt);

    // Synchronize vehicle status & maintenance dates on ambulance
    const updatedAmb: Ambulance = {
      ...amb!,
      lastMaintenanceDate: mnt.serviceDate,
      nextMaintenanceDate: mnt.nextServiceDate,
      status: (mnt.maintenanceStatus === 'In Progress' || mnt.vehicleAvailability === 'Under Maintenance' || mnt.vehicleAvailability === 'Out of Service') ? 'Maintenance' : 'Available',
      odometerReading: mnt.odometerAtService || amb!.odometerReading,
      mileageKm: mnt.odometerAtService || amb!.mileageKm,
    };
    MockStorage.saveAmbulance(updatedAmb);
    loadData();

    showToast('Maintenance Logged', `Service log ${mnt.id} registered with total cost ₹${finalTotal.toLocaleString()}.`, 'success');
    setIsAddMaintenanceModalOpen(false);
  };

  const handleExportCSV = () => {
    if (activeTab === 'dispatch') {
      const exportList = emergencyFilter === 'active'
        ? activeEmergencies
        : emergencyFilter === 'completed'
        ? completedEmergencies
        : emergencyRequests;
      MockStorage.exportToCSV(`Emergency_Triage_${emergencyFilter}`, exportList);
      showToast('CSV Exported', `${emergencyFilter.toUpperCase()} emergency triage records downloaded successfully.`, 'success');
    } else if (activeTab === 'drivers') {
      MockStorage.exportToCSV('Ambulance_Drivers_Roster', drivers);
      showToast('CSV Exported', 'Ambulance drivers and paramedic roster downloaded successfully.', 'success');
    } else if (activeTab === 'maintenance') {
      MockStorage.exportToCSV('Ambulance_Maintenance_Logs', maintenanceRecords);
      showToast('CSV Exported', 'Ambulance maintenance history records downloaded successfully.', 'success');
    } else {
      MockStorage.exportToCSV('Ambulance_Fleet_Inventory', ambulances);
      showToast('CSV Exported', 'Ambulance fleet records downloaded successfully.', 'success');
    }
  };

  // Helper for file upload preview (image/docs)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'dispatch', label: 'Emergency 911 Dispatch', count: activeTrips },
    { id: 'fleet', label: 'Ambulance Fleet Inventory', count: ambulances.length },
    { id: 'drivers', label: 'Driver & Paramedic Roster', count: drivers.length },
    { id: 'maintenance', label: 'Fleet Maintenance Logs', count: maintenanceRecords.length },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ambulance & Emergency Response Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end emergency fleet inventory, driver & paramedic roster, 911 dispatch triage, and preventive maintenance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
            Export {activeTab === 'dispatch' ? 'Dispatches' : activeTab === 'drivers' ? 'Roster' : activeTab === 'maintenance' ? 'Maintenance' : 'Fleet'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddAmbulance}
          >
            Add Ambulance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Fleet Size"
          value={totalFleet}
          icon={<AmbulanceIcon className="w-5 h-5" />}
          accentColor="indigo"
          subtext="Registered emergency units"
        />
        <StatCard
          title="Available Units"
          value={availableAmbulances}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
          subtext="Ready for immediate dispatch"
        />
        <StatCard
          title="Active Emergency Trips"
          value={activeTrips}
          icon={<Flame className="w-5 h-5" />}
          accentColor="amber"
          subtext="In transit / on site"
        />
        <StatCard
          title="On-Duty Paramedics & Drivers"
          value={onDutyDrivers}
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="purple"
          subtext="Available emergency crew"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 1: EMERGENCY 911 DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                Live Emergency Triage Queue
              </h3>
              <p className="text-xs text-slate-500 font-medium">Real-time reactive triage for patient portal & manual 911 dispatch calls</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {completedEmergencies.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4 text-rose-600" />}
                  onClick={() => setIsClearAllConfirmOpen(true)}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold shadow-sm"
                >
                  Clear All Completed ({completedEmergencies.length})
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsManualEmergencyModalOpen(true)}
                className="font-bold shadow-md shadow-rose-600/20"
              >
                Log Emergency Call / Dispatch
              </Button>
            </div>
          </div>

          {/* Sub-Queue Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setEmergencyFilter('active')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  emergencyFilter === 'active'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Active Triage Queue</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  emergencyFilter === 'active' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeEmergencies.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyFilter('completed')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  emergencyFilter === 'completed'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Completed Trips</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  emergencyFilter === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {completedEmergencies.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  emergencyFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All Calls</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  emergencyFilter === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {emergencyRequests.length}
                </span>
              </button>
            </div>

            {emergencyFilter === 'completed' && completedEmergencies.length > 0 && (
              <span className="text-xs text-slate-500 italic">
                Showing {completedEmergencies.length} completed & cleared run{completedEmergencies.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {displayedEmergencies.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={<Flame className="w-7 h-7" />}
                title={
                  emergencyFilter === 'active'
                    ? 'No Active Emergency Calls'
                    : emergencyFilter === 'completed'
                    ? 'No Completed Trips'
                    : 'No Emergency Requests'
                }
                description={
                  emergencyFilter === 'active'
                    ? 'The live emergency triage queue is currently clear of active dispatches.'
                    : emergencyFilter === 'completed'
                    ? 'No completed emergency records currently stored in history.'
                    : 'The emergency dispatch queue is currently clear.'
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {displayedEmergencies.map((req) => {
                const isOngoing = req.status !== 'Completed' && req.status !== 'Cancelled';
                return (
                  <Card
                    key={req.id}
                    className={`p-5 border-l-4 transition-all ${
                      req.priority === 'Critical / Code Blue' || req.priority === 'CRITICAL / CODE BLUE'
                        ? 'border-l-rose-600 shadow-md'
                        : isOngoing
                        ? 'border-l-amber-500'
                        : 'border-l-emerald-500 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {req.id}
                          </span>
                          <Badge
                            variant={
                              req.priority === 'Critical / Code Blue' || req.priority === 'CRITICAL / CODE BLUE'
                                ? 'error'
                                : req.priority === 'High'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {req.priority}
                          </Badge>
                          <Badge
                            variant={
                              req.status === 'Requested'
                                ? 'error'
                                : req.status === 'Dispatched' || req.status === 'Patient Picked Up'
                                ? 'info'
                                : req.status === 'Completed'
                                ? 'success'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {req.status}
                          </Badge>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {req.requestDate} {req.requestTime}
                          </span>
                          {req.completedTime && (
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" /> Completed at {req.completedTime}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700 pt-1">
                          <p>
                            <strong>Patient:</strong> {req.patientName} ({req.patientPhone})
                          </p>
                          <p className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <strong>Pickup:</strong> {req.pickupLocation}
                          </p>
                          <p>
                            <strong>Emergency Type:</strong> {req.emergencyType}
                          </p>
                          <p>
                            <strong>Destination:</strong> {req.destinationHospital || req.destination || hospitalName}
                          </p>
                        </div>

                        {req.chiefComplaint && (
                          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <strong>Chief Complaint:</strong> {req.chiefComplaint}
                          </p>
                        )}

                        {req.assignedAmbulanceReg && (
                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                            <span className="flex items-center gap-1 text-teal-700">
                              <AmbulanceIcon className="w-4 h-4" /> Unit: {req.assignedAmbulanceReg}
                            </span>
                            <span>Paramedic: {req.assignedDriverName} ({req.driverPhone})</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons based on status */}
                      <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {req.status === 'Requested' && (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Send className="w-4 h-4" />}
                            onClick={() => handleOpenDispatch(req)}
                          >
                            Assign & Dispatch Unit
                          </Button>
                        )}

                        {req.status === 'Dispatched' && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Navigation className="w-4 h-4" />}
                            onClick={() => handleUpdateStatus(req.id, 'Patient Picked Up')}
                          >
                            Mark Picked Up
                          </Button>
                        )}

                        {req.status === 'Patient Picked Up' && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<AmbulanceIcon className="w-4 h-4" />}
                            onClick={() => handleUpdateStatus(req.id, 'Arrived at Hospital')}
                          >
                            Mark Arrived at Hospital
                          </Button>
                        )}

                        {req.status === 'Arrived at Hospital' && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                            onClick={() => handleUpdateStatus(req.id, 'Completed')}
                          >
                            Complete & Clear Unit
                          </Button>
                        )}

                        {req.status === 'Completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            onClick={() => setRequestToClear(req)}
                            className="border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                          >
                            Clear Record
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AMBULANCE FLEET INVENTORY */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Input
              placeholder="Search registration, vehicle model, VIN/chassis..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="w-full sm:w-80"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddAmbulance}
            >
              Add New Ambulance
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ambulances
              .filter(
                (a) =>
                  a.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (a.chassisNumber && a.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((amb) => (
                <Card key={amb.id} className="p-5 border-slate-200 hover:border-brand-400 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
                          {amb.vehiclePhotoUrl ? (
                            <img src={amb.vehiclePhotoUrl} alt={amb.regNumber} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <AmbulanceIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-sm tracking-tight">{amb.regNumber}</h4>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {amb.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{amb.model}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          amb.status === 'Available'
                            ? 'success'
                            : amb.status === 'Dispatched' || amb.status === 'On Trip'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {amb.status}
                      </Badge>
                    </div>

                    <div className="py-3 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Class & Type:</span>
                        <span className="font-semibold text-slate-800 text-right">{amb.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Ownership:</span>
                        <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-slate-100 text-slate-800">
                          {amb.ownershipType || 'Owned'} {amb.manufacturingYear ? `(${amb.manufacturingYear})` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Base / Branch:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[160px]">{amb.homeBranch || amb.currentLocation}</span>
                      </div>

                      {/* Equipment chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${amb.oxygenCylinderAvailable === 'Yes' || amb.oxygenCylinderAvailable === true ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                          <Heart className="w-3 h-3" /> O2 Cyl: {amb.oxygenCylinderAvailable === 'Yes' || amb.oxygenCylinderAvailable === true ? 'Yes' : 'No'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${amb.stretcherAvailable === 'Yes' || amb.stretcherAvailable === true ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                          <Check className="w-3 h-3" /> Stretcher: {amb.stretcherAvailable === 'Yes' || amb.stretcherAvailable === true ? 'Yes' : 'No'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${amb.defibrillatorAvailable === 'Yes' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                          AED: {amb.defibrillatorAvailable || 'Yes'}
                        </span>
                      </div>

                      {/* Fuel and Odometer */}
                      <div className="flex justify-between items-center pt-1.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5 text-amber-500" /> {amb.fuelType || 'Diesel'}:
                        </span>
                        <span className="font-bold text-slate-900">{amb.fuelLevel}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            amb.fuelLevel > 50 ? 'bg-emerald-500' : amb.fuelLevel > 20 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${amb.fuelLevel}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                    <div>
                      <p className="font-medium text-slate-700">Odometer: {(amb.odometerReading || amb.mileageKm).toLocaleString()} km</p>
                      <p className="text-[11px] text-slate-400">Next Service: {amb.nextMaintenanceDate}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedAmbulanceDetails(amb)}
                        title="View Specifications"
                      >
                        Specs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenEditAmbulance(amb)}
                        title="Edit Ambulance"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => setAmbulanceToDelete(amb)}
                        title="Delete Ambulance"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: DRIVER & PARAMEDIC ROSTER */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Input
              placeholder="Search staff name, role, license, staff ID..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="w-full sm:w-80"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddDriver}
            >
              Onboard Staff / Driver
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drivers
              .filter(
                (d) =>
                  d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (d.role && d.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  d.id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((drv) => (
                <Card key={drv.id} className="p-5 border-slate-200 hover:border-brand-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 overflow-hidden">
                          {drv.avatarUrl ? (
                            <img src={drv.avatarUrl} alt={drv.name} className="w-full h-full object-cover" />
                          ) : (
                            drv.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-sm">{drv.name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {drv.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="neutral" size="sm">
                              {drv.role || 'Ambulance Driver'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          drv.availabilityStatus === 'On Duty & Available' || drv.availabilityStatus === 'Available'
                            ? 'success'
                            : drv.availabilityStatus === 'On Active Trip' || drv.availabilityStatus === 'On Trip'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {drv.availabilityStatus}
                      </Badge>
                    </div>

                    <div className="py-3 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Mobile Phone:</span>
                        <span className="font-medium text-slate-800">{drv.phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Licence / Class:</span>
                        <span className="font-mono font-medium text-slate-800 truncate max-w-[170px]">
                          {drv.licenseNumber} ({drv.licenseType || 'EVOC'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Shift & Timings:</span>
                        <span className="font-medium text-slate-800">
                          {drv.shiftType || 'Morning'} ({drv.shiftStartTime || '08:00'} - {drv.shiftEndTime || '16:00'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Emergency Exp:</span>
                        <span className="font-semibold text-slate-800">{drv.emergencyExperienceYears} Years</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Completed 911 Trips:</span>
                        <span className="font-extrabold text-brand-600">{drv.completedTrips} Trips</span>
                      </div>

                      {drv.emergencyContactName && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-50 text-[11px]">
                          <span className="text-slate-400">Emergency Contact:</span>
                          <span className="text-slate-700 font-medium">
                            {drv.emergencyContactName} ({drv.emergencyContactRelationship || 'Relative'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="truncate max-w-[120px]">
                      {drv.assignedAmbulanceReg ? `Unit: ${drv.assignedAmbulanceReg}` : 'Unassigned'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedDriverDetails(drv)}
                        title="View Profile"
                      >
                        Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenEditDriver(drv)}
                        title="Edit Driver"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => setDriverToDelete(drv)}
                        title="Delete Driver"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: FLEET MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900">Fleet Maintenance & Calibration Logs</h3>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddMaintenance}
            >
              Log Service Record
            </Button>
          </div>

          <Card className="overflow-hidden border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Log ID & Unit</th>
                    <th className="py-3 px-4">Category & Status</th>
                    <th className="py-3 px-4">Service Details</th>
                    <th className="py-3 px-4">Service Provider & Tech</th>
                    <th className="py-3 px-4">Safety Inspection</th>
                    <th className="py-3 px-4">Odometer</th>
                    <th className="py-3 px-4 text-right">Cost (₹)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No maintenance records logged yet. Click "Log Service Record" to record maintenance.
                      </td>
                    </tr>
                  ) : (
                    maintenanceRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{rec.ambulanceReg}</div>
                          <div className="text-[10px] font-mono text-slate-400">{rec.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1.5">
                            <Badge
                              variant={
                                rec.category === 'Breakdown'
                                  ? 'error'
                                  : rec.category === 'Corrective'
                                  ? 'warning'
                                  : 'info'
                              }
                              size="sm"
                            >
                              {rec.category || 'Preventive'}
                            </Badge>
                            {rec.maintenanceStatus === 'Scheduled' && (
                              <div className="space-y-1">
                                <Badge variant="warning" dot size="sm">Scheduled</Badge>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMaintenanceStatus(rec.id, 'In Progress')}
                                  className="text-[10px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 hover:underline cursor-pointer"
                                  title="Mark In Progress and Ground Ambulance"
                                >
                                  <Wrench className="w-3 h-3 text-brand-600" /> Start Service
                                </button>
                              </div>
                            )}
                            {rec.maintenanceStatus === 'In Progress' && (
                              <div className="space-y-1">
                                <Badge variant="error" dot size="sm">In Progress</Badge>
                                <span className="text-[10px] text-rose-600 font-semibold block">Vehicle Grounded</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMaintenanceStatus(rec.id, 'Completed')}
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                                  title="Mark Completed and Restore Ambulance to Fleet"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete Service
                                </button>
                              </div>
                            )}
                            {(!rec.maintenanceStatus || rec.maintenanceStatus === 'Completed') && (
                              <div>
                                <Badge variant="success" dot size="sm">Completed</Badge>
                                <span className="text-[10px] text-emerald-600 block mt-0.5">Fleet Active</span>
                              </div>
                            )}
                            {rec.maintenanceStatus === 'Cancelled' && (
                              <Badge variant="neutral" size="sm">Cancelled</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-brand-700">{rec.serviceType}</div>
                          <div className="text-slate-500 truncate max-w-[180px]">{rec.description}</div>
                          <div className="text-[10px] text-slate-400">Date: {rec.serviceDate}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{rec.servicedBy}</div>
                          {rec.technicianName && (
                            <div className="text-[10px] text-slate-500">Tech: {rec.technicianName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              rec.safetyInspectionResult === 'Passed'
                                ? 'success'
                                : rec.safetyInspectionResult === 'Failed'
                                ? 'error'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {rec.safetyInspectionResult || 'Passed'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700">
                            {rec.odometerAtService ? `${rec.odometerAtService.toLocaleString()} km` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-slate-900">₹{(rec.cost || 0).toLocaleString()}</div>
                          {rec.partsCost !== undefined && (
                            <div className="text-[10px] text-slate-400">
                              Parts: ₹{(rec.partsCost || 0).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMaintenanceDetails(rec)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              title="View Details"
                            >
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                              onClick={() => handleOpenEditMaintenance(rec)}
                              leftIcon={<Edit className="w-3.5 h-3.5" />}
                              title="Edit Log"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setMaintenanceToDelete(rec)}
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              title="Delete Log"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* DISPATCH MODAL */}
      {selectedRequestForDispatch && (
        <Modal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          title={`Dispatch Ambulance for ${selectedRequestForDispatch.patientName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <strong>Emergency Triage:</strong> {selectedRequestForDispatch.emergencyType} (Priority:{' '}
              {selectedRequestForDispatch.priority})
              <p className="mt-1">Pickup: {selectedRequestForDispatch.pickupLocation}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select Available Ambulance Unit</label>
              <select
                value={selectedAmbulanceId}
                onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 focus:border-brand-500 focus:ring-brand-500 p-2.5 border bg-white"
              >
                {ambulances
                  .filter((a) => a.status === 'Available')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.regNumber} — {a.type} (Fuel: {a.fuelLevel}%)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select On-Duty Paramedic Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 focus:border-brand-500 focus:ring-brand-500 p-2.5 border bg-white"
              >
                {drivers
                  .filter((d) => d.availabilityStatus === 'On Duty & Available' || d.availabilityStatus === 'Available')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.role || 'Driver'}) — {d.phone}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDispatch}
                disabled={!selectedAmbulanceId || !selectedDriverId}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Confirm Dispatch
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 1. ADD AMBULANCE MODAL (ALL 6 REQUESTED SECTIONS)                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddAmbulanceModalOpen}
        onClose={() => { setIsAddAmbulanceModalOpen(false); setEditingAmbulance(null); }}
        title={editingAmbulance ? `Edit Ambulance Specifications (${editingAmbulance.regNumber})` : "Enroll New Ambulance Unit (Fleet Inventory)"}
        maxWidth="4xl"
      >
        <form onSubmit={handleAddAmbulance} className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* Section 1: Vehicle Identification and Registration */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">1</span>
              Vehicle Identification and Registration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle ID / Ambulance ID</label>
                <div className="px-3 py-2 bg-slate-200/80 border border-slate-300 rounded-lg text-xs font-mono text-slate-600">
                  {editingAmbulance ? editingAmbulance.id : "(Auto-generated upon save)"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Number *</label>
                <Input
                  required
                  placeholder="e.g. MH-12-AB-1234 or NY-EMRG-889"
                  value={newAmbulance.regNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, regNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Ownership Type *</label>
                <select
                  value={newAmbulance.ownershipType}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, ownershipType: e.target.value as AmbulanceOwnershipType })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Owned">Owned</option>
                  <option value="Leased">Leased</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Date</label>
                <Input
                  type="date"
                  value={newAmbulance.registrationDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, registrationDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Expiry Date</label>
                <Input
                  type="date"
                  value={newAmbulance.registrationExpiryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, registrationExpiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chassis Number (Optional)</label>
                <Input
                  placeholder="e.g. MA3EFA23S..."
                  value={newAmbulance.chassisNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, chassisNumber: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Engine Number (Optional)</label>
                <Input
                  placeholder="e.g. ENG-9988123-D"
                  value={newAmbulance.engineNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, engineNumber: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Specifications */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">2</span>
              Vehicle Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Make & Model *</label>
                <Input
                  required
                  placeholder="e.g. Force Traveller 3350 Mobile ICU / Mercedes Sprinter"
                  value={newAmbulance.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, model: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ambulance Type *</label>
                <select
                  value={newAmbulance.type}
                  onChange={(e) => setNewAmbulance({ ...newAmbulance, type: e.target.value as AmbulanceType })}
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Advanced Life Support (ALS)">Advanced Life Support (ALS)</option>
                  <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                  <option value="Patient Transport Ambulance">Patient Transport Ambulance</option>
                  <option value="Neonatal Ambulance">Neonatal Ambulance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturing Year</label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={newAmbulance.manufacturingYear}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, manufacturingYear: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seating Capacity (Pax)</label>
                <Input
                  type="number"
                  value={newAmbulance.seatingCapacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, seatingCapacity: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Carrying Capacity</label>
                <Input
                  type="number"
                  value={newAmbulance.patientCapacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, patientCapacity: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Odometer Reading (km) *</label>
                <Input
                  type="number"
                  value={newAmbulance.odometerReading}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({
                      ...newAmbulance,
                      odometerReading: Number(e.target.value),
                      mileageKm: Number(e.target.value)
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type *</label>
                <select
                  value={newAmbulance.fuelType}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, fuelType: e.target.value as AmbulanceFuelType })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Fuel Level (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newAmbulance.fuelLevel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, fuelLevel: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: Operational Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">3</span>
              Operational Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Status</label>
                <select
                  value={newAmbulance.status}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, status: e.target.value as AmbulanceStatus })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Driver (Optional)</label>
                <select
                  value={newAmbulance.assignedDriverId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const d = drivers.find((x) => x.id === selId);
                    setNewAmbulance({
                      ...newAmbulance,
                      assignedDriverId: selId,
                      assignedDriverName: d ? d.name : '',
                      driverPhone: d ? d.phone : '',
                    });
                  }}
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="">-- No driver assigned --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.role || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Paramedic / Crew (Optional)</label>
                <Input
                  placeholder="e.g. Paramedic EMT R. Sharma"
                  value={newAmbulance.assignedParamedic}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, assignedParamedic: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Home Hospital / Branch</label>
                <Input
                  placeholder="e.g. Apex Hospital - Main Branch"
                  value={newAmbulance.homeBranch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, homeBranch: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Location (Optional)</label>
                <Input
                  placeholder="e.g. Base Station Alpha / Emergency Bay 3"
                  value={newAmbulance.currentLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, currentLocation: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 4: Compliance and Documents */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">4</span>
              Compliance and Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Policy Number</label>
                <Input
                  placeholder="e.g. POL-BAJAJ-77189"
                  value={newAmbulance.insurancePolicyNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, insurancePolicyNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Expiry Date</label>
                <Input
                  type="date"
                  value={newAmbulance.insuranceExpiryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, insuranceExpiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fitness Certificate Expiry Date</label>
                <Input
                  type="date"
                  value={newAmbulance.fitnessCertExpiryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, fitnessCertExpiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Permit Expiry Date (Optional)</label>
                <Input
                  type="date"
                  value={newAmbulance.permitExpiryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, permitExpiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pollution Under Control (PUC) Expiry</label>
                <Input
                  type="date"
                  value={newAmbulance.pucExpiryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, pucExpiryDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 5: Equipment and Readiness */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">5</span>
              Equipment and Readiness
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Oxygen Cylinder Available *</label>
                <select
                  value={newAmbulance.oxygenCylinderAvailable}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, oxygenCylinderAvailable: e.target.value as 'Yes' | 'No' })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stretcher Available *</label>
                <select
                  value={newAmbulance.stretcherAvailable}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, stretcherAvailable: e.target.value as 'Yes' | 'No' })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Defibrillator Available *</label>
                <select
                  value={newAmbulance.defibrillatorAvailable}
                  onChange={(e) =>
                    setNewAmbulance({
                      ...newAmbulance,
                      defibrillatorAvailable: e.target.value as 'Yes' | 'No' | 'Not Applicable'
                    })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Category</label>
                <select
                  value={newAmbulance.equipmentCategory}
                  onChange={(e) =>
                    setNewAmbulance({
                      ...newAmbulance,
                      equipmentCategory: e.target.value as Ambulance['equipmentCategory']
                    })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Class A (Critical Telemetry)">Class A (Critical Telemetry)</option>
                  <option value="Class B (Defibrillator + O2)">Class B (Defibrillator + O2)</option>
                  <option value="Class C (Standard Transport)">Class C (Standard Transport)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Safety Inspection Date</label>
                <Input
                  type="date"
                  value={newAmbulance.lastSafetyInspectionDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, lastSafetyInspectionDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Maintenance Due Date</label>
                <Input
                  type="date"
                  value={newAmbulance.nextMaintenanceDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewAmbulance({ ...newAmbulance, nextMaintenanceDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Checklist Chips */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Essential Equipment Checklist</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STANDARD_EQUIPMENT_CHECKLIST.map((item) => {
                  const isChecked = newAmbulance.equipmentChecklist.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => {
                        if (isChecked) {
                          setNewAmbulance({
                            ...newAmbulance,
                            equipmentChecklist: newAmbulance.equipmentChecklist.filter((x) => x !== item)
                          });
                        } else {
                          setNewAmbulance({
                            ...newAmbulance,
                            equipmentChecklist: [...newAmbulance.equipmentChecklist, item]
                          });
                        }
                      }}
                      className={`text-left p-2 rounded-lg text-xs font-medium flex items-center gap-2 border transition-colors ${
                        isChecked
                          ? 'bg-brand-50 border-brand-300 text-brand-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-brand-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 6: Additional Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">6</span>
              Additional Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Photo (Optional)</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Image URL or upload file"
                    value={newAmbulance.vehiclePhotoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewAmbulance({ ...newAmbulance, vehiclePhotoUrl: e.target.value })
                    }
                  />
                  <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 p-2.5 rounded-lg flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setNewAmbulance({ ...newAmbulance, vehiclePhotoUrl: url }))}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, warranty details, bay assignment..."
                  value={newAmbulance.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewAmbulance({ ...newAmbulance, notes: e.target.value })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2 border bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsAddAmbulanceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Vehicle to Fleet
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. ADD DRIVER & PARAMEDIC MODAL (ALL 7 REQUESTED SECTIONS)                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddDriverModalOpen}
        onClose={() => { setIsAddDriverModalOpen(false); setEditingDriver(null); }}
        title="Onboard Driver & Paramedic Crew"
        maxWidth="4xl"
      >
        <form onSubmit={handleAddDriver} className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* Section 1: Staff Identification */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">1</span>
              Staff Identification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff ID</label>
                <div className="px-3 py-2 bg-slate-200/80 border border-slate-300 rounded-lg text-xs font-mono text-slate-600">
                  (Auto-generated upon save)
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newDriver.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Role *</label>
                <select
                  value={newDriver.role}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, role: e.target.value as AmbulanceStaffRole })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Ambulance Driver">Ambulance Driver</option>
                  <option value="Paramedic">Paramedic</option>
                  <option value="Emergency Medical Technician (EMT)">Emergency Medical Technician (EMT)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo (Optional)</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Avatar image URL or upload photo"
                    value={newDriver.avatarUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewDriver({ ...newDriver, avatarUrl: e.target.value })
                    }
                  />
                  <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 p-2.5 rounded-lg flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setNewDriver({ ...newDriver, avatarUrl: url }))}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal and Contact Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">2</span>
              Personal and Contact Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <Input
                  required
                  placeholder="+91 98765 43210"
                  value={newDriver.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alternative Contact Number</label>
                <Input
                  placeholder="+91 98111 22334"
                  value={newDriver.alternativePhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, alternativePhone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (For System Login) *</label>
                <Input
                  required
                  type="email"
                  placeholder="staff@hospital.com"
                  value={newDriver.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, email: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address (Optional)</label>
                <Input
                  placeholder="Street, City, Pincode"
                  value={newDriver.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Person</label>
                <Input
                  placeholder="e.g. Priya Kumar"
                  value={newDriver.emergencyContactName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, emergencyContactName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Relationship</label>
                <Input
                  placeholder="e.g. Spouse / Brother / Parent"
                  value={newDriver.emergencyContactRelationship}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, emergencyContactRelationship: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: Licence and Certification */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">3</span>
              Licence and Certification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licence Number *</label>
                <Input
                  required
                  placeholder="e.g. DL-MH-12-2019-0098"
                  value={newDriver.licenseNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, licenseNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licence Type / Class *</label>
                <Input
                  required
                  placeholder="Commercial Heavy / EVOC"
                  value={newDriver.licenseType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, licenseType: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licence Issue Date</label>
                <Input
                  type="date"
                  value={newDriver.licenseIssueDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, licenseIssueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licence Expiry Date *</label>
                <Input
                  type="date"
                  required
                  value={newDriver.licenseExpiry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, licenseExpiry: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">EVOC Certification Expiry</label>
                <Input
                  type="date"
                  value={newDriver.evocCertExpiry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, evocCertExpiry: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Aid / CPR Certification Expiry</label>
                <Input
                  type="date"
                  value={newDriver.cprCertExpiry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, cprCertExpiry: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Clearance Expiry</label>
                <Input
                  type="date"
                  value={newDriver.medicalClearanceExpiry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, medicalClearanceExpiry: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 4: Employment Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">4</span>
              Employment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID (If different)</label>
                <Input
                  placeholder="e.g. EMP-9902"
                  value={newDriver.employeeId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, employeeId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Joining</label>
                <Input
                  type="date"
                  value={newDriver.dateOfJoining}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, dateOfJoining: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type *</label>
                <select
                  value={newDriver.employmentType}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, employmentType: e.target.value as AmbulanceEmploymentType })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duty Status *</label>
                <select
                  value={newDriver.dutyStatus}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, dutyStatus: e.target.value as AmbulanceDutyStatus })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Hospital / Branch</label>
                <Input
                  placeholder="e.g. Apex Hospital - Main Trauma Center"
                  value={newDriver.assignedBranch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, assignedBranch: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 5: Duty and Shift Management */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">5</span>
              Duty and Shift Management
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Type *</label>
                <select
                  value={newDriver.shiftType}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, shiftType: e.target.value as AmbulanceShiftType })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  <option value="Rotational">Rotational</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Start Time</label>
                <Input
                  type="time"
                  value={newDriver.shiftStartTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, shiftStartTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift End Time</label>
                <Input
                  type="time"
                  value={newDriver.shiftEndTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, shiftEndTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Availability *</label>
                <select
                  value={newDriver.availabilityStatus}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, availabilityStatus: e.target.value as AmbulanceAvailabilityStatus })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="On Duty & Available">Available / On Duty</option>
                  <option value="On Active Trip">On Active Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="On Break">On Break</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Ambulance (Optional)</label>
                <select
                  value={newDriver.assignedAmbulanceId}
                  onChange={(e) => {
                    const ambId = e.target.value;
                    const amb = ambulances.find((x) => x.id === ambId);
                    setNewDriver({
                      ...newDriver,
                      assignedAmbulanceId: ambId,
                      assignedAmbulanceReg: amb ? amb.regNumber : ''
                    });
                  }}
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="">-- No vehicle assigned (Manage during dispatch) --</option>
                  {ambulances.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.regNumber} — {a.model} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 6: Qualifications and Experience */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">6</span>
              Qualifications and Experience
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Experience (Years)</label>
                <Input
                  type="number"
                  value={newDriver.emergencyExperienceYears}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, emergencyExperienceYears: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paramedic Registration / Cert No.</label>
                <Input
                  placeholder="e.g. PMC-CERT-88421"
                  value={newDriver.paramedicRegistrationNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, paramedicRegistrationNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Certification Expiry Date</label>
                <Input
                  type="date"
                  value={newDriver.certificationExpiryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDriver({ ...newDriver, certificationExpiryDate: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification & Training Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Diploma in Emergency Medical Services, ACLS & BLS Certified by AHA..."
                  value={newDriver.qualificationDetails}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewDriver({ ...newDriver, qualificationDetails: e.target.value })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2 border bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Additional Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">7</span>
              Additional Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Documents / Licence Upload (Optional)</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Document URL or upload attachment"
                    value={newDriver.documentUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewDriver({ ...newDriver, documentUrl: e.target.value })
                    }
                  />
                  <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 p-2.5 rounded-lg flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setNewDriver({ ...newDriver, documentUrl: url }))}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Background verification details, blood group, additional notes..."
                  value={newDriver.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewDriver({ ...newDriver, notes: e.target.value })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2 border bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsAddDriverModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Staff Profile & Create Login
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. ADD MAINTENANCE MODAL (ALL 5 REQUESTED SECTIONS & AUTO COST)            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddMaintenanceModalOpen}
        onClose={() => { setIsAddMaintenanceModalOpen(false); setEditingMaintenance(null); }}
        title="Log Vehicle Maintenance & Calibration"
        maxWidth="4xl"
      >
        <form onSubmit={handleAddMaintenance} className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* Section 1: Maintenance Record Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">1</span>
              Maintenance Record Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Log ID</label>
                <div className="px-3 py-2 bg-slate-200/80 border border-slate-300 rounded-lg text-xs font-mono text-slate-600">
                  (Auto-generated upon save)
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Ambulance Unit *</label>
                <select
                  required
                  value={newMaintenance.ambulanceId}
                  onChange={(e) => {
                    const ambId = e.target.value;
                    const amb = ambulances.find((a) => a.id === ambId);
                    setNewMaintenance({
                      ...newMaintenance,
                      ambulanceId: ambId,
                      odometerAtService: amb ? amb.odometerReading || amb.mileageKm : newMaintenance.odometerAtService
                    });
                  }}
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  {ambulances.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.regNumber} ({a.model})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Date *</label>
                <Input
                  type="date"
                  required
                  value={newMaintenance.serviceDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, serviceDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Category *</label>
                <select
                  value={newMaintenance.category}
                  onChange={(e) =>
                    setNewMaintenance({ ...newMaintenance, category: e.target.value as MaintenanceCategory })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Breakdown">Breakdown</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="col-span-full sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Status *</label>
                <select
                  value={newMaintenance.maintenanceStatus}
                  onChange={(e) => {
                    const st = e.target.value as MaintenanceStatus;
                    setNewMaintenance({
                      ...newMaintenance,
                      maintenanceStatus: st,
                      vehicleAvailability: (st === 'Completed' || st === 'Cancelled') ? 'Available' : 'Under Maintenance',
                    });
                  }}
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Scheduled">Scheduled (Planned future maintenance)</option>
                  <option value="In Progress">In Progress (Grounds vehicle from dispatch)</option>
                  <option value="Completed">Completed (Restores vehicle to available fleet)</option>
                  <option value="Cancelled">Cancelled (Aborts service)</option>
                </select>
              </div>
              <div className="col-span-full">
                {newMaintenance.maintenanceStatus === 'In Progress' && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Active Function:</strong> Setting status to <strong>'In Progress'</strong> automatically sets vehicle availability to <em>Under Maintenance</em> and updates the ambulance status to <strong>'Maintenance'</strong> so it cannot be dispatched.</span>
                  </div>
                )}
                {newMaintenance.maintenanceStatus === 'Completed' && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Active Function:</strong> Setting status to <strong>'Completed'</strong> automatically restores vehicle availability to <em>Available</em> and makes the ambulance active in the emergency fleet.</span>
                  </div>
                )}
                {newMaintenance.maintenanceStatus === 'Scheduled' && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Active Function:</strong> Maintenance is scheduled. The vehicle remains available in the active fleet until service begins.</span>
                  </div>
                )}
                {newMaintenance.maintenanceStatus === 'Cancelled' && (
                  <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                    <span><strong>Active Function:</strong> Maintenance cancelled. Vehicle returned to active fleet roster.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Service and Inspection Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">2</span>
              Service and Inspection Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Provider / Workshop *</label>
                <Input
                  required
                  placeholder="e.g. Metro Fleet Center / Authorized Workshop"
                  value={newMaintenance.servicedBy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, servicedBy: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type *</label>
                <select
                  value={newMaintenance.serviceType}
                  onChange={(e) =>
                    setNewMaintenance({ ...newMaintenance, serviceType: e.target.value })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Routine Inspection">Routine Inspection</option>
                  <option value="O2 & Telemetry Calibration">O2 & Telemetry Calibration</option>
                  <option value="Brakes & Tires">Brakes & Tires</option>
                  <option value="Engine Overhaul">Engine Overhaul</option>
                  <option value="Suspension & Steering">Suspension & Steering</option>
                  <option value="Electrical & Siren Repair">Electrical & Siren Repair</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Odometer Reading at Service (km) *</label>
                <Input
                  type="number"
                  required
                  value={newMaintenance.odometerAtService}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, odometerAtService: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technician / Mechanic Name (Optional)</label>
                <Input
                  placeholder="e.g. Suresh Varma (Lead Tech)"
                  value={newMaintenance.technicianName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, technicianName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Service Due Date *</label>
                <Input
                  type="date"
                  required
                  value={newMaintenance.nextServiceDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, nextServiceDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Service Due Odometer (km)</label>
                <Input
                  type="number"
                  placeholder="e.g. 25000"
                  value={newMaintenance.nextServiceOdometerKm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, nextServiceOdometerKm: Number(e.target.value) })
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reported Issue / Fault (Optional)</label>
                <Input
                  placeholder="e.g. Unusual brake shudder and oxygen regulator pressure drop"
                  value={newMaintenance.reportedIssue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, reportedIssue: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parts Replaced / Repairs Performed</label>
                <Input
                  placeholder="e.g. Replaced front ceramic brake pads, calibrated O2 pressure valve, oil filter replacement"
                  value={newMaintenance.partsReplaced}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, partsReplaced: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cost and Payment Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">3</span>
              Cost and Payment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parts Cost (₹)</label>
                <Input
                  type="number"
                  value={newMaintenance.partsCost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const p = Number(e.target.value);
                    const total = p + (Number(newMaintenance.labourCost) || 0) + (Number(newMaintenance.otherCharges) || 0);
                    setNewMaintenance({ ...newMaintenance, partsCost: p, cost: total });
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Labour Cost (₹)</label>
                <Input
                  type="number"
                  value={newMaintenance.labourCost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const l = Number(e.target.value);
                    const total = (Number(newMaintenance.partsCost) || 0) + l + (Number(newMaintenance.otherCharges) || 0);
                    setNewMaintenance({ ...newMaintenance, labourCost: l, cost: total });
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Other Charges (₹)</label>
                <Input
                  type="number"
                  value={newMaintenance.otherCharges}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const o = Number(e.target.value);
                    const total = (Number(newMaintenance.partsCost) || 0) + (Number(newMaintenance.labourCost) || 0) + o;
                    setNewMaintenance({ ...newMaintenance, otherCharges: o, cost: total });
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">Total Cost (₹) — Auto-calculated</label>
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {((newMaintenance.partsCost || 0) + (newMaintenance.labourCost || 0) + (newMaintenance.otherCharges || 0)).toLocaleString()}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice / Receipt Number (Optional)</label>
                <Input
                  placeholder="e.g. INV-MF-88991"
                  value={newMaintenance.invoiceNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, invoiceNumber: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Attachment (Optional)</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="URL or upload receipt"
                    value={newMaintenance.invoiceAttachmentUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewMaintenance({ ...newMaintenance, invoiceAttachmentUrl: e.target.value })
                    }
                  />
                  <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 p-2.5 rounded-lg flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setNewMaintenance({ ...newMaintenance, invoiceAttachmentUrl: url }))}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Vehicle Availability and Safety */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">4</span>
              Vehicle Availability and Safety
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Availability</label>
                <select
                  value={newMaintenance.vehicleAvailability}
                  onChange={(e) =>
                    setNewMaintenance({
                      ...newMaintenance,
                      vehicleAvailability: e.target.value as VehicleAvailabilityDuringMaintenance
                    })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Available">Available (Ready for Dispatch)</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Safety Inspection Result</label>
                <select
                  value={newMaintenance.safetyInspectionResult}
                  onChange={(e) =>
                    setNewMaintenance({
                      ...newMaintenance,
                      safetyInspectionResult: e.target.value as SafetyInspectionResult
                    })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
                >
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return-to-Service Date</label>
                <Input
                  type="date"
                  value={newMaintenance.returnToServiceDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, returnToServiceDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verified By (Authorized Staff)</label>
                <Input
                  placeholder="e.g. Fleet Mgr. Dr. Patel"
                  value={newMaintenance.verifiedBy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMaintenance({ ...newMaintenance, verifiedBy: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 5: Additional Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">5</span>
              Additional Details & Follow-up Notes
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summary of service completed, observations, post-calibration tests..."
                  value={newMaintenance.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewMaintenance({ ...newMaintenance, description: e.target.value })
                  }
                  className="w-full text-xs rounded-lg border-slate-300 p-2 border bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supporting Documents / Photos (Optional)</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="URL or upload inspection sheet"
                    value={newMaintenance.supportingDocsUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewMaintenance({ ...newMaintenance, supportingDocsUrl: e.target.value })
                    }
                  />
                  <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 p-2.5 rounded-lg flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setNewMaintenance({ ...newMaintenance, supportingDocsUrl: url }))}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsAddMaintenanceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Maintenance Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* VIEW MODAL: AMBULANCE FULL SPECIFICATIONS & COMPLIANCE SHEET              */}
      {/* ========================================================================= */}
      {selectedAmbulanceDetails && (
        <Modal
          isOpen={!!selectedAmbulanceDetails}
          onClose={() => setSelectedAmbulanceDetails(null)}
          title={`Ambulance Unit: ${selectedAmbulanceDetails.regNumber} (${selectedAmbulanceDetails.id})`}
          maxWidth="4xl"
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
            {/* Header banner */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                  <AmbulanceIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedAmbulanceDetails.model}</h3>
                  <p className="text-xs text-slate-600">
                    {selectedAmbulanceDetails.type} • {selectedAmbulanceDetails.ownershipType || 'Owned'} • Base: {selectedAmbulanceDetails.homeBranch || selectedAmbulanceDetails.currentLocation}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  selectedAmbulanceDetails.status === 'Available'
                    ? 'success'
                    : selectedAmbulanceDetails.status === 'Dispatched' || selectedAmbulanceDetails.status === 'On Trip'
                    ? 'info'
                    : 'warning'
                }
                size="md"
              >
                {selectedAmbulanceDetails.status}
              </Badge>
            </div>

            {/* 1. Vehicle Identification */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-600" />
                1. Vehicle Identification and Registration
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Ambulance ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedAmbulanceDetails.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registration Number:</span>
                  <span className="font-bold text-slate-900">{selectedAmbulanceDetails.regNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ownership Type:</span>
                  <span className="font-medium text-slate-800">{selectedAmbulanceDetails.ownershipType || 'Owned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registration Date:</span>
                  <span className="font-medium text-slate-700">{selectedAmbulanceDetails.registrationDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registration Expiry Date:</span>
                  <span className="font-medium text-slate-700">{selectedAmbulanceDetails.registrationExpiryDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Chassis Number:</span>
                  <span className="font-mono text-slate-700">{selectedAmbulanceDetails.chassisNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Engine Number:</span>
                  <span className="font-mono text-slate-700">{selectedAmbulanceDetails.engineNumber || '—'}</span>
                </div>
              </div>
            </div>

            {/* 2. Vehicle Specifications */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" />
                2. Vehicle Specifications
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Manufacturing Year:</span>
                  <span className="font-semibold text-slate-800">{selectedAmbulanceDetails.manufacturingYear || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Seating Capacity:</span>
                  <span className="font-semibold text-slate-800">{selectedAmbulanceDetails.seatingCapacity || 4} Persons</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Patient Carrying Capacity:</span>
                  <span className="font-semibold text-slate-800">{selectedAmbulanceDetails.patientCapacity || 1} Stretcher</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Odometer Reading:</span>
                  <span className="font-bold text-slate-900">{(selectedAmbulanceDetails.odometerReading || selectedAmbulanceDetails.mileageKm).toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fuel Type:</span>
                  <span className="font-semibold text-slate-800">{selectedAmbulanceDetails.fuelType || 'Diesel'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fuel Level:</span>
                  <span className="font-bold text-slate-900">{selectedAmbulanceDetails.fuelLevel}%</span>
                </div>
              </div>
            </div>

            {/* 3. Operational Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-brand-600" />
                3. Operational Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Current Status:</span>
                  <span className="font-bold text-slate-800">{selectedAmbulanceDetails.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Driver:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAmbulanceDetails.assignedDriverName || 'Not assigned'}
                    {selectedAmbulanceDetails.driverPhone ? ` (${selectedAmbulanceDetails.driverPhone})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Paramedic / Crew:</span>
                  <span className="font-semibold text-slate-800">{selectedAmbulanceDetails.assignedParamedic || 'Standard EMT Crew'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Home Hospital / Branch:</span>
                  <span className="font-medium text-slate-800">{selectedAmbulanceDetails.homeBranch || selectedAmbulanceDetails.hospitalName}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Current Location:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {selectedAmbulanceDetails.currentLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Compliance and Documents */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                4. Compliance and Documents
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Insurance Policy Number:</span>
                  <span className="font-mono text-slate-800">{selectedAmbulanceDetails.insurancePolicyNumber || 'POL-99281'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Insurance Expiry Date:</span>
                  <span className="font-medium text-slate-800">{selectedAmbulanceDetails.insuranceExpiryDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fitness Certificate Expiry:</span>
                  <span className="font-medium text-slate-800">{selectedAmbulanceDetails.fitnessCertExpiryDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Permit Expiry Date:</span>
                  <span className="font-medium text-slate-800">{selectedAmbulanceDetails.permitExpiryDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PUC Expiry Date:</span>
                  <span className="font-medium text-slate-800">{selectedAmbulanceDetails.pucExpiryDate || '—'}</span>
                </div>
              </div>
            </div>

            {/* 5. Equipment and Readiness */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600" />
                5. Equipment and Readiness
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 block">Oxygen Cylinder Available:</span>
                  <Badge variant={selectedAmbulanceDetails.oxygenCylinderAvailable === 'Yes' || selectedAmbulanceDetails.oxygenCylinderAvailable === true ? 'success' : 'neutral'} size="sm">
                    {selectedAmbulanceDetails.oxygenCylinderAvailable === 'Yes' || selectedAmbulanceDetails.oxygenCylinderAvailable === true ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block">Stretcher Available:</span>
                  <Badge variant={selectedAmbulanceDetails.stretcherAvailable === 'Yes' || selectedAmbulanceDetails.stretcherAvailable === true ? 'success' : 'neutral'} size="sm">
                    {selectedAmbulanceDetails.stretcherAvailable === 'Yes' || selectedAmbulanceDetails.stretcherAvailable === true ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block">Defibrillator Available:</span>
                  <Badge variant={selectedAmbulanceDetails.defibrillatorAvailable === 'Yes' ? 'success' : 'neutral'} size="sm">
                    {selectedAmbulanceDetails.defibrillatorAvailable || 'Yes'}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block">Equipment Level:</span>
                  <span className="font-semibold text-slate-800">{selectedAmbulanceDetails.equipmentCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last Safety Inspection:</span>
                  <span className="font-medium text-slate-700">{selectedAmbulanceDetails.lastSafetyInspectionDate || selectedAmbulanceDetails.lastMaintenanceDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Next Maintenance Due:</span>
                  <span className="font-medium text-slate-700">{selectedAmbulanceDetails.nextMaintenanceDate}</span>
                </div>
              </div>

              {selectedAmbulanceDetails.equipmentChecklist && selectedAmbulanceDetails.equipmentChecklist.length > 0 && (
                <div className="pt-3">
                  <span className="text-xs font-semibold text-slate-600 block mb-2">Verified Onboard Equipment:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAmbulanceDetails.equipmentChecklist.map((item, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Additional Details */}
            {selectedAmbulanceDetails.notes && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="text-slate-400 block font-bold uppercase mb-1">6. Notes / Remarks:</span>
                <p>{selectedAmbulanceDetails.notes}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 w-full sm:w-auto"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  const amb = selectedAmbulanceDetails;
                  setSelectedAmbulanceDetails(null);
                  setAmbulanceToDelete(amb);
                }}
              >
                Delete Ambulance
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-brand-700 hover:bg-brand-50"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => {
                    const amb = selectedAmbulanceDetails;
                    setSelectedAmbulanceDetails(null);
                    handleOpenEditAmbulance(amb);
                  }}
                >
                  Edit Specifications
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedAmbulanceDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODAL: DRIVER & PARAMEDIC FULL PROFILE & CREDENTIALS                  */}
      {/* ========================================================================= */}
      {selectedDriverDetails && (
        <Modal
          isOpen={!!selectedDriverDetails}
          onClose={() => setSelectedDriverDetails(null)}
          title={`Staff Profile: ${selectedDriverDetails.name} (${selectedDriverDetails.id})`}
          maxWidth="4xl"
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-base overflow-hidden">
                  {selectedDriverDetails.avatarUrl ? (
                    <img src={selectedDriverDetails.avatarUrl} alt={selectedDriverDetails.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedDriverDetails.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedDriverDetails.name}</h3>
                  <p className="text-xs text-slate-600">
                    {selectedDriverDetails.role || 'Ambulance Driver'} • {selectedDriverDetails.employmentType || 'Full-Time'} • {selectedDriverDetails.emergencyExperienceYears} Years Experience
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  selectedDriverDetails.availabilityStatus === 'On Duty & Available' || selectedDriverDetails.availabilityStatus === 'Available'
                    ? 'success'
                    : selectedDriverDetails.availabilityStatus === 'On Active Trip' || selectedDriverDetails.availabilityStatus === 'On Trip'
                    ? 'info'
                    : 'neutral'
                }
                size="md"
              >
                {selectedDriverDetails.availabilityStatus}
              </Badge>
            </div>

            {/* 1. Identification & Contact */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-brand-600" />
                1 & 2. Identification and Contact Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Staff ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedDriverDetails.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Employee ID:</span>
                  <span className="font-mono text-slate-800">{selectedDriverDetails.employeeId || selectedDriverDetails.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mobile Number:</span>
                  <span className="font-bold text-slate-900">{selectedDriverDetails.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email Address:</span>
                  <span className="font-medium text-slate-800">{selectedDriverDetails.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Alternative Phone:</span>
                  <span className="font-medium text-slate-700">{selectedDriverDetails.alternativePhone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Emergency Contact:</span>
                  <span className="font-medium text-slate-800">
                    {selectedDriverDetails.emergencyContactName
                      ? `${selectedDriverDetails.emergencyContactName} (${selectedDriverDetails.emergencyContactRelationship || 'Relative'})`
                      : '—'}
                  </span>
                </div>
                {selectedDriverDetails.address && (
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 block">Address:</span>
                    <span className="text-slate-700">{selectedDriverDetails.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Licence and Certification */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                3. Licence and Certifications
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Licence Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedDriverDetails.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Licence Type / Class:</span>
                  <span className="font-medium text-slate-800">{selectedDriverDetails.licenseType || 'Commercial EVOC'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Licence Expiry:</span>
                  <span className="font-semibold text-slate-800">{selectedDriverDetails.licenseExpiry}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">EVOC Cert Expiry:</span>
                  <span className="font-medium text-slate-700">{selectedDriverDetails.evocCertExpiry || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">CPR / First Aid Cert Expiry:</span>
                  <span className="font-medium text-slate-700">{selectedDriverDetails.cprCertExpiry || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Medical Clearance Expiry:</span>
                  <span className="font-medium text-slate-700">{selectedDriverDetails.medicalClearanceExpiry || '—'}</span>
                </div>
              </div>
            </div>

            {/* 4 & 5. Duty, Shift & Employment */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                4 & 5. Duty, Shift and Employment Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Employment Type:</span>
                  <span className="font-semibold text-slate-800">{selectedDriverDetails.employmentType || 'Full-Time'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Duty Status:</span>
                  <span className="font-semibold text-slate-800">{selectedDriverDetails.dutyStatus || 'Active'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Branch:</span>
                  <span className="font-medium text-slate-800">{selectedDriverDetails.assignedBranch || selectedDriverDetails.hospitalName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shift Type:</span>
                  <span className="font-semibold text-slate-800">{selectedDriverDetails.shiftType || 'Morning'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shift Timings:</span>
                  <span className="font-medium text-slate-800">
                    {selectedDriverDetails.shiftStartTime || '08:00'} - {selectedDriverDetails.shiftEndTime || '16:00'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Ambulance:</span>
                  <span className="font-bold text-teal-700">{selectedDriverDetails.assignedAmbulanceReg || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            {/* 6 & 7. Qualifications & Additional */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-600" />
                6 & 7. Qualifications and Additional Details
              </h4>
              <p>
                <strong>Qualifications / Training:</strong> {selectedDriverDetails.qualificationDetails || 'Standard EMS Driving Protocol'}
              </p>
              {selectedDriverDetails.paramedicRegistrationNumber && (
                <p>
                  <strong>Paramedic Reg No:</strong> {selectedDriverDetails.paramedicRegistrationNumber} (Exp: {selectedDriverDetails.certificationExpiryDate || '—'})
                </p>
              )}
              {selectedDriverDetails.notes && (
                <p>
                  <strong>Notes / Remarks:</strong> {selectedDriverDetails.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 w-full sm:w-auto"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  const drv = selectedDriverDetails;
                  setSelectedDriverDetails(null);
                  setDriverToDelete(drv);
                }}
              >
                Delete Staff
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-brand-700 hover:bg-brand-50"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => {
                    const drv = selectedDriverDetails;
                    setSelectedDriverDetails(null);
                    handleOpenEditDriver(drv);
                  }}
                >
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDriverDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODAL: MAINTENANCE RECORD FULL REPORT                                */}
      {/* ========================================================================= */}
      {selectedMaintenanceDetails && (
        <Modal
          isOpen={!!selectedMaintenanceDetails}
          onClose={() => setSelectedMaintenanceDetails(null)}
          title={`Maintenance Log: ${selectedMaintenanceDetails.id} (${selectedMaintenanceDetails.ambulanceReg})`}
          maxWidth="2xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedMaintenanceDetails.serviceType}</h3>
                <p className="text-xs text-slate-600">
                  Vehicle: {selectedMaintenanceDetails.ambulanceReg} • Date: {selectedMaintenanceDetails.serviceDate}
                </p>
              </div>
              <Badge
                variant={
                  selectedMaintenanceDetails.category === 'Breakdown'
                    ? 'error'
                    : selectedMaintenanceDetails.category === 'Corrective'
                    ? 'warning'
                    : 'info'
                }
                size="md"
              >
                {selectedMaintenanceDetails.category || 'Preventive'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Service Provider:</span>
                <span className="font-bold text-slate-800">{selectedMaintenanceDetails.servicedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Technician Name:</span>
                <span className="font-medium text-slate-800">{selectedMaintenanceDetails.technicianName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Odometer at Service:</span>
                <span className="font-semibold text-slate-800">
                  {selectedMaintenanceDetails.odometerAtService ? `${selectedMaintenanceDetails.odometerAtService.toLocaleString()} km` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Next Service Due:</span>
                <span className="font-semibold text-slate-800">
                  {selectedMaintenanceDetails.nextServiceDate}
                  {selectedMaintenanceDetails.nextServiceOdometerKm ? ` (${selectedMaintenanceDetails.nextServiceOdometerKm.toLocaleString()} km)` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Safety Inspection:</span>
                <Badge variant={selectedMaintenanceDetails.safetyInspectionResult === 'Passed' ? 'success' : 'error'} size="sm">
                  {selectedMaintenanceDetails.safetyInspectionResult || 'Passed'}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block">Vehicle Status:</span>
                <span className="font-medium text-slate-800">{selectedMaintenanceDetails.vehicleAvailability || 'Available'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Verified By:</span>
                <span className="font-medium text-slate-800">{selectedMaintenanceDetails.verifiedBy || 'Authorized Officer'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Invoice / Receipt:</span>
                <span className="font-mono text-slate-800">{selectedMaintenanceDetails.invoiceNumber || '—'}</span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs space-y-1.5">
              <h5 className="font-bold text-emerald-900 uppercase text-[11px] mb-1">Cost & Payment Breakdown</h5>
              <div className="flex justify-between text-slate-700">
                <span>Parts Cost:</span>
                <span>₹{(selectedMaintenanceDetails.partsCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Labour Cost:</span>
                <span>₹{(selectedMaintenanceDetails.labourCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Other Charges:</span>
                <span>₹{(selectedMaintenanceDetails.otherCharges || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-emerald-200 pt-1.5 text-sm">
                <span>Total Maintenance Cost:</span>
                <span className="text-emerald-800">₹{(selectedMaintenanceDetails.cost || 0).toLocaleString()}</span>
              </div>
            </div>

            {selectedMaintenanceDetails.reportedIssue && (
              <div className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong>Reported Issue:</strong> {selectedMaintenanceDetails.reportedIssue}
              </div>
            )}

            {selectedMaintenanceDetails.partsReplaced && (
              <div className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong>Parts Replaced / Work Done:</strong> {selectedMaintenanceDetails.partsReplaced}
              </div>
            )}

            <div className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong>Service Summary:</strong> {selectedMaintenanceDetails.description}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 w-full sm:w-auto"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  const rec = selectedMaintenanceDetails;
                  setSelectedMaintenanceDetails(null);
                  setMaintenanceToDelete(rec);
                }}
              >
                Delete Log
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-brand-700 hover:bg-brand-50"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => {
                    const rec = selectedMaintenanceDetails;
                    setSelectedMaintenanceDetails(null);
                    handleOpenEditMaintenance(rec);
                  }}
                >
                  Edit Log
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedMaintenanceDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE AMBULANCE CONFIRMATION MODAL */}
      {ambulanceToDelete && (
        <Modal
          isOpen={!!ambulanceToDelete}
          onClose={() => setAmbulanceToDelete(null)}
          title="Confirm Ambulance Decommission / Deletion"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Permanent Fleet Removal</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">
                  Are you sure you want to decommission and remove unit <span className="font-bold font-mono text-rose-950">{ambulanceToDelete.regNumber}</span> ({ambulanceToDelete.model || ambulanceToDelete.type})? This action cannot be reversed.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAmbulanceToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                onClick={handleConfirmDeleteAmbulance}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE DRIVER / PARAMEDIC CONFIRMATION MODAL */}
      {driverToDelete && (
        <Modal
          isOpen={!!driverToDelete}
          onClose={() => setDriverToDelete(null)}
          title="Confirm Staff Removal from Roster"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Remove from Emergency Roster</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">
                  Are you sure you want to remove <span className="font-bold text-rose-950">{driverToDelete.name}</span> ({driverToDelete.role}, Staff ID: <span className="font-mono">{driverToDelete.id}</span>)? Active shifts and vehicle assignments will be released.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDriverToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                onClick={handleConfirmDeleteDriver}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Confirm Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE MAINTENANCE LOG CONFIRMATION MODAL */}
      {maintenanceToDelete && (
        <Modal
          isOpen={!!maintenanceToDelete}
          onClose={() => setMaintenanceToDelete(null)}
          title="Confirm Maintenance Log Deletion"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Permanent Record Deletion</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">
                  Are you sure you want to delete maintenance record <span className="font-mono font-bold text-rose-950">{maintenanceToDelete.id}</span> for unit <span className="font-bold text-rose-950">{maintenanceToDelete.ambulanceReg}</span> logged on {maintenanceToDelete.serviceDate}?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setMaintenanceToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                onClick={handleConfirmDeleteMaintenance}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CLEAR ALL COMPLETED EMERGENCY REQUESTS CONFIRMATION MODAL */}
      <Modal
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        title="Clear All Completed Emergency Records"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-950 text-sm">Clear Completed Dispatch Records?</p>
              <p className="mt-1 text-rose-700 leading-relaxed">
                This will permanently clear and remove all <span className="font-bold text-rose-950">{completedEmergencies.length}</span> completed emergency triage record{completedEmergencies.length > 1 ? 's' : ''} from the live queue and server history. Ongoing emergency dispatches will not be affected.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsClearAllConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleConfirmClearAllCompleted}
            >
              Confirm Clear All ({completedEmergencies.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* CLEAR SINGLE EMERGENCY REQUEST CONFIRMATION MODAL */}
      {requestToClear && (
        <Modal
          isOpen={!!requestToClear}
          onClose={() => setRequestToClear(null)}
          title="Clear Emergency Record"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 text-sm">Remove Record from Queue?</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Are you sure you want to clear completed emergency dispatch record <span className="font-mono font-bold text-amber-950">{requestToClear.id}</span> for patient <span className="font-bold text-amber-950">{requestToClear.patientName}</span>?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRequestToClear(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleConfirmClearSingle}
              >
                Clear Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AmbulanceManagement;
