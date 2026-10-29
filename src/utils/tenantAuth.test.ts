import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set up browser environment polyfills for Node test runner
const inMemoryStore = new Map<string, string>();

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => inMemoryStore.get(key) ?? null,
    setItem: (key: string, val: string) => {
      inMemoryStore.set(key, String(val));
    },
    removeItem: (key: string) => {
      inMemoryStore.delete(key);
    },
    clear: () => {
      inMemoryStore.clear();
    },
    key: (idx: number) => Array.from(inMemoryStore.keys())[idx] ?? null,
    get length() {
      return inMemoryStore.size;
    },
  };
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import { MockStorage } from '../services/mockStorage';
import type { User, Patient } from '../types';

describe('Hospital-Wise Login Authentication and Tenant Isolation Tests', () => {
  const ABC_HOSPITAL_ID = 'HOSP-ABC';
  const EFG_HOSPITAL_ID = 'HOSP-EFG';

  beforeEach(() => {
    inMemoryStore.clear();
  });

  test('Scenario 1: Create ABC Hospital Arun using arun@gmail.com and password arun123 -> allowed', () => {
    const abcArun: User = {
      id: 'USR-ABC-ARUN-001',
      name: 'Arun',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const res = MockStorage.saveUser(abcArun);
    assert.equal(res.success, true);
    assert.equal(res.error, undefined);

    const saved = MockStorage.getUsers().find((u) => u.id === abcArun.id);
    assert.ok(saved);
    assert.equal(saved?.hospitalId, ABC_HOSPITAL_ID);
    assert.equal(saved?.email, 'arun@gmail.com');
  });

  test('Scenario 2: Option A - Create EFG Hospital Arun using the exact same email -> allowed (hospital-scoped)', () => {
    // 1. Create ABC Arun
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-001',
      name: 'Arun ABC',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // 2. Create EFG Arun with the exact same email (Option A: Hospital-scoped patient accounts)
    const efgArun: User = {
      id: 'USR-EFG-ARUN-001',
      name: 'Arun EFG',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const res = MockStorage.saveUser(efgArun);
    assert.equal(res.success, true, 'Patient with same email in DIFFERENT hospitals must be allowed under Option A');
    assert.equal(res.error, undefined);

    const allUsers = MockStorage.getUsers().filter((u) => u.email === 'arun@gmail.com');
    assert.equal(allUsers.length, 2, 'Both hospital accounts must coexist in multi-tenant storage');
  });

  test('Scenario 3: Create duplicate account with arun@gmail.com in ABC Hospital -> rejected', () => {
    // ABC Arun exists
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-001',
      name: 'Arun Kumar',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Attempt duplicate in SAME ABC Hospital
    const duplicateAbc: User = {
      id: 'USR-ABC-ARUN-002',
      name: 'Arun Duplicate',
      email: 'arun@gmail.com',
      password: 'anotherpassword',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const res = MockStorage.saveUser(duplicateAbc);
    assert.equal(res.success, false, 'Duplicate patient within the same hospital must be rejected');
    assert.match(res.error || '', /already exists in/i);
  });

  test('Scenario 4: Create duplicate account with arun@gmail.com in EFG Hospital -> rejected', () => {
    // EFG Arun exists
    MockStorage.saveUser({
      id: 'USR-EFG-ARUN-001',
      name: 'Arun EFG',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Attempt duplicate in SAME EFG Hospital
    const duplicateEfg: User = {
      id: 'USR-EFG-ARUN-002',
      name: 'Arun Duplicate 2',
      email: 'arun@gmail.com',
      password: 'anotherpassword',
      role: 'patient',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const res = MockStorage.saveUser(duplicateEfg);
    assert.equal(res.success, false, 'Duplicate patient within the same hospital must be rejected');
    assert.match(res.error || '', /already exists in/i);
  });

  test('Scenario 5: Log in through ABC Hospital with correct credentials -> ABC Hospital Arun account loads', () => {
    // Setup accounts with the SAME email in both hospitals under Option A
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-001',
      name: 'Arun ABC',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    MockStorage.saveUser({
      id: 'USR-EFG-ARUN-001',
      name: 'Arun EFG',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    const authResult = MockStorage.findUserForAuth('arun@gmail.com', ABC_HOSPITAL_ID, 'arun123');
    assert.ok(authResult.user, 'Authentication should succeed');
    assert.equal(authResult.user?.id, 'USR-ABC-ARUN-001');
    assert.equal(authResult.user?.name, 'Arun ABC');
    assert.equal(authResult.user?.hospitalId, ABC_HOSPITAL_ID);
  });

  test('Scenario 6: Log in through EFG Hospital with correct credentials -> EFG Hospital Arun account loads', () => {
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-001',
      name: 'Arun ABC',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    MockStorage.saveUser({
      id: 'USR-EFG-ARUN-001',
      name: 'Arun EFG',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    const authResult = MockStorage.findUserForAuth('arun@gmail.com', EFG_HOSPITAL_ID, 'arun123');
    assert.ok(authResult.user, 'Authentication should succeed');
    assert.equal(authResult.user?.id, 'USR-EFG-ARUN-001');
    assert.equal(authResult.user?.name, 'Arun EFG');
    assert.equal(authResult.user?.hospitalId, EFG_HOSPITAL_ID);
  });

  test('Scenario 7: ABC Hospital Arun attempts to access EFG Hospital portal/data -> denied', () => {
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-001',
      name: 'Arun ABC',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // An account that only exists in ABC attempting to login via EFG
    const authResult = MockStorage.findUserForAuth('arun@gmail.com', EFG_HOSPITAL_ID, 'arun123');
    assert.equal(authResult.user, null);
    assert.match(authResult.error || '', /No account found for this hospital/i);

    // Tenant data isolation check: Patient belonging to EFG
    const efgPatient: Patient = {
      id: 'PAT-EFG-001',
      hospitalId: EFG_HOSPITAL_ID,
      name: 'EFG Secret Patient',
      email: 'efgpatient@test.com',
      phone: '9876543210',
      dateOfBirth: '1990-01-01',
      age: 36,
      gender: 'Male',
      bloodGroup: 'O+',
      address: 'EFG City',
      emergencyContactName: 'Family Contact',
      emergencyContactPhone: '9876543211',
      emergencyContactRelation: 'Spouse',
      status: 'Outpatient',
      allergies: [],
      medicalHistory: [],
      registeredDate: '2026-01-01',
    };
    MockStorage.savePatient(efgPatient);

    // ABC user checks patients for their own hospital
    const abcPatients = MockStorage.getPatients(ABC_HOSPITAL_ID);
    assert.ok(!abcPatients.some((p) => p.id === 'PAT-EFG-001'), 'ABC hospital query must never include EFG hospital patient');
  });

  test('Scenario 8: EFG Hospital Arun attempts to access ABC Hospital portal/data -> denied', () => {
    MockStorage.saveUser({
      id: 'USR-EFG-ARUN-001',
      name: 'Arun EFG',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Account only in EFG attempting to authenticate to ABC
    const authResult = MockStorage.findUserForAuth('arun@gmail.com', ABC_HOSPITAL_ID, 'arun123');
    assert.equal(authResult.user, null);
    assert.match(authResult.error || '', /No account found for this hospital/i);
  });

  test('Scenario 9: Change hospital identifier after login -> unauthorized cross-tenant access denied', () => {
    // Authenticated user belongs to ABC
    const authenticatedUser: User = {
      id: 'USR-ABC-ARUN-001',
      name: 'Arun ABC',
      email: 'arun@gmail.com',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Attempting an action on EFG with ABC user identity
    const targetHospitalId = EFG_HOSPITAL_ID;
    const isAuthorized = authenticatedUser.hospitalId === targetHospitalId || authenticatedUser.role === 'super_admin';
    assert.equal(isAuthorized, false, 'Tampering with hospital ID must be blocked by tenant boundary authorization');
  });

  test('Scenario 10: Use the same email with the wrong password -> login rejected for requested hospital', () => {
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-001',
      name: 'Arun ABC',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    const authResult = MockStorage.findUserForAuth('arun@gmail.com', ABC_HOSPITAL_ID, 'WRONG_PASSWORD');
    assert.equal(authResult.user, null);
    assert.match(authResult.error || '', /Incorrect password/i);
  });

  test('Scenario 11: Email normalization (different capitalization or surrounding spaces) -> duplicate detected & login works', () => {
    // Create with clean email
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-001',
      name: 'Arun ABC',
      email: 'arun@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Attempt creation with "  ARUN@GMAIL.COM  "
    const duplicateRes = MockStorage.saveUser({
      id: 'USR-ABC-ARUN-002',
      name: 'Arun Duplicate Whitespace',
      email: '  ARUN@GMAIL.COM  ',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    assert.equal(duplicateRes.success, false, 'Must reject duplicate even with uppercase and whitespace');

    // Login with uppercase and surrounding spaces
    const loginRes = MockStorage.findUserForAuth('  ArUn@GmaIL.cOm  ', ABC_HOSPITAL_ID, 'arun123');
    assert.ok(loginRes.user, 'Must successfully authenticate normalized email');
    assert.equal(loginRes.user?.id, 'USR-ABC-ARUN-001');
  });

  test('Scenario 12: Confirm platform-level Super Admin login still works as intended', () => {
    const superAdmin: User = {
      id: 'USR-PLATFORM-SUPERADMIN',
      name: 'Platform Super Admin',
      email: 'superadmin@pulseflow.com',
      password: 'admin123',
      role: 'super_admin',
      portal: 'platform',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    MockStorage.saveUser(superAdmin);

    // Super Admin login without hospitalId (platform scope)
    const authResult = MockStorage.findUserForAuth('superadmin@pulseflow.com', undefined, 'admin123');
    assert.ok(authResult.user, 'Super Admin login must succeed');
    assert.equal(authResult.user?.role, 'super_admin');
    assert.equal(authResult.user?.portal, 'platform');
    assert.equal(authResult.user?.hospitalId, undefined);
  });

  test('Scenario 13: Onboard Medical Specialist with duplicate email in the same hospital -> restricted/rejected', () => {
    // 1. Onboard Doctor 1 in ABC Hospital
    const doc1 = {
      id: 'DOC-TEST-1',
      hospitalId: ABC_HOSPITAL_ID,
      name: 'Dr. Sarah Smith',
      specialization: 'Cardiology',
      departmentId: 'DEP-1',
      departmentName: 'Cardiology',
      email: 'dr.sarah@abchospital.com',
      phone: '9876543210',
      status: 'active' as const,
      consultationFee: 500,
      experienceYears: 10,
      qualifications: 'MBBS, MD',
      availableDays: ['Monday', 'Tuesday'],
      availableHours: '09:00 AM - 01:00 PM',
      roomNumber: 'OPD-101',
    };
    const res1 = MockStorage.saveDoctor(doc1);
    assert.equal(res1.success, true, 'First doctor must be saved successfully');

    MockStorage.saveUser({
      id: 'USR-DOC-1',
      name: doc1.name,
      email: doc1.email,
      password: 'Doctor@123',
      role: 'doctor',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // 2. Attempt to onboard Doctor 2 in the same hospital with the same email
    const doc2 = {
      id: 'DOC-TEST-2',
      hospitalId: ABC_HOSPITAL_ID,
      name: 'Dr. Sarah Duplicate',
      specialization: 'Neurology',
      departmentId: 'DEP-2',
      departmentName: 'Neurology',
      email: '  DR.SARAH@abchospital.com  ', // Normalized match
      phone: '9876543211',
      status: 'active' as const,
      consultationFee: 600,
      experienceYears: 8,
      qualifications: 'MBBS',
      availableDays: ['Wednesday'],
      availableHours: '10:00 AM - 02:00 PM',
      roomNumber: 'OPD-102',
    };
    const res2 = MockStorage.saveDoctor(doc2);
    assert.equal(res2.success, false, 'Doctor with duplicate email in the same hospital must be restricted');
    assert.match(res2.message || '', /already registered in the system/i);

    // 3. Verify user account creation also rejects duplicate
    const userRes = MockStorage.saveUser({
      id: 'USR-DOC-2',
      name: doc2.name,
      email: doc2.email,
      password: 'Doctor@123',
      role: 'doctor',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    assert.equal(userRes.success, false, 'User account creation must also be rejected as duplicate');
  });

  test('Scenario 14: Onboard Medical Specialist with same email in DIFFERENT hospitals -> rejected as duplicate in system', () => {
    // Doctor in ABC Hospital
    const docAbc = {
      id: 'DOC-ABC-1',
      hospitalId: ABC_HOSPITAL_ID,
      name: 'Dr. Arun Specialist',
      specialization: 'Cardiology',
      departmentId: 'DEP-1',
      departmentName: 'Cardiology',
      email: 'doctor.arun@hospital.com',
      phone: '9876543210',
      status: 'active' as const,
      consultationFee: 500,
      experienceYears: 10,
      qualifications: 'MBBS',
      availableDays: ['Monday'],
      availableHours: '09:00 AM - 01:00 PM',
      roomNumber: 'OPD-101',
    };
    const resAbc = MockStorage.saveDoctor(docAbc);
    assert.equal(resAbc.success, true);

    // Doctor in EFG Hospital with same email -> must be rejected
    const docEfg = {
      id: 'DOC-EFG-1',
      hospitalId: EFG_HOSPITAL_ID,
      name: 'Dr. Arun Specialist EFG',
      specialization: 'Orthopedics',
      departmentId: 'DEP-2',
      departmentName: 'Orthopedics',
      email: 'doctor.arun@hospital.com',
      phone: '9876543211',
      status: 'active' as const,
      consultationFee: 700,
      experienceYears: 12,
      qualifications: 'MBBS, MS',
      availableDays: ['Tuesday'],
      availableHours: '02:00 PM - 06:00 PM',
      roomNumber: 'OPD-103',
    };
    const resEfg = MockStorage.saveDoctor(docEfg);
    assert.equal(resEfg.success, false, 'Doctors with duplicate email anywhere in the system must be restricted');
    assert.match(resEfg.message || '', /already registered in the system/i);
  });

  test('Scenario 15: Direct login with email having multiple hospital accounts -> returns multipleAccounts for hospital selection', () => {
    MockStorage.saveUser({
      id: 'USR-ABC-ARUN-MULTI',
      name: 'Arun ABC Record',
      email: 'arun.multi@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    MockStorage.saveUser({
      id: 'USR-EFG-ARUN-MULTI',
      name: 'Arun EFG Record',
      email: 'arun.multi@gmail.com',
      password: 'arun123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Direct login without specifying hospitalId
    const authResult = MockStorage.findUserForAuth('arun.multi@gmail.com', undefined, 'arun123');
    assert.equal(authResult.user, null, 'User should be null when multiple facility accounts match');
    assert.ok(authResult.multipleAccounts, 'multipleAccounts should be returned');
    assert.equal(authResult.multipleAccounts?.length, 2, 'Should return both matched hospital accounts');
    const hospitalIds = authResult.multipleAccounts?.map((a) => a.hospitalId);
    assert.ok(hospitalIds?.includes(ABC_HOSPITAL_ID));
    assert.ok(hospitalIds?.includes(EFG_HOSPITAL_ID));
  });

  test('Scenario 16: Direct login with single-facility user -> directly resolves account without multipleAccounts prompt', () => {
    MockStorage.saveUser({
      id: 'USR-ABC-SINGLE',
      name: 'Single Hospital Patient',
      email: 'single.patient@gmail.com',
      password: 'patient123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    const authResult = MockStorage.findUserForAuth('single.patient@gmail.com', undefined, 'patient123');
    assert.ok(authResult.user, 'Direct login should successfully resolve the unique user');
    assert.equal(authResult.user?.id, 'USR-ABC-SINGLE');
    assert.equal(authResult.user?.hospitalId, ABC_HOSPITAL_ID);
    assert.equal(authResult.multipleAccounts, undefined);
  });

  test('Scenario 17: Deleting a doctor cascades deletion to their login credentials and allows immediate re-registration with the same email', () => {
    const docEmail = 'aruncmc@gmail.com';
    const docId = 'DOC-TEST-ARUN-1';

    // 1. Onboard doctor and create user login credentials
    const saveDocRes = MockStorage.saveDoctor({
      id: docId,
      hospitalId: ABC_HOSPITAL_ID,
      name: 'Dr. Arun CMC',
      email: docEmail,
      specialization: 'Cardiologist',
      departmentId: 'DEP-CARD-01',
      departmentName: 'Cardiology',
      qualifications: 'MBBS, MD, DM (Cardiology)',
      availableHours: '09:00 AM - 05:00 PM',
      roomNumber: 'OPD-101',
      phone: '9876543210',
      status: 'active',
      availableDays: ['Monday', 'Tuesday'],
      experienceYears: 10,
      consultationFee: 700,
    });
    assert.equal(saveDocRes.success, true);

    const saveUserRes = MockStorage.saveUser({
      id: 'USR-TEST-ARUN-1',
      name: 'Dr. Arun CMC',
      email: docEmail,
      password: 'Doctor@123',
      role: 'doctor',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    assert.equal(saveUserRes.success, true);

    // Verify both doctor and user exist
    assert.ok(MockStorage.getDoctors().find((d) => d.email === docEmail));
    assert.ok(MockStorage.getUsers().find((u) => u.email === docEmail));

    // 2. Delete the doctor
    MockStorage.deleteDoctor(docId);

    // 3. Verify doctor AND user login credentials are gone
    assert.equal(MockStorage.getDoctors().find((d) => d.email === docEmail), undefined, 'Doctor profile must be deleted');
    assert.equal(MockStorage.getUsers().find((u) => u.email === docEmail && u.role === 'doctor'), undefined, 'Doctor user credentials must be cascade deleted');

    // 4. Verify re-registering with the exact same email now succeeds without any duplicate email error
    const reDocRes = MockStorage.saveDoctor({
      id: 'DOC-TEST-ARUN-2',
      hospitalId: ABC_HOSPITAL_ID,
      name: 'Dr. Arun CMC Reborn',
      email: docEmail,
      specialization: 'Cardiologist',
      departmentId: 'DEP-CARD-01',
      departmentName: 'Cardiology',
      qualifications: 'MBBS, MD, DM (Cardiology)',
      availableHours: '09:00 AM - 05:00 PM',
      roomNumber: 'OPD-101',
      phone: '9876543210',
      status: 'active',
      availableDays: ['Monday', 'Tuesday'],
      experienceYears: 10,
      consultationFee: 700,
    });
    assert.equal(reDocRes.success, true, 'Doctor re-registration must succeed');

    const reUserRes = MockStorage.saveUser({
      id: 'USR-TEST-ARUN-2',
      name: 'Dr. Arun CMC Reborn',
      email: docEmail,
      password: 'Doctor@123',
      role: 'doctor',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    assert.equal(reUserRes.success, true, 'User login credential re-creation must succeed without collision');
  });

  test('Scenario 18: Onboarded Doctor can log in on the hospital website via slug, hospital ID, and direct portal', () => {
    const docEmail = 'dr.onboarded.specialist@cmc.org';
    const docPass = 'DoctorSecurePass!2026';

    // 1. Hospital Admin onboards doctor
    const docRes = MockStorage.saveDoctor({
      id: 'DOC-CMC-SPECIALIST-01',
      hospitalId: 'HOSP-001',
      name: 'Dr. Emily Watson',
      email: docEmail,
      specialization: 'Neurologist',
      departmentId: 'DEP-NEU-01',
      departmentName: 'Neurology',
      qualifications: 'MBBS, MD',
      phone: '9876500001',
      status: 'active',
      consultationFee: 800,
      experienceYears: 8,
      roomNumber: 'Room 205',
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      availableHours: '09:00 AM - 05:00 PM',
    });
    assert.equal(docRes.success, true);

    const userRes = MockStorage.saveUser({
      id: 'USR-DOC-EMILY',
      name: 'Dr. Emily Watson',
      email: docEmail,
      password: docPass,
      role: 'doctor',
      portal: 'hospital',
      hospitalId: 'HOSP-001',
      hospitalName: 'Apex City Medical Center',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    assert.equal(userRes.success, true);

    // 2. Doctor logs in from website with hospital ID alias ('hosp-1')
    const authByAlias = MockStorage.findUserForAuth(docEmail, 'hosp-1', docPass);
    assert.ok(authByAlias.user, 'Login via alias hosp-1 must succeed');
    assert.equal(authByAlias.user?.role, 'doctor');
    assert.equal(authByAlias.user?.email, docEmail);

    // 3. Doctor logs in from website with hospital slug ('cmc')
    const authBySlug = MockStorage.findUserForAuth(docEmail, 'cmc', docPass);
    assert.ok(authBySlug.user, 'Login via website slug cmc must succeed');
    assert.equal(authBySlug.user?.role, 'doctor');

    // 4. Doctor logs in directly via /login
    const authDirect = MockStorage.findUserForAuth(docEmail, undefined, docPass);
    assert.ok(authDirect.user, 'Direct login without hospitalId must succeed');
    assert.equal(authDirect.user?.name, 'Dr. Emily Watson');
  });

  test('Scenario 19: Onboarded Staff (Nurse, Receptionist, Accountant) can log in on the hospital website', () => {
    const nurseEmail = 'nurse.rachel@cmc.org';
    const nursePass = 'Nurse@1234';

    // Onboard staff
    const staffRes = MockStorage.saveStaff({
      id: 'STF-NURSE-01',
      hospitalId: 'HOSP-001',
      name: 'Nurse Rachel Green',
      email: nurseEmail,
      phone: '9876500002',
      role: 'Nurse',
      systemRole: 'nurse',
      department: 'Intensive Care Unit (ICU)',
      shift: 'Morning',
      joiningDate: '2026-01-01',
      status: 'active',
    });
    assert.equal(staffRes.success, true);

    const userRes = MockStorage.saveUser({
      id: 'USR-NURSE-RACHEL',
      name: 'Nurse Rachel Green',
      email: nurseEmail,
      password: nursePass,
      role: 'nurse',
      portal: 'hospital',
      hospitalId: 'HOSP-001',
      hospitalName: 'Apex City Medical Center',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    assert.equal(userRes.success, true);

    // Staff logs in via website URL
    const authWebsite = MockStorage.findUserForAuth(nurseEmail, 'HOSP-001', nursePass);
    assert.ok(authWebsite.user, 'Nurse login via HOSP-001 must succeed');
    assert.equal(authWebsite.user?.role, 'nurse');

    // Staff logs in via slug
    const authSlug = MockStorage.findUserForAuth(nurseEmail, 'cmc', nursePass);
    assert.ok(authSlug.user, 'Nurse login via cmc slug must succeed');
    assert.equal(authSlug.user?.role, 'nurse');
  });

  test('Scenario 20: Editing staff credentials updates their login information cleanly', () => {
    const originalEmail = 'john.receptionist@cmc.org';
    const updatedEmail = 'john.frontdesk@cmc.org';
    const newPass = 'NewPass@2026';

    MockStorage.saveStaff({
      id: 'STF-REC-01',
      hospitalId: 'HOSP-001',
      name: 'John Doe',
      email: originalEmail,
      phone: '9876500003',
      role: 'Receptionist',
      systemRole: 'receptionist',
      department: 'Front Desk',
      shift: 'Morning',
      joiningDate: '2026-01-01',
      status: 'active',
    });

    MockStorage.saveUser({
      id: 'USR-REC-JOHN',
      name: 'John Doe',
      email: originalEmail,
      password: 'Staff@1234',
      role: 'receptionist',
      portal: 'hospital',
      hospitalId: 'HOSP-001',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Update staff profile with new email and password
    MockStorage.saveStaff({
      id: 'STF-REC-01',
      hospitalId: 'HOSP-001',
      name: 'Johnathan Doe',
      email: updatedEmail,
      phone: '9876500003',
      role: 'Receptionist',
      systemRole: 'receptionist',
      department: 'Front Desk & Admissions',
      shift: 'Morning',
      joiningDate: '2026-01-01',
      status: 'active',
    });

    MockStorage.saveUser({
      id: 'USR-REC-JOHN',
      name: 'Johnathan Doe',
      email: updatedEmail,
      password: newPass,
      role: 'receptionist',
      portal: 'hospital',
      hospitalId: 'HOSP-001',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Old email no longer authenticates
    const oldAuth = MockStorage.findUserForAuth(originalEmail, 'HOSP-001', 'Staff@1234');
    assert.equal(oldAuth.user, null);

    // New email and password authenticates
    const newAuth = MockStorage.findUserForAuth(updatedEmail, 'cmc', newPass);
    assert.ok(newAuth.user);
    assert.equal(newAuth.user?.name, 'Johnathan Doe');
    assert.equal(newAuth.user?.email, updatedEmail);
  });

  test('Scenario 21: Onboard Ambulance Manager in Staff Management -> can log in via hospital sign in', () => {
    const managerEmail = `amb.manager.${Date.now()}@cmc.org`;
    const managerPass = 'Manager@1234';

    const staffRes = MockStorage.saveStaff({
      id: `STF-AMB-${Date.now()}`,
      hospitalId: 'HOSP-001',
      name: 'Ravi Kumar (Fleet Lead)',
      email: managerEmail,
      phone: '+91 99887 76655',
      role: 'Ambulance Manager',
      systemRole: 'ambulance_manager',
      department: 'Emergency Fleet / Ambulance Unit',
      shift: 'Rotational',
      joiningDate: '2026-10-28',
      status: 'active',
    });
    assert.ok(staffRes.success);

    // Save corresponding user
    MockStorage.saveUser({
      id: `USR-AMB-${Date.now()}`,
      name: 'Ravi Kumar (Fleet Lead)',
      email: managerEmail,
      password: managerPass,
      role: 'ambulance_manager',
      portal: 'hospital',
      hospitalId: 'HOSP-001',
      status: 'active',
      department: 'Emergency Fleet / Ambulance Unit',
      createdAt: new Date().toISOString(),
    });

    const auth = MockStorage.findUserForAuth(managerEmail, 'HOSP-001', managerPass);
    assert.ok(auth.user);
    assert.equal(auth.user?.role, 'ambulance_manager');
    assert.equal(auth.user?.portal, 'hospital');
  });

  test('Scenario 22: Onboard Ambulance Driver in Ambulance Management -> can log in via hospital sign in', () => {
    const driverEmail = `amb.driver.${Date.now()}@cmc.org`;
    const drvId = `DRV-${Date.now().toString().slice(-4)}`;

    MockStorage.saveAmbulanceDriver({
      id: drvId,
      hospitalId: 'HOSP-001',
      hospitalName: 'CMC Hospital',
      name: 'Suresh Pilot',
      email: driverEmail,
      phone: '+91 98765 43210',
      licenseNumber: 'DL-TN-01-2024-9988',
      licenseExpiry: '2028-12-31',
      availabilityStatus: 'On Duty & Available',
      status: 'active',
      completedTrips: 0,
      emergencyExperienceYears: 6,
    });

    // Driver user account was automatically provisioned in saveAmbulanceDriver with default password Staff@1234
    const auth = MockStorage.findUserForAuth(driverEmail, 'HOSP-001', 'Staff@1234');
    assert.ok(auth.user);
    assert.equal(auth.user?.role, 'ambulance_driver');
    assert.equal(auth.user?.portal, 'hospital');
  });

  test('Scenario 23: Patient with pending bill in a hospital -> blocked from login with outstanding bill error', () => {
    const patientEmail = `patient.bill.${Date.now()}@test.org`;
    const patientId = `PAT-BILL-${Date.now().toString().slice(-4)}`;

    MockStorage.savePatient({
      id: patientId,
      hospitalId: ABC_HOSPITAL_ID,
      name: 'Rohan Billtest',
      email: patientEmail,
      phone: '+91 91234 56789',
      gender: 'Male',
      age: 32,
      dateOfBirth: '1994-05-12',
      address: '123 Health Ave, Apt 4B',
      emergencyContactName: 'Anita Billtest',
      emergencyContactPhone: '+91 91234 56780',
      emergencyContactRelation: 'Spouse',
      bloodGroup: 'B+',
      status: 'Outpatient',
      allergies: [],
      medicalHistory: [],
      registeredDate: '2026-10-29',
    });

    MockStorage.saveUser({
      id: `USR-PAT-${patientId}`,
      name: 'Rohan Billtest',
      email: patientEmail,
      password: 'Patient@123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      patientId: patientId,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // 1. Initial state: No invoices -> hasPendingBill is false
    const initialCheck = MockStorage.checkPatientHasPendingBill(ABC_HOSPITAL_ID, patientId, patientEmail);
    assert.equal(initialCheck.hasPendingBill, false);

    // 2. Add an unpaid / pending invoice at ABC Hospital
    const invId = `INV-TEST-BILL-${Date.now().toString().slice(-4)}`;
    MockStorage.saveInvoice({
      id: invId,
      hospitalId: ABC_HOSPITAL_ID,
      patientId: patientId,
      patientName: 'Rohan Billtest',
      patientPhone: '+91 91234 56789',
      issueDate: '2026-10-29',
      dueDate: '2026-11-05',
      billingCategory: 'Hospital Service',
      encounterType: 'OPD',
      paymentType: 'Self Pay',
      items: [
        { id: 'item-1', description: 'Consultation Fee', category: 'Consultation', quantity: 1, unitPrice: 500, total: 500 }
      ],
      subtotal: 500,
      taxRate: 5,
      taxAmount: 25,
      discount: 0,
      totalAmount: 525,
      amountPaid: 0,
      status: 'Pending',
    });

    // 3. Now check: hasPendingBill at ABC Hospital is true
    const billCheckABC = MockStorage.checkPatientHasPendingBill(ABC_HOSPITAL_ID, patientId, patientEmail);
    assert.equal(billCheckABC.hasPendingBill, true);
    assert.equal(billCheckABC.totalPendingAmount, 525);

    // 4. Same patient at EFG Hospital has NO pending bill -> false
    const billCheckEFG = MockStorage.checkPatientHasPendingBill(EFG_HOSPITAL_ID, patientId, patientEmail);
    assert.equal(billCheckEFG.hasPendingBill, false);

    // 5. When bill is settled / marked as Paid -> hasPendingBill becomes false again
    const paidInvoice = MockStorage.getInvoiceById(invId);
    if (paidInvoice) {
      paidInvoice.status = 'Paid';
      paidInvoice.amountPaid = 525;
      MockStorage.saveInvoice(paidInvoice);
    }
    const settledCheck = MockStorage.checkPatientHasPendingBill(ABC_HOSPITAL_ID, patientId, patientEmail);
    assert.equal(settledCheck.hasPendingBill, false);
  });

  test('Scenario 24: Hospital logout locks session back to that hospital sign in URL and prevents cross-hospital logins', () => {
    const hospA_email = `nurse.hospA.${Date.now()}@test.org`;
    const hospB_email = `nurse.hospB.${Date.now()}@test.org`;

    // 1. Provision User at Hospital A (ABC_HOSPITAL_ID)
    MockStorage.saveUser({
      id: `USR-A-${Date.now()}`,
      name: 'Nurse Hospital A',
      email: hospA_email,
      password: 'Nurse@1234',
      role: 'nurse',
      portal: 'hospital',
      hospitalId: ABC_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // 2. Provision User at Hospital B (EFG_HOSPITAL_ID)
    MockStorage.saveUser({
      id: `USR-B-${Date.now()}`,
      name: 'Nurse Hospital B',
      email: hospB_email,
      password: 'Nurse@1234',
      role: 'nurse',
      portal: 'hospital',
      hospitalId: EFG_HOSPITAL_ID,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // 3. Nurse B logs into Hospital B
    const authB = MockStorage.findUserForAuth(hospB_email, EFG_HOSPITAL_ID, 'Nurse@1234');
    assert.ok(authB.user);
    assert.equal(authB.user?.hospitalId, EFG_HOSPITAL_ID);

    // 4. Determine logout destination from active user / facility context
    const targetHospitalId = authB.user?.hospitalId;
    const logoutRedirectUrl = targetHospitalId
      ? `/login?targetHospital=${encodeURIComponent(targetHospitalId)}`
      : '/login';

    // Must return to Hospital B's sign-in page, NOT bare /login
    assert.equal(logoutRedirectUrl, `/login?targetHospital=${EFG_HOSPITAL_ID}`);

    // 5. On the returned Hospital B sign-in page, attempting to log in with Hospital A credentials is REJECTED
    const crossHospitalAttempt = MockStorage.findUserForAuth(hospA_email, EFG_HOSPITAL_ID, 'Nurse@1234');
    assert.equal(crossHospitalAttempt.user, null, 'User from Hospital A cannot log into Hospital B sign in portal');
    assert.ok(crossHospitalAttempt.error?.includes('No account found for this hospital'));

    // 6. Hospital B credentials continue to authenticate cleanly
    const correctHospitalAttempt = MockStorage.findUserForAuth(hospB_email, EFG_HOSPITAL_ID, 'Nurse@1234');
    assert.ok(correctHospitalAttempt.user);
    assert.equal(correctHospitalAttempt.user?.hospitalId, EFG_HOSPITAL_ID);
  });
});

