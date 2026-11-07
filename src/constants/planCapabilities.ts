import { SubscriptionPlanTier, SubscriptionPlan } from '../types';

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
 * Check dynamically whether a capability is included in a specific plan's active features list.
 * This guarantees that when Super Admin adds a feature to any plan tier, hospitals on that plan immediately
 * get full access, and when Super Admin removes/disables a feature, it is completely restricted.
 */
export function isCapabilityInPlan(
  plan: SubscriptionPlan | undefined,
  capabilityIdOrName: string,
  allPlans?: SubscriptionPlan[]
): boolean {
  if (!plan) return false;
  if (plan.isActive === false) return false;

  const norm = capabilityIdOrName.toLowerCase().trim();
  const cap = PLAN_CAPABILITIES.find(
    (c) =>
      c.id.toLowerCase() === norm ||
      c.name.toLowerCase() === norm ||
      norm.includes(c.id.toLowerCase()) ||
      norm.includes(c.name.toLowerCase())
  );

  if (!cap) return true;

  const planTierNorm = (plan.tier || '').toLowerCase().trim();
  const isEnterpriseTier = planTierNorm === 'enterprise' || planTierNorm.includes('enterprise');
  const isTrialTier = !planTierNorm || planTierNorm === 'trial' || planTierNorm.includes('trial');

  // Enterprise multi-branch tools are strictly exclusive to Enterprise tier
  if (cap.id === 'enterprise_multi_branch') {
    return isEnterpriseTier;
  }

  // 1. Trial Tier: Full system access for evaluation (except enterprise multi-branch)
  if (isTrialTier) {
    return true;
  }

  // 2. Foundational Core Baseline (Universal Starter Clinic Capabilities):
  // Patients & EHR, Appointments & OPD, Doctors/Staff/Departments, OPD Rooms, and Billing & Invoices
  // are the fundamental building blocks of the HMS platform. They are GUARANTEED UNLOCKED for every
  // active subscription tier (Starter Clinic, Professional Hospital, Enterprise Health Network, and Trial).
  // A higher subscription tier (Professional Hospital, Enterprise) must NEVER under any circumstances
  // have core starter clinic modules locked or restricted.
  if (cap.starterClinic) {
    return true;
  }

  // 3. Starter Clinic (basic tier) Restrictions:
  // Starter Clinic is strictly an Outpatient OPD Clinic (0 Beds).
  // Inpatient admissions/beds, central pharmacy, diagnostic laboratory, and emergency ambulance are strictly locked.
  if (planTierNorm === 'basic' || planTierNorm.includes('starter') || planTierNorm.includes('clinic')) {
    return false;
  }

  // 4. Fallback to static defaults if plan.features is empty or uninitialized
  if (!plan.features || !Array.isArray(plan.features) || plan.features.length === 0) {
    return isCapabilityAllowedForTier(plan.tier, capabilityIdOrName);
  }

  // 5. Dynamic check against plan.features for higher tier modules (admissions, pharmacy, lab, ambulance)
  const capabilitySynonyms: Record<string, string[]> = {
    patients_ehr: ['patient registration', 'patient record', 'ehr', 'electronic health record', 'medical record', 'chart', 'patient'],
    appointments_opd: ['appointment', 'opd', 'consultation', 'token', 'scheduling', 'queue'],
    doctors_staff_departments: ['doctor', 'staff', 'department', 'specialist', 'workforce'],
    opd_rooms: ['opd room', 'room', 'chamber', 'cubicle', 'chambers', 'opd rooms', 'opd consultation rooms'],
    admissions_beds: ['admissions & beds', 'admission', 'bed allocation', 'ipd bed', 'ward allocation', 'inpatient', 'ipd', 'bed', 'ward'],
    pharmacy_stock: ['pharmacy', 'dispensary', 'medicine', 'drug', 'stock', 'prescription', 'dispense'],
    laboratory_diagnostics: ['laboratory', 'diagnostic', 'pathology', 'radiology', 'lab reports', 'specimen', 'lab'],
    ambulance_emergency: ['ambulance', 'emergency', '911', 'fleet dispatch', 'trauma'],
    billing_invoices: ['billing', 'invoice', 'gst', 'cashier', 'receipt'],
    enterprise_multi_branch: ['enterprise', 'multi-branch', 'multi-facility', 'headquarters'],
  };

  const synonyms = capabilitySynonyms[cap.id] || [cap.id, cap.name.toLowerCase()];

  const featureMatchesCap = (f: string) => {
    const fl = f.toLowerCase().trim();
    if (fl === cap.id.toLowerCase() || fl === cap.name.toLowerCase()) return true;
    if (fl.includes(cap.id.toLowerCase()) || fl.includes(cap.name.toLowerCase())) return true;
    return synonyms.some((syn) => fl.includes(syn));
  };

  if (plan.features.some(featureMatchesCap)) {
    return true;
  }

  // 6. Inherited bundle keywords
  if (plan.features.some((f) => f.toLowerCase().includes('starter clinic') || f.toLowerCase().includes('all starter'))) {
    if (cap.starterClinic) return true;
    if (allPlans) {
      const basicPlan = allPlans.find((p) => (p.tier || '').toLowerCase().includes('basic'));
      if (basicPlan && basicPlan !== plan && isCapabilityInPlan(basicPlan, capabilityIdOrName, allPlans)) {
        return true;
      }
    }
  }

  if (plan.features.some((f) => f.toLowerCase().includes('professional hospital') || f.toLowerCase().includes('all professional'))) {
    if (cap.professionalHospital) return true;
    if (allPlans) {
      const stdPlan = allPlans.find((p) => (p.tier || '').toLowerCase().includes('standard'));
      if (stdPlan && stdPlan !== plan && isCapabilityInPlan(stdPlan, capabilityIdOrName, allPlans)) {
        return true;
      }
    }
  }

  // 7. Enterprise tier guarantee: All standard hospital capabilities are included in Enterprise
  if (isEnterpriseTier && cap.professionalHospital) {
    return true;
  }

  return false;
}

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

  // Universal baseline: Starter Clinic capabilities are ALWAYS allowed across all subscription tiers
  if (cap.starterClinic) {
    return true;
  }

  const t = (tier || 'trial').toLowerCase().trim();
  if (t === 'basic' || t.includes('starter') || t.includes('clinic')) return cap.starterClinic;
  if (t === 'standard' || t.includes('standard') || t.includes('professional')) return cap.professionalHospital;
  if (t === 'enterprise' || t.includes('enterprise')) return cap.enterpriseHealthNetwork;
  if (t === 'trial' || t.includes('trial')) return cap.trial;

  return true;
}

/**
 * Check module path permission against tier
 */
export function checkPathCapability(
  pathname: string,
  tier: SubscriptionPlanTier | undefined,
  plan?: SubscriptionPlan,
  allPlans?: SubscriptionPlan[]
): {
  allowed: boolean;
  capability?: PlanCapability;
  requiredTierName: string;
} {
  let targetCap: PlanCapability | undefined;

  if (pathname.includes('/billing/discharges') || pathname.includes('/doctor/inpatients')) {
    targetCap = PLAN_CAPABILITIES.find((c) => c.id === 'admissions_beds');
  } else {
    targetCap = PLAN_CAPABILITIES.find((c) => c.routePath && pathname.startsWith(c.routePath));
  }

  if (!targetCap) {
    return { allowed: true, requiredTierName: 'Starter Clinic' };
  }

  const allowed = plan
    ? isCapabilityInPlan(plan, targetCap.id, allPlans)
    : isCapabilityAllowedForTier(tier, targetCap.id);

  const currentTierNorm = (tier || plan?.tier || 'basic').toLowerCase().trim();

  // Determine the correct upgrade tier name - it must NEVER be lower than or equal to current tier
  let requiredTierName = 'Professional Hospital';
  if (targetCap.id === 'enterprise_multi_branch') {
    requiredTierName = 'Enterprise Health Network';
  } else if (!targetCap.starterClinic && targetCap.professionalHospital) {
    if (currentTierNorm === 'basic' || currentTierNorm.includes('starter') || currentTierNorm.includes('clinic')) {
      requiredTierName = 'Professional Hospital';
    } else {
      requiredTierName = 'Enterprise Health Network';
    }
  } else if (targetCap.starterClinic) {
    if (currentTierNorm === 'basic' || currentTierNorm.includes('starter') || currentTierNorm.includes('clinic')) {
      requiredTierName = 'Starter Clinic';
    } else if (currentTierNorm === 'standard' || currentTierNorm.includes('standard') || currentTierNorm.includes('professional')) {
      requiredTierName = 'Professional Hospital';
    } else {
      requiredTierName = 'Enterprise Health Network';
    }
  }

  return {
    allowed,
    capability: targetCap,
    requiredTierName,
  };
}
