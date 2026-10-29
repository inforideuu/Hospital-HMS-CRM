import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MockStorage } from '../../services/mockStorage';
import { EmergencyRequest, EmergencyPriority } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Ambulance,
  PhoneCall,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  User,
  HeartPulse,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const PatientAmbulance: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const patientId = user?.patientId || 'PAT-1001';
  const hospitalId = user?.hospitalId || 'HOSP-001';
  const patient = MockStorage.getPatientById(patientId);

  // Form states
  const [pickupLocation, setPickupLocation] = useState(
    patient?.address || '450 Park Avenue, Apt 12B, New York, NY'
  );
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [contactPhone, setContactPhone] = useState(patient?.phone || user?.phone || '+1 (555) 234-5678');

  const loadData = () => {
    const list = MockStorage.getEmergencyRequests(hospitalId, patientId);
    setRequests(list);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [hospitalId, patientId]);

  const activeRequest = requests.find(
    (r) => r.status !== 'Completed' && r.status !== 'Cancelled'
  );

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();

    const hosp = MockStorage.getHospitalById(hospitalId);
    const newRequest: EmergencyRequest = {
      id: `EMR-${Date.now().toString().slice(-4)}`,
      hospitalId,
      hospitalName: hosp?.name || 'Hospital Medical Center',
      patientId,
      patientName: patient?.name || user?.name || 'Eleanor Vance',
      patientPhone: contactPhone,
      pickupLocation,
      destinationHospital: `${hosp?.name || 'Hospital'} Emergency Trauma Bay`,
      emergencyType: chiefComplaint ? `Emergency: ${chiefComplaint}` : 'Urgent Medical Assistance',
      priority: 'Critical / Code Blue',
      requestDate: new Date().toISOString().split('T')[0],
      requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Requested',
      chiefComplaint: chiefComplaint || 'Ambulance requested by patient online',
      fareEstimate: 120,
    };

    MockStorage.saveEmergencyRequest(newRequest);
    showToast(
      'Ambulance Request Dispatched',
      'Your request has been sent to the ambulance manager and is now active in Emergency 911 Dispatch.',
      'success'
    );
    setIsRequestModalOpen(false);
    setChiefComplaint('');
  };

  const handleCancelRequest = (id: string) => {
    MockStorage.updateEmergencyStatus(id, 'Cancelled', 'Cancelled by patient');
    showToast('Request Cancelled', 'Your emergency request has been cancelled.', 'warning');
  };

  const timelineSteps: EmergencyRequest['status'][] = [
    'Requested',
    'Assigned',
    'Dispatched',
    'Patient Picked Up',
    'Arrived at Hospital',
    'Completed',
  ];

  const getStepIndex = (st: EmergencyRequest['status']) => {
    return timelineSteps.indexOf(st);
  };

  const getPriorityBadge = (p: EmergencyPriority) => {
    switch (p) {
      case 'Critical / Code Blue':
        return <Badge variant="error" size="md">Critical / Code Blue</Badge>;
      case 'High':
        return <Badge variant="error" size="md">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="warning" size="md">Medium Priority</Badge>;
      default:
        return <Badge variant="neutral" size="md">Standard Priority</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Request Ambulance Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ambulance Services</h1>
          <p className="text-sm text-slate-500 mt-1">
            Request instant hospital emergency ambulance dispatch to your location.
          </p>
        </div>
        {!activeRequest && (
          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="lg"
              leftIcon={<Ambulance className="w-5 h-5 animate-pulse" />}
              onClick={() => setIsRequestModalOpen(true)}
              className="font-bold shadow-lg shadow-rose-600/20"
            >
              Request Ambulance
            </Button>
          </div>
        )}
      </div>

      {/* Prominent Quick Request Card if no active trip */}
      {!activeRequest && (
        <Card className="p-8 text-center bg-gradient-to-b from-white to-rose-50/40 border-rose-200/80 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
            <Ambulance className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Need an Emergency Ambulance?</h3>
            <p className="text-xs text-slate-500">
              Click the button below to request an ambulance. When you confirm, your request will immediately be sent to the hospital ambulance manager and appear in the Emergency 911 Dispatch queue.
            </p>
          </div>
          <Button
            variant="danger"
            size="md"
            leftIcon={<Ambulance className="w-4 h-4" />}
            onClick={() => setIsRequestModalOpen(true)}
            className="font-bold shadow-md shadow-rose-600/30"
          >
            Request Ambulance
          </Button>
        </Card>
      )}

      {/* Active Request Live Tracking Card */}
      {activeRequest ? (
        <Card className="p-6 border-brand-500 ring-2 ring-brand-500/20 shadow-xl bg-gradient-to-b from-white to-brand-50/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shrink-0 animate-pulse">
                <Ambulance className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Active Emergency Dispatch</span>
                  {getPriorityBadge(activeRequest.priority)}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">{activeRequest.emergencyType}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Request ID: {activeRequest.id} • Initiated at {activeRequest.requestTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeRequest.driverPhone && (
                <a
                  href={`tel:${activeRequest.driverPhone}`}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call Paramedic ({activeRequest.driverPhone})
                </a>
              )}
              {activeRequest.status === 'Requested' && (
                <Button variant="outline" size="sm" onClick={() => handleCancelRequest(activeRequest.id)}>
                  Cancel Request
                </Button>
              )}
            </div>
          </div>

          {/* Interactive Progress Timeline */}
          <div className="py-8">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
              {timelineSteps.map((step, idx) => {
                const currentIdx = getStepIndex(activeRequest.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                return (
                  <div key={step} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100 scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed && !isCurrent ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent ? 'text-brand-700 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unit & Dispatch Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">Pickup Address</p>
              <div className="flex items-start gap-2 mt-1.5 text-xs font-semibold text-slate-800">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{activeRequest.pickupLocation}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">Assigned Unit & Paramedic</p>
              <div className="mt-1.5 text-xs">
                {activeRequest.assignedAmbulanceReg ? (
                  <>
                    <p className="font-bold text-slate-900">{activeRequest.assignedAmbulanceReg}</p>
                    <p className="text-slate-500">{activeRequest.assignedDriverName || 'Paramedic Unit'}</p>
                  </>
                ) : (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Awaiting unit allocation...
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">Destination Triage Bay</p>
              <div className="flex items-start gap-2 mt-1.5 text-xs font-semibold text-slate-800">
                <Navigation className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>{activeRequest.destinationHospital}</span>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Emergency Request History */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Previous Emergency & Transport Requests</h3>
        {requests.length === 0 ? (
          <Card className="p-10">
            <EmptyState
              icon={<Ambulance className="w-7 h-7" />}
              title="No Ambulance Requests"
              description="You have not requested any emergency transports or ambulance services."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="p-4 border-slate-200 hover:border-brand-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Ambulance className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{req.emergencyType}</span>
                        <Badge
                          variant={
                            req.status === 'Completed'
                              ? 'success'
                              : req.status === 'Cancelled'
                              ? 'neutral'
                              : 'info'
                          }
                          size="sm"
                        >
                          {req.status}
                        </Badge>
                        {getPriorityBadge(req.priority)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Date: {req.requestDate} at {req.requestTime}</span>
                        <span>Pickup: {req.pickupLocation}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-mono text-slate-400">ID: {req.id}</span>
                    {req.assignedAmbulanceReg && (
                      <p className="text-slate-600 font-semibold mt-0.5">{req.assignedAmbulanceReg}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Ambulance Dispatch Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Confirm Emergency Ambulance Request"
        maxWidth="md"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Are you sure you want to request an ambulance?</p>
              <p className="text-rose-700 mt-0.5 text-[11px]">
                Confirming will immediately send your dispatch request to the ambulance manager and appear in the Emergency 911 Dispatch queue.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Address / Location *</label>
              <Input
                required
                value={pickupLocation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                placeholder="Enter current address or location"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
              <Input
                required
                value={contactPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                leftIcon={<PhoneCall className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Condition / Reason (Optional)</label>
              <Input
                value={chiefComplaint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Chest pain, acute trauma, breathing difficulty"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" leftIcon={<Ambulance className="w-4 h-4" />}>
              Confirm & Send Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientAmbulance;
