import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  CalendarCheck,
  UserCheck,
  Building2,
  Edit,
  Eye,
  Settings,
  Shield,
  Ban,
  CalendarDays,
  DoorOpen,
  Coffee,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { ApiService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  DoctorSchedule,
  DoctorUnavailablePeriod,
  AppointmentSettings,
  Doctor,
  Department,
  OPDRoom,
  DoctorBreak,
  UnavailabilityType,
} from '../../../types';
import {
  generateDoctorTimeSlots,
  validateBookingAvailability,
  getDayOfWeekName,
  formatDisplayDate,
  getHospitalTodayDate,
  getHospitalTimezone,
  getScheduleDateConstraints,
  findNextConsultingDate,
} from '../../../utils/appointmentScheduling';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PatientCombobox } from '../../../components/common/PatientCombobox';

const ALL_WEEK_DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const AppointmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const isHospitalAdmin =
    user?.role === 'hospital_admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'super_admin_manager';

  // Core Data stored in state to prevent new object references on every render
  const [appointments, setAppointments] = useState<Appointment[]>(() => MockStorage.getAppointments(hospId));
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const raw = MockStorage.getDoctors(hospId);
    return raw.length > 0 ? raw : MockStorage.getDoctors();
  });
  const [patients, setPatients] = useState(() => {
    const raw = MockStorage.getPatients(hospId);
    return raw.length > 0 ? raw : MockStorage.getPatients();
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const raw = MockStorage.getDepartments(hospId);
    return raw.length > 0 ? raw : MockStorage.getDepartments();
  });
  const [opdRooms, setOpdRooms] = useState<OPDRoom[]>(() => {
    const raw = MockStorage.getOPDRooms(hospId);
    return raw.length > 0 ? raw : MockStorage.getOPDRooms();
  });

  // Schedules, Unavailability & Settings
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(() => MockStorage.getDoctorSchedules(hospId));
  const [unavailabilities, setUnavailabilities] = useState<DoctorUnavailablePeriod[]>(() =>
    MockStorage.getDoctorUnavailability(hospId)
  );
  const [settings, setSettings] = useState<AppointmentSettings>(() =>
    MockStorage.getAppointmentSettings(hospId)
  );

  // Sync state when hospId changes
  useEffect(() => {
    const rawDocs = MockStorage.getDoctors(hospId);
    setDoctors(rawDocs.length > 0 ? rawDocs : MockStorage.getDoctors());
    const rawPats = MockStorage.getPatients(hospId);
    setPatients(rawPats.length > 0 ? rawPats : MockStorage.getPatients());
    const rawDepts = MockStorage.getDepartments(hospId);
    setDepartments(rawDepts.length > 0 ? rawDepts : MockStorage.getDepartments());
    const rawRms = MockStorage.getOPDRooms(hospId);
    setOpdRooms(rawRms.length > 0 ? rawRms : MockStorage.getOPDRooms());
    setAppointments(MockStorage.getAppointments(hospId));
    setSchedules(MockStorage.getDoctorSchedules(hospId));
    setUnavailabilities(MockStorage.getDoctorUnavailability(hospId));
    const newSettings = MockStorage.getAppointmentSettings(hospId);
    setSettings(newSettings);
    setSettingsForm({ ...newSettings });
  }, [hospId]);

  // Navigation & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [schedulesSearchQuery, setSchedulesSearchQuery] = useState('');
  const [schedulesDeptFilter, setSchedulesDeptFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);

  // Doctor Schedule Config state (for Schedules tab)
  const [selectedScheduleDoctorId, setSelectedScheduleDoctorId] = useState<string>(() => doctors[0]?.id || '');
  const [scheduleForm, setScheduleForm] = useState<DoctorSchedule | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState<boolean>(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [isAllSchedulesModalOpen, setIsAllSchedulesModalOpen] = useState<boolean>(false);
  const prevScheduleDoctorIdRef = useRef<string>(selectedScheduleDoctorId);

  // Keep selectedScheduleDoctorId in sync when doctors list changes
  useEffect(() => {
    if (doctors.length > 0) {
      if (!selectedScheduleDoctorId || !doctors.some((d) => d.id === selectedScheduleDoctorId)) {
        setSelectedScheduleDoctorId(doctors[0].id);
      }
    }
  }, [doctors]);

  // Leave Form state (for Block Leave modal)
  const [leaveForm, setLeaveForm] = useState({
    title: '',
    type: 'Leave' as UnavailabilityType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isAllDay: true,
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    reason: '',
  });

  // Settings Form state
  const [settingsForm, setSettingsForm] = useState<AppointmentSettings>({ ...settings });

  // Refresh helper
  const refreshData = () => {
    const rawDocs = MockStorage.getDoctors(hospId);
    setDoctors(rawDocs.length > 0 ? rawDocs : MockStorage.getDoctors());
    const rawPats = MockStorage.getPatients(hospId);
    setPatients(rawPats.length > 0 ? rawPats : MockStorage.getPatients());
    const rawDepts = MockStorage.getDepartments(hospId);
    setDepartments(rawDepts.length > 0 ? rawDepts : MockStorage.getDepartments());
    const rawRms = MockStorage.getOPDRooms(hospId);
    setOpdRooms(rawRms.length > 0 ? rawRms : MockStorage.getOPDRooms());
    setAppointments(MockStorage.getAppointments(hospId));
    setSchedules(MockStorage.getDoctorSchedules(hospId));
    setUnavailabilities(MockStorage.getDoctorUnavailability(hospId));
    const newSettings = MockStorage.getAppointmentSettings(hospId);
    setSettings(newSettings);
    setSettingsForm({ ...newSettings });
  };

  // Sync selected doctor schedule into edit form only when specialist ID or saved schedules change
  useEffect(() => {
    if (!selectedScheduleDoctorId) {
      setScheduleForm(null);
      setIsEditingSchedule(false);
      return;
    }
    const doc = doctors.find((d) => d.id === selectedScheduleDoctorId);
    const existing = schedules.find((s) => s.doctorId === selectedScheduleDoctorId);
    const doctorChanged = prevScheduleDoctorIdRef.current !== selectedScheduleDoctorId;
    prevScheduleDoctorIdRef.current = selectedScheduleDoctorId;

    if (existing) {
      const docDept = departments.find(
        (d) =>
          (existing.departmentId && (d.id === existing.departmentId || d.code === existing.departmentId)) ||
          (existing.departmentName && d.name.toLowerCase() === existing.departmentName.toLowerCase()) ||
          (doc?.departmentId && (d.id === doc.departmentId || d.code === doc.departmentId))
      );
      const matchedRoom =
        opdRooms.find((r) => r.id === existing.opdRoomId) ||
        opdRooms.find((r) => r.id === doc?.opdRoomId || r.assignedDoctorId === existing.doctorId) ||
        opdRooms.find(
          (r) =>
            (docDept && (r.departmentId === docDept.id || r.departmentId === docDept.code)) ||
            (docDept && r.departmentName?.toLowerCase() === docDept.name.toLowerCase())
        );

      setScheduleForm({
        ...existing,
        opdRoomId: existing.opdRoomId || matchedRoom?.id || '',
        opdRoomName: existing.opdRoomName || (matchedRoom ? `${matchedRoom.name} (${matchedRoom.code})` : ''),
      });

      // When doctor changes or existing schedule is present, default to read-only summary
      if (doctorChanged) {
        setIsEditingSchedule(false);
      }
    } else if (doc) {
      const docDept = departments.find(
        (d) =>
          (doc.departmentId && (d.id === doc.departmentId || d.code === doc.departmentId)) ||
          (doc.departmentName && d.name.toLowerCase() === doc.departmentName.toLowerCase())
      );
      const resolvedDeptId = doc.departmentId || docDept?.id || docDept?.code || departments[0]?.id || '';
      const resolvedDeptName = doc.departmentName || docDept?.name || departments[0]?.name || 'General Medicine';
      const assignedOrDeptRoom =
        opdRooms.find((r) => r.id === doc.opdRoomId || r.assignedDoctorId === doc.id) ||
        opdRooms.find(
          (r) =>
            r.departmentId === resolvedDeptId ||
            (docDept && (r.departmentId === docDept.id || r.departmentId === docDept.code)) ||
            (docDept && r.departmentName?.toLowerCase() === docDept.name.toLowerCase())
        );

      const newDraft: DoctorSchedule = {
        id: `SCH-${selectedScheduleDoctorId}`,
        hospitalId: hospId,
        doctorId: selectedScheduleDoctorId,
        doctorName: doc.name || '',
        departmentId: resolvedDeptId,
        departmentName: resolvedDeptName,
        opdRoomId: assignedOrDeptRoom?.id || doc.opdRoomId || '',
        opdRoomName: assignedOrDeptRoom ? `${assignedOrDeptRoom.name} (${assignedOrDeptRoom.code})` : doc.opdRoomName || '',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        consultationStartTime: '09:00 AM',
        consultationEndTime: '05:00 PM',
        slotDurationMinutes: 30,
        breaks: [
          { id: `BRK-${selectedScheduleDoctorId}`, name: 'Lunch Break', startTime: '01:00 PM', endTime: '02:00 PM' },
        ],
        effectiveStartDate: '2026-01-01',
        effectiveEndDate: '2026-12-31',
        isActive: true,
        notes: `Clinical consultation schedule for ${doc.name}`,
      };
      setScheduleForm(newDraft);
      // Clean new schedule form is in editing mode
      setIsEditingSchedule(true);
    }
  }, [selectedScheduleDoctorId, schedules]);

  const hospitalTimezone = useMemo(() => {
    return getHospitalTimezone(currentHospital, settings);
  }, [currentHospital, settings]);

  const todayActual = useMemo(() => {
    return getHospitalTodayDate(hospitalTimezone);
  }, [hospitalTimezone]);

  // Dynamic Book Appointment Form State
  const [formData, setFormData] = useState(() => ({
    patientId: patients[0]?.id || 'PAT-1001',
    departmentId: departments[0]?.id || 'DEP-101',
    doctorId: doctors[0]?.id || 'DOC-101',
    opdRoomId: '',
    appointmentDate: getHospitalTodayDate(),
    appointmentTime: '10:00 AM',
    type: 'Consultation' as AppointmentType,
    reason: 'Clinical consultation and review',
    notes: '',
    fee: 150,
  }));
  const [selectedBookingPatient, setSelectedBookingPatient] = useState<any>(null);
  const [patientBookingError, setPatientBookingError] = useState<string>('');

  // When Book Modal opens or department changes, update valid doctors & rooms
  const validDoctorsForDept = useMemo(() => {
    if (!formData.departmentId) return doctors;
    return doctors.filter((d) => d.departmentId === formData.departmentId);
  }, [doctors, formData.departmentId]);

  const validRoomsForDept = useMemo(() => {
    if (!formData.departmentId) return opdRooms;
    const selectedDept = departments.find((d) => d.id === formData.departmentId || d.code === formData.departmentId);
    return opdRooms.filter((r) => {
      const matchId =
        r.departmentId === formData.departmentId ||
        (selectedDept && (r.departmentId === selectedDept.id || r.departmentId === selectedDept.code));
      const matchName =
        selectedDept && r.departmentName && r.departmentName.toLowerCase() === selectedDept.name.toLowerCase();
      const matchSelectedDoc =
        formData.doctorId &&
        (r.assignedDoctorId === formData.doctorId ||
          r.id === doctors.find((d) => d.id === formData.doctorId)?.opdRoomId);
      return (matchId || matchName || matchSelectedDoc) && r.status !== 'Inactive';
    });
  }, [opdRooms, formData.departmentId, formData.doctorId, departments, doctors]);

  // Calculated slots for current selection in Book Modal
  const doctorScheduleForBooking = useMemo(() => {
    return schedules.find((s) => s.doctorId === formData.doctorId && s.isActive !== false);
  }, [schedules, formData.doctorId]);

  const dateConstraints = useMemo(() => {
    return getScheduleDateConstraints(doctorScheduleForBooking, settings, hospitalTimezone);
  }, [doctorScheduleForBooking, settings, hospitalTimezone]);

  const slotGeneration = useMemo(() => {
    if (!isBookModalOpen || !formData.doctorId || !formData.appointmentDate) {
      return { slots: [], isDoctorWorkingDay: true, isOnLeave: false, outsideEffectiveRange: false };
    }
    return generateDoctorTimeSlots(
      doctorScheduleForBooking,
      formData.appointmentDate,
      appointments,
      unavailabilities,
      formData.opdRoomId,
      settings,
      hospitalTimezone
    );
  }, [
    isBookModalOpen,
    doctorScheduleForBooking,
    formData.appointmentDate,
    formData.opdRoomId,
    formData.doctorId,
    appointments,
    unavailabilities,
    settings,
    hospitalTimezone,
  ]);

  // Keep appointmentTime synchronized with newly generated slots: never retain stale slot time from another date
  useEffect(() => {
    if (isBookModalOpen) {
      const available = slotGeneration.slots.filter((s) => s.isAvailable);
      const isCurrentTimeValid = available.some((s) => s.time === formData.appointmentTime);
      if (!isCurrentTimeValid) {
        setFormData((prev) => ({
          ...prev,
          appointmentTime: available[0]?.time || '',
        }));
      }
    }
  }, [slotGeneration.slots, isBookModalOpen]);

  const handleDateChange = (newDate: string) => {
    setFormData((prev) => ({
      ...prev,
      appointmentDate: newDate,
      appointmentTime: '', // Cleanly clear slot time so previous date's slot is never retained
    }));
  };

  const handleDoctorChange = (newDocId: string) => {
    const doc = doctors.find((d) => d.id === newDocId);
    const deptRooms = opdRooms.filter((r) => r.departmentId === doc?.departmentId);
    const assignedRoom = deptRooms.find((r) => r.id === doc?.opdRoomId) || deptRooms[0];
    const newSched = schedules.find((s) => s.doctorId === newDocId && s.isActive !== false);
    const constraints = getScheduleDateConstraints(newSched, settings, hospitalTimezone);

    let nextDate = formData.appointmentDate;
    if (nextDate < constraints.minDate || (constraints.maxDate && nextDate > constraints.maxDate)) {
      nextDate = findNextConsultingDate(newSched, constraints.minDate, constraints.maxDate, unavailabilities) || constraints.minDate;
    } else {
      const dayName = getDayOfWeekName(nextDate);
      if (newSched && !newSched.workingDays?.includes(dayName)) {
        nextDate = findNextConsultingDate(newSched, constraints.minDate, constraints.maxDate, unavailabilities) || nextDate;
      }
    }

    setFormData((prev) => ({
      ...prev,
      doctorId: newDocId,
      departmentId: doc?.departmentId || prev.departmentId,
      opdRoomId: assignedRoom?.id || prev.opdRoomId,
      fee: doc?.consultationFee || prev.fee,
      appointmentDate: nextDate,
      appointmentTime: '',
    }));
  };

  // Filtering for Appointments table
  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDoctor = selectedDoctorFilter === 'all' || a.doctorId === selectedDoctorFilter;

    let matchesTab = true;
    if (activeTab === 'today') {
      matchesTab = a.appointmentDate === '2026-09-24' || a.appointmentDate === todayActual;
    } else if (activeTab === 'confirmed') {
      matchesTab = a.status === 'Confirmed' || a.status === 'Checked In';
    } else if (activeTab === 'completed') {
      matchesTab = a.status === 'Completed';
    }

    return matchesSearch && matchesDoctor && matchesTab;
  });

  // Filtered doctors for the "View All Schedules" tab
  const filteredSchedulesDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const docSchedule = schedules.find((s) => s.doctorId === doc.id);
      const q = schedulesSearchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        (docSchedule?.departmentName || doc.departmentName || '').toLowerCase().includes(q) ||
        (docSchedule?.opdRoomName || doc.opdRoomName || '').toLowerCase().includes(q);

      const matchesDept =
        schedulesDeptFilter === 'all' ||
        (docSchedule?.departmentId || doc.departmentId) === schedulesDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [doctors, schedules, schedulesSearchQuery, schedulesDeptFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenBook = () => {
    const firstDept = departments[0];
    const deptDocs = doctors.filter((d) => d.departmentId === firstDept?.id);
    const chosenDoc = deptDocs[0] || doctors[0];
    const deptRooms = opdRooms.filter((r) => r.departmentId === (chosenDoc?.departmentId || firstDept?.id));
    const chosenRoom = deptRooms.find((r) => r.id === chosenDoc?.opdRoomId) || deptRooms[0];

    const docSched = schedules.find((s) => s.doctorId === chosenDoc?.id && s.isActive !== false);
    const constraints = getScheduleDateConstraints(docSched, settings, hospitalTimezone);
    const initialDate = findNextConsultingDate(docSched, constraints.minDate, constraints.maxDate, unavailabilities) || constraints.minDate;

    const gen = generateDoctorTimeSlots(
      docSched,
      initialDate,
      appointments,
      unavailabilities,
      chosenRoom?.id,
      settings,
      hospitalTimezone
    );
    const firstAvail = gen.slots.find((s) => s.isAvailable)?.time || '';
    const initPatient = MockStorage.getPatientById(patients[0]?.id) || patients[0] || null;
    setSelectedBookingPatient(initPatient);
    setPatientBookingError('');

    setFormData({
      patientId: initPatient?.id || '',
      departmentId: chosenDoc?.departmentId || firstDept?.id || '',
      doctorId: chosenDoc?.id || '',
      opdRoomId: chosenRoom?.id || '',
      appointmentDate: initialDate,
      appointmentTime: firstAvail,
      type: 'Consultation',
      reason: 'General Medical Examination',
      notes: '',
      fee: chosenDoc?.consultationFee || 150,
    });
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat =
      selectedBookingPatient ||
      MockStorage.getPatientById(formData.patientId) ||
      patients.find((p) => p.id === formData.patientId);
    const doc = doctors.find((d) => d.id === formData.doctorId);
    const dep = departments.find((d) => d.id === formData.departmentId);
    const room = opdRooms.find((r) => r.id === formData.opdRoomId);

    if (!pat || !formData.patientId) {
      setPatientBookingError('Please search and select a valid registered patient record.');
      showToast('Validation Error', 'Please select a valid registered patient before scheduling.', 'error');
      return;
    }

    if (!doc) {
      showToast('Validation Error', 'Please select a valid specialist physician.', 'error');
      return;
    }

    // Comprehensive Revalidation before saving
    const validation = validateBookingAvailability(
      {
        doctorId: doc.id,
        opdRoomId: room?.id,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
      },
      doctorScheduleForBooking,
      appointments,
      unavailabilities,
      settings,
      hospitalTimezone
    );

    if (!validation.isValid) {
      showToast('Booking Rejected', validation.errorMessage || 'This slot is unavailable.', 'error');
      return;
    }

    const newApt: Appointment = {
      id: `APT-2026-${Math.floor(100 + Math.random() * 900)}`,
      hospitalId: hospId,
      patientId: pat.id,
      patientName: pat.name,
      patientPhone: pat.phone,
      patientAge: pat.age,
      patientGender: pat.gender,
      doctorId: doc.id,
      doctorName: doc.name,
      doctorSpecialization: doc.specialization,
      departmentId: dep?.id || doc.departmentId || 'DEP-101',
      departmentName: dep?.name || doc.departmentName || 'General OPD',
      opdRoomId: room?.id || doc.opdRoomId,
      opdRoomName: room ? `${room.name} (${room.code})` : doc.opdRoomName,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      type: formData.type,
      status: 'Confirmed',
      reason: formData.reason,
      notes: formData.notes,
      fee: doc.consultationFee || formData.fee,
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString().split('T')[0],
    };

    MockStorage.saveAppointment(newApt);

    // Asynchronously sync with Django REST Framework backend
    ApiService.createAppointment({
      id: newApt.id,
      hospital: hospId,
      patient: pat.id,
      doctor: doc.id,
      date: newApt.appointmentDate,
      time: newApt.appointmentTime,
      type: newApt.type,
      status: newApt.status,
      notes: newApt.notes,
      opd_room_id: newApt.opdRoomId,
      opd_room_name: newApt.opdRoomName,
    }).catch(() => {
      // Local storage already persisted
    });

    showToast('Appointment Booked', `Confirmed with ${doc.name} for ${pat.name} at ${newApt.appointmentTime}.`);
    setIsBookModalOpen(false);
    refreshData();
  };

  const handleStatusUpdate = (aptId: string, status: AppointmentStatus) => {
    MockStorage.updateAppointmentStatus(aptId, status);
    ApiService.updateAppointmentStatus(aptId, status).catch(() => {});
    showToast('Status Updated', `Appointment marked as ${status}.`);
    refreshData();
  };

  const handleViewDetail = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsDetailModalOpen(true);
  };

  // Schedule Configuration Handlers
  const handleEditSchedule = () => {
    const existing = schedules.find((s) => s.doctorId === selectedScheduleDoctorId);
    if (existing) {
      setScheduleForm({ ...existing });
    }
    setIsEditingSchedule(true);
  };

  const handleCancelEditSchedule = () => {
    const existing = schedules.find((s) => s.doctorId === selectedScheduleDoctorId);
    if (existing) {
      setScheduleForm({ ...existing });
      setIsEditingSchedule(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm || isSavingSchedule) return;

    if (!isHospitalAdmin) {
      showToast('Permission Denied', 'Only authorized Hospital Administrators can configure doctor schedules.', 'error');
      return;
    }

    // 1. Comprehensive Validation of Required Fields
    if (!scheduleForm.doctorId) {
      showToast('Validation Error', 'Please select a valid medical specialist.', 'error');
      return;
    }

    if (!scheduleForm.opdRoomId) {
      showToast('Validation Error', 'Please select an Associated OPD Chamber for this specialist.', 'error');
      return;
    }

    if (!scheduleForm.workingDays || scheduleForm.workingDays.length === 0) {
      showToast('Validation Error', 'Please select at least one weekly consultation day.', 'error');
      return;
    }

    if (!scheduleForm.consultationStartTime?.trim() || !scheduleForm.consultationEndTime?.trim()) {
      showToast('Validation Error', 'Clinic start and end times are required.', 'error');
      return;
    }

    if (!scheduleForm.slotDurationMinutes || scheduleForm.slotDurationMinutes <= 0) {
      showToast('Validation Error', 'Slot duration must be a valid positive number of minutes.', 'error');
      return;
    }

    if (!scheduleForm.effectiveStartDate) {
      showToast('Validation Error', 'Effective start date is required.', 'error');
      return;
    }

    if (scheduleForm.effectiveEndDate && scheduleForm.effectiveEndDate < scheduleForm.effectiveStartDate) {
      showToast('Validation Error', 'Effective end date cannot be earlier than effective start date.', 'error');
      return;
    }

    // Validate breaks if any
    for (const brk of scheduleForm.breaks || []) {
      if (!brk.name?.trim() || !brk.startTime?.trim() || !brk.endTime?.trim()) {
        showToast('Validation Error', 'Please provide a valid name, start time, and end time for all configured breaks.', 'error');
        return;
      }
    }

    const doc = doctors.find((d) => d.id === scheduleForm.doctorId);
    const room = opdRooms.find((r) => r.id === scheduleForm.opdRoomId);

    const updatedSchedule: DoctorSchedule = {
      ...scheduleForm,
      doctorName: doc?.name || scheduleForm.doctorName,
      departmentId: doc?.departmentId || scheduleForm.departmentId,
      departmentName: doc?.departmentName || scheduleForm.departmentName,
      opdRoomName: room ? `${room.name} (${room.code})` : scheduleForm.opdRoomName,
      isActive: true,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    try {
      setIsSavingSchedule(true);

      // Save to local storage
      MockStorage.saveDoctorSchedule(updatedSchedule);

      // Async sync with Django REST Framework backend
      try {
        await ApiService.saveDoctorSchedule({
          id: updatedSchedule.id,
          hospital: hospId,
          doctor: updatedSchedule.doctorId,
          working_days: updatedSchedule.workingDays,
          consultation_start_time: updatedSchedule.consultationStartTime,
          consultation_end_time: updatedSchedule.consultationEndTime,
          slot_duration_minutes: updatedSchedule.slotDurationMinutes,
          effective_start_date: updatedSchedule.effectiveStartDate,
          effective_end_date: updatedSchedule.effectiveEndDate || null,
          is_active: updatedSchedule.isActive,
          opd_room_id: updatedSchedule.opdRoomId,
          opd_room_name: updatedSchedule.opdRoomName,
          breaks: updatedSchedule.breaks,
        });
      } catch (backendErr) {
        console.warn('Backend sync warning (offline/mock fallback):', backendErr);
      }

      showToast('Success', 'Consultation schedule saved successfully.', 'success');
      refreshData();
      setIsEditingSchedule(false);
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Failed to save specialist schedule. Form values preserved.', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleToggleDay = (day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday') => {
    if (!scheduleForm) return;
    const current = scheduleForm.workingDays || [];
    const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setScheduleForm({ ...scheduleForm, workingDays: updated });
  };

  const handleAddBreak = () => {
    if (!scheduleForm) return;
    const newBreak: DoctorBreak = {
      id: `BRK-${Date.now()}`,
      name: 'Break Interval',
      startTime: '01:00 PM',
      endTime: '02:00 PM',
    };
    setScheduleForm({ ...scheduleForm, breaks: [...scheduleForm.breaks, newBreak] });
  };

  const handleRemoveBreak = (breakId: string) => {
    if (!scheduleForm) return;
    setScheduleForm({
      ...scheduleForm,
      breaks: scheduleForm.breaks.filter((b) => b.id !== breakId),
    });
  };

  // Doctor Leave / Unavailability Handlers
  const handleOpenAddLeave = () => {
    setLeaveForm({
      title: 'Annual Professional Leave',
      type: 'Leave',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      isAllDay: true,
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      reason: 'Scheduled leave approved by Clinical Administration.',
    });
    setIsAddLeaveModalOpen(true);
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHospitalAdmin) {
      showToast('Permission Denied', 'Only authorized Hospital Administrators can block leaves and unavailable periods.', 'error');
      return;
    }

    const doc = doctors.find((d) => d.id === selectedScheduleDoctorId);
    if (!doc) return;

    const newPeriod: DoctorUnavailablePeriod = {
      id: `UNAV-${Date.now()}`,
      hospitalId: hospId,
      doctorId: doc.id,
      doctorName: doc.name,
      type: leaveForm.type,
      title: leaveForm.title,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      isAllDay: leaveForm.isAllDay,
      startTime: leaveForm.isAllDay ? undefined : leaveForm.startTime,
      endTime: leaveForm.isAllDay ? undefined : leaveForm.endTime,
      reason: leaveForm.reason,
    };

    MockStorage.saveDoctorUnavailability(newPeriod);
    ApiService.saveDoctorUnavailability(newPeriod).catch(() => {});
    showToast('Unavailability Blocked', `${doc.name} marked unavailable (${newPeriod.type}: ${newPeriod.startDate}).`);
    setIsAddLeaveModalOpen(false);
    refreshData();
  };

  const handleDeleteLeave = (id: string) => {
    if (!isHospitalAdmin) {
      showToast('Permission Denied', 'Only authorized administrators can unblock leaves.', 'error');
      return;
    }
    MockStorage.deleteDoctorUnavailability(id);
    ApiService.deleteDoctorUnavailability(id).catch(() => {});
    showToast('Unblocked', 'Leave / unavailable period removed.');
    refreshData();
  };

  // Appointment Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHospitalAdmin) {
      showToast('Permission Denied', 'Only authorized Hospital Administrators can modify appointment rules.', 'error');
      return;
    }
    MockStorage.saveAppointmentSettings(settingsForm);
    ApiService.saveAppointmentSettings(settingsForm).catch(() => {});
    showToast('Settings Updated', 'OPD booking limits and cancellation policies updated.');
    refreshData();
  };

  const currentDoctorLeaves = unavailabilities.filter((u) => u.doctorId === selectedScheduleDoctorId);
  const activeSpecialist = doctors.find((d) => d.id === selectedScheduleDoctorId);

  // Eligible chambers for the selected specialist in the Scheduling Roster
  const eligibleChambersForSchedule = useMemo(() => {
    if (!scheduleForm) return [];

    const currentDoc = activeSpecialist || doctors.find((d) => d.id === scheduleForm.doctorId);

    // Resolve the doctor's/schedule's department from departments list
    const doctorDept = departments.find((d) => {
      const matchScheduleId =
        scheduleForm.departmentId && (d.id === scheduleForm.departmentId || d.code === scheduleForm.departmentId);
      const matchDocId =
        currentDoc?.departmentId && (d.id === currentDoc.departmentId || d.code === currentDoc.departmentId);
      const matchScheduleName =
        scheduleForm.departmentName && d.name.toLowerCase() === scheduleForm.departmentName.toLowerCase();
      const matchDocName =
        currentDoc?.departmentName && d.name.toLowerCase() === currentDoc.departmentName.toLowerCase();
      return matchScheduleId || matchDocId || matchScheduleName || matchDocName;
    });

    return opdRooms.filter((room) => {
      // 1. Explicit specialist assignment takes precedence
      const isAssignedToDoctor =
        (room.assignedDoctorId &&
          (room.assignedDoctorId === scheduleForm.doctorId || room.assignedDoctorId === currentDoc?.id)) ||
        (room.assignedDoctorName &&
          (room.assignedDoctorName === scheduleForm.doctorName || room.assignedDoctorName === currentDoc?.name)) ||
        (currentDoc?.opdRoomId && room.id === currentDoc.opdRoomId) ||
        (currentDoc?.roomNumber && room.code && currentDoc.roomNumber.includes(room.code));

      if (isAssignedToDoctor) {
        return room.status !== 'Inactive';
      }

      // 2. Department matching: check ID, code, and name
      const matchesDeptId =
        (scheduleForm.departmentId && (room.departmentId === scheduleForm.departmentId || room.code === scheduleForm.departmentId)) ||
        (currentDoc?.departmentId && (room.departmentId === currentDoc.departmentId || room.code === currentDoc.departmentId)) ||
        (doctorDept && (room.departmentId === doctorDept.id || room.departmentId === doctorDept.code));

      const matchesDeptName =
        (scheduleForm.departmentName &&
          room.departmentName &&
          room.departmentName.toLowerCase() === scheduleForm.departmentName.toLowerCase()) ||
        (currentDoc?.departmentName &&
          room.departmentName &&
          room.departmentName.toLowerCase() === currentDoc.departmentName.toLowerCase()) ||
        (doctorDept && room.departmentName && room.departmentName.toLowerCase() === doctorDept.name.toLowerCase());

      const matchesDepartment = matchesDeptId || matchesDeptName;

      // 3. Chamber status: Available, Occupied, or already assigned to this schedule
      const isUsableStatus =
        room.status === 'Available' ||
        room.status === 'Occupied' ||
        room.id === scheduleForm.opdRoomId;

      return Boolean(matchesDepartment && isUsableStatus && room.status !== 'Inactive');
    });
  }, [scheduleForm, activeSpecialist, doctors, departments, opdRooms]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="OPD Appointments & Specialist Queue"
        subtitle="Manage patient booking pipelines, specialist rosters, availability rules, and chamber queues."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Appointments' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => MockStorage.exportToCSV('OPD_Appointments', filtered)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Schedule
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenBook}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Book Appointment
            </Button>
          </div>
        }
      />

      {/* Main Tab Navigation */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Appointments', count: appointments.length },
              {
                id: 'today',
                label: "Today's Schedule",
                count: appointments.filter(
                  (a) => a.appointmentDate === '2026-09-24' || a.appointmentDate === todayActual
                ).length,
              },
              {
                id: 'confirmed',
                label: 'Confirmed / Checked In',
                count: appointments.filter((a) => a.status === 'Confirmed' || a.status === 'Checked In').length,
              },
              {
                id: 'completed',
                label: 'Completed',
                count: appointments.filter((a) => a.status === 'Completed').length,
              },
              {
                id: 'all-schedules',
                label: 'View All Schedules',
                count: schedules.length,
              },
              {
                id: 'schedules',
                label: 'Doctor Availability & Schedules',
              },
              {
                id: 'settings',
                label: 'Appointment Settings & Policy',
              },
            ]}
            activeTab={activeTab}
            onChange={(t) => {
              setActiveTab(t);
              setCurrentPage(1);
            }}
            variant="pills"
          />

          {/* Quick Search and Specialist Filter (for Appointment List Tabs) */}
          {activeTab !== 'schedules' && activeTab !== 'settings' && activeTab !== 'all-schedules' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, reason..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Select
                value={selectedDoctorFilter}
                onChange={(e) => {
                  setSelectedDoctorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-1.5"
              >
                <option value="all">All Specialists</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* TAB 1-4: APPOINTMENTS LIST / WORKFLOW TABLES */}
        {activeTab !== 'schedules' && activeTab !== 'settings' && activeTab !== 'all-schedules' && (
          <>
            {filtered.length === 0 ? (
              <EmptyState
                title="No Appointments Found"
                description="No matching appointments found for this filter criteria."
                actionText="Book New Appointment"
                onAction={handleOpenBook}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-5 py-3.5">Appointment & Patient</th>
                      <th className="px-4 py-3.5">Schedule Time</th>
                      <th className="px-4 py-3.5">Specialist & Chamber</th>
                      <th className="px-4 py-3.5">Visit Reason</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900 leading-tight">{apt.patientName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono font-semibold text-indigo-600">{apt.id}</span> • {apt.patientAge}y,{' '}
                            {apt.patientGender}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-slate-700">
                          <p className="font-semibold text-slate-900 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" /> {apt.appointmentTime}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{apt.appointmentDate}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{apt.doctorName}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <DoorOpen className="w-3 h-3 text-slate-400" />
                            {apt.opdRoomName || apt.departmentName}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px] mr-1 text-slate-700">
                            {apt.type}
                          </span>
                          {apt.reason}
                        </td>

                        <td className="px-4 py-3.5">
                          {apt.status === 'Checked In' && <Badge variant="success" dot>Checked In</Badge>}
                          {apt.status === 'Confirmed' && <Badge variant="info" dot>Confirmed</Badge>}
                          {apt.status === 'Scheduled' && <Badge variant="neutral" dot>Scheduled</Badge>}
                          {apt.status === 'Completed' && <Badge variant="purple" dot>Completed</Badge>}
                          {apt.status === 'Cancelled' && <Badge variant="error" dot>Cancelled</Badge>}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleViewDetail(apt)}
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {apt.status === 'Scheduled' && (
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleStatusUpdate(apt.id, 'Confirmed')}
                              >
                                Confirm
                              </Button>
                            )}

                            {apt.status === 'Confirmed' && (
                              <Button
                                variant="success"
                                size="xs"
                                onClick={() => handleStatusUpdate(apt.id, 'Checked In')}
                              >
                                Check In
                              </Button>
                            )}

                            {apt.status === 'Checked In' && (
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleStatusUpdate(apt.id, 'Completed')}
                              >
                                Mark Completed
                              </Button>
                            )}

                            {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-rose-600 hover:bg-rose-50"
                                onClick={() => handleStatusUpdate(apt.id, 'Cancelled')}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}

        {/* TAB: VIEW ALL SCHEDULES (IN BETWEEN COMPLETED AND DOCTOR AVAILABILITY & SCHEDULES) */}
        {activeTab === 'all-schedules' && (
          <div className="p-6 space-y-6">
            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">All Medical Specialist Schedules & Rosters</h3>
                  <p className="text-xs text-slate-500">
                    Clinical consultation hours, OPD chambers, and weekly rosters across all specialists for {currentHospital?.name || 'this hospital'}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const firstDocWithoutSchedule = doctors.find((d) => !schedules.some((s) => s.doctorId === d.id));
                    const targetDoc = firstDocWithoutSchedule || doctors[0];
                    if (targetDoc) {
                      setSelectedScheduleDoctorId(targetDoc.id);
                      setIsEditingSchedule(true);
                      setActiveTab('schedules');
                    }
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Configure Specialist Schedule
                </Button>
              </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Specialists</span>
                <p className="text-lg font-bold text-slate-900 mt-1">{doctors.length}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Rosters</span>
                <p className="text-lg font-bold text-emerald-700 mt-1">
                  {schedules.filter((s) => s.isActive).length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Configured Chambers</span>
                <p className="text-lg font-bold text-indigo-700 mt-1">
                  {new Set(schedules.map((s) => s.opdRoomName).filter(Boolean)).size}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Setup</span>
                <p className="text-lg font-bold text-amber-700 mt-1">
                  {doctors.filter((d) => !schedules.some((s) => s.doctorId === d.id)).length}
                </p>
              </div>
            </div>

            {/* Search and Department Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search specialist, chamber, dept..."
                  value={schedulesSearchQuery}
                  onChange={(e) => setSchedulesSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter Dept:</span>
                <Select
                  value={schedulesDeptFilter}
                  onChange={(e) => setSchedulesDeptFilter(e.target.value)}
                  className="text-xs py-1.5 w-full sm:w-48 bg-white"
                >
                  <option value="all">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Roster Table */}
            {filteredSchedulesDoctors.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Specialists Match Filter</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query or department filter.</p>
                <Button
                  variant="outline"
                  size="xs"
                  className="mt-3"
                  onClick={() => {
                    setSchedulesSearchQuery('');
                    setSchedulesDeptFilter('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-4 py-3.5">Specialist</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">OPD Chamber</th>
                      <th className="px-4 py-3.5">Working Days</th>
                      <th className="px-4 py-3.5">Hours & Slots</th>
                      <th className="px-4 py-3.5">Effective Horizon</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchedulesDoctors.map((doc) => {
                      const docSchedule = schedules.find((s) => s.doctorId === doc.id);
                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {doc.name.charAt(4) || 'D'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{doc.name}</p>
                                <p className="text-[11px] text-slate-500">{doc.specialization}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{docSchedule?.departmentName || doc.departmentName || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <DoorOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-medium">{docSchedule?.opdRoomName || doc.opdRoomName || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {docSchedule?.workingDays && docSchedule.workingDays.length > 0 ? (
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {docSchedule.workingDays.length} days/week
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={docSchedule.workingDays.join(', ')}>
                                  {docSchedule.workingDays.map((d) => d.slice(0, 3)).join(', ')}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not configured</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {docSchedule ? (
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {docSchedule.consultationStartTime} - {docSchedule.consultationEndTime}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  <span>{docSchedule.slotDurationMinutes}m slots</span>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-medium">₹{doc.consultationFee}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {docSchedule ? (
                              <span className="font-medium text-[11px]">
                                {docSchedule.effectiveStartDate} {docSchedule.effectiveEndDate ? `→ ${docSchedule.effectiveEndDate}` : '(Ongoing)'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {docSchedule ? (
                              docSchedule.isActive ? (
                                <Badge variant="success" size="sm" dot>Active</Badge>
                              ) : (
                                <Badge variant="neutral" size="sm" dot>Inactive</Badge>
                              )
                            ) : (
                              <Badge variant="warning" size="sm">No Schedule</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              variant={docSchedule ? 'outline' : 'primary'}
                              size="xs"
                              onClick={() => {
                                setSelectedScheduleDoctorId(doc.id);
                                if (docSchedule) {
                                  setIsEditingSchedule(false);
                                } else {
                                  setIsEditingSchedule(true);
                                }
                                setActiveTab('schedules');
                              }}
                              leftIcon={docSchedule ? <Eye className="w-3 h-3 text-indigo-600" /> : <Plus className="w-3 h-3" />}
                            >
                              {docSchedule ? 'View / Edit' : 'Configure'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: DOCTOR AVAILABILITY & SCHEDULES */}
        {activeTab === 'schedules' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Medical Specialist Scheduling Roster</h3>
                  <p className="text-xs text-slate-500">
                    Configure consultation hours, slot granularity, chamber associations, and block leaves.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Select Specialist:</label>
                <Select
                  value={selectedScheduleDoctorId || ''}
                  onChange={(e) => setSelectedScheduleDoctorId(e.target.value)}
                  className="text-xs min-w-[240px]"
                  disabled={doctors.length === 0}
                >
                  {doctors.length === 0 ? (
                    <option value="">No specialists registered</option>
                  ) : (
                    doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))
                  )}
                </Select>
              </div>
            </div>

            {doctors.length === 0 && (
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Medical Specialists Found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  To configure consultation schedules, working hours, and chamber associations, please onboard a doctor first.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/hospital/doctors')}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Onboard Medical Specialist
                </Button>
              </div>
            )}

            {/* SCHEDULE DISPLAY & EDIT SECTION */}
            {(() => {
              const savedSchedule = schedules.find((s) => s.doctorId === selectedScheduleDoctorId);

              // 1. Read-Only Summary Mode (When schedule is saved and not editing)
              if (!isEditingSchedule && savedSchedule) {
                return (
                  <div className="space-y-6">
                    {/* Saved Schedule Header Banner */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
                          <CalendarCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-slate-900">{savedSchedule.doctorName}</h4>
                            {savedSchedule.isActive ? (
                              <Badge variant="success" size="sm" dot>Active Roster</Badge>
                            ) : (
                              <Badge variant="neutral" size="sm" dot>Inactive</Badge>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Saved & Persisted
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Consultation schedule is active and synchronised with the appointment booking engine.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-start md:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('all-schedules')}
                          leftIcon={<Layers className="w-3.5 h-3.5 text-indigo-600" />}
                        >
                          View All Schedules
                        </Button>
                        {isHospitalAdmin && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleEditSchedule}
                            leftIcon={<Edit className="w-3.5 h-3.5" />}
                          >
                            Edit Schedule
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Schedule Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Department</span>
                        <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          {savedSchedule.departmentName || activeSpecialist?.departmentName}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Associated OPD Chamber</span>
                        <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          {savedSchedule.opdRoomName || 'Not Assigned'}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Fee</span>
                        <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                          <span className="text-sm font-extrabold">₹</span>
                          {activeSpecialist?.consultationFee || 500} INR / session
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Slot Granularity</span>
                        <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {savedSchedule.slotDurationMinutes} Minutes / Patient
                        </p>
                      </div>
                    </div>

                    {/* Timings & Breaks Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Weekly Consultation Days */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-indigo-600" />
                            Weekly Consultation Roster
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Specialist holds physical outpatient clinics on these days.</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ALL_WEEK_DAYS.map((day) => {
                            const isWorking = savedSchedule.workingDays?.includes(day);
                            return (
                              <span
                                key={day}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                  isWorking
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 line-through'
                                }`}
                              >
                                {isWorking && <Check className="w-3 h-3" />}
                                {day}
                              </span>
                            );
                          })}
                        </div>

                        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Consultation Hours</span>
                            <p className="font-semibold text-slate-900 mt-0.5">
                              {savedSchedule.consultationStartTime} — {savedSchedule.consultationEndTime}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Effective Dates</span>
                            <p className="font-semibold text-slate-900 mt-0.5">
                              {savedSchedule.effectiveStartDate} {savedSchedule.effectiveEndDate ? `to ${savedSchedule.effectiveEndDate}` : '(Ongoing)'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Configured Clinical Breaks */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Coffee className="w-4 h-4 text-amber-600" />
                              Configured Clinical Breaks
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Intermission windows automatically blocked from patient booking.</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {savedSchedule.breaks?.length || 0} Break{savedSchedule.breaks?.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {(!savedSchedule.breaks || savedSchedule.breaks.length === 0) ? (
                          <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50 rounded-xl">
                            No intermission breaks configured. Specialist consults continuously during shift.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {savedSchedule.breaks.map((brk) => (
                              <div key={brk.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                                  {brk.name}
                                </span>
                                <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {brk.startTime} - {brk.endTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {savedSchedule.notes && (
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Roster Notes</span>
                            <p className="text-xs text-slate-600 italic mt-0.5">{savedSchedule.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. Editing Form Mode
              if (scheduleForm && doctors.length > 0) {
                return (
                  <form onSubmit={handleSaveSchedule} className="space-y-6">
                    {/* Editing Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-indigo-900 block">
                            {savedSchedule
                              ? `Editing Consultation Schedule for ${activeSpecialist?.name}`
                              : `Configure New Consultation Schedule for ${activeSpecialist?.name}`}
                          </span>
                          <span className="text-[11px] text-indigo-600">
                            {savedSchedule
                              ? 'Modifications will update the existing persisted schedule in-place.'
                              : 'Define consultation timings, weekly roster, and OPD chamber association.'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => setIsAllSchedulesModalOpen(true)}
                          leftIcon={<Layers className="w-3 h-3 text-indigo-600" />}
                        >
                          All Schedules
                        </Button>
                        {savedSchedule && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={handleCancelEditSchedule}
                            disabled={isSavingSchedule}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Doctor Metadata Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Clinical Department</label>
                        <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          {scheduleForm.departmentName || activeSpecialist?.departmentName}
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Associated OPD Chamber</label>
                        <Select
                          value={scheduleForm.opdRoomId || ''}
                          onChange={(e) => {
                            const chosenRoomId = e.target.value;
                            const chosenRoom = opdRooms.find((r) => r.id === chosenRoomId);
                            setScheduleForm({
                              ...scheduleForm,
                              opdRoomId: chosenRoomId,
                              opdRoomName: chosenRoom ? `${chosenRoom.name} (${chosenRoom.code})` : '',
                            });
                          }}
                          className="mt-1 text-xs"
                          disabled={!isHospitalAdmin || eligibleChambersForSchedule.length === 0}
                        >
                          <option value="">
                            {eligibleChambersForSchedule.length === 0
                              ? `No eligible chambers found for ${scheduleForm.departmentName || activeSpecialist?.departmentName || 'department'}`
                              : 'Select OPD Chamber'}
                          </option>
                          {eligibleChambersForSchedule.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.code}) — {r.location} {r.status !== 'Available' ? `[${r.status}]` : ''}
                            </option>
                          ))}
                        </Select>
                        {eligibleChambersForSchedule.length === 0 && (
                          <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            No eligible chamber for {scheduleForm.departmentName || 'this department'}. You can add one in{' '}
                            <button
                              type="button"
                              onClick={() => navigate('/hospital/opd-rooms')}
                              className="underline font-bold text-amber-700 hover:text-amber-800"
                            >
                              OPD Rooms
                            </button>.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Standard Consultation Fee</label>
                        <p className="text-xs font-bold text-slate-900 mt-1.5 flex items-center gap-1 text-emerald-600">
                          <span className="font-bold text-sm">₹</span>
                          {activeSpecialist?.consultationFee || 500} INR per session
                        </p>
                      </div>
                    </div>

                    {/* Working Days Config */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800">Weekly Consultation Days *</label>
                      <p className="text-[11px] text-slate-500">Select the days this specialist holds physical OPD clinics.</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ALL_WEEK_DAYS.map((day) => {
                          const isSelected = scheduleForm.workingDays?.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => isHospitalAdmin && handleToggleDay(day)}
                              disabled={!isHospitalAdmin}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                                  : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                              } ${!isHospitalAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Consultation Times & Granularity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Clinic Start Time *"
                        value={scheduleForm.consultationStartTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, consultationStartTime: e.target.value })}
                        placeholder="e.g. 09:00 AM"
                        disabled={!isHospitalAdmin}
                        required
                      />

                      <Input
                        label="Clinic End Time *"
                        value={scheduleForm.consultationEndTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, consultationEndTime: e.target.value })}
                        placeholder="e.g. 05:00 PM"
                        disabled={!isHospitalAdmin}
                        required
                      />

                      <Select
                        label="Slot Duration (Minutes) *"
                        value={String(scheduleForm.slotDurationMinutes)}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, slotDurationMinutes: parseInt(e.target.value, 10) })
                        }
                        disabled={!isHospitalAdmin}
                        required
                      >
                        <option value="15">15 Minutes / Patient</option>
                        <option value="20">20 Minutes / Patient</option>
                        <option value="30">30 Minutes / Patient (Recommended)</option>
                        <option value="45">45 Minutes / Patient</option>
                        <option value="60">60 Minutes / Comprehensive Review</option>
                      </Select>
                    </div>

                    {/* Effective Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Effective Start Date *"
                        type="date"
                        value={scheduleForm.effectiveStartDate}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, effectiveStartDate: e.target.value })}
                        disabled={!isHospitalAdmin}
                        required
                      />

                      <Input
                        label="Effective End Date (Optional)"
                        type="date"
                        value={scheduleForm.effectiveEndDate || ''}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, effectiveEndDate: e.target.value })}
                        disabled={!isHospitalAdmin}
                      />
                    </div>

                    {/* Scheduled Breaks & Recesses */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5 text-amber-600" />
                            Clinical Breaks & Intermissions
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Slots occurring in these windows are automatically blocked from patient booking.
                          </p>
                        </div>
                        {isHospitalAdmin && (
                          <Button type="button" variant="outline" size="xs" onClick={handleAddBreak} leftIcon={<Plus className="w-3 h-3" />}>
                            Add Break
                          </Button>
                        )}
                      </div>

                      {scheduleForm.breaks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No scheduled break configured.</p>
                      ) : (
                        <div className="space-y-2">
                          {scheduleForm.breaks.map((brk, idx) => (
                            <div key={brk.id} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                              <input
                                type="text"
                                placeholder="Break Label (e.g. Lunch Break)"
                                value={brk.name}
                                onChange={(e) => {
                                  const updated = [...scheduleForm.breaks];
                                  updated[idx].name = e.target.value;
                                  setScheduleForm({ ...scheduleForm, breaks: updated });
                                }}
                                disabled={!isHospitalAdmin}
                                className="flex-1 text-xs border border-slate-300 rounded px-2 py-1"
                              />
                              <input
                                type="text"
                                placeholder="Start (e.g. 01:00 PM)"
                                value={brk.startTime}
                                onChange={(e) => {
                                  const updated = [...scheduleForm.breaks];
                                  updated[idx].startTime = e.target.value;
                                  setScheduleForm({ ...scheduleForm, breaks: updated });
                                }}
                                disabled={!isHospitalAdmin}
                                className="w-28 text-xs border border-slate-300 rounded px-2 py-1"
                              />
                              <span className="text-slate-400 text-xs">to</span>
                              <input
                                type="text"
                                placeholder="End (e.g. 02:00 PM)"
                                value={brk.endTime}
                                onChange={(e) => {
                                  const updated = [...scheduleForm.breaks];
                                  updated[idx].endTime = e.target.value;
                                  setScheduleForm({ ...scheduleForm, breaks: updated });
                                }}
                                disabled={!isHospitalAdmin}
                                className="w-28 text-xs border border-slate-300 rounded px-2 py-1"
                              />
                              {isHospitalAdmin && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  className="text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleRemoveBreak(brk.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Form Action Buttons */}
                    {isHospitalAdmin && (
                      <div className="flex items-center justify-between pt-2">
                        {savedSchedule ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEditSchedule}
                            disabled={isSavingSchedule}
                          >
                            Cancel Editing
                          </Button>
                        ) : (
                          <div />
                        )}
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={isSavingSchedule}
                          leftIcon={isSavingSchedule ? undefined : <CheckCircle2 className="w-4 h-4" />}
                        >
                          {isSavingSchedule ? 'Saving Schedule...' : 'Save Specialist Consultation Schedule'}
                        </Button>
                      </div>
                    )}
                  </form>
                );
              }

              return null;
            })()}

            {/* Blocked Doctor Leaves & Holidays Section */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-600" />
                    Doctor Leaves, Public Holidays & Blocked Periods
                  </h4>
                  <p className="text-xs text-slate-500">
                    Appointments cannot be scheduled during these blocked periods for {activeSpecialist?.name}.
                  </p>
                </div>
                {isHospitalAdmin && (
                  <Button variant="outline" size="sm" onClick={handleOpenAddLeave} leftIcon={<Plus className="w-3.5 h-3.5 text-rose-600" />}>
                    Block Leave / Unavailable Period
                  </Button>
                )}
              </div>

              {currentDoctorLeaves.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No active leaves or exceptional unavailability registered for this specialist.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="px-4 py-2.5">Period Title & Type</th>
                        <th className="px-4 py-2.5">Date Range</th>
                        <th className="px-4 py-2.5">Hours</th>
                        <th className="px-4 py-2.5">Reason / Handover Note</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentDoctorLeaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{leave.title}</p>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 bg-rose-50 text-rose-700">
                              {leave.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {leave.startDate} {leave.startDate !== leave.endDate && `→ ${leave.endDate}`}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {leave.isAllDay ? (
                              <Badge variant="neutral" size="sm">Full Day</Badge>
                            ) : (
                              <span>{leave.startTime} - {leave.endTime}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                            {leave.reason || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isHospitalAdmin && (
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDeleteLeave(leave.id)}
                                title="Remove unavailablity block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: APPOINTMENT SETTINGS & POLICY */}
        {activeTab === 'settings' && (
          <div className="p-6 max-w-4xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hospital OPD Appointment Settings & Booking Policy</h3>
                  <p className="text-xs text-slate-500">
                    Control advance booking horizons, cancellation cutoffs, and consultation buffer intervals.
                  </p>
                </div>
              </div>

              {!isHospitalAdmin && (
                <Badge variant="warning" dot>
                  View Only (Admin Privileges Required)
                </Badge>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Advance Booking Rules */}
              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  Advance Booking Windows
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Maximum Advance Booking Horizon (Days)"
                    type="number"
                    min="1"
                    max="180"
                    value={settingsForm.maxAdvanceBookingDays}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, maxAdvanceBookingDays: parseInt(e.target.value, 10) || 30 })
                    }
                    helperText="Patients and staff can only book slots up to this many days into the future."
                    disabled={!isHospitalAdmin}
                    required
                  />

                  <Input
                    label="Minimum Advance Booking Notice (Hours)"
                    type="number"
                    min="0"
                    max="48"
                    value={settingsForm.minAdvanceBookingHours}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, minAdvanceBookingHours: parseInt(e.target.value, 10) || 0 })
                    }
                    helperText="Prevents last-minute bookings without prior notice."
                    disabled={!isHospitalAdmin}
                    required
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameDayBooking"
                    checked={settingsForm.allowSameDayBooking}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, allowSameDayBooking: e.target.checked })
                    }
                    disabled={!isHospitalAdmin}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="sameDayBooking" className="text-xs font-semibold text-slate-800">
                    Allow same-day OPD bookings if slots are open
                  </label>
                </div>
              </div>

              {/* Cancellation & Rescheduling Rules */}
              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Deadlines & Buffer Management
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Cancellation Cutoff (Hours Before)"
                    type="number"
                    min="0"
                    max="72"
                    value={settingsForm.cancellationDeadlineHours}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, cancellationDeadlineHours: parseInt(e.target.value, 10) || 4 })
                    }
                    helperText="Minimum notice required to cancel without penalty."
                    disabled={!isHospitalAdmin}
                    required
                  />

                  <Input
                    label="Rescheduling Cutoff (Hours Before)"
                    type="number"
                    min="0"
                    max="72"
                    value={settingsForm.reschedulingDeadlineHours}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, reschedulingDeadlineHours: parseInt(e.target.value, 10) || 4 })
                    }
                    helperText="Cutoff window for shifting to a new slot."
                    disabled={!isHospitalAdmin}
                    required
                  />

                  <Select
                    label="Inter-Appointment Buffer Time"
                    value={String(settingsForm.appointmentBufferMinutes)}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, appointmentBufferMinutes: parseInt(e.target.value, 10) || 5 })
                    }
                    disabled={!isHospitalAdmin}
                  >
                    <option value="0">0 Minutes (Back-to-back)</option>
                    <option value="5">5 Minutes (Sanitization & Handover)</option>
                    <option value="10">10 Minutes (Standard buffer)</option>
                    <option value="15">15 Minutes (Extended buffer)</option>
                  </Select>
                </div>
              </div>

              {isHospitalAdmin && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                    Save Hospital Appointment Rules
                  </Button>
                </div>
              )}
            </form>
          </div>
        )}
      </Card>

      {/* BOOK APPOINTMENT MODAL (Enhanced with Dynamic Slot Validation) */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule OPD Specialist Appointment"
        subtitle="Clinical slot reservation with doctor schedule & chamber overlap validation"
        maxWidth="lg"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
          {/* Accessible, Premium Searchable Patient Combobox */}
          <PatientCombobox
            label="Select Patient *"
            required
            hospitalId={hospId}
            selectedPatientId={formData.patientId}
            onSelectPatient={(p) => {
              setSelectedBookingPatient(p);
              setFormData((prev) => ({ ...prev, patientId: p?.id || '' }));
              if (p) {
                setPatientBookingError('');
              }
            }}
            error={patientBookingError}
          />

          {/* Department -> Doctor -> OPD Room Cascading Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="1. Clinical Department *"
              value={formData.departmentId}
              onChange={(e) => {
                const newDeptId = e.target.value;
                const docsForDept = doctors.filter((d) => d.departmentId === newDeptId);
                const firstDoc = docsForDept[0];
                const roomsForDept = opdRooms.filter((r) => r.departmentId === newDeptId);
                const assignedRoom = roomsForDept.find((r) => r.id === firstDoc?.opdRoomId) || roomsForDept[0];

                setFormData({
                  ...formData,
                  departmentId: newDeptId,
                  doctorId: firstDoc?.id || '',
                  opdRoomId: assignedRoom?.id || '',
                  fee: firstDoc?.consultationFee || 150,
                });
              }}
              required
            >
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </Select>

            <Select
              label="2. Attending Specialist *"
              value={formData.doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              required
            >
              {validDoctorsForDept.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization})
                </option>
              ))}
            </Select>

            <Select
              label="3. Assigned OPD Chamber *"
              value={formData.opdRoomId}
              onChange={(e) => setFormData({ ...formData, opdRoomId: e.target.value })}
              required
            >
              {validRoomsForDept.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </Select>
          </div>

          {/* Date Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Appointment Date *"
                type="date"
                value={formData.appointmentDate}
                min={dateConstraints.minDate}
                max={dateConstraints.maxDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
              {dateConstraints.isFutureSchedule && dateConstraints.futureStartDate && (
                <p className="mt-1 text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 rounded-md px-2 py-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Doctor's schedule starts on <strong>{formatDisplayDate(dateConstraints.futureStartDate)}</strong></span>
                </p>
              )}
            </div>

            <Select
              label="Consultation Type *"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}
            >
              <option value="Consultation">Clinical Consultation</option>
              <option value="General Checkup">General Routine Checkup</option>
              <option value="Follow-up">Post-Treatment Follow-up</option>
              <option value="Emergency">Urgent OPD Walk-in</option>
              <option value="Surgery">Pre-Surgical Clearance</option>
            </Select>
          </div>

          {/* DYNAMIC TIME SLOTS GENERATOR */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Available Consultation Slots on {formData.appointmentDate}
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Day: <span className="font-semibold text-slate-800">{getDayOfWeekName(formData.appointmentDate)}</span>
              </span>
            </div>

            {/* Availability Alerts */}
            {slotGeneration.isPastDate && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Past Date:</strong> Cannot schedule appointments in the past. Please select today or a future date.
                </span>
              </div>
            )}

            {slotGeneration.isFutureSchedule && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Schedule Not Yet Started:</strong> {slotGeneration.message} Please select {formatDisplayDate(doctorScheduleForBooking?.effectiveStartDate || '')} or a later date.
                </span>
              </div>
            )}

            {slotGeneration.outsideEffectiveRange && !slotGeneration.isFutureSchedule && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Schedule Expired:</strong> {slotGeneration.message}
                </span>
              </div>
            )}

            {slotGeneration.outsideAdvanceWindow && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Advance Window Exceeded:</strong> {slotGeneration.message}
                </span>
              </div>
            )}

            {slotGeneration.sameDayDisallowed && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Policy Restriction:</strong> {slotGeneration.message}
                </span>
              </div>
            )}

            {slotGeneration.isOnLeave && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Doctor Unavailable:</strong> {slotGeneration.message}
                </span>
              </div>
            )}

            {!slotGeneration.isDoctorWorkingDay &&
              !slotGeneration.isOnLeave &&
              !slotGeneration.isPastDate &&
              !slotGeneration.outsideEffectiveRange &&
              !slotGeneration.sameDayDisallowed &&
              !slotGeneration.outsideAdvanceWindow && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Non-Consulting Day:</strong> {slotGeneration.message}
                  </span>
                </div>
              )}

            {slotGeneration.slots.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {slotGeneration.slots.map((slot) => {
                    const isSelected = formData.appointmentTime === slot.time;
                    const isAvailable = slot.isAvailable;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setFormData({ ...formData, appointmentTime: slot.time })}
                        title={slot.reason || slot.time}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center relative ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                            : isAvailable
                            ? 'bg-white border border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50'
                            : slot.status === 'break'
                            ? 'bg-amber-50/80 border border-amber-200 text-amber-600/70 cursor-not-allowed line-through'
                            : slot.status === 'leave'
                            ? 'bg-rose-50 border border-rose-200 text-rose-500/70 cursor-not-allowed line-through'
                            : slot.status === 'occupied_room'
                            ? 'bg-purple-50 border border-purple-200 text-purple-500/70 cursor-not-allowed'
                            : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                        {!isAvailable && (
                          <span className="block text-[8px] font-normal tracking-tighter truncate">
                            {slot.status === 'break'
                              ? 'Break'
                              : slot.status === 'occupied_room'
                              ? 'Room In Use'
                              : slot.status === 'leave'
                              ? 'Leave'
                              : slot.status === 'outside_hours'
                              ? 'Passed'
                              : 'Booked'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {slotGeneration.slots.every((s) => !s.isAvailable) && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium text-center">
                    All consultation slots for this date are fully booked or unavailable. Please choose another date or chamber.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300 inline-block" /> Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" /> Doctor Booked
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-purple-200 inline-block" /> Chamber Occupied
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-200 inline-block" /> Scheduled Break
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-rose-200 inline-block" /> Specialist Leave
                  </span>
                </div>
              </div>
            ) : (
              !slotGeneration.isOnLeave &&
              !slotGeneration.isPastDate &&
              !slotGeneration.isFutureSchedule &&
              !slotGeneration.outsideEffectiveRange &&
              !slotGeneration.sameDayDisallowed &&
              !slotGeneration.outsideAdvanceWindow &&
              slotGeneration.isDoctorWorkingDay && (
                <p className="text-xs text-slate-400 italic py-2">
                  No slots available on this date. Please select another date or configure specialist schedule.
                </p>
              )
            )}
          </div>

          <Input
            label="Chief Complaint / Reason for Visit *"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="e.g. Chronic chest tightness, ECG follow-up"
            required
          />

          <Input
            label="Clinical Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Pre-visit preparation notes"
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">
              Consultation Fee:{' '}
              <span className="text-sm font-bold text-emerald-600">₹{formData.fee}</span>
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm Booking (₹{formData.fee})
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* BLOCK LEAVE / UNAVAILABLE PERIOD MODAL */}
      <Modal
        isOpen={isAddLeaveModalOpen}
        onClose={() => setIsAddLeaveModalOpen(false)}
        title="Block Specialist Leave / Unavailable Period"
        subtitle={`Register leave or exceptional absence for ${activeSpecialist?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveLeave} className="space-y-4 text-xs">
          <Input
            label="Title / Identifier *"
            value={leaveForm.title}
            onChange={(e) => setLeaveForm({ ...leaveForm, title: e.target.value })}
            placeholder="e.g. Annual Medical Conference, Sick Leave"
            required
          />

          <Select
            label="Unavailability Classification *"
            value={leaveForm.type}
            onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as UnavailabilityType })}
            required
          >
            <option value="Leave">Personal / Annual Leave</option>
            <option value="Holiday">Official Public / Hospital Holiday</option>
            <option value="Conference">Medical Conference / Academic</option>
            <option value="Emergency">Exceptional Emergency Absence</option>
            <option value="Administrative">Administrative / Executive Meeting</option>
            <option value="Other">Other Unavailable Period</option>
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date *"
              type="date"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAllDay"
              checked={leaveForm.isAllDay}
              onChange={(e) => setLeaveForm({ ...leaveForm, isAllDay: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="isAllDay" className="text-xs font-semibold text-slate-800">
              Full Day Absence (Entire consultation hours blocked)
            </label>
          </div>

          {!leaveForm.isAllDay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Input
                label="Unavailable From"
                value={leaveForm.startTime}
                onChange={(e) => setLeaveForm({ ...leaveForm, startTime: e.target.value })}
                placeholder="e.g. 09:00 AM"
              />
              <Input
                label="Unavailable To"
                value={leaveForm.endTime}
                onChange={(e) => setLeaveForm({ ...leaveForm, endTime: e.target.value })}
                placeholder="e.g. 01:00 PM"
              />
            </div>
          )}

          <Textarea
            label="Reason / Handover Directive"
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            placeholder="Clinical notes or patient handover instructions during this absence."
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Block Period & Invalidate Slots
            </Button>
          </div>
        </form>
      </Modal>

      {/* APPOINTMENT DETAIL MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Appointment Details — {selectedAppointment?.id}</span>
          </div>
        }
        subtitle="Complete OPD Consultation Metadata & Chamber Booking"
        maxWidth="md"
      >
        {selectedAppointment && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">
                  {selectedAppointment.patientName} ({selectedAppointment.patientId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Specialist:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{selectedAppointment.departmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OPD Chamber:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                  {selectedAppointment.opdRoomName || 'Standard OPD Chamber'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-semibold text-indigo-700">
                  {selectedAppointment.appointmentDate} at {selectedAppointment.appointmentTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Workflow Status:</span>
                <Badge variant="indigo" size="sm">
                  {selectedAppointment.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold">Chief Complaint / Reason:</span>
              <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                {selectedAppointment.reason}
              </p>
            </div>

            {selectedAppointment.notes && (
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold">Clinical Notes:</span>
                <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 italic">
                  {selectedAppointment.notes}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: VIEW ALL SPECIALIST SCHEDULES */}
      <Modal
        isOpen={isAllSchedulesModalOpen}
        onClose={() => setIsAllSchedulesModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>All Medical Specialist Schedules & Rosters</span>
          </div>
        }
        subtitle={`Clinical consultation hours across all specialists for ${currentHospital?.name || 'this hospital'}`}
        maxWidth="5xl"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3">Specialist</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">OPD Chamber</th>
                  <th className="px-4 py-3">Working Days</th>
                  <th className="px-4 py-3">Hours & Slots</th>
                  <th className="px-4 py-3">Effective Horizon</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => {
                  const docSchedule = schedules.find((s) => s.doctorId === doc.id);
                  const isCurrent = doc.id === selectedScheduleDoctorId;
                  return (
                    <tr key={doc.id} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {doc.name.charAt(4) || 'D'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{doc.name}</p>
                            <p className="text-[11px] text-slate-500">{doc.specialization}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {docSchedule?.departmentName || doc.departmentName || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {docSchedule?.opdRoomName || doc.opdRoomName || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {docSchedule?.workingDays ? (
                          <span className="font-semibold text-slate-800">
                            {docSchedule.workingDays.length} days/week
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not configured</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {docSchedule ? (
                          <div>
                            <p className="font-semibold">{docSchedule.consultationStartTime} - {docSchedule.consultationEndTime}</p>
                            <p className="text-[10px] text-slate-400">{docSchedule.slotDurationMinutes}m slots</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {docSchedule ? (
                          <span>
                            {docSchedule.effectiveStartDate} {docSchedule.effectiveEndDate ? `→ ${docSchedule.effectiveEndDate}` : '(Ongoing)'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {docSchedule ? (
                          docSchedule.isActive ? (
                            <Badge variant="success" size="sm" dot>Active</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm" dot>Inactive</Badge>
                          )
                        ) : (
                          <Badge variant="warning" size="sm">No Schedule</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={docSchedule ? 'outline' : 'primary'}
                          size="xs"
                          onClick={() => {
                            setSelectedScheduleDoctorId(doc.id);
                            setIsAllSchedulesModalOpen(false);
                            if (docSchedule) {
                              setIsEditingSchedule(false);
                            } else {
                              setIsEditingSchedule(true);
                            }
                          }}
                        >
                          {docSchedule ? 'View / Edit' : 'Configure'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAllSchedulesModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
