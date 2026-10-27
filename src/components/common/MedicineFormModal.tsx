import React, { useState, useEffect } from 'react';
import { Pill, AlertCircle } from 'lucide-react';
import { Medicine } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MockStorage } from '../../services/mockStorage';
import { useNotification } from '../../context/NotificationContext';

export interface MedicineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineToEdit?: Medicine | null;
  hospitalId: string;
  onSaved?: (savedMedicine: Medicine) => void;
}

const DEFAULT_CATEGORIES = [
  'Antibiotics',
  'Analgesics',
  'Cardiovascular',
  'Antidiabetic',
  'Respiratory',
  'Vitamins',
  'Emergency Drugs',
  'Gastrointestinal',
  'Dermatology',
  'Other',
];

const getFutureDate = (yearsAhead = 2): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsAhead);
  return d.toISOString().split('T')[0];
};

export const MedicineFormModal: React.FC<MedicineFormModalProps> = ({
  isOpen,
  onClose,
  medicineToEdit,
  hospitalId,
  onSaved,
}) => {
  const { showToast } = useNotification();
  const isEditing = Boolean(medicineToEdit);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    sku: '',
    batchNumber: '',
    category: 'Antibiotics',
    stockQuantity: 100,
    minThreshold: 20,
    unitPrice: 15.0,
    expiryDate: getFutureDate(2),
    manufacturer: '',
    locationRack: 'Aisle 1 - Shelf A',
    requiresPrescription: true,
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize form when modal opens or medicineToEdit changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (medicineToEdit) {
        setFormData({
          name: medicineToEdit.name || '',
          genericName: medicineToEdit.genericName || '',
          sku: medicineToEdit.sku || '',
          batchNumber: medicineToEdit.batchNumber || '',
          category: medicineToEdit.category || 'Antibiotics',
          stockQuantity: medicineToEdit.stockQuantity ?? 100,
          minThreshold: medicineToEdit.minThreshold ?? 20,
          unitPrice: medicineToEdit.unitPrice ?? 15.0,
          expiryDate: medicineToEdit.expiryDate || getFutureDate(2),
          manufacturer: medicineToEdit.manufacturer || '',
          locationRack: medicineToEdit.locationRack || 'Aisle 1 - Shelf A',
          requiresPrescription: medicineToEdit.requiresPrescription ?? true,
        });
      } else {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setFormData({
          name: '',
          genericName: '',
          sku: `MED-${rand}`,
          batchNumber: `BAT-${new Date().getFullYear()}-${rand}`,
          category: 'Antibiotics',
          stockQuantity: 100,
          minThreshold: 20,
          unitPrice: 15.0,
          expiryDate: getFutureDate(2),
          manufacturer: '',
          locationRack: 'Aisle 1 - Shelf A',
          requiresPrescription: true,
        });
      }
    }
  }, [isOpen, medicineToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Medicine brand name is required.');
      return;
    }

    const finalSku = formData.sku.trim() || `MED-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalBatch = formData.batchNumber.trim() || `BAT-${new Date().getFullYear()}-01`;

    let savedMed: Medicine;
    if (isEditing && medicineToEdit) {
      savedMed = {
        ...medicineToEdit,
        ...formData,
        sku: finalSku,
        batchNumber: finalBatch,
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || formData.name.trim(),
        stockQuantity: Number(formData.stockQuantity) || 0,
        minThreshold: Number(formData.minThreshold) || 10,
        unitPrice: Number(formData.unitPrice) || 0,
      };
      MockStorage.saveMedicine(savedMed);
      showToast('Medicine Updated', `${savedMed.name} record has been updated.`, 'success');
    } else {
      savedMed = {
        id: `MED-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        hospitalId: hospitalId || 'HOSP-001',
        ...formData,
        sku: finalSku,
        batchNumber: finalBatch,
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || formData.name.trim(),
        stockQuantity: Number(formData.stockQuantity) || 0,
        minThreshold: Number(formData.minThreshold) || 10,
        unitPrice: Number(formData.unitPrice) || 0,
        status: Number(formData.stockQuantity) > Number(formData.minThreshold) ? 'In Stock' : 'Low Stock',
      };
      MockStorage.saveMedicine(savedMed);
      showToast('Medicine Added', `${savedMed.name} added to pharmacy formulary.`, 'success');
    }

    try {
      fetch('/api/v1/hospital/pharmacy/medicines/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedMed),
      }).catch(() => {});
    } catch (_) {}

    onSaved?.(savedMed);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Medicine Details' : 'Add Medicine to Pharmacy'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Row 1: Brand Name & Generic Molecule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Brand / Medicine Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Paracetamol 650mg"
              value={formData.name}
              onChange={(e) => {
                setErrorMsg('');
                setFormData({ ...formData, name: e.target.value });
              }}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Generic / Active Molecule</label>
            <input
              type="text"
              placeholder="e.g. Acetaminophen"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Row 2: SKU, Batch Number & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">SKU / Item Code</label>
            <input
              type="text"
              placeholder="e.g. MED-1001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Batch Number</label>
            <input
              type="text"
              placeholder="e.g. BAT-2026-01"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Therapeutic Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Stock Quantity, Min Threshold & Unit Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Stock Units</label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Min Alert Threshold</label>
            <input
              type="number"
              min="1"
              value={formData.minThreshold}
              onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 10 })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Unit Price (₹)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
            />
          </div>
        </div>

        {/* Row 4: Storage Rack Location, Expiry Date & Manufacturer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Storage Rack / Shelf</label>
            <input
              type="text"
              placeholder="e.g. Aisle 2 - Shelf B"
              value={formData.locationRack}
              onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Manufacturer / Pharma Co.</label>
            <input
              type="text"
              placeholder="e.g. Cipla / Sun Pharma"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            />
          </div>
        </div>

        {/* Prescription Requirement Option */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
            <input
              type="checkbox"
              checked={formData.requiresPrescription}
              onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <span className="font-semibold">Schedule-H / Doctor Prescription Required for Dispensing</span>
          </label>
          <p className="text-[11px] text-slate-400 ml-6">
            When checked, this drug cannot be sold via OTC Retail POS without a verified doctor prescription.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" leftIcon={<Pill className="w-3.5 h-3.5" />}>
            {isEditing ? 'Save Changes' : 'Add Medicine to Stock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
