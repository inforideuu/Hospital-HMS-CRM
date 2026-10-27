import {
  User,
  Hospital,
  HospitalType,
  HospitalStatus,
  SubscriptionPlan,
  SubscriptionPlanTier,
  CouponCode,
  HospitalSubscription,
  BillingInterval,
  SupportTicket,
  Patient,
  Gender,
  BloodGroup,
  PatientStatus,
  Prescription,
  Appointment,
  Consultation,
  DoctorSchedule,
  DoctorUnavailablePeriod,
  AppointmentSettings,
  Doctor,
  Staff,
  Department,
  OPDRoom,
  OPDRoomStatus,
  Ward,
  Bed,
  BedStatus,
  Admission,
  Invoice,
  BillingCategory,
  Medicine,
  LabTestCatalog,
  LabOrder,
  HospitalWebsite,
  WebsiteSection,
  PlatformSettings,
  HospitalSettings,
  ActivityLog,
  Ambulance,
  AmbulanceDriver,
  EmergencyRequest,
  AmbulanceTrip,
  AmbulanceMaintenance,
  PatientTestimonial,
  SalesLead,
  LeadFollowUp,
  LeadActivity,
  ConvertedCustomer,
  Organization,
  BranchCreationRequest,
  FollowUpRequest,
  AdmissionRequest,
  AdmissionRequestPriority,
  AdmissionRequestStatus,
  NurseConditionStatus,
} from '../types';
import {
  initialOrganizations,
  initialHospitals,
  initialPlans,
  initialCoupons,
  initialUsers,
  initialSubscriptions,
  initialSupportTickets,
  initialDepartments,
  initialOPDRooms,
  initialDoctors,
  initialStaff,
  initialPatients,
  initialPrescriptions,
  initialAppointments,
  initialDoctorSchedules,
  initialDoctorUnavailability,
  initialAppointmentSettings,
  initialWards,
  initialBeds,
  initialAdmissions,
  initialInvoices,
  initialMedicines,
  initialLabCatalog,
  initialLabOrders,
  initialWebsites,
  initialWebsiteSections,
  generateDefaultWebsiteSections,
  initialPlatformSettings,
  initialHospitalSettings,
  initialActivityLogs,
  initialAmbulances,
  initialAmbulanceDrivers,
  initialEmergencyRequests,
  initialAmbulanceTrips,
  initialAmbulanceMaintenance,
  initialTestimonials,
  initialSalesLeads,
  initialLeadFollowUps,
  initialLeadActivities,
  initialConvertedCustomers,
} from '../data/mockData';
import { ApiService } from './apiService';
import { isCapabilityAllowedForTier, checkPathCapability, PLAN_CAPABILITIES } from '../constants/planCapabilities';
import { DEFAULT_HOSPITAL_LAB_CATALOG } from '../utils/labCatalogDefaults';
import { DEFAULT_HOSPITAL_MEDICINES } from '../utils/pharmacyDefaults';

const STORAGE_KEYS = {
  USERS: 'pulse_users',
  DELETED_USERS: 'pulse_deleted_users',
  HOSPITALS: 'pulse_hospitals',
  DELETED_HOSPITALS: 'pulse_deleted_hospitals',
  PLANS: 'pulse_plans',
  COUPONS: 'pulse_coupons',
  SUBSCRIPTIONS: 'pulse_subscriptions',
  TICKETS: 'pulse_tickets',
  DEPARTMENTS: 'pulse_departments',
  OPD_ROOMS: 'pulse_opd_rooms',
  DOCTORS: 'pulse_doctors',
  DELETED_DOCTORS: 'pulse_deleted_doctors',
  STAFF: 'pulse_staff',
  PATIENTS: 'pulse_patients',
  PRESCRIPTIONS: 'pulse_prescriptions',
  APPOINTMENTS: 'pulse_appointments',
  CONSULTATIONS: 'pulse_consultations',
  DOCTOR_SCHEDULES: 'pulse_doctor_schedules',
  DOCTOR_UNAVAILABILITY: 'pulse_doctor_unavailability',
  APPOINTMENT_SETTINGS: 'pulse_appointment_settings',
  WARDS: 'pulse_wards',
  BEDS: 'pulse_beds',
  ADMISSIONS: 'pulse_admissions',
  INVOICES: 'pulse_invoices',
  MEDICINES: 'pulse_medicines',
  LAB_CATALOG: 'pulse_lab_catalog',
  LAB_ORDERS: 'pulse_lab_orders',
  WEBSITES: 'pulse_websites',
  PLATFORM_SETTINGS: 'pulse_platform_settings',
  HOSPITAL_SETTINGS: 'pulse_hospital_settings',
  ACTIVITY_LOGS: 'pulse_activity_logs',
  AUTH_USER: 'pulse_auth_user',
  AMBULANCES: 'pulse_ambulances',
  AMBULANCE_DRIVERS: 'pulse_ambulance_drivers',
  EMERGENCY_REQUESTS: 'pulse_emergency_requests',
  AMBULANCE_TRIPS: 'pulse_ambulance_trips',
  AMBULANCE_MAINTENANCE: 'pulse_ambulance_maintenance',
  TESTIMONIALS: 'pulse_testimonials',
  SALES_LEADS: 'pulse_sales_leads',
  LEAD_FOLLOWUPS: 'pulse_lead_followups',
  LEAD_ACTIVITIES: 'pulse_lead_activities',
  CONVERTED_CUSTOMERS: 'pulse_converted_customers',
  ORGANIZATIONS: 'pulse_organizations',
  BRANCH_REQUESTS: 'pulse_branch_requests',
  FOLLOW_UP_REQUESTS: 'pulse_follow_up_requests',
  ADMISSION_REQUESTS: 'pulse_admission_requests',
};

const initialAdmissionRequests: AdmissionRequest[] = [
  {
    id: 'ADMR-101',
    hospitalId: 'HOSP-001',
    appointmentId: 'APT-1002',
    patientId: 'PAT-1002',
    patientName: 'Jane Smith',
    patientPhone: '+91 98765 43211',
    patientAge: 32,
    patientGender: 'Female',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Sarah Wilson',
    departmentName: 'General Medicine',
    recommendedWardType: 'General Ward',
    priority: 'Urgent',
    reason: 'Acute Pyelonephritis with high-grade spike & vomiting. Needs IV Ceftriaxone & IV fluid hydration.',
    diagnosis: 'Acute Pyelonephritis',
    instructions: 'Start IV NS 100ml/hr, monitor temperature chart q2h, check urine routine.',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  },
];

function notifyStorageChange<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  const syncPayload = { type: 'PULSE_STORAGE_SYNC', key, data: value };

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('pulse_storage_sync');
      bc.postMessage(syncPayload);
      bc.close();
    } catch (e) {}
  }

  try {
    if (typeof document !== 'undefined') {
      const bridgeIframe = document.getElementById('pulse-sync-bridge') as HTMLIFrameElement;
      if (bridgeIframe && bridgeIframe.contentWindow) {
        bridgeIframe.contentWindow.postMessage(syncPayload, '*');
      }
    }
  } catch (e) {}

  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(syncPayload, '*');
    }
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PULSE_STORAGE_SYNC' && event.data.key && event.data.data !== undefined) {
      try {
        const current = localStorage.getItem(event.data.key);
        const next = JSON.stringify(event.data.data);
        if (current !== next) {
          localStorage.setItem(event.data.key, next);
          window.dispatchEvent(new CustomEvent('pulse_storage_updated', { detail: event.data }));
        }
      } catch (e) {}
    }
  });

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('pulse_storage_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'PULSE_STORAGE_SYNC' && event.data.key && event.data.data !== undefined) {
          try {
            const current = localStorage.getItem(event.data.key);
            const next = JSON.stringify(event.data.data);
            if (current !== next) {
              localStorage.setItem(event.data.key, next);
              window.dispatchEvent(new CustomEvent('pulse_storage_updated', { detail: event.data }));
            }
          } catch (e) {}
        }
      };
    } catch (e) {}
  }

  // Instant automatic purge for existing data in Clinical Departments, OPD Rooms, and Pharmacy Medicines
  const PURGE_KEY = 'pulse_purged_depts_rooms_meds_v2026';
  if (!localStorage.getItem(PURGE_KEY)) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.OPD_ROOMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify([]));
    localStorage.setItem(PURGE_KEY, 'true');
    try {
      window.dispatchEvent(new Event('pulse_storage_updated'));
      notifyStorageChange(STORAGE_KEYS.DEPARTMENTS, []);
      notifyStorageChange(STORAGE_KEYS.OPD_ROOMS, []);
      notifyStorageChange(STORAGE_KEYS.MEDICINES, []);
    } catch (e) {}
  }
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(item);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
      notifyStorageChange(key, value);
    }
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function syncWithDjangoBackend() {
  if (typeof window === 'undefined') return;
  try {
    const [
      hospitalsRes,
      patientsRes,
      doctorsRes,
      appointmentsRes,
      admissionsRes,
      invoicesRes,
      medicinesRes,
      labOrdersRes,
      driversRes,
      emergenciesRes,
      websitesRes,
      subscriptionsRes,
      usersRes,
      consultationsRes,
      ticketsRes,
      prescriptionsRes,
      departmentsRes,
      opdRoomsRes,
      wardsRes,
      bedsRes,
      staffRes,
      activityLogsRes,
      salesLeadsRes,
      doctorSchedulesRes,
      doctorUnavailabilityRes,
      appointmentSettingsRes,
    ] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/hospitals/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/patients/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/doctors/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/appointments/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/admissions/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/invoices/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/medicines/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/lab-orders/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/drivers/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/emergency-requests/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/websites/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/subscriptions/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/users/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/consultations/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/support-tickets/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/prescriptions/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/departments/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/opd-rooms/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/wards/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/beds/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/staff/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/activity-logs/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/sales-leads/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/doctor-schedules/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/doctor-unavailability/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/appointment-settings/`).then((r) => r.json()),
    ]);

    let updated = false;

    if (hospitalsRes.status === 'fulfilled' && Array.isArray(hospitalsRes.value)) {
      if (hospitalsRes.value.length === 0) {
        // If MySQL has 0 hospitals, immediately clear any legacy mock hospitals
        localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify([]));
        updated = true;
      } else {
        const deletedHospitalIds = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
        const currentHospitals = getStored<Hospital[]>(STORAGE_KEYS.HOSPITALS, initialHospitals).filter(
          (h) => !deletedHospitalIds.includes(h.id)
        );

        const validBackendHospitals = hospitalsRes.value.filter((h: any) => {
          if (h.id && deletedHospitalIds.includes(h.id)) {
            // Asynchronously ensure deleted hospital is purged from Django DB
            fetch(`${API_BASE_URL}/hospitals/${h.id}/`, { method: 'DELETE' }).catch(() => {});
            return false;
          }
          return true;
        });

        const mapped = validBackendHospitals.map((h: any) => {
          const existing = currentHospitals.find((item) => item.id === h.id || item.name.toLowerCase() === h.name?.toLowerCase());
          const photo = h.image || existing?.logoUrl || existing?.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80';
          return {
            id: h.id || existing?.id || `HOSP-${Math.random().toString(36).substring(2, 7)}`,
            name: h.name || existing?.name || '',
            regNumber: existing?.regNumber || `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            type: (existing?.type || 'General Hospital') as HospitalType,
            email: h.email || existing?.email || '',
            phone: h.phone || existing?.phone || '',
            address: h.address || existing?.address || '',
            city: h.city || existing?.city || '',
            state: existing?.state || 'NY',
            country: existing?.country || 'United States',
            postalCode: existing?.postalCode || '10001',
            adminName: existing?.adminName || `${h.name} Admin`,
            adminEmail: existing?.adminEmail || h.email,
            adminPhone: existing?.adminPhone || h.phone,
            planTier: (
              h.plan?.toLowerCase().includes('enterprise')
                ? 'enterprise'
                : h.plan?.toLowerCase().includes('standard')
                ? 'standard'
                : h.plan?.toLowerCase().includes('trial')
                ? 'trial'
                : h.plan?.toLowerCase().includes('basic')
                ? 'basic'
                : existing?.planTier || 'standard'
            ) as SubscriptionPlanTier,
            status: (h.status?.toLowerCase() === 'active' ? 'active' : existing?.status || 'active') as HospitalStatus,
            logoUrl: photo,
            image: photo,
            totalDoctors: (() => {
              const tier = (h.plan?.toLowerCase().includes('enterprise') ? 'enterprise' : h.plan?.toLowerCase().includes('standard') ? 'standard' : h.plan?.toLowerCase().includes('trial') ? 'trial' : 'basic') as SubscriptionPlanTier;
              const p = initialPlans.find((plan) => plan.tier === tier);
              return h.doctors_count && h.doctors_count > 3 ? h.doctors_count : (p?.maxDoctors ?? 35);
            })(),
            totalPatients: existing?.totalPatients || 0,
            totalBeds: (() => {
              const tier = (h.plan?.toLowerCase().includes('enterprise') ? 'enterprise' : h.plan?.toLowerCase().includes('standard') ? 'standard' : h.plan?.toLowerCase().includes('trial') ? 'trial' : 'basic') as SubscriptionPlanTier;
              const p = initialPlans.find((plan) => plan.tier === tier);
              if (tier === 'basic') return 0;
              return h.beds_count && h.beds_count > 20 ? h.beds_count : (p?.maxBeds ?? (tier === 'standard' ? 120 : tier === 'enterprise' ? 500 : 20));
            })(),
            createdAt: h.created_at || existing?.createdAt || new Date().toISOString().split('T')[0],
            websiteUrl: existing?.websiteUrl || `https://${(h.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')}.pulsecorehealth.com`,
            domainStatus: existing?.domainStatus || 'connected',
          };
        });
        localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(mapped));
        updated = true;
      }
    }

    if (patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value)) {
      const backendPatients = patientsRes.value;
      const currentPatients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
      const mapped: Patient[] = backendPatients.map((p: any) => ({
        id: p.id,
        hospitalId: p.hospital || p.hospital_id || 'HOSP-001',
        name: p.name || 'Unknown Patient',
        email: p.email || '',
        phone: p.phone || '',
        dateOfBirth: p.date_of_birth || p.dateOfBirth || '',
        age: Number(p.age) || 0,
        gender: (p.gender || 'Other') as Gender,
        bloodGroup: (p.blood_group || p.bloodGroup || 'O+') as BloodGroup,
        address: p.address || '',
        emergencyContactName: p.emergency_contact_name || p.emergencyContactName || '',
        emergencyContactPhone: p.emergency_contact_phone || p.emergencyContactPhone || '',
        emergencyContactRelation: p.emergency_contact_relation || p.emergencyContactRelation || '',
        status: (p.status || 'Outpatient') as PatientStatus,
        allergies: Array.isArray(p.allergies) ? p.allergies : [],
        medicalHistory: Array.isArray(p.medical_history) ? p.medical_history : (Array.isArray(p.medicalHistory) ? p.medicalHistory : []),
        registeredDate: p.registered_date || p.registeredDate || p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        assignedDoctorId: p.assigned_doctor_id || p.assignedDoctorId || undefined,
        assignedDoctorName: p.assigned_doctor_name || p.assignedDoctorName || undefined,
        roomBedNumber: p.room_bed_number || p.roomBedNumber || undefined,
        vitals: p.vitals || {},
      }));

      const mergedMap = new Map<string, Patient>();
      for (const p of currentPatients) {
        if (p && p.id) mergedMap.set(p.id, p);
      }
      for (const p of mapped) {
        if (p && p.id) mergedMap.set(p.id, p);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentPatients.length || JSON.stringify(reconciled) !== JSON.stringify(currentPatients)) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(reconciled));
        updated = true;
      }

      for (const p of reconciled) {
        const inBackend = backendPatients.some((bp: any) => bp.id === p.id);
        if (!inBackend) {
          fetch(`${API_BASE_URL}/patients/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': p.hospitalId || 'HOSP-001' },
            body: JSON.stringify({
              id: p.id,
              hospital: p.hospitalId || 'HOSP-001',
              name: p.name,
              email: p.email,
              phone: p.phone,
              date_of_birth: p.dateOfBirth,
              age: p.age,
              gender: p.gender,
              blood_group: p.bloodGroup,
              address: p.address,
              emergency_contact_name: p.emergencyContactName,
              emergency_contact_phone: p.emergencyContactPhone,
              emergency_contact_relation: p.emergencyContactRelation,
              status: p.status,
              allergies: p.allergies,
              medical_history: p.medicalHistory,
              vitals: p.vitals,
            }),
          }).catch(() => {});
        }
      }
    }

    if (doctorsRes.status === 'fulfilled' && Array.isArray(doctorsRes.value)) {
      const deletedDoctorIds = getStored<string[]>(STORAGE_KEYS.DELETED_DOCTORS, []);
      const currentDocs = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors).filter(
        (d) => !deletedDoctorIds.includes(d.id)
      );

      const validBackendDocs = doctorsRes.value.filter((d: any) => {
        if (d.id && deletedDoctorIds.includes(d.id)) {
          fetch(`${API_BASE_URL}/doctors/${d.id}/`, { method: 'DELETE' }).catch(() => {});
          return false;
        }
        return true;
      });

      const mapped: Doctor[] = validBackendDocs.map((d: any) => ({
        id: d.id,
        hospitalId: d.hospital || 'HOSP-001',
        name: d.name,
        department: d.department_name || d.department || 'General OPD',
        departmentName: d.department_name || d.department || 'General OPD',
        departmentId: d.department_id || '',
        specialization: d.specialization || 'General',
        phone: d.phone || '',
        email: d.email || '',
        qualifications: d.qualifications || '',
        experienceYears: Number(d.experience_years !== undefined && d.experience_years !== null ? d.experience_years : (d.experienceYears || 0)),
        availableHours: d.available_hours || d.availableHours || '',
        availableDays: Array.isArray(d.available_days) && d.available_days.length > 0 ? d.available_days : (Array.isArray(d.availableDays) ? d.availableDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        opdRoomId: d.opd_room_id || d.opdRoomId || '',
        opdRoomName: d.opd_room_name || d.opdRoomName || d.room_number || d.roomNumber || '',
        roomNumber: d.room_number || d.roomNumber || d.opd_room_name || '',
        avatarUrl: d.avatar_url || d.avatarUrl || '',
        consultationFee: Number(d.consultation_fee !== undefined && d.consultation_fee !== null ? d.consultation_fee : (d.consultationFee || 500)),
        availabilityStatus: d.availability_status || d.availabilityStatus || 'Available',
        status: ((d.availability_status || d.availabilityStatus || 'Available') === 'Available' ? 'active' : 'on_leave') as Doctor['status'],
      }));

      // Merge backend doctors with local doctors preserving all user-entered fields
      const mergedMap = new Map<string, Doctor>();
      for (const d of currentDocs) {
        if (d && d.id) mergedMap.set(d.id, d);
      }
      for (const d of mapped) {
        if (d && d.id) {
          const existing = mergedMap.get(d.id);
          if (existing) {
            mergedMap.set(d.id, {
              ...existing,
              ...d,
              departmentId: d.departmentId || existing.departmentId,
              departmentName: d.departmentName || existing.departmentName,
              qualifications: d.qualifications || existing.qualifications,
              experienceYears: (d.experienceYears !== undefined && d.experienceYears !== 0) ? d.experienceYears : (existing.experienceYears || 0),
              availableHours: d.availableHours || existing.availableHours,
              availableDays: (d.availableDays && d.availableDays.length > 0) ? d.availableDays : existing.availableDays,
              opdRoomId: d.opdRoomId || existing.opdRoomId,
              opdRoomName: d.opdRoomName || existing.opdRoomName,
              roomNumber: d.roomNumber || existing.roomNumber,
              avatarUrl: d.avatarUrl || existing.avatarUrl,
            });
          } else {
            mergedMap.set(d.id, d);
          }
        }
      }

      const reconciledDoctors = Array.from(mergedMap.values());
      if (reconciledDoctors.length !== currentDocs.length || JSON.stringify(reconciledDoctors) !== JSON.stringify(currentDocs)) {
        localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(reconciledDoctors));
        updated = true;
      }

      // Automatically push any locally onboarded doctors to the Django backend if not already there
      for (const doc of reconciledDoctors) {
        const inBackend = validBackendDocs.some((bd: any) => bd.id === doc.id || (bd.email && doc.email && bd.email.toLowerCase() === doc.email.toLowerCase()));
        if (!inBackend) {
          fetch(`${API_BASE_URL}/doctors/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: doc.id,
              hospital: doc.hospitalId,
              name: doc.name,
              department: doc.departmentName || (doc as any).department || 'General OPD',
              department_name: doc.departmentName || (doc as any).department || 'General OPD',
              department_id: doc.departmentId || '',
              specialization: doc.specialization,
              phone: doc.phone || '',
              email: (doc.email || '').trim().toLowerCase(),
              qualifications: doc.qualifications || '',
              experience_years: Number(doc.experienceYears || 0),
              available_hours: doc.availableHours || '',
              available_days: doc.availableDays || [],
              opd_room_id: doc.opdRoomId || '',
              opd_room_name: doc.opdRoomName || doc.roomNumber || '',
              room_number: doc.roomNumber || doc.opdRoomName || '',
              avatar_url: doc.avatarUrl || '',
              consultation_fee: Number(doc.consultationFee || 500),
              availability_status: doc.status === 'active' ? 'Available' : 'Unavailable',
            }),
          }).catch(() => {});
        }
      }
    }

    if (usersRes && usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
      const backendUsers = usersRes.value;
      const currentUsers = getStored<User[]>(STORAGE_KEYS.USERS, initialUsers);
      const deletedUserIds = new Set(getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []));

      // Retain active local users, filtering out only those explicitly marked as deleted
      let reconciledUsers = currentUsers.filter((u) => {
        if (deletedUserIds.has(u.id)) return false;
        return true;
      });

      // Synchronize in any active users from MySQL that aren't yet in local state
      for (const bu of backendUsers) {
        const buEmail = (bu.email || '').trim().toLowerCase();
        if (buEmail && !deletedUserIds.has(String(bu.id))) {
          const localUser = reconciledUsers.find(
            (u) => (u.email || '').trim().toLowerCase() === buEmail || u.id === bu.id
          );
          if (!localUser) {
            reconciledUsers.push({
              id: bu.id,
              name: bu.name || bu.username || bu.email,
              email: bu.email,
              role: bu.role,
              portal: bu.role?.startsWith('super') ? 'platform' : 'hospital',
              status: bu.status || 'active',
              hospitalId: bu.hospital,
              createdAt: bu.created_at || new Date().toISOString(),
            });
          }
        }
      }

      // Synchronize any local users not yet in Django backend up to backend
      for (const u of reconciledUsers) {
        const inBackend = backendUsers.some(
          (bu: any) =>
            bu.id === u.id ||
            (bu.email && u.email && bu.email.trim().toLowerCase() === u.email.trim().toLowerCase())
        );
        if (!inBackend && u.email) {
          fetch(`${API_BASE_URL}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: u.id,
              name: u.name,
              email: (u.email || '').trim().toLowerCase(),
              password: u.password || 'Staff@1234',
              role: u.role,
              portal: u.portal || 'hospital',
              hospital: u.hospitalId || 'HOSP-001',
              hospital_name: u.hospitalName || null,
              status: u.status || 'active',
            }),
          }).catch(() => {});
        }
      }

      if (reconciledUsers.length !== currentUsers.length || JSON.stringify(reconciledUsers) !== JSON.stringify(currentUsers)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(reconciledUsers));
        updated = true;
      }
    }

    if (emergenciesRes.status === 'fulfilled' && Array.isArray(emergenciesRes.value) && emergenciesRes.value.length > 0) {
      const mapped = emergenciesRes.value.map((e: any) => ({
        id: e.id,
        hospitalId: e.hospital || 'hosp-1',
        patientName: e.patient_name || e.patientName,
        patientPhone: e.patient_phone || e.patientPhone,
        pickupLocation: e.pickup_location || e.pickupLocation,
        destinationHospital: e.destination_hospital || e.destinationHospital,
        emergencyType: e.emergency_type || e.emergencyType,
        priority: e.priority,
        status: e.status,
        assignedDriverId: e.assigned_driver || e.assignedDriverId,
        assignedDriverName: e.assigned_driver_name || e.assignedDriverName || 'Carlos Mendez',
        chiefComplaint: e.chief_complaint || e.chiefComplaint,
        requestTime: e.created_at || new Date().toISOString(),
      }));
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(mapped));
      updated = true;
    }

    if (driversRes.status === 'fulfilled' && Array.isArray(driversRes.value) && driversRes.value.length > 0) {
      const mapped = driversRes.value.map((dr: any) => ({
        id: dr.id,
        hospitalId: dr.hospital || 'hosp-1',
        driverName: dr.name || dr.driverName,
        phone: dr.phone,
        licenseNumber: dr.license_number || dr.licenseNumber,
        assignedAmbulanceReg: dr.assigned_ambulance_reg || dr.assignedAmbulanceReg,
        availabilityStatus: dr.availability_status || dr.availabilityStatus,
        completedTrips: dr.completed_trips || dr.completedTrips || 0,
      }));
      localStorage.setItem(STORAGE_KEYS.AMBULANCE_DRIVERS, JSON.stringify(mapped));
      updated = true;
    }

    if (appointmentsRes && appointmentsRes.status === 'fulfilled' && Array.isArray(appointmentsRes.value)) {
      const backendAppointments = appointmentsRes.value;
      const currentAppointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
      const doctorsList = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
      const patientsList = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
      const roomsList = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);

      const mapped: Appointment[] = backendAppointments.map((a: any) => {
        const doc = doctorsList.find((d) => d.id === a.doctor || d.id === a.doctor_id);
        const pat = patientsList.find((p) => p.id === a.patient || p.id === a.patient_id);
        const room = roomsList.find((r) => r.id === a.opd_room_id);

        return {
          id: a.id,
          hospitalId: a.hospital || a.hospital_id || 'HOSP-001',
          patientId: a.patient || a.patient_id || '',
          patientName: a.patient_name || pat?.name || 'Patient',
          patientPhone: pat?.phone || '',
          patientAge: pat?.age || 30,
          patientGender: pat?.gender || 'Other',
          doctorId: a.doctor || a.doctor_id || '',
          doctorName: a.doctor_name || doc?.name || 'Doctor',
          doctorSpecialization: doc?.specialization || 'General',
          departmentId: doc?.departmentId || 'DEP-101',
          departmentName: doc?.departmentName || 'General OPD',
          opdRoomId: a.opd_room_id,
          opdRoomName: a.opd_room_name || (room ? `${room.name} (${room.code})` : undefined),
          appointmentDate: a.date || a.appointmentDate,
          appointmentTime: a.time || a.appointmentTime,
          type: (a.type || 'Consultation') as any,
          status: a.status as any,
          reason: a.reason || a.notes || 'Consultation',
          notes: a.notes,
          fee: doc?.consultationFee || 150,
          paymentStatus: 'Paid',
          checkedInAt: a.checked_in_at || a.checkedInAt,
          consultationStartedAt: a.consultation_started_at || a.consultationStartedAt,
          consultationCompletedAt: a.consultation_completed_at || a.consultationCompletedAt,
          createdAt: a.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        };
      });

      const mergedMap = new Map<string, Appointment>();
      for (const a of currentAppointments) {
        if (a && a.id) mergedMap.set(a.id, a);
      }
      for (const a of mapped) {
        if (a && a.id) mergedMap.set(a.id, a);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentAppointments.length || JSON.stringify(reconciled) !== JSON.stringify(currentAppointments)) {
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(reconciled));
        updated = true;
      }

      for (const a of reconciled) {
        const inBackend = backendAppointments.some((ba: any) => ba.id === a.id);
        if (!inBackend) {
          fetch(`${API_BASE_URL}/appointments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': a.hospitalId || 'HOSP-001' },
            body: JSON.stringify({
              id: a.id,
              hospital: a.hospitalId || 'HOSP-001',
              patient: a.patientId,
              doctor: a.doctorId,
              date: a.appointmentDate,
              time: a.appointmentTime,
              type: a.type,
              status: a.status,
              notes: a.notes || a.reason,
              opd_room_id: a.opdRoomId || null,
            }),
          }).catch(() => {});
        }
      }
    }

    if (consultationsRes && consultationsRes.status === 'fulfilled' && Array.isArray(consultationsRes.value)) {
      const mapped: Consultation[] = consultationsRes.value.map((c: any) => ({
        id: c.id,
        hospitalId: c.hospital || c.hospital_id || 'hosp-1',
        appointmentId: c.appointment || c.appointment_id,
        patientId: c.patient || c.patient_id,
        patientName: c.patient_name || c.patientName,
        doctorId: c.doctor || c.doctor_id,
        doctorName: c.doctor_name || c.doctorName,
        status: c.status,
        chiefComplaint: c.chief_complaint || c.chiefComplaint,
        symptoms: c.symptoms,
        examination: c.examination,
        vitals: c.vitals || {},
        diagnosis: c.diagnosis,
        treatmentPlan: c.treatment_plan || c.treatmentPlan,
        prescriptionItems: c.prescription_items || c.prescriptionItems || [],
        followUpInstructions: c.follow_up_instructions || c.followUpInstructions,
        notes: c.notes,
        startedAt: c.started_at || c.startedAt,
        finalizedAt: c.finalized_at || c.finalizedAt,
        updatedAt: c.updated_at || c.updatedAt,
      }));

      const currentLocal = getStored<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
      const mergedMap = new Map<string, Consultation>();
      for (const c of currentLocal) {
        if (c.id) mergedMap.set(c.id, c);
      }
      for (const c of mapped) {
        if (c.id) {
          const existing = mergedMap.get(c.id);
          mergedMap.set(c.id, existing ? { ...existing, ...c } : c);
        }
      }
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(Array.from(mergedMap.values())));
      updated = true;
    }

    if (ticketsRes && ticketsRes.status === 'fulfilled' && Array.isArray(ticketsRes.value)) {
      const backendTickets = ticketsRes.value;
      const currentTickets = getStored<SupportTicket[]>(STORAGE_KEYS.TICKETS, []);
      const mapped: SupportTicket[] = backendTickets.map((t: any) => ({
        id: t.id,
        hospitalId: t.hospital || t.hospital_id || t.hospitalId || 'HOSP-001',
        hospitalName: t.hospital_name || t.hospitalName || 'Apex City Medical Center',
        title: t.title,
        description: t.description || '',
        category: t.category || 'Technical',
        priority: t.priority || 'medium',
        status: t.status || 'open',
        requesterName: t.requester_name || t.requesterName || 'Hospital Admin',
        requesterEmail: t.requester_email || t.requesterEmail || '',
        assignedTo: t.assigned_to || t.assignedTo || 'Platform Operations',
        createdAt: t.created_at || t.createdAt || new Date().toISOString(),
        updatedAt: t.updated_at || t.updatedAt || new Date().toISOString(),
        messages: Array.isArray(t.messages)
          ? t.messages.map((m: any) => ({
              id: m.id,
              sender: m.sender,
              senderRole: m.senderRole || m.sender_role || 'platform_support',
              avatar: m.avatar,
              message: m.message,
              timestamp: m.timestamp,
            }))
          : [],
      }));

      const mergedMap = new Map<string, SupportTicket>();
      for (const t of currentTickets) {
        if (t && t.id) mergedMap.set(t.id, t);
      }
      for (const t of mapped) {
        if (t && t.id) mergedMap.set(t.id, t);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentTickets.length || JSON.stringify(reconciled) !== JSON.stringify(currentTickets)) {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(reconciled));
        updated = true;
      }
    }

    if (medicinesRes && medicinesRes.status === 'fulfilled' && Array.isArray(medicinesRes.value)) {
      const backendMedicines = medicinesRes.value;
      const currentMedicines = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines);
      const mapped: Medicine[] = backendMedicines.map((m: any) => ({
        id: m.id,
        hospitalId: m.hospital || m.hospital_id || 'HOSP-001',
        name: m.medicine_name || m.name,
        genericName: m.generic_name || m.name,
        sku: m.sku || `SKU-${m.id}`,
        batchNumber: m.batch_number || `BATCH-${m.id}`,
        category: m.category || 'General',
        stockQuantity: m.stock_quantity !== undefined ? Number(m.stock_quantity) : (m.stock !== undefined ? Number(m.stock) : 50),
        minThreshold: m.min_threshold !== undefined ? Number(m.min_threshold) : 10,
        unitPrice: m.unit_price !== undefined ? Number(m.unit_price) : (m.price !== undefined ? Number(m.price) : 10),
        expiryDate: m.expiry_date || m.expiryDate || new Date().toISOString().split('T')[0],
        manufacturer: m.manufacturer || 'Standard Pharma',
        locationRack: m.location_rack || 'A1',
        requiresPrescription: Boolean(m.requires_prescription),
        stock: m.stock_quantity !== undefined ? Number(m.stock_quantity) : 50,
        unit: m.unit || 'Tablets',
        price: m.unit_price !== undefined ? Number(m.unit_price) : 10,
        status: m.status as any || 'In Stock',
      }));

      const mergedMap = new Map<string, Medicine>();
      for (const med of currentMedicines) {
        if (med && med.id) mergedMap.set(med.id, med);
      }
      for (const med of mapped) {
        if (med && med.id) mergedMap.set(med.id, med);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentMedicines.length || JSON.stringify(reconciled) !== JSON.stringify(currentMedicines)) {
        localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(reconciled));
        updated = true;
      }

      for (const med of reconciled) {
        const inBackend = backendMedicines.some((bm: any) => bm.id === med.id);
        if (!inBackend) {
          fetch(`${API_BASE_URL}/medicines/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': med.hospitalId || 'HOSP-001' },
            body: JSON.stringify({
              id: med.id,
              hospital: med.hospitalId || 'HOSP-001',
              medicine_name: med.name,
              category: med.category,
              stock_quantity: med.stockQuantity,
              unit_price: med.unitPrice,
            }),
          }).catch(() => {});
        }
      }
    }

    if (admissionsRes && admissionsRes.status === 'fulfilled' && Array.isArray(admissionsRes.value)) {
      const backendAdmissions = admissionsRes.value;
      const currentAdmissions = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
      const mapped: Admission[] = backendAdmissions.map((a: any) => ({
        id: a.id,
        hospitalId: a.hospital || a.hospital_id || 'HOSP-001',
        patientId: a.patient || a.patient_id,
        patientName: a.patient_name || a.patientName || 'Patient',
        doctorId: a.doctor || a.doctor_id,
        doctorName: a.doctor_name || a.doctorName || 'Doctor',
        departmentName: a.department_name || a.departmentName || 'General Medicine',
        wardType: (a.ward_type || a.wardType || 'General Ward') as any,
        bedNumber: a.bed_number || a.bedNumber || 'B-01',
        roomNumber: a.room_number || a.roomNumber || '101',
        admissionDate: a.admission_date || a.admissionDate || new Date().toISOString().split('T')[0],
        dischargeDate: a.discharge_date || a.dischargeDate,
        admissionType: (a.admission_type || a.admissionType || 'Elective') as any,
        reason: a.reason || a.diagnosis || 'Clinical Inpatient Care',
        diagnosis: a.diagnosis || '',
        status: (a.status as any) || 'Active',
        initialDeposit: Number(a.initial_deposit || a.initialDeposit || 0),
      }));

      const mergedMap = new Map<string, Admission>();
      for (const a of currentAdmissions) {
        if (a && a.id) mergedMap.set(a.id, a);
      }
      for (const a of mapped) {
        if (a && a.id) {
          const local = mergedMap.get(a.id);
          let parsedNotes: any = null;
          try {
            if (a.notes && typeof a.notes === 'string' && a.notes.startsWith('{')) {
              parsedNotes = JSON.parse(a.notes);
            }
          } catch (e) {}

          mergedMap.set(a.id, {
            ...a,
            nurseCondition: local?.nurseCondition || parsedNotes?.nurseCondition || a.nurseCondition,
            nurseNotes: local?.nurseNotes || parsedNotes?.nurseNotes || a.nurseNotes,
            nurseVitals: local?.nurseVitals || parsedNotes?.nurseVitals || a.nurseVitals,
            nurseUpdatedAt: local?.nurseUpdatedAt || parsedNotes?.nurseUpdatedAt || a.nurseUpdatedAt,
            dischargeInitiatedAt: local?.dischargeInitiatedAt || a.dischargeInitiatedAt,
            dischargeDoctorId: local?.dischargeDoctorId || a.dischargeDoctorId,
            dischargeDoctorName: local?.dischargeDoctorName || a.dischargeDoctorName,
            dischargeSummary: local?.dischargeSummary || a.dischargeSummary,
            dischargeAdvice: local?.dischargeAdvice || a.dischargeAdvice,
            dischargePrescriptions: local?.dischargePrescriptions || a.dischargePrescriptions,
            billingStatus: local?.billingStatus || a.billingStatus,
            invoiceId: local?.invoiceId || a.invoiceId,
            finalBilledAmount: local?.finalBilledAmount || a.finalBilledAmount,
            finalPaidAmount: local?.finalPaidAmount || a.finalPaidAmount,
            finalDischargedBy: local?.finalDischargedBy || a.finalDischargedBy,
            finalDischargedRole: local?.finalDischargedRole || a.finalDischargedRole,
          });
        }
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentAdmissions.length || JSON.stringify(reconciled) !== JSON.stringify(currentAdmissions)) {
        localStorage.setItem(STORAGE_KEYS.ADMISSIONS, JSON.stringify(reconciled));
        updated = true;
      }
    }

    if (invoicesRes && invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value)) {
      const backendInvoices = invoicesRes.value;
      const currentInvoices = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
      const mapped: Invoice[] = backendInvoices.map((inv: any) => ({
        id: inv.id,
        hospitalId: inv.hospital || inv.hospital_id || 'HOSP-001',
        patientId: inv.patient || inv.patient_id,
        patientName: inv.patient_name || inv.patientName || 'Patient',
        patientPhone: inv.patient_phone || inv.patientPhone || '555-0100',
        issueDate: inv.issue_date || inv.issueDate || new Date().toISOString().split('T')[0],
        dueDate: inv.due_date || inv.dueDate || new Date().toISOString().split('T')[0],
        items: Array.isArray(inv.items) ? inv.items : [],
        subtotal: Number(inv.subtotal || inv.total_amount || inv.totalAmount || 0),
        taxRate: Number(inv.tax_rate || 5),
        taxAmount: Number(inv.tax_amount || 0),
        discount: Number(inv.discount || 0),
        totalAmount: Number(inv.total_amount || inv.totalAmount || 0),
        amountPaid: Number(inv.paid_amount || inv.amountPaid || 0),
        status: inv.status as any || 'Pending',
        paymentMethod: inv.payment_method || 'Cash',
        createdAt: inv.created_at || new Date().toISOString(),
      }));

      const mergedMap = new Map<string, Invoice>();
      for (const inv of currentInvoices) {
        if (inv && inv.id) mergedMap.set(inv.id, inv);
      }
      for (const inv of mapped) {
        if (inv && inv.id) mergedMap.set(inv.id, inv);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentInvoices.length || JSON.stringify(reconciled) !== JSON.stringify(currentInvoices)) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(reconciled));
        updated = true;
      }
    }

    if (labOrdersRes && labOrdersRes.status === 'fulfilled' && Array.isArray(labOrdersRes.value)) {
      const backendLabs = labOrdersRes.value;
      const currentLabs = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
      const mapped: LabOrder[] = backendLabs.map((l: any) => ({
        id: l.id,
        hospitalId: l.hospital || l.hospital_id || 'HOSP-001',
        patientId: l.patient || l.patient_id,
        patientName: l.patient_name || l.patientName || 'Patient',
        patientAge: Number(l.patient_age || l.patientAge || 35),
        patientGender: (l.patient_gender || l.patientGender || 'Male') as any,
        doctorId: l.doctor || l.doctor_id || 'DOC-001',
        doctorName: l.doctor_name || l.doctorName || 'Doctor',
        testId: l.test_id || l.testId || 'TEST-001',
        testName: l.test_name || l.testName || 'Routine Blood Test',
        category: l.category || 'General Pathology',
        orderDate: l.order_date || l.orderDate || new Date().toISOString().split('T')[0],
        completedDate: l.completed_date || l.completedDate,
        status: (l.status as any) || 'Ordered',
        sampleType: l.sample_type || 'Blood',
        fee: Number(l.fee || 250),
        results: l.results,
        normalRange: l.normal_range || l.normalRange,
      }));

      const mergedMap = new Map<string, LabOrder>();
      for (const lab of currentLabs) {
        if (lab && lab.id) mergedMap.set(lab.id, lab);
      }
      for (const lab of mapped) {
        if (lab && lab.id) mergedMap.set(lab.id, lab);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentLabs.length || JSON.stringify(reconciled) !== JSON.stringify(currentLabs)) {
        localStorage.setItem(STORAGE_KEYS.LAB_ORDERS, JSON.stringify(reconciled));
        updated = true;
      }
    }

    if (prescriptionsRes && prescriptionsRes.status === 'fulfilled' && Array.isArray(prescriptionsRes.value)) {
      const backendRx = prescriptionsRes.value;
      const currentRx = getStored<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions);
      const mapped: Prescription[] = backendRx.map((p: any) => ({
        id: p.id,
        hospitalId: p.hospital || p.hospital_id || 'HOSP-001',
        patientId: p.patient || p.patient_id,
        patientName: p.patient_name || p.patientName || 'Patient',
        doctorId: p.doctor || p.doctor_id || '',
        doctorName: p.doctor_name || p.doctorName || 'Doctor',
        doctorSpecialization: p.doctor_specialization || 'Specialist',
        date: p.date,
        diagnosis: p.notes || p.diagnosis || 'Clinical Consultation',
        medications: Array.isArray(p.medicines) ? p.medicines : (Array.isArray(p.medications) ? p.medications : []),
        status: p.status as any || 'Active',
        notes: p.notes,
      }));

      const mergedMap = new Map<string, Prescription>();
      for (const rx of currentRx) {
        if (rx && rx.id) mergedMap.set(rx.id, rx);
      }
      for (const rx of mapped) {
        if (rx && rx.id) {
          const local = mergedMap.get(rx.id);
          const isLocallyDispensed = local && (local.status === 'Dispensed' || Boolean(local.dispensedAt));
          if (isLocallyDispensed) {
            mergedMap.set(rx.id, {
              ...rx,
              ...local,
              status: 'Dispensed',
              dispensedAt: local.dispensedAt || new Date().toISOString(),
              dispensedBy: local.dispensedBy,
              dispensedInvoiceId: local.dispensedInvoiceId,
            });
          } else {
            mergedMap.set(rx.id, {
              ...(local || {}),
              ...rx,
              dispensedAt: local?.dispensedAt,
              dispensedBy: local?.dispensedBy,
              dispensedInvoiceId: local?.dispensedInvoiceId,
            });
          }
        }
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentRx.length || JSON.stringify(reconciled) !== JSON.stringify(currentRx)) {
        localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(reconciled));
        updated = true;
      }
    }

    if (driversRes && driversRes.status === 'fulfilled' && Array.isArray(driversRes.value)) {
      const backendDrivers = driversRes.value;
      const currentDrivers = getStored<AmbulanceDriver[]>(STORAGE_KEYS.AMBULANCE_DRIVERS, initialAmbulanceDrivers);
      const mapped: AmbulanceDriver[] = backendDrivers.map((d: any) => ({
        id: d.id,
        hospitalId: d.hospital || d.hospital_id || 'HOSP-001',
        hospitalName: d.hospital_name || d.hospitalName || 'City Hospital',
        name: d.name,
        email: d.email || `${d.id.toLowerCase()}@hospital.org`,
        phone: d.phone,
        licenseNumber: d.license_number || d.licenseNumber || 'DL-2026-001',
        licenseExpiry: d.license_expiry || '2028-12-31',
        assignedAmbulanceId: d.assigned_ambulance_id || d.assignedAmbulanceId,
        assignedAmbulanceReg: d.assigned_ambulance_reg || d.assignedAmbulanceReg,
        availabilityStatus: d.availability_status || d.availabilityStatus || 'On Duty & Available',
        status: (d.status as any) || 'active',
        completedTrips: Number(d.completed_trips || d.completedTrips || 0),
        emergencyExperienceYears: Number(d.emergency_experience_years || d.emergencyExperienceYears || 5),
      }));

      const mergedMap = new Map<string, AmbulanceDriver>();
      for (const drv of currentDrivers) {
        if (drv && drv.id) mergedMap.set(drv.id, drv);
      }
      for (const drv of mapped) {
        if (drv && drv.id) mergedMap.set(drv.id, drv);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentDrivers.length || JSON.stringify(reconciled) !== JSON.stringify(currentDrivers)) {
        localStorage.setItem(STORAGE_KEYS.AMBULANCE_DRIVERS, JSON.stringify(reconciled));
        updated = true;
      }
    }

    if (emergenciesRes && emergenciesRes.status === 'fulfilled' && Array.isArray(emergenciesRes.value)) {
      const backendEmergencies = emergenciesRes.value;
      const currentEmergencies = getStored<EmergencyRequest[]>(STORAGE_KEYS.EMERGENCY_REQUESTS, initialEmergencyRequests);
      const mapped: EmergencyRequest[] = backendEmergencies.map((e: any) => ({
        id: e.id,
        hospitalId: e.hospital || e.hospital_id || 'HOSP-001',
        hospitalName: e.hospital_name || e.hospitalName || 'City Hospital',
        patientName: e.patient_name || e.patientName || 'Emergency Patient',
        patientPhone: e.patient_phone || e.patientPhone || e.caller_phone || '555-0911',
        callerPhone: e.caller_phone || e.callerPhone || e.patient_phone || '555-0911',
        pickupLocation: e.pickup_location || e.pickupLocation || '123 Main St',
        destinationHospital: e.destination_hospital || e.destinationHospital || e.destination || 'Hospital Emergency',
        destination: e.destination || e.destination_hospital || 'Hospital Emergency',
        emergencyType: e.emergency_type || e.emergencyType || 'General Emergency Transfer',
        priority: (e.priority as any) || 'High',
        requestDate: e.request_date || (e.created_at ? e.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        requestTime: e.request_time || '10:00 AM',
        requestedAt: e.created_at || new Date().toISOString(),
        status: (e.status as any) || 'Requested',
        assignedDriverId: e.assigned_driver_id || e.assigned_driver || e.assignedDriverId,
        notes: e.notes || e.chief_complaint || '',
      }));

      const mergedMap = new Map<string, EmergencyRequest>();
      for (const emr of currentEmergencies) {
        if (emr && emr.id) mergedMap.set(emr.id, emr);
      }
      for (const emr of mapped) {
        if (emr && emr.id) mergedMap.set(emr.id, emr);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentEmergencies.length || JSON.stringify(reconciled) !== JSON.stringify(currentEmergencies)) {
        localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(reconciled));
        updated = true;
      }
    }

    if (departmentsRes && departmentsRes.status === 'fulfilled' && Array.isArray(departmentsRes.value)) {
      const backendDepts = departmentsRes.value;
      const currentDepts = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
      const mapped: Department[] = backendDepts.map((d: any) => ({
        id: d.id,
        hospitalId: d.hospital || d.hospital_id || 'HOSP-001',
        name: d.name,
        code: d.code,
        headDoctorId: d.head_doctor_id || d.headDoctorId,
        headDoctorName: d.head_doctor_name || d.headDoctorName,
        description: d.description || '',
        phoneExtension: d.phone_extension || d.phoneExtension || '',
        status: d.status || 'active',
      }));

      const mergedMap = new Map<string, Department>();
      for (const d of currentDepts) {
        if (d && d.id) mergedMap.set(d.id, d);
      }
      for (const d of mapped) {
        if (d && d.id) mergedMap.set(d.id, d);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentDepts.length || JSON.stringify(reconciled) !== JSON.stringify(currentDepts)) {
        localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(reconciled));
        updated = true;
      }

      if (backendDepts.length > 0) {
        // Already merged above
      } else {
        const localDepts = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, []);
        if (localDepts.length > 0) {
          for (const d of localDepts) {
            fetch(`${API_BASE_URL}/departments/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: d.id,
                hospital: d.hospitalId || 'HOSP-001',
                name: d.name,
                code: d.code,
                head_doctor_id: d.headDoctorId || null,
                head_doctor_name: d.headDoctorName || null,
                description: d.description || '',
                phone_extension: d.phoneExtension || '',
                status: d.status || 'active',
              }),
            }).catch(() => {});
          }
        }
      }
    }

    if (opdRoomsRes && opdRoomsRes.status === 'fulfilled' && Array.isArray(opdRoomsRes.value)) {
      const backendRooms = opdRoomsRes.value;
      const currentRooms = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
      const mapped: OPDRoom[] = backendRooms.map((r: any) => ({
        id: r.id,
        hospitalId: r.hospital || r.hospital_id || 'HOSP-001',
        name: r.name,
        code: r.code,
        departmentId: r.department_id || r.departmentId || '',
        departmentName: r.department_name || r.departmentName || '',
        location: r.location || '',
        status: r.status as any || 'Available',
        description: r.description || '',
        assignedDoctorId: r.assigned_doctor_id || r.assignedDoctorId,
        assignedDoctorName: r.assigned_doctor_name || r.assignedDoctorName,
      }));

      const mergedMap = new Map<string, OPDRoom>();
      for (const r of currentRooms) {
        if (r && r.id) mergedMap.set(r.id, r);
      }
      for (const r of mapped) {
        if (r && r.id) mergedMap.set(r.id, r);
      }
      const reconciled = Array.from(mergedMap.values());
      if (reconciled.length !== currentRooms.length || JSON.stringify(reconciled) !== JSON.stringify(currentRooms)) {
        localStorage.setItem(STORAGE_KEYS.OPD_ROOMS, JSON.stringify(reconciled));
        updated = true;
      }

      if (backendRooms.length > 0) {
        // Already merged above
      } else {
        const localRooms = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, []);
        if (localRooms.length > 0) {
          for (const r of localRooms) {
            fetch(`${API_BASE_URL}/opd-rooms/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: r.id,
                hospital: r.hospitalId || 'HOSP-001',
                name: r.name,
                code: r.code,
                department_id: r.departmentId,
                department_name: r.departmentName,
                location: r.location,
                status: r.status,
                description: r.description || '',
                assigned_doctor_id: r.assignedDoctorId || null,
                assigned_doctor_name: r.assignedDoctorName || null,
              }),
            }).catch(() => {});
          }
        }
      }
    }

    if (wardsRes && wardsRes.status === 'fulfilled' && Array.isArray(wardsRes.value) && wardsRes.value.length > 0) {
      const mapped: Ward[] = wardsRes.value.map((w: any) => ({
        id: w.id,
        hospitalId: w.hospital || w.hospital_id || 'hosp-1',
        name: w.name,
        wardType: w.ward_type || w.wardType || 'General Ward',
        floor: w.floor || '1st Floor',
        departmentName: w.department_name || w.departmentName || 'General Medicine',
        description: w.description || '',
        dailyRate: Number(w.daily_rate || w.dailyRate || 1000),
      }));
      localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(mapped));
      updated = true;
    }

    if (bedsRes && bedsRes.status === 'fulfilled' && Array.isArray(bedsRes.value) && bedsRes.value.length > 0) {
      const currentBeds = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
      const currentAdmissions = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
      const activeAdms = currentAdmissions.filter((a) => a.status === 'Active' || (a.status as string) === 'Admitted');

      const mapped: Bed[] = bedsRes.value.map((b: any) => ({
        id: b.id,
        hospitalId: b.hospital || b.hospital_id || 'hosp-1',
        wardId: b.ward_id || b.wardId,
        wardName: b.ward_name || b.wardName,
        bedNumber: b.bed_number || b.bedNumber,
        wardType: b.ward_type || b.wardType || 'General Ward',
        floor: b.floor || '1st Floor',
        status: (b.status as any) || 'Available',
        currentPatientId: b.current_patient_id || b.currentPatientId,
        currentPatientName: b.current_patient_name || b.currentPatientName,
        dailyRate: Number(b.daily_rate || b.dailyRate || 1000),
        notes: b.notes || '',
      }));

      const mergedMap = new Map<string, Bed>();
      for (const b of currentBeds) {
        if (b && b.id) mergedMap.set(b.id, b);
      }
      for (const b of mapped) {
        if (b && b.id) {
          const local = mergedMap.get(b.id);
          mergedMap.set(b.id, {
            ...b,
            status: local?.status === 'Occupied' ? 'Occupied' : b.status,
            currentPatientId: local?.currentPatientId || b.currentPatientId,
            currentPatientName: local?.currentPatientName || b.currentPatientName,
          });
        }
      }

      // Reconcile with active admissions
      const reconciled = Array.from(mergedMap.values());
      for (const b of reconciled) {
        if (!b.bedNumber) continue;
        const normNum = b.bedNumber.trim().toLowerCase();
        const activeAdm = activeAdms.find(
          (a) => a.bedNumber && a.bedNumber.trim().toLowerCase() === normNum
        );
        if (activeAdm) {
          b.status = 'Occupied';
          b.currentPatientId = activeAdm.patientId;
          b.currentPatientName = activeAdm.patientName;
        }
      }

      localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(reconciled));
      updated = true;
    }

    if (staffRes && staffRes.status === 'fulfilled' && Array.isArray(staffRes.value) && staffRes.value.length > 0) {
      const mapped: Staff[] = staffRes.value.map((s: any) => ({
        id: s.id,
        hospitalId: s.hospital || s.hospital_id || 'hosp-1',
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        role: s.role as any || 'Staff',
        systemRole: (s.system_role || s.systemRole || 'staff') as any,
        department: s.department || 'General',
        shift: (s.shift || 'Morning') as any,
        joiningDate: s.joining_date || s.joiningDate || new Date().toISOString().split('T')[0],
        status: (s.status || 'active') as any,
        avatarUrl: s.avatar_url || s.avatarUrl,
      }));
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(mapped));
      updated = true;
    }

    if (activityLogsRes && activityLogsRes.status === 'fulfilled' && Array.isArray(activityLogsRes.value)) {
      if (activityLogsRes.value.length > 0) {
        const mapped: ActivityLog[] = activityLogsRes.value.map((a: any) => ({
          id: a.id,
          hospitalId: a.hospital || a.hospital_id,
          actorName: a.actor_name || a.actorName || 'Staff',
          actorRole: a.actor_role || a.actorRole || 'Hospital User',
          action: a.action,
          target: a.target || '',
          type: (a.type || 'system') as any,
          timestamp: a.timestamp || new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(mapped));
        updated = true;
      }
    }

    if (salesLeadsRes && salesLeadsRes.status === 'fulfilled' && Array.isArray(salesLeadsRes.value) && salesLeadsRes.value.length > 0) {
      const mapped: SalesLead[] = salesLeadsRes.value.map((l: any) => ({
        id: l.id,
        hospitalName: l.hospital_name || l.hospitalName,
        contactPerson: l.contact_person || l.contactPerson,
        designation: l.designation,
        phone: l.phone,
        email: l.email,
        city: l.city,
        state: l.state,
        country: l.country,
        hospitalType: l.hospital_type || l.hospitalType || 'General',
        bedCount: l.bed_count !== undefined ? Number(l.bed_count) : (l.bedCount || 50),
        leadSource: l.lead_source || l.leadSource || 'Direct',
        interestedPlan: l.interested_plan || l.interestedPlan || 'basic',
        status: l.status as any || 'New',
        assignedSalesExecutiveId: l.assigned_sales_executive_id || l.assignedSalesExecutiveId || '',
        assignedSalesExecutiveName: l.assigned_sales_executive_name || l.assignedSalesExecutiveName || '',
        nextFollowUpDate: l.next_follow_up_date || l.nextFollowUpDate,
        expectedDecisionDate: l.expected_decision_date || l.expectedDecisionDate,
        notes: l.notes || '',
        createdAt: l.created_at || l.createdAt || new Date().toISOString(),
        updatedAt: l.updated_at || l.updatedAt || new Date().toISOString(),
      }));
      localStorage.setItem(STORAGE_KEYS.SALES_LEADS, JSON.stringify(mapped));
      updated = true;
    }

    if (doctorSchedulesRes && doctorSchedulesRes.status === 'fulfilled' && Array.isArray(doctorSchedulesRes.value) && doctorSchedulesRes.value.length > 0) {
      const mapped: DoctorSchedule[] = doctorSchedulesRes.value.map((s: any) => ({
        id: s.id,
        hospitalId: s.hospital || s.hospital_id || 'hosp-1',
        doctorId: s.doctor || s.doctor_id,
        doctorName: s.doctor_name || s.doctorName || 'Doctor',
        departmentId: s.department_id || s.departmentId || '',
        departmentName: s.department_name || s.departmentName || '',
        opdRoomId: s.opd_room_id || s.opdRoomId || '',
        opdRoomName: s.opd_room_name || s.opdRoomName || '',
        workingDays: Array.isArray(s.working_days) ? s.working_days : (Array.isArray(s.workingDays) ? s.workingDays : []),
        consultationStartTime: s.consultation_start_time || s.consultationStartTime || '09:00 AM',
        consultationEndTime: s.consultation_end_time || s.consultationEndTime || '05:00 PM',
        slotDurationMinutes: Number(s.slot_duration_minutes || s.slotDurationMinutes || 30),
        breaks: Array.isArray(s.breaks) ? s.breaks : [],
        effectiveStartDate: s.effective_start_date || s.effectiveStartDate || '2026-01-01',
        effectiveEndDate: s.effective_end_date || s.effectiveEndDate,
        isActive: s.is_active !== undefined ? Boolean(s.is_active) : (s.isActive !== undefined ? Boolean(s.isActive) : true),
        notes: s.notes || '',
        createdAt: s.created_at || new Date().toISOString().split('T')[0],
      }));
      localStorage.setItem(STORAGE_KEYS.DOCTOR_SCHEDULES, JSON.stringify(mapped));
      updated = true;
    }

    if (doctorUnavailabilityRes && doctorUnavailabilityRes.status === 'fulfilled' && Array.isArray(doctorUnavailabilityRes.value) && doctorUnavailabilityRes.value.length > 0) {
      const mapped: DoctorUnavailablePeriod[] = doctorUnavailabilityRes.value.map((u: any) => ({
        id: u.id,
        hospitalId: u.hospital || u.hospital_id || 'hosp-1',
        doctorId: u.doctor || u.doctor_id,
        doctorName: u.doctor_name || u.doctorName || 'Doctor',
        type: (u.period_type || u.type || 'Leave') as any,
        title: u.title,
        startDate: u.start_date || u.startDate,
        endDate: u.end_date || u.endDate,
        startTime: u.start_time || u.startTime,
        endTime: u.end_time || u.endTime,
        isAllDay: u.is_all_day !== undefined ? Boolean(u.is_all_day) : (u.isAllDay !== undefined ? Boolean(u.isAllDay) : true),
        reason: u.reason || '',
        createdAt: u.created_at || new Date().toISOString().split('T')[0],
      }));
      localStorage.setItem(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, JSON.stringify(mapped));
      updated = true;
    }

    if (appointmentSettingsRes && appointmentSettingsRes.status === 'fulfilled') {
      const val = appointmentSettingsRes.value;
      const settingsArr = Array.isArray(val) ? val : (val ? [val] : []);
      if (settingsArr.length > 0) {
        const mapped: AppointmentSettings[] = settingsArr.map((set: any) => ({
          id: set.id,
          hospitalId: set.hospital || set.hospital_id || 'hosp-1',
          maxAdvanceBookingDays: Number(set.max_advance_booking_days || set.maxAdvanceBookingDays || 30),
          minAdvanceBookingHours: Number(set.min_advance_booking_hours || set.minAdvanceBookingHours || 2),
          cancellationDeadlineHours: Number(set.cancellation_deadline_hours || set.cancellationDeadlineHours || 4),
          reschedulingDeadlineHours: Number(set.rescheduling_deadline_hours || set.reschedulingDeadlineHours || 4),
          appointmentBufferMinutes: Number(set.appointment_buffer_minutes || set.appointmentBufferMinutes || 5),
          allowSameDayBooking: set.allow_same_day_booking !== undefined ? Boolean(set.allow_same_day_booking) : true,
          updatedAt: set.updated_at || new Date().toISOString().split('T')[0],
        }));
        localStorage.setItem(STORAGE_KEYS.APPOINTMENT_SETTINGS, JSON.stringify(mapped));
        updated = true;
      }
    }

    if (updated) {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }
  } catch (err) {
    console.warn('Django sync notice:', err);
  }
}

if (typeof window !== 'undefined') {
  syncWithDjangoBackend();
}

export const MockStorage = {
  syncWithBackend() {
    return syncWithDjangoBackend();
  },

  logActivity(action: string, target: string, type: ActivityLog['type'], actorName = 'Admin', actorRole = 'Platform Admin', hospitalId?: string) {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actorName,
      actorRole,
      action,
      target,
      type,
      hospitalId,
    };
    logs.unshift(newLog);
    setStored(STORAGE_KEYS.ACTIVITY_LOGS, logs.slice(0, 50));

    try {
      fetch(`${API_BASE_URL}/activity-logs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newLog.id,
          hospital: newLog.hospitalId || null,
          actor_name: newLog.actorName,
          actor_role: newLog.actorRole,
          action: newLog.action,
          target: newLog.target,
          type: newLog.type,
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  getActivityLogs(): ActivityLog[] {
    return getStored(STORAGE_KEYS.ACTIVITY_LOGS, initialActivityLogs);
  },

  // Auth User
  getAuthUser(): User | null {
    return getStored<User | null>(STORAGE_KEYS.AUTH_USER, null);
  },

  setAuthUser(user: User | null): void {
    setStored(STORAGE_KEYS.AUTH_USER, user);
  },

  // Users
  getUsers(): User[] {
    const deletedHospIds = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
    const deletedUserIds = getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []);
    const HARDCODED_MOCK_USER_IDS = [
      'USR-HOSP-02', 'USR-HOSP-03', 'USR-HOSP-04', 'USR-HOSP-05',
      'USR-DOC-01', 'USR-PAT-01', 'USR-PAT-02', 'USR-PAT-03', 'USR-PAT-04', 'USR-PAT-05', 'USR-DRV-01'
    ];
    let users = getStored<User[]>(STORAGE_KEYS.USERS, initialUsers);

    // Filter out users belonging to deleted hospitals or explicitly deleted users
    users = users.filter((u) => {
      if (deletedUserIds.includes(u.id)) {
        return false;
      }
      if (HARDCODED_MOCK_USER_IDS.includes(u.id)) {
        return false;
      }
      if (u.hospitalId && deletedHospIds.includes(u.hospitalId)) {
        return false;
      }
      // Purge legacy hardcoded mock hospital admin
      if (u.id === 'USR-HOSP-01' || (u.name === 'Dr. Arthur Vance' && u.role === 'hospital_admin')) {
        return false;
      }
      // Purge artificial USR-HAD-* placeholder admins if they were generated for initial mock hospitals
      if (u.id.startsWith('USR-HAD-HOSP-00')) {
        return false;
      }
      return true;
    });

    return users;
  },

  matchHospitalId(userHospId?: string, targetHospId?: string): boolean {
    if (!userHospId || !targetHospId) return false;
    if (targetHospId === 'all' || userHospId === 'all') return true;
    const u = userHospId.trim().toLowerCase();
    const t = targetHospId.trim().toLowerCase();
    if (u === t) return true;

    // Direct prefix normalization: HOSP-001 <-> HOSP-1 <-> hosp-1
    const normU = u.replace(/^hosp-0*/i, 'hosp-');
    const normT = t.replace(/^hosp-0*/i, 'hosp-');
    if (normU === normT) return true;

    // Check known aliases
    const aliases: Record<string, string[]> = {
      'hosp-001': ['hosp-1', 'hosp-001', 'cmc', 'city-medical-center', 'city medical center'],
      'hosp-1': ['hosp-1', 'hosp-001', 'cmc', 'city-medical-center', 'city medical center'],
      'hosp-abc-chn': ['hosp-abc', 'hosp-abc-chn', 'chennai', 'chennai-general', 'apollo'],
      'hosp-abc': ['hosp-abc', 'hosp-abc-chn', 'chennai', 'chennai-general', 'apollo'],
    };
    if (aliases[u]?.includes(t) || aliases[t]?.includes(u)) return true;

    // Check with full hospital objects (slug, branchCode, id)
    const hospitals = this.getHospitals();
    const targetHosp = hospitals.find(
      (h) =>
        h.id.toLowerCase() === t ||
        (h.slug && h.slug.toLowerCase() === t) ||
        (h.branchCode && h.branchCode.toLowerCase() === t)
    );
    if (targetHosp) {
      if (targetHosp.id.toLowerCase() === u) return true;
      if (targetHosp.slug && targetHosp.slug.toLowerCase() === u) return true;
      if (targetHosp.branchCode && targetHosp.branchCode.toLowerCase() === u) return true;
    }
    const userHosp = hospitals.find(
      (h) =>
        h.id.toLowerCase() === u ||
        (h.slug && h.slug.toLowerCase() === u) ||
        (h.branchCode && h.branchCode.toLowerCase() === u)
    );
    if (userHosp) {
      if (userHosp.id.toLowerCase() === t) return true;
      if (userHosp.slug && userHosp.slug.toLowerCase() === t) return true;
      if (userHosp.branchCode && userHosp.branchCode.toLowerCase() === t) return true;
    }
    return false;
  },

  findUserForAuth(
    email: string,
    hospitalId?: string,
    password?: string
  ): { user: User | null; error?: string; multipleAccounts?: User[] } {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const users = this.getUsers();

    if (hospitalId) {
      // Must ONLY search users in the specified hospital context (or compatible alias)
      const hospitalUser = users.find(
        (u) => this.matchHospitalId(u.hospitalId, hospitalId) && (u.email || '').trim().toLowerCase() === normalizedEmail
      );
      if (!hospitalUser) {
        // Fallback: If user has a single account matching email and password, check if it's a superadmin
        const anyMatchingUser = users.find(
          (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
        );
        if (anyMatchingUser && (anyMatchingUser.role === 'super_admin' || anyMatchingUser.role === 'super_admin_manager')) {
          if (password && anyMatchingUser.password && anyMatchingUser.password !== password) {
            return { user: null, error: 'Invalid credentials. Incorrect password.' };
          }
          return { user: anyMatchingUser };
        }
        return { user: null, error: 'Invalid credentials. No account found for this hospital.' };
      }
      if (password && hospitalUser.password && hospitalUser.password !== password) {
        return { user: null, error: 'Invalid credentials. Incorrect password.' };
      }
      return { user: hospitalUser };
    } else {
      // Direct login: look up account by normalized email
      const matchingUsers = users.filter(
        (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
      );
      if (matchingUsers.length === 0) {
        return { user: null, error: 'Invalid credentials or account not found.' };
      }
      const validUsers = password
        ? matchingUsers.filter((u) => !u.password || u.password === password)
        : matchingUsers;

      if (validUsers.length === 0) {
        return { user: null, error: 'Invalid credentials. Incorrect password.' };
      }

      if (validUsers.length > 1) {
        return { user: null, multipleAccounts: validUsers };
      }
      return { user: validUsers[0] };
    }
  },

  saveUser(user: User): { success: boolean; error?: string } {
    const normalizedEmail = (user.email || '').trim().toLowerCase();
    const deletedUserIds = getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []);
    if (deletedUserIds.includes(user.id)) {
      setStored(
        STORAGE_KEYS.DELETED_USERS,
        deletedUserIds.filter((d) => d !== user.id)
      );
    }

    const users = this.getUsers();

    if (user.role === 'patient') {
      // Option A: Hospital-Scoped Patient Accounts (Multi-Tenant Isolation)
      // Patient cannot have duplicate email in the SAME hospital, but can have accounts in different hospitals
      const duplicateInSameHospital = users.find(
        (u) =>
          u.role === 'patient' &&
          u.hospitalId === user.hospitalId &&
          (u.email || '').trim().toLowerCase() === normalizedEmail &&
          u.id !== user.id
      );
      if (duplicateInSameHospital) {
        const scope = user.hospitalName || user.hospitalId || 'this hospital';
        return {
          success: false,
          error: `Duplicate Email: A patient account with email "${user.email.trim()}" already exists in ${scope}.`,
        };
      }
    } else {
      // Enforce global uniqueness: staff, doctors, and platform accounts cannot have duplicate emails anywhere in system
      const existingUser = users.find(
        (u) => (u.email || '').trim().toLowerCase() === normalizedEmail && u.id !== user.id
      );
      if (existingUser) {
        const scope = existingUser.hospitalName || existingUser.hospitalId || 'Platform';
        return {
          success: false,
          error: `Duplicate Email: An account with email "${user.email.trim()}" already exists in the system (associated with ${scope}).`,
        };
      }
    }

    // Find existing account to update
    const idx = users.findIndex(
      (u) =>
        u.id === user.id ||
        (user.role === 'patient'
          ? u.role === 'patient' && u.hospitalId === user.hospitalId && (u.email || '').trim().toLowerCase() === normalizedEmail
          : (u.email || '').trim().toLowerCase() === normalizedEmail)
    );

    const updatedUser = {
      ...user,
      email: user.email ? user.email.trim() : user.email,
    };

    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updatedUser };
    } else {
      users.unshift(updatedUser);
    }
    setStored(STORAGE_KEYS.USERS, users);
    this.logActivity(idx >= 0 ? 'Updated User Account' : 'Created User Account', `${user.name} (${user.role})`, 'system');

    // Asynchronously synchronize user account with Django backend
    try {
      const hospitalKey = user.hospitalId || 'HOSP-001';
      const payload = {
        id: user.id,
        name: user.name,
        email: (user.email || '').trim().toLowerCase(),
        password: user.password || 'Staff@1234',
        role: user.role,
        portal: user.portal || 'hospital',
        hospital: hospitalKey || null,
        hospital_name: user.hospitalName || null,
        status: user.status || 'active',
      };
      fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {}

    window.dispatchEvent(new Event('pulse_storage_updated'));
    return { success: true };
  },

  deleteUser(userId: string): void {
    const deletedUserIds = getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []);
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === userId);

    if (!deletedUserIds.includes(userId)) {
      deletedUserIds.push(userId);
    }
    setStored(STORAGE_KEYS.DELETED_USERS, deletedUserIds);

    const remaining = users.filter((u) => u.id !== userId);
    setStored(STORAGE_KEYS.USERS, remaining);

    if (targetUser) {
      this.logActivity('Deleted User Account', `${targetUser.name} (${targetUser.role})`, 'system');
    }

    // Call backend DELETE endpoint if available
    try {
      fetch(`${API_BASE_URL}/users/${userId}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    window.dispatchEvent(new Event('pulse_storage_updated'));
  },

  purgeMockAdmins(): void {
    const deletedHospIds = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
    const deletedUserIds = getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []);
    let users = getStored<User[]>(STORAGE_KEYS.USERS, initialUsers);

    users = users.filter((u) => {
      if (deletedUserIds.includes(u.id)) return false;
      if (u.hospitalId && deletedHospIds.includes(u.hospitalId)) return false;
      if (u.id === 'USR-HOSP-01' || u.name === 'Dr. Arthur Vance') return false;
      if (u.id.startsWith('USR-HAD-HOSP-00')) return false;
      return true;
    });

    setStored(STORAGE_KEYS.USERS, users);
    window.dispatchEvent(new Event('pulse_storage_updated'));
  },

  // Hospitals
  getHospitals(): Hospital[] {
    const deleted = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
    const stored = getStored<Hospital[]>(STORAGE_KEYS.HOSPITALS, initialHospitals);
    return stored.filter((h) => !deleted.includes(h.id));
  },

  getHospitalById(id: string): Hospital | undefined {
    return this.getHospitals().find((h) => h.id === id || this.matchHospitalId(h.id, id));
  },

  saveHospital(hospital: Hospital): void {
    // If it was previously in deleted list, remove from deleted list
    const deleted = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
    if (deleted.includes(hospital.id)) {
      setStored(
        STORAGE_KEYS.DELETED_HOSPITALS,
        deleted.filter((d) => d !== hospital.id)
      );
    }

    const plan = this.getPlanByTier(hospital.planTier || 'trial');
    const targetTier = hospital.planTier || 'trial';
    const computedBeds =
      targetTier === 'basic'
        ? 0
        : hospital.totalBeds !== undefined && hospital.totalBeds > 0 && hospital.totalBeds !== 20
        ? hospital.totalBeds
        : (plan?.maxBeds ?? (targetTier === 'standard' ? 120 : targetTier === 'enterprise' ? 500 : 20));
    const computedDoctors =
      hospital.totalDoctors !== undefined && hospital.totalDoctors > 0 && hospital.totalDoctors !== 3
        ? hospital.totalDoctors
        : (plan?.maxDoctors ?? (targetTier === 'standard' ? 35 : targetTier === 'enterprise' ? 200 : 10));

    const photo = hospital.logoUrl || hospital.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80';
    const sanitizedHospital: Hospital = {
      ...hospital,
      planTier: targetTier,
      totalBeds: computedBeds,
      totalDoctors: computedDoctors,
      logoUrl: photo,
      image: photo,
    };
    const hospitals = this.getHospitals();
    const idx = hospitals.findIndex((h) => h.id === sanitizedHospital.id);
    if (idx >= 0) {
      hospitals[idx] = sanitizedHospital;
    } else {
      hospitals.unshift(sanitizedHospital);
      // Automatically provision a default website entry for newly onboarded hospital
      const websites = this.getWebsites();
      const slug = sanitizedHospital.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newWeb: HospitalWebsite = {
        id: `WEB-${hospital.id}`,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        subdomain: `${slug}.pulsecorehealth.com`,
        customDomain: `www.${slug}.org`,
        domainStatus: 'connected',
        status: 'published',
        published: true,
        templateId: 'premium-healthcare',
        theme: 'Modern Teal',
        primaryColor: '#0d9488',
        secondaryColor: '#0f766e',
        heroTitle: `Welcome to ${hospital.name}`,
        heroDescription: `Leading healthcare innovation and compassionate patient care in ${hospital.city}.`,
        lastDeployedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        monthlyVisitors: 120,
        onlineBookingEnabled: true,
        emergencyBannerEnabled: true,
      };
      websites.unshift(newWeb);
      setStored(STORAGE_KEYS.WEBSITES, websites);

      // Automatically provision subscription for newly onboarded hospital
      const subscriptions = this.getSubscriptions();
      const plan = this.getPlanByTier(sanitizedHospital.planTier || 'trial');
      const isTrial = (sanitizedHospital.planTier || 'trial') === 'trial';
      const trialDays = this.getTrialDays();
      const trialSub: HospitalSubscription = {
        id: `SUB-${hospital.id}`,
        hospitalId: hospital.id,
        planTier: (sanitizedHospital.planTier || 'trial') as SubscriptionPlanTier,
        planName: plan?.name || (isTrial ? `${trialDays}-Day Free Trial` : 'Starter Clinic'),
        status: isTrial ? 'trialing' : 'active',
        interval: 'monthly',
        amount: isTrial ? 0 : plan?.priceMonthly || 4999,
        startDate: new Date().toISOString().split('T')[0],
        activatedDate: new Date().toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + (isTrial ? trialDays : 30) * 86400000).toISOString().split('T')[0],
        paymentMethod: isTrial ? `${trialDays}-Day Trial License` : 'UPI QR Code',
        autoRenew: !isTrial,
      };
      subscriptions.unshift(trialSub);
      setStored(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
    }

    // Always guarantee Hospital Admin User Credentials are created / synchronized
    if (sanitizedHospital.adminEmail || sanitizedHospital.adminName) {
      const slug = sanitizedHospital.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const adminEmail = sanitizedHospital.adminEmail || `admin@${slug}.com`;
      const users = this.getUsers();
      const userIdx = users.findIndex(
        (u) =>
          u.id === `USR-HAD-${sanitizedHospital.id}` ||
          (u.hospitalId === sanitizedHospital.id && u.role === 'hospital_admin') ||
          (u.email && u.email.toLowerCase() === adminEmail.toLowerCase())
      );

      // Un-delete if this admin was previously in the deleted set
      const deletedUserIds = getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []);
      if (deletedUserIds.includes(`USR-HAD-${sanitizedHospital.id}`) || deletedUserIds.includes(adminEmail.toLowerCase())) {
        setStored(
          STORAGE_KEYS.DELETED_USERS,
          deletedUserIds.filter((d) => d !== `USR-HAD-${sanitizedHospital.id}` && d !== adminEmail.toLowerCase())
        );
      }

      if (userIdx >= 0) {
        users[userIdx] = {
          ...users[userIdx],
          email: adminEmail,
          name: sanitizedHospital.adminName || users[userIdx].name || `${sanitizedHospital.name} Admin`,
          role: 'hospital_admin',
          portal: 'hospital',
          hospitalId: sanitizedHospital.id,
          hospitalName: sanitizedHospital.name,
          phone: sanitizedHospital.adminPhone || sanitizedHospital.phone || users[userIdx].phone,
          avatar: sanitizedHospital.logoUrl || users[userIdx].avatar,
          status: 'active',
        };
      } else {
        const newUser: User = {
          id: `USR-HAD-${sanitizedHospital.id}`,
          email: adminEmail,
          name: sanitizedHospital.adminName || `${sanitizedHospital.name} Admin`,
          role: 'hospital_admin',
          portal: 'hospital',
          hospitalId: sanitizedHospital.id,
          hospitalName: sanitizedHospital.name,
          avatar: sanitizedHospital.logoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          department: 'Hospital Administration',
          phone: sanitizedHospital.adminPhone || sanitizedHospital.phone,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        };
        users.unshift(newUser);
      }
      setStored(STORAGE_KEYS.USERS, users);
    }
    setStored(STORAGE_KEYS.HOSPITALS, hospitals);
    this.logActivity(idx >= 0 ? 'Updated Hospital Record' : 'Registered New Hospital & Generated Credentials (Trial Plan)', sanitizedHospital.name, 'hospital');

    try {
      const backendPayload = {
        id: sanitizedHospital.id,
        name: sanitizedHospital.name,
        slug: sanitizedHospital.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        city: sanitizedHospital.city || 'City',
        address: sanitizedHospital.address || 'Address',
        phone: sanitizedHospital.phone || '',
        email: sanitizedHospital.email || '',
        status: sanitizedHospital.status === 'active' ? 'Active' : sanitizedHospital.status,
        plan: sanitizedHospital.planTier || 'Standard',
        beds_count: sanitizedHospital.totalBeds,
        doctors_count: sanitizedHospital.totalDoctors,
        image: sanitizedHospital.logoUrl || sanitizedHospital.image,
      };
      fetch(`${API_BASE_URL}/hospitals/${sanitizedHospital.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      }).then((res) => {
        if (!res.ok) {
          fetch(`${API_BASE_URL}/hospitals/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendPayload),
          }).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {}
  },

  updateHospitalStatus(id: string, status: Hospital['status']): void {
    const hospitals = this.getHospitals();
    const hosp = hospitals.find((h) => h.id === id);
    if (hosp) {
      hosp.status = status;
      setStored(STORAGE_KEYS.HOSPITALS, hospitals);
      this.logActivity(`Changed Hospital Status to ${status.toUpperCase()}`, hosp.name, 'hospital');
    }
  },

  deleteHospital(id: string): void {
    const hosp = this.getHospitalById(id);
    const deleted = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
    if (!deleted.includes(id)) {
      deleted.push(id);
      setStored(STORAGE_KEYS.DELETED_HOSPITALS, deleted);
    }

    const hospitals = this.getHospitals().filter((h) => h.id !== id);
    setStored(STORAGE_KEYS.HOSPITALS, hospitals);

    // Cascade deletion of website
    this.deleteWebsite(id);

    // Cascade deletion of subscriptions
    const subscriptions = this.getSubscriptions().filter((s) => s.hospitalId !== id && s.id !== `SUB-${id}`);
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);

    // Cascade deletion of hospital staff / users
    const users = this.getUsers().filter((u) => u.hospitalId !== id);
    setStored(STORAGE_KEYS.USERS, users);

    // Cascade deletion of appointments, admissions, doctors, patients for this hospital
    const appointments = this.getAppointments().filter((a) => a.hospitalId !== id);
    setStored(STORAGE_KEYS.APPOINTMENTS, appointments);

    const admissions = this.getAdmissions().filter((a) => a.hospitalId !== id);
    setStored(STORAGE_KEYS.ADMISSIONS, admissions);

    const doctors = this.getDoctors().filter((d) => d.hospitalId !== id);
    setStored(STORAGE_KEYS.DOCTORS, doctors);

    const patients = this.getPatients().filter((p) => p.hospitalId !== id);
    setStored(STORAGE_KEYS.PATIENTS, patients);

    if (hosp) {
      this.logActivity('Deleted Hospital Workspace', hosp.name, 'hospital');
    }

    // Send HTTP DELETE to Django Backend
    try {
      fetch(`${API_BASE_URL}/hospitals/${id}/`, { method: 'DELETE' }).catch(() => {});
      fetch(`${API_BASE_URL}/websites/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  // Plans & Subscriptions
  getTrialDays(): number {
    const settings = this.getPlatformSettings();
    const plans = getStored<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, initialPlans);
    const trialPlan = plans.find((p) => p.tier === 'trial');
    return trialPlan?.trialDays || settings.allowTrialDays || 14;
  },

  getPlans(): SubscriptionPlan[] {
    let plans = getStored<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, initialPlans);

    if (!Array.isArray(plans) || plans.length === 0) {
      plans = initialPlans;
    }

    const merged = initialPlans.map((ip) => {
      const stored = plans.find((p) => p.id === ip.id);
      return stored ? { ...ip, ...stored } : ip;
    });

    plans.forEach((sp) => {
      if (!merged.some((m) => m.id === sp.id)) {
        merged.push(sp);
      }
    });

    const trialDays = this.getTrialDays();
    return merged.map((p) => {
      if (p.tier === 'trial') {
        const days = p.trialDays || trialDays;
        return {
          ...p,
          trialDays: days,
          name: `${days}-Day Free Trial`,
          tagline: `Zero-cost ${days}-day full platform trial provisioned automatically on hospital registration.`,
          features: [
            `${days} Days Full System Access`,
            ...(p.features
              ? p.features.filter(
                  (f) =>
                    !f.toLowerCase().includes('day') &&
                    !f.toLowerCase().includes('trial')
                )
              : [
                  'OPD Appointment Scheduling',
                  'Basic Patient EHR Records',
                  'Hospital Public Website',
                  'QR Code Subscription Upgrade',
                  'Standard Email Support',
                ]),
          ],
        };
      }
      return p;
    });
  },

  savePlans(plans: SubscriptionPlan[]): void {
    setStored(STORAGE_KEYS.PLANS, plans);
  },

  savePlan(updatedPlan: SubscriptionPlan): void {
    const plans = this.getPlans();
    const idx = plans.findIndex((p) => p.id === updatedPlan.id);
    let planToSave = { ...updatedPlan };
    if (planToSave.tier === 'trial') {
      const days = planToSave.trialDays || 14;
      planToSave.trialDays = days;
      planToSave.name = `${days}-Day Free Trial`;
      planToSave.tagline = `Zero-cost ${days}-day full platform trial provisioned automatically on hospital registration.`;
      const settings = this.getPlatformSettings();
      if (settings.allowTrialDays !== days) {
        setStored(STORAGE_KEYS.PLATFORM_SETTINGS, { ...settings, allowTrialDays: days });
      }
    }
    if (idx >= 0) {
      plans[idx] = planToSave;
    } else {
      plans.push(planToSave);
    }
    this.savePlans(plans);
  },

  getPlanByTier(tier?: string): SubscriptionPlan {
    const plans = this.getPlans();
    if (!tier) return plans[0];
    const match = plans.find(
      (p) => p.tier.toLowerCase() === tier.toLowerCase() || p.id.toLowerCase().includes(tier.toLowerCase())
    );
    return match || plans[0];
  },

  getSubscriptions(): HospitalSubscription[] {
    const subs = getStored<HospitalSubscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, initialSubscriptions);
    let modified = false;
    const sanitized = subs.map((s) => {
      if (s.planTier !== 'trial' && s.paymentMethod && s.paymentMethod.toLowerCase().includes('trial')) {
        modified = true;
        return {
          ...s,
          paymentMethod: 'UPI QR Code',
          status: s.status === 'trialing' ? 'active' : s.status,
        };
      }

      // Auto-correct renewal date calculation: monthly plans must renew 1 month later, not 1 year later
      if (s.interval === 'monthly' && s.renewalDate) {
        const baseDateStr = s.upgradedDate || s.activatedDate || s.startDate;
        if (baseDateStr) {
          const baseDate = new Date(baseDateStr);
          const currentRenew = new Date(s.renewalDate);
          const diffDays = Math.round((currentRenew.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 45) {
            modified = true;
            const correctedRenew = new Date(baseDate);
            correctedRenew.setMonth(correctedRenew.getMonth() + 1);
            return {
              ...s,
              renewalDate: correctedRenew.toISOString().split('T')[0],
            };
          }
        }
      }
      return s;
    });
    if (modified) {
      setStored(STORAGE_KEYS.SUBSCRIPTIONS, sanitized);
    }
    return sanitized;
  },

  getSubscriptionByHospitalId(hospitalId: string): HospitalSubscription | undefined {
    let sub = this.getSubscriptions().find((s) => this.matchHospitalId(s.hospitalId, hospitalId));
    const hosp = this.getHospitalById(hospitalId);
    if (!sub && hosp) {
      const plan = this.getPlanByTier(hosp.planTier);
      const isTrial = (hosp.planTier || 'trial') === 'trial';
      const now = new Date();
      const renewal = new Date(now);
      renewal.setMonth(renewal.getMonth() + 1);
      sub = {
        id: `SUB-${hosp.id}`,
        hospitalId: hosp.id,
        planTier: hosp.planTier || 'trial',
        planName: plan?.name || (isTrial ? '7-Day Free Trial' : 'Professional Hospital'),
        status: isTrial ? 'trialing' : 'active',
        interval: 'monthly',
        amount: isTrial ? 0 : plan?.priceMonthly || 14999,
        startDate: hosp.createdAt || now.toISOString().split('T')[0],
        activatedDate: hosp.createdAt || now.toISOString().split('T')[0],
        renewalDate: renewal.toISOString().split('T')[0],
        paymentMethod: isTrial ? '7-Day Trial License' : 'UPI QR Code',
        autoRenew: !isTrial,
      };
      const allSubs = this.getSubscriptions();
      allSubs.unshift(sub);
      setStored(STORAGE_KEYS.SUBSCRIPTIONS, allSubs);
    } else if (sub && hosp && sub.planTier !== hosp.planTier) {
      sub.planTier = hosp.planTier;
      const plan = this.getPlanByTier(hosp.planTier);
      sub.planName = plan.name;
      this.saveSubscription(sub);
    }
    return sub;
  },

  saveSubscription(subscription: HospitalSubscription): void {
    const subs = this.getSubscriptions();
    const idx = subs.findIndex((s) => s.id === subscription.id || s.hospitalId === subscription.hospitalId);
    if (idx >= 0) {
      subs[idx] = subscription;
    } else {
      subs.unshift(subscription);
    }
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    this.logActivity('Updated Subscription Tier', `Plan: ${subscription.planName}`, 'billing', 'Admin', 'Platform Admin', subscription.hospitalId);
  },

  checkHospitalSubscriptionStatus(hospitalId?: string): { allowed: boolean; reason?: 'trial_expired' | 'plan_disabled' | 'canceled'; message?: string; plan?: SubscriptionPlan; sub?: HospitalSubscription } {
    if (!hospitalId) return { allowed: true };
    const hosp = this.getHospitalById(hospitalId);
    if (!hosp) return { allowed: true };

    const plan = this.getPlanByTier(hosp.planTier);

    // 1. Check if subscription plan itself is disabled by Super Admin
    if (plan && plan.isActive === false) {
      return {
        allowed: false,
        reason: 'plan_disabled',
        message: `The subscription tier "${plan.name}" has been disabled by Platform Superadmin. All features and access are temporarily locked.`,
        plan,
      };
    }

    const sub = this.getSubscriptionByHospitalId(hospitalId);
    if (sub) {
      // 2. Check if Hospital is on Trial plan and validity days have expired
      if (sub.planTier === 'trial' || hosp.planTier === 'trial') {
        const trialDays = this.getTrialDays();
        const startDate = new Date(sub.startDate || hosp.createdAt || Date.now());
        const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (elapsedDays >= trialDays || sub.status === 'expired') {
          if (sub.status !== 'expired') {
            sub.status = 'expired';
            const subs = this.getSubscriptions();
            const sIdx = subs.findIndex((s) => s.id === sub.id);
            if (sIdx >= 0) {
              subs[sIdx].status = 'expired';
              setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
            }
          }
          return {
            allowed: false,
            reason: 'trial_expired',
            message: `Your ${trialDays}-Day Free Trial validity period has completed (${elapsedDays} days used). Trial access is now automatically disabled.`,
            plan,
            sub,
          };
        }
      }

      if (sub.status === 'canceled' || sub.status === 'expired') {
        return {
          allowed: false,
          reason: 'canceled',
          message: 'Your hospital subscription contract is expired or canceled. Please upgrade to continue.',
          plan,
          sub,
        };
      }
    }

    return { allowed: true, plan, sub };
  },

  isFeatureEnabledForHospital(hospitalId?: string, featureName?: string): boolean {
    if (!hospitalId || !featureName) return true;
    const hosp = this.getHospitalById(hospitalId);
    if (!hosp) return true;

    const plan = this.getPlanByTier(hosp.planTier);
    if (!plan) return true;
    if (plan.isActive === false) return false;

    // Strict multi-tier capability check matching SaaS specification
    return isCapabilityAllowedForTier(hosp.planTier, featureName);
  },

  isCapabilityEnabled(hospitalId?: string, capabilityKey?: string): boolean {
    return this.isFeatureEnabledForHospital(hospitalId, capabilityKey);
  },

  getPlanCapabilities() {
    return PLAN_CAPABILITIES;
  },

  checkPathAccess(hospitalId?: string, pathname?: string): { allowed: boolean; capabilityName?: string; requiredTierName?: string } {
    if (!hospitalId || !pathname) return { allowed: true };
    const hosp = this.getHospitalById(hospitalId);
    const result = checkPathCapability(pathname, hosp?.planTier);
    return {
      allowed: result.allowed,
      capabilityName: result.capability?.name,
      requiredTierName: result.requiredTierName,
    };
  },

  // Coupon Codes CRUD
  getCoupons(): CouponCode[] {
    return getStored<CouponCode[]>(STORAGE_KEYS.COUPONS, initialCoupons);
  },

  getCouponByCode(code: string): CouponCode | undefined {
    const coupons = this.getCoupons();
    return coupons.find((c) => c.code.toLowerCase().trim() === code.toLowerCase().trim() && c.isActive);
  },

  saveCoupon(coupon: CouponCode): void {
    const coupons = this.getCoupons();
    const idx = coupons.findIndex((c) => c.id === coupon.id || c.code.toLowerCase() === coupon.code.toLowerCase());
    if (idx >= 0) {
      coupons[idx] = coupon;
    } else {
      coupons.unshift(coupon);
    }
    setStored(STORAGE_KEYS.COUPONS, coupons);
    this.logActivity('Saved Coupon Code', `Code: ${coupon.code} (${coupon.discountPercentage}%)`, 'billing', 'Super Admin', 'Platform Admin');
  },

  deleteCoupon(id: string): void {
    const coupons = this.getCoupons().filter((c) => c.id !== id && c.code !== id);
    setStored(STORAGE_KEYS.COUPONS, coupons);
    this.logActivity('Deleted Coupon Code', `Coupon ID: ${id}`, 'billing', 'Super Admin', 'Platform Admin');
  },

  validateCoupon(code: string, hospitalId?: string): { valid: boolean; discountPercentage?: number; coupon?: CouponCode; message?: string } {
    const coupon = this.getCouponByCode(code);
    if (!coupon) {
      return { valid: false, message: 'Invalid or inactive promotional coupon code.' };
    }
    if (!coupon.isActive) {
      return { valid: false, message: 'This coupon code is currently disabled.' };
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return { valid: false, message: 'This coupon code has expired.' };
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, message: 'Coupon usage limit has been reached.' };
    }
    if (hospitalId && coupon.usedByHospitals && coupon.usedByHospitals.includes(hospitalId)) {
      return { valid: false, message: 'This coupon code has already been redeemed by your hospital and cannot be reused.' };
    }
    return { valid: true, discountPercentage: coupon.discountPercentage, coupon, message: `${coupon.discountPercentage}% discount applied!` };
  },

  requestSubscriptionUpgrade(
    hospitalId: string,
    requestedTier: SubscriptionPlanTier,
    amount: number,
    utrNumber: string,
    appliedCoupon?: string,
    originalAmount?: number,
    paymentScreenshot?: string,
    interval: BillingInterval = 'monthly'
  ): void {
    const subs = this.getSubscriptions();
    let sub = subs.find((s) => this.matchHospitalId(s.hospitalId, hospitalId));
    const plans = this.getPlans();
    const planObj = plans.find((p) => p.tier === requestedTier);

    if (!sub) {
      const now = new Date();
      const initialRenewal = new Date(now);
      if (interval === 'yearly') {
        initialRenewal.setFullYear(initialRenewal.getFullYear() + 1);
      } else {
        initialRenewal.setMonth(initialRenewal.getMonth() + 1);
      }
      sub = {
        id: `SUB-${hospitalId}`,
        hospitalId,
        planTier: 'basic',
        planName: 'Starter Clinic (Trial)',
        status: 'trialing',
        interval,
        amount,
        startDate: now.toISOString().split('T')[0],
        renewalDate: initialRenewal.toISOString().split('T')[0],
        paymentMethod: 'UPI QR Code',
        autoRenew: true,
      };
      subs.unshift(sub);
    }

    sub.paymentStatus = 'pending_approval';
    sub.requestedTier = requestedTier;
    sub.requestedInterval = interval;
    sub.interval = interval;
    sub.amount = amount;
    if (originalAmount) sub.originalAmount = originalAmount;
    if (appliedCoupon) {
      sub.appliedCoupon = appliedCoupon;
      // increment coupon used count & mark hospitalId as used
      const coupon = this.getCouponByCode(appliedCoupon);
      if (coupon) {
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        const usedList = coupon.usedByHospitals || [];
        if (!usedList.includes(hospitalId)) {
          usedList.push(hospitalId);
        }
        coupon.usedByHospitals = usedList;
        this.saveCoupon(coupon);
      }
    }
    sub.utrNumber = utrNumber;
    if (paymentScreenshot) {
      sub.paymentScreenshot = paymentScreenshot;
    }
    sub.paymentSubmittedAt = new Date().toISOString();

    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    this.logActivity(
      'Submitted Subscription QR Payment',
      `UTR: ${utrNumber} (${planObj?.name || requestedTier})${appliedCoupon ? ` with coupon ${appliedCoupon}` : ''}`,
      'billing',
      'Hospital Admin',
      'Hospital Admin',
      hospitalId
    );
  },

  approveSubscriptionUpgrade(subscriptionId: string): void {
    const subs = this.getSubscriptions();
    const sub = subs.find((s) => s.id === subscriptionId || s.hospitalId === subscriptionId);
    if (sub) {
      const targetTier = sub.requestedTier || sub.planTier;
      const plans = this.getPlans();
      const planObj = plans.find((p) => p.tier === targetTier);

      const now = new Date();
      const nowStr = now.toISOString().split('T')[0];
      const interval = sub.requestedInterval || sub.interval || 'monthly';
      sub.interval = interval;
      sub.paymentStatus = 'approved';
      sub.planTier = targetTier;
      sub.planName = planObj?.name || 'Professional Hospital';
      sub.status = 'active';
      sub.upgradedDate = nowStr;
      sub.activatedDate = sub.activatedDate || nowStr;

      // Calculate renewal date based on billing interval: 1 month for monthly, 1 year for yearly
      const renewalDateObj = new Date(now);
      if (interval === 'yearly') {
        renewalDateObj.setFullYear(renewalDateObj.getFullYear() + 1);
      } else {
        renewalDateObj.setMonth(renewalDateObj.getMonth() + 1);
      }
      sub.renewalDate = renewalDateObj.toISOString().split('T')[0];

      setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);

      // Update Hospital status & planTier & allocations
      const hosp = this.getHospitalById(sub.hospitalId);
      if (hosp) {
        hosp.planTier = targetTier;
        hosp.status = 'active';
        if (planObj) {
          hosp.totalBeds = planObj.maxBeds;
          hosp.totalDoctors = planObj.maxDoctors;
        }

        // Step 3: Enterprise Health Network Organization conversion
        if (targetTier === 'enterprise') {
          const orgs = this.getOrganizations();
          let org = orgs.find(
            (o) =>
              o.primaryHospitalId === hosp.id ||
              o.branches.includes(hosp.id) ||
              (hosp.organizationId && o.id === hosp.organizationId)
          );

          if (!org) {
            let orgName = 'ABC Healthcare Group';
            if (
              hosp.name.toLowerCase().includes('chennai') ||
              hosp.name.toLowerCase().includes('abc')
            ) {
              orgName = 'ABC Healthcare Group';
            } else {
              orgName = `${hosp.name.replace(/ Hospital| Clinic| Center| Medical Center/gi, '').trim()} Healthcare Group`;
            }

            const cleanOrgSlug = orgName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-');
            const orgId = hosp.id === 'HOSP-ABC-CHN' ? 'ORG-ABC' : `ORG-${hosp.id.replace('HOSP-', '')}`;

            org = {
              id: orgId,
              name: orgName,
              slug: cleanOrgSlug,
              primaryHospitalId: hosp.id,
              subscriptionId: sub.id,
              planTier: 'enterprise',
              status: 'active',
              maxBranches: 10,
              headquartersCity: hosp.city,
              headquartersAddress: hosp.address,
              contactEmail: hosp.email,
              contactPhone: hosp.phone,
              createdAt: new Date().toISOString().split('T')[0],
              branches: [hosp.id],
            };
            orgs.unshift(org);
            setStored(STORAGE_KEYS.ORGANIZATIONS, orgs);
          } else {
            if (!org.branches.includes(hosp.id)) {
              org.branches.push(hosp.id);
            }
            org.status = 'active';
            org.planTier = 'enterprise';
            setStored(STORAGE_KEYS.ORGANIZATIONS, orgs);
          }

          // Link hospital as first branch
          hosp.organizationId = org.id;
          hosp.organizationName = org.name;
          hosp.isBranch = true;
          hosp.branchCode = hosp.branchCode || (hosp.id === 'HOSP-ABC-CHN' ? 'ABC-CHN' : `${hosp.city.substring(0, 3).toUpperCase()}-01`);

          // Associate existing Hospital Admin with organization-level and branch-level permissions
          const users = this.getUsers();
          let usersModified = false;
          users.forEach((u) => {
            if (u.hospitalId === hosp.id && u.role === 'hospital_admin') {
              u.organizationId = org.id;
              u.organizationName = org.name;
              u.isOrganizationAdmin = true;
              u.permittedBranchIds = Array.from(new Set([...(u.permittedBranchIds || []), hosp.id]));
              usersModified = true;
            }
          });
          if (usersModified) {
            setStored(STORAGE_KEYS.USERS, users);
          }

          // If current logged-in user is this admin, update active session in localStorage
          const currentAuthUser = getStored<User | null>(STORAGE_KEYS.AUTH_USER, null);
          if (currentAuthUser && (currentAuthUser.hospitalId === hosp.id || currentAuthUser.email === hosp.adminEmail)) {
            const updatedAuth: User = {
              ...currentAuthUser,
              organizationId: org.id,
              organizationName: org.name,
              isOrganizationAdmin: true,
              permittedBranchIds: Array.from(new Set([...(currentAuthUser.permittedBranchIds || []), hosp.id])),
            };
            setStored(STORAGE_KEYS.AUTH_USER, updatedAuth);
          }
        }

        this.saveHospital(hosp);
      }

      this.logActivity('Approved Subscription Upgrade', `Hospital: ${hosp?.name} -> ${sub.planName}`, 'billing', 'Super Admin', 'Platform Admin', sub.hospitalId);
    }
  },

  rejectSubscriptionUpgrade(subscriptionId: string): void {
    const subs = this.getSubscriptions();
    const sub = subs.find((s) => s.id === subscriptionId || s.hospitalId === subscriptionId);
    if (sub) {
      sub.paymentStatus = 'rejected';
      setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
      this.logActivity('Rejected Subscription Upgrade', `UTR verification failed`, 'billing', 'Super Admin', 'Platform Admin', sub.hospitalId);
    }
  },

  // Support Tickets
  getSupportTickets(): SupportTicket[] {
    return getStored(STORAGE_KEYS.TICKETS, initialSupportTickets);
  },

  getSupportTicketById(id: string): SupportTicket | undefined {
    return this.getSupportTickets().find((t) => t.id === id);
  },

  saveSupportTicket(ticket: SupportTicket): void {
    const tickets = this.getSupportTickets();
    const idx = tickets.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) {
      tickets[idx] = ticket;
    } else {
      tickets.unshift(ticket);
    }
    setStored(STORAGE_KEYS.TICKETS, tickets);

    // Asynchronously sync with Django backend
    if (idx >= 0) {
      fetch(`${API_BASE_URL}/support-tickets/${ticket.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital: ticket.hospitalId,
          hospital_name: ticket.hospitalName,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          requester_name: ticket.requesterName,
          requester_email: ticket.requesterEmail,
          assigned_to: ticket.assignedTo,
          messages: ticket.messages,
        }),
      }).catch(() => {});
    } else {
      fetch(`${API_BASE_URL}/support-tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ticket.id,
          hospital: ticket.hospitalId,
          hospital_name: ticket.hospitalName,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          requester_name: ticket.requesterName,
          requester_email: ticket.requesterEmail,
          assigned_to: ticket.assignedTo,
          messages: ticket.messages,
        }),
      }).catch(() => {});
    }
  },

  addTicketReply(ticketId: string, message: string, sender: string, senderRole: 'hospital' | 'platform_support'): void {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.messages.push({
        id: `msg-${Date.now()}`,
        sender,
        senderRole,
        message,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      ticket.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      setStored(STORAGE_KEYS.TICKETS, tickets);

      fetch(`${API_BASE_URL}/support-tickets/${ticketId}/add_reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sender,
          sender_role: senderRole,
        }),
      }).catch(() => {});
    }
  },

  // Patients
  getPatients(hospitalId?: string): Patient[] {
    const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    if (hospitalId) {
      return patients.filter((p) => this.matchHospitalId(p.hospitalId, hospitalId));
    }
    return patients;
  },

  getPatientById(id: string): Patient | undefined {
    return getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients).find((p) => p.id === id);
  },

  savePatient(patient: Patient): { success: boolean; message?: string } {
    const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    const idx = patients.findIndex((p) => p.id === patient.id);

    const normalizedEmail = (patient.email || '').trim().toLowerCase();
    if (normalizedEmail) {
      const existingPatient = patients.find(
        (p) =>
          p.hospitalId === patient.hospitalId &&
          (p.email || '').trim().toLowerCase() === normalizedEmail &&
          p.id !== patient.id
      );
      if (existingPatient) {
        return {
          success: false,
          message: `Duplicate Email: A patient with email "${patient.email.trim()}" is already registered in this hospital.`,
        };
      }
    }

    if (idx >= 0) {
      patients[idx] = patient;
    } else {
      patients.unshift(patient);
    }
    setStored(STORAGE_KEYS.PATIENTS, patients);
    this.logActivity(idx >= 0 ? 'Updated Patient Profile' : 'Registered New Patient', `${patient.name} (${patient.id})`, 'patient', 'Staff', 'Hospital User', patient.hospitalId);

    // Asynchronously synchronize with Django backend if available
    try {
      const hospitalKey = patient.hospitalId || 'HOSP-001';
      const payload = {
        id: patient.id,
        hospital: hospitalKey,
        name: patient.name,
        age: Number(patient.age) || 0,
        gender: patient.gender || 'Other',
        phone: patient.phone,
        email: patient.email && patient.email.trim() ? patient.email.trim().toLowerCase() : null,
        date_of_birth: patient.dateOfBirth || null,
        blood_group: patient.bloodGroup || 'O+',
        address: patient.address || '',
        emergency_contact_name: patient.emergencyContactName || null,
        emergency_contact_phone: patient.emergencyContactPhone || null,
        emergency_contact_relation: patient.emergencyContactRelation || null,
        allergies: patient.allergies || [],
        medical_history: patient.medicalHistory || [],
        registered_date: patient.registeredDate || new Date().toISOString().split('T')[0],
        assigned_doctor_id: patient.assignedDoctorId || null,
        assigned_doctor_name: patient.assignedDoctorName || null,
        room_bed_number: patient.roomBedNumber || null,
        vitals: patient.vitals || {},
        status: patient.status || 'Outpatient',
      };
      fetch(`${API_BASE_URL}/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hospital-Id': hospitalKey,
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {}
    return { success: true };
  },

  deletePatient(id: string): void {
    const patient = this.getPatientById(id);
    const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients).filter((p) => p.id !== id);
    setStored(STORAGE_KEYS.PATIENTS, patients);
    if (patient) {
      this.logActivity('Deactivated Patient Record', `${patient.name} (${patient.id})`, 'patient', 'Staff', 'Hospital User', patient.hospitalId);
    }
    try {
      fetch(`${API_BASE_URL}/patients/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  // Prescriptions
  getPrescriptions(patientId?: string, hospitalId?: string): Prescription[] {
    let list = getStored<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions);

    // Purge any legacy mock prescriptions that were previously auto-seeded
    const cleaned = list.filter((p) => {
      if (p.id && p.id.match(/^RX-.*-10[123]$/)) {
        if (
          p.diagnosis === 'Hypertension & Dyslipidemia (Routine Follow-up)' ||
          p.diagnosis === 'Upper Respiratory Tract Infection (Acute Bronchitis)' ||
          p.diagnosis === 'Bronchial Asthma (Exacerbation)'
        ) {
          return false;
        }
      }
      return true;
    });
    if (cleaned.length !== list.length) {
      setStored(STORAGE_KEYS.PRESCRIPTIONS, cleaned);
      list = cleaned;
    }

    // Self-heal and normalize prescription fulfillment states
    const invoices = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    const invoiceMap = new Map<string, Invoice>();
    invoices.forEach((inv) => {
      if (inv.prescriptionId) {
        invoiceMap.set(inv.prescriptionId, inv);
      }
    });

    let hasNormalization = false;
    list = list.map((p) => {
      const linkedInvoice = invoiceMap.get(p.id);
      const isDispensed = p.status === 'Dispensed' || Boolean(p.dispensedAt) || Boolean(linkedInvoice);

      if (isDispensed) {
        const nextDispensedAt = p.dispensedAt || linkedInvoice?.issueDate || linkedInvoice?.createdAt || new Date().toISOString();
        const nextDispensedInvoiceId = p.dispensedInvoiceId || linkedInvoice?.id;
        const nextDispensedBy = p.dispensedBy || linkedInvoice?.collectedBy || 'Pharmacist';

        if (
          p.status !== 'Dispensed' ||
          p.dispensedAt !== nextDispensedAt ||
          p.dispensedInvoiceId !== nextDispensedInvoiceId ||
          p.dispensedBy !== nextDispensedBy
        ) {
          hasNormalization = true;
          return {
            ...p,
            status: 'Dispensed',
            dispensedAt: nextDispensedAt,
            dispensedInvoiceId: nextDispensedInvoiceId,
            dispensedBy: nextDispensedBy,
          };
        }
      }
      return p;
    });

    if (hasNormalization) {
      setStored(STORAGE_KEYS.PRESCRIPTIONS, list);
    }

    if (patientId) {
      return list.filter((p) => p.patientId === patientId);
    }
    if (hospitalId) {
      return list.filter((p) => this.matchHospitalId(p.hospitalId, hospitalId));
    }
    return list;
  },

  savePrescription(prescription: Prescription): void {
    const list = getStored<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions);
    const idx = list.findIndex((p) => p.id === prescription.id);
    if (idx >= 0) {
      list[idx] = prescription;
    } else {
      list.unshift(prescription);
    }
    setStored(STORAGE_KEYS.PRESCRIPTIONS, list);

    try {
      const hospitalKey = prescription.hospitalId || 'HOSP-001';
      const payload = {
        id: prescription.id,
        hospital: hospitalKey,
        patient: prescription.patientId,
        doctor_name: prescription.doctorName || 'Doctor',
        date: prescription.date || new Date().toISOString().split('T')[0],
        status: prescription.status || 'Active',
        medicines: prescription.medications || [],
        notes: prescription.diagnosis || '',
      };
      fetch(`${API_BASE_URL}/prescriptions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hospital-Id': hospitalKey,
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {}
  },

  // Appointments
  getAppointments(hospitalId?: string, patientId?: string): Appointment[] {
    const HARDCODED_APPT_IDS = ['APT-1001', 'APT-1002', 'APT-1003', 'APT-1004', 'APT-1005'];
    const raw = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const cleaned = raw.filter((a) => !HARDCODED_APPT_IDS.includes(a.id));
    if (cleaned.length !== raw.length) {
      setStored(STORAGE_KEYS.APPOINTMENTS, cleaned);
    }
    let appointments = cleaned;
    if (hospitalId) {
      appointments = appointments.filter((a) => this.matchHospitalId(a.hospitalId, hospitalId));
    }
    if (patientId) {
      appointments = appointments.filter((a) => a.patientId === patientId);
    }
    return appointments;
  },

  getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find((a) => a.id === id);
  },

  saveAppointment(appointment: Appointment): void {
    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const idx = list.findIndex((a) => a.id === appointment.id);
    if (idx >= 0) {
      list[idx] = appointment;
    } else {
      list.unshift(appointment);
    }
    setStored(STORAGE_KEYS.APPOINTMENTS, list);
    this.logActivity(idx >= 0 ? 'Rescheduled/Updated Appointment' : 'Booked New Appointment', `${appointment.patientName} with ${appointment.doctorName}`, 'clinical', 'Staff', 'Hospital User', appointment.hospitalId);

    try {
      const hospitalKey = appointment.hospitalId || 'HOSP-001';
      const payload = {
        id: appointment.id,
        hospital: hospitalKey,
        patient: appointment.patientId,
        doctor: appointment.doctorId,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        type: appointment.type || 'General Checkup',
        status: appointment.status || 'Scheduled',
        notes: appointment.notes || '',
        opd_room_id: appointment.opdRoomId || null,
        opd_room_name: appointment.opdRoomName || null,
        reason: appointment.reason || '',
        checked_in_at: appointment.checkedInAt || null,
        consultation_started_at: appointment.consultationStartedAt || null,
        consultation_completed_at: appointment.consultationCompletedAt || null,
      };
      fetch(`${API_BASE_URL}/appointments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hospital-Id': hospitalKey,
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {}
  },

  updateAppointmentStatus(id: string, status: Appointment['status'], extra?: Partial<Appointment>): void {
    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const item = list.find((a) => a.id === id);
    if (item) {
      item.status = status;
      if (status === 'Checked In' && !item.checkedInAt) {
        item.checkedInAt = extra?.checkedInAt || new Date().toISOString();
      } else if (status === 'In Consultation' && !item.consultationStartedAt) {
        item.consultationStartedAt = extra?.consultationStartedAt || new Date().toISOString();
      } else if (status === 'Completed' && !item.consultationCompletedAt) {
        item.consultationCompletedAt = extra?.consultationCompletedAt || new Date().toISOString();
      }
      if (extra) {
        Object.assign(item, extra);
      }
      setStored(STORAGE_KEYS.APPOINTMENTS, list);
      this.logActivity(`Appointment Status: ${status}`, `${item.patientName} (${item.id})`, 'clinical', 'Staff', 'Hospital User', item.hospitalId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pulse_storage_updated'));
      }

      try {
        const patchPayload: any = { status };
        if (extra) {
          if (extra.checkedInAt) patchPayload.checked_in_at = extra.checkedInAt;
          if (extra.consultationStartedAt) patchPayload.consultation_started_at = extra.consultationStartedAt;
          if (extra.consultationCompletedAt) patchPayload.consultation_completed_at = extra.consultationCompletedAt;
          if (extra.opdRoomId) patchPayload.opd_room_id = extra.opdRoomId;
          if (extra.opdRoomName) patchPayload.opd_room_name = extra.opdRoomName;
          if (extra.notes) patchPayload.notes = extra.notes;
        }
        fetch(`${API_BASE_URL}/appointments/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload),
        }).catch(() => {});
      } catch (e) {}
    }
  },

  deleteAppointment(id: string): void {
    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments).filter((a) => a.id !== id);
    setStored(STORAGE_KEYS.APPOINTMENTS, list);
    ApiService.deleteAppointment(id).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }
  },

  // Consultations & Clinical Encounters
  getConsultations(hospitalId?: string, doctorId?: string): Consultation[] {
    let list = getStored<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    if (hospitalId) {
      list = list.filter((c) => this.matchHospitalId(c.hospitalId, hospitalId) || !c.hospitalId);
    }
    if (doctorId) {
      list = list.filter((c) => c.doctorId === doctorId);
    }
    return list;
  },

  getConsultationById(id: string): Consultation | undefined {
    return this.getConsultations().find((c) => c.id === id);
  },

  getConsultationByAppointmentId(appointmentId: string): Consultation | undefined {
    return this.getConsultations().find((c) => c.appointmentId === appointmentId);
  },

  saveConsultation(consultation: Consultation): void {
    const list = getStored<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    const idx = list.findIndex(
      (c) => c.id === consultation.id || (consultation.appointmentId && c.appointmentId === consultation.appointmentId)
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...consultation, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...consultation, updatedAt: new Date().toISOString() });
    }
    setStored(STORAGE_KEYS.CONSULTATIONS, list);

    // Keep appointment consultationId linked if appointment exists
    if (consultation.appointmentId) {
      const aptList = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
      const apt = aptList.find((a) => a.id === consultation.appointmentId);
      if (apt) {
        apt.consultationId = consultation.id;
        if (consultation.status === 'Finalized') {
          apt.status = 'Completed';
          if (!apt.consultationCompletedAt) {
            apt.consultationCompletedAt = consultation.finalizedAt || new Date().toISOString();
          }
        }
        setStored(STORAGE_KEYS.APPOINTMENTS, aptList);
      }
    }

    // If Finalized: Update patient EHR and prescriptions
    if (consultation.status === 'Finalized') {
      const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
      const patient = patients.find((p) => p.id === consultation.patientId);
      if (patient) {
        if (consultation.diagnosis) {
          const medHist = Array.from(new Set([...(patient.medicalHistory || []), consultation.diagnosis]));
          patient.medicalHistory = medHist;
        }
        if (consultation.vitals) {
          patient.vitals = {
            ...(patient.vitals || {
              bloodPressure: '120/80 mmHg',
              heartRate: 72,
              temperature: 98.6,
              oxygenLevel: 99,
              weightKg: 70,
              recordedAt: new Date().toISOString(),
            }),
            ...consultation.vitals,
            recordedAt: consultation.finalizedAt || new Date().toISOString(),
          };
        }
        setStored(STORAGE_KEYS.PATIENTS, patients);
      }

      // If prescription items exist, save prescription
      if (consultation.prescriptionItems && consultation.prescriptionItems.length > 0) {
        const presList = getStored<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions);
        const rxId = `RX-${consultation.id.replace('CON-', '')}`;
        const newPres: Prescription = {
          id: rxId,
          hospitalId: consultation.hospitalId,
          patientId: consultation.patientId,
          patientName: consultation.patientName,
          doctorId: consultation.doctorId,
          doctorName: consultation.doctorName,
          doctorSpecialization: 'Specialist',
          date: (consultation.finalizedAt || new Date().toISOString()).split('T')[0],
          diagnosis: consultation.diagnosis || 'Clinical OPD Consultation',
          medications: consultation.prescriptionItems,
          status: 'Active',
          notes: consultation.notes || `Prescription generated during consultation ${consultation.id}`,
        };
        const pIdx = presList.findIndex((p) => p.id === rxId);
        if (pIdx >= 0) {
          presList[pIdx] = newPres;
        } else {
          presList.unshift(newPres);
        }
        setStored(STORAGE_KEYS.PRESCRIPTIONS, presList);
      }

      // Step 1: If doctor recommended a follow-up, create or update a FollowUpRequest
      if (consultation.needsFollowUp && consultation.followUpDate) {
        const flwList = getStored<FollowUpRequest[]>(STORAGE_KEYS.FOLLOW_UP_REQUESTS, []);
        const existingFlw = flwList.find(
          (f) =>
            f.consultationId === consultation.id ||
            (consultation.appointmentId && f.originalAppointmentId === consultation.appointmentId)
        );

        const aptList = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
        const originalApt = consultation.appointmentId ? aptList.find((a) => a.id === consultation.appointmentId) : undefined;

        if (existingFlw) {
          existingFlw.suggestedDate = consultation.followUpDate;
          existingFlw.reason = consultation.followUpReason || 'Doctor recommended follow-up review';
          existingFlw.intervalDays = consultation.followUpIntervalDays;
          existingFlw.notes = consultation.followUpInstructions;
          setStored(STORAGE_KEYS.FOLLOW_UP_REQUESTS, flwList);
        } else {
          const newFlw: FollowUpRequest = {
            id: `FLW-${Date.now().toString().slice(-4)}`,
            hospitalId: consultation.hospitalId || 'HOSP-001',
            consultationId: consultation.id,
            originalAppointmentId: consultation.appointmentId || '',
            patientId: consultation.patientId,
            patientName: consultation.patientName,
            patientPhone: originalApt?.patientPhone || '555-0100',
            patientAge: originalApt?.patientAge,
            patientGender: originalApt?.patientGender,
            doctorId: consultation.doctorId,
            doctorName: consultation.doctorName,
            departmentId: originalApt?.departmentId,
            departmentName: originalApt?.departmentName || 'Outpatient Clinic',
            suggestedDate: consultation.followUpDate,
            intervalDays: consultation.followUpIntervalDays,
            reason: consultation.followUpReason || 'Clinical OPD Follow-up Review',
            notes: consultation.followUpInstructions,
            status: 'Pending',
            createdAt: new Date().toISOString(),
          };
          flwList.unshift(newFlw);
          setStored(STORAGE_KEYS.FOLLOW_UP_REQUESTS, flwList);
        }
      }

      // Inpatient Admission Order Handling
      if (consultation.needsAdmission) {
        const admReqList = getStored<AdmissionRequest[]>(STORAGE_KEYS.ADMISSION_REQUESTS, initialAdmissionRequests);
        const existingAdmReq = admReqList.find(
          (r) =>
            r.consultationId === consultation.id ||
            (consultation.appointmentId && r.appointmentId === consultation.appointmentId)
        );

        const aptList = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
        const originalApt = consultation.appointmentId ? aptList.find((a) => a.id === consultation.appointmentId) : undefined;

        if (existingAdmReq) {
          existingAdmReq.recommendedWardType = consultation.admissionWardType || 'General Ward';
          existingAdmReq.priority = consultation.admissionPriority || 'Urgent';
          existingAdmReq.reason = consultation.admissionReason || consultation.diagnosis || 'Inpatient admission recommended by specialist';
          existingAdmReq.instructions = consultation.admissionInstructions;
          existingAdmReq.diagnosis = consultation.diagnosis;
          setStored(STORAGE_KEYS.ADMISSION_REQUESTS, admReqList);
        } else {
          const newAdmReq: AdmissionRequest = {
            id: `ADMR-${Date.now().toString().slice(-4)}`,
            hospitalId: consultation.hospitalId || 'HOSP-001',
            consultationId: consultation.id,
            appointmentId: consultation.appointmentId,
            patientId: consultation.patientId,
            patientName: consultation.patientName,
            patientPhone: originalApt?.patientPhone || '9876543210',
            patientAge: originalApt?.patientAge,
            patientGender: originalApt?.patientGender,
            doctorId: consultation.doctorId,
            doctorName: consultation.doctorName,
            departmentName: originalApt?.departmentName || 'General Medicine',
            recommendedWardType: consultation.admissionWardType || 'General Ward',
            priority: consultation.admissionPriority || 'Urgent',
            reason: consultation.admissionReason || consultation.diagnosis || 'Inpatient admission recommended by specialist',
            diagnosis: consultation.diagnosis,
            instructions: consultation.admissionInstructions,
            status: 'Pending',
            createdAt: new Date().toISOString(),
          };
          admReqList.unshift(newAdmReq);
          setStored(STORAGE_KEYS.ADMISSION_REQUESTS, admReqList);
        }
      }

      // If this consultation itself was completing a follow-up appointment, mark the follow-up request completed
      if (consultation.appointmentId) {
        const flwList = getStored<FollowUpRequest[]>(STORAGE_KEYS.FOLLOW_UP_REQUESTS, []);
        const matchingFlw = flwList.find((f) => f.scheduledAppointmentId === consultation.appointmentId);
        if (matchingFlw) {
          matchingFlw.status = 'Completed';
          setStored(STORAGE_KEYS.FOLLOW_UP_REQUESTS, flwList);
        }
      }
    }

    this.logActivity(
      consultation.status === 'Finalized' ? 'Finalized Consultation' : 'Saved Consultation Draft',
      `${consultation.patientName} with ${consultation.doctorName} (${consultation.id})`,
      'clinical',
      consultation.doctorName,
      'Doctor',
      consultation.hospitalId
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }
  },

  // Follow-Up Requests Management
  getFollowUpRequests(hospitalId?: string, patientId?: string): FollowUpRequest[] {
    let list = getStored<FollowUpRequest[]>(STORAGE_KEYS.FOLLOW_UP_REQUESTS, []);
    if (hospitalId) {
      list = list.filter((f) => this.matchHospitalId(f.hospitalId, hospitalId) || !f.hospitalId);
    }
    if (patientId) {
      list = list.filter((f) => f.patientId === patientId);
    }
    return list;
  },

  saveFollowUpRequest(req: FollowUpRequest): void {
    const list = getStored<FollowUpRequest[]>(STORAGE_KEYS.FOLLOW_UP_REQUESTS, []);
    const idx = list.findIndex((f) => f.id === req.id);
    if (idx >= 0) {
      list[idx] = req;
    } else {
      list.unshift(req);
    }
    setStored(STORAGE_KEYS.FOLLOW_UP_REQUESTS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }
  },

  updateFollowUpRequestStatus(
    id: string,
    status: FollowUpRequest['status'],
    scheduledAppointmentId?: string,
    scheduledDate?: string,
    scheduledTime?: string
  ): void {
    const list = getStored<FollowUpRequest[]>(STORAGE_KEYS.FOLLOW_UP_REQUESTS, []);
    const req = list.find((f) => f.id === id);
    if (req) {
      req.status = status;
      if (scheduledAppointmentId) req.scheduledAppointmentId = scheduledAppointmentId;
      if (scheduledDate) req.scheduledDate = scheduledDate;
      if (scheduledTime) req.scheduledTime = scheduledTime;
      setStored(STORAGE_KEYS.FOLLOW_UP_REQUESTS, list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pulse_storage_updated'));
      }
    }
  },

  // Inpatient Admission Requests Management
  getAdmissionRequests(hospitalId?: string, patientId?: string): AdmissionRequest[] {
    let list = getStored<AdmissionRequest[]>(STORAGE_KEYS.ADMISSION_REQUESTS, initialAdmissionRequests);
    if (hospitalId) {
      list = list.filter((r) => this.matchHospitalId(r.hospitalId, hospitalId) || !r.hospitalId);
    }
    if (patientId) {
      list = list.filter((r) => r.patientId === patientId);
    }
    return list;
  },

  saveAdmissionRequest(req: AdmissionRequest): void {
    const list = getStored<AdmissionRequest[]>(STORAGE_KEYS.ADMISSION_REQUESTS, initialAdmissionRequests);
    const idx = list.findIndex((r) => r.id === req.id);
    if (idx >= 0) {
      list[idx] = req;
    } else {
      list.unshift(req);
    }
    setStored(STORAGE_KEYS.ADMISSION_REQUESTS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }
  },

  updateAdmissionRequestStatus(
    id: string,
    status: AdmissionRequestStatus,
    admittedAdmissionId?: string
  ): void {
    const list = getStored<AdmissionRequest[]>(STORAGE_KEYS.ADMISSION_REQUESTS, initialAdmissionRequests);
    const req = list.find((r) => r.id === id);
    if (req) {
      req.status = status;
      if (admittedAdmissionId) req.admittedAdmissionId = admittedAdmissionId;
      setStored(STORAGE_KEYS.ADMISSION_REQUESTS, list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pulse_storage_updated'));
      }
    }
  },

  rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): { success: boolean; appointment?: Appointment; error?: string } {
    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const apt = list.find((a) => a.id === appointmentId);
    if (!apt) {
      return { success: false, error: 'Appointment not found' };
    }

    const prevDate = apt.appointmentDate;
    const prevTime = apt.appointmentTime;

    apt.rescheduledFromDate = prevDate;
    apt.rescheduledFromTime = prevTime;
    apt.rescheduleReason = reason || 'Rescheduled per clinical / patient request';
    apt.appointmentDate = newDate;
    apt.appointmentTime = newTime;
    apt.status = 'Confirmed';

    setStored(STORAGE_KEYS.APPOINTMENTS, list);

    // If linked to a follow-up request, sync schedule
    const flwList = getStored<FollowUpRequest[]>(STORAGE_KEYS.FOLLOW_UP_REQUESTS, []);
    const flw = flwList.find((f) => f.scheduledAppointmentId === appointmentId);
    if (flw) {
      flw.scheduledDate = newDate;
      flw.scheduledTime = newTime;
      setStored(STORAGE_KEYS.FOLLOW_UP_REQUESTS, flwList);
    }

    this.logActivity(
      'Rescheduled Appointment',
      `${apt.patientName} with ${apt.doctorName} moved from ${prevDate} to ${newDate} at ${newTime}`,
      'clinical',
      apt.doctorName,
      'Receptionist',
      apt.hospitalId
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }

    return { success: true, appointment: apt };
  },

  // Doctor Schedules & Working Hours
  getDoctorSchedules(hospitalId?: string, doctorId?: string): DoctorSchedule[] {
    const HARDCODED_SCHEDULE_IDS = [
      'SCH-DOC-ABC-101',
      'SCH-DOC-ABC-102',
      'SCH-DOC-ABC-103',
      'SCH-DOC-101',
      'SCH-DOC-102',
      'SCH-DOC-103',
    ];
    let schedules = getStored<DoctorSchedule[]>(STORAGE_KEYS.DOCTOR_SCHEDULES, initialDoctorSchedules)
      .filter((s) => !HARDCODED_SCHEDULE_IDS.includes(s.id));
    if (hospitalId) {
      schedules = schedules.filter((s) => this.matchHospitalId(s.hospitalId, hospitalId));
    }
    if (doctorId) {
      schedules = schedules.filter((s) => s.doctorId === doctorId);
    }
    return schedules;
  },

  getDoctorScheduleById(id: string): DoctorSchedule | undefined {
    return this.getDoctorSchedules().find((s) => s.id === id);
  },

  getDoctorScheduleByDoctorId(doctorId: string, hospitalId?: string): DoctorSchedule | undefined {
    const schedules = this.getDoctorSchedules(hospitalId);
    const existing = schedules.find((s) => s.doctorId === doctorId && s.isActive !== false);
    if (existing) return existing;

    // Synchronized Auto-Seed: If doctor exists without a schedule, derive it from doctor's consultation hours
    const doc = this.getDoctorById(doctorId);
    if (doc) {
      let startTime = '09:00 AM';
      let endTime = '05:00 PM';
      if (doc.availableHours && doc.availableHours.includes('-')) {
        const parts = doc.availableHours.split('-').map((s) => s.trim());
        if (parts[0]) startTime = parts[0];
        if (parts[1]) endTime = parts[1];
      }
      const derivedSchedule: DoctorSchedule = {
        id: `SCH-${doc.id}`,
        hospitalId: doc.hospitalId || hospitalId || 'hosp-1',
        doctorId: doc.id,
        doctorName: doc.name,
        departmentId: doc.departmentId || '',
        departmentName: doc.departmentName || '',
        opdRoomId: doc.opdRoomId,
        opdRoomName: doc.opdRoomName || doc.roomNumber,
        workingDays: (doc.availableDays && doc.availableDays.length > 0)
          ? (doc.availableDays as any)
          : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        consultationStartTime: startTime,
        consultationEndTime: endTime,
        slotDurationMinutes: 30,
        breaks: [],
        effectiveStartDate: '2026-01-01',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      this.saveDoctorSchedule(derivedSchedule, false);
      return derivedSchedule;
    }
    return undefined;
  },

  saveDoctorSchedule(schedule: DoctorSchedule, syncDoctor: boolean = true): void {
    const list = this.getDoctorSchedules();
    const idx = list.findIndex((s) => s.id === schedule.id || (s.doctorId === schedule.doctorId && s.hospitalId === schedule.hospitalId));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...schedule, updatedAt: new Date().toISOString().split('T')[0] };
    } else {
      list.unshift({ ...schedule, createdAt: new Date().toISOString().split('T')[0] });
    }
    setStored(STORAGE_KEYS.DOCTOR_SCHEDULES, list);

    // Bi-directional sync: Update Doctor profile's availableHours & availableDays
    if (syncDoctor && schedule.doctorId && schedule.consultationStartTime && schedule.consultationEndTime) {
      const doctors = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
      const docIdx = doctors.findIndex((d) => d.id === schedule.doctorId);
      if (docIdx >= 0) {
        const formattedHours = `${schedule.consultationStartTime} - ${schedule.consultationEndTime}`;
        if (doctors[docIdx].availableHours !== formattedHours || JSON.stringify(doctors[docIdx].availableDays) !== JSON.stringify(schedule.workingDays)) {
          doctors[docIdx].availableHours = formattedHours;
          if (schedule.workingDays && schedule.workingDays.length > 0) {
            doctors[docIdx].availableDays = schedule.workingDays;
          }
          setStored(STORAGE_KEYS.DOCTORS, doctors);
          try {
            fetch(`${API_BASE_URL}/doctors/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: doctors[docIdx].id,
                hospital: doctors[docIdx].hospitalId || 'HOSP-001',
                name: doctors[docIdx].name,
                available_hours: formattedHours,
                available_days: schedule.workingDays,
              }),
            }).catch(() => {});
          } catch (e) {}
        }
      }
    }

    ApiService.saveDoctorSchedule({
      id: schedule.id,
      hospital: schedule.hospitalId || 'hosp-1',
      doctor: schedule.doctorId,
      department_id: schedule.departmentId,
      department_name: schedule.departmentName,
      opd_room_id: schedule.opdRoomId,
      opd_room_name: schedule.opdRoomName,
      working_days: schedule.workingDays,
      consultation_start_time: schedule.consultationStartTime,
      consultation_end_time: schedule.consultationEndTime,
      slot_duration_minutes: schedule.slotDurationMinutes,
      breaks: schedule.breaks || [],
      effective_start_date: schedule.effectiveStartDate || '2026-01-01',
      effective_end_date: schedule.effectiveEndDate || null,
      is_active: schedule.isActive !== false,
      notes: schedule.notes || '',
    }).catch(() => {});
    this.logActivity(
      idx >= 0 ? 'Updated Doctor Schedule' : 'Configured Doctor Schedule',
      `${schedule.doctorName || schedule.doctorId} (${schedule.consultationStartTime} - ${schedule.consultationEndTime})`,
      'clinical',
      'Admin',
      'Hospital Admin',
      schedule.hospitalId
    );
    window.dispatchEvent(new Event('pulse_storage_updated'));
  },

  deleteDoctorSchedule(id: string): void {
    const existing = this.getDoctorScheduleById(id);
    const list = this.getDoctorSchedules().filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.DOCTOR_SCHEDULES, list);
    ApiService.deleteDoctorSchedule(id).catch(() => {});
    if (existing) {
      this.logActivity(
        'Deleted Doctor Schedule',
        `Schedule for ${existing.doctorName || existing.doctorId} removed`,
        'clinical',
        'Admin',
        'Hospital Admin',
        existing.hospitalId
      );
    }
    window.dispatchEvent(new Event('pulse_storage_updated'));
  },

  // Doctor Leaves, Holidays & Unavailability
  getDoctorUnavailability(hospitalId?: string, doctorId?: string): DoctorUnavailablePeriod[] {
    let unav = getStored<DoctorUnavailablePeriod[]>(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, initialDoctorUnavailability);
    if (hospitalId) {
      unav = unav.filter((u) => this.matchHospitalId(u.hospitalId, hospitalId));
    }
    if (doctorId) {
      unav = unav.filter((u) => u.doctorId === doctorId);
    }
    return unav;
  },

  saveDoctorUnavailability(period: DoctorUnavailablePeriod): void {
    const list = getStored<DoctorUnavailablePeriod[]>(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, initialDoctorUnavailability);
    const idx = list.findIndex((u) => u.id === period.id);
    if (idx >= 0) {
      list[idx] = period;
    } else {
      list.unshift({ ...period, createdAt: new Date().toISOString().split('T')[0] });
    }
    setStored(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, list);
    ApiService.saveDoctorUnavailability({
      id: period.id,
      hospital: period.hospitalId || 'hosp-1',
      doctor: period.doctorId,
      period_type: period.type || 'Leave',
      title: period.title,
      start_date: period.startDate,
      end_date: period.endDate,
      start_time: period.startTime || null,
      end_time: period.endTime || null,
      is_all_day: period.isAllDay !== false,
      reason: period.reason || '',
    }).catch(() => {});
    this.logActivity(
      idx >= 0 ? 'Updated Doctor Unavailable Block' : 'Blocked Doctor Leave / Period',
      `${period.doctorName || period.doctorId} [${period.type}]: ${period.startDate} to ${period.endDate}`,
      'clinical',
      'Admin',
      'Hospital Admin',
      period.hospitalId
    );
  },

  deleteDoctorUnavailability(id: string): void {
    const list = getStored<DoctorUnavailablePeriod[]>(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, initialDoctorUnavailability).filter((u) => u.id !== id);
    setStored(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, list);
    ApiService.deleteDoctorUnavailability(id).catch(() => {});
  },

  // Appointment Settings (Advance limits, deadlines, buffer)
  getAppointmentSettings(hospitalId: string): AppointmentSettings {
    const list = getStored<AppointmentSettings[]>(STORAGE_KEYS.APPOINTMENT_SETTINGS, initialAppointmentSettings);
    const found = list.find((s) => this.matchHospitalId(s.hospitalId, hospitalId));
    if (found) return found;

    const defaultSetting: AppointmentSettings = {
      id: `SET-${hospitalId}`,
      hospitalId,
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      cancellationDeadlineHours: 4,
      reschedulingDeadlineHours: 4,
      appointmentBufferMinutes: 5,
      allowSameDayBooking: true,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    list.push(defaultSetting);
    setStored(STORAGE_KEYS.APPOINTMENT_SETTINGS, list);
    return defaultSetting;
  },

  saveAppointmentSettings(settings: AppointmentSettings): void {
    const list = getStored<AppointmentSettings[]>(STORAGE_KEYS.APPOINTMENT_SETTINGS, initialAppointmentSettings);
    const idx = list.findIndex((s) => s.hospitalId === settings.hospitalId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...settings, updatedAt: new Date().toISOString().split('T')[0] };
    } else {
      list.push({ ...settings, updatedAt: new Date().toISOString().split('T')[0] });
    }
    setStored(STORAGE_KEYS.APPOINTMENT_SETTINGS, list);
    ApiService.saveAppointmentSettings({
      id: settings.id,
      hospital: settings.hospitalId,
      max_advance_booking_days: settings.maxAdvanceBookingDays,
      min_advance_booking_hours: settings.minAdvanceBookingHours,
      cancellation_deadline_hours: settings.cancellationDeadlineHours,
      rescheduling_deadline_hours: settings.reschedulingDeadlineHours,
      appointment_buffer_minutes: settings.appointmentBufferMinutes,
      allow_same_day_booking: settings.allowSameDayBooking,
    }).catch(() => {});
    this.logActivity(
      'Updated OPD Appointment Rules & Settings',
      `Advance window: ${settings.maxAdvanceBookingDays}d, Buffer: ${settings.appointmentBufferMinutes}m`,
      'hospital',
      'Admin',
      'Hospital Admin',
      settings.hospitalId
    );
  },


  // Doctors
  getDoctors(hospitalId?: string): Doctor[] {
    const LEGACY_MOCK_DOCTOR_IDS = [
      'DOC-hosp-1-101', 'DOC-hosp-1-102', 'DOC-hosp-1-103',
      'DOC-HOSP-001-101', 'DOC-HOSP-001-102', 'DOC-HOSP-001-103',
      'DOC-hosp-abc-101', 'DOC-hosp-abc-102', 'DOC-hosp-abc-103',
      'DOC-HOSP-ABC-CHN-101', 'DOC-HOSP-ABC-CHN-102', 'DOC-HOSP-ABC-CHN-103',
    ];
    const LEGACY_MOCK_DOCTOR_NAMES = [
      'dr. marcus vance', 'dr. helena rostova', 'dr. evelyn reed', 'dr. evelyn reed, md',
      'dr. julian hayes', 'dr. julian hayes, md'
    ];
    let list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors).filter(
      (d) => !LEGACY_MOCK_DOCTOR_IDS.includes(d.id) && !LEGACY_MOCK_DOCTOR_NAMES.includes((d.name || '').trim().toLowerCase())
    );
    if (hospitalId) {
      const matchHospital = (docHospId: string) =>
        docHospId === hospitalId ||
        (hospitalId === 'hosp-1' && docHospId === 'HOSP-001') ||
        (hospitalId === 'HOSP-001' && docHospId === 'hosp-1') ||
        (hospitalId === 'hosp-abc' && docHospId === 'HOSP-ABC-CHN') ||
        (hospitalId === 'HOSP-ABC-CHN' && docHospId === 'hosp-abc') ||
        (docHospId && hospitalId && docHospId.toLowerCase() === hospitalId.toLowerCase());

      return list.filter((d) => matchHospital(d.hospitalId));
    }
    return list;
  },

  getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find((d) => d.id === id);
  },

  saveDoctor(doctor: Doctor): { success: boolean; message?: string } {
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
    const idx = list.findIndex((d) => d.id === doctor.id);

    const normalizedEmail = (doctor.email || '').trim().toLowerCase();
    if (normalizedEmail) {
      const existingDoc = list.find(
        (d) => (d.email || '').trim().toLowerCase() === normalizedEmail && d.id !== doctor.id
      );
      if (existingDoc) {
        return {
          success: false,
          message: `Duplicate Email: A medical specialist with email "${doctor.email.trim()}" is already registered in the system.`,
        };
      }
    }

    if (idx < 0) {
      const hospital = this.getHospitals().find((h) => h.id === doctor.hospitalId);
      const plan = this.getPlanByTier(hospital?.planTier || 'trial');
      const hospitalDocs = list.filter((d) => d.hospitalId === doctor.hospitalId);
      if (hospitalDocs.length >= plan.maxDoctors) {
        return {
          success: false,
          message: `Subscription Limit Reached: Your hospital is on the "${plan.name}" plan which allows a maximum of ${plan.maxDoctors} doctors. Upgrade your plan to add more doctors.`,
        };
      }
    }

    if (idx >= 0) {
      list[idx] = doctor;
    } else {
      list.unshift(doctor);
    }
    setStored(STORAGE_KEYS.DOCTORS, list);

    // Unmark doctor as deleted if previously deleted
    const deletedDoctorIds = getStored<string[]>(STORAGE_KEYS.DELETED_DOCTORS, []);
    if (deletedDoctorIds.includes(doctor.id)) {
      setStored(
        STORAGE_KEYS.DELETED_DOCTORS,
        deletedDoctorIds.filter((did) => did !== doctor.id)
      );
    }

    this.logActivity(idx >= 0 ? 'Updated Doctor Profile' : 'Onboarded Medical Specialist', doctor.name, 'clinical', 'Admin', 'Hospital Admin', doctor.hospitalId);

    // Asynchronously synchronize doctor record with Django backend
    try {
      const payload = {
        id: doctor.id,
        hospital: doctor.hospitalId || 'HOSP-001',
        name: doctor.name,
        department: doctor.departmentName || (doctor as any).department || 'General OPD',
        department_name: doctor.departmentName || (doctor as any).department || 'General OPD',
        department_id: doctor.departmentId || '',
        specialization: doctor.specialization,
        phone: doctor.phone || '',
        email: (doctor.email || '').trim().toLowerCase(),
        qualifications: doctor.qualifications || '',
        experience_years: Number(doctor.experienceYears || 0),
        available_hours: doctor.availableHours || '',
        available_days: doctor.availableDays || [],
        opd_room_id: doctor.opdRoomId || '',
        opd_room_name: doctor.opdRoomName || doctor.roomNumber || '',
        room_number: doctor.roomNumber || doctor.opdRoomName || '',
        avatar_url: doctor.avatarUrl || '',
        consultation_fee: Number(doctor.consultationFee || 500),
        availability_status: doctor.status === 'active' ? 'Available' : 'Unavailable',
      };
      fetch(`${API_BASE_URL}/doctors/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {}

    // Bi-directional sync: If doctor has availableHours, synchronize with DoctorSchedule
    if (doctor.availableHours && doctor.availableHours.includes('-')) {
      const parts = doctor.availableHours.split('-').map((s) => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        const startTime = parts[0];
        const endTime = parts[1];
        const schedules = getStored<DoctorSchedule[]>(STORAGE_KEYS.DOCTOR_SCHEDULES, initialDoctorSchedules);
        const existingSched = schedules.find((s) => s.doctorId === doctor.id);
        if (existingSched) {
          if (existingSched.consultationStartTime !== startTime || existingSched.consultationEndTime !== endTime) {
            existingSched.consultationStartTime = startTime;
            existingSched.consultationEndTime = endTime;
            if (doctor.availableDays && doctor.availableDays.length > 0) {
              existingSched.workingDays = doctor.availableDays as any;
            }
            this.saveDoctorSchedule(existingSched, false);
          }
        } else {
          const newSched: DoctorSchedule = {
            id: `SCH-${doctor.id}`,
            hospitalId: doctor.hospitalId || 'hosp-1',
            doctorId: doctor.id,
            doctorName: doctor.name,
            departmentId: doctor.departmentId || '',
            departmentName: doctor.departmentName || '',
            opdRoomId: doctor.opdRoomId,
            opdRoomName: doctor.opdRoomName || doctor.roomNumber,
            workingDays: (doctor.availableDays && doctor.availableDays.length > 0)
              ? (doctor.availableDays as any)
              : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            consultationStartTime: startTime,
            consultationEndTime: endTime,
            slotDurationMinutes: 30,
            breaks: [],
            effectiveStartDate: '2026-01-01',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0],
          };
          this.saveDoctorSchedule(newSched, false);
        }
      }
    }

    window.dispatchEvent(new Event('pulse_storage_updated'));
    return { success: true };
  },

  deleteDoctor(id: string): void {
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
    const targetDoc = list.find((d) => d.id === id);
    const normalizedEmail = targetDoc?.email ? targetDoc.email.trim().toLowerCase() : '';

    // Mark as explicitly deleted so backend sync won't resurrect it
    const deletedDoctorIds = getStored<string[]>(STORAGE_KEYS.DELETED_DOCTORS, []);
    if (!deletedDoctorIds.includes(id)) {
      setStored(STORAGE_KEYS.DELETED_DOCTORS, [...deletedDoctorIds, id]);
    }

    // 1. Remove from doctors list
    const remainingDocs = list.filter((d) => d.id !== id);
    setStored(STORAGE_KEYS.DOCTORS, remainingDocs);

    // 2. Cascade delete login user account from pulse_users
    if (normalizedEmail) {
      const users = getStored<User[]>(STORAGE_KEYS.USERS, initialUsers);
      const remainingUsers = users.filter((u) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        if (uEmail === normalizedEmail && u.role === 'doctor') {
          return false;
        }
        return true;
      });
      setStored(STORAGE_KEYS.USERS, remainingUsers);
    }

    // 3. Cascade delete doctor schedules & unavailabilities
    const schedules = getStored<DoctorSchedule[]>(STORAGE_KEYS.DOCTOR_SCHEDULES, initialDoctorSchedules);
    const remainingSchedules = schedules.filter((s) => s.doctorId !== id);
    setStored(STORAGE_KEYS.DOCTOR_SCHEDULES, remainingSchedules);

    const unavail = getStored<DoctorUnavailablePeriod[]>(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, initialDoctorUnavailability);
    const remainingUnavail = unavail.filter((u) => u.doctorId !== id);
    setStored(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, remainingUnavail);

    if (targetDoc) {
      this.logActivity('Removed Medical Specialist', `${targetDoc.name} (${id})`, 'clinical', 'Admin', 'Hospital Admin', targetDoc.hospitalId);
    }

    // 4. Asynchronously notify Django backend
    try {
      fetch(`${API_BASE_URL}/doctors/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    window.dispatchEvent(new Event('pulse_storage_updated'));
  },

  // Staff
  getStaff(hospitalId?: string): Staff[] {
    const HARDCODED_STAFF_IDS = ['STF-101', 'STF-102', 'STF-103', 'STF-104', 'STF-105'];
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff)
      .filter((s) => !HARDCODED_STAFF_IDS.includes(s.id));
    if (hospitalId) {
      return list.filter((s) => this.matchHospitalId(s.hospitalId, hospitalId));
    }
    return list;
  },

  getStaffById(id: string): Staff | undefined {
    return this.getStaff().find((s) => s.id === id);
  },

  saveStaff(staff: Staff): { success: boolean; message?: string } {
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    const idx = list.findIndex((s) => s.id === staff.id);

    const normalizedEmail = (staff.email || '').trim().toLowerCase();
    if (normalizedEmail) {
      const existingStaff = list.find(
        (s) => (s.email || '').trim().toLowerCase() === normalizedEmail && s.id !== staff.id
      );
      if (existingStaff) {
        return {
          success: false,
          message: `Duplicate Email: A staff member with email "${staff.email.trim()}" is already registered in the system.`,
        };
      }
    }

    const hospital = this.getHospitals().find((h) => h.id === staff.hospitalId);
    const tier = hospital?.planTier || 'trial';

    if (staff.role === 'Pharmacist' && !isCapabilityAllowedForTier(tier, 'pharmacy_stock')) {
      return {
        success: false,
        message: 'Plan Restriction: Hospital Pharmacist role cannot be onboarded because Pharmacy & Stock is locked on your current subscription plan. Upgrade to Professional Hospital to enable this role.',
      };
    }
    if (staff.role === 'Lab Technician' && !isCapabilityAllowedForTier(tier, 'laboratory_diagnostics')) {
      return {
        success: false,
        message: 'Plan Restriction: Lab Technician role cannot be onboarded because Laboratory & Diagnostics is locked on your current subscription plan. Upgrade to Professional Hospital to enable this role.',
      };
    }
    if (staff.role === 'Ambulance Driver' && !isCapabilityAllowedForTier(tier, 'ambulance_emergency')) {
      return {
        success: false,
        message: 'Plan Restriction: Ambulance Driver role cannot be onboarded because Ambulance & Emergency is locked on your current subscription plan. Upgrade to Professional Hospital to enable this role.',
      };
    }

    if (idx < 0) {
      const plan = this.getPlanByTier(tier);
      const hospitalStaff = list.filter((s) => s.hospitalId === staff.hospitalId);
      if (hospitalStaff.length >= plan.maxStaff) {
        return {
          success: false,
          message: `Subscription Limit Reached: Your hospital is on the "${plan.name}" plan which allows a maximum of ${plan.maxStaff} staff members. Upgrade your plan to add more staff.`,
        };
      }
    }

    if (idx >= 0) {
      list[idx] = staff;
    } else {
      list.unshift(staff);
    }
    setStored(STORAGE_KEYS.STAFF, list);

    try {
      const hospitalKey = staff.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/staff/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: staff.id,
          hospital: hospitalKey,
          name: staff.name,
          email: (staff.email || '').trim().toLowerCase(),
          phone: staff.phone || '',
          role: staff.role,
          system_role: staff.systemRole,
          department: staff.department,
          shift: staff.shift,
          joining_date: staff.joiningDate || null,
          status: staff.status || 'active',
          avatar_url: staff.avatarUrl || null,
        }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
  },

  deleteStaff(id: string): void {
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    const targetStaff = list.find((s) => s.id === id);
    const remainingStaff = list.filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.STAFF, remainingStaff);

    if (targetStaff && targetStaff.email) {
      const normalizedEmail = targetStaff.email.trim().toLowerCase();
      const users = this.getUsers().filter((u) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        if (uEmail === normalizedEmail && (u.role === targetStaff.systemRole || u.hospitalId === targetStaff.hospitalId)) {
          return false;
        }
        return true;
      });
      setStored(STORAGE_KEYS.USERS, users);
    }

    try {
      fetch(`${API_BASE_URL}/staff/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  // Departments
    getDepartments(hospitalId?: string): Department[] {
    let list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    if (hospitalId) {
      const matchHospital = (deptHospId: string) =>
        deptHospId === hospitalId ||
        (hospitalId === 'hosp-1' && deptHospId === 'HOSP-001') ||
        (hospitalId === 'HOSP-001' && deptHospId === 'hosp-1') ||
        (deptHospId && deptHospId.toLowerCase() === hospitalId.toLowerCase());

      return list.filter((d) => matchHospital(d.hospitalId));
    }
    return list;
  },


  getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find((d) => d.id === id);
  },

  saveDepartment(dept: Department): void {
    const list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const idx = list.findIndex((d) => d.id === dept.id);
    if (idx >= 0) {
      list[idx] = dept;
    } else {
      list.unshift(dept);
    }
    setStored(STORAGE_KEYS.DEPARTMENTS, list);

    try {
      const hospitalKey = dept.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/departments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: dept.id,
          hospital: hospitalKey,
          name: dept.name,
          code: dept.code,
          head_doctor_id: dept.headDoctorId || null,
          head_doctor_name: dept.headDoctorName || null,
          description: dept.description || '',
          phone_extension: dept.phoneExtension || '',
          status: dept.status || 'active',
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  deleteDepartment(id: string): void {
    let list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    list = list.filter((d) => d.id !== id);
    setStored(STORAGE_KEYS.DEPARTMENTS, list);
    this.logActivity('Deleted Department', `Department ID: ${id}`, 'hospital', 'Admin', 'Hospital Admin');

    try {
      fetch(`${API_BASE_URL}/departments/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  clearDepartments(hospitalId?: string): void {
    if (hospitalId) {
      let list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
      list = list.filter((d) => d.hospitalId !== hospitalId);
      setStored(STORAGE_KEYS.DEPARTMENTS, list);
    } else {
      setStored(STORAGE_KEYS.DEPARTMENTS, []);
    }
    this.logActivity('Purged Departments', `All departments cleared for hospital: ${hospitalId || 'All'}`, 'hospital', 'Admin', 'Hospital Admin');
  },

  // OPD Rooms / Chambers
  getOPDRooms(hospitalId?: string): OPDRoom[] {
    const list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
    if (hospitalId) {
      return list.filter((r) => this.matchHospitalId(r.hospitalId, hospitalId));
    }
    return list;
  },

  getOPDRoomById(id: string): OPDRoom | undefined {
    return this.getOPDRooms().find((r) => r.id === id);
  },

  saveOPDRoom(room: OPDRoom): void {
    const list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
    const idx = list.findIndex((r) => r.id === room.id);
    if (idx >= 0) {
      list[idx] = room;
    } else {
      list.unshift(room);
    }
    setStored(STORAGE_KEYS.OPD_ROOMS, list);
    this.logActivity(
      idx >= 0 ? 'Updated OPD Room' : 'Created OPD Room / Chamber',
      `${room.name} (${room.code})`,
      'hospital',
      'Admin',
      'Hospital Admin',
      room.hospitalId
    );

    try {
      const hospitalKey = room.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/opd-rooms/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: room.id,
          hospital: hospitalKey,
          name: room.name,
          code: room.code,
          department_id: room.departmentId,
          department_name: room.departmentName,
          location: room.location,
          status: room.status,
          description: room.description || '',
          assigned_doctor_id: room.assignedDoctorId || null,
          assigned_doctor_name: room.assignedDoctorName || null,
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  deleteOPDRoom(id: string): void {
    let list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
    list = list.filter((r) => r.id !== id);
    setStored(STORAGE_KEYS.OPD_ROOMS, list);
    this.logActivity('Deleted OPD Room', `Room ID: ${id}`, 'hospital', 'Admin', 'Hospital Admin');

    try {
      fetch(`${API_BASE_URL}/opd-rooms/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  clearOPDRooms(hospitalId?: string): void {
    if (hospitalId) {
      let list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
      list = list.filter((r) => r.hospitalId !== hospitalId);
      setStored(STORAGE_KEYS.OPD_ROOMS, list);
    } else {
      setStored(STORAGE_KEYS.OPD_ROOMS, []);
    }
    this.logActivity('Purged OPD Rooms', `All OPD rooms cleared for hospital: ${hospitalId || 'All'}`, 'hospital', 'Admin', 'Hospital Admin');
  },

  updateOPDRoomStatus(id: string, status: OPDRoomStatus): void {
    const list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
    const room = list.find((r) => r.id === id);
    if (room) {
      room.status = status;
      setStored(STORAGE_KEYS.OPD_ROOMS, list);

      try {
        fetch(`${API_BASE_URL}/opd-rooms/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }).catch(() => {});
      } catch (e) {}
    }
  },

  // Wards, Beds & Admissions
  getWards(hospitalId?: string): Ward[] {
    const list = getStored<Ward[]>(STORAGE_KEYS.WARDS, initialWards);
    if (hospitalId) {
      return list.filter((w) => this.matchHospitalId(w.hospitalId, hospitalId));
    }
    return list;
  },

  saveWard(ward: Ward): void {
    const list = getStored<Ward[]>(STORAGE_KEYS.WARDS, initialWards);
    const idx = list.findIndex((w) => w.id === ward.id);
    if (idx >= 0) {
      list[idx] = ward;
    } else {
      list.unshift(ward);
    }
    setStored(STORAGE_KEYS.WARDS, list);
    this.logActivity('Saved Ward', `Ward ${ward.name} (${ward.wardType})`, 'hospital', 'Admin', 'Hospital Admin', ward.hospitalId);

    try {
      const hospitalKey = ward.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/wards/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: ward.id,
          hospital: hospitalKey,
          name: ward.name,
          ward_type: ward.wardType,
          floor: ward.floor,
          department_name: ward.departmentName,
          description: ward.description || '',
          daily_rate: Number(ward.dailyRate || 1000),
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  deleteWard(wardId: string): void {
    let list = getStored<Ward[]>(STORAGE_KEYS.WARDS, initialWards);
    list = list.filter((w) => w.id !== wardId);
    setStored(STORAGE_KEYS.WARDS, list);

    try {
      fetch(`${API_BASE_URL}/wards/${wardId}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  getBeds(hospitalId?: string, wardId?: string): Bed[] {
    let list = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    const admissions = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    const activeAdmissions = admissions.filter((a) => a.status === 'Active' || (a.status as string) === 'Admitted');

    let changed = false;
    for (const b of list) {
      if (!b.bedNumber) continue;
      const normBed = b.bedNumber.trim().toLowerCase();
      const adm = activeAdmissions.find(
        (a) =>
          a.bedNumber &&
          a.bedNumber.trim().toLowerCase() === normBed &&
          (!b.hospitalId || !a.hospitalId || this.matchHospitalId(b.hospitalId, a.hospitalId))
      );

      if (adm) {
        if (b.status !== 'Occupied' || b.currentPatientId !== adm.patientId) {
          b.status = 'Occupied';
          b.currentPatientId = adm.patientId;
          b.currentPatientName = adm.patientName;
          changed = true;
        }
      } else if (b.status === 'Occupied' && !b.currentPatientId) {
        b.status = 'Available';
        changed = true;
      }
    }

    if (changed) {
      setStored(STORAGE_KEYS.BEDS, list);
    }

    if (hospitalId) {
      list = list.filter((b) => this.matchHospitalId(b.hospitalId, hospitalId));
    }
    if (wardId) {
      list = list.filter((b) => b.wardId === wardId);
    }
    return list;
  },

  saveBed(bed: Bed): { success: boolean; message?: string } {
    const list = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    const idx = list.findIndex((b) => b.id === bed.id);

    // If adding a new bed, enforce subscription capacity limit
    if (idx < 0) {
      const hospital = this.getHospitals().find((h) => h.id === bed.hospitalId);
      const plan = this.getPlanByTier(hospital?.planTier || 'trial');
      const hospitalBeds = list.filter((b) => b.hospitalId === bed.hospitalId);
      if (hospitalBeds.length >= plan.maxBeds) {
        return {
          success: false,
          message: `Bed Limit Reached — Your current plan allows a maximum of ${plan.maxBeds} beds. Upgrade your subscription to add more beds.`,
        };
      }
    }

    if (idx >= 0) {
      list[idx] = bed;
    } else {
      list.unshift(bed);
    }
    setStored(STORAGE_KEYS.BEDS, list);

    try {
      const hospitalKey = bed.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/beds/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: bed.id,
          hospital: hospitalKey,
          ward_id: bed.wardId || null,
          ward_name: bed.wardName || '',
          bed_number: bed.bedNumber,
          ward_type: bed.wardType,
          floor: bed.floor,
          status: bed.status,
          current_patient_id: bed.currentPatientId || null,
          current_patient_name: bed.currentPatientName || null,
          daily_rate: Number(bed.dailyRate || 1000),
          notes: bed.notes || '',
        }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
  },

  batchSaveBeds(bedsToCreate: Bed[]): { success: boolean; createdCount: number; message?: string } {
    if (!bedsToCreate || bedsToCreate.length === 0) {
      return { success: true, createdCount: 0 };
    }
    const hospId = bedsToCreate[0].hospitalId;
    const hospital = this.getHospitals().find((h) => h.id === hospId);
    const plan = this.getPlanByTier(hospital?.planTier || 'trial');
    const currentList = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    const hospitalBeds = currentList.filter((b) => b.hospitalId === hospId);

    const availableSlots = Math.max(0, plan.maxBeds - hospitalBeds.length);
    if (availableSlots <= 0) {
      return {
        success: false,
        createdCount: 0,
        message: `Bed Limit Reached — Your current plan allows a maximum of ${plan.maxBeds} beds (${hospitalBeds.length}/${plan.maxBeds} in use). Upgrade your subscription to add more beds.`,
      };
    }

    const bedsAllowed = bedsToCreate.slice(0, availableSlots);
    const updatedList = [...bedsAllowed, ...currentList];
    setStored(STORAGE_KEYS.BEDS, updatedList);

    // Sync to backend asynchronously
    try {
      const hospitalKey = hospId || 'HOSP-001';
      for (const bed of bedsAllowed) {
        fetch(`${API_BASE_URL}/beds/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
          body: JSON.stringify({
            id: bed.id,
            hospital: hospitalKey,
            ward_id: bed.wardId || null,
            ward_name: bed.wardName || '',
            bed_number: bed.bedNumber,
            ward_type: bed.wardType,
            floor: bed.floor,
            status: bed.status,
            current_patient_id: null,
            current_patient_name: null,
            daily_rate: Number(bed.dailyRate || 1000),
            notes: bed.notes || '',
          }),
        }).catch(() => {});
      }
    } catch (e) {}

    return {
      success: true,
      createdCount: bedsAllowed.length,
      message:
        bedsAllowed.length < bedsToCreate.length
          ? `Created ${bedsAllowed.length} beds. ${bedsToCreate.length - bedsAllowed.length} beds omitted to respect plan capacity limit (${plan.maxBeds}).`
          : undefined,
    };
  },

  deleteBed(bedId: string): void {
    let list = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    list = list.filter((b) => b.id !== bedId);
    setStored(STORAGE_KEYS.BEDS, list);

    try {
      fetch(`${API_BASE_URL}/beds/${bedId}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  updateBedStatus(bedId: string, status: BedStatus): void {
    const list = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    const bed = list.find((b) => b.id === bedId);
    if (bed) {
      bed.status = status;
      if (status === 'Available' || status === 'Maintenance') {
        bed.currentPatientId = undefined;
        bed.currentPatientName = undefined;
      }
      setStored(STORAGE_KEYS.BEDS, list);

      try {
        fetch(`${API_BASE_URL}/beds/${bedId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            current_patient_id: bed.currentPatientId || null,
            current_patient_name: bed.currentPatientName || null,
          }),
        }).catch(() => {});
      } catch (e) {}
    }
  },

  getAdmissions(hospitalId?: string, patientId?: string): Admission[] {
    let list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions)
      .filter((a) => a.id !== 'ADM-5001');
    if (hospitalId) {
      list = list.filter((a) => this.matchHospitalId(a.hospitalId, hospitalId));
    }
    if (patientId) {
      list = list.filter((a) => a.patientId === patientId);
    }
    return list;
  },

  saveAdmission(admission: Admission): void {
    const list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    const idx = list.findIndex((a) => a.id === admission.id);
    if (idx >= 0) {
      list[idx] = admission;
    } else {
      list.unshift(admission);
    }
    setStored(STORAGE_KEYS.ADMISSIONS, list);

    const allBeds = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    const normBedNumber = (admission.bedNumber || '').trim().toLowerCase();
    const bed =
      allBeds.find(
        (b) =>
          b.bedNumber &&
          b.bedNumber.trim().toLowerCase() === normBedNumber &&
          (!admission.hospitalId || !b.hospitalId || this.matchHospitalId(b.hospitalId, admission.hospitalId))
      ) || allBeds.find((b) => b.bedNumber && b.bedNumber.trim().toLowerCase() === normBedNumber);

    if (bed) {
      bed.status = 'Occupied';
      bed.currentPatientId = admission.patientId;
      bed.currentPatientName = admission.patientName;
      setStored(STORAGE_KEYS.BEDS, allBeds);

      try {
        fetch(`${API_BASE_URL}/beds/${bed.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Occupied',
            current_patient_id: admission.patientId,
            current_patient_name: admission.patientName,
          }),
        }).catch(() => {});
      } catch (e) {}
    }
    this.logActivity('Admitted Patient to Ward', `${admission.patientName} in ${admission.bedNumber}`, 'patient', 'Staff', 'Hospital User', admission.hospitalId);

    try {
      const hospitalKey = admission.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/admissions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: admission.id,
          hospital: hospitalKey,
          patient: admission.patientId,
          doctor: admission.doctorId,
          room_number: admission.wardType || 'General Ward',
          bed_number: admission.bedNumber,
          status: admission.status || 'Active',
          admission_date: admission.admissionDate,
          discharge_date: admission.dischargeDate || null,
          diagnosis: admission.reason || '',
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  dischargeAdmission(admissionId: string): void {
    const list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    const adm = list.find((a) => a.id === admissionId);
    if (adm) {
      adm.status = 'Discharged';
      adm.dischargeDate = new Date().toISOString().split('T')[0];
      setStored(STORAGE_KEYS.ADMISSIONS, list);

      const allBeds = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
      const normBedNumber = (adm.bedNumber || '').trim().toLowerCase();
      const bed =
        allBeds.find(
          (b) =>
            b.bedNumber &&
            b.bedNumber.trim().toLowerCase() === normBedNumber &&
            (!adm.hospitalId || !b.hospitalId || this.matchHospitalId(b.hospitalId, adm.hospitalId))
        ) || allBeds.find((b) => b.bedNumber && b.bedNumber.trim().toLowerCase() === normBedNumber);

      if (bed) {
        bed.status = 'Available';
        bed.currentPatientId = undefined;
        bed.currentPatientName = undefined;
        setStored(STORAGE_KEYS.BEDS, allBeds);

        try {
          fetch(`${API_BASE_URL}/beds/${bed.id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'Available',
              current_patient_id: null,
              current_patient_name: null,
            }),
          }).catch(() => {});
        } catch (e) {}
      }
      this.logActivity('Discharged Patient', `${adm.patientName} (${adm.id})`, 'patient', 'Staff', 'Hospital User', adm.hospitalId);

      try {
        fetch(`${API_BASE_URL}/admissions/${admissionId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Discharged',
            discharge_date: adm.dischargeDate,
          }),
        }).catch(() => {});
      } catch (e) {}
    }
  },

  updateNurseMonitoring(
    admissionId: string,
    data: {
      nurseNotes: string;
      nurseCondition: NurseConditionStatus;
      vitals: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        oxygenLevel?: number;
      };
      recordedBy?: string;
    }
  ): void {
    const list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    const adm = list.find((a) => a.id === admissionId);
    if (adm) {
      adm.nurseNotes = data.nurseNotes;
      adm.nurseCondition = data.nurseCondition;
      adm.nurseUpdatedBy = data.recordedBy || 'Ward Staff Nurse';
      adm.nurseVitals = {
        ...data.vitals,
        recordedAt: new Date().toISOString(),
        recordedBy: data.recordedBy || 'Ward Staff Nurse',
      };
      adm.nurseUpdatedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.ADMISSIONS, list);

      // Sync latest vitals to patient master record
      const patients = this.getPatients(adm.hospitalId);
      const pat = patients.find((p) => p.id === adm.patientId);
      if (pat) {
        pat.vitals = {
          bloodPressure: data.vitals.bloodPressure || pat.vitals?.bloodPressure || '120/80',
          heartRate: data.vitals.heartRate ?? pat.vitals?.heartRate ?? 75,
          temperature: data.vitals.temperature ?? pat.vitals?.temperature ?? 98.6,
          oxygenLevel: data.vitals.oxygenLevel ?? pat.vitals?.oxygenLevel ?? 98,
          weightKg: pat.vitals?.weightKg || 65,
          recordedAt: new Date().toISOString(),
          recordedBy: data.recordedBy || 'Ward Staff Nurse',
        };
        this.savePatient(pat);
      }

      this.logActivity(
        'Nurse Inpatient Update',
        `Logged vitals & condition "${data.nurseCondition}" for ${adm.patientName} (${adm.bedNumber})`,
        'patient',
        'Staff',
        data.recordedBy || 'Staff Nurse',
        adm.hospitalId
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pulse_storage_updated'));
      }
    }
  },

  initiateDoctorDischarge(
    admissionId: string,
    data: {
      dischargeSummary: string;
      dischargeAdvice?: string;
      dischargePrescriptions?: string;
      doctorId: string;
      doctorName: string;
    }
  ): { success: boolean; invoiceId?: string; totalAmount?: number } {
    const list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    const adm = list.find((a) => a.id === admissionId);
    if (!adm) return { success: false };

    adm.status = 'Discharge Initiated';
    adm.dischargeInitiatedAt = new Date().toISOString();
    adm.dischargeDoctorId = data.doctorId;
    adm.dischargeDoctorName = data.doctorName;
    adm.dischargeSummary = data.dischargeSummary;
    adm.dischargeAdvice = data.dischargeAdvice;
    adm.dischargePrescriptions = data.dischargePrescriptions;
    adm.billingStatus = 'Pending';

    // Calculate Inpatient Stay Cost and create Inpatient Billing Invoice
    const bed = this.getBeds(adm.hospitalId).find((b) => b.bedNumber === adm.bedNumber);
    const dailyRate = bed?.dailyRate || 1500;
    const admissionDate = new Date(adm.admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
    const daysStayed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const bedChargeTotal = daysStayed * dailyRate;
    const nursingChargeTotal = daysStayed * 250;
    const doctorRoundingTotal = daysStayed * 500;
    const subtotal = bedChargeTotal + nursingChargeTotal + doctorRoundingTotal;
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + taxAmount;
    const depositPaid = Number(adm.initialDeposit) || 0;
    const balanceDue = Math.max(0, totalAmount - depositPaid);

    const invId = `INV-IPD-${Date.now().toString().slice(-6)}`;
    adm.invoiceId = invId;
    adm.finalBilledAmount = totalAmount;
    adm.finalPaidAmount = depositPaid;

    const newInvoice: Invoice = {
      id: invId,
      hospitalId: adm.hospitalId,
      patientId: adm.patientId,
      patientName: adm.patientName,
      patientPhone: '9876543210',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      billingCategory: 'Hospital Service',
      encounterType: 'IPD',
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      departmentName: adm.departmentName,
      paymentType: 'Self Pay',
      items: [
        {
          id: `ITEM-BED-${Date.now()}-1`,
          description: `Inpatient Bed & Ward Charges (${daysStayed} Day${daysStayed > 1 ? 's' : ''} in ${adm.wardType} - ${adm.bedNumber})`,
          category: 'Bed Charge',
          quantity: daysStayed,
          unitPrice: dailyRate,
          total: bedChargeTotal,
        },
        {
          id: `ITEM-NURSE-${Date.now()}-2`,
          description: `24/7 Ward Nursing Care & Telemetry Monitoring (${daysStayed} Day${daysStayed > 1 ? 's' : ''})`,
          category: 'Nursing',
          quantity: daysStayed,
          unitPrice: 250,
          total: nursingChargeTotal,
        },
        {
          id: `ITEM-DOC-${Date.now()}-3`,
          description: `Attending Specialist Daily Inpatient Rounds (${daysStayed} Day${daysStayed > 1 ? 's' : ''})`,
          category: 'Consultation',
          quantity: daysStayed,
          unitPrice: 500,
          total: doctorRoundingTotal,
        },
      ],
      subtotal,
      taxRate: 5,
      taxAmount,
      discount: depositPaid > 0 ? depositPaid : 0,
      discountReason: depositPaid > 0 ? `Admission Advance Deposit Adjusted (₹${depositPaid})` : undefined,
      totalAmount: balanceDue,
      amountPaid: 0,
      status: balanceDue === 0 ? 'Paid' : 'Pending',
      cashierDesk: 'IPD Discharge Billing Counter',
      notes: `Final Inpatient Discharge Settlement for Bed ${adm.bedNumber}. Doctor: ${data.doctorName}. Initial deposit: ₹${depositPaid}. Balance due: ₹${balanceDue}.`,
      createdAt: new Date().toISOString(),
    };

    if (balanceDue === 0) {
      adm.billingStatus = 'Paid';
    }

    this.saveInvoice(newInvoice);
    setStored(STORAGE_KEYS.ADMISSIONS, list);

    this.logActivity(
      'Doctor Initiated Discharge',
      `Dr. ${data.doctorName} initiated medical discharge for ${adm.patientName} (${adm.bedNumber}). Inpatient Invoice ${invId} generated.`,
      'patient',
      'Doctor',
      data.doctorName,
      adm.hospitalId
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }

    return { success: true, invoiceId: invId, totalAmount: balanceDue };
  },

  settleInpatientBilling(admissionId: string, invoiceId?: string): void {
    const list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    const adm = list.find((a) => a.id === admissionId);
    if (adm) {
      adm.billingStatus = 'Paid';
      setStored(STORAGE_KEYS.ADMISSIONS, list);

      const targetInvId = invoiceId || adm.invoiceId;
      if (targetInvId) {
        const invoices = this.getInvoices(adm.hospitalId);
        const inv = invoices.find((i) => i.id === targetInvId);
        if (inv) {
          inv.status = 'Paid';
          inv.amountPaid = inv.totalAmount;
          inv.paymentMethod = 'UPI';
          this.saveInvoice(inv);
        }
      }

      this.logActivity(
        'Inpatient Billing Settled',
        `Final bill settled for ${adm.patientName} (${adm.bedNumber})`,
        'billing',
        'Staff',
        'Cashier Desk',
        adm.hospitalId
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pulse_storage_updated'));
      }
    }
  },

  completeFinalDischarge(
    admissionId: string,
    dischargedBy?: string,
    dischargedRole?: 'Nurse' | 'Receptionist' | 'Admin'
  ): { success: boolean; error?: string } {
    const list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    const adm = list.find((a) => a.id === admissionId);
    if (!adm) return { success: false, error: 'Admission record not found' };

    if (adm.status !== 'Discharge Initiated') {
      return {
        success: false,
        error: 'Doctor has not yet initiated medical discharge. Attending specialist must evaluate health and create discharge summary first.',
      };
    }

    if (adm.billingStatus === 'Pending') {
      return {
        success: false,
        error: 'Inpatient billing settlement is pending. Final bill must be settled at Cashier Desk before bed release.',
      };
    }

    adm.status = 'Discharged';
    adm.dischargeDate = new Date().toISOString().split('T')[0];
    adm.finalDischargedBy = dischargedBy || 'Hospital Staff';
    adm.finalDischargedRole = dischargedRole || 'Receptionist';
    setStored(STORAGE_KEYS.ADMISSIONS, list);

    // Release the bed
    const allBeds = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    const normBedNumber = (adm.bedNumber || '').trim().toLowerCase();
    const bed =
      allBeds.find(
        (b) =>
          b.bedNumber &&
          b.bedNumber.trim().toLowerCase() === normBedNumber &&
          (!adm.hospitalId || !b.hospitalId || this.matchHospitalId(b.hospitalId, adm.hospitalId))
      ) || allBeds.find((b) => b.bedNumber && b.bedNumber.trim().toLowerCase() === normBedNumber);

    if (bed) {
      bed.status = 'Available';
      bed.currentPatientId = undefined;
      bed.currentPatientName = undefined;
      setStored(STORAGE_KEYS.BEDS, allBeds);

      try {
        fetch(`${API_BASE_URL}/beds/${bed.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Available',
            current_patient_id: null,
            current_patient_name: null,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    // Update patient status to Discharged
    const patients = this.getPatients(adm.hospitalId);
    const pat = patients.find((p) => p.id === adm.patientId);
    if (pat) {
      pat.status = 'Discharged';
      pat.roomBedNumber = undefined;
      this.savePatient(pat);
    }

    this.logActivity(
      'Completed Final Discharge',
      `${adm.patientName} released from Bed ${adm.bedNumber} by ${dischargedRole} (${dischargedBy || 'Staff'})`,
      'patient',
      'Staff',
      dischargedBy || 'Staff',
      adm.hospitalId
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pulse_storage_updated'));
    }

    return { success: true };
  },

  // Billing & Invoices
  getInvoices(hospitalId?: string, patientId?: string): Invoice[] {
    let stored = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices)
      .filter((i) => i.id !== 'INV-2026-001');

    // Ensure seed invoices across all billing streams are present
    let needsUpdate = false;
    for (const init of initialInvoices) {
      if (!stored.some((i) => i.id === init.id)) {
        stored.push(init);
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      setStored(STORAGE_KEYS.INVOICES, stored);
    }

    let list = stored;
    if (hospitalId) {
      list = list.filter((i) => this.matchHospitalId(i.hospitalId, hospitalId));
    }
    if (patientId) {
      list = list.filter((i) => i.patientId === patientId);
    }
    return list;
  },

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id);
  },

  saveInvoice(invoice: Invoice): void {
    const list = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    const idx = list.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      list[idx] = invoice;
    } else {
      list.unshift(invoice);
    }
    setStored(STORAGE_KEYS.INVOICES, list);
    this.logActivity(idx >= 0 ? 'Updated Invoice Details' : 'Created Patient Invoice', `${invoice.id} for ${invoice.patientName} ($${invoice.totalAmount})`, 'billing', 'Marcus Sterling', 'Accountant', invoice.hospitalId);

    try {
      const hospitalKey = invoice.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/invoices/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: invoice.id,
          hospital: hospitalKey,
          patient: invoice.patientId,
          patient_name: invoice.patientName,
          total_amount: Number(invoice.totalAmount || 0),
          paid_amount: Number(invoice.amountPaid || 0),
          status: invoice.status || 'Pending',
          due_date: invoice.dueDate || new Date().toISOString().split('T')[0],
          items: invoice.items || [],
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  recordPayment(
    invoiceId: string,
    amount: number,
    method: Invoice['paymentMethod'],
    ref?: string,
    collectedBy?: string,
    cashierDesk?: string
  ): void {
    const list = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    const inv = list.find((i) => i.id === invoiceId);
    if (inv) {
      inv.amountPaid += amount;
      if (inv.amountPaid >= inv.totalAmount) {
        inv.status = 'Paid';
      } else {
        inv.status = 'Partially Paid';
      }
      inv.paymentMethod = method;
      inv.transactionRef = ref || `TXN-${Date.now()}`;
      if (collectedBy) {
        inv.collectedBy = collectedBy;
      }
      if (cashierDesk) {
        inv.cashierDesk = cashierDesk;
      }
      setStored(STORAGE_KEYS.INVOICES, list);
      this.logActivity(
        'Recorded Payment',
        `$${amount} for ${inv.id} (Collected by: ${collectedBy || 'Cashier Desk'})`,
        'billing',
        collectedBy || 'Marcus Sterling',
        'Accountant',
        inv.hospitalId
      );

      try {
        fetch(`${API_BASE_URL}/invoices/${invoiceId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paid_amount: inv.amountPaid,
            status: inv.status,
          }),
        }).catch(() => {});
      } catch (e) {}
    }
  },

  // Medicines
  getMedicines(hospitalId?: string): Medicine[] {
    let list = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines);

    // Purge any legacy mock medicines that were previously auto-seeded
    const MOCK_SKUS = new Set([
      'MED-AB-625',
      'MED-AN-650',
      'MED-AB-1000',
      'MED-GI-040',
      'MED-DM-102',
      'MED-CV-020',
      'MED-RS-100',
      'MED-BIO-100',
      'MED-EM-004',
      'MED-IV-500',
      'MED-AB-500',
      'MED-CV-040',
    ]);
    const mockBatches = [
      'BAT-2026-AUG01',
      'BAT-2026-DOL12',
      'BAT-2026-CEF88',
      'BAT-2026-PAN54',
      'BAT-2026-GLY33',
      'BAT-2026-LIP77',
      'BAT-2026-AST90',
      'BAT-2026-LAN09',
      'BAT-2026-EMS22',
      'BAT-2026-NS500',
      'BAT-2026-AZI66',
      'BAT-2026-TEL19',
    ];
    const cleaned = list.filter((m) => {
      if (m.sku && MOCK_SKUS.has(m.sku)) return false;
      if (m.batchNumber && mockBatches.includes(m.batchNumber)) return false;
      return true;
    });
    if (cleaned.length !== list.length) {
      setStored(STORAGE_KEYS.MEDICINES, cleaned);
      list = cleaned;
    }

    if (hospitalId) {
      return list.filter((m) => this.matchHospitalId(m.hospitalId, hospitalId));
    }
    return list;
  },

  dispensePrescription(
    prescriptionId: string,
    dispensedItems: { medicineId?: string; medicineName: string; quantity: number; unitPrice: number; batchNumber?: string }[],
    pharmacistName: string,
    hospitalId: string,
    paymentMethod: Invoice['paymentMethod'] = 'Cash',
    paymentStatus: Invoice['status'] = 'Paid'
  ): { success: boolean; invoiceId?: string; error?: string } {
    const rxList = this.getPrescriptions(undefined, hospitalId);
    const rx = rxList.find((p) => p.id === prescriptionId);
    if (!rx) {
      return { success: false, error: 'Prescription not found.' };
    }

    const allMeds = this.getMedicines(hospitalId);
    // Deduct stock for each dispensed item
    dispensedItems.forEach((it) => {
      const med = allMeds.find((m) => m.id === it.medicineId || m.name.toLowerCase() === it.medicineName.toLowerCase());
      if (med) {
        med.stockQuantity = Math.max(0, med.stockQuantity - it.quantity);
        if (med.stockQuantity === 0) {
          med.status = 'Out of Stock';
        } else if (med.stockQuantity <= med.minThreshold) {
          med.status = 'Low Stock';
        }
        this.saveMedicine(med);
      }
    });

    const subtotal = dispensedItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const hospSettings = this.getHospitalSettings(hospitalId);
    const gstRate = hospSettings.enableGSTBilling !== false ? (hospSettings.pharmacyGSTRate ?? 5) : 0;
    const taxAmount = Math.round(subtotal * (gstRate / 100));
    const totalAmount = subtotal + taxAmount;
    const invoiceId = `INV-PHARM-${Date.now().toString().slice(-6)}`;

    const invoice: Invoice = {
      id: invoiceId,
      hospitalId,
      patientId: rx.patientId,
      patientName: rx.patientName,
      patientPhone: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      items: dispensedItems.map((it, idx) => ({
        id: `ITEM-RX-${idx + 1}`,
        description: `${it.medicineName}${it.batchNumber ? ` [Batch: ${it.batchNumber}]` : ''}`,
        category: 'Pharmacy',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.quantity * it.unitPrice,
      })),
      subtotal,
      taxRate: gstRate,
      taxAmount,
      discount: 0,
      totalAmount,
      amountPaid: paymentStatus === 'Paid' ? totalAmount : 0,
      status: paymentStatus,
      paymentMethod,
      transactionRef: `TXN-RX-${Date.now().toString().slice(-6)}`,
      billingCategory: 'Pharmacy Service',
      prescriptionId,
      encounterType: 'Pharmacy',
      collectedBy: pharmacistName,
      cashierDesk: 'Pharmacy Cash Counter',
      notes: `Fulfilled doctor e-prescription #${prescriptionId} by Pharmacist ${pharmacistName}`,
      createdAt: new Date().toISOString(),
    };

    this.saveInvoice(invoice);

    // Update prescription
    rx.status = 'Dispensed';
    rx.dispensedAt = new Date().toISOString();
    rx.dispensedBy = pharmacistName;
    rx.dispensedInvoiceId = invoiceId;
    this.savePrescription(rx);

    this.logActivity(
      'Dispensed Doctor Prescription',
      `Prescription #${prescriptionId} for ${rx.patientName} dispensed (₹${totalAmount})`,
      'clinical',
      pharmacistName,
      'Pharmacist',
      hospitalId
    );

    window.dispatchEvent(new CustomEvent('pulse_storage_updated'));
    return { success: true, invoiceId };
  },

  createOTCPurchase(
    patientName: string,
    patientPhone: string,
    items: { medicineId: string; medicineName: string; quantity: number; unitPrice: number; batchNumber?: string }[],
    paymentMethod: Invoice['paymentMethod'],
    pharmacistName: string,
    hospitalId: string
  ): { success: boolean; invoiceId?: string; error?: string } {
    if (items.length === 0) {
      return { success: false, error: 'No items in cart' };
    }

    const allMeds = this.getMedicines(hospitalId);
    items.forEach((it) => {
      const med = allMeds.find((m) => m.id === it.medicineId || m.name.toLowerCase() === it.medicineName.toLowerCase());
      if (med) {
        med.stockQuantity = Math.max(0, med.stockQuantity - it.quantity);
        if (med.stockQuantity === 0) {
          med.status = 'Out of Stock';
        } else if (med.stockQuantity <= med.minThreshold) {
          med.status = 'Low Stock';
        }
        this.saveMedicine(med);
      }
    });

    const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const hospSettings = this.getHospitalSettings(hospitalId);
    const gstRate = hospSettings.enableGSTBilling !== false ? (hospSettings.pharmacyGSTRate ?? 5) : 0;
    const taxAmount = Math.round(subtotal * (gstRate / 100));
    const totalAmount = subtotal + taxAmount;
    const invoiceId = `INV-OTC-${Date.now().toString().slice(-6)}`;

    const invoice: Invoice = {
      id: invoiceId,
      hospitalId,
      patientId: `WALK-IN-${Date.now().toString().slice(-4)}`,
      patientName: patientName || 'Walk-in Customer',
      patientPhone: patientPhone || '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      items: items.map((it, idx) => ({
        id: `ITEM-OTC-${idx + 1}`,
        description: `${it.medicineName}${it.batchNumber ? ` [Batch: ${it.batchNumber}]` : ''}`,
        category: 'Pharmacy',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.quantity * it.unitPrice,
      })),
      subtotal,
      taxRate: gstRate,
      taxAmount,
      discount: 0,
      totalAmount,
      amountPaid: totalAmount,
      status: 'Paid',
      paymentMethod: paymentMethod || 'Cash',
      transactionRef: `TXN-OTC-${Date.now().toString().slice(-6)}`,
      billingCategory: 'Walk-in Pharmacy',
      encounterType: 'Pharmacy',
      collectedBy: pharmacistName,
      cashierDesk: 'Pharmacy Cash Counter',
      notes: `Walk-in OTC Pharmacy sale fulfilled by Pharmacist ${pharmacistName}`,
      createdAt: new Date().toISOString(),
    };

    this.saveInvoice(invoice);

    this.logActivity(
      'Completed Walk-in Pharmacy Sale',
      `OTC sale ${invoiceId} for ${invoice.patientName} (₹${totalAmount})`,
      'clinical',
      pharmacistName,
      'Pharmacist',
      hospitalId
    );

    window.dispatchEvent(new CustomEvent('pulse_storage_updated'));
    return { success: true, invoiceId };
  },

  quarantineMedicine(medicineId: string, reason: string, pharmacistName: string, hospitalId: string): void {
    const allMeds = this.getMedicines(hospitalId);
    const med = allMeds.find((m) => m.id === medicineId);
    if (med) {
      med.status = 'Quarantined';
      med.quarantineReason = reason || 'Expired / Damaged Batch quarantined from clinical dispensing';
      med.quarantinedAt = new Date().toISOString();
      this.saveMedicine(med);
      this.logActivity(
        'Quarantined Medicine Batch',
        `${med.name} (Batch: ${med.batchNumber}) quarantined: ${med.quarantineReason}`,
        'clinical',
        pharmacistName,
        'Pharmacist',
        hospitalId
      );
      window.dispatchEvent(new CustomEvent('pulse_storage_updated'));
    }
  },

  releaseFromQuarantine(medicineId: string, pharmacistName: string, hospitalId: string): void {
    const allMeds = this.getMedicines(hospitalId);
    const med = allMeds.find((m) => m.id === medicineId);
    if (med) {
      med.status = med.stockQuantity > med.minThreshold ? 'In Stock' : 'Low Stock';
      med.quarantineReason = undefined;
      med.quarantinedAt = undefined;
      this.saveMedicine(med);
      this.logActivity(
        'Released Medicine From Quarantine',
        `${med.name} (Batch: ${med.batchNumber}) returned to active clinical inventory`,
        'clinical',
        pharmacistName,
        'Pharmacist',
        hospitalId
      );
      window.dispatchEvent(new CustomEvent('pulse_storage_updated'));
    }
  },

  restockMedicine(
    medicineId: string,
    addedQty: number,
    newBatch?: string,
    newExpiry?: string,
    pharmacistName: string = 'Pharmacist'
  ): void {
    const allMeds = this.getMedicines();
    const med = allMeds.find((m) => m.id === medicineId);
    if (med) {
      med.stockQuantity += addedQty;
      if (newBatch) med.batchNumber = newBatch;
      if (newExpiry) med.expiryDate = newExpiry;
      med.status = med.stockQuantity > med.minThreshold ? 'In Stock' : 'Low Stock';
      this.saveMedicine(med);
      this.logActivity(
        'Restocked Medicine',
        `Added +${addedQty} units to ${med.name} (Total: ${med.stockQuantity})`,
        'clinical',
        pharmacistName,
        'Pharmacist',
        med.hospitalId
      );
      window.dispatchEvent(new CustomEvent('pulse_storage_updated'));
    }
  },

  saveMedicine(medicine: Medicine): void {
    const list = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines);
    const idx = list.findIndex((m) => m.id === medicine.id);
    if (idx >= 0) {
      list[idx] = medicine;
    } else {
      list.unshift(medicine);
    }
    setStored(STORAGE_KEYS.MEDICINES, list);

    try {
      const hospitalKey = medicine.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/medicines/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: medicine.id,
          hospital: hospitalKey,
          medicine_name: medicine.name,
          category: medicine.category || 'General',
          stock_quantity: Number(medicine.stockQuantity !== undefined ? medicine.stockQuantity : (medicine.stock || 0)),
          unit_price: Number(medicine.unitPrice !== undefined ? medicine.unitPrice : (medicine.price || 0)),
          expiry_date: medicine.expiryDate || new Date().toISOString().split('T')[0],
          status: medicine.status || 'In Stock',
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  deleteMedicine(id: string): void {
    const list = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines).filter((m) => m.id !== id);
    setStored(STORAGE_KEYS.MEDICINES, list);

    try {
      fetch(`${API_BASE_URL}/medicines/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  clearMedicines(hospitalId?: string): void {
    if (hospitalId) {
      const list = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines).filter((m) => m.hospitalId !== hospitalId);
      setStored(STORAGE_KEYS.MEDICINES, list);
    } else {
      setStored(STORAGE_KEYS.MEDICINES, []);
    }
    this.logActivity('Purged Pharmacy Stock', `All medicine items cleared for hospital: ${hospitalId || 'All'}`, 'hospital', 'Admin', 'Hospital Admin');
    window.dispatchEvent(new CustomEvent('pulse_storage_updated'));
  },

  purgePharmacyMockData(hospitalId?: string): void {
    if (hospitalId) {
      const allMeds = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines).filter((m) => !this.matchHospitalId(m.hospitalId, hospitalId));
      setStored(STORAGE_KEYS.MEDICINES, allMeds);
      const allRx = getStored<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions).filter((p) => !this.matchHospitalId(p.hospitalId, hospitalId));
      setStored(STORAGE_KEYS.PRESCRIPTIONS, allRx);
    } else {
      setStored(STORAGE_KEYS.MEDICINES, []);
      setStored(STORAGE_KEYS.PRESCRIPTIONS, []);
    }
    window.dispatchEvent(new CustomEvent('pulse_storage_updated'));
  },

  // Lab Catalog & Orders
  getLabCatalog(hospitalId?: string): LabTestCatalog[] {
    let list = getStored<LabTestCatalog[]>(STORAGE_KEYS.LAB_CATALOG, initialLabCatalog);
    if (hospitalId) {
      const hospTests = list.filter((t) => t.hospitalId === hospitalId);
      if (hospTests.length === 0) {
        const seeded: LabTestCatalog[] = DEFAULT_HOSPITAL_LAB_CATALOG.map((def, idx) => ({
          ...def,
          id: `TEST-${hospitalId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}-${idx + 1}`,
          hospitalId,
        }));
        list = [...list, ...seeded];
        setStored(STORAGE_KEYS.LAB_CATALOG, list);
        return seeded;
      }
      return hospTests;
    }
    return list;
  },

  saveLabTestCatalog(test: LabTestCatalog): void {
    const list = getStored<LabTestCatalog[]>(STORAGE_KEYS.LAB_CATALOG, initialLabCatalog);
    const idx = list.findIndex((t) => t.id === test.id);
    if (idx >= 0) {
      list[idx] = test;
    } else {
      list.unshift(test);
    }
    setStored(STORAGE_KEYS.LAB_CATALOG, list);
  },

  deleteLabTestCatalog(id: string): void {
    const list = getStored<LabTestCatalog[]>(STORAGE_KEYS.LAB_CATALOG, initialLabCatalog).filter((t) => t.id !== id);
    setStored(STORAGE_KEYS.LAB_CATALOG, list);
  },

  updateLabTestCatalogStatus(id: string, status: 'active' | 'inactive'): void {
    const list = getStored<LabTestCatalog[]>(STORAGE_KEYS.LAB_CATALOG, initialLabCatalog);
    const item = list.find((t) => t.id === id);
    if (item) {
      item.status = status;
      setStored(STORAGE_KEYS.LAB_CATALOG, list);
    }
  },

  getLabOrders(hospitalId?: string, patientId?: string): LabOrder[] {
    let list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders)
      .filter((l) => l.id !== 'LAB-8001');
    if (hospitalId) {
      list = list.filter((l) => this.matchHospitalId(l.hospitalId, hospitalId));
    }
    if (patientId) {
      list = list.filter((l) => l.patientId === patientId);
    }
    return list;
  },

  saveLabOrder(order: LabOrder): void {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    
    // Auto-generate barcode if missing
    if (!order.barcodeNumber) {
      order.barcodeNumber = `BC-LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const idx = list.findIndex((l) => l.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.unshift(order);
    }
    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity(idx >= 0 ? 'Updated Lab Diagnostic Report' : 'Ordered Lab Diagnostic', `${order.testName} for ${order.patientName}`, 'clinical', 'Liam Zhang', 'Lab Technician', order.hospitalId);

    try {
      const hospitalKey = order.hospitalId || 'HOSP-001';
      fetch(`${API_BASE_URL}/lab-orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hospital-Id': hospitalKey },
        body: JSON.stringify({
          id: order.id,
          hospital: hospitalKey,
          patient: order.patientId,
          doctor_name: order.doctorName || 'Doctor',
          test_name: order.testName,
          category: order.category || 'Clinical Pathology',
          status: order.status || 'Pending',
          order_date: order.orderDate || new Date().toISOString().split('T')[0],
          results: order.results || null,
          normal_range: order.normalRange || null,
        }),
      }).catch(() => {});
    } catch (e) {}
  },

  verifyLabOrder(orderId: string, pathologistName: string, pathologistNotes?: string): LabOrder | null {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const order = list.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = 'Verified';
    order.verifiedBy = pathologistName;
    order.verifiedDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (pathologistNotes) {
      order.pathologistNotes = pathologistNotes;
    }
    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity('Verified Lab Report', `${order.testName} for ${order.patientName} verified by Dr. ${pathologistName}`, 'clinical', pathologistName, 'Pathologist', order.hospitalId);
    return order;
  },

  rejectLabSample(orderId: string, reason: string, rejectedBy: string): LabOrder | null {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const order = list.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = 'Sample Rejected';
    order.rejectionReason = reason;
    order.rejectedBy = rejectedBy;
    order.rejectionDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity('Sample Rejected', `${order.testName} sample rejected: ${reason}`, 'clinical', rejectedBy, 'Lab Technician', order.hospitalId);
    return order;
  },

  getHospitalNurses(hospitalId?: string): { id: string; name: string; department?: string; shift?: string; phone?: string }[] {
    const staffList = this.getStaff(hospitalId);
    const nursesFromStaff = staffList
      .filter((s) => s.role === 'Nurse' || s.systemRole === 'nurse')
      .map((s) => ({
        id: s.id,
        name: s.name,
        department: s.department || 'Nursing Station',
        shift: s.shift || 'General',
        phone: s.phone,
      }));

    const userNurses = this.getUsers()
      .filter((u) => u.role === 'nurse' && (!hospitalId || this.matchHospitalId(u.hospitalId, hospitalId)))
      .map((u) => ({
        id: u.id,
        name: u.name || 'Staff Nurse',
        department: 'Nursing Station',
        shift: 'Day Shift',
        phone: u.phone,
      }));

    const combined: { id: string; name: string; department?: string; shift?: string; phone?: string }[] = [...nursesFromStaff];
    for (const un of userNurses) {
      if (!combined.some((n) => n.name.toLowerCase() === un.name.toLowerCase() || n.id === un.id)) {
        combined.push(un);
      }
    }

    if (combined.length === 0) {
      return [
        { id: 'NUR-101', name: 'Sister Sunita Rao', department: 'Critical Care / ICU', shift: 'Morning Shift' },
        { id: 'NUR-102', name: 'Sister Priya Sharma', department: 'Emergency & Trauma (ER)', shift: 'Day Shift' },
        { id: 'NUR-103', name: 'Nurse Rahul Verma', department: 'Inpatient General Ward', shift: 'Evening Shift' },
        { id: 'NUR-104', name: 'Sister Anjali Patel', department: 'Pediatrics & Neonatal Ward', shift: 'Rotational Shift' },
        { id: 'NUR-105', name: 'Nurse Mary Fernandes', department: 'Post-Operative Recovery', shift: 'Night Shift' },
      ];
    }

    return combined;
  },

  collectLabSampleByNurse(
    orderId: string,
    nurseName: string,
    prepConfirmed: boolean,
    prepNotes: string,
    tubeColor: string,
    barcode?: string,
    nurseId?: string
  ): LabOrder | null {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const order = list.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = 'Sample Collected';
    order.collectedByNurseName = nurseName;
    order.collectedByNurseId = nurseId || order.collectedByNurseId;
    order.patientPreparationConfirmed = prepConfirmed;
    order.patientPreparationNotes = prepNotes;
    order.tubeColor = tubeColor || order.tubeColor;
    order.barcodeNumber = barcode || order.barcodeNumber || `BC-LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    order.specimenCollectionDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity('Specimen Collected by Nurse', `${order.testName} for ${order.patientName} collected by Nurse ${nurseName}${nurseId ? ` (${nurseId})` : ''}`, 'clinical', nurseName, 'Nurse', order.hospitalId);
    return order;
  },

  receiveAndProcessLabSample(orderId: string, technicianName: string, instrument?: string): LabOrder | null {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const order = list.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = 'In Progress';
    order.receivedByTechnician = technicianName;
    order.sampleReceivedDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.analyzerInstrument = instrument || 'Automated Clinical Chemistry / Hematology Analyzer';

    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity('Sample Received by Lab Tech', `${order.testName} accessioned & loaded to analyzer by ${technicianName}`, 'clinical', technicianName, 'Lab Technician', order.hospitalId);
    return order;
  },

  reviewLabReportByDoctor(
    orderId: string,
    doctorId: string,
    doctorName: string,
    clinicalImpression: string,
    instructions: string
  ): LabOrder | null {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const order = list.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = 'Doctor Reviewed';
    order.reviewedByDoctorId = doctorId;
    order.reviewedByDoctorName = doctorName;
    order.doctorReviewDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.doctorClinicalImpression = clinicalImpression;
    order.doctorInstructions = instructions;
    order.nurseActionStatus = 'Pending';

    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity('Lab Report Reviewed by Doctor', `Dr. ${doctorName} reviewed ${order.testName} for ${order.patientName} & issued clinical directives`, 'clinical', doctorName, 'Doctor', order.hospitalId);
    return order;
  },

  executeDoctorInstructionByNurse(orderId: string, nurseName: string, executionNotes: string, nurseId?: string): LabOrder | null {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const order = list.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = 'Action Completed';
    order.executedByNurseName = nurseName;
    order.executedByNurseId = nurseId || order.executedByNurseId;
    order.nurseExecutionDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.nurseExecutionNotes = executionNotes;
    order.nurseActionStatus = 'Completed';

    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity('Doctor Instructions Followed by Nurse', `Nurse ${nurseName}${nurseId ? ` (${nurseId})` : ''} executed post-lab clinical directive for ${order.patientName}`, 'clinical', nurseName, 'Nurse', order.hospitalId);
    return order;
  },

  // Websites & Section Builder
  getWebsites(): HospitalWebsite[] {
    const deletedHospIds = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
    let websites = getStored<HospitalWebsite[]>(STORAGE_KEYS.WEBSITES, initialWebsites);
    websites = websites.filter((w) => !deletedHospIds.includes(w.hospitalId) && !deletedHospIds.includes(w.id));

    // Ensure all active hospitals have a corresponding website entry
    const hospitals = this.getHospitals();
    let hasNewWebsite = false;
    for (const hosp of hospitals) {
      const exists = websites.some((w) => w.hospitalId === hosp.id || w.id === `WEB-${hosp.id}`);
      if (!exists) {
        const slug = hosp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newWeb: HospitalWebsite = {
          id: `WEB-${hosp.id}`,
          hospitalId: hosp.id,
          hospitalName: hosp.name,
          subdomain: `${slug}.pulsecorehealth.com`,
          customDomain: `www.${slug}.org`,
          domainStatus: 'connected',
          status: 'published',
          published: true,
          templateId: 'premium-healthcare',
          theme: 'Modern Teal',
          primaryColor: '#0d9488',
          secondaryColor: '#0f766e',
          heroTitle: `Welcome to ${hosp.name}`,
          heroDescription: `Leading healthcare innovation and compassionate patient care in ${hosp.city}.`,
          lastDeployedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          monthlyVisitors: 120,
          onlineBookingEnabled: true,
          emergencyBannerEnabled: true,
        };
        websites.push(newWeb);
        hasNewWebsite = true;
      }
    }

    if (hasNewWebsite) {
      setStored(STORAGE_KEYS.WEBSITES, websites);
    }

    return websites;
  },

  getWebsiteByHospitalId(hospitalId: string): HospitalWebsite | undefined {
    return this.getWebsites().find((w) => this.matchHospitalId(w.hospitalId, hospitalId));
  },

  getWebsiteByDomainOrSlug(identifier: string): HospitalWebsite | undefined {
    const clean = identifier.toLowerCase().trim();
    const cleanNoHyphen = clean.replace(/[^a-z0-9]/g, '');
    return this.getWebsites().find((w) => {
      const hId = w.hospitalId.toLowerCase();
      const sub = w.subdomain.toLowerCase();
      const custom = (w.customDomain || '').toLowerCase();
      const hNameClean = w.hospitalName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        hId === clean ||
        sub.includes(clean) ||
        sub.replace(/[^a-z0-9]/g, '').includes(cleanNoHyphen) ||
        custom.includes(clean) ||
        hNameClean === cleanNoHyphen ||
        hNameClean.includes(cleanNoHyphen)
      );
    });
  },

  saveWebsite(website: HospitalWebsite): void {
    const list = this.getWebsites();
    const isPublished = website.status === 'published' || website.published === true;
    const sanitizedWeb: HospitalWebsite = {
      ...website,
      status: isPublished ? 'published' : 'draft',
      published: isPublished,
    };

    const idx = list.findIndex((w) => w.id === sanitizedWeb.id || w.hospitalId === sanitizedWeb.hospitalId);
    if (idx >= 0) {
      list[idx] = sanitizedWeb;
    } else {
      list.unshift(sanitizedWeb);
    }
    setStored(STORAGE_KEYS.WEBSITES, list);

    if (sanitizedWeb.logoUrl && sanitizedWeb.hospitalId) {
      const hospitals = this.getHospitals();
      const hosp = hospitals.find((h) => h.id === sanitizedWeb.hospitalId);
      if (hosp) {
        hosp.logoUrl = sanitizedWeb.logoUrl;
        hosp.image = sanitizedWeb.logoUrl;
        setStored(STORAGE_KEYS.HOSPITALS, hospitals);
      }
    }

    // Background sync to Django backend
    try {
      const backendPayload = {
        id: sanitizedWeb.id,
        hospital: sanitizedWeb.hospitalId,
        subdomain: sanitizedWeb.subdomain,
        custom_domain: sanitizedWeb.customDomain,
        theme: sanitizedWeb.theme,
        hero_title: sanitizedWeb.heroTitle,
        hero_description: sanitizedWeb.heroDescription,
        published: sanitizedWeb.published,
      };
      fetch(`${API_BASE_URL}/websites/${sanitizedWeb.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      }).then((res) => {
        if (!res.ok) {
          fetch(`${API_BASE_URL}/websites/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendPayload),
          }).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {}
  },

  toggleWebsitePublish(identifier: string): boolean {
    const websites = this.getWebsites();
    const web = websites.find((w) => w.id === identifier || w.hospitalId === identifier);
    if (web) {
      const nextPublished = !(web.status === 'published' || web.published === true);
      web.published = nextPublished;
      web.status = nextPublished ? 'published' : 'draft';
      if (nextPublished) {
        web.lastDeployedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      }
      this.saveWebsite(web);
      this.logActivity(
        nextPublished ? 'Published Hospital Website Portal' : 'Unpublished Hospital Website (Draft Mode)',
        web.hospitalName,
        'hospital'
      );
      return nextPublished;
    }
    return false;
  },

  deleteWebsite(id: string): void {
    const list = this.getWebsites().filter((w) => w.id !== id && w.hospitalId !== id);
    setStored(STORAGE_KEYS.WEBSITES, list);
    this.logActivity('Deleted Hospital Website Portal', id, 'hospital');

    try {
      fetch(`${API_BASE_URL}/websites/${id}/`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  getWebsiteSections(hospitalId: string): WebsiteSection[] {
    const allSections = getStored<Record<string, WebsiteSection[]>>('pulse_website_sections', initialWebsiteSections);
    let list = allSections[hospitalId] || initialWebsiteSections[hospitalId] || [];

    // Self-healing: If list is empty or only contains branches, restore full 10 default sections
    if (!list || list.length < 3) {
      const hosp = this.getHospitalById(hospitalId);
      const defaults = generateDefaultWebsiteSections(hospitalId, hosp?.name || 'Medical Center');

      // Preserve any custom branch settings if present
      const existingBranch = list?.find((s) => s.sectionType === 'branches');
      if (existingBranch) {
        list = defaults.map((s) => (s.sectionType === 'branches' ? existingBranch : s));
      } else {
        list = defaults;
      }
      allSections[hospitalId] = list;
      setStored('pulse_website_sections', allSections);

      // Persist self-healed defaults to backend database
      try {
        fetch(`${API_BASE_URL}/website-sections/bulk_save/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hospital_id: hospitalId, sections: list }),
        }).catch(() => {});
      } catch (e) {}
    } else if (!list.some((s) => s.sectionType === 'branches')) {
      const hosp = this.getHospitalById(hospitalId);
      const defaults = generateDefaultWebsiteSections(hospitalId, hosp?.name || 'Medical Center');
      const branchSec = defaults.find((s) => s.sectionType === 'branches');
      if (branchSec) {
        list = [...list, branchSec].sort((a, b) => a.displayOrder - b.displayOrder);
        allSections[hospitalId] = list;
        setStored('pulse_website_sections', allSections);
      }
    }

    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  saveWebsiteSections(hospitalId: string, sections: WebsiteSection[]): void {
    const allSections = getStored<Record<string, WebsiteSection[]>>('pulse_website_sections', initialWebsiteSections);
    allSections[hospitalId] = sections;
    setStored('pulse_website_sections', allSections);

    // Sync to MySQL Database
    try {
      fetch(`${API_BASE_URL}/website-sections/bulk_save/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId, sections }),
      }).catch(() => {});
    } catch (e) {}
  },

  // Patient Testimonials
  getTestimonials(hospitalId?: string): PatientTestimonial[] {
    const HARDCODED_TESTIMONIAL_IDS = ['TEST-001', 'TEST-002', 'TEST-003', 'TEST-004'];
    const list = getStored<PatientTestimonial[]>(STORAGE_KEYS.TESTIMONIALS, initialTestimonials)
      .filter((t) => !HARDCODED_TESTIMONIAL_IDS.includes(t.id));
    if (hospitalId) {
      return list.filter((t) => t.hospitalId === hospitalId);
    }
    return list;
  },

  saveTestimonial(testimonial: PatientTestimonial): void {
    const list = getStored<PatientTestimonial[]>(STORAGE_KEYS.TESTIMONIALS, initialTestimonials);
    const idx = list.findIndex((t) => t.id === testimonial.id);
    if (idx >= 0) {
      list[idx] = testimonial;
    } else {
      list.unshift(testimonial);
    }
    setStored(STORAGE_KEYS.TESTIMONIALS, list);
    this.logActivity(idx >= 0 ? 'Updated Patient Testimonial' : 'Added Patient Review', testimonial.patientName, 'clinical', 'Hospital Admin', 'Hospital User', testimonial.hospitalId);
  },

  deleteTestimonial(id: string): void {
    const list = getStored<PatientTestimonial[]>(STORAGE_KEYS.TESTIMONIALS, initialTestimonials).filter((t) => t.id !== id);
    setStored(STORAGE_KEYS.TESTIMONIALS, list);
  },

  // Settings
  getPlatformSettings(): PlatformSettings {
    return getStored(STORAGE_KEYS.PLATFORM_SETTINGS, initialPlatformSettings);
  },

  savePlatformSettings(settings: PlatformSettings): void {
    setStored(STORAGE_KEYS.PLATFORM_SETTINGS, settings);
    if (settings.allowTrialDays) {
      const plans = getStored<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, initialPlans);
      const trialPlan = plans.find((p) => p.tier === 'trial');
      if (trialPlan) {
        trialPlan.trialDays = settings.allowTrialDays;
        trialPlan.name = `${settings.allowTrialDays}-Day Free Trial`;
        trialPlan.tagline = `Zero-cost ${settings.allowTrialDays}-day full platform trial provisioned automatically on hospital registration.`;
        setStored(STORAGE_KEYS.PLANS, plans);
      }
    }
    this.logActivity('Updated Global Platform Settings', 'Branding & Security Preferences', 'system');
  },

  getHospitalSettings(hospitalId: string): HospitalSettings {
    const all = getStored<Record<string, HospitalSettings>>(STORAGE_KEYS.HOSPITAL_SETTINGS, {});
    const normHospId = hospitalId || 'HOSP-001';
    if (all && all[normHospId]) {
      const stored = all[normHospId];
      return {
        ...initialHospitalSettings,
        ...stored,
        enableGSTBilling: stored.enableGSTBilling !== undefined ? stored.enableGSTBilling : true,
        defaultGSTRate: stored.defaultGSTRate !== undefined ? stored.defaultGSTRate : 5,
        pharmacyGSTRate: stored.pharmacyGSTRate !== undefined ? stored.pharmacyGSTRate : 5,
        consultationGSTRate: stored.consultationGSTRate !== undefined ? stored.consultationGSTRate : 0,
        labDiagnosticGSTRate: stored.labDiagnosticGSTRate !== undefined ? stored.labDiagnosticGSTRate : 5,
        ipdRoomGSTRate: stored.ipdRoomGSTRate !== undefined ? stored.ipdRoomGSTRate : 5,
        gstType: stored.gstType || 'CGST_SGST',
      };
    }
    const hosp = this.getHospitalById(normHospId);
    return {
      ...initialHospitalSettings,
      hospitalId: normHospId,
      hospitalName: hosp?.name || 'Hospital Center',
      email: hosp?.email || 'contact@hospital.org',
      address: hosp?.address || 'Main Campus',
      receptionPhone: hosp?.phone || '+1 (555) 019-2831',
      emergencyHelpline: '+1 (555) 911-0000',
      taxRegistrationNumber: `EIN-84-${normHospId.replace(/[^0-9]/g, '').padStart(7, '9021948')}`,
    };
  },

  saveHospitalSettings(settings: HospitalSettings): void {
    const all = getStored<Record<string, HospitalSettings>>(STORAGE_KEYS.HOSPITAL_SETTINGS, {});
    const normHospId = settings.hospitalId || 'HOSP-001';
    all[normHospId] = settings;
    setStored(STORAGE_KEYS.HOSPITAL_SETTINGS, all);
    this.logActivity('Updated Hospital Settings Profile', settings.hospitalName, 'system', 'Admin', 'Hospital Admin', settings.hospitalId);
  },

  // ===================================
  // AMBULANCE & FLEET SERVICES
  // ===================================

  getAmbulances(hospitalId?: string): Ambulance[] {
    const HARDCODED_AMB_IDS = ['AMB-101', 'AMB-102', 'AMB-103', 'AMB-104', 'AMB-201'];
    const list = getStored<Ambulance[]>(STORAGE_KEYS.AMBULANCES, initialAmbulances)
      .filter((a) => !HARDCODED_AMB_IDS.includes(a.id));
    if (hospitalId) {
      return list.filter((a) => this.matchHospitalId(a.hospitalId, hospitalId));
    }
    return list;
  },

  getAmbulanceById(id: string): Ambulance | undefined {
    return this.getAmbulances().find((a) => a.id === id);
  },

  saveAmbulance(ambulance: Ambulance): void {
    const list = getStored<Ambulance[]>(STORAGE_KEYS.AMBULANCES, initialAmbulances);
    const idx = list.findIndex((a) => a.id === ambulance.id);
    if (idx >= 0) {
      list[idx] = ambulance;
    } else {
      list.unshift(ambulance);
    }
    setStored(STORAGE_KEYS.AMBULANCES, list);
    this.logActivity(idx >= 0 ? 'Updated Ambulance Specs' : 'Enrolled Emergency Ambulance', `${ambulance.regNumber} (${ambulance.type})`, 'ambulance', 'Fleet Admin', 'Operations', ambulance.hospitalId);
  },

  deleteAmbulance(id: string): void {
    const amb = this.getAmbulanceById(id);
    const list = getStored<Ambulance[]>(STORAGE_KEYS.AMBULANCES, initialAmbulances).filter((a) => a.id !== id);
    setStored(STORAGE_KEYS.AMBULANCES, list);
    if (amb) {
      this.logActivity('Decommissioned Ambulance', amb.regNumber, 'ambulance', 'Fleet Admin', 'Operations', amb.hospitalId);
    }
  },

  // Ambulance Drivers
  getAmbulanceDrivers(hospitalId?: string): AmbulanceDriver[] {
    const HARDCODED_DRV_IDS = ['DRV-201', 'DRV-202', 'DRV-203'];
    const list = getStored<AmbulanceDriver[]>(STORAGE_KEYS.AMBULANCE_DRIVERS, initialAmbulanceDrivers)
      .filter((d) => !HARDCODED_DRV_IDS.includes(d.id));
    if (hospitalId) {
      return list.filter((d) => this.matchHospitalId(d.hospitalId, hospitalId));
    }
    return list;
  },

  getAmbulanceDriverById(id: string): AmbulanceDriver | undefined {
    return this.getAmbulanceDrivers().find((d) => d.id === id);
  },

  saveAmbulanceDriver(driver: AmbulanceDriver): void {
    const list = getStored<AmbulanceDriver[]>(STORAGE_KEYS.AMBULANCE_DRIVERS, initialAmbulanceDrivers);
    const idx = list.findIndex((d) => d.id === driver.id);
    if (idx >= 0) {
      list[idx] = driver;
    } else {
      list.unshift(driver);
    }
    setStored(STORAGE_KEYS.AMBULANCE_DRIVERS, list);
    ApiService.saveAmbulanceDriver({
      id: driver.id,
      hospital: driver.hospitalId || 'hosp-1',
      name: driver.name,
      phone: driver.phone,
      license_number: driver.licenseNumber,
      assigned_ambulance_reg: driver.assignedAmbulanceReg || '',
      availability_status: driver.availabilityStatus || 'On Duty & Available',
      completed_trips: driver.completedTrips || 0,
    }).catch(() => {});
  },

  deleteAmbulanceDriver(id: string): void {
    const list = getStored<AmbulanceDriver[]>(STORAGE_KEYS.AMBULANCE_DRIVERS, initialAmbulanceDrivers).filter((d) => d.id !== id);
    setStored(STORAGE_KEYS.AMBULANCE_DRIVERS, list);
    ApiService.deleteAmbulanceDriver(id).catch(() => {});
  },

  // Emergency Requests
  getEmergencyRequests(hospitalId?: string, patientId?: string): EmergencyRequest[] {
    const HARDCODED_EMR_IDS = ['EMR-7001', 'EMR-7002', 'EMR-7003'];
    let list = getStored<EmergencyRequest[]>(STORAGE_KEYS.EMERGENCY_REQUESTS, initialEmergencyRequests)
      .filter((r) => !HARDCODED_EMR_IDS.includes(r.id));
    if (hospitalId) {
      list = list.filter((r) => this.matchHospitalId(r.hospitalId, hospitalId));
    }
    if (patientId) {
      list = list.filter((r) => r.patientId === patientId);
    }
    return list;
  },

  getEmergencyRequestById(id: string): EmergencyRequest | undefined {
    return getStored<EmergencyRequest[]>(STORAGE_KEYS.EMERGENCY_REQUESTS, initialEmergencyRequests).find((r) => r.id === id);
  },

  saveEmergencyRequest(request: EmergencyRequest): void {
    const list = getStored<EmergencyRequest[]>(STORAGE_KEYS.EMERGENCY_REQUESTS, initialEmergencyRequests);
    const idx = list.findIndex((r) => r.id === request.id);
    if (idx >= 0) {
      list[idx] = request;
    } else {
      list.unshift(request);
    }
    setStored(STORAGE_KEYS.EMERGENCY_REQUESTS, list);
    ApiService.saveEmergencyRequest({
      id: request.id,
      hospital: request.hospitalId || 'hosp-1',
      patient_name: request.patientName,
      patient_phone: request.patientPhone || '',
      pickup_location: request.pickupLocation,
      destination_hospital: request.destinationHospital || 'Hospital Emergency',
      emergency_type: request.emergencyType || 'Critical Care',
      priority: request.priority || 'CRITICAL / CODE BLUE',
      status: request.status || 'Pending',
      assigned_driver: request.assignedDriverId || null,
      chief_complaint: request.chiefComplaint || '',
    }).catch(() => {});
    this.logActivity(idx >= 0 ? 'Updated Emergency Request' : 'Emergency 911 Dispatch Request', `${request.patientName} (${request.emergencyType})`, 'ambulance', 'Dispatch Desk', 'Emergency Team', request.hospitalId);
  },

  dispatchEmergency(requestId: string, ambulanceId: string, driverId: string): void {
    const requests = getStored<EmergencyRequest[]>(STORAGE_KEYS.EMERGENCY_REQUESTS, initialEmergencyRequests);
    const req = requests.find((r) => r.id === requestId);
    const amb = this.getAmbulanceById(ambulanceId);
    const drv = this.getAmbulanceDriverById(driverId);

    if (req && amb && drv) {
      req.status = 'Dispatched';
      req.assignedAmbulanceId = amb.id;
      req.assignedAmbulanceReg = amb.regNumber;
      req.assignedDriverId = drv.id;
      req.assignedDriverName = drv.name;
      req.driverPhone = drv.phone;
      req.dispatchTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setStored(STORAGE_KEYS.EMERGENCY_REQUESTS, requests);
      ApiService.dispatchEmergency(req.id, drv.id, amb.regNumber).catch(() => {});

      // Update Ambulance & Driver status
      amb.status = 'Dispatched';
      amb.assignedDriverId = drv.id;
      amb.assignedDriverName = drv.name;
      this.saveAmbulance(amb);

      drv.availabilityStatus = 'On Active Trip';
      drv.assignedAmbulanceId = amb.id;
      drv.assignedAmbulanceReg = amb.regNumber;
      this.saveAmbulanceDriver(drv);

      // Create or update trip record
      const trips = this.getAmbulanceTrips();
      const newTrip: AmbulanceTrip = {
        id: `TRP-${Date.now().toString().slice(-4)}`,
        requestId: req.id,
        hospitalId: req.hospitalId,
        ambulanceId: amb.id,
        ambulanceReg: amb.regNumber,
        driverId: drv.id,
        driverName: drv.name,
        patientName: req.patientName,
        patientPhone: req.patientPhone || req.callerPhone || '',
        pickupAddress: req.pickupLocation,
        destination: req.destinationHospital || req.destination || 'Hospital',
        status: 'Dispatched',
        startTime: req.dispatchTime,
        distanceKm: 8.5,
      };
      trips.unshift(newTrip);
      setStored(STORAGE_KEYS.AMBULANCE_TRIPS, trips);
    }
  },

  updateEmergencyStatus(requestId: string, status: EmergencyRequest['status'], notes?: string): void {
    const requests = getStored<EmergencyRequest[]>(STORAGE_KEYS.EMERGENCY_REQUESTS, initialEmergencyRequests);
    const req = requests.find((r) => r.id === requestId);
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (req) {
      req.status = status;
      if (notes) req.notes = notes;
      if (status === 'Patient Picked Up') req.pickupTime = currentTime;
      if (status === 'Arrived at Hospital') req.hospitalArrivalTime = currentTime;
      if (status === 'Completed') {
        req.completedTime = currentTime;
        // Release ambulance & driver
        if (req.assignedAmbulanceId) {
          const amb = this.getAmbulanceById(req.assignedAmbulanceId);
          if (amb) {
            amb.status = 'Available';
            this.saveAmbulance(amb);
          }
        }
        if (req.assignedDriverId) {
          const drv = this.getAmbulanceDriverById(req.assignedDriverId);
          if (drv) {
            drv.availabilityStatus = 'On Duty & Available';
            drv.completedTrips = (drv.completedTrips || 0) + 1;
            this.saveAmbulanceDriver(drv);
          }
        }
      }
      setStored(STORAGE_KEYS.EMERGENCY_REQUESTS, requests);

      // Synchronize active trip
      const trips = this.getAmbulanceTrips();
      const trip = trips.find((t) => t.requestId === requestId);
      if (trip) {
        trip.status = status;
        if (status === 'Patient Picked Up') trip.pickupTime = currentTime;
        if (status === 'Arrived at Hospital') trip.hospitalArrivalTime = currentTime;
        if (status === 'Completed') trip.endTime = currentTime;
        if (notes) trip.paramedicNotes = notes;
        setStored(STORAGE_KEYS.AMBULANCE_TRIPS, trips);
      }
    }
  },

  // Ambulance Trips
  getAmbulanceTrips(hospitalId?: string, driverId?: string): AmbulanceTrip[] {
    const HARDCODED_TRIP_IDS = ['TRP-9001', 'TRP-9002'];
    let list = getStored<AmbulanceTrip[]>(STORAGE_KEYS.AMBULANCE_TRIPS, initialAmbulanceTrips)
      .filter((t) => !HARDCODED_TRIP_IDS.includes(t.id));
    if (hospitalId) {
      list = list.filter((t) => this.matchHospitalId(t.hospitalId, hospitalId));
    }
    if (driverId) {
      list = list.filter((t) => t.driverId === driverId);
    }
    return list;
  },

  // Ambulance Maintenance
  getAmbulanceMaintenance(hospitalId?: string): AmbulanceMaintenance[] {
    const HARDCODED_MNT_IDS = ['MNT-301'];
    const list = getStored<AmbulanceMaintenance[]>(STORAGE_KEYS.AMBULANCE_MAINTENANCE, initialAmbulanceMaintenance)
      .filter((m) => !HARDCODED_MNT_IDS.includes(m.id));
    if (hospitalId) {
      return list.filter((m) => this.matchHospitalId(m.hospitalId, hospitalId));
    }
    return list;
  },

  saveAmbulanceMaintenance(maintenance: AmbulanceMaintenance): void {
    const list = getStored<AmbulanceMaintenance[]>(STORAGE_KEYS.AMBULANCE_MAINTENANCE, initialAmbulanceMaintenance);
    const idx = list.findIndex((m) => m.id === maintenance.id);
    if (idx >= 0) {
      list[idx] = maintenance;
    } else {
      list.unshift(maintenance);
    }
    setStored(STORAGE_KEYS.AMBULANCE_MAINTENANCE, list);
  },

  // CSV Export utility
  exportToCSV(filename: string, rows: Record<string, any>[]): void {
    if (!rows || !rows.length) {
      alert('No data available to export in the current view.');
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) => {
          return keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              if (typeof cell === 'object') {
                cell = JSON.stringify(cell);
              }
              cell = cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // ===================================
  // SALES CRM & LEAD MANAGEMENT
  // ===================================

  getSalesLeads(salesExecId?: string): SalesLead[] {
    const HARDCODED_LEAD_IDS = ['LEAD-1001', 'LEAD-1002', 'LEAD-1003', 'LEAD-1004', 'LEAD-1005'];
    const list = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads)
      .filter((l) => !HARDCODED_LEAD_IDS.includes(l.id));
    if (salesExecId) {
      return list.filter((l) => l.assignedSalesExecutiveId === salesExecId);
    }
    return list;
  },

  getSalesLeadById(id: string): SalesLead | undefined {
    return this.getSalesLeads().find((l) => l.id === id);
  },

  saveSalesLead(lead: SalesLead): void {
    const list = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads);
    const idx = list.findIndex((l) => l.id === lead.id);
    const updated = {
      ...lead,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    setStored(STORAGE_KEYS.SALES_LEADS, list);
    ApiService.saveSalesLead({
      id: lead.id,
      hospital_name: lead.hospitalName,
      contact_person: lead.contactPerson,
      designation: lead.designation,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      hospital_type: lead.hospitalType,
      bed_count: lead.bedCount,
      lead_source: lead.leadSource,
      interested_plan: lead.interestedPlan,
      status: lead.status,
      assigned_sales_executive_id: lead.assignedSalesExecutiveId,
      assigned_sales_executive_name: lead.assignedSalesExecutiveName,
      next_follow_up_date: lead.nextFollowUpDate || null,
      expected_decision_date: lead.expectedDecisionDate || null,
      notes: lead.notes || '',
    }).catch(() => {});
    this.logActivity(idx >= 0 ? 'Updated Lead Details' : 'Created New Sales Lead', `${lead.hospitalName} (${lead.contactPerson})`, 'system', lead.assignedSalesExecutiveName || 'Sales Executive', 'Sales Executive');
  },

  deleteSalesLead(id: string): void {
    const list = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads).filter((l) => l.id !== id);
    setStored(STORAGE_KEYS.SALES_LEADS, list);
    ApiService.deleteSalesLead(id).catch(() => {});
  },

  updateLeadStatus(leadId: string, status: SalesLead['status']): void {
    const list = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads);
    const lead = list.find((l) => l.id === leadId);
    if (lead) {
      const oldStatus = lead.status;
      lead.status = status;
      lead.updatedAt = new Date().toISOString().split('T')[0];
      setStored(STORAGE_KEYS.SALES_LEADS, list);
      ApiService.updateSalesLeadStatus(leadId, status).catch(() => {});

      this.logLeadActivity({
        id: `ACT-${Date.now().toString().slice(-4)}`,
        leadId,
        type: status === 'Converted' ? 'Meeting' : 'Follow-up',
        description: `Lead status updated from ${oldStatus} to ${status}`,
        createdBy: lead.assignedSalesExecutiveName || 'Sales Executive',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
    }
  },

  convertLeadToCustomer(leadId: string, convertedBy: User): { success: boolean; hospitalId: string; customerId: string; message: string } {
    const leads = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads);
    const lead = leads.find((l) => l.id === leadId);

    if (!lead) {
      return { success: false, hospitalId: '', customerId: '', message: 'Lead not found.' };
    }

    // 1. Generate IDs for Pending Customer
    const hospitalId = `HOSP-${Math.floor(100 + Math.random() * 900)}`;
    const customerId = `CUST-${Math.floor(5000 + Math.random() * 9000)}`;

    // 2. Update Lead Record (Preserve lead permanently!)
    lead.status = 'Converted';
    lead.convertedAt = new Date().toISOString().split('T')[0];
    lead.convertedBy = convertedBy.id;
    lead.customerId = customerId;
    lead.hospitalId = hospitalId;
    setStored(STORAGE_KEYS.SALES_LEADS, leads);

    // 3. Create Converted Customer Record for Super Admin Onboarding Queue
    const customers = getStored<ConvertedCustomer[]>(STORAGE_KEYS.CONVERTED_CUSTOMERS, initialConvertedCustomers);
    const newCustomer: ConvertedCustomer = {
      id: customerId,
      leadId: lead.id,
      hospitalId,
      hospitalName: lead.hospitalName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      convertedBy: convertedBy.id,
      convertedByName: convertedBy.name || 'Sales Executive',
      convertedAt: new Date().toISOString().split('T')[0],
      interestedPlan: lead.interestedPlan || 'Trial Plan',
      subscriptionStatus: 'Pending Setup',
      hospitalAdminStatus: 'Not Created',
      onboardingStatus: 'Pending Onboarding',
    };
    customers.unshift(newCustomer);
    setStored(STORAGE_KEYS.CONVERTED_CUSTOMERS, customers);

    // 4. Log Activity
    this.logLeadActivity({
      id: `ACT-${Date.now().toString().slice(-4)}`,
      leadId,
      type: 'Meeting',
      description: `Lead converted by ${convertedBy.name}. Customer record created & sent to Super Admin for Hospital Network Onboarding.`,
      createdBy: convertedBy.name,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    return {
      success: true,
      hospitalId,
      customerId,
      message: `Lead successfully converted! Hospital "${lead.hospitalName}" registered with Hospital Admin account (${lead.email}).`,
    };
  },

  // Lead Follow-Ups
  getLeadFollowUps(salesExecId?: string): LeadFollowUp[] {
    const HARDCODED_FLP_IDS = ['FLP-2001', 'FLP-2002', 'FLP-2003'];
    const list = getStored<LeadFollowUp[]>(STORAGE_KEYS.LEAD_FOLLOWUPS, initialLeadFollowUps)
      .filter((f) => !HARDCODED_FLP_IDS.includes(f.id));
    if (salesExecId) {
      return list.filter((f) => f.assignedTo === salesExecId);
    }
    return list;
  },

  saveLeadFollowUp(followUp: LeadFollowUp): void {
    const list = getStored<LeadFollowUp[]>(STORAGE_KEYS.LEAD_FOLLOWUPS, initialLeadFollowUps);
    const idx = list.findIndex((f) => f.id === followUp.id);
    if (idx >= 0) {
      list[idx] = followUp;
    } else {
      list.unshift(followUp);
    }
    setStored(STORAGE_KEYS.LEAD_FOLLOWUPS, list);

    // Update Lead's nextFollowUpDate
    const leads = this.getSalesLeads();
    const lead = leads.find((l) => l.id === followUp.leadId);
    if (lead) {
      lead.nextFollowUpDate = followUp.date;
      this.saveSalesLead(lead);
    }
  },

  updateFollowUpStatus(id: string, status: LeadFollowUp['status']): void {
    const list = getStored<LeadFollowUp[]>(STORAGE_KEYS.LEAD_FOLLOWUPS, initialLeadFollowUps);
    const item = list.find((f) => f.id === id);
    if (item) {
      item.status = status;
      setStored(STORAGE_KEYS.LEAD_FOLLOWUPS, list);
    }
  },

  // Lead Activities
  getLeadActivities(leadId?: string): LeadActivity[] {
    const HARDCODED_ACT_IDS = ['ACT-3001', 'ACT-3002', 'ACT-3003'];
    const list = getStored<LeadActivity[]>(STORAGE_KEYS.LEAD_ACTIVITIES, initialLeadActivities)
      .filter((a) => !HARDCODED_ACT_IDS.includes(a.id));
    if (leadId) {
      return list.filter((a) => a.leadId === leadId);
    }
    return list;
  },

  logLeadActivity(activity: LeadActivity): void {
    const list = getStored<LeadActivity[]>(STORAGE_KEYS.LEAD_ACTIVITIES, initialLeadActivities);
    list.unshift(activity);
    setStored(STORAGE_KEYS.LEAD_ACTIVITIES, list);
  },

  // Converted Customers
  getConvertedCustomers(salesExecId?: string): ConvertedCustomer[] {
    const HARDCODED_CUST_IDS = ['CUST-5001'];
    const list = getStored<ConvertedCustomer[]>(STORAGE_KEYS.CONVERTED_CUSTOMERS, initialConvertedCustomers)
      .filter((c) => !HARDCODED_CUST_IDS.includes(c.id));
    if (salesExecId) {
      return list.filter((c) => c.convertedBy === salesExecId);
    }
    return list;
  },

  saveConvertedCustomer(cust: ConvertedCustomer): void {
    const list = getStored<ConvertedCustomer[]>(STORAGE_KEYS.CONVERTED_CUSTOMERS, initialConvertedCustomers);
    const idx = list.findIndex((c) => c.id === cust.id);
    if (idx >= 0) {
      list[idx] = cust;
    } else {
      list.unshift(cust);
    }
    setStored(STORAGE_KEYS.CONVERTED_CUSTOMERS, list);
  },

  // Enterprise Health Network Organizations & Multi-Branch Management
  getOrganizations(): Organization[] {
    return getStored<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, initialOrganizations);
  },

  getOrganizationById(id: string): Organization | undefined {
    return this.getOrganizations().find((o) => o.id === id || o.slug === id);
  },

  getOrganizationByHospitalId(hospitalId: string): Organization | undefined {
    return this.getOrganizations().find(
      (o) => o.primaryHospitalId === hospitalId || (o.branches && o.branches.includes(hospitalId))
    );
  },

  saveOrganization(org: Organization): void {
    const orgs = this.getOrganizations();
    const idx = orgs.findIndex((o) => o.id === org.id);
    if (idx >= 0) {
      orgs[idx] = org;
    } else {
      orgs.unshift(org);
    }
    setStored(STORAGE_KEYS.ORGANIZATIONS, orgs);
    this.logActivity('Updated Enterprise Healthcare Organization', org.name, 'hospital');
  },

  getBranchAdmins(organizationId: string): User[] {
    const org = this.getOrganizationById(organizationId);
    if (!org) return [];
    const users = this.getUsers();
    return users.filter(
      (u) =>
        u.role === 'hospital_admin' &&
        (u.organizationId === organizationId || (u.hospitalId && org.branches.includes(u.hospitalId)))
    );
  },

  createBranch(params: {
    organizationId: string;
    branchName: string;
    branchCode: string;
    address: string;
    city: string;
    state: string;
    country: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    description?: string;
    branchAdminName: string;
    branchAdminEmail: string;
    branchAdminPhone?: string;
    initialPassword?: string;
  }): { success: boolean; branch?: Hospital; message?: string } {
    const org = this.getOrganizationById(params.organizationId);
    if (!org) {
      return { success: false, message: 'Organization record not found.' };
    }

    if (org.planTier !== 'enterprise' || org.status !== 'active') {
      return {
        success: false,
        message: 'Organization must have an active Enterprise Health Network subscription to provision new branches.',
      };
    }

    if (org.branches && org.branches.length >= (org.maxBranches || 10)) {
      return {
        success: false,
        message: `Branch allocation limit reached (${org.branches.length}/${org.maxBranches || 10} branches). Please contact Platform Superadmin to expand your quota.`,
      };
    }

    const cleanCode = params.branchCode.trim().toUpperCase();
    const hospitals = this.getHospitals();

    // Prevent duplicate branch code within this organization
    const isDuplicate = hospitals.some(
      (h) => h.organizationId === org.id && h.branchCode?.toUpperCase() === cleanCode
    );
    if (isDuplicate) {
      return {
        success: false,
        message: `Branch code "${cleanCode}" is already in use within ${org.name}. Please specify a unique branch identifier.`,
      };
    }

    // Determine unique hospital tenant ID
    const cleanIdPart = cleanCode.replace(/[^A-Z0-9]/g, '');
    let branchId = `HOSP-${cleanIdPart}`;
    if (hospitals.some((h) => h.id === branchId)) {
      branchId = `HOSP-${cleanIdPart}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 1. Create new branch Hospital
    const newBranch: Hospital = {
      id: branchId,
      name: params.branchName.trim(),
      regNumber: `REG-${params.city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Multi-Specialty Center',
      email: params.contactEmail.trim(),
      phone: params.contactPhone.trim(),
      address: params.address.trim(),
      city: params.city.trim(),
      state: params.state.trim(),
      country: params.country.trim(),
      postalCode: '560001',
      adminName: params.branchAdminName.trim(),
      adminEmail: params.branchAdminEmail.trim(),
      adminPhone: params.branchAdminPhone?.trim() || params.contactPhone.trim(),
      planTier: 'enterprise',
      status: 'active',
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
      totalDoctors: 0,
      totalPatients: 0,
      totalBeds: 50,
      createdAt: new Date().toISOString().split('T')[0],
      websiteUrl: `https://${cleanCode.toLowerCase()}.pulsecorehealth.com`,
      domainStatus: 'pending',
      organizationId: org.id,
      organizationName: org.name,
      isBranch: true,
      branchCode: cleanCode,
      branchAdminName: params.branchAdminName.trim(),
      branchAdminEmail: params.branchAdminEmail.trim(),
    };

    // Save hospital record
    this.saveHospital(newBranch);

    // 2. Associate branch in Organization record
    if (!org.branches.includes(newBranch.id)) {
      org.branches.push(newBranch.id);
      this.saveOrganization(org);
    }

    // 3. Create separate Branch Admin user account with branch-only permissions
    const users = this.getUsers();
    const branchAdminUser: User = {
      id: `USR-HAD-${newBranch.id}`,
      name: params.branchAdminName.trim(),
      email: params.branchAdminEmail.trim(),
      password: params.initialPassword || 'Password@123',
      role: 'hospital_admin',
      portal: 'hospital',
      hospitalId: newBranch.id,
      hospitalName: newBranch.name,
      organizationId: org.id,
      organizationName: org.name,
      isOrganizationAdmin: false, // Strictly branch-level admin!
      permittedBranchIds: [newBranch.id], // Bound strictly to this new branch!
      department: 'Hospital Administration',
      phone: params.branchAdminPhone?.trim() || params.contactPhone.trim(),
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const userIdx = users.findIndex((u) => u.email.toLowerCase() === branchAdminUser.email.toLowerCase());
    if (userIdx >= 0) {
      users[userIdx] = { ...users[userIdx], ...branchAdminUser };
    } else {
      users.unshift(branchAdminUser);
    }
    setStored(STORAGE_KEYS.USERS, users);

    // 4. Create Draft Website Configuration for the new branch
    const websites = this.getWebsites();
    const existingWebIdx = websites.findIndex((w) => w.hospitalId === newBranch.id);
    const draftWebsite: HospitalWebsite = {
      id: `WEB-${newBranch.id}`,
      hospitalId: newBranch.id,
      hospitalName: newBranch.name,
      subdomain: `${cleanCode.toLowerCase()}.pulsecorehealth.com`,
      customDomain: `www.${params.branchName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      domainStatus: 'pending_verification',
      status: 'draft', // DRAFT state as required by Step 6!
      published: false,
      templateId: 'premium-healthcare',
      theme: 'Modern Teal',
      primaryColor: '#059669',
      secondaryColor: '#0284c7',
      heroTitle: `Welcome to ${newBranch.name}`,
      heroDescription:
        params.description ||
        `Specialized healthcare, clinical departments, and 24/7 patient services in ${params.city}.`,
      heroImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
      seoTitle: `${newBranch.name} | Multi-Specialty Care in ${params.city}`,
      seoDescription: `Official portal for ${newBranch.name}. Book outpatient appointments, explore clinical departments, and 24/7 emergency care.`,
      lastDeployedAt: '',
      monthlyVisitors: 0,
      onlineBookingEnabled: true,
      emergencyBannerEnabled: true,
    };

    if (existingWebIdx >= 0) {
      websites[existingWebIdx] = draftWebsite;
    } else {
      websites.unshift(draftWebsite);
    }
    setStored(STORAGE_KEYS.WEBSITES, websites);

    this.logActivity(
      'Provisioned Enterprise Branch & Branch Admin',
      `${newBranch.name} (${cleanCode}) under ${org.name}`,
      'hospital',
      'Organization Admin',
      'Organization Admin',
      newBranch.id
    );

    return { success: true, branch: newBranch };
  },

  getConsolidatedEnterpriseMetrics(organizationId: string, branchId?: string, dateRange?: string) {
    const org = this.getOrganizationById(organizationId);
    if (!org) return null;

    const allHospitals = this.getHospitals();
    const orgBranches = allHospitals.filter(
      (h) => h.organizationId === org.id || (org.branches && org.branches.includes(h.id))
    );

    const targetBranches =
      branchId && branchId !== 'all'
        ? orgBranches.filter((b) => b.id === branchId)
        : orgBranches;

    let totalPatients = 0;
    let totalAppointments = 0;
    let totalAdmissions = 0;
    let totalBeds = 0;
    let totalRevenue = 0;
    let totalDoctors = 0;

    const branchSummaries = targetBranches.map((b) => {
      const patients = this.getPatients(b.id);
      const appointments = this.getAppointments(b.id);
      const admissions = this.getAdmissions(b.id);
      const doctors = this.getDoctors(b.id);
      const invoices = this.getInvoices(b.id);

      const branchRevenue = invoices
        .filter((inv) => inv.status === 'Paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      const activeBeds = admissions.filter((a) => a.status === 'Active').length;
      const bBeds = b.totalBeds || 50;
      const pCount = patients.length || b.totalPatients || 0;
      const dCount = doctors.length || b.totalDoctors || 0;

      totalPatients += pCount;
      totalAppointments += appointments.length;
      totalAdmissions += admissions.length;
      totalBeds += bBeds;
      totalRevenue += branchRevenue;
      totalDoctors += dCount;

      return {
        hospitalId: b.id,
        hospitalName: b.name,
        branchCode: b.branchCode || 'BR',
        city: b.city,
        state: b.state,
        status: b.status,
        patientCount: pCount,
        appointmentCount: appointments.length,
        admissionCount: admissions.length,
        activeAdmissions: activeBeds,
        totalBeds: bBeds,
        bedOccupancyRate: bBeds > 0 ? Math.round((activeBeds / bBeds) * 100) : 0,
        doctorCount: dCount,
        revenue: branchRevenue,
        adminName: b.adminName,
        adminEmail: b.adminEmail,
      };
    });

    return {
      organization: org,
      totalBranches: orgBranches.length,
      activeBranches: orgBranches.filter((b) => b.status === 'active').length,
      totalPatients,
      totalAppointments,
      totalAdmissions,
      totalBeds,
      totalRevenue,
      totalDoctors,
      branchSummaries,
    };
  },
};
