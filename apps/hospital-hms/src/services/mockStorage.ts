import {
  User,
  Hospital,
  HospitalType,
  HospitalStatus,
  SubscriptionPlan,
  SubscriptionPlanTier,
  HospitalSubscription,
  SupportTicket,
  Patient,
  Gender,
  BloodGroup,
  PatientStatus,
  Prescription,
  Appointment,
  Doctor,
  Staff,
  Department,
  Ward,
  Bed,
  Admission,
  Invoice,
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
} from '../types';
import {
  initialHospitals,
  initialPlans,
  initialUsers,
  initialSubscriptions,
  initialSupportTickets,
  initialDepartments,
  initialWards,
  initialDoctors,
  initialStaff,
  initialPatients,
  initialPrescriptions,
  initialAppointments,
  initialBeds,
  initialAdmissions,
  initialInvoices,
  initialMedicines,
  initialLabCatalog,
  initialLabOrders,
  initialWebsites,
  initialWebsiteSections,
  initialPlatformSettings,
  initialHospitalSettings,
  initialActivityLogs,
  initialAmbulances,
  initialAmbulanceDrivers,
  initialEmergencyRequests,
  initialAmbulanceTrips,
  initialAmbulanceMaintenance,
  initialTestimonials,
} from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'pulse_users',
  DELETED_USERS: 'pulse_deleted_users',
  HOSPITALS: 'pulse_hospitals',
  DELETED_HOSPITALS: 'pulse_deleted_hospitals',
  PLANS: 'pulse_plans',
  SUBSCRIPTIONS: 'pulse_subscriptions',
  TICKETS: 'pulse_tickets',
  DEPARTMENTS: 'pulse_departments',
  WARDS: 'pulse_wards',
  DOCTORS: 'pulse_doctors',
  STAFF: 'pulse_staff',
  PATIENTS: 'pulse_patients',
  PRESCRIPTIONS: 'pulse_prescriptions',
  APPOINTMENTS: 'pulse_appointments',
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
};

function notifyStorageChange<T>(key: string, value: T): void {
  const syncPayload = { type: 'PULSE_STORAGE_SYNC', key, data: value };

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('pulse_storage_sync');
      bc.postMessage(syncPayload);
      bc.close();
    } catch (e) { }
  }

  try {
    const bridgeIframe = document.getElementById('pulse-sync-bridge') as HTMLIFrameElement;
    if (bridgeIframe && bridgeIframe.contentWindow) {
      bridgeIframe.contentWindow.postMessage(syncPayload, '*');
    }
  } catch (e) { }

  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(syncPayload, '*');
    }
  } catch (e) { }
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
      } catch (e) { }
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
          } catch (e) { }
        }
      };
    } catch (e) { }
  }

  // Instant automatic purge for existing data in Clinical Departments and Pharmacy Medicines
  const PURGE_KEY = 'pulse_purged_depts_rooms_meds_v2026';
  if (!localStorage.getItem(PURGE_KEY)) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify([]));
    localStorage.setItem(PURGE_KEY, 'true');
    try {
      window.dispatchEvent(new Event('pulse_storage_updated'));
      notifyStorageChange(STORAGE_KEYS.DEPARTMENTS, []);
      notifyStorageChange(STORAGE_KEYS.MEDICINES, []);
    } catch (e) { }
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
    window.dispatchEvent(new Event('pulse_storage_updated'));
    notifyStorageChange(key, value);
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
    ]);

    let updated = false;

    if (hospitalsRes.status === 'fulfilled' && Array.isArray(hospitalsRes.value) && hospitalsRes.value.length > 0) {
      const deletedHospitalIds = getStored<string[]>(STORAGE_KEYS.DELETED_HOSPITALS, []);
      const currentHospitals = getStored<Hospital[]>(STORAGE_KEYS.HOSPITALS, initialHospitals).filter(
        (h) => !deletedHospitalIds.includes(h.id)
      );

      const validBackendHospitals = hospitalsRes.value.filter((h: any) => {
        if (h.id && deletedHospitalIds.includes(h.id)) {
          // Asynchronously ensure deleted hospital is purged from Django DB
          fetch(`${API_BASE_URL}/hospitals/${h.id}/`, { method: 'DELETE' }).catch(() => { });
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
          planTier: (existing?.planTier || (h.plan?.toLowerCase().includes('enterprise') ? 'enterprise' : h.plan?.toLowerCase().includes('standard') ? 'standard' : 'basic')) as SubscriptionPlanTier,
          status: (h.status?.toLowerCase() === 'active' ? 'active' : existing?.status || 'active') as HospitalStatus,
          logoUrl: photo,
          image: photo,
          totalDoctors: h.doctors_count || existing?.totalDoctors || 12,
          totalPatients: existing?.totalPatients || 120,
          totalBeds: h.beds_count || existing?.totalBeds || 100,
          createdAt: h.created_at || existing?.createdAt || new Date().toISOString().split('T')[0],
          websiteUrl: existing?.websiteUrl || `https://${(h.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')}.pulsecorehealth.com`,
          domainStatus: existing?.domainStatus || 'connected',
        };
      });
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(mapped));
      updated = true;
    }

    if (patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value) && patientsRes.value.length > 0) {
      const mapped: Patient[] = patientsRes.value.map((p: any) => ({
        id: p.id,
        hospitalId: p.hospital || 'hosp-1',
        name: p.name || 'Unknown Patient',
        email: p.email || '',
        phone: p.phone || '',
        dateOfBirth: p.date_of_birth || p.dateOfBirth || '1990-01-01',
        age: Number(p.age) || 30,
        gender: (p.gender || 'Other') as Gender,
        bloodGroup: (p.blood_group || p.bloodGroup || 'O+') as BloodGroup,
        address: p.address || 'N/A',
        emergencyContactName: p.emergency_contact_name || p.emergencyContactName || 'N/A',
        emergencyContactPhone: p.emergency_contact_phone || p.emergencyContactPhone || '',
        emergencyContactRelation: p.emergency_contact_relation || p.emergencyContactRelation || 'Other',
        status: (p.status || 'Outpatient') as PatientStatus,
        allergies: p.allergies || [],
        medicalHistory: p.medical_history || p.medicalHistory || [],
        registeredDate: p.registered_date || p.registeredDate || p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        vitals: p.vitals || {},
      }));
      // Merge backend patients with existing local patients so newly registered local patients are never wiped out
      const currentLocalPatients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
      const mergedMap = new Map<string, Patient>();

      for (const p of currentLocalPatients) {
        if (p.id) mergedMap.set(p.id, p);
      }
      for (const p of mapped) {
        if (p.id) {
          const existing = mergedMap.get(p.id);
          mergedMap.set(p.id, existing ? { ...existing, ...p } : p);
        }
      }

      const mergedPatients = Array.from(mergedMap.values());
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(mergedPatients));
      updated = true;
    }

    if (doctorsRes.status === 'fulfilled' && Array.isArray(doctorsRes.value) && doctorsRes.value.length > 0) {
      const mapped: Doctor[] = doctorsRes.value.map((d: any) => ({
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
      const currentLocalDoctors = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
      const mergedMap = new Map<string, Doctor>();
      for (const d of currentLocalDoctors) {
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
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(Array.from(mergedMap.values())));
      updated = true;
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
    let users = getStored<User[]>(STORAGE_KEYS.USERS, initialUsers);

    // Filter out users belonging to deleted hospitals or explicitly deleted users
    users = users.filter((u) => {
      if (deletedUserIds.includes(u.id) || (u.email && deletedUserIds.includes(u.email.toLowerCase()))) {
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

  saveUser(user: User): { success: boolean; error?: string } {
    const deletedUserIds = getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []);
    if (deletedUserIds.includes(user.id) || (user.email && deletedUserIds.includes(user.email.toLowerCase()))) {
      setStored(
        STORAGE_KEYS.DELETED_USERS,
        deletedUserIds.filter((d) => d !== user.id && d !== user.email.toLowerCase())
      );
    }

    const users = this.getUsers();
    const normalizedEmail = (user.email || '').trim().toLowerCase();

    // Check email collisions
    if (normalizedEmail) {
      if (user.role === 'patient') {
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
    }

    const idx = users.findIndex((u) => u.id === user.id || (user.email && u.email.toLowerCase() === normalizedEmail));
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

    try {
      const payload = {
        id: user.id,
        name: user.name,
        email: (user.email || '').trim().toLowerCase(),
        password: user.password || 'Doctor@123',
        role: user.role,
        portal: user.portal || 'hospital',
        hospital: user.hospitalId || null,
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
    if (targetUser?.email && !deletedUserIds.includes(targetUser.email.toLowerCase())) {
      deletedUserIds.push(targetUser.email.toLowerCase());
    }
    setStored(STORAGE_KEYS.DELETED_USERS, deletedUserIds);

    const remaining = users.filter((u) => u.id !== userId);
    setStored(STORAGE_KEYS.USERS, remaining);

    if (targetUser) {
      this.logActivity('Deleted User Account', `${targetUser.name} (${targetUser.role})`, 'system');
    }

    // Call backend DELETE endpoint if available
    try {
      fetch(`${API_BASE_URL}/users/${userId}/`, { method: 'DELETE' }).catch(() => { });
    } catch (e) { }

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
    return this.getHospitals().find((h) => h.id === id);
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

    const photo = hospital.logoUrl || hospital.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80';
    const sanitizedHospital: Hospital = {
      ...hospital,
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
      const trialSub: HospitalSubscription = {
        id: `SUB-${hospital.id}`,
        hospitalId: hospital.id,
        planTier: (sanitizedHospital.planTier || 'trial') as SubscriptionPlanTier,
        planName: plan?.name || (isTrial ? '7-Day Free Trial' : 'Starter Clinic'),
        status: isTrial ? 'trialing' : 'active',
        interval: 'monthly',
        amount: isTrial ? 0 : plan?.priceMonthly || 4999,
        startDate: new Date().toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + (isTrial ? 14 : 30) * 86400000).toISOString().split('T')[0],
        paymentMethod: isTrial ? '7-Day Trial License' : 'UPI QR Code',
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
        beds_count: sanitizedHospital.totalBeds || 100,
        doctors_count: sanitizedHospital.totalDoctors || 10,
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
          }).catch(() => { });
        }
      }).catch(() => { });
    } catch (e) { }
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
      fetch(`${API_BASE_URL}/hospitals/${id}/`, { method: 'DELETE' }).catch(() => { });
      fetch(`${API_BASE_URL}/websites/${id}/`, { method: 'DELETE' }).catch(() => { });
    } catch (e) { }
  },

  // Plans & Subscriptions
  getPlans(): SubscriptionPlan[] {
    let plans = getStored<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, initialPlans);

    plans = initialPlans.map((ip) => {
      const stored = Array.isArray(plans) ? plans.find((p) => p.id === ip.id) : undefined;
      return {
        ...ip,
        ...stored,
        tier: ip.tier,
        maxBeds: ip.maxBeds,
        maxDoctors: ip.maxDoctors,
        maxPatients: ip.maxPatients,
        maxStaff: ip.maxStaff,
        storageGB: ip.storageGB,
        name: ip.name,
        tagline: ip.tagline,
        priceMonthly: ip.priceMonthly,
        priceYearly: ip.priceYearly,
        features: ip.features,
      };
    });

    return plans;
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
    return getStored(STORAGE_KEYS.SUBSCRIPTIONS, initialSubscriptions);
  },

  getSubscriptionByHospitalId(hospitalId: string): HospitalSubscription | undefined {
    return this.getSubscriptions().find((s) => s.hospitalId === hospitalId);
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

  requestSubscriptionUpgrade(hospitalId: string, requestedTier: SubscriptionPlanTier, amount: number, utrNumber: string, paymentScreenshot?: string): void {
    const subs = this.getSubscriptions();
    let sub = subs.find((s) => s.hospitalId === hospitalId);
    const plans = this.getPlans();
    const planObj = plans.find((p) => p.tier === requestedTier);

    if (!sub) {
      sub = {
        id: `SUB-${hospitalId}`,
        hospitalId,
        planTier: 'basic',
        planName: 'Starter Clinic (Trial)',
        status: 'trialing',
        interval: 'monthly',
        amount,
        startDate: new Date().toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        paymentMethod: 'UPI QR Code',
        autoRenew: true,
      };
      subs.unshift(sub);
    }

    sub.paymentStatus = 'pending_approval';
    sub.requestedTier = requestedTier;
    sub.amount = amount;
    sub.utrNumber = utrNumber;
    if (paymentScreenshot) {
      sub.paymentScreenshot = paymentScreenshot;
    }
    sub.paymentSubmittedAt = new Date().toISOString();

    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    this.logActivity('Submitted Subscription QR Payment', `UTR: ${utrNumber} (${planObj?.name || requestedTier})`, 'billing', 'Hospital Admin', 'Hospital Admin', hospitalId);
  },

  approveSubscriptionUpgrade(subscriptionId: string): void {
    const subs = this.getSubscriptions();
    const sub = subs.find((s) => s.id === subscriptionId || s.hospitalId === subscriptionId);
    if (sub) {
      const targetTier = sub.requestedTier || sub.planTier;
      const plans = this.getPlans();
      const planObj = plans.find((p) => p.tier === targetTier);

      sub.paymentStatus = 'approved';
      sub.planTier = targetTier;
      sub.planName = planObj?.name || 'Professional Hospital';
      sub.status = 'active';

      setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);

      // Update Hospital status & planTier
      const hosp = this.getHospitalById(sub.hospitalId);
      if (hosp) {
        hosp.planTier = targetTier;
        hosp.status = 'active';
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
      ticket.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16),
        setStored(STORAGE_KEYS.TICKETS, tickets);
    }
  },

  // Patients
  getPatients(hospitalId?: string): Patient[] {
    const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    if (hospitalId) {
      return patients.filter((p) => {
        if (p.hospitalId === hospitalId) return true;
        // Treat HOSP-001 and hosp-1 as matching aliases for Apex City Medical Center
        if (
          (p.hospitalId === 'HOSP-001' && hospitalId === 'hosp-1') ||
          (p.hospitalId === 'hosp-1' && hospitalId === 'HOSP-001')
        ) {
          return true;
        }
        return false;
      });
    }
    return patients;
  },

  getPatientById(id: string): Patient | undefined {
    return getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients).find((p) => p.id === id);
  },

  savePatient(patient: Patient): void {
    const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    const idx = patients.findIndex((p) => p.id === patient.id);
    if (idx >= 0) {
      patients[idx] = patient;
    } else {
      patients.unshift(patient);
    }
    setStored(STORAGE_KEYS.PATIENTS, patients);
    this.logActivity(idx >= 0 ? 'Updated Patient Profile' : 'Registered New Patient', `${patient.name} (${patient.id})`, 'patient', 'Staff', 'Hospital User', patient.hospitalId);

    // Asynchronously synchronize with Django backend if available
    try {
      const hospitalKey = patient.hospitalId === 'HOSP-001' ? 'hosp-1' : patient.hospitalId;
      const payload = {
        id: patient.id,
        hospital: hospitalKey || 'hosp-1',
        name: patient.name,
        age: Number(patient.age) || 30,
        gender: patient.gender || 'Other',
        phone: patient.phone,
        email: patient.email || '',
        blood_group: patient.bloodGroup || 'O+',
        address: patient.address || 'N/A',
        medical_history: patient.medicalHistory || [],
        vitals: patient.vitals || {},
        status: patient.status || 'Outpatient',
      };
      fetch(`${API_BASE_URL}/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hospital-Id': hospitalKey || 'hosp-1',
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {}
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
    const list = getStored<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions);
    if (patientId) {
      return list.filter((p) => p.patientId === patientId);
    }
    if (hospitalId) {
      return list.filter((p) => p.hospitalId === hospitalId);
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
      appointments = appointments.filter((a) => a.hospitalId === hospitalId);
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
  },

  updateAppointmentStatus(id: string, status: Appointment['status']): void {
    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const item = list.find((a) => a.id === id);
    if (item) {
      item.status = status;
      setStored(STORAGE_KEYS.APPOINTMENTS, list);
      this.logActivity(`Appointment Status: ${status}`, `${item.patientName} (${item.id})`, 'clinical', 'Staff', 'Hospital User', item.hospitalId);
    }
  },

  deleteAppointment(id: string): void {
    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments).filter((a) => a.id !== id);
    setStored(STORAGE_KEYS.APPOINTMENTS, list);
  },

  // Doctors
  getDoctors(hospitalId?: string): Doctor[] {
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
    if (hospitalId) {
      return list.filter((d) => d.hospitalId === hospitalId);
    }
    return list;
  },

  getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find((d) => d.id === id);
  },

  saveDoctor(doctor: Doctor): { success: boolean; message?: string } {
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
    const idx = list.findIndex((d) => d.id === doctor.id);

    if (doctor.email) {
      const normalizedEmail = doctor.email.trim().toLowerCase();
      const existingDoc = list.find((d) => (d.email || '').trim().toLowerCase() === normalizedEmail && d.id !== doctor.id);
      if (existingDoc) {
        return {
          success: false,
          message: `Duplicate Email: A medical specialist with email "${doctor.email.trim()}" is already registered in the system.`,
        };
      }
    }

    if (idx >= 0) {
      list[idx] = doctor;
    } else {
      list.unshift(doctor);
    }
    setStored(STORAGE_KEYS.DOCTORS, list);
    this.logActivity(idx >= 0 ? 'Updated Doctor Profile' : 'Onboarded Medical Specialist', doctor.name, 'clinical', 'Admin', 'Hospital Admin', doctor.hospitalId);

    try {
      const payload = {
        id: doctor.id,
        hospital: doctor.hospitalId,
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

    window.dispatchEvent(new Event('pulse_storage_updated'));
    return { success: true };
  },

  deleteDoctor(id: string): void {
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors).filter((d) => d.id !== id);
    setStored(STORAGE_KEYS.DOCTORS, list);
  },

  // Staff
  getStaff(hospitalId?: string): Staff[] {
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    if (hospitalId) {
      return list.filter((s) => s.hospitalId === hospitalId);
    }
    return list;
  },

  getStaffById(id: string): Staff | undefined {
    return this.getStaff().find((s) => s.id === id);
  },

  saveStaff(staff: Staff): void {
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    const idx = list.findIndex((s) => s.id === staff.id);
    if (idx >= 0) {
      list[idx] = staff;
    } else {
      list.unshift(staff);
    }
    setStored(STORAGE_KEYS.STAFF, list);
  },

  deleteStaff(id: string): void {
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff).filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.STAFF, list);
  },

  // Departments
  getDepartments(hospitalId?: string): Department[] {
    const list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    if (hospitalId) {
      return list.filter((d) => d.hospitalId === hospitalId);
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
  },

  deleteDepartment(id: string): void {
    let list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    list = list.filter((d) => d.id !== id);
    setStored(STORAGE_KEYS.DEPARTMENTS, list);
    this.logActivity('Deleted Department', `Department ID: ${id}`, 'hospital', 'Admin', 'Hospital Admin');
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

  // Wards
  getWards(hospitalId?: string): Ward[] {
    const list = getStored<Ward[]>(STORAGE_KEYS.WARDS, initialWards);
    if (hospitalId) {
      return list.filter((w) => w.hospitalId === hospitalId);
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
  },

  deleteWard(id: string): void {
    let list = getStored<Ward[]>(STORAGE_KEYS.WARDS, initialWards);
    list = list.filter((w) => w.id !== id);
    setStored(STORAGE_KEYS.WARDS, list);
    this.logActivity('Deleted Ward', `Ward ID: ${id}`, 'hospital', 'Admin', 'Hospital Admin');
  },

  // Beds & Admissions
  getBeds(hospitalId?: string): Bed[] {
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
          (!b.hospitalId || !a.hospitalId || b.hospitalId === a.hospitalId)
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
      return list.filter((b) => b.hospitalId === hospitalId);
    }
    return list;
  },

  saveBed(bed: Bed): void {
    const list = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    const idx = list.findIndex((b) => b.id === bed.id);
    if (idx >= 0) {
      list[idx] = bed;
    } else {
      list.unshift(bed);
    }
    setStored(STORAGE_KEYS.BEDS, list);
  },

  getAdmissions(hospitalId?: string, patientId?: string): Admission[] {
    let list = getStored<Admission[]>(STORAGE_KEYS.ADMISSIONS, initialAdmissions);
    if (hospitalId) {
      list = list.filter((a) => a.hospitalId === hospitalId);
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
          (!admission.hospitalId || !b.hospitalId || b.hospitalId === admission.hospitalId)
      ) || allBeds.find((b) => b.bedNumber && b.bedNumber.trim().toLowerCase() === normBedNumber);

    if (bed) {
      bed.status = 'Occupied';
      bed.currentPatientId = admission.patientId;
      bed.currentPatientName = admission.patientName;
      setStored(STORAGE_KEYS.BEDS, allBeds);
    }
    this.logActivity('Admitted Patient to Ward', `${admission.patientName} in ${admission.bedNumber}`, 'patient', 'Staff', 'Hospital User', admission.hospitalId);
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
            (!adm.hospitalId || !b.hospitalId || b.hospitalId === adm.hospitalId)
        ) || allBeds.find((b) => b.bedNumber && b.bedNumber.trim().toLowerCase() === normBedNumber);

      if (bed) {
        bed.status = 'Available';
        bed.currentPatientId = undefined;
        bed.currentPatientName = undefined;
        setStored(STORAGE_KEYS.BEDS, allBeds);
      }
      this.logActivity('Discharged Patient', `${adm.patientName} (${adm.id})`, 'patient', 'Staff', 'Hospital User', adm.hospitalId);
    }
  },

  // Billing & Invoices
  getInvoices(hospitalId?: string, patientId?: string): Invoice[] {
    let list = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    if (hospitalId) {
      list = list.filter((i) => i.hospitalId === hospitalId);
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
  },

  recordPayment(invoiceId: string, amount: number, method: Invoice['paymentMethod'], ref?: string): void {
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
      setStored(STORAGE_KEYS.INVOICES, list);
      this.logActivity('Recorded Payment', `$${amount} for ${inv.id}`, 'billing', 'Marcus Sterling', 'Accountant', inv.hospitalId);
    }
  },

  // Medicines
  getMedicines(hospitalId?: string): Medicine[] {
    const list = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines);
    if (hospitalId) {
      return list.filter((m) => m.hospitalId === hospitalId);
    }
    return list;
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
  },

  deleteMedicine(id: string): void {
    const list = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines).filter((m) => m.id !== id);
    setStored(STORAGE_KEYS.MEDICINES, list);
  },

  clearMedicines(hospitalId?: string): void {
    if (hospitalId) {
      const list = getStored<Medicine[]>(STORAGE_KEYS.MEDICINES, initialMedicines).filter((m) => m.hospitalId !== hospitalId);
      setStored(STORAGE_KEYS.MEDICINES, list);
    } else {
      setStored(STORAGE_KEYS.MEDICINES, []);
    }
    this.logActivity('Purged Pharmacy Stock', `All medicine items cleared for hospital: ${hospitalId || 'All'}`, 'hospital', 'Admin', 'Hospital Admin');
  },

  // Lab Catalog & Orders
  getLabCatalog(hospitalId?: string): LabTestCatalog[] {
    const list = getStored<LabTestCatalog[]>(STORAGE_KEYS.LAB_CATALOG, initialLabCatalog);
    if (hospitalId) {
      return list.filter((t) => t.hospitalId === hospitalId);
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

  getLabOrders(hospitalId?: string, patientId?: string): LabOrder[] {
    let list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    if (hospitalId) {
      list = list.filter((l) => l.hospitalId === hospitalId);
    }
    if (patientId) {
      list = list.filter((l) => l.patientId === patientId);
    }
    return list;
  },

  saveLabOrder(order: LabOrder): void {
    const list = getStored<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const idx = list.findIndex((l) => l.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.unshift(order);
    }
    setStored(STORAGE_KEYS.LAB_ORDERS, list);
    this.logActivity(idx >= 0 ? 'Updated Lab Diagnostic Report' : 'Ordered Lab Diagnostic', `${order.testName} for ${order.patientName}`, 'clinical', 'Liam Zhang', 'Lab Technician', order.hospitalId);
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
    return this.getWebsites().find((w) => w.hospitalId === hospitalId);
  },

  getWebsiteByDomainOrSlug(identifier: string): HospitalWebsite | undefined {
    const clean = identifier.toLowerCase().trim();
    return this.getWebsites().find(
      (w) =>
        w.hospitalId.toLowerCase() === clean ||
        w.subdomain.toLowerCase().includes(clean) ||
        (w.customDomain && w.customDomain.toLowerCase().includes(clean)) ||
        w.hospitalName.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
    );
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
          }).catch(() => { });
        }
      }).catch(() => { });
    } catch (e) { }
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
      fetch(`${API_BASE_URL}/websites/${id}/`, { method: 'DELETE' }).catch(() => { });
    } catch (e) { }
  },

  getWebsiteSections(hospitalId: string): WebsiteSection[] {
    const allSections = getStored<Record<string, WebsiteSection[]>>('pulse_website_sections', initialWebsiteSections);
    return allSections[hospitalId] || initialWebsiteSections['HOSP-001'] || [];
  },

  saveWebsiteSections(hospitalId: string, sections: WebsiteSection[]): void {
    const allSections = getStored<Record<string, WebsiteSection[]>>('pulse_website_sections', initialWebsiteSections);
    allSections[hospitalId] = sections;
    setStored('pulse_website_sections', allSections);
  },

  // Patient Testimonials
  getTestimonials(hospitalId?: string): PatientTestimonial[] {
    const list = getStored<PatientTestimonial[]>(STORAGE_KEYS.TESTIMONIALS, initialTestimonials);
    if (hospitalId) {
      const filtered = list.filter((t) => t.hospitalId === hospitalId);
      if (filtered.length > 0) return filtered;
      return initialTestimonials.map((it) => ({ ...it, hospitalId }));
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
    this.logActivity('Updated Global Platform Settings', 'Branding & Security Preferences', 'system');
  },

  getHospitalSettings(hospitalId: string): HospitalSettings {
    const settings = getStored<HospitalSettings>(STORAGE_KEYS.HOSPITAL_SETTINGS, initialHospitalSettings);
    if (settings.hospitalId === hospitalId) {
      return settings;
    }
    const hosp = this.getHospitalById(hospitalId);
    return {
      ...initialHospitalSettings,
      hospitalId,
      hospitalName: hosp?.name || 'Hospital Center',
      email: hosp?.email || 'contact@hospital.org',
    };
  },

  saveHospitalSettings(settings: HospitalSettings): void {
    setStored(STORAGE_KEYS.HOSPITAL_SETTINGS, settings);
    this.logActivity('Updated Hospital Settings Profile', settings.hospitalName, 'system', 'Admin', 'Hospital Admin', settings.hospitalId);
  },

  // ===================================
  // AMBULANCE & FLEET SERVICES
  // ===================================

  getAmbulances(hospitalId?: string): Ambulance[] {
    const list = getStored<Ambulance[]>(STORAGE_KEYS.AMBULANCES, initialAmbulances);
    if (hospitalId) {
      return list.filter((a) => a.hospitalId === hospitalId);
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
    const list = getStored<AmbulanceDriver[]>(STORAGE_KEYS.AMBULANCE_DRIVERS, initialAmbulanceDrivers);
    if (hospitalId) {
      return list.filter((d) => d.hospitalId === hospitalId);
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
  },

  deleteAmbulanceDriver(id: string): void {
    const list = getStored<AmbulanceDriver[]>(STORAGE_KEYS.AMBULANCE_DRIVERS, initialAmbulanceDrivers).filter((d) => d.id !== id);
    setStored(STORAGE_KEYS.AMBULANCE_DRIVERS, list);
  },

  // Emergency Requests
  getEmergencyRequests(hospitalId?: string, patientId?: string): EmergencyRequest[] {
    let list = getStored<EmergencyRequest[]>(STORAGE_KEYS.EMERGENCY_REQUESTS, initialEmergencyRequests);
    if (hospitalId) {
      list = list.filter((r) => r.hospitalId === hospitalId);
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
        patientPhone: req.patientPhone,
        pickupAddress: req.pickupLocation,
        destination: req.destinationHospital,
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
            drv.completedTrips += 1;
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
    let list = getStored<AmbulanceTrip[]>(STORAGE_KEYS.AMBULANCE_TRIPS, initialAmbulanceTrips);
    if (hospitalId) {
      list = list.filter((t) => t.hospitalId === hospitalId);
    }
    if (driverId) {
      list = list.filter((t) => t.driverId === driverId);
    }
    return list;
  },

  // Ambulance Maintenance
  getAmbulanceMaintenance(hospitalId?: string): AmbulanceMaintenance[] {
    const list = getStored<AmbulanceMaintenance[]>(STORAGE_KEYS.AMBULANCE_MAINTENANCE, initialAmbulanceMaintenance);
    if (hospitalId) {
      return list.filter((m) => m.hospitalId === hospitalId);
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

  deleteAmbulanceMaintenance(id: string): void {
    const list = getStored<AmbulanceMaintenance[]>(STORAGE_KEYS.AMBULANCE_MAINTENANCE, initialAmbulanceMaintenance).filter((m) => m.id !== id);
    setStored(STORAGE_KEYS.AMBULANCE_MAINTENANCE, list);
  },

  // CSV Export utility
  exportToCSV(filename: string, rows: Record<string, any>[]): void {
    if (!rows || !rows.length) return;
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
};
