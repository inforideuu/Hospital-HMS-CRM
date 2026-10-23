export type UserRole =
  | 'super_admin'
  | 'super_admin_manager'
  | 'superadmin_manager'
  | 'sales_executive'
  | 'hospital_admin'
  | 'doctor'
  | 'receptionist'
  | 'nurse'
  | 'accountant'
  | 'pharmacist'
  | 'lab_technician'
  | 'patient'
  | 'ambulance_driver';

export type PortalType = 'platform' | 'hospital' | 'patient' | 'ambulance_driver';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  portal: PortalType;
  avatar?: string;
  hospitalId?: string; // Tenant identifier
  hospitalName?: string;
  patientId?: string; // Linked Patient ID if patient role
  driverId?: string; // Linked Driver ID if ambulance driver
  department?: string;
  phone?: string;
  password?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export type SubscriptionPlanTier = 'trial' | 'basic' | 'standard' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
export type BillingInterval = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionPlanTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  maxPatients: number;
  maxDoctors: number;
  maxStaff: number;
  maxBeds: number;
  storageGB: number;
  features: string[];
  isPopular?: boolean;
  isActive?: boolean;
  trialDays?: number;
}

export interface HospitalSubscription {
  id: string;
  hospitalId: string;
  planTier: SubscriptionPlanTier;
  planName: string;
  status: SubscriptionStatus;
  interval: BillingInterval;
  amount: number;
  originalAmount?: number;
  appliedCoupon?: string;
  startDate: string;
  renewalDate: string;
  upgradedDate?: string;
  activatedDate?: string;
  paymentMethod: string;
  autoRenew: boolean;
  paymentStatus?: 'pending_approval' | 'approved' | 'rejected';
  utrNumber?: string;
  paymentScreenshot?: string;
  requestedTier?: SubscriptionPlanTier;
  paymentSubmittedAt?: string;
}

export type HospitalStatus = 'active' | 'pending' | 'suspended' | 'rejected';
export type HospitalType = 'General Hospital' | 'Specialty Clinic' | 'Multi-Specialty Center' | 'Children & Maternity' | 'Trauma & Tertiary Care';

export interface Hospital {
  id: string; // e.g. "HOSP-001"
  name: string;
  regNumber: string;
  type: HospitalType;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  planTier: SubscriptionPlanTier;
  status: HospitalStatus;
  logoUrl?: string;
  image?: string;
  totalDoctors: number;
  totalPatients: number;
  totalBeds: number;
  createdAt: string;
  websiteUrl?: string;
  domainStatus?: 'connected' | 'pending' | 'failed';
}

export interface SupportTicket {
  id: string;
  hospitalId: string;
  hospitalName: string;
  title: string;
  description: string;
  category: 'Technical' | 'Billing' | 'Feature Request' | 'Clinical Workflow' | 'Integration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  requesterName: string;
  requesterEmail: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: string;
    senderRole: 'hospital' | 'platform_support';
    avatar?: string;
    message: string;
    timestamp: string;
  }[];
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  hospitalId?: string;
  patientId?: string;
  link?: string;
}

// ========================
// HOSPITAL & PATIENT TYPES
// ========================

export type Gender = 'Male' | 'Female' | 'Other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type PatientStatus = 'Outpatient' | 'Inpatient' | 'Discharged' | 'Critical' | 'Observation';

export interface Patient {
  id: string; // e.g. "PAT-1001"
  hospitalId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  bloodGroup: BloodGroup;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  status: PatientStatus;
  allergies: string[];
  medicalHistory: string[];
  registeredDate: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  roomBedNumber?: string;
  vitals?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenLevel: number;
    weightKg: number;
    recordedAt: string;
  };
}

export interface Prescription {
  id: string;
  hospitalId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  diagnosis: string;
  medications: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  status: 'Active' | 'Completed' | 'Refill Requested';
  notes?: string;
}

export type AppointmentType = 'General Checkup' | 'Consultation' | 'Follow-up' | 'Emergency' | 'Surgery' | 'Diagnostic';
export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Checked In' | 'Completed' | 'Cancelled' | 'No Show';

export interface Appointment {
  id: string; // e.g. "APT-2026-01"
  hospitalId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: Gender;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  fee: number;
  paymentStatus: 'Paid' | 'Unpaid';
  createdAt: string;
}

export interface Doctor {
  id: string; // e.g. "DOC-101"
  hospitalId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  departmentId: string;
  departmentName: string;
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  status: 'active' | 'on_leave' | 'inactive';
  availableDays: string[];
  availableHours: string;
  avatarUrl?: string;
  roomNumber: string;
  opdRoomId?: string;
  opdRoomName?: string;
  availabilityStatus?: string;
  department?: string;
}

export interface Staff {
  id: string;
  hospitalId: string;
  name: string;
  email: string;
  phone: string;
  role: 'Nurse' | 'Receptionist' | 'Accountant' | 'Pharmacist' | 'Lab Technician' | 'Admin' | 'Medical Doctor' | 'Ambulance Driver';
  systemRole: UserRole;
  department: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'Rotational';
  joiningDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  avatarUrl?: string;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  headDoctorId?: string;
  headDoctorName?: string;
  description: string;
  staffCount: number;
  doctorCount: number;
  bedCount?: number;
  phoneExtension: string;
  status: 'active' | 'inactive';
}

export type BedStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
export type WardType = 'General Ward' | 'ICU' | 'NICU' | 'CCU' | 'Pediatric Ward' | 'Maternity Ward' | 'Deluxe Private' | 'Emergency Bay';

export interface Bed {
  id: string;
  hospitalId: string;
  bedNumber: string;
  wardType: WardType;
  floor: string;
  status: BedStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  dailyRate: number;
}

export type AdmissionStatus = 'Active' | 'Discharged' | 'Transferred';

export interface Admission {
  id: string; // e.g. "ADM-5001"
  hospitalId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  wardType: WardType;
  bedNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  admissionType: 'Emergency' | 'Elective' | 'Transfer' | 'Maternity';
  reason: string;
  status: AdmissionStatus;
  notes?: string;
  initialDeposit: number;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Insurance' | 'Bank Transfer' | 'UPI';

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Bed Charge' | 'Pharmacy' | 'Laboratory' | 'Procedure' | 'Nursing' | 'Ambulance';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string; // e.g. "INV-2026-001"
  hospitalId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // percentage
  taxAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}

export interface Medicine {
  id: string; // e.g. "MED-101"
  hospitalId: string;
  name: string;
  genericName: string;
  sku: string;
  batchNumber: string;
  category: 'Antibiotics' | 'Analgesics' | 'Cardiovascular' | 'Antidiabetic' | 'Respiratory' | 'Vitamins' | 'Emergency Drugs';
  stockQuantity: number;
  minThreshold: number;
  unitPrice: number;
  expiryDate: string;
  manufacturer: string;
  locationRack: string;
  requiresPrescription: boolean;
}

export type LabTestStatus = 'Ordered' | 'Sample Collected' | 'In Progress' | 'Completed' | 'Cancelled';

export interface LabTestCatalog {
  id: string;
  hospitalId: string;
  testName: string;
  code: string;
  category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Radiology' | 'Pathology' | 'Immunology';
  price: number;
  turnaroundHours: number;
  sampleType: 'Blood' | 'Urine' | 'Serum' | 'Tissue' | 'Swab' | 'X-Ray Scan';
  normalRange: string;
}

export interface LabOrder {
  id: string; // e.g. "LAB-8001"
  hospitalId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: Gender;
  doctorId: string;
  doctorName: string;
  testId: string;
  testName: string;
  category: string;
  orderDate: string;
  completedDate?: string;
  status: LabTestStatus;
  sampleType: string;
  resultValue?: string;
  referenceRange?: string;
  resultStatus?: 'Normal' | 'Abnormal' | 'Critical';
  labTechnicianNotes?: string;
  fee: number;
}

export type WebsiteTemplateId = 'premium-healthcare' | 'modern-hospital' | 'luxury-medical';

export type WebsiteSectionType =
  | 'hero'
  | 'about'
  | 'services'
  | 'departments'
  | 'doctors'
  | 'facilities'
  | 'testimonials'
  | 'appointment_cta'
  | 'contact'
  | 'footer';

export interface WebsiteSection {
  id: string;
  websiteId: string;
  hospitalId: string;
  sectionType: WebsiteSectionType;
  title: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  displayOrder: number;
  isEnabled: boolean;
  settings?: {
    buttonText?: string;
    buttonLink?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    layout?: 'grid' | 'carousel' | 'list' | 'centered';
    heroBgType?: 'image' | 'video';
    heroBgUrl?: string;
    stat1Value?: string;
    stat1Label?: string;
    stat2Value?: string;
    stat2Label?: string;
    stat3Value?: string;
    stat3Label?: string;
  };
}

export interface WebsiteTemplate {
  id: WebsiteTemplateId;
  name: string;
  description: string;
  previewImage: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface ManagerPermissions {
  websiteView: boolean;
  websiteCreate: boolean;
  websiteEdit: boolean;
  websitePublish: boolean;
  websiteUnpublish: boolean;
}

export interface HospitalWebsite {
  id: string;
  hospitalId: string;
  hospitalName: string;
  subdomain: string;
  customDomain?: string;
  domainStatus: 'connected' | 'pending_verification' | 'ssl_configuring' | 'inactive';
  status: 'published' | 'draft' | 'maintenance';
  published: boolean;
  templateId: WebsiteTemplateId;
  theme: 'Modern Teal' | 'Deep Ocean' | 'Healthcare Classic' | 'Clean Minimal';
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroDescription: string;
  heroImage?: string;
  heroBgType?: 'image' | 'video';
  heroBgUrl?: string;
  logoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  draftConfig?: {
    templateId: WebsiteTemplateId;
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    heroTitle: string;
    heroDescription: string;
    heroImage?: string;
    heroBgType?: 'image' | 'video';
    heroBgUrl?: string;
    logoUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    sections: WebsiteSection[];
  };
  lastDeployedAt: string;
  monthlyVisitors: number;
  onlineBookingEnabled: boolean;
  emergencyBannerEnabled: boolean;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface PatientTestimonial {
  id: string;
  hospitalId: string;
  patientName: string;
  patientRole?: string;
  avatarUrl?: string;
  rating: number;
  headline: string;
  reviewText: string;
  verified: boolean;
  date: string;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  systemNotification: boolean;
  enableMultiTenantSelfRegistration: boolean;
  enableBillingAddonModule?: boolean;
  maintenanceMode: boolean;
  defaultPlanTier: SubscriptionPlanTier;
  allowTrialDays: number;
  sessionTimeoutMinutes: number;
  enforce2FA: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface HospitalSettings {
  hospitalId: string;
  hospitalName: string;
  tagline: string;
  emergencyHelpline: string;
  receptionPhone: string;
  email: string;
  address: string;
  operatingHours: string;
  consultationSlotMinutes: number;
  enableSmsAlerts: boolean;
  enableEmailInvoices: boolean;
  taxRegistrationNumber: string;
  defaultCurrency: string;
  invoiceNotes: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  type: 'auth' | 'hospital' | 'patient' | 'clinical' | 'billing' | 'ambulance' | 'system';
  hospitalId?: string;
}

// ===================================
// AMBULANCE & EMERGENCY MODELS
// ===================================

export type AmbulanceType =
  | 'Basic Life Support (BLS)'
  | 'Advanced Life Support (ALS)'
  | 'Patient Transport Ambulance'
  | 'Neonatal Ambulance';

export type AmbulanceStatus =
  | 'Available'
  | 'Dispatched'
  | 'On Trip'
  | 'Maintenance'
  | 'Out of Service';

export interface Ambulance {
  id: string; // e.g. "AMB-101"
  hospitalId: string;
  hospitalName: string;
  regNumber: string; // e.g. "NY-EMRG-889"
  type: AmbulanceType;
  model: string; // e.g. "Mercedes Sprinter 3500 Mobile ICU"
  equipmentCategory: 'Class A (Critical Telemetry)' | 'Class B (Defibrillator + O2)' | 'Class C (Standard Transport)';
  assignedDriverId?: string;
  assignedDriverName?: string;
  driverPhone?: string;
  status: AmbulanceStatus;
  currentLocation: string; // e.g. "Base Station Alpha"
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  fuelLevel: number; // percentage
  mileageKm: number;
}

export interface AmbulanceDriver {
  id: string; // e.g. "DRV-201"
  hospitalId: string;
  hospitalName: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  assignedAmbulanceId?: string;
  assignedAmbulanceReg?: string;
  availabilityStatus: 'On Duty & Available' | 'On Active Trip' | 'Off Duty' | 'On Break';
  status: 'active' | 'inactive';
  completedTrips: number;
  emergencyExperienceYears: number;
  avatarUrl?: string;
}

export type EmergencyRequestStatus =
  | 'Requested'
  | 'Assigned'
  | 'Dispatched'
  | 'Patient Picked Up'
  | 'Arrived at Hospital'
  | 'Completed'
  | 'Cancelled';

export type EmergencyPriority = 'Low' | 'Medium' | 'High' | 'Critical / Code Blue';

export interface EmergencyRequest {
  id: string; // e.g. "EMR-7001"
  hospitalId: string;
  hospitalName: string;
  patientId?: string; // Optional if registered patient
  patientName: string;
  patientPhone: string;
  pickupLocation: string;
  destinationHospital: string;
  emergencyType: 'Cardiac Arrest / Chest Pain' | 'Trauma / Accident' | 'Respiratory Distress' | 'Maternity / Labor' | 'Stroke Code' | 'General Emergency Transfer';
  priority: EmergencyPriority;
  requestDate: string;
  requestTime: string;
  assignedAmbulanceId?: string;
  assignedAmbulanceReg?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  driverPhone?: string;
  status: EmergencyRequestStatus;
  chiefComplaint?: string;
  dispatchTime?: string;
  pickupTime?: string;
  hospitalArrivalTime?: string;
  completedTime?: string;
  notes?: string;
  fareEstimate?: number;
}

export interface AmbulanceTrip {
  id: string; // e.g. "TRP-9001"
  requestId: string;
  hospitalId: string;
  ambulanceId: string;
  ambulanceReg: string;
  driverId: string;
  driverName: string;
  patientName: string;
  patientPhone: string;
  pickupAddress: string;
  destination: string;
  status: EmergencyRequestStatus;
  startTime: string;
  pickupTime?: string;
  hospitalArrivalTime?: string;
  endTime?: string;
  distanceKm: number;
  paramedicNotes?: string;
}

export interface AmbulanceMaintenance {
  id: string; // e.g. "MNT-301"
  hospitalId: string;
  ambulanceId: string;
  ambulanceReg: string;
  serviceDate: string;
  description: string;
  cost: number;
  nextServiceDate: string;
  serviceType: 'Routine Inspection' | 'O2 & Telemetry Calibration' | 'Brakes & Tires' | 'Engine Overhaul';
  servicedBy: string;
}
