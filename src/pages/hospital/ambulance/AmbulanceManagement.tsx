import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { MockStorage } from '../../../services/mockStorage';
import {
  Ambulance,
  AmbulanceDriver,
  EmergencyRequest,
  AmbulanceMaintenance,
  EmergencyPriority,
  AmbulanceType,
  AmbulanceStatus
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
  PhoneCall,
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
  ShieldAlert,
  Fuel,
  Activity,
  AlertTriangle,
  Send,
  Navigation,
  Check,
  X
} from 'lucide-react';

export const AmbulanceManagement: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const hospitalId = user?.hospitalId || 'HOSP-001';

  const [activeTab, setActiveTab] = useState('dispatch');
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [drivers, setDrivers] = useState<AmbulanceDriver[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<AmbulanceMaintenance[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedRequestForDispatch, setSelectedRequestForDispatch] = useState<EmergencyRequest | null>(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const [isAddAmbulanceModalOpen, setIsAddAmbulanceModalOpen] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({
    regNumber: '',
    type: 'Advanced Life Support (ALS)' as AmbulanceType,
    model: '',
    equipmentCategory: 'Class A (Critical Telemetry)' as Ambulance['equipmentCategory'],
    currentLocation: 'Base Station Alpha',
    fuelLevel: 100,
    mileageKm: 12000,
  });

  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '2028-12-31',
    emergencyExperienceYears: 5,
  });

  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    ambulanceId: '',
    serviceType: 'Routine Inspection' as AmbulanceMaintenance['serviceType'],
    description: '',
    cost: 450,
    servicedBy: 'Metro Fleet Services Inc.',
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
  const onDutyDrivers = drivers.filter((d) => d.availabilityStatus === 'On Duty & Available').length;

  const handleOpenDispatch = (request: EmergencyRequest) => {
    setSelectedRequestForDispatch(request);
    const firstAvailAmb = ambulances.find((a) => a.status === 'Available');
    const firstAvailDrv = drivers.find((d) => d.availabilityStatus === 'On Duty & Available');
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
    showToast('Trip Status Updated', `Emergency request ${requestId} updated to ${status}.`, 'info');
  };

  const handleAddAmbulance = (e: React.FormEvent) => {
    e.preventDefault();
    const amb: Ambulance = {
      id: `AMB-${Date.now().toString().slice(-3)}`,
      hospitalId,
      hospitalName: 'Apex Medical Center',
      regNumber: newAmbulance.regNumber,
      type: newAmbulance.type,
      model: newAmbulance.model,
      equipmentCategory: newAmbulance.equipmentCategory,
      status: 'Available',
      currentLocation: newAmbulance.currentLocation,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      fuelLevel: newAmbulance.fuelLevel,
      mileageKm: newAmbulance.mileageKm,
    };

    MockStorage.saveAmbulance(amb);
    showToast('Ambulance Registered', `Unit ${amb.regNumber} has been added to the fleet.`, 'success');
    setIsAddAmbulanceModalOpen(false);
    setNewAmbulance({
      regNumber: '',
      type: 'Advanced Life Support (ALS)',
      model: '',
      equipmentCategory: 'Class A (Critical Telemetry)',
      currentLocation: 'Base Station Alpha',
      fuelLevel: 100,
      mileageKm: 12000,
    });
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const drv: AmbulanceDriver = {
      id: `DRV-${Date.now().toString().slice(-3)}`,
      hospitalId,
      hospitalName: 'Apex Medical Center',
      name: newDriver.name,
      email: newDriver.email,
      phone: newDriver.phone,
      licenseNumber: newDriver.licenseNumber,
      licenseExpiry: newDriver.licenseExpiry,
      availabilityStatus: 'On Duty & Available',
      status: 'active',
      completedTrips: 0,
      emergencyExperienceYears: newDriver.emergencyExperienceYears,
    };

    MockStorage.saveAmbulanceDriver(drv);
    showToast('Paramedic Driver Onboarded', `${drv.name} has been added to the emergency team roster.`, 'success');
    setIsAddDriverModalOpen(false);
    setNewDriver({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseExpiry: '2028-12-31',
      emergencyExperienceYears: 5,
    });
  };

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const amb = ambulances.find((a) => a.id === newMaintenance.ambulanceId);
    if (!amb) return;

    const mnt: AmbulanceMaintenance = {
      id: `MNT-${Date.now().toString().slice(-3)}`,
      hospitalId,
      ambulanceId: amb.id,
      ambulanceReg: amb.regNumber,
      serviceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      serviceType: newMaintenance.serviceType,
      description: newMaintenance.description,
      cost: newMaintenance.cost,
      servicedBy: newMaintenance.servicedBy,
    };

    MockStorage.saveAmbulanceMaintenance(mnt);
    showToast('Maintenance Logged', `Service record logged for unit ${amb.regNumber}.`, 'success');
    setIsAddMaintenanceModalOpen(false);
  };

  const handleExportCSV = () => {
    MockStorage.exportToCSV('Ambulance_Fleet_Export', ambulances);
    showToast('CSV Exported', 'Ambulance fleet records downloaded successfully.', 'success');
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
            Dispatch 911 emergency response units, monitor active telemetry, manage paramedic roster, and maintain fleet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
            Export Fleet
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddAmbulanceModalOpen(true)}
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
          subtext="Registered emergency vehicles"
        />
        <StatCard
          title="Available Units"
          value={availableAmbulances}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
          subtext="Ready for instant dispatch"
        />
        <StatCard
          title="Active Emergency Trips"
          value={activeTrips}
          icon={<Flame className="w-5 h-5" />}
          accentColor="amber"
          subtext="In transit / on site"
        />
        <StatCard
          title="On-Duty Paramedics"
          value={onDutyDrivers}
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="purple"
          subtext="Available drivers"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 1: EMERGENCY 911 DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
              Live Emergency Triage Queue
            </h3>
            <span className="text-xs text-slate-500 font-medium">Real-time reactive synchronization active</span>
          </div>

          {emergencyRequests.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={<Flame className="w-7 h-7" />}
                title="No Emergency Requests"
                description="The emergency dispatch queue is currently clear."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {emergencyRequests.map((req) => {
                const isOngoing = req.status !== 'Completed' && req.status !== 'Cancelled';
                return (
                  <Card
                    key={req.id}
                    className={`p-5 border-l-4 transition-all ${
                      req.priority === 'Critical / Code Blue'
                        ? 'border-l-rose-600 shadow-md'
                        : isOngoing
                        ? 'border-l-amber-500'
                        : 'border-l-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-400">{req.id}</span>
                          <span className="font-bold text-slate-900 text-base">{req.emergencyType}</span>
                          <Badge
                            variant={
                              req.priority === 'Critical / Code Blue' || req.priority === 'High'
                                ? 'error'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {req.priority}
                          </Badge>
                          <Badge
                            variant={
                              req.status === 'Completed'
                                ? 'success'
                                : req.status === 'Dispatched' || req.status === 'Patient Picked Up'
                                ? 'info'
                                : req.status === 'Cancelled'
                                ? 'neutral'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {req.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">Patient:</span>
                            <span>{req.patientName} ({req.patientPhone})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{req.pickupLocation}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Requested at: {req.requestTime}</span>
                          </div>
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
              placeholder="Search registration, vehicle model..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="w-full sm:w-80"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddAmbulanceModalOpen(true)}
            >
              Add New Unit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ambulances
              .filter(
                (a) =>
                  a.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.model.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((amb) => (
                <Card key={amb.id} className="p-5 border-slate-200 hover:border-brand-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <AmbulanceIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{amb.regNumber}</h4>
                        <p className="text-xs text-slate-500">{amb.model}</p>
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
                    <div className="flex justify-between">
                      <span className="text-slate-400">Class:</span>
                      <span className="font-semibold text-slate-800">{amb.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Equipment:</span>
                      <span className="font-medium text-slate-700">{amb.equipmentCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Station:</span>
                      <span className="font-medium text-slate-700">{amb.currentLocation}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5 text-amber-500" /> Fuel Level:
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

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Odometer: {amb.mileageKm.toLocaleString()} km</span>
                    <span>Next Service: {amb.nextMaintenanceDate}</span>
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
              placeholder="Search paramedic name, license..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="w-full sm:w-80"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddDriverModalOpen(true)}
            >
              Add Paramedic Driver
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drivers
              .filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((drv) => (
                <Card key={drv.id} className="p-5 border-slate-200 hover:border-brand-300 transition-all">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        {drv.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{drv.name}</h4>
                        <p className="text-xs text-slate-500">{drv.phone}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        drv.availabilityStatus === 'On Duty & Available'
                          ? 'success'
                          : drv.availabilityStatus === 'On Active Trip'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {drv.availabilityStatus}
                    </Badge>
                  </div>

                  <div className="py-3 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">License No:</span>
                      <span className="font-mono font-medium text-slate-800">{drv.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Emergency Experience:</span>
                      <span className="font-semibold text-slate-800">{drv.emergencyExperienceYears} Years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Completed 911 Trips:</span>
                      <span className="font-extrabold text-brand-600">{drv.completedTrips} Trips</span>
                    </div>
                    {drv.assignedAmbulanceReg && (
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Assigned Vehicle:</span>
                        <span className="font-bold text-slate-900">{drv.assignedAmbulanceReg}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: FLEET MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Fleet Maintenance & Calibration Logs</h3>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                if (ambulances.length > 0) {
                  setNewMaintenance((prev) => ({ ...prev, ambulanceId: ambulances[0].id }));
                }
                setIsAddMaintenanceModalOpen(true);
              }}
            >
              Log Service Record
            </Button>
          </div>

          <Card className="overflow-hidden border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ambulance Unit</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Serviced By</th>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenanceRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.ambulanceReg}</td>
                    <td className="py-3 px-4 font-semibold text-brand-600">{rec.serviceType}</td>
                    <td className="py-3 px-4 text-slate-600">{rec.description}</td>
                    <td className="py-3 px-4 text-slate-700">{rec.servicedBy}</td>
                    <td className="py-3 px-4 text-slate-500">{rec.serviceDate}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">${rec.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Dispatch Modal */}
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
                  .filter((d) => d.availabilityStatus === 'On Duty & Available')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone}) — {d.completedTrips} Trips
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

      {/* Add Ambulance Modal */}
      <Modal
        isOpen={isAddAmbulanceModalOpen}
        onClose={() => setIsAddAmbulanceModalOpen(false)}
        title="Register New Ambulance to Fleet"
        maxWidth="md"
      >
        <form onSubmit={handleAddAmbulance} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Registration Number</label>
            <Input
              required
              placeholder="e.g. NY-EMRG-991"
              value={newAmbulance.regNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAmbulance({ ...newAmbulance, regNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ambulance Type</label>
              <select
                value={newAmbulance.type}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, type: e.target.value as any })}
                className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
              >
                <option value="Advanced Life Support (ALS)">Advanced Life Support (ALS)</option>
                <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                <option value="Patient Transport Ambulance">Patient Transport Ambulance</option>
                <option value="Neonatal Ambulance">Neonatal Ambulance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Equipment Level</label>
              <select
                value={newAmbulance.equipmentCategory}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, equipmentCategory: e.target.value as any })}
                className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
              >
                <option value="Class A (Critical Telemetry)">Class A (Critical Telemetry)</option>
                <option value="Class B (Defibrillator + O2)">Class B (Defibrillator + O2)</option>
                <option value="Class C (Standard Transport)">Class C (Standard Transport)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vehicle Model & Make</label>
            <Input
              required
              placeholder="e.g. Mercedes Sprinter 3500 Mobile ICU"
              value={newAmbulance.model}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAmbulance({ ...newAmbulance, model: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddAmbulanceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddDriverModalOpen}
        onClose={() => setIsAddDriverModalOpen(false)}
        title="Onboard Paramedic Driver"
        maxWidth="md"
      >
        <form onSubmit={handleAddDriver} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Driver Full Name</label>
            <Input
              required
              placeholder="e.g. John Doe"
              value={newDriver.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
              <Input
                required
                type="email"
                placeholder="driver@example.com"
                value={newDriver.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Emergency Phone</label>
              <Input
                required
                placeholder="+1 (555) 000-0000"
                value={newDriver.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Commercial / EVOC License</label>
              <Input
                required
                placeholder="EVOC-998822"
                value={newDriver.licenseNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Experience (Years)</label>
              <Input
                type="number"
                value={newDriver.emergencyExperienceYears}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, emergencyExperienceYears: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddDriverModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Driver
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={isAddMaintenanceModalOpen}
        onClose={() => setIsAddMaintenanceModalOpen(false)}
        title="Log Vehicle Maintenance"
        maxWidth="md"
      >
        <form onSubmit={handleAddMaintenance} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Select Ambulance</label>
            <select
              value={newMaintenance.ambulanceId}
              onChange={(e) => setNewMaintenance({ ...newMaintenance, ambulanceId: e.target.value })}
              className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
            >
              {ambulances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.regNumber} ({a.model})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Service Type</label>
              <select
                value={newMaintenance.serviceType}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, serviceType: e.target.value as any })}
                className="w-full text-xs rounded-lg border-slate-300 p-2.5 border bg-white"
              >
                <option value="Routine Inspection">Routine Inspection</option>
                <option value="O2 & Telemetry Calibration">O2 & Telemetry Calibration</option>
                <option value="Brakes & Tires">Brakes & Tires</option>
                <option value="Engine Overhaul">Engine Overhaul</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cost (₹)</label>
              <Input
                type="number"
                value={newMaintenance.cost}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMaintenance({ ...newMaintenance, cost: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Service Description</label>
            <textarea
              required
              rows={3}
              value={newMaintenance.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
              className="w-full text-xs rounded-lg border-slate-300 p-2.5 border"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddMaintenanceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AmbulanceManagement;
