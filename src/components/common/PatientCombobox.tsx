import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  Search,
  X,
  Loader2,
  UserCheck,
  UserPlus,
  UserX,
  AlertCircle,
  Phone,
  Calendar,
  Droplet,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Patient, Gender, BloodGroup, PatientStatus } from '../../types';
import { PatientService, PaginatedPatientResponse } from '../../services/patientService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export interface PatientComboboxProps {
  label?: string;
  required?: boolean;
  hospitalId: string;
  selectedPatientId?: string;
  onSelectPatient: (patient: Patient | null) => void;
  error?: string;
  helperText?: string;
  autoFocus?: boolean;
  className?: string;
}

export const PatientCombobox: React.FC<PatientComboboxProps> = ({
  label = 'Select Patient *',
  required = true,
  hospitalId,
  selectedPatientId,
  onSelectPatient,
  error,
  helperText,
  autoFocus = false,
  className = '',
}) => {
  const componentId = useId();
  const inputId = `patient-search-input-${componentId}`;
  const listboxId = `patient-listbox-${componentId}`;

  // Selection state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(!selectedPatientId);

  // Search input and dropdown state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Async query state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<PaginatedPatientResponse>({
    results: [],
    totalCount: 0,
    page: 1,
    pageSize: 15,
    totalPages: 1,
  });

  // Quick Register Patient Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '1990-01-01',
    age: 36,
    gender: 'Male' as Gender,
    bloodGroup: 'O+' as BloodGroup,
    address: '',
    allergies: '',
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load selected patient profile if selectedPatientId changes from outside
  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      setIsEditing(true);
      return;
    }

    if (selectedPatient?.id === selectedPatientId) {
      return;
    }

    let isMounted = true;
    PatientService.getPatientById(selectedPatientId, hospitalId)
      .then((p) => {
        if (isMounted) {
          if (p) {
            setSelectedPatient(p);
            setIsEditing(false);
          } else {
            setSelectedPatient(null);
            setIsEditing(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setSelectedPatient(null);
          setIsEditing(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPatientId, hospitalId]);

  // Execute patient search
  const executeSearch = useCallback(
    async (queryText: string, targetPage: number = 1) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setSearchError(null);

      try {
        const response = await PatientService.searchPatients({
          query: queryText,
          hospitalId,
          page: targetPage,
          pageSize: 15,
          signal: controller.signal,
        });

        setResultsData(response);
        setHighlightedIndex(response.results.length > 0 ? 0 : -1);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Patient search failed:', err);
          setSearchError('Unable to load patient records. Check network or try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [hospitalId]
  );

  // Debounced search trigger when searchQuery changes
  useEffect(() => {
    if (!isOpen) return;

    if (searchQuery.trim() === '') {
      executeSearch('', 1);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(searchQuery, 1);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isOpen, executeSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Handle select patient
  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditing(false);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    onSelectPatient(patient);
  };

  // Handle clear or change patient
  const handleChangePatient = () => {
    setIsEditing(true);
    setSearchQuery('');
    setIsOpen(true);
    executeSearch('', 1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setIsEditing(true);
    setSearchQuery('');
    onSelectPatient(null);
    executeSearch('', 1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        executeSearch(searchQuery, 1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < resultsData.results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : resultsData.results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < resultsData.results.length
        ) {
          handleSelect(resultsData.results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Open Quick Patient Registration
  const handleOpenRegisterModal = () => {
    setRegisterError(null);
    setRegisterForm({
      name: searchQuery.trim(),
      phone: '',
      email: '',
      dateOfBirth: '1990-01-01',
      age: 36,
      gender: 'Male',
      bloodGroup: 'O+',
      address: '',
      allergies: '',
    });
    setIsOpen(false);
    setIsRegisterModalOpen(true);
  };

  // Submit Quick Patient Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    const name = registerForm.name.trim();
    const phone = registerForm.phone.trim();

    if (!name || !phone) {
      setRegisterError('Full Name and Contact Phone are required.');
      return;
    }

    setIsRegistering(true);
    try {
      const existing = await PatientService.searchPatients({
        query: phone,
        hospitalId,
        page: 1,
        pageSize: 10,
      });

      const duplicate = existing.results.find(
        (p) =>
          p.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') ||
          p.name.toLowerCase() === name.toLowerCase()
      );

      if (duplicate) {
        const confirmed = window.confirm(
          `A patient record matching "${duplicate.name}" (${duplicate.id}, ${duplicate.phone}) already exists.\n\nTo prevent duplicate registration, would you like to select this existing patient instead?`
        );
        if (confirmed) {
          setIsRegistering(false);
          setIsRegisterModalOpen(false);
          handleSelect(duplicate);
          return;
        }
      }

      const newId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPatient: Patient = {
        id: newId,
        hospitalId,
        name,
        phone,
        email: registerForm.email.trim() || `${newId.toLowerCase()}@patientportal.org`,
        dateOfBirth: registerForm.dateOfBirth,
        age: Number(registerForm.age) || 30,
        gender: registerForm.gender,
        bloodGroup: registerForm.bloodGroup,
        address: registerForm.address.trim() || 'General OPD Patient',
        emergencyContactName: 'Next of Kin',
        emergencyContactPhone: phone,
        emergencyContactRelation: 'Family',
        status: 'Outpatient' as PatientStatus,
        allergies: registerForm.allergies
          ? registerForm.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : ['None Reported'],
        medicalHistory: ['Outpatient Specialist OPD Consultation'],
        registeredDate: new Date().toISOString().split('T')[0],
      };

      await PatientService.registerPatient(newPatient);

      setIsRegistering(false);
      setIsRegisterModalOpen(false);
      handleSelect(newPatient);
    } catch (err: any) {
      setIsRegistering(false);
      setRegisterError(err?.message || 'Failed to register patient. Please try again.');
    }
  };

  return (
    <div ref={containerRef} className={`w-full space-y-1.5 ${className}`}>
      {/* Label & Register Link */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={handleOpenRegisterModal}
          className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
          title="Register a new patient record to prevent duplicates"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* VIEW MODE: Polished Compact Patient Summary Card */}
      {!isEditing && selectedPatient ? (
        <div className="group relative rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-white p-3 shadow-xs transition-all hover:border-teal-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* Patient Avatar Badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {selectedPatient.name
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>

              {/* Patient Core Details */}
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="font-semibold text-slate-900 text-sm">
                    {selectedPatient.name}
                  </span>
                  <span className="inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedPatient.id}
                  </span>
                  <Badge
                    variant={selectedPatient.status === 'Inpatient' ? 'warning' : 'success'}
                    size="sm"
                  >
                    {selectedPatient.status || 'Outpatient'}
                  </Badge>
                </div>

                {/* Sub details: Phone, DOB, Blood Group */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>{selectedPatient.phone}</span>
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      DOB: {selectedPatient.dateOfBirth || 'N/A'} (Age {selectedPatient.age},{' '}
                      {selectedPatient.gender})
                    </span>
                  </span>

                  {selectedPatient.bloodGroup && (
                    <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                      <Droplet className="w-3.5 h-3.5" />
                      <span>{selectedPatient.bloodGroup}</span>
                    </span>
                  )}
                </div>

                {/* Allergies Alert (if clinical note) */}
                {selectedPatient.allergies &&
                  selectedPatient.allergies.length > 0 &&
                  !selectedPatient.allergies.includes('None') &&
                  !selectedPatient.allergies.includes('None Reported') && (
                    <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-amber-700 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>Allergies: {selectedPatient.allergies.join(', ')}</span>
                    </div>
                  )}
              </div>
            </div>

            {/* Change Patient Action */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleChangePatient}
                className="text-xs h-8 border-slate-300 bg-white hover:border-teal-500 hover:text-teal-600"
              >
                Change Patient
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* SEARCH / COMBOBOX INPUT MODE */
        <div className="relative">
          <div className="relative rounded-lg shadow-xs">
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>

            {/* Accessible Combobox Input */}
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={listboxId}
              aria-activedescendant={
                highlightedIndex >= 0 && resultsData.results[highlightedIndex]
                  ? `patient-opt-${resultsData.results[highlightedIndex].id}`
                  : undefined
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => {
                setIsOpen(true);
                if (resultsData.results.length === 0) {
                  executeSearch(searchQuery, 1);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search by patient name, ID (e.g. PAT-1001), or phone..."
              autoFocus={autoFocus}
              className={`w-full rounded-lg border bg-white pl-9 pr-20 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                error
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            />

            {/* Right actions: Loading, Clear, Chevron */}
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-teal-600 mr-1" />
              )}

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    executeSearch('', 1);
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Clear patient search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  setIsOpen(!isOpen);
                  if (!isOpen) {
                    executeSearch(searchQuery, 1);
                    inputRef.current?.focus();
                  }
                }}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Toggle patient options"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* DROPDOWN POPUP (Clean White) */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in-50 duration-150 text-slate-900">
              {/* Header Info */}
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-medium text-slate-500 flex items-center justify-between">
                <span>
                  {isLoading
                    ? 'Searching records...'
                    : `Found ${resultsData.totalCount} patient${
                        resultsData.totalCount === 1 ? '' : 's'
                      }`}
                </span>
                <span className="text-[10px] text-slate-400">
                  Use ↑↓ to navigate, Enter to select
                </span>
              </div>

              {/* LISTBOX CONTENT (White) */}
              <ul
                id={listboxId}
                ref={listRef}
                role="listbox"
                aria-label="Patients"
                className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1 focus:outline-none bg-white"
              >
                {/* Error State */}
                {searchError && (
                  <li className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <p className="text-xs text-rose-600 font-medium">{searchError}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => executeSearch(searchQuery, 1)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        className="text-xs mt-1 bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      >
                        Retry Search
                      </Button>
                    </div>
                  </li>
                )}

                {/* Empty State */}
                {!isLoading && !searchError && resultsData.results.length === 0 && (
                  <li className="p-5 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserX className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-900">
                          No matching patients found
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                          {searchQuery
                            ? `No records match "${searchQuery}". Verify phone number or Patient ID.`
                            : 'No patients found in this hospital branch.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleOpenRegisterModal}
                        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                        className="mt-2 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Register New Patient
                      </Button>
                    </div>
                  </li>
                )}

                {/* Results List */}
                {!searchError &&
                  resultsData.results.map((patient, index) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    const isHighlighted = highlightedIndex === index;

                    return (
                      <li
                        key={patient.id}
                        id={`patient-opt-${patient.id}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(patient)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                          isHighlighted
                            ? 'bg-teal-50 text-teal-900 border-l-2 border-teal-600'
                            : 'hover:bg-slate-50 text-slate-800'
                        } ${isSelected ? 'bg-teal-50/80 border-l-4 border-teal-600 font-semibold text-teal-950' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : isHighlighted
                                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {patient.name
                                .split(' ')
                                .map((n) => n[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>

                            {/* Name & ID */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900 truncate">
                                  {patient.name}
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 border border-slate-200">
                                  {patient.id}
                                </span>
                                {patient.status && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                                      patient.status === 'Inpatient'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {patient.status}
                                  </span>
                                )}
                              </div>

                              {/* Details: Phone & DOB */}
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{patient.phone}</span>
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>
                                    DOB: {patient.dateOfBirth} (Age {patient.age},{' '}
                                    {patient.gender})
                                  </span>
                                </span>
                                {patient.bloodGroup && (
                                  <span className="inline-flex items-center gap-0.5 text-rose-600 font-medium">
                                    <Droplet className="w-3 h-3" />
                                    <span>{patient.bloodGroup}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Selected checkmark */}
                          {isSelected && (
                            <UserCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>

              {/* DROPDOWN FOOTER: Pagination & Duplicate Prevention */}
              <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                {/* Pagination buttons */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  {resultsData.totalPages > 1 && (
                    <>
                      <button
                        type="button"
                        disabled={resultsData.page <= 1 || isLoading}
                        onClick={() => executeSearch(searchQuery, resultsData.page - 1)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span>
                        Page {resultsData.page} of {resultsData.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={resultsData.page >= resultsData.totalPages || isLoading}
                        onClick={() => executeSearch(searchQuery, resultsData.page + 1)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                        title="Next page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Prevent Duplicate Registration Action */}
                <button
                  type="button"
                  onClick={handleOpenRegisterModal}
                  className="font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Error Message */}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}

      {/* QUICK PATIENT REGISTRATION MODAL */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Quick Patient Registration"
        subtitle="Create an official patient record without leaving the OPD scheduling workflow"
        maxWidth="md"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
          {registerError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Patient Name *"
              required
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              placeholder="e.g. Robert Vance"
            />

            <Input
              label="Contact Phone *"
              required
              type="tel"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              placeholder="e.g. +1 (555) 301-4490"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date of Birth *"
              required
              type="date"
              value={registerForm.dateOfBirth}
              onChange={(e) => {
                const dob = e.target.value;
                const birthYear = new Date(dob).getFullYear();
                const calcAge = Math.max(0, new Date().getFullYear() - birthYear);
                setRegisterForm({
                  ...registerForm,
                  dateOfBirth: dob,
                  age: calcAge || registerForm.age,
                });
              }}
            />

            <Input
              label="Calculated Age"
              type="number"
              min={0}
              max={120}
              value={registerForm.age}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, age: Number(e.target.value) || 0 })
              }
            />

            <Select
              label="Gender *"
              value={registerForm.gender}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, gender: e.target.value as Gender })
              }
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Blood Group"
              value={registerForm.bloodGroup}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, bloodGroup: e.target.value as BloodGroup })
              }
            >
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </Select>

            <Input
              label="Email Address (Optional)"
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              placeholder="patient@example.com"
            />
          </div>

          <Input
            label="Residential Address"
            value={registerForm.address}
            onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
            placeholder="Street address, City, State"
          />

          <Input
            label="Known Drug Allergies (Comma separated)"
            value={registerForm.allergies}
            onChange={(e) => setRegisterForm({ ...registerForm, allergies: e.target.value })}
            placeholder="e.g. Penicillin, Sulfa, Aspirin (or leave blank if None)"
          />

          <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-[11px] text-teal-800 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Duplicate Prevention:</strong> The phone number and name will be checked
              against existing records for this hospital before generating a new Patient ID.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isRegistering}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Register & Select Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
