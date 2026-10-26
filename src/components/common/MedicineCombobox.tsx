import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Pill, Check, X, ChevronDown, Package, MapPin, AlertTriangle } from 'lucide-react';
import { Medicine } from '../../types';
import { Badge } from '../ui/Badge';

export interface MedicineComboboxProps {
  medicines: Medicine[];
  selectedMedicineId?: string;
  onSelectMedicine: (medicine: Medicine | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  allowOutOfStock?: boolean;
}

export const MedicineCombobox: React.FC<MedicineComboboxProps> = ({
  medicines,
  selectedMedicineId,
  onSelectMedicine,
  placeholder = 'Type medicine name, generic molecule, or SKU (e.g. Paracetamol)...',
  disabled = false,
  className = '',
  autoFocus = false,
  allowOutOfStock = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Selected Medicine
  const selectedMedicine = useMemo(() => {
    if (!selectedMedicineId) return null;
    return medicines.find((m) => m.id === selectedMedicineId) || null;
  }, [medicines, selectedMedicineId]);

  // Filtered available list
  const filteredMedicines = useMemo(() => {
    let list = medicines.filter((m) => m.status !== 'Quarantined');
    if (!allowOutOfStock) {
      list = list.filter((m) => m.stockQuantity > 0);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list.slice(0, 50);

    return list
      .filter((m) => {
        const nameMatch = m.name?.toLowerCase().includes(query);
        const genericMatch = m.genericName?.toLowerCase().includes(query);
        const skuMatch = m.sku?.toLowerCase().includes(query);
        const batchMatch = m.batchNumber?.toLowerCase().includes(query);
        const categoryMatch = m.category?.toLowerCase().includes(query);
        return nameMatch || genericMatch || skuMatch || batchMatch || categoryMatch;
      })
      .slice(0, 50);
  }, [medicines, searchQuery, allowOutOfStock]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredMedicines.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredMedicines.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredMedicines.length) {
        handleSelect(filteredMedicines[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (medicine: Medicine) => {
    onSelectMedicine(medicine);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectMedicine(null);
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {selectedMedicine ? (
        // Selected Medicine Card Display
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
              <Pill className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs truncate">{selectedMedicine.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 font-mono">
                  {selectedMedicine.batchNumber}
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  Stock: <strong className="text-emerald-700">{selectedMedicine.stockQuantity}</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                <span>{selectedMedicine.genericName || selectedMedicine.category}</span>
                <span>•</span>
                <span>Rack: {selectedMedicine.locationRack || 'A1'}</span>
                <span>•</span>
                <span className="font-black text-slate-900">₹{selectedMedicine.unitPrice.toFixed(2)} / unit</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-emerald-100/80 transition-colors"
              title="Remove selection & pick another"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Search Input
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            autoFocus={autoFocus}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full text-xs pl-9 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            )}
          </div>
        </div>
      )}

      {/* Dropdown Results Box */}
      {isOpen && !selectedMedicine && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-80 flex flex-col animate-in fade-in duration-150">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
            <span>
              {searchQuery ? `Matching Formulary Drugs (${filteredMedicines.length})` : `All In-Stock Medicines (${filteredMedicines.length})`}
            </span>
            <span className="text-slate-400 font-normal">Use ↑↓ and Enter</span>
          </div>

          <ul ref={listRef} className="overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredMedicines.length === 0 ? (
              <li className="p-4 text-center text-slate-500">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <p className="font-bold">No matching medicine found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Check the spelling or verify if the drug is in stock in the Formulary.
                </p>
              </li>
            ) : (
              filteredMedicines.map((med, index) => {
                const isSelected = selectedMedicineId === med.id;
                const isHighlighted = highlightedIndex === index;
                const isLowStock = med.stockQuantity <= (med.minThreshold || 20);

                return (
                  <li
                    key={med.id}
                    onClick={() => handleSelect(med)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isHighlighted
                        ? 'bg-emerald-50/70 text-slate-900'
                        : isSelected
                        ? 'bg-slate-50 font-bold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isLowStock ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <Pill className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">{med.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                            {med.batchNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">SKU: {med.sku}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                          <span>{med.genericName || med.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {med.locationRack || 'Shelf A1'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div className="font-black text-slate-900">₹{med.unitPrice.toFixed(2)}</div>
                        <div
                          className={`text-[10px] font-bold ${
                            isLowStock ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {med.stockQuantity} in stock
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MedicineCombobox;
