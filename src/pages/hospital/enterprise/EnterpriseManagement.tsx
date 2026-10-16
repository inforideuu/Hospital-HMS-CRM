import React, { useState } from 'react';
import {
  Building2,
  GitBranch,
  Network,
  Share2,
  ArrowRightLeft,
  Users,
  BedDouble,
  Pill,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Phone,
  Plus,
  Sparkles,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useNotification } from '../../../context/NotificationContext';
import { PLAN_CAPABILITIES, isCapabilityAllowedForTier } from '../../../constants/planCapabilities';
import { CapabilityLockedNotice } from '../../../components/common/CapabilityLockedNotice';

interface BranchLocation {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  beds: number;
  activeDoctors: number;
  status: 'Operational' | 'Expanding' | 'Standby';
}

interface PatientTransfer {
  id: string;
  patientName: string;
  uhid: string;
  fromBranch: string;
  toBranch: string;
  department: string;
  reason: string;
  date: string;
  status: 'Completed' | 'In Transit' | 'Approved';
}

export const EnterpriseManagement: React.FC = () => {
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();

  const hospTier = currentHospital?.planTier || 'trial';
  const capEnterprise = PLAN_CAPABILITIES.find((c) => c.id === 'enterprise_multi_branch')!;
  const isAllowed = isCapabilityAllowedForTier(hospTier, 'enterprise_multi_branch');

  // If locked for this hospital's plan tier, show CapabilityLockedNotice
  if (!isAllowed) {
    return (
      <CapabilityLockedNotice
        capability={capEnterprise}
        currentTier={hospTier}
        hospitalId={currentHospital?.id}
        hospitalName={currentHospital?.name}
      />
    );
  }

  // If Enterprise Health Network tier: Full Multi-Branch Console
  const [branches, setBranches] = useState<BranchLocation[]>([
    {
      id: 'BR-01',
      name: `${currentHospital?.name || 'Main'} - Central Flagship Campus`,
      code: 'HQ-MAIN',
      type: 'Tertiary Trauma & Academic Center',
      address: currentHospital?.address || '742 Evergreen Healthcare Blvd',
      city: currentHospital?.city || 'New York',
      state: currentHospital?.state || 'NY',
      phone: currentHospital?.phone || '+1 (555) 234-5678',
      beds: currentHospital?.totalBeds || 180,
      activeDoctors: currentHospital?.totalDoctors || 34,
      status: 'Operational',
    },
    {
      id: 'BR-02',
      name: 'North Suburban Ambulatory & Surgery Wing',
      code: 'SUB-NORTH',
      type: 'Day Surgery & Diagnostic Hub',
      address: '1088 Health Park Expressway',
      city: 'White Plains',
      state: 'NY',
      phone: '+1 (555) 882-9900',
      beds: 45,
      activeDoctors: 14,
      status: 'Operational',
    },
    {
      id: 'BR-03',
      name: 'East Metro Pediatric & Maternal Outpost',
      code: 'CLIN-EAST',
      type: 'Specialized Maternal & Child Clinic',
      address: '402 Sunrise Boulevard',
      city: 'Brooklyn',
      state: 'NY',
      phone: '+1 (555) 330-1122',
      beds: 30,
      activeDoctors: 8,
      status: 'Operational',
    },
  ]);

  const [transfers, setTransfers] = useState<PatientTransfer[]>([
    {
      id: 'TRF-8821',
      patientName: 'James Harrison Blake',
      uhid: 'PAT-1002',
      fromBranch: 'North Suburban Ambulatory & Surgery Wing',
      toBranch: `${currentHospital?.name || 'Main'} - Central Flagship Campus`,
      department: 'Cardiac Surgery ICU',
      reason: 'Specialized coronary catheterization bypass required',
      date: '2026-10-14 14:30',
      status: 'Completed',
    },
    {
      id: 'TRF-8822',
      patientName: 'Sophia Isabella Martinez',
      uhid: 'PAT-1003',
      fromBranch: `${currentHospital?.name || 'Main'} - Central Flagship Campus`,
      toBranch: 'East Metro Pediatric & Maternal Outpost',
      department: 'Pediatric Rehabilitation',
      reason: 'Post-op observation and pediatric therapy continuation',
      date: '2026-10-15 08:15',
      status: 'In Transit',
    },
  ]);

  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    type: 'Multi-Specialty Branch',
    address: '',
    city: '',
    state: '',
    phone: '',
    beds: 25,
    activeDoctors: 6,
  });

  const [transferForm, setTransferForm] = useState({
    patientName: '',
    uhid: '',
    fromBranch: branches[0]?.name || '',
    toBranch: branches[1]?.name || '',
    department: 'Intensive Care Unit (ICU)',
    reason: '',
  });

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) return;

    const b: BranchLocation = {
      id: `BR-0${branches.length + 1}`,
      name: newBranch.name,
      code: newBranch.code.trim().toUpperCase() || `BR-${branches.length + 1}`,
      type: newBranch.type,
      address: newBranch.address,
      city: newBranch.city,
      state: newBranch.state,
      phone: newBranch.phone,
      beds: Number(newBranch.beds),
      activeDoctors: Number(newBranch.activeDoctors),
      status: 'Operational',
    };

    setBranches([...branches, b]);
    setIsAddBranchModalOpen(false);
    showToast('Branch Facility Provisioned', `New facility "${b.name}" connected to enterprise network.`, 'success');
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.patientName.trim()) return;

    const trf: PatientTransfer = {
      id: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: transferForm.patientName,
      uhid: transferForm.uhid.toUpperCase() || 'PAT-DEMO',
      fromBranch: transferForm.fromBranch,
      toBranch: transferForm.toBranch,
      department: transferForm.department,
      reason: transferForm.reason || 'Medical referral between network branches',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'In Transit',
    };

    setTransfers([trf, ...transfers]);
    setIsTransferModalOpen(false);
    showToast('Patient Transfer Dispatched', `Patient transfer initiated between ${trf.fromBranch} and ${trf.toBranch}.`, 'success');
  };

  const totalNetworkBeds = branches.reduce((acc, b) => acc + b.beds, 0);
  const totalNetworkDocs = branches.reduce((acc, b) => acc + b.activeDoctors, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise & Multi-Branch Tools"
        subtitle="Multi-facility healthcare orchestration, inter-branch patient routing, and network EHR sync"
        breadcrumbs={[
          { label: 'Hospital Workspace', href: '/hospital/dashboard' },
          { label: 'Enterprise Tools' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowRightLeft className="w-4 h-4 text-indigo-600" />}
              onClick={() => setIsTransferModalOpen(true)}
            >
              Transfer Patient
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddBranchModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Add Network Branch
            </Button>
          </div>
        }
      />

      {/* Enterprise Status Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shrink-0">
            <Network className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight">Enterprise Health Network Active</h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-400 text-slate-950 text-[10px] font-mono font-black uppercase">
                Tier Unlocked
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Unified cross-facility EHR routing, inter-branch bed reservation, and multi-tenant telemetry enabled for {branches.length} locations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Consolidated Census</span>
            <span className="text-sm font-black text-purple-300">{totalNetworkBeds} Beds • {totalNetworkDocs} Specialists</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connected Branches</span>
            <GitBranch className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{branches.length}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">100% Online & Synced</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Network Beds</span>
            <BedDouble className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalNetworkBeds}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Across all facilities</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network Doctors</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalNetworkDocs}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Shared specialist pool</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inter-Branch Transfers</span>
            <ArrowRightLeft className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{transfers.length}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Active patient transfers</p>
        </Card>
      </div>

      {/* Network Branch Directory */}
      <Card>
        <CardHeader
          title="Enterprise Branch Locations & Facilities"
          subtitle="Real-time telemetry and capacity distribution across healthcare network branches"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-4">Branch Name & Code</th>
                <th className="py-3 px-4">Facility Type</th>
                <th className="py-3 px-4">Location & Contact</th>
                <th className="py-3 px-4 text-center">Inpatient Beds</th>
                <th className="py-3 px-4 text-center">Active Specialists</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{b.name}</p>
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      {b.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{b.type}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{b.city}, {b.state}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{b.phone}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{b.beds} Beds</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{b.activeDoctors} Docs</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inter-Branch Patient Transfer Queue */}
      <Card>
        <CardHeader
          title="Inter-Facility Patient Transfers & Referrals"
          subtitle="Seamless movement of patients, clinical EHR histories, and medication records between network branches"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-4">Transfer ID</th>
                <th className="py-3 px-4">Patient Name & UHID</th>
                <th className="py-3 px-4">Origin Facility</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4">Target Department & Reason</th>
                <th className="py-3 px-4 text-right">Transfer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-purple-700">{t.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{t.patientName}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{t.uhid}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{t.fromBranch}</td>
                  <td className="py-3 px-4 text-indigo-700 font-semibold">{t.toBranch}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{t.department}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{t.reason}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Branch Modal */}
      <Modal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        title="Provision New Hospital Network Branch"
        maxWidth="lg"
      >
        <form onSubmit={handleAddBranch} className="space-y-4">
          <Input
            label="Branch Facility Display Name"
            placeholder="e.g. West End Specialized Clinic"
            value={newBranch.name}
            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Branch Short Code"
              placeholder="e.g. WEST-01"
              value={newBranch.code}
              onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
              required
            />
            <Input
              label="Contact Phone"
              placeholder="+1 (555) 000-0000"
              value={newBranch.phone}
              onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="New York"
              value={newBranch.city}
              onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
            />
            <Input
              label="State / Province"
              placeholder="NY"
              value={newBranch.state}
              onChange={(e) => setNewBranch({ ...newBranch, state: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Licensed Bed Capacity"
              type="number"
              value={newBranch.beds}
              onChange={(e) => setNewBranch({ ...newBranch, beds: Number(e.target.value) })}
            />
            <Input
              label="Assigned Specialist Doctors"
              type="number"
              value={newBranch.activeDoctors}
              onChange={(e) => setNewBranch({ ...newBranch, activeDoctors: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddBranchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              Provision Branch Facility
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Patient Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Initiate Inter-Branch Patient Transfer"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Patient Full Name"
              placeholder="e.g. Michael Scott"
              value={transferForm.patientName}
              onChange={(e) => setTransferForm({ ...transferForm, patientName: e.target.value })}
              required
            />
            <Input
              label="Patient UHID Number"
              placeholder="PAT-1090"
              value={transferForm.uhid}
              onChange={(e) => setTransferForm({ ...transferForm, uhid: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Origin Facility"
              value={transferForm.fromBranch}
              onChange={(e) => setTransferForm({ ...transferForm, fromBranch: e.target.value })}
              options={branches.map((b) => ({ label: b.name, value: b.name }))}
            />
            <Select
              label="Destination Facility"
              value={transferForm.toBranch}
              onChange={(e) => setTransferForm({ ...transferForm, toBranch: e.target.value })}
              options={branches.map((b) => ({ label: b.name, value: b.name }))}
            />
          </div>
          <Input
            label="Target Department / Specialized Unit"
            value={transferForm.department}
            onChange={(e) => setTransferForm({ ...transferForm, department: e.target.value })}
            placeholder="e.g. Neurosurgery ICU"
            required
          />
          <Input
            label="Transfer Rationale & Clinical Indication"
            value={transferForm.reason}
            onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
            placeholder="e.g. Bed scarcity or specialty diagnostic escalation"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Dispatch Patient Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnterpriseManagement;
