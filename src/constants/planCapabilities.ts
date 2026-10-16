import { SubscriptionPlanTier } from '../types';

export interface PlanCapability {
  id: string;
  name: string;
  description: string;
  starterClinic: boolean; // basic
  professionalHospital: boolean; // standard
  enterpriseHealthNetwork: boolean; // enterprise
  trial: boolean;
  routePath?: string;
  badge?: string;
}

/**
 * Standard Capability Matrix strictly matching the SaaS Subscription Tiers:
 * 1. Patient registration & EHR: Starter Clinic (✓), Professional Hospital (✓), Enterprise Health Network (✓)
 * 2. Appointments & OPD: Starter Clinic (✓), Professional Hospital (✓), Enterprise Health Network (✓)
 * 3. Doctors, staff & departments: Starter Clinic (✓), Professional Hospital (✓), Enterprise Health Network (✓)
 * 4. OPD rooms: Starter Clinic (✓), Professional Hospital (✓), Enterprise Health Network (✓)
 * 5. Admissions & beds: Starter Clinic (🔒), Professional Hospital (✓), Enterprise Health Network (✓)
 * 6. Pharmacy & stock: Starter Clinic (🔒), Professional Hospital (✓), Enterprise Health Network (✓)
 * 7. Laboratory & diagnostics: Starter Clinic (🔒), Professional Hospital (✓), Enterprise Health Network (✓)
 * 8. Ambulance & emergency: Starter Clinic (🔒), Professional Hospital (✓), Enterprise Health Network (✓)
 * 9. Billing & invoices: Starter Clinic (✓), Professional Hospital (✓), Enterprise Health Network (✓)
 * 10. Enterprise and multi-branch tools: Starter Clinic (🔒), Professional Hospital (🔒), Enterprise Health Network (✓)
 */
export const PLAN_CAPABILITIES: PlanCapability[] = [
  {
    id: 'patients_ehr',
    name: 'Patient registration & EHR',
    description: 'Patient registration, digital EHR charts, medical records, and diagnostic history.',
    starterClinic: true,
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/patients',
    badge: 'Core Clinical',
  },
  {
    id: 'appointments_opd',
    name: 'Appointments & OPD',
    description: 'Outpatient consultation booking, doctor queue management, and token scheduling.',
    starterClinic: true,
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/appointments',
    badge: 'OPD Flow',
  },
  {
    id: 'doctors_staff_departments',
    name: 'Doctors, staff & departments',
    description: 'Specialist profiles, clinical department allocation, and staff directory roster.',
    starterClinic: true,
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/doctors',
    badge: 'Workforce',
  },
  {
    id: 'opd_rooms',
    name: 'OPD rooms',
    description: 'Doctor chambers, examination rooms, consultation cubicles, and availability.',
    starterClinic: true,
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/opd-rooms',
    badge: 'Facility',
  },
  {
    id: 'admissions_beds',
    name: 'Admissions & beds',
    description: 'Inpatient (IPD) ward management, live bed census, admissions, and discharge summaries.',
    starterClinic: false, // 🔒 Locked
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/admissions',
    badge: 'IPD Care',
  },
  {
    id: 'pharmacy_stock',
    name: 'Pharmacy & stock',
    description: 'Central dispensary, medicine catalog, batch & expiry tracking, and stock POS.',
    starterClinic: false, // 🔒 Locked
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/pharmacy',
    badge: 'Pharmacy',
  },
  {
    id: 'laboratory_diagnostics',
    name: 'Laboratory & diagnostics',
    description: 'Pathology & radiology test orders, specimen tracking, and automated PDF lab reports.',
    starterClinic: false, // 🔒 Locked
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/laboratory',
    badge: 'Diagnostics',
  },
  {
    id: 'ambulance_emergency',
    name: 'Ambulance & emergency',
    description: '911 Emergency desk, live GPS telemetry, driver dispatch, and trauma response.',
    starterClinic: false, // 🔒 Locked
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/ambulance',
    badge: 'Emergency',
  },
  {
    id: 'billing_invoices',
    name: 'Billing & invoices',
    description: 'GST-compliant tax invoices, cashier collection, OPD/IPD billing, and receipts.',
    starterClinic: true,
    professionalHospital: true,
    enterpriseHealthNetwork: true,
    trial: true,
    routePath: '/hospital/billing',
    badge: 'Finance',
  },
  {
    id: 'enterprise_multi_branch',
    name: 'Enterprise and multi-branch tools',
    description: 'Multi-hospital chain management, cross-facility patient transfer, and centralized HQ telemetry.',
    starterClinic: false, // 🔒 Locked
    professionalHospital: false, // 🔒 Locked
    enterpriseHealthNetwork: true, // Exclusive to Enterprise Health Network
    trial: false,
    routePath: '/hospital/enterprise',
    badge: 'Multi-Facility',
  },
];

/**
 * Check whether a capability is enabled for a given subscription plan tier
 */
export function isCapabilityAllowedForTier(tier: SubscriptionPlanTier | undefined, capabilityIdOrName: string): boolean {
  const norm = capabilityIdOrName.toLowerCase().trim();
  const cap = PLAN_CAPABILITIES.find(
    (c) =>
      c.id.toLowerCase() === norm ||
      c.name.toLowerCase() === norm ||
      norm.includes(c.id.toLowerCase()) ||
      norm.includes(c.name.toLowerCase())
  );

  if (!cap) return true;

  if (!tier || tier === 'trial') return cap.trial;
  if (tier === 'basic') return cap.starterClinic;
  if (tier === 'standard') return cap.professionalHospital;
  if (tier === 'enterprise') return cap.enterpriseHealthNetwork;

  return true;
}

/**
 * Check module path permission against tier
 */
export function checkPathCapability(pathname: string, tier: SubscriptionPlanTier | undefined): {
  allowed: boolean;
  capability?: PlanCapability;
  requiredTierName: string;
} {
  const targetCap = PLAN_CAPABILITIES.find((c) => c.routePath && pathname.startsWith(c.routePath));

  if (!targetCap) {
    return { allowed: true, requiredTierName: 'Starter Clinic' };
  }

  const allowed = isCapabilityAllowedForTier(tier, targetCap.id);
  const requiredTierName = targetCap.starterClinic
    ? 'Starter Clinic'
    : targetCap.professionalHospital
    ? 'Professional Hospital'
    : 'Enterprise Health Network';

  return {
    allowed,
    capability: targetCap,
    requiredTierName,
  };
}
