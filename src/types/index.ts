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

export type PortalType = 'platform' | 'sales' | 'hospital' | 'patient' | 'ambulance_driver';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  portal: PortalType;
  avatar?: string;
  hospitalId?: string; // Tenant identifier
  hospitalName?: string;
  organizationId?: string; // Enterprise Organization identifier
  organizationName?: string;
  isOrganizationAdmin?: boolean; // Granted organization-level privileges
  permittedBranchIds?: string[]; // Branch IDs this user can manage
  patientId?: string; // Linked Patient ID if patient role
  driverId?: string; // Linked Driver ID if ambulance driver
  department?: string;
  phone?: string;
  password?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export interface Organization {
  id: string; // e.g. "ORG-ABC"
  name: string; // e.g. "ABC Healthcare Group"
  slug: string;
  primaryHospitalId: string; // Initial branch: e.g. "HOSP-ABC-CHN" (ABC Chennai Hospital)
  subscriptionId?: string;
  planTier: SubscriptionPlanTier;
  status: 'active' | 'suspended' | 'trialing';
  maxBranches: number; // e.g. 10
  headquartersCity: string;
  headquartersAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  branches: string[]; // List of Hospital IDs
}

export interface BranchCreationRequest {
  id: string;
  organizationId: string;
  organizationName: string;
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
  status: 'pending' | 'approved' | 'rejected';
  createdHospitalId?: string;
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

export interface CouponCode {
  id: string;
  code: string;
  discountPercentage: number;
  description: string;
  isActive: boolean;
  validUntil?: string;
  maxUses?: number;
  usedCount: number;
  usedByHospitals?: string[]; // Track hospitalIds that have redeemed this coupon
  createdAt: string;
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
  requestedInterval?: BillingInterval;
  paymentSubmittedAt?: string;
}

export type HospitalStatus = 'active' | 'pending' | 'suspended' | 'rejected';
export type HospitalType = 'General Hospital' | 'Specialty Clinic' | 'Multi-Specialty Center' | 'Children & Maternity' | 'Trauma & Tertiary Care';

export interface Hospital {
  id: string; // e.g. "HOSP-001"
  name: string;
  slug?: string;
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
  organizationId?: string;
  organizationName?: string;
  isBranch?: boolean;
  branchCode?: string; // e.g. "ABC-MAA", "ABC-BLR"
  branchAdminId?: string;
  branchAdminEmail?: string;
  branchAdminName?: string;
  timezone?: string;
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
    recordedBy?: string;
    recordedRole?: string;
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
    quantity?: number;
    dispensed?: boolean;
    batchNumber?: string;
  }[];
  status: 'Active' | 'Completed' | 'Refill Requested' | 'Dispensed' | 'Partially Dispensed';
  notes?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  dispensedInvoiceId?: string;
  allergyWarning?: string;
}

export type AppointmentType = 'General Checkup' | 'Consultation' | 'Follow-up' | 'Emergency' | 'Surgery' | 'Diagnostic';
export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Checked In' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show';

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
  opdRoomId?: string;
  opdRoomName?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  fee: number;
  paymentStatus: 'Paid' | 'Unpaid';
  checkedInAt?: string;
  consultationStartedAt?: string;
  consultationCompletedAt?: string;
  consultationId?: string;
  parentAppointmentId?: string;
  isFollowUp?: boolean;
  followUpReason?: string;
  rescheduledFromDate?: string;
  rescheduledFromTime?: string;
  rescheduleReason?: string;
  createdAt: string;
}

export interface Consultation {
  id: string; // e.g. "CON-2026-01"
  hospitalId: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: 'Draft' | 'Finalized';
  chiefComplaint?: string;
  symptoms?: string;
  examination?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenLevel?: number;
    weightKg?: number;
    recordedAt?: string;
  };
  diagnosis?: string;
  treatmentPlan?: string;
  prescriptionItems?: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  followUpInstructions?: string;
  needsFollowUp?: boolean;
  followUpDate?: string;
  followUpIntervalDays?: number;
  followUpReason?: string;
  needsAdmission?: boolean;
  admissionWardType?: WardType;
  admissionPriority?: AdmissionRequestPriority;
  admissionReason?: string;
  admissionInstructions?: string;
  notes?: string;
  startedAt?: string;
  finalizedAt?: string;
  updatedAt?: string;
}

export type AdmissionRequestPriority = 'Emergency' | 'Urgent' | 'Routine' | 'Elective';
export type AdmissionRequestStatus = 'Pending' | 'Admitted' | 'Cancelled';

export interface AdmissionRequest {
  id: string; // e.g. "ADMR-1001"
  hospitalId: string;
  consultationId?: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: Gender;
  doctorId: string;
  doctorName: string;
  departmentName?: string;
  recommendedWardType: WardType;
  priority: AdmissionRequestPriority;
  reason: string;
  diagnosis?: string;
  instructions?: string;
  status: AdmissionRequestStatus;
  admittedAdmissionId?: string;
  createdAt: string;
}

export interface FollowUpRequest {
  id: string; // e.g. "FLW-1001"
  hospitalId: string;
  consultationId: string;
  originalAppointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: Gender;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  departmentName: string;
  suggestedDate: string; // YYYY-MM-DD
  intervalDays?: number;
  reason: string;
  notes?: string;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  scheduledAppointmentId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
}

export interface DoctorBreak {
  id: string;
  name: string; // e.g. "Lunch Break", "Tea Break"
  startTime: string; // e.g. "01:00 PM"
  endTime: string; // e.g. "02:00 PM"
}

export interface DoctorSchedule {
  id: string;
  hospitalId: string;
  doctorId: string;
  doctorName?: string;
  departmentId: string;
  departmentName?: string;
  opdRoomId?: string;
  opdRoomName?: string;
  workingDays: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  consultationStartTime: string; // e.g. "09:00 AM"
  consultationEndTime: string; // e.g. "05:00 PM"
  slotDurationMinutes: number; // e.g. 15, 20, 30, 45, 60
  breaks: DoctorBreak[];
  effectiveStartDate: string; // YYYY-MM-DD
  effectiveEndDate?: string; // YYYY-MM-DD
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UnavailabilityType = 'Leave' | 'Holiday' | 'Emergency' | 'Conference' | 'Administrative' | 'Other';

export interface DoctorUnavailablePeriod {
  id: string;
  hospitalId: string;
  doctorId: string;
  doctorName?: string;
  type: UnavailabilityType;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  reason?: string;
  createdAt?: string;
}

export interface AppointmentSettings {
  id?: string;
  hospitalId: string;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  cancellationDeadlineHours: number;
  reschedulingDeadlineHours: number;
  appointmentBufferMinutes: number;
  allowSameDayBooking: boolean;
  timezone?: string;
  updatedAt?: string;
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
  staffCount?: number;
  doctorCount?: number;
  phoneExtension: string;
  status: 'active' | 'inactive';
}

export type OPDRoomStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Inactive';

export interface OPDRoom {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName: string;
  location: string;
  status: OPDRoomStatus;
  description?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
}

export type BedStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
export type WardType = 'General Ward' | 'ICU' | 'NICU' | 'CCU' | 'Pediatric Ward' | 'Maternity Ward' | 'Deluxe Private' | 'Emergency Bay';

export interface Ward {
  id: string; // e.g. "WARD-101"
  hospitalId: string;
  name: string; // e.g. "General Ward", "ICU 3rd Floor"
  wardType: WardType;
  floor: string; // e.g. "2nd Floor"
  departmentName: string; // e.g. "General Medicine"
  description?: string;
  dailyRate: number; // default daily rate for beds in this ward
}

export interface Bed {
  id: string;
  hospitalId: string;
  wardId?: string;
  wardName?: string;
  bedNumber: string; // e.g. "Bed G-01"
  wardType: WardType;
  floor: string;
  status: BedStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  dailyRate: number;
  notes?: string;
}

export type AdmissionStatus = 'Active' | 'Discharge Initiated' | 'Discharged' | 'Transferred';
export type NurseConditionStatus = 'Stable & Improving' | 'Critical / High Attention' | 'Observation Continues' | 'Ready for Discharge Review';

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
  roomNumber?: string;
  admissionDate: string;
  dischargeDate?: string;
  admissionType: 'Emergency' | 'Elective' | 'Transfer' | 'Maternity';
  reason: string;
  diagnosis?: string;
  status: AdmissionStatus;
  notes?: string;
  initialDeposit: number;

  // Step 1: Nurse Monitoring & Updates to Specialist
  nurseNotes?: string;
  nurseCondition?: NurseConditionStatus;
  nurseUpdatedBy?: string;
  nurseVitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenLevel?: number;
    recordedAt?: string;
    recordedBy?: string;
  };
  nurseUpdatedAt?: string;

  // Step 2: Specialist Discharge Initiation & Summary
  dischargeInitiatedAt?: string;
  dischargeDoctorId?: string;
  dischargeDoctorName?: string;
  dischargeSummary?: string;
  dischargeAdvice?: string;
  dischargePrescriptions?: string;

  // Step 3: Complete All Billing
  billingStatus?: 'Pending' | 'Paid' | 'Cleared';
  invoiceId?: string;
  finalBilledAmount?: number;
  finalPaidAmount?: number;

  // Step 4: Final Clearance Handover
  finalDischargedBy?: string;
  finalDischargedRole?: 'Nurse' | 'Receptionist' | 'Admin';
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled' | 'Unpaid';
export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Insurance' | 'Bank Transfer' | 'UPI';
export type EncounterType = 'OPD' | 'IPD' | 'Emergency' | 'Daycare' | 'Pharmacy' | 'Diagnostic';
export type PaymentType = 'Self Pay' | 'Insurance / TPA' | 'Corporate';
export type BillingCategory = 'Hospital Service' | 'Pharmacy Service' | 'Walk-in Pharmacy';

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Bed Charge' | 'Pharmacy' | 'Laboratory' | 'Procedure' | 'Nursing' | 'Ambulance' | string;
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
  discountReason?: string;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  createdAt?: string;

  // Real Hospital Clinical & Billing Metadata
  billingCategory?: BillingCategory;
  prescriptionId?: string; // Linked Doctor e-Prescription (for Pharmacy Service)
  encounterType?: EncounterType;
  doctorId?: string;
  doctorName?: string;
  departmentName?: string;
  paymentType?: PaymentType;
  insuranceProvider?: string;
  policyNumber?: string;
  claimApprovalNumber?: string;
  collectedBy?: string; // Cashier / Accountant name who collected pay
  cashierDesk?: string; // Counter / Desk ID (e.g., OPD Cashier #1, Pharmacy Cash Counter)
}

export interface Medicine {
  id: string; // e.g. "MED-101"
  hospitalId: string;
  name: string;
  genericName: string;
  sku: string;
  batchNumber: string;
  category: 'Antibiotics' | 'Analgesics' | 'Cardiovascular' | 'Antidiabetic' | 'Respiratory' | 'Vitamins' | 'Emergency Drugs' | string;
  stockQuantity: number;
  minThreshold: number;
  unitPrice: number;
  expiryDate: string;
  manufacturer: string;
  locationRack: string;
  requiresPrescription: boolean;
  stock?: number;
  unit?: string;
  price?: number;
  status?: string;
  quarantineReason?: string;
  quarantinedAt?: string;
}

export type LabTestStatus =
  | 'Ordered'
  | 'Pending Sample'
  | 'Sample Collected'
  | 'In Progress'
  | 'Processing'
  | 'Sample Rejected'
  | 'Completed'
  | 'Verified'
  | 'Doctor Reviewed'
  | 'Action Completed'
  | 'Cancelled';

export interface LabTestParameter {
  id: string;
  name: string;
  unit: string;
  referenceRange: string;
  defaultValue?: string;
}

export interface LabTestCatalog {
  id: string;
  hospitalId: string;
  testName: string;
  code: string;
  category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Radiology' | 'Pathology' | 'Immunology' | string;
  price: number;
  turnaroundHours: number;
  sampleType: 'Blood' | 'Urine' | 'Serum' | 'Tissue' | 'Swab' | 'X-Ray Scan' | string;
  tubeColor?: string; // e.g. 'Purple / EDTA', 'Red / Plain Serum', 'Blue / Sodium Citrate'
  normalRange: string;
  parameters?: LabTestParameter[];
  status?: 'active' | 'inactive';
}

export interface LabResultItem {
  parameterId: string;
  parameterName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
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
  verifiedDate?: string;
  status: LabTestStatus;
  sampleType: string;
  tubeColor?: string;
  barcodeNumber?: string;
  specimenCollectionDate?: string;
  collectedByNurseId?: string;
  collectedByNurseName?: string;
  patientPreparationConfirmed?: boolean;
  patientPreparationNotes?: string;
  receivedByTechnician?: string;
  sampleReceivedDate?: string;
  analyzerInstrument?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectionDate?: string;
  priority?: 'Routine' | 'Urgent';
  notes?: string;
  resultValue?: string;
  referenceRange?: string;
  normalRange?: string;
  results?: any;
  resultItems?: LabResultItem[];
  resultStatus?: 'Normal' | 'Abnormal' | 'Critical';
  labTechnicianNotes?: string;
  verifiedBy?: string; // Pathologist name
  pathologistNotes?: string;
  reviewedByDoctorId?: string;
  reviewedByDoctorName?: string;
  doctorReviewDate?: string;
  doctorClinicalImpression?: string;
  doctorInstructions?: string;
  executedByNurseId?: string;
  executedByNurseName?: string;
  nurseExecutionDate?: string;
  nurseExecutionNotes?: string;
  nurseActionStatus?: 'Pending' | 'Completed';
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
  | 'branches'
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
    branchCardCount?: number;
    [key: string]: any;
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

  // Hospital-wide GST Percentages (Admin Configured)
  enableGSTBilling?: boolean;
  defaultGSTRate?: number;
  pharmacyGSTRate?: number;
  consultationGSTRate?: number;
  labDiagnosticGSTRate?: number;
  ipdRoomGSTRate?: number;
  gstType?: 'CGST_SGST' | 'IGST';
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
  availabilityStatus: 'On Duty & Available' | 'On Active Trip' | 'Off Duty' | 'On Break' | string;
  status: 'active' | 'inactive' | string;
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
  | 'Cancelled'
  | 'Pending'
  | string;

export type EmergencyPriority = 'Low' | 'Medium' | 'High' | 'Critical / Code Blue' | 'CRITICAL / CODE BLUE' | string;

export interface EmergencyRequest {
  id: string; // e.g. "EMR-7001"
  hospitalId: string;
  hospitalName: string;
  patientId?: string; // Optional if registered patient
  patientName: string;
  patientPhone: string;
  callerPhone?: string;
  pickupLocation: string;
  destinationHospital: string;
  destination?: string;
  emergencyType: 'Cardiac Arrest / Chest Pain' | 'Trauma / Accident' | 'Respiratory Distress' | 'Maternity / Labor' | 'Stroke Code' | 'General Emergency Transfer' | string;
  priority: EmergencyPriority;
  requestDate: string;
  requestTime: string;
  requestedAt?: string;
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

// ===================================
// SALES & CRM TYPES
// ===================================

export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Google Ads'
  | 'Meta Ads'
  | 'Direct Inquiry'
  | 'Exhibition/Event'
  | 'Cold Outreach'
  | 'Other';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Demo Scheduled'
  | 'Demo Completed'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Converted'
  | 'Lost';

export type FollowUpType =
  | 'Phone Call'
  | 'Email'
  | 'WhatsApp'
  | 'Meeting'
  | 'Product Demo'
  | 'Site Visit'
  | 'Other';

export type ActivityType =
  | 'Call'
  | 'Email'
  | 'Meeting'
  | 'Demo'
  | 'WhatsApp'
  | 'Note'
  | 'Proposal'
  | 'Follow-up';

export interface SalesLead {
  id: string; // e.g. "LEAD-1001"
  hospitalName: string;
  contactPerson: string;
  designation?: string;
  phone: string;
  email: string;
  city?: string;
  state?: string;
  country?: string;
  hospitalType?: 'General' | 'Super Specialty' | 'Clinic Network' | 'Government' | 'Private Hospital' | string;
  bedCount?: number;
  leadSource: LeadSource;
  interestedPlan?: SubscriptionPlanTier | string;
  status: LeadStatus;
  assignedSalesExecutiveId: string;
  assignedSalesExecutiveName?: string;
  nextFollowUpDate?: string;
  expectedDecisionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  convertedAt?: string;
  convertedBy?: string;
  customerId?: string;
  hospitalId?: string;
}

export interface LeadFollowUp {
  id: string;
  leadId: string;
  leadHospitalName?: string;
  leadContactPerson?: string;
  assignedTo: string; // Sales Executive ID
  date: string; // YYYY-MM-DD
  time?: string;
  type: FollowUpType;
  notes: string;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Rescheduled';
  reminder?: boolean;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  description: string;
  createdBy: string; // Name or ID of Sales Executive / Admin
  createdAt: string; // ISO or formatted date string
}

export interface ConvertedCustomer {
  id: string; // e.g. "CUST-5001"
  leadId: string;
  hospitalId: string;
  hospitalName: string;
  contactPerson: string;
  email: string;
  phone: string;
  convertedBy: string;
  convertedByName?: string;
  convertedAt: string;
  interestedPlan: string;
  subscriptionStatus: 'Trial' | 'Active' | 'Pending Approval' | 'Pending Setup';
  hospitalAdminStatus: 'Created' | 'Pending First Login' | 'Not Created';
  onboardingStatus: 'Pending Onboarding' | 'In Progress' | 'Setup Completed' | 'Operational' | 'Onboarded';
}
