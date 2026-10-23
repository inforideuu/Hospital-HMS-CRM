import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  Edit,
  Trash2,
  Download,
  DollarSign,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Medicine } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';

const getFutureDate = (yearsAhead = 2) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsAhead);
  return d.toISOString().split('T')[0];
};

export const PharmacyManagement: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [medicines, setMedicines] = useState<Medicine[]>(() => MockStorage.getMedicines(hospId));
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    sku: '',
    batchNumber: '',
    category: 'Antibiotics' as Medicine['category'],
    stockQuantity: 100,
    minThreshold: 20,
    unitPrice: 10.0,
    expiryDate: getFutureDate(2),
    manufacturer: '',
    locationRack: '',
    requiresPrescription: true,
  });

  const refreshData = () => {
    setMedicines(MockStorage.getMedicines(hospId));
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

  const lowStockMeds = medicines.filter((m) => m.stockQuantity <= m.minThreshold);
  const totalStockUnits = medicines.reduce((acc, m) => acc + m.stockQuantity, 0);

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      genericName: '',
      sku: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
      batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Antibiotics',
      stockQuantity: 100,
      minThreshold: 20,
      unitPrice: 15.0,
      expiryDate: getFutureDate(2),
      manufacturer: '',
      locationRack: '',
      requiresPrescription: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setSelectedMed(med);
    setFormData({
      name: med.name,
      genericName: med.genericName,
      sku: med.sku,
      batchNumber: med.batchNumber,
      category: med.category,
      stockQuantity: med.stockQuantity,
      minThreshold: med.minThreshold,
      unitPrice: med.unitPrice,
      expiryDate: med.expiryDate,
      manufacturer: med.manufacturer,
      locationRack: med.locationRack,
      requiresPrescription: med.requiresPrescription,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (isEditModalOpen && selectedMed) {
      const updated: Medicine = {
        ...selectedMed,
        ...formData,
      };
      MockStorage.saveMedicine(updated);
      showToast('Medicine Updated', `${updated.name} inventory record saved.`);
      setIsEditModalOpen(false);
    } else {
      const newMed: Medicine = {
        id: `MED-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        hospitalId: hospId,
        ...formData,
      };
      MockStorage.saveMedicine(newMed);
      showToast('Drug Added', `${newMed.name} stocked in pharmacy.`);
      setIsAddModalOpen(false);
    }
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      MockStorage.deleteMedicine(confirmDeleteId);
      showToast('Medicine Removed', 'Item removed from inventory.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Central Pharmacy & Pharmaceutical Inventory"
        subtitle="Track drug dispensary stocks, batch expiry monitoring, prescription validation, and automated reorder alerts."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Pharmacy' }]}
        actions={
          <div className="flex items-center gap-2">
            {medicines.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearAllDialogOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Delete All Existing
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('Pharmacy_Stock', filtered)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Inventory
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Medicine Stock
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalogued SKU Items</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{medicines.length} Drugs</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units in Vault</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalStockUnits.toLocaleString()} Units</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{lowStockMeds.length} Items</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine, SKU, batch, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 w-full sm:w-auto"
          >
            <option value="all">All Drug Categories</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Analgesics">Analgesics</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Antidiabetic">Antidiabetic</option>
            <option value="Respiratory">Respiratory</option>
            <option value="Emergency Drugs">Emergency Drugs</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Medicine & Generic</th>
                <th className="px-4 py-3.5">SKU & Batch</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Current Stock</th>
                <th className="px-4 py-3.5">Unit Price</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <Pill className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700 text-sm">No Pharmaceutical Inventory Records</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery || categoryFilter !== 'all'
                          ? 'No medications match the specified filter criteria.'
                          : 'Pharmacy inventory is currently empty. Add medication stocks to start tracking dispensary.'}
                      </p>
                      <Button variant="outline" size="sm" onClick={handleOpenAdd} className="mt-3">
                        + Add First Medicine
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((med) => {
                  const isLow = med.stockQuantity <= med.minThreshold;

                  return (
                  <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 leading-tight">{med.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{med.genericName} • {med.locationRack}</p>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                      <p>{med.sku}</p>
                      <p className="text-[10px] text-slate-400">{med.batchNumber}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {med.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-xs ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {med.stockQuantity} Units
                        </span>
                        {isLow && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                            Low
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">Min: {med.minThreshold}</p>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      ${med.unitPrice.toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {med.expiryDate}
                      </p>
                      <p className="text-[10px] text-slate-400">{med.manufacturer}</p>
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(med)}
                        title="Edit Medicine"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600"
                        onClick={() => setConfirmDeleteId(med.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </Card>

      {/* Add / Edit Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Medication Stock' : 'Add Medication to Central Pharmacy'}
        subtitle="SKU cataloging, batch lot number and threshold tracking"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveMedicine} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Amoxicillin 500mg"
              required
            />
            <Input
              label="Generic Chemical Name *"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              placeholder="e.g. Amoxicillin Trihydrate"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Drug Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            >
              <option value="Antibiotics">Antibiotics</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Antidiabetic">Antidiabetic</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Emergency Drugs">Emergency Drugs</option>
            </Select>

            <Input
              label="Manufacturer / Supplier"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="e.g. Pfizer Biologics"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
            />
            <Input
              label="Low Alert Threshold"
              type="number"
              value={formData.minThreshold}
              onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
            />
            <Input
              label="Unit Price ($)"
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Batch Number"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
            <Input
              label="Dispensary Location / Rack"
              value={formData.locationRack}
              onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
              placeholder="Rack C-02"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {isEditModalOpen ? 'Save Changes' : 'Add Medication'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Drug from Pharmacy Catalog?"
        message="Are you sure you want to remove this pharmaceutical item from active dispensary records?"
        confirmText="Yes, Remove Drug"
      />

      {/* Delete All Existing Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllDialogOpen}
        onClose={() => setIsClearAllDialogOpen(false)}
        onConfirm={() => {
          MockStorage.clearMedicines(hospId);
          showToast('Pharmacy Stock Purged', 'All pharmaceutical medicine items have been deleted.');
          setIsClearAllDialogOpen(false);
          refreshData();
        }}
        title="Delete All Existing Medicines?"
        message="Are you sure you want to permanently delete all medicine inventory records for this hospital? This will reset the dispensary catalog to empty."
        confirmText="Yes, Delete All"
        variant="danger"
      />
    </div>
  );
};
