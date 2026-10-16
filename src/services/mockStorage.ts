import {
  User,
  Hospital,
  HospitalType,
  HospitalStatus,
  SubscriptionPlan,
  SubscriptionPlanTier,
  CouponCode,
  HospitalSubscription,
  SupportTicket,
  Patient,
  Gender,
  BloodGroup,
  PatientStatus,
  Prescription,
  Appointment,
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
import { isCapabilityAllowedForTier, checkPathCapability, PLAN_CAPABILITIES } from '../constants/planCapabilities';

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
  STAFF: 'pulse_staff',
  PATIENTS: 'pulse_patients',
  PRESCRIPTIONS: 'pulse_prescriptions',
  APPOINTMENTS: 'pulse_appointments',
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
};

function notifyStorageChange<T>(key: string, value: T): void {
  const syncPayload = { type: 'PULSE_STORAGE_SYNC', key, data: value };

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('pulse_storage_sync');
      bc.postMessage(syncPayload);
      bc.close();
    } catch (e) {}
  }

  try {
    const bridgeIframe = document.getElementById('pulse-sync-bridge') as HTMLIFrameElement;
    if (bridgeIframe && bridgeIframe.contentWindow) {
      bridgeIframe.contentWindow.postMessage(syncPayload, '*');
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
      const mapped = doctorsRes.value.map((d: any) => ({
        id: d.id,
        hospitalId: d.hospital || 'hosp-1',
        name: d.name,
        department: d.department,
        specialization: d.specialization,
        phone: d.phone,
        email: d.email,
        consultationFee: Number(d.consultation_fee || d.consultationFee || 500),
        availabilityStatus: d.availability_status || d.availabilityStatus || 'Available',
      }));
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(mapped));
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

  saveUser(user: User): void {
    const deletedUserIds = getStored<string[]>(STORAGE_KEYS.DELETED_USERS, []);
    if (deletedUserIds.includes(user.id) || (user.email && deletedUserIds.includes(user.email.toLowerCase()))) {
      setStored(
        STORAGE_KEYS.DELETED_USERS,
        deletedUserIds.filter((d) => d !== user.id && d !== user.email.toLowerCase())
      );
    }

    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.unshift(user);
    }
    setStored(STORAGE_KEYS.USERS, users);
    this.logActivity(idx >= 0 ? 'Updated User Account' : 'Created User Account', `${user.name} (${user.role})`, 'system');
    window.dispatchEvent(new Event('pulse_storage_updated'));
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
      return s;
    });
    if (modified) {
      setStored(STORAGE_KEYS.SUBSCRIPTIONS, sanitized);
    }
    return sanitized;
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
    paymentScreenshot?: string
  ): void {
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
        renewalDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        paymentMethod: 'UPI QR Code',
        autoRenew: true,
      };
      subs.unshift(sub);
    }

    sub.paymentStatus = 'pending_approval';
    sub.requestedTier = requestedTier;
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

      const nowStr = new Date().toISOString().split('T')[0];
      sub.paymentStatus = 'approved';
      sub.planTier = targetTier;
      sub.planName = planObj?.name || 'Professional Hospital';
      sub.status = 'active';
      sub.upgradedDate = nowStr;
      sub.activatedDate = sub.activatedDate || nowStr;
      sub.renewalDate = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

      setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);

      // Update Hospital status & planTier
      const hosp = this.getHospitalById(sub.hospitalId);
      if (hosp) {
        hosp.planTier = targetTier;
        hosp.status = 'active';

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
    let appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
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

  // Doctor Schedules & Working Hours
  getDoctorSchedules(hospitalId?: string, doctorId?: string): DoctorSchedule[] {
    let schedules = getStored<DoctorSchedule[]>(STORAGE_KEYS.DOCTOR_SCHEDULES, initialDoctorSchedules);
    if (hospitalId) {
      const hasForHosp = schedules.some((s) => s.hospitalId === hospitalId);
      if (!hasForHosp) {
        const seedForHosp = initialDoctorSchedules.filter((s) => s.hospitalId === hospitalId);
        if (seedForHosp.length > 0) {
          schedules = [...schedules, ...seedForHosp];
          setStored(STORAGE_KEYS.DOCTOR_SCHEDULES, schedules);
        }
      }
      schedules = schedules.filter((s) => s.hospitalId === hospitalId);
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
    return schedules.find((s) => s.doctorId === doctorId && s.isActive !== false);
  },

  saveDoctorSchedule(schedule: DoctorSchedule): void {
    const list = getStored<DoctorSchedule[]>(STORAGE_KEYS.DOCTOR_SCHEDULES, initialDoctorSchedules);
    const idx = list.findIndex((s) => s.id === schedule.id || (s.doctorId === schedule.doctorId && s.hospitalId === schedule.hospitalId));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...schedule, updatedAt: new Date().toISOString().split('T')[0] };
    } else {
      list.unshift({ ...schedule, createdAt: new Date().toISOString().split('T')[0] });
    }
    setStored(STORAGE_KEYS.DOCTOR_SCHEDULES, list);
    this.logActivity(
      idx >= 0 ? 'Updated Doctor Schedule' : 'Configured Doctor Schedule',
      `${schedule.doctorName || schedule.doctorId} (${schedule.consultationStartTime} - ${schedule.consultationEndTime})`,
      'clinical',
      'Admin',
      'Hospital Admin',
      schedule.hospitalId
    );
  },

  deleteDoctorSchedule(id: string): void {
    const list = getStored<DoctorSchedule[]>(STORAGE_KEYS.DOCTOR_SCHEDULES, initialDoctorSchedules).filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.DOCTOR_SCHEDULES, list);
  },

  // Doctor Leaves, Holidays & Unavailability
  getDoctorUnavailability(hospitalId?: string, doctorId?: string): DoctorUnavailablePeriod[] {
    let unav = getStored<DoctorUnavailablePeriod[]>(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, initialDoctorUnavailability);
    if (hospitalId) {
      const hasForHosp = unav.some((u) => u.hospitalId === hospitalId);
      if (!hasForHosp) {
        const seedForHosp = initialDoctorUnavailability.filter((u) => u.hospitalId === hospitalId);
        if (seedForHosp.length > 0) {
          unav = [...unav, ...seedForHosp];
          setStored(STORAGE_KEYS.DOCTOR_UNAVAILABILITY, unav);
        }
      }
      unav = unav.filter((u) => u.hospitalId === hospitalId);
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
  },

  // Appointment Settings (Advance limits, deadlines, buffer)
  getAppointmentSettings(hospitalId: string): AppointmentSettings {
    const list = getStored<AppointmentSettings[]>(STORAGE_KEYS.APPOINTMENT_SETTINGS, initialAppointmentSettings);
    const found = list.find((s) => s.hospitalId === hospitalId);
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
    let list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
    if (hospitalId) {
      let docs = list.filter((d) => d.hospitalId === hospitalId);
      if (docs.length === 0) {
        const seedForHospital = initialDoctors.filter((d) => d.hospitalId === hospitalId);
        if (seedForHospital.length > 0) {
          list = [...list, ...seedForHospital];
          setStored(STORAGE_KEYS.DOCTORS, list);
          return seedForHospital;
        } else {
          const autoDocs: Doctor[] = [
            {
              id: `DOC-${hospitalId}-101`,
              hospitalId,
              name: 'Dr. Arun Kumar',
              email: `arun.kumar@${hospitalId.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
              phone: '+1 (555) 432-1098',
              specialization: 'General Medicine',
              departmentId: 'DEP-105',
              departmentName: 'General Medicine',
              qualifications: 'MD (Internal Medicine)',
              experienceYears: 12,
              consultationFee: 100,
              status: 'active',
              availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              availableHours: '09:00 AM - 04:00 PM',
              roomNumber: 'OPD-101',
              opdRoomId: 'OPD-101',
              opdRoomName: 'General Medicine OPD / OPD-101',
              avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
            },
            {
              id: `DOC-${hospitalId}-102`,
              hospitalId,
              name: 'Dr. Priya Sharma',
              email: `priya.sharma@${hospitalId.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
              phone: '+1 (555) 887-2341',
              specialization: 'Cardiology',
              departmentId: 'DEP-101',
              departmentName: 'Cardiology',
              qualifications: 'MD, DM (Cardiology), FACC',
              experienceYears: 15,
              consultationFee: 180,
              status: 'active',
              availableDays: ['Monday', 'Wednesday', 'Friday'],
              availableHours: '10:00 AM - 05:00 PM',
              roomNumber: 'OPD-201',
              opdRoomId: 'OPD-201',
              opdRoomName: 'Cardiology OPD / OPD-201',
              avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
            },
            {
              id: `DOC-${hospitalId}-103`,
              hospitalId,
              name: 'Dr. Meena Devi',
              email: `meena.devi@${hospitalId.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
              phone: '+1 (555) 667-8910',
              specialization: 'Pediatrics',
              departmentId: 'DEP-103',
              departmentName: 'Pediatrics',
              qualifications: 'MD (Pediatrics), DCH',
              experienceYears: 10,
              consultationFee: 120,
              status: 'active',
              availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
              availableHours: '08:30 AM - 03:30 PM',
              roomNumber: 'OPD-301',
              opdRoomId: 'OPD-301',
              opdRoomName: 'Pediatrics OPD / OPD-301',
              avatarUrl: 'https://images.unsplash.com/photo-1594824813599-4a7b7a66f28a?w=150&auto=format&fit=crop&q=80',
            },
          ];
          list = [...list, ...autoDocs];
          setStored(STORAGE_KEYS.DOCTORS, list);
          return autoDocs;
        }
      }
      return docs;
    }
    return list;
  },

  getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find((d) => d.id === id);
  },

  saveDoctor(doctor: Doctor): { success: boolean; message?: string } {
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
    const idx = list.findIndex((d) => d.id === doctor.id);

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
    this.logActivity(idx >= 0 ? 'Updated Doctor Profile' : 'Onboarded Medical Specialist', doctor.name, 'clinical', 'Admin', 'Hospital Admin', doctor.hospitalId);
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

  saveStaff(staff: Staff): { success: boolean; message?: string } {
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    const idx = list.findIndex((s) => s.id === staff.id);

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
    return { success: true };
  },

  deleteStaff(id: string): void {
    const list = getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff).filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.STAFF, list);
  },

  // Departments
  getDepartments(hospitalId?: string): Department[] {
    let list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    if (hospitalId) {
      const hasHospitalDepts = list.some((d) => d.hospitalId === hospitalId);
      if (!hasHospitalDepts) {
        const seedForHospital = initialDepartments.filter((d) => d.hospitalId === hospitalId);
        if (seedForHospital.length > 0) {
          list = [...list, ...seedForHospital];
          setStored(STORAGE_KEYS.DEPARTMENTS, list);
        }
      }
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

  // OPD Rooms / Chambers
  getOPDRooms(hospitalId?: string): OPDRoom[] {
    let list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
    if (hospitalId) {
      const hasHospitalRooms = list.some((r) => r.hospitalId === hospitalId);
      if (!hasHospitalRooms) {
        const seedForHospital = initialOPDRooms.filter((r) => r.hospitalId === hospitalId);
        if (seedForHospital.length > 0) {
          list = [...list, ...seedForHospital];
          setStored(STORAGE_KEYS.OPD_ROOMS, list);
        }
      }
      return list.filter((r) => r.hospitalId === hospitalId);
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
  },

  deleteOPDRoom(id: string): void {
    let list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
    list = list.filter((r) => r.id !== id);
    setStored(STORAGE_KEYS.OPD_ROOMS, list);
    this.logActivity('Deleted OPD Room', `Room ID: ${id}`, 'hospital', 'Admin', 'Hospital Admin');
  },

  updateOPDRoomStatus(id: string, status: OPDRoomStatus): void {
    const list = getStored<OPDRoom[]>(STORAGE_KEYS.OPD_ROOMS, initialOPDRooms);
    const room = list.find((r) => r.id === id);
    if (room) {
      room.status = status;
      setStored(STORAGE_KEYS.OPD_ROOMS, list);
    }
  },

  // Wards, Beds & Admissions
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
    this.logActivity('Saved Ward', `Ward ${ward.name} (${ward.wardType})`, 'hospital', 'Admin', 'Hospital Admin', ward.hospitalId);
  },

  deleteWard(wardId: string): void {
    let list = getStored<Ward[]>(STORAGE_KEYS.WARDS, initialWards);
    list = list.filter((w) => w.id !== wardId);
    setStored(STORAGE_KEYS.WARDS, list);
  },

  getBeds(hospitalId?: string, wardId?: string): Bed[] {
    let list = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    if (hospitalId) {
      list = list.filter((b) => b.hospitalId === hospitalId);
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
    return { success: true };
  },

  deleteBed(bedId: string): void {
    let list = getStored<Bed[]>(STORAGE_KEYS.BEDS, initialBeds);
    list = list.filter((b) => b.id !== bedId);
    setStored(STORAGE_KEYS.BEDS, list);
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
    }
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

    const beds = this.getBeds(admission.hospitalId);
    const bed = beds.find((b) => b.bedNumber === admission.bedNumber);
    if (bed) {
      bed.status = 'Occupied';
      bed.currentPatientId = admission.patientId;
      bed.currentPatientName = admission.patientName;
      setStored(STORAGE_KEYS.BEDS, beds);
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

      const beds = this.getBeds(adm.hospitalId);
      const bed = beds.find((b) => b.bedNumber === adm.bedNumber);
      if (bed) {
        bed.status = 'Available';
        bed.currentPatientId = undefined;
        bed.currentPatientName = undefined;
        setStored(STORAGE_KEYS.BEDS, beds);
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
    let list = allSections[hospitalId] || initialWebsiteSections[hospitalId] || initialWebsiteSections['HOSP-001'] || [];

    if (!list.some((s) => s.sectionType === 'branches')) {
      const branchesSec: WebsiteSection = {
        id: `SEC-BR-${hospitalId}`,
        websiteId: `WEB-${hospitalId}`,
        hospitalId: hospitalId,
        sectionType: 'branches',
        title: 'Our Hospital Branches & Healthcare Network',
        subtitle: 'Delivering Clinical Excellence Across Regional Locations',
        content: 'Access our advanced healthcare network, specialized clinical departments, and 24/7 emergency response across all regional branch campuses.',
        displayOrder: 8.5,
        isEnabled: true,
        settings: {
          branchCardCount: 3,
          branchCard1Title: 'ABC Chennai Hospital (Flagship Campus)',
          branchCard1Location: '45 Anna Salai, T. Nagar, Chennai, Tamil Nadu',
          branchCard1Desc: 'Flagship tertiary hospital featuring 24/7 Level-1 trauma care, interventional cardiology, neurology, and 60 inpatient beds.',
          branchCard1Img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
          branchCard1Link: '/hospital/abc-chennai',
          branchCard1Phone: '+91 44 2834 9000',

          branchCard2Title: 'ABC Bangalore Hospital',
          branchCard2Location: '88 Hosur Road, Koramangala 5th Block, Bengaluru, Karnataka',
          branchCard2Desc: 'Comprehensive multispecialty hospital with robotic surgery, pediatric ICU, specialized oncology, and high-tech day surgery suites.',
          branchCard2Img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
          branchCard2Link: '/hospital/abc-bangalore',
          branchCard2Phone: '+91 80 4123 4567',

          branchCard3Title: 'ABC Hyderabad Medical Center',
          branchCard3Location: '12 Cyber Hills, HITEC City, Hyderabad, Telangana',
          branchCard3Desc: 'Specialized digital diagnostic center and orthopedic institute providing advanced joint replacement and rehabilitation therapies.',
          branchCard3Img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
          branchCard3Link: '/hospital/abc-hyderabad',
          branchCard3Phone: '+91 40 6789 1234',
        },
      };
      list = [...list, branchesSec].sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return list;
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
    const list = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads);
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
    this.logActivity(idx >= 0 ? 'Updated Lead Details' : 'Created New Sales Lead', `${lead.hospitalName} (${lead.contactPerson})`, 'system', lead.assignedSalesExecutiveName || 'Sales Executive', 'Sales Executive');
  },

  deleteSalesLead(id: string): void {
    const list = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads).filter((l) => l.id !== id);
    setStored(STORAGE_KEYS.SALES_LEADS, list);
  },

  updateLeadStatus(leadId: string, status: SalesLead['status']): void {
    const list = getStored<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, initialSalesLeads);
    const lead = list.find((l) => l.id === leadId);
    if (lead) {
      const oldStatus = lead.status;
      lead.status = status;
      lead.updatedAt = new Date().toISOString().split('T')[0];
      setStored(STORAGE_KEYS.SALES_LEADS, list);

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
    const list = getStored<LeadFollowUp[]>(STORAGE_KEYS.LEAD_FOLLOWUPS, initialLeadFollowUps);
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
    const list = getStored<LeadActivity[]>(STORAGE_KEYS.LEAD_ACTIVITIES, initialLeadActivities);
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
    const list = getStored<ConvertedCustomer[]>(STORAGE_KEYS.CONVERTED_CUSTOMERS, initialConvertedCustomers);
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
