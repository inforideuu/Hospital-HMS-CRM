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
    maxDoctors: 3,
    maxStaff: 10,
    maxBeds: 20,
    storageGB: 10,
    features: [
      '7 Days Full System Access',
      'OPD Appointment Scheduling',
      'Basic Patient EHR Records',
      'Hospital Public Website',
      'QR Code Subscription Upgrade',
      'Standard Email Support',
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
    maxBeds: 30,
    storageGB: 50,
    features: [
      'Single Wards & Department Support',
      'OPD Consultation Scheduling',
      'Electronic Health Records (EHR)',
      'GST Billing & Tax Invoices',
      'SMS & WhatsApp Notifications',
      'Standard Support (24-48h)',
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
      'Multi-Department Management',
      'IPD Bed & Ward Allocation System',
      'Integrated Pharmacy & Pathology Labs',
      'Ambulance Fleet Dispatching',
      'Custom Domain & Dynamic Website',
      'Automated SMS & WhatsApp Reminders',
      'Advanced Financial Audit & CSV Reports',
      'Priority Telephonic Support (4h SLA)',
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
      'Unlimited Departments & Wards',
      'Multi-Hospital Chain Operations',
      'Dedicated Custom Domain & SSL Engine',
      'Emergency Ambulance Live Telemetry',
      'Custom Role-Based Access Control (RBAC)',
      'High-Capacity EHR & PACS Vault',
      'API & Third-Party Integration Gateway',
      '24/7 Dedicated Account Manager & SLA',
    ],
  },
];

export const initialHospitals: Hospital[] = [];

export const initialUsers: User[] = [
  // Platform Super Admins
  {
    id: 'USR-PLAT-01',
    name: 'Sarah Jenkins',
    email: 'superadmin@pulsecore.io',
    role: 'super_admin',
    portal: 'platform',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    createdAt: '2023-11-01',
    lastLogin: '2026-09-24 09:30',
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
  {
    id: 'USR-ADMIN-CORE',
    name: 'Platform Super Admin',
    email: 'admin@pulsecore.com',
    role: 'super_admin',
    portal: 'platform',
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'usr-superadmin',
    name: 'Platform Admin',
    email: 'superadmin@pulse-crm.com',
    role: 'super_admin',
    portal: 'platform',
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'usr-manager',
    name: 'Platform Manager',
    email: 'manager@pulse-crm.com',
    role: 'super_admin_manager',
    portal: 'platform',
    status: 'active',
    createdAt: '2024-01-01',
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
  platformName: 'PulseCore Health OS',
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
