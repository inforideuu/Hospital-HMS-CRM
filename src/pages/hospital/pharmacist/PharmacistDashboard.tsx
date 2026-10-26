import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Plus,
  ShoppingCart,
  ShieldAlert,
  TrendingUp,
  Layers,
  Receipt,
  ArrowRight,
  AlertCircle,
  Activity,
  Check,
  CheckSquare,
  Thermometer,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Prescription, Medicine, Invoice, Patient } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';
import { Modal } from '../../../components/ui/Modal';

export const PharmacistDashboard: React.FC = () => {
  const { user, currentHospital } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const hospId = user?.hospitalId || currentHospital?.id || 'HOSP-001';

  // Live Dynamic Data State
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => MockStorage.getPrescriptions(undefined, hospId));
  const [medicines, setMedicines] = useState<Medicine[]>(() => MockStorage.getMedicines(hospId));
  const [invoices, setInvoices] = useState<Invoice[]>(() => MockStorage.getInvoices(hospId));
  const [patients, setPatients] = useState<Patient[]>(() => MockStorage.getPatients(hospId));

  // Add Medicine Form State
  const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    genericName: '',
    sku: '',
    batchNumber: '',
    category: 'Analgesics',
    stockQuantity: 100,
    minThreshold: 20,
    unitPrice: 25.0,
    expiryDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 2);
      return d.toISOString().split('T')[0];
    })(),
    manufacturer: '',
    locationRack: 'Aisle 1 - Shelf A',
    requiresPrescription: true,
  });

  // Sync and listener
  const refreshAllData = () => {
    setPrescriptions(MockStorage.getPrescriptions(undefined, hospId));
    setMedicines(MockStorage.getMedicines(hospId));
    setInvoices(MockStorage.getInvoices(hospId));
    setPatients(MockStorage.getPatients(hospId));
  };

  useEffect(() => {
    refreshAllData();
    const handleUpdate = () => refreshAllData();
    window.addEventListener('pulse_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [hospId]);

  // Derived Analytics & Counts
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingPrescriptions = useMemo(
    () => prescriptions.filter((rx) => rx.status === 'Active' || !rx.dispensedAt),
    [prescriptions]
  );

  const dispensedTodayPrescriptions = useMemo(
    () =>
      prescriptions.filter(
        (rx) => rx.status === 'Dispensed' && (rx.dispensedAt?.startsWith(todayStr) || rx.date === todayStr)
      ),
    [prescriptions, todayStr]
  );

  const lowStockItems = useMemo(
    () => medicines.filter((m) => m.status !== 'Quarantined' && m.stockQuantity <= (m.minThreshold || 25)),
    [medicines]
  );

  const expiringSoonItems = useMemo(() => {
    const now = new Date();
    const thresholdDays = 90;
    return medicines.filter((m) => {
      if (m.status === 'Quarantined') return false;
      const exp = new Date(m.expiryDate);
      const diffTime = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= thresholdDays;
    });
  }, [medicines]);

  const quarantinedItems = useMemo(
    () => medicines.filter((m) => m.status === 'Quarantined'),
    [medicines]
  );

  const pharmacyInvoices = useMemo(
    () =>
      invoices.filter((inv) =>
        inv.items.some(
          (item) => item.category === 'Pharmacy' || item.description?.toLowerCase().includes('rx') || item.description?.toLowerCase().includes('batch')
        )
      ),
    [invoices]
  );

  const todayRevenue = useMemo(() => {
    return pharmacyInvoices
      .filter((inv) => inv.issueDate === todayStr || inv.createdAt?.startsWith(todayStr))
      .reduce((acc, inv) => acc + (inv.amountPaid || inv.totalAmount || 0), 0);
  }, [pharmacyInvoices, todayStr]);

  // Recent 5 Activity Logs (Invoices or Dispensed Prescriptions)
  const recentActivities = useMemo(() => {
    return [...pharmacyInvoices]
      .sort((a, b) => new Date(b.issueDate || b.createdAt || '').getTime() - new Date(a.issueDate || a.createdAt || '').getTime())
      .slice(0, 5);
  }, [pharmacyInvoices]);

  // Fulfillment Progress
  const totalTodayRx = pendingPrescriptions.length + dispensedTodayPrescriptions.length;
  const fulfillmentRate = totalTodayRx > 0 ? Math.round((dispensedTodayPrescriptions.length / totalTodayRx) * 100) : 100;

  // Add Medicine Form Handlers
  const handleOpenAddMedicine = () => {
    const timestamp = Date.now().toString().slice(-4);
    setNewMedForm({
      name: '',
      genericName: '',
      sku: `SKU-${timestamp}`,
      batchNumber: `BAT-${new Date().getFullYear()}-${timestamp}`,
      category: 'Analgesics',
      stockQuantity: 100,
      minThreshold: 20,
      unitPrice: 25.0,
      expiryDate: (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 2);
        return d.toISOString().split('T')[0];
      })(),
      manufacturer: '',
      locationRack: 'Aisle 1 - Shelf A',
      requiresPrescription: true,
    });
    setIsAddMedicineModalOpen(true);
  };

  const handleSaveNewMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedForm.name.trim()) {
      showToast('Name Required', 'Please provide a valid medicine brand name.', 'error');
      return;
    }

    const newMed: Medicine = {
      id: `MED-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      hospitalId: hospId,
      name: newMedForm.name.trim(),
      genericName: newMedForm.genericName.trim() || newMedForm.name.trim(),
      sku: newMedForm.sku || `SKU-${Date.now()}`,
      batchNumber: newMedForm.batchNumber || `BAT-${new Date().getFullYear()}-01`,
      category: newMedForm.category,
      stockQuantity: Number(newMedForm.stockQuantity) || 0,
      minThreshold: Number(newMedForm.minThreshold) || 15,
      unitPrice: Number(newMedForm.unitPrice) || 10,
      expiryDate: newMedForm.expiryDate,
      manufacturer: newMedForm.manufacturer.trim() || 'Central Pharmaceuticals',
      locationRack: newMedForm.locationRack.trim() || 'Main Dispensary Shelf',
      requiresPrescription: newMedForm.requiresPrescription,
      status: 'In Stock',
    };

    MockStorage.saveMedicine(newMed);

    try {
      fetch('/api/v1/hospital/pharmacy/medicines/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed),
      }).catch(() => {});
    } catch (_) {}

    showToast(
      'Medicine Added',
      `${newMed.name} (${newMed.sku}) added to hospital inventory.`,
      'success'
    );
    setIsAddMedicineModalOpen(false);
    refreshAllData();
  };

  return (
    <div className="space-y-6">
      {/* Standard Hospital Page Header */}
      <PageHeader
        title="Pharmacist Dashboard"
        subtitle={`Welcome, ${user?.name || 'Staff Pharmacist'} — Active clinical operations overview and dispensary status`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Pharmacist Dashboard' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddMedicine}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Medicine
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/pharmacy?tab=pos')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              leftIcon={<ShoppingCart className="w-4 h-4" />}
            >
              Walk-in POS Sale
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospital/pharmacy?tab=inventory')}
              leftIcon={<Layers className="w-4 h-4 text-slate-500" />}
            >
              Formulary ({medicines.length} SKUs)
            </Button>
          </div>
        }
      />

      {/* Harmonic KPI Metrics Cards (Clicking opens dedicated section) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Today's Prescriptions"
          value={prescriptions.length}
          subtext="View order queue"
          accentColor="indigo"
          icon={<ClipboardList className="w-5 h-5 text-indigo-600" />}
          onClick={() => navigate('/hospital/pharmacy?tab=prescriptions&status=all')}
        />
        <StatCard
          title="Pending in Queue"
          value={pendingPrescriptions.length}
          subtext="Awaiting fulfillment"
          accentColor="amber"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          onClick={() => navigate('/hospital/pharmacy?tab=prescriptions&status=undispensed')}
        />
        <StatCard
          title="Dispensed Today"
          value={dispensedTodayPrescriptions.length}
          subtext="Patients served"
          accentColor="emerald"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          onClick={() => navigate('/hospital/pharmacy?tab=prescriptions&status=dispensed')}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length}
          subtext="Below threshold"
          accentColor="rose"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          onClick={() => navigate('/hospital/pharmacy?tab=inventory')}
        />
        <StatCard
          title="Expiring ≤ 90 Days"
          value={expiringSoonItems.length}
          subtext="Batches to monitor"
          accentColor="purple"
          icon={<ShieldAlert className="w-5 h-5 text-purple-600" />}
          onClick={() => navigate('/hospital/pharmacy?tab=expiry')}
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${todayRevenue.toLocaleString('en-IN')}`}
          subtext="Rx & OTC sales"
          accentColor="cyan"
          icon={<TrendingUp className="w-5 h-5 text-cyan-600" />}
          onClick={() => navigate('/hospital/pharmacy?tab=invoices')}
        />
      </div>

      {/* Urgent Operational Attention Banners */}
      <div className="space-y-3">
        {pendingPrescriptions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  {pendingPrescriptions.length} Doctor {pendingPrescriptions.length === 1 ? 'Prescription' : 'Prescriptions'} Awaiting Fulfillment
                </h4>
                <p className="text-xs text-amber-800">
                  Patients are waiting at the dispensary counter. Verify dosages, check batch availability, and dispense.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/pharmacy?tab=prescriptions')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 text-xs"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Prescription Queue
            </Button>
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-950">
                  {lowStockItems.length} {lowStockItems.length === 1 ? 'Medicine is' : 'Medicines are'} Below Safety Threshold
                </h4>
                <p className="text-xs text-rose-800">
                  Inventory levels are critically low. Restock now to avoid stockouts during emergency and OPD hours.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/pharmacy?tab=inventory')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 text-xs"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Restock Inventory
            </Button>
          </div>
        )}

        {expiringSoonItems.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 text-purple-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-950">
                  {expiringSoonItems.length} Medicine {expiringSoonItems.length === 1 ? 'Batch Expires' : 'Batches Expire'} in ≤ 90 Days
                </h4>
                <p className="text-xs text-purple-800">
                  Review near-expiry batches and isolate them into cold-storage quarantine to safeguard patient health.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hospital/pharmacy?tab=expiry')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0 text-xs"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Review Expiry Batches
            </Button>
          </div>
        )}
      </div>

      {/* Dedicated Pharmacy Modules Hub (Direct navigation to dedicated sidebar pages) */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">Dedicated Pharmacy Workstations</h3>
          <p className="text-xs text-slate-500">Direct access to clinical dispensing, retail POS, formulary inventory, and billing records.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Prescription Queue */}
          <div
            onClick={() => navigate('/hospital/pharmacy?tab=prescriptions')}
            className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
              <Badge variant={pendingPrescriptions.length > 0 ? 'warning' : 'success'}>
                {pendingPrescriptions.length > 0 ? `${pendingPrescriptions.length} Pending` : 'All Clear'}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Doctor e-Prescription Queue
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review verified doctor orders from OPD & IPD, inspect dosage instructions, and dispense medications with instant invoices.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Open Queue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Walk-in / OTC POS Counter */}
          <div
            onClick={() => navigate('/hospital/pharmacy?tab=pos')}
            className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <Badge variant="info">Point of Sale</Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                Walk-in & Retail OTC Counter
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Direct retail register for over-the-counter medicines, first aid, and wellness supplies without requiring a doctor prescription.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
              <span>Launch POS Counter</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Medicine Stock & Batches */}
          <div
            onClick={() => navigate('/hospital/pharmacy?tab=inventory')}
            className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <Badge variant={lowStockItems.length > 0 ? 'error' : 'success'}>
                {lowStockItems.length > 0 ? `${lowStockItems.length} Low Stock` : `${medicines.length} In Stock`}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Medicine Stock & Batches
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Maintain hospital formulary catalog, batch numbers, rack locations, unit prices, minimum thresholds, and stock replenishment.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Manage Inventory</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Expiry & Quarantine */}
          <div
            onClick={() => navigate('/hospital/pharmacy?tab=expiry')}
            className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-5 hover:border-purple-400 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <Badge variant={expiringSoonItems.length > 0 ? 'warning' : 'neutral'}>
                {expiringSoonItems.length} Expiring Soon
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Expiry Tracking & Quarantine
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Perform safety inspections, track near-expiry medicine batches, and isolate recalled lots into secure quarantine.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Manage Quarantine</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Dispense Invoices & Bills */}
          <div
            onClick={() => navigate('/hospital/pharmacy?tab=invoices')}
            className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <Badge variant="neutral">{pharmacyInvoices.length} Invoices</Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Dispense Invoices & Billing
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Audit complete transaction histories, reprint thermal dispensary slips, and track cash, card, and UPI revenue collections.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>View All Invoices</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Operational Highlights & Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Shift Performance & Health */}
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Shift Performance & Inventory Health</span>
              </div>
            }
            action={<Badge variant="info">Live Status</Badge>}
          />
          <CardContent className="space-y-4">
            {/* Fulfillment Rate Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Prescription Fulfillment Rate</span>
                <span className="text-indigo-600">{fulfillmentRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${fulfillmentRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{dispensedTodayPrescriptions.length} Dispensed Today</span>
                <span>{pendingPrescriptions.length} Pending</span>
              </div>
            </div>

            {/* Shift Checklist / SOPs */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clinical Pharmacist SOP Checklist</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cold storage vaccine & insulin temperature logged (2°C – 8°C).</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Controlled Schedule-H substances double-checked with prescribing doctor.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Near-expiry batches checked before patient dispensing.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Recent Activity Stream */}
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Recent Pharmacy Transactions</span>
              </div>
            }
            action={
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => navigate('/hospital/pharmacy?tab=invoices')}
              >
                View All
              </Button>
            }
          />
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No pharmacy transactions recorded today yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivities.map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{inv.patientName || 'Walk-in Customer'}</div>
                      <div className="text-[11px] text-slate-500">
                        Invoice #{inv.id} • {inv.paymentMethod || 'Cash'} • {inv.issueDate || todayStr}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">₹{(inv.totalAmount || inv.amountPaid || 0).toFixed(2)}</div>
                      <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'} size="sm">
                        {inv.status || 'Paid'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Medicine Modal (Standardized & Synchronized) */}
      {isAddMedicineModalOpen && (
        <Modal
          isOpen={isAddMedicineModalOpen}
          onClose={() => setIsAddMedicineModalOpen(false)}
          title="Add Medicine to Pharmacy"
        >
          <form onSubmit={handleSaveNewMedicine} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Medicine / Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg"
                  value={newMedForm.name}
                  onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Generic / Molecule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acetaminophen"
                  value={newMedForm.genericName}
                  onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">SKU / Item Code</label>
                <input
                  type="text"
                  value={newMedForm.sku}
                  onChange={(e) => setNewMedForm({ ...newMedForm, sku: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Batch Number</label>
                <input
                  type="text"
                  value={newMedForm.batchNumber}
                  onChange={(e) => setNewMedForm({ ...newMedForm, batchNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newMedForm.category}
                  onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="Analgesics">Analgesics</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Antidiabetic">Antidiabetic</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Emergency Drugs">Emergency Drugs</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Stock Units</label>
                <input
                  type="number"
                  min="0"
                  value={newMedForm.stockQuantity}
                  onChange={(e) => setNewMedForm({ ...newMedForm, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Alert Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={newMedForm.minThreshold}
                  onChange={(e) => setNewMedForm({ ...newMedForm, minThreshold: parseInt(e.target.value) || 10 })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={newMedForm.unitPrice}
                  onChange={(e) => setNewMedForm({ ...newMedForm, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newMedForm.expiryDate}
                  onChange={(e) => setNewMedForm({ ...newMedForm, expiryDate: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Storage Rack / Shelf</label>
                <input
                  type="text"
                  placeholder="e.g. Aisle 2 - Shelf B"
                  value={newMedForm.locationRack}
                  onChange={(e) => setNewMedForm({ ...newMedForm, locationRack: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsAddMedicineModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Save Medicine
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistDashboard;
