import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MockStorage } from '../../services/mockStorage';
import { AmbulanceDriver, EmergencyRequest, AmbulanceTrip } from '../../types';
import {
  Truck,
  PhoneCall,
  MapPin,
  Clock,
  Radio,
  Flame,
  CheckCircle2,
  Navigation,
  Activity,
  User,
  ShieldCheck,
  Fuel,
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Duty Status & Driver Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0">
            {user?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Carlos Mendez, EMT-P'}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-mono font-bold">
                {driver?.licenseNumber || 'CDL-EMERG-884219'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Unit: <strong className="text-slate-800">{driver?.assignedAmbulanceReg || 'NY-EMRG-889'}</strong> • Apex Medical Center
            </p>
          </div>
        </div>

        {/* Status Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {(['On Duty & Available', 'On Break', 'Off Duty'] as const).map((st) => (
            <button
              key={st}
              onClick={() => handleToggleDutyStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                driver?.availabilityStatus === st
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Active 911 Emergency Run Card (Hero Mode matching Patient & Hospital Portals) */}
      {activeRequest ? (
        <div className="rounded-3xl bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-rose-800">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-10 [background-size:16px_16px] pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-rose-800/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-rose-300">911 Active Emergency Incident</span>
                <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">{activeRequest.emergencyType}</h3>
              </div>
            </div>

            <span className="px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 font-extrabold text-xs uppercase tracking-wide shadow-sm">
              {activeRequest.priority}
            </span>
          </div>

          {/* Incident Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Patient Details</span>
                <span className="text-slate-300 font-mono text-[11px]">ID: {activeRequest.id}</span>
              </div>
              <p className="text-lg font-bold text-white">{activeRequest.patientName}</p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${activeRequest.patientPhone}`}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 hover:bg-emerald-600/40 transition-all shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" /> Call Patient ({activeRequest.patientPhone})
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 backdrop-blur-xs">
              <span className="text-slate-400 font-medium text-xs">Pickup Coordinates & Destination</span>
              <div className="flex items-start gap-2 text-xs text-rose-300 font-semibold">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{activeRequest.pickupLocation}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-teal-300 pt-1 font-semibold">
                <Navigation className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Dest: {activeRequest.destinationHospital}</span>
              </div>
            </div>
          </div>

          {activeRequest.chiefComplaint && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 mb-6">
              <strong className="text-rose-400">Chief Complaint & Triage Notes:</strong> {activeRequest.chiefComplaint}
            </div>
          )}

          {/* Workflow Action Steps */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-300">
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
                className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 p-3.5 focus:outline-none focus:border-teal-500 shadow-inner"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Standby for Next Emergency Dispatch</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your telemetry unit is connected. When 911 dispatch assigns an emergency run, turn-by-turn routing and patient vitals will appear here.
          </p>
        </div>
      )}

      {/* Driver Performance & History */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          Recent Emergency Runs & Duty Log
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500">Total Completed Runs</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{driver?.completedTrips || 12} Runs</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500">Avg Response Time</span>
            <p className="text-2xl font-black text-teal-600 mt-1">6.8 mins</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500">Safety & Field Rating</span>
            <p className="text-2xl font-black text-amber-500 mt-1">4.98 / 5.0</p>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-3">
          {recentTrips.map((trip) => (
            <div
              key={trip.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm hover:border-slate-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{trip.patientName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                    Completed
                  </span>
                </div>
                <p className="text-slate-500">
                  Pickup: {trip.pickupAddress} → {trip.destination}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-700 font-semibold">{trip.distanceKm} km</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Start: {trip.startTime} • End: {trip.endTime || '14:20'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
