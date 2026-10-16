import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MockStorage } from '../../services/mockStorage';
import { AmbulanceDriver, EmergencyRequest, AmbulanceTrip } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Truck,
  PhoneCall,
  MapPin,
  Clock,
  Radio,
  Flame,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  User,
  ShieldCheck,
  Fuel,
  Activity,
  ChevronRight,
  Send,
  MessageSquare
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const driverId = user?.driverId || 'DRV-201';

  const [driver, setDriver] = useState<AmbulanceDriver | undefined>(undefined);
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | undefined>(undefined);
  const [recentTrips, setRecentTrips] = useState<AmbulanceTrip[]>([]);
  const [paramedicNotes, setParamedicNotes] = useState('');

  const loadData = () => {
    const drv = MockStorage.getAmbulanceDriverById(driverId);
    setDriver(drv);

    const allRequests = MockStorage.getEmergencyRequests();
    const active = allRequests.find(
      (r) =>
        (r.assignedDriverId === driverId || r.assignedDriverName === user?.name) &&
        r.status !== 'Completed' &&
        r.status !== 'Cancelled'
    );
    setActiveRequest(active);

    const trips = MockStorage.getAmbulanceTrips(undefined, driverId);
    setRecentTrips(trips);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [driverId, user?.name]);

  const handleToggleDutyStatus = (newStatus: AmbulanceDriver['availabilityStatus']) => {
    if (!driver) return;
    const updated: AmbulanceDriver = { ...driver, availabilityStatus: newStatus };
    MockStorage.saveAmbulanceDriver(updated);
    showToast('Duty Status Updated', `Your status is now ${newStatus}.`, 'info');
  };

  const handleUpdateTripStatus = (status: EmergencyRequest['status']) => {
    if (!activeRequest) return;
    MockStorage.updateEmergencyStatus(activeRequest.id, status, paramedicNotes);
    showToast('Trip Progress Updated', `Incident status marked as: ${status}`, 'success');
    if (status === 'Completed') {
      setParamedicNotes('');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Duty Status & Driver Card */}
      <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shrink-0">
            {user?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{user?.name || 'Driver / Paramedic'}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-teal-300 font-mono font-medium">
                {driver?.licenseNumber || 'EVOC-88992'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned Unit: <strong className="text-slate-200">{driver?.assignedAmbulanceReg || 'NY-EMRG-889'}</strong> • Apex Medical Center
            </p>
          </div>
        </div>

        {/* Status Switcher Buttons */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60">
          {(['On Duty & Available', 'On Break', 'Off Duty'] as const).map((st) => (
            <button
              key={st}
              onClick={() => handleToggleDutyStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                driver?.availabilityStatus === st
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Active 911 Emergency Run Card (Hero Mode) */}
      {activeRequest ? (
        <div className="rounded-2xl border-2 border-rose-500/80 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-2xl relative overflow-hidden ring-4 ring-rose-500/20">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-rose-400">911 Active Emergency Incident</span>
                <h3 className="text-xl font-black text-white mt-0.5">{activeRequest.emergencyType}</h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase tracking-wide">
              {activeRequest.priority}
            </span>
          </div>

          {/* Incident Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Patient Details</span>
                <span className="text-slate-300 font-mono text-[11px]">ID: {activeRequest.id}</span>
              </div>
              <p className="text-base font-bold text-white">{activeRequest.patientName}</p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${activeRequest.patientPhone}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-600/30 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call Patient ({activeRequest.patientPhone})
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium text-xs">Pickup Coordinates & Destination</span>
              <div className="flex items-start gap-2 text-xs text-rose-300 font-semibold">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{activeRequest.pickupLocation}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-teal-300 pt-1">
                <Navigation className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Dest: {activeRequest.destinationHospital}</span>
              </div>
            </div>
          </div>

          {activeRequest.chiefComplaint && (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 mb-6">
              <strong className="text-rose-400">Chief Complaint & Triage Notes:</strong> {activeRequest.chiefComplaint}
            </div>
          )}

          {/* Workflow Action Steps */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Paramedic Trip Progress Workflow
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeRequest.status === 'Dispatched' && (
                <button
                  onClick={() => handleUpdateTripStatus('Patient Picked Up')}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" /> 1. Patient Picked Up (On Scene)
                </button>
              )}

              {activeRequest.status === 'Patient Picked Up' && (
                <button
                  onClick={() => handleUpdateTripStatus('Arrived at Hospital')}
                  className="w-full py-3.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" /> 2. Arrived at Hospital Triage
                </button>
              )}

              {activeRequest.status === 'Arrived at Hospital' && (
                <button
                  onClick={() => handleUpdateTripStatus('Completed')}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> 3. Handover Complete & Free Unit
                </button>
              )}
            </div>

            {/* Paramedic Notes Field */}
            <div className="pt-3">
              <input
                type="text"
                placeholder="Log paramedic vitals or field remarks (e.g. BP 120/80, 2L O2 administered)..."
                value={paramedicNotes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParamedicNotes(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 p-3 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">Standby for Next Emergency Dispatch</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your telemetry unit is connected. When 911 dispatch assigns an emergency run, turn-by-turn routing and patient vitals will appear here.
          </p>
        </div>
      )}

      {/* Driver Performance & History */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          Recent Emergency Runs & Duty Log
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-xs text-slate-400">Total Completed Runs</span>
            <p className="text-2xl font-black text-white mt-1">{driver?.completedTrips || 12} Runs</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-xs text-slate-400">Avg Response Time</span>
            <p className="text-2xl font-black text-teal-400 mt-1">6.8 mins</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-xs text-slate-400">Safety & Field Rating</span>
            <p className="text-2xl font-black text-amber-400 mt-1">4.98 / 5.0</p>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-3">
          {recentTrips.map((trip) => (
            <div
              key={trip.id}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{trip.patientName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                    Completed
                  </span>
                </div>
                <p className="text-slate-400">
                  Pickup: {trip.pickupAddress} → {trip.destination}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-300 font-medium">{trip.distanceKm} km</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Start: {trip.startTime} • End: {trip.endTime || '14:20'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
