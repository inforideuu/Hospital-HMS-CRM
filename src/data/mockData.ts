import {
  User,
  Hospital,
  Organization,
  SubscriptionPlan,
  CouponCode,
  HospitalSubscription,
  SupportTicket,
  PlatformNotification,
  Patient,
  Prescription,
  Appointment,
  DoctorSchedule,
  DoctorUnavailablePeriod,
  AppointmentSettings,
  Doctor,
  Staff,
  Department,
  OPDRoom,
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
  SalesLead,
  LeadFollowUp,
  LeadActivity,
  ConvertedCustomer,
} from '../types';

export const initialCoupons: CouponCode[] = [
  {
    id: 'COUPON-1',
    code: 'Happy_Hospital',
    discountPercentage: 50,
    description: '50% Flat Launch Discount for newly onboarded hospital networks.',
    isActive: true,
    validUntil: '2026-12-31',
    maxUses: 100,
    usedCount: 14,
    createdAt: '2026-01-01',
  },
  {
    id: 'COUPON-2',
    code: 'HEALTH2026',
    discountPercentage: 20,
    description: '20% Special Seasonal Discount on annual tier subscriptions.',
    isActive: true,
    validUntil: '2026-11-30',
    maxUses: 50,
    usedCount: 8,
    createdAt: '2026-02-15',
  },
];

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
    trialDays: 7,
    isActive: true,
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
    tagline: 'Essential digital tools for independent clinics, polyclinics, and nursing homes.',
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
      'All Starter Clinic Features',
      'Admissions & beds (IPD Bed & Ward Allocation)',
      'Pharmacy & stock (Dispensary Inventory & POS)',
      'Laboratory & diagnostics (Pathology & Lab Reports)',
      'Ambulance & emergency (911 Fleet Dispatch)',
      'Custom Domain & Dynamic Website',
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
      'All Professional Hospital Features',
      'Enterprise and multi-branch tools',
      'Multi-Hospital Chain Orchestration',
      'Cross-Facility Patient Transfers & Referrals',
      'Emergency Ambulance Live Telemetry',
      'Custom Role-Based Access Control (RBAC)',
      'High-Capacity EHR & PACS Vault',
      '24/7 Dedicated Account Manager & SLA',
    ],
  },
];

export const initialOrganizations: Organization[] = [];

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

export const initialOPDRooms: OPDRoom[] = [];


export const initialDoctors: Doctor[] = [];
export const initialStaff: Staff[] = [];
export const initialPatients: Patient[] = [];
export const initialPrescriptions: Prescription[] = [];
export const initialAppointments: Appointment[] = [];
export const initialDoctorSchedules: DoctorSchedule[] = [];
export const initialDoctorUnavailability: DoctorUnavailablePeriod[] = [];

export const initialAppointmentSettings: AppointmentSettings[] = [];



export const initialWards: Ward[] = [];

export const initialBeds: Bed[] = [];

export const initialAdmissions: Admission[] = [];

export const initialInvoices: Invoice[] = [];

export const initialMedicines: Medicine[] = [];

export const initialLabCatalog: LabTestCatalog[] = [];

export const initialLabOrders: LabOrder[] = [];

export const generateDefaultWebsiteSections = (hospitalId: string, hospitalName: string = 'Apex City Medical Center'): WebsiteSection[] => {
  return [
    {
      id: `SEC-HERO-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'hero',
      title: `World-Class Medical Care & OPD Excellence at ${hospitalName}`,
      subtitle: 'Leading Healthcare Innovation & 24/7 Clinical Excellence',
      content: 'Experience 24/7 tertiary care, interventional cardiology, advanced neurosurgery, and dedicated patient-first clinical services.',
      imageUrl: '/light_hero_bg_1790313418511.jpg',
      displayOrder: 1,
      isEnabled: true,
      settings: { buttonText: 'Schedule Telehealth / OPD Visit', buttonLink: '#booking' },
    },
    {
      id: `SEC-ABOUT-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'about',
      title: `About ${hospitalName}`,
      subtitle: 'Over 25 Years of Healing Communities',
      content: `${hospitalName} is a JCI-accredited multi-specialty institution equipped with modular surgical suites, 24/7 cardiac ICU, and automated pathology labs.`,
      imageUrl: '/card_hospital_hms_1790313910509.jpg',
      displayOrder: 2,
      isEnabled: true,
    },
    {
      id: `SEC-SERVICES-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'services',
      title: 'Clinical Services & Centers of Excellence',
      subtitle: 'Comprehensive Multidisciplinary Care',
      content: 'Interventional Cardiology, Stroke Unit & Neurosurgery, Robotic Surgery, Emergency & Trauma, Pediatric ICU, and Oncology.',
      displayOrder: 3,
      isEnabled: true,
    },
    {
      id: `SEC-DEPTS-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'departments',
      title: 'Hospital Clinical Departments',
      subtitle: 'Specialized Clinical Faculties',
      displayOrder: 4,
      isEnabled: true,
    },
    {
      id: `SEC-DOCS-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'doctors',
      title: 'Our Specialist Physicians',
      subtitle: 'Board-Certified Medical Faculty',
      displayOrder: 5,
      isEnabled: true,
    },
    {
      id: `SEC-FACILITIES-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'facilities',
      title: 'Hospital Facilities & Infrastructure',
      subtitle: 'State-of-the-art Medical Technology',
      displayOrder: 6,
      isEnabled: true,
    },
    {
      id: `SEC-CTA-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'appointment_cta',
      title: 'Need Immediate Medical Consultation?',
      subtitle: 'Book Your OPD Consultation Online in Seconds',
      content: 'Choose your preferred specialist, select convenient timeslots, and receive digital appointment confirmations.',
      displayOrder: 7,
      isEnabled: true,
      settings: { buttonText: 'Book Appointment Now' },
    },
    {
      id: `SEC-BR-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'branches',
      title: 'Our Hospital Branches & Healthcare Network',
      subtitle: 'Delivering Clinical Excellence Across Regional Locations',
      content: 'Access our advanced healthcare network, specialized clinical departments, and 24/7 emergency response across all regional branch campuses.',
      displayOrder: 8,
      isEnabled: true,
      settings: {
        branchCardCount: 3,
        branchCard1Title: `${hospitalName} (Flagship Campus)`,
        branchCard1Location: '45 Anna Salai, T. Nagar, Chennai, Tamil Nadu',
        branchCard1Desc: 'Flagship tertiary hospital featuring 24/7 Level-1 trauma care, interventional cardiology, neurology, and inpatient beds.',
        branchCard1Img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
        branchCard1Link: `/hospital/${hospitalId}`,
        branchCard1Phone: '+91 44 2834 9000',

        branchCard2Title: `${hospitalName} Bangalore Hospital`,
        branchCard2Location: '88 Hosur Road, Koramangala 5th Block, Bengaluru, Karnataka',
        branchCard2Desc: 'Comprehensive multispecialty hospital with robotic surgery, pediatric ICU, specialized oncology, and day surgery suites.',
        branchCard2Img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
        branchCard2Link: `/hospital/${hospitalId}-blr`,
        branchCard2Phone: '+91 80 4123 4567',

        branchCard3Title: `${hospitalName} Hyderabad Medical Center`,
        branchCard3Location: '12 Cyber Hills, HITEC City, Hyderabad, Telangana',
        branchCard3Desc: 'Specialized digital diagnostic center and orthopedic institute providing advanced joint replacement and rehabilitation therapies.',
        branchCard3Img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
        branchCard3Link: `/hospital/${hospitalId}-hyd`,
        branchCard3Phone: '+91 40 6789 1234',
      },
    },
    {
      id: `SEC-CONTACT-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'contact',
      title: `Contact ${hospitalName}`,
      subtitle: 'Emergency Helpline: 108 / 24/7 Front Desk',
      content: 'Medical Center Boulevard, Health District Campus',
      displayOrder: 9,
      isEnabled: true,
    },
    {
      id: `SEC-FOOTER-${hospitalId}`,
      websiteId: `WEB-${hospitalId}`,
      hospitalId,
      sectionType: 'footer',
      title: hospitalName,
      subtitle: `© 2026 ${hospitalName}. All Rights Reserved.`,
      displayOrder: 10,
      isEnabled: true,
    },
  ];
};

export const initialWebsiteSections: Record<string, WebsiteSection[]> = {
  'HOSP-001': generateDefaultWebsiteSections('HOSP-001', 'CMC Hospital'),
  'HOSP-002': generateDefaultWebsiteSections('HOSP-002', 'Apollo Hospital'),
  'HOSP-ABC-CHN': generateDefaultWebsiteSections('HOSP-ABC-CHN', 'ABC Chennai Hospital'),
};

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
  consultationSlotMinutes: 15,
  enableSmsAlerts: true,
  enableEmailInvoices: true,
  taxRegistrationNumber: '',
  defaultCurrency: 'USD ($)',
  invoiceNotes: 'Payment is due within 7 days of discharge or OPD consultation.',
};

export const initialActivityLogs: ActivityLog[] = [];

// ===================================
// AMBULANCE & EMERGENCY MOCK DATA
// ===================================

export const initialAmbulances: Ambulance[] = [];

export const initialAmbulanceDrivers: AmbulanceDriver[] = [];

export const initialEmergencyRequests: EmergencyRequest[] = [];

export const initialAmbulanceTrips: AmbulanceTrip[] = [];

export const initialAmbulanceMaintenance: AmbulanceMaintenance[] = [];

export const initialTestimonials: any[] = [];

export const initialSalesLeads: SalesLead[] = [];

export const initialLeadFollowUps: LeadFollowUp[] = [];

export const initialLeadActivities: LeadActivity[] = [];

export const initialConvertedCustomers: ConvertedCustomer[] = [];
