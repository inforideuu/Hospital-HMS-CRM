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

  // Form states
  const [pickupLocation, setPickupLocation] = useState('742 Evergreen Terrace, Springfield, OR');
  const [emergencyType, setEmergencyType] = useState<EmergencyRequest['emergencyType']>('Cardiac Arrest / Chest Pain');
  const [priority, setPriority] = useState<EmergencyPriority>('Critical / Code Blue');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+1 (555) 234-5678');

  const patientId = user?.patientId || 'PAT-1001';
  const hospitalId = user?.hospitalId || 'HOSP-001';

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

    const newRequest: EmergencyRequest = {
      id: `EMR-${Date.now().toString().slice(-4)}`,
      hospitalId,
      hospitalName: 'Apex Medical Center',
      patientId,
      patientName: user?.name || 'Eleanor Vance',
      patientPhone: contactPhone,
      pickupLocation,
      destinationHospital: 'Apex Medical Center Emergency Trauma Bay',
      emergencyType,
      priority,
      requestDate: new Date().toISOString().split('T')[0],
      requestTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Requested',
      chiefComplaint,
      fareEstimate: 120,
    };

    MockStorage.saveEmergencyRequest(newRequest);
    showToast('Emergency Request Dispatched', 'Your 911 Ambulance request has been logged. Emergency dispatchers are assigning the nearest unit.', 'success');
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
      {/* Header with SOS Hotline Callout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Emergency Ambulance Services</h1>
          <p className="text-sm text-slate-500 mt-1">
            Request instant ALS/BLS ambulance dispatch with real-time GPS telemetry and hospital triage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="danger"
            size="lg"
            leftIcon={<Flame className="w-5 h-5 animate-pulse" />}
            onClick={() => setIsRequestModalOpen(true)}
          >
            Request Emergency Ambulance
          </Button>
        </div>
      </div>

      {/* 911 Hotline Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold">24/7 Rapid Emergency Response Command Center</h3>
            <p className="text-xs text-rose-100">
              For life-threatening cardiac arrests, severe trauma, or acute respiratory distress, call immediately.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="tel:911"
            className="px-4 py-2 rounded-lg bg-white text-rose-700 font-black text-sm flex items-center gap-2 hover:bg-rose-50 shadow-md transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            Call 911 Hotline
          </a>
          <a
            href="tel:+18005559999"
            className="px-4 py-2 rounded-lg bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 hover:bg-rose-800 transition-all border border-white/20"
          >
            Hospital Triage: +1 (800) 555-9999
          </a>
        </div>
      </div>

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

      {/* Emergency Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Immediate Emergency Ambulance"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-5">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span>
              <strong>Immediate Dispatch Notice:</strong> Submitting this request sends an alert directly to the Apex Medical Emergency Dispatch Desk. Please remain in place until the ambulance arrives.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Pickup Address / GPS Coordinates</label>
            <Input
              required
              value={pickupLocation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Emergency Category</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value as any)}
                className="w-full text-xs rounded-lg border-slate-300 focus:border-brand-500 focus:ring-brand-500 p-2.5 border bg-white"
              >
                <option value="Cardiac Arrest / Chest Pain">Cardiac Arrest / Severe Chest Pain</option>
                <option value="Trauma / Accident">Trauma / High-Velocity Injury</option>
                <option value="Respiratory Distress">Respiratory Distress / Suffocation</option>
                <option value="Maternity / Labor">Maternity / Active Labor</option>
                <option value="Stroke Code">Stroke Symptoms / Code Stroke</option>
                <option value="General Emergency Transfer">General Emergency Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Emergency Triage Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs rounded-lg border-slate-300 focus:border-brand-500 focus:ring-brand-500 p-2.5 border bg-white"
              >
                <option value="Critical / Code Blue">Critical / Code Blue (Immediate sirens & ALS)</option>
                <option value="High">High Priority (Within 5-10 mins)</option>
                <option value="Medium">Medium Priority (Standard urgency)</option>
                <option value="Low">Low / Non-emergency transport</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Contact Callback Number</label>
            <Input
              required
              value={contactPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
              leftIcon={<PhoneCall className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Chief Complaint / Condition Summary</label>
            <textarea
              value={chiefComplaint}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChiefComplaint(e.target.value)}
              rows={3}
              placeholder="Describe symptoms, patient consciousness, breathing condition, etc."
              className="w-full text-xs rounded-lg border-slate-300 focus:border-brand-500 focus:ring-brand-500 p-2.5 border"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" leftIcon={<Flame className="w-4 h-4" />}>
              Confirm & Dispatch Ambulance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientAmbulance;
