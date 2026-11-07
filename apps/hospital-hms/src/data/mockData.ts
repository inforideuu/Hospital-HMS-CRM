import {
  User,
  Hospital,
  SubscriptionPlan,
  HospitalSubscription,
  SupportTicket,
  PlatformNotification,
  Patient,
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
} from '../types';

export const initialPlans: SubscriptionPlan[] = [
  {
    id: 'plan-trial',
    tier: 'trial',
    name: '7-Day Free Trial',
    tagline: 'Zero-cost 7-day full platform trial provisioned automatically on hospital registration.',
    priceMonthly: 0,
    priceYearly: 0,
    maxPatients: 1000,
    maxDoctors: 5,
    maxStaff: 10,
    maxBeds: 10,
    storageGB: 10,
    features: [
      '7 Days Full System Access',
      'Patient registration & EHR',
      'Appointments & OPD Flow',
      'Doctors, staff & departments',
      'OPD Consultation Rooms',
      'GST Billing & Tax Invoices',
      'Hospital Public Website & Portal',
      'QR Code Subscription Upgrade',
    ],
  },
  {
    id: 'plan-basic',
    tier: 'basic',
    name: 'Starter Clinic',
    tagline: 'Essential digital tools for independent clinics and nursing homes.',
    priceMonthly: 4999,
    priceYearly: 49990,
    maxPatients: 5000,
    maxDoctors: 10,
    maxStaff: 25,
    maxBeds: 0,
    storageGB: 50,
    features: [
      'Patient registration & EHR',
      'Appointments & OPD',
      'Doctors, staff & departments',
      'OPD rooms',
      'Billing & invoices',
      'GST Tax Invoicing & Receipts',
      'Hospital Public Website & Portal',
    ],
  },
  {
    id: 'plan-standard',
    tier: 'standard',
    name: 'Professional Hospital',
    tagline: 'Comprehensive operating system for community & multi-specialty hospitals.',
    priceMonthly: 14999,
    priceYearly: 149990,
    maxPatients: 25000,
    maxDoctors: 35,
    maxStaff: 100,
    maxBeds: 120,
    storageGB: 250,
    isPopular: true,
    features: [
      'All Starter Clinic Features',
      'Patient registration & EHR',
      'Appointments & OPD',
      'Doctors, staff & departments',
      'OPD rooms',
      'Admissions & beds (IPD Bed & Ward Allocation)',
      'Pharmacy & stock (Dispensary Inventory & POS)',
      'Laboratory & diagnostics (Pathology & Lab Reports)',
      'Ambulance & emergency (911 Fleet Dispatch)',
      'GST Billing & Invoices',
      'Discharge Summaries & IPD Settlement',
      'Advanced Financial Audit & CSV Reports',
    ],
  },
  {
    id: 'plan-enterprise',
    tier: 'enterprise',
    name: 'Enterprise Health Network',
    tagline: 'Multi-facility healthcare orchestration with unlimited scale & security.',
    priceMonthly: 39999,
    priceYearly: 399990,
    maxPatients: 150000,
    maxDoctors: 200,
    maxStaff: 750,
    maxBeds: 500,
    storageGB: 2000,
    features: [
      'All Professional Hospital Features',
      'Enterprise and multi-branch tools',
      'Multi-Hospital Chain Orchestration',
      'Cross-Facility Patient Transfers & Referrals',
      'Centralized Network Dashboard & HQ Telemetry',
      'Sub-Branch Facility Onboarding & Management',
      'Emergency Ambulance Live Telemetry & Dispatch',
      'High-Capacity IPD Wards & Intensive Care Beds',
      'Central Pharmacy & Warehouse Medicine Stock',
      'Advanced Laboratory & Diagnostic Automation',
      'High-Capacity EHR & PACS Vault',
    ],
  },
];

export const initialHospitals: Hospital[] = [];

export const initialUsers: User[] = [
  // Platform Super Admins
  {
    id: 'USR-SUPERADMIN-ZENELAIT',
    name: 'Zenelait Super Admin',
    email: 'superadmin@zenelait.com',
    role: 'super_admin',
    portal: 'platform',
    status: 'active',
    password: 'admin@123',
    avatar: '/logo.png',
    createdAt: '2024-01-01',
    lastLogin: '2026-10-31 10:50',
  },
  {
    id: 'USR-PLAT-02',
    name: 'David Thorne',
    email: 'manager@pulsecore.io',
    role: 'super_admin_manager',
    portal: 'platform',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2024-02-15',
    lastLogin: '2026-09-23 16:45',
  },
];

export const initialSubscriptions: HospitalSubscription[] = [];

export const initialSupportTickets: SupportTicket[] = [];

export const initialDepartments: Department[] = [];


export const initialDoctors: Doctor[] = [];

export const initialStaff: Staff[] = [];

export const initialPatients: Patient[] = [];

export const initialPrescriptions: Prescription[] = [];

export const initialAppointments: Appointment[] = [];

export const initialWards: Ward[] = [];

export const initialBeds: Bed[] = [];


export const initialAdmissions: Admission[] = [];

export const initialInvoices: Invoice[] = [];

export const initialMedicines: Medicine[] = [];

export const initialLabCatalog: LabTestCatalog[] = [];

export const initialLabOrders: LabOrder[] = [];

export const initialWebsiteSections: Record<string, WebsiteSection[]> = {};

export const initialWebsites: HospitalWebsite[] = [];

export const initialPlatformSettings: PlatformSettings = {
  platformName: 'Zenelait HMS & CRM',
  supportEmail: 'support@pulsecore.io',
  systemNotification: true,
  enableMultiTenantSelfRegistration: true,
  enableBillingAddonModule: true,
  maintenanceMode: false,
  defaultPlanTier: 'standard',
  allowTrialDays: 7,
  sessionTimeoutMinutes: 60,
  enforce2FA: true,
  theme: 'light',
};

export const initialHospitalSettings: HospitalSettings = {
  hospitalId: '',
  hospitalName: '',
  tagline: '',
  emergencyHelpline: '',
  receptionPhone: '',
  email: '',
  address: '',
  operatingHours: '24 Hours Emergency / OPD: 08:00 AM - 08:00 PM',
  consultationSlotMinutes: 20,
  enableSmsAlerts: true,
  enableEmailInvoices: true,
  taxRegistrationNumber: '',
  defaultCurrency: 'USD ($)',
  invoiceNotes: 'Payment is due within 7 days of discharge or OPD consultation.',
};

export const initialActivityLogs: ActivityLog[] = [];

export const initialAmbulances: Ambulance[] = [];

export const initialAmbulanceDrivers: AmbulanceDriver[] = [];

export const initialEmergencyRequests: EmergencyRequest[] = [];

export const initialAmbulanceTrips: AmbulanceTrip[] = [];

export const initialAmbulanceMaintenance: AmbulanceMaintenance[] = [];

export const initialTestimonials: any[] = [];
