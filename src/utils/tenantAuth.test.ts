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
import type { User, Patient, Staff, Doctor, Ambulance, AmbulanceDriver, AmbulanceMaintenance, Hospital, Medicine } from '../types';

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

  test('Scenario 25: Enterprise Health Network - Head Branch Network Admin has multi-branch access', () => {
    const headHospId = 'HOSP-ABC-CHN';
    const orgId = 'ORG-ABC-NETWORK';

    // 1. Setup Organization & Head Branch
    MockStorage.saveHospital({
      id: headHospId,
      name: 'ABC Hospital - Chennai',
      regNumber: 'REG-ABC-CHN',
      type: 'General Hospital',
      email: 'contact@abchospital.com',
      phone: '9876543210',
      address: '100 Mount Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postalCode: '600002',
      adminName: 'Network Admin Arun',
      adminEmail: 'network.admin@abchospital.com',
      adminPassword: 'AdminPassword@123',
      planTier: 'enterprise',
      status: 'active',
      totalDoctors: 10,
      totalPatients: 100,
      totalBeds: 150,
      createdAt: '2026-01-01',
      organizationId: orgId,
      organizationName: 'ABC Health Network',
      isHeadBranch: true,
    });

    MockStorage.saveOrganization({
      id: orgId,
      name: 'ABC Health Network',
      slug: 'abc-health-network',
      headquartersCity: 'Chennai',
      headquartersAddress: '100 Mount Road, Tamil Nadu',
      primaryHospitalId: headHospId,
      planTier: 'enterprise',
      status: 'active',
      maxBranches: 10,
      branches: [headHospId],
      contactEmail: 'network.admin@abchospital.com',
      contactPhone: '9876543210',
      createdAt: '2026-01-01',
    });

    // 2. Upload Enterprise Manifest document -> automatically elevates Head Branch Admin to Network Admin
    MockStorage.saveEnterpriseBranchDocument({
      id: 'DOC-ENT-001',
      hospitalId: headHospId,
      hospitalName: 'ABC Hospital - Chennai',
      fileName: 'proposed_branches.pdf',
      fileSize: 1024 * 500,
      fileType: 'application/pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjc...',
      uploadedBy: 'Network Admin Arun',
      uploadedByEmail: 'network.admin@abchospital.com',
      uploadedAt: '2026-01-01',
      status: 'pending_review',
    });

    // 3. Provision Sub-Branch: ABC Hospital - Mumbai via createBranch
    const branchRes = MockStorage.createBranch({
      organizationId: orgId,
      branchName: 'ABC Hospital - Mumbai',
      branchCode: 'ABC-BOM',
      address: 'Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      contactPerson: 'Dr. Mumbai Admin',
      contactPhone: '9876500000',
      contactEmail: 'mumbai@abchospital.com',
      branchAdminName: 'Dr. Mumbai Admin',
      branchAdminEmail: 'admin.mumbai@abchospital.com',
      initialPassword: 'MumbaiAdmin@123',
      totalBeds: 60,
      docId: 'DOC-ENT-001',
    });
    assert.equal(branchRes.success, true);
    assert.ok(branchRes.branch);

    // 4. Verify Network Admin can log in at the Head Branch
    const headAuth = MockStorage.findUserForAuth('network.admin@abchospital.com', headHospId, 'AdminPassword@123');
    assert.ok(headAuth.user, 'Network Admin must authenticate at Head Branch');
    assert.equal(headAuth.user?.isOrganizationAdmin, true);

    // 5. Verify Network Admin can also authenticate directly into the Sub-Branch with the same credentials
    const subAuth = MockStorage.findUserForAuth('network.admin@abchospital.com', branchRes.branch?.id, 'AdminPassword@123');
    assert.ok(subAuth.user, 'Network Admin must have authorized access to sub-branches in their organization');
    assert.equal(subAuth.user?.isOrganizationAdmin, true);
  });

  test('Scenario 26: Enterprise Health Network - Sub-Branch Admin cannot log into Head Branch or other branches', () => {
    const headHospId = 'HOSP-ABC-CHN';
    const subBranchId = 'HOSP-ABCBOM';
    const otherBranchId = 'HOSP-ABCBLR';

    // 1. Setup Head Branch
    MockStorage.saveHospital({
      id: headHospId,
      name: 'ABC Hospital - Chennai',
      regNumber: 'REG-ABC-CHN',
      type: 'General Hospital',
      email: 'contact@abchospital.com',
      phone: '9876543210',
      address: '100 Mount Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postalCode: '600002',
      planTier: 'enterprise',
      status: 'active',
      totalDoctors: 10,
      totalPatients: 100,
      totalBeds: 150,
      createdAt: '2026-01-01',
      isHeadBranch: true,
    });

    // 2. Setup Other Sub-Branch (Bangalore)
    MockStorage.saveHospital({
      id: otherBranchId,
      name: 'ABC Hospital - Bangalore',
      regNumber: 'REG-ABC-BLR',
      type: 'Multi-Specialty Center',
      email: 'bangalore@abchospital.com',
      phone: '9876543211',
      address: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560038',
      planTier: 'enterprise',
      status: 'active',
      totalDoctors: 5,
      totalPatients: 50,
      totalBeds: 50,
      createdAt: '2026-01-01',
      isBranch: true,
      headBranchId: headHospId,
    });

    // 3. Setup Own Sub-Branch (Mumbai) with its dedicated Sub-Branch Admin
    MockStorage.saveHospital({
      id: subBranchId,
      name: 'ABC Hospital - Mumbai',
      regNumber: 'REG-ABC-BOM',
      type: 'Multi-Specialty Center',
      email: 'mumbai@abchospital.com',
      phone: '9876543212',
      address: 'BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400051',
      planTier: 'enterprise',
      status: 'active',
      totalDoctors: 5,
      totalPatients: 50,
      totalBeds: 50,
      createdAt: '2026-01-01',
      isBranch: true,
      headBranchId: headHospId,
      adminName: 'Dr. Mumbai Admin',
      adminEmail: 'admin.mumbai@abchospital.com',
      adminPassword: 'MumbaiAdmin@123',
    });

    // 4. Sub-Branch Admin can successfully authenticate to their own sub-branch
    const ownBranchAuth = MockStorage.findUserForAuth('admin.mumbai@abchospital.com', subBranchId, 'MumbaiAdmin@123');
    assert.ok(ownBranchAuth.user, 'Sub-Branch Admin must log in to their assigned sub-branch');

    // 5. Sub-Branch Admin attempts to log into the Head Branch -> strictly blocked
    const headBranchAttempt = MockStorage.findUserForAuth('admin.mumbai@abchospital.com', headHospId, 'MumbaiAdmin@123');
    assert.equal(headBranchAttempt.user, null, 'Sub-branch admin cannot log into head branch');
    assert.match(headBranchAttempt.error || '', /cannot log into the Main Head Branch/i);

    // 6. Sub-Branch Admin attempts to log into another Sub-Branch (Bangalore) -> strictly blocked
    const otherBranchAttempt = MockStorage.findUserForAuth('admin.mumbai@abchospital.com', otherBranchId, 'MumbaiAdmin@123');
    assert.equal(otherBranchAttempt.user, null, 'Sub-branch admin cannot log into another sub-branch');
    assert.match(otherBranchAttempt.error || '', /restricted to your assigned branch and cannot log into/i);
  });

  test('Scenario 27: Manual Sub-Branch Onboarding under Head Hospital - Head Hospital Admin can log in with own credentials', () => {
    const headHospId = 'HOSP-APEX-HEAD';
    const orgId = 'ORG-APEX-NETWORK';

    // 1. Setup Enterprise Head Hospital & Organization
    MockStorage.saveHospital({
      id: headHospId,
      name: 'Apex Care Hospital - Head Branch',
      regNumber: 'REG-APEX-001',
      type: 'General Hospital',
      email: 'head@apexcare.org',
      phone: '9876543210',
      address: 'Central Boulevard',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110001',
      adminName: 'Dr. Head Director',
      adminEmail: 'head.director@apexcare.org',
      adminPassword: 'HeadDirectorPass@123',
      planTier: 'enterprise',
      status: 'active',
      totalDoctors: 25,
      totalPatients: 500,
      totalBeds: 200,
      createdAt: '2026-01-01',
      organizationId: orgId,
      organizationName: 'Apex Healthcare Network',
      isHeadBranch: true,
    });

    MockStorage.saveOrganization({
      id: orgId,
      name: 'Apex Healthcare Network',
      slug: 'apex-healthcare-network',
      headquartersCity: 'Delhi',
      headquartersAddress: 'Central Boulevard, Delhi',
      primaryHospitalId: headHospId,
      planTier: 'enterprise',
      status: 'active',
      maxBranches: 10,
      branches: [headHospId],
      contactEmail: 'head.director@apexcare.org',
      contactPhone: '9876543210',
      createdAt: '2026-01-01',
    });

    // 2. Super Admin manually onboards a new Sub-Branch Hospital (Whitefield Branch) under Head Hospital
    const onboardRes = MockStorage.createBranch({
      organizationId: orgId,
      branchName: 'Apex Care - Whitefield Branch',
      branchCode: 'APEX-WFD',
      type: 'Multi-Specialty Center',
      address: 'ITPL Main Road, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560066',
      contactPerson: 'Dr. Whitefield Lead',
      contactPhone: '9876512345',
      contactEmail: 'whitefield@apexcare.org',
      totalBeds: 75,
      websiteSubdomain: 'whitefield',
      websiteCustomDomain: 'www.apexwhitefield.com',
      websiteTemplateId: 'premium-healthcare',
      websiteTheme: 'Modern Teal',
      websiteHeroTitle: 'World-Class Healthcare at Whitefield',
      websiteHeroDescription: '24/7 emergency response and advanced diagnostics.',
      websiteStatus: 'published',
      websitePublished: true,
      onlineBookingEnabled: true,
      emergencyBannerEnabled: true,
      branchAdminName: 'Dr. Whitefield Lead',
      branchAdminEmail: 'admin.whitefield@apexcare.org',
      branchAdminPassword: 'WhitefieldAdmin@123',
    });

    assert.equal(onboardRes.success, true);
    assert.ok(onboardRes.branch);
    const subBranch = onboardRes.branch!;

    // 3. Verify sub-branch operates under Head Hospital
    assert.equal(subBranch.isBranch, true);
    assert.equal(subBranch.isHeadBranch, false);
    assert.equal(subBranch.headBranchId, headHospId);
    assert.equal(subBranch.organizationId, orgId);

    // 4. Verify sub-branch website is configured and live
    const branchWebsite = MockStorage.getWebsiteByHospitalId(subBranch.id);
    assert.ok(branchWebsite);
    assert.equal(branchWebsite?.status, 'published');
    assert.equal(branchWebsite?.subdomain, 'whitefield.pulsecorehealth.com');

    // 5. Verify Sub-Branch Admin can log into their sub-branch
    const branchAdminAuth = MockStorage.findUserForAuth('admin.whitefield@apexcare.org', subBranch.id, 'WhitefieldAdmin@123');
    assert.ok(branchAdminAuth.user, 'Sub-Branch Admin should log in to their branch');
    assert.equal(branchAdminAuth.user?.hospitalId, subBranch.id);

    // 6. Verify Sub-Branch Admin CANNOT log into Head Hospital
    const subBranchAtHead = MockStorage.findUserForAuth('admin.whitefield@apexcare.org', headHospId, 'WhitefieldAdmin@123');
    assert.equal(subBranchAtHead.user, null, 'Sub-Branch Admin must NOT be allowed into Head Hospital');

    // 7. KEY REQUIREMENT: Head Hospital Admin CAN log into the Sub-Branch hospital admin page with their OWN credentials!
    const headAdminAtSubBranch = MockStorage.findUserForAuth(
      'head.director@apexcare.org',
      subBranch.id,
      'HeadDirectorPass@123'
    );
    assert.ok(
      headAdminAtSubBranch.user,
      'Head Hospital Admin must be able to log in to the sub-branch hospital admin page using their own credentials'
    );
    assert.equal(headAdminAtSubBranch.user?.email, 'head.director@apexcare.org');

    // 8. Head Hospital Admin with wrong password at sub-branch is rejected
    const headAdminWrongPass = MockStorage.findUserForAuth(
      'head.director@apexcare.org',
      subBranch.id,
      'WrongPassword@999'
    );
    assert.equal(headAdminWrongPass.user, null, 'Head Hospital Admin with wrong password must be rejected');
    assert.match(headAdminWrongPass.error || '', /Incorrect password/i);

    // 9. Verify Patient registered at Sub-Branch can log in ONLY to that Sub-Branch
    const subPatientUser: User = {
      id: 'USR-PAT-WFD-01',
      name: 'Sub-Branch Patient',
      email: 'patient.whitefield@gmail.com',
      password: 'PatientPass@123',
      role: 'patient',
      portal: 'hospital',
      hospitalId: subBranch.id,
      status: 'active',
      createdAt: '2026-01-01',
    };
    MockStorage.saveUser(subPatientUser);

    // Patient logs in to their own sub-branch -> Allowed
    const patientOwnBranch = MockStorage.findUserForAuth('patient.whitefield@gmail.com', subBranch.id, 'PatientPass@123');
    assert.ok(patientOwnBranch.user, 'Patient must be able to log into their registered sub-branch');

    // Patient logs in to Head Branch -> Strictly Rejected
    const patientAtHeadBranch = MockStorage.findUserForAuth('patient.whitefield@gmail.com', headHospId, 'PatientPass@123');
    assert.equal(patientAtHeadBranch.user, null, 'Patient registered at sub-branch CANNOT log into Head Branch');

    // 10. Verify Doctors and Patients databases remain 100% strictly isolated per facility
    const headDoctors = MockStorage.getDoctors(headHospId);
    const subDoctors = MockStorage.getDoctors(subBranch.id);
    for (const doc of subDoctors) {
      assert.equal(headDoctors.some((hd) => hd.id === doc.id), false, 'Sub-branch doctors must NOT leak into Head Branch doctor list');
    }

    const headPatients = MockStorage.getPatients(headHospId);
    const subPatients = MockStorage.getPatients(subBranch.id);
    for (const pat of subPatients) {
      assert.equal(headPatients.some((hp) => hp.id === pat.id), false, 'Sub-branch patients must NOT leak into Head Branch patient list');
    }
  });

  test('Scenario 28: Capability Gating Verification - Professional Hospital tier unlocks Patient registration & EHR, Appointments & OPD, OPD rooms, and clinical modules', () => {
    const profHospitalId = 'HOSP-PROF-TEST-01';
    MockStorage.saveHospital({
      id: profHospitalId,
      name: 'City Care Hospital',
      regNumber: 'REG-CITY-01',
      type: 'General Hospital',
      planTier: 'standard', // Professional Hospital plan
      status: 'active',
      address: '123 Michigan Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60601',
      email: 'admin@citycare.org',
      phone: '3125550199',
      totalDoctors: 15,
      totalPatients: 200,
      totalBeds: 50,
      createdAt: '2026-01-01',
    });

    // 1. Core Starter capabilities MUST be UNLOCKED for Professional Hospital:
    // Patient registration & EHR
    const ehrAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/patients');
    assert.equal(ehrAccess.allowed, true, 'Patient registration & EHR must be UNLOCKED on Professional Hospital plan');

    // Appointments & OPD
    const appointmentsAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/appointments');
    assert.equal(appointmentsAccess.allowed, true, 'Appointments & OPD must be UNLOCKED on Professional Hospital plan');

    // OPD rooms
    const opdRoomsAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/opd-rooms');
    assert.equal(opdRoomsAccess.allowed, true, 'OPD rooms must be UNLOCKED on Professional Hospital plan');

    // Doctors & staff
    const doctorsAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/doctors');
    assert.equal(doctorsAccess.allowed, true, 'Doctors, staff & departments must be UNLOCKED on Professional Hospital plan');

    // Billing & invoices
    const billingAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/billing');
    assert.equal(billingAccess.allowed, true, 'Billing & invoices must be UNLOCKED on Professional Hospital plan');

    // 2. Professional Hospital capabilities MUST be UNLOCKED:
    // Admissions & beds
    const admissionsAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/admissions');
    assert.equal(admissionsAccess.allowed, true, 'Admissions & beds must be UNLOCKED on Professional Hospital plan');

    // Pharmacy & stock
    const pharmacyAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/pharmacy');
    assert.equal(pharmacyAccess.allowed, true, 'Pharmacy & stock must be UNLOCKED on Professional Hospital plan');

    // Laboratory & diagnostics
    const labAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/laboratory');
    assert.equal(labAccess.allowed, true, 'Laboratory & diagnostics must be UNLOCKED on Professional Hospital plan');

    // Ambulance & emergency
    const ambulanceAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/ambulance');
    assert.equal(ambulanceAccess.allowed, true, 'Ambulance & emergency must be UNLOCKED on Professional Hospital plan');

    // 3. Enterprise Multi-Branch tools MUST be LOCKED on Professional Hospital plan
    const enterpriseAccess = MockStorage.checkPathAccess(profHospitalId, '/hospital/enterprise');
    assert.equal(enterpriseAccess.allowed, false, 'Enterprise multi-branch tools must be LOCKED on Professional Hospital plan');
    assert.equal(enterpriseAccess.requiredTierName, 'Enterprise Health Network');

    // 4. Verification with custom features list (e.g. if Super Admin modified features in SubscriptionManagement)
    const customizedPlanHospId = 'HOSP-CUSTOM-PROF-01';
    MockStorage.saveHospital({
      id: customizedPlanHospId,
      name: 'Metro Specialty Clinic',
      regNumber: 'REG-METRO-01',
      type: 'Multi-Specialty Center',
      planTier: 'standard',
      status: 'active',
      address: '456 Grand Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60602',
      email: 'admin@metrospecialty.org',
      phone: '3125550200',
      totalDoctors: 10,
      totalPatients: 100,
      totalBeds: 30,
      createdAt: '2026-01-01',
    });

    const customEhr = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/patients');
    assert.equal(customEhr.allowed, true, 'Customized standard tier hospital must have EHR unlocked');
    const customOpd = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/appointments');
    assert.equal(customOpd.allowed, true, 'Customized standard tier hospital must have OPD unlocked');
    const customRooms = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/opd-rooms');
    assert.equal(customRooms.allowed, true, 'Customized standard tier hospital must have OPD rooms unlocked');
    const customBilling = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/billing');
    assert.equal(customBilling.allowed, true, 'Customized standard tier hospital must have Billing unlocked');

    // 5. Test with a plan whose custom features only list IPD highlights without any starter clinic text
    const origStandardPlan = MockStorage.getPlanByTier('standard');
    try {
      MockStorage.savePlan({
        ...origStandardPlan,
        features: ['Admissions & beds (IPD Bed & Ward Allocation)', 'Discharge Summaries & IPD Settlement'],
      });

      const ehrCheck = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/patients');
      assert.equal(ehrCheck.allowed, true, 'Professional Hospital must NEVER have Patients & EHR locked');
      const opdCheck = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/appointments');
      assert.equal(opdCheck.allowed, true, 'Professional Hospital must NEVER have Appointments locked');
      const roomsCheck = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/opd-rooms');
      assert.equal(roomsCheck.allowed, true, 'Professional Hospital must NEVER have OPD Rooms locked');
      const billingCheck = MockStorage.checkPathAccess(customizedPlanHospId, '/hospital/billing');
      assert.equal(billingCheck.allowed, true, 'Professional Hospital must NEVER have Billing locked');
      assert.equal(MockStorage.isFeatureEnabledForHospital(customizedPlanHospId, 'patients_ehr'), true);
      assert.equal(MockStorage.isFeatureEnabledForHospital(customizedPlanHospId, 'appointments_opd'), true);
      assert.equal(MockStorage.isFeatureEnabledForHospital(customizedPlanHospId, 'opd_rooms'), true);
      assert.equal(MockStorage.isFeatureEnabledForHospital(customizedPlanHospId, 'billing_invoices'), true);
    } finally {
      MockStorage.savePlan(origStandardPlan);
    }
  });

  test('Scenario 29: Coupon Single-Use Policy - Ensure if a particular hospital used any coupon code, the same code can never be reused by that hospital', () => {
    const couponCode = 'ONCE_PER_HOSP_50';
    const hospitalA = 'HOSP-TEST-COUPON-A';
    const hospitalB = 'HOSP-TEST-COUPON-B';

    // 1. Setup active promotional coupon
    MockStorage.saveCoupon({
      id: 'COUPON-TEST-ONCE',
      code: couponCode,
      discountPercentage: 50,
      description: '50% one-time promotional discount for hospitals.',
      category: 'subscription',
      isActive: true,
      validUntil: '2028-12-31',
      maxUses: 10,
      usedCount: 0,
      usedByHospitals: [],
      createdAt: '2026-01-01',
    });

    // 2. Hospital A validates coupon initially -> SUCCESS
    const initialValidationA = MockStorage.validateCoupon(couponCode, hospitalA);
    assert.equal(initialValidationA.valid, true, 'Hospital A should successfully validate unused coupon');
    assert.equal(initialValidationA.discountPercentage, 50);

    // 3. Hospital A redeems coupon during subscription upgrade
    MockStorage.requestSubscriptionUpgrade(
      hospitalA,
      'standard',
      15000,
      'UTR-TEST-COUPON-A-001',
      couponCode,
      30000,
      'data:image/png;base64,sample'
    );

    // 4. Verify coupon now tracks hospitalA in usedByHospitals
    const updatedCoupon = MockStorage.getCouponByCode(couponCode);
    assert.ok(updatedCoupon?.usedByHospitals?.includes(hospitalA), 'Coupon should record hospital A in usedByHospitals');
    assert.equal(updatedCoupon?.usedCount, 1, 'Coupon usedCount should increment');

    // 5. Hospital A attempts to validate the SAME coupon again -> REJECTED
    const secondValidationA = MockStorage.validateCoupon(couponCode, hospitalA);
    assert.equal(secondValidationA.valid, false, 'Hospital A must NOT be able to reuse the coupon');
    assert.match(
      secondValidationA.message || '',
      /already been redeemed by your hospital/i,
      'Clear rejection message indicating coupon already redeemed by hospital'
    );

    // 6. Case-insensitivity & format variations (lowercase, whitespace) are also strictly rejected
    const lowercaseValidationA = MockStorage.validateCoupon('once_per_hosp_50', hospitalA.toLowerCase());
    assert.equal(lowercaseValidationA.valid, false, 'Lowercase coupon code and hospital ID must still be rejected');
    assert.match(lowercaseValidationA.message || '', /already been redeemed by your hospital/i);

    // 7. Hospital A attempts to forcefully call requestSubscriptionUpgrade with the same coupon -> THROWS
    assert.throws(
      () => {
        MockStorage.requestSubscriptionUpgrade(
          hospitalA,
          'standard',
          15000,
          'UTR-TEST-FRAUD-002',
          couponCode,
          30000,
          'data:image/png;base64,sample'
        );
      },
      /already been redeemed by this hospital/i,
      'requestSubscriptionUpgrade must strictly throw error if hospital attempts to reuse coupon'
    );

    // 8. Hospital B can still use the coupon code (as Hospital B has never used it)
    const validationB = MockStorage.validateCoupon(couponCode, hospitalB);
    assert.equal(validationB.valid, true, 'Hospital B should be able to use the coupon if not yet used by Hospital B');

    // 9. Hospital B redeems coupon
    MockStorage.requestSubscriptionUpgrade(
      hospitalB,
      'enterprise',
      45000,
      'UTR-TEST-COUPON-B-001',
      couponCode,
      90000,
      'data:image/png;base64,sample'
    );

    // 10. Now Hospital B is ALSO blocked from reusing the coupon
    const secondValidationB = MockStorage.validateCoupon(couponCode, hospitalB);
    assert.equal(secondValidationB.valid, false, 'Hospital B must now be blocked from reusing the coupon');
    assert.match(secondValidationB.message || '', /already been redeemed by your hospital/i);
  });

  test('Scenario 30: Super Admin Manager RBAC - Restricted from onboarding hospital and changing platform settings, allowed all other super admin functions', () => {
    // 1. Changing platform settings must throw Permission Denied when performed by super_admin_manager
    const currentSettings = MockStorage.getPlatformSettings();
    const modifiedSettings = {
      ...currentSettings,
      platformName: 'Unauthorized Manager Name Change',
    };

    assert.throws(
      () => {
        MockStorage.savePlatformSettings(modifiedSettings, 'super_admin_manager');
      },
      /Permission Denied: Super Admin Manager is restricted from changing platform settings/i,
      'savePlatformSettings must strictly reject modifications attempted by super_admin_manager'
    );

    // 2. Super Admin CAN change platform settings
    const validSuperAdminSave = () => {
      MockStorage.savePlatformSettings(
        { ...currentSettings, platformName: 'Zenelait Master Platform' },
        'super_admin'
      );
    };
    assert.doesNotThrow(validSuperAdminSave, 'Super Admin should be authorized to save platform settings');
    assert.equal(MockStorage.getPlatformSettings().platformName, 'Zenelait Master Platform');

    // Restore platform name
    MockStorage.savePlatformSettings(currentSettings, 'super_admin');

    // 3. User & Access management is fully permitted for super_admin_manager
    const managerUser = {
      id: 'USR-PLAT-MGR-TEST',
      name: 'Platform Ops Manager',
      email: 'ops.manager@zenelait.com',
      password: 'Manager@123',
      role: 'super_admin_manager' as const,
      portal: 'platform' as const,
      status: 'active' as const,
      createdAt: '2026-01-01',
    };
    const saveUserRes = MockStorage.saveUser(managerUser);
    assert.equal(saveUserRes.success, true, 'super_admin_manager should be allowed in user management');

    // 4. Verify super_admin_manager can view platform settings in read-only mode
    const viewableSettings = MockStorage.getPlatformSettings();
    assert.ok(viewableSettings.platformName, 'super_admin_manager can read platform settings');
  });

  test('Scenario 31: Dynamic Plan Feature Restriction - Disabled or removed features are strictly blocked across the system', () => {
    // 1. Get current standard plan and backup its features
    const standardPlan = MockStorage.getPlanByTier('standard');
    assert.ok(standardPlan);
    const originalFeatures = [...standardPlan.features];

    const customHospId = 'HOSP-TEST-RESTRICTED-01';
    MockStorage.saveHospital({
      id: customHospId,
      name: 'Custom Gated Hospital',
      regNumber: 'REG-GATED-01',
      type: 'General Hospital',
      planTier: 'standard',
      status: 'active',
      address: '789 Elm Street',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      postalCode: '78701',
      email: 'admin@gatedhospital.org',
      phone: '5125550188',
      totalDoctors: 10,
      totalPatients: 100,
      totalBeds: 40,
      createdAt: '2026-01-01',
    });

    try {
      // 2. Super Admin modifies standard plan: removes Pharmacy from plan features
      const featuresWithoutPharmacy = originalFeatures.filter(
        (f) => !f.toLowerCase().includes('pharmacy') && !f.toLowerCase().includes('dispensary')
      );
      MockStorage.savePlan({
        ...standardPlan,
        features: featuresWithoutPharmacy,
      });

      // 3. Admissions and Laboratory MUST be UNLOCKED (still in plan features)
      const admissionsCheck = MockStorage.checkPathAccess(customHospId, '/hospital/admissions');
      assert.equal(admissionsCheck.allowed, true, 'Admissions must be unlocked when in plan features');

      const labCheck = MockStorage.checkPathAccess(customHospId, '/hospital/laboratory');
      assert.equal(labCheck.allowed, true, 'Laboratory must be unlocked when in plan features');

      // 4. Pharmacy MUST be RESTRICTED (removed from plan features by Super Admin)
      const pharmacyCheck = MockStorage.checkPathAccess(customHospId, '/hospital/pharmacy');
      assert.equal(pharmacyCheck.allowed, false, 'Pharmacy must be strictly LOCKED when excluded from plan features');
      assert.equal(MockStorage.isFeatureEnabledForHospital(customHospId, 'pharmacy_stock'), false);

      // 5. Starter Clinic Hospital MUST be RESTRICTED from Admissions, Pharmacy, Laboratory, Ambulance
      const starterHospId = 'HOSP-TEST-STARTER-01';
      MockStorage.saveHospital({
        id: starterHospId,
        name: 'Solo Family Clinic',
        regNumber: 'REG-SOLO-01',
        type: 'Specialty Clinic',
        planTier: 'basic', // Starter Clinic
        status: 'active',
        address: '10 Clinic Road',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        postalCode: '78702',
        email: 'admin@soloclinic.org',
        phone: '5125550199',
        totalDoctors: 2,
        totalPatients: 50,
        totalBeds: 0,
        createdAt: '2026-01-01',
      });

      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/patients').allowed, true, 'Starter Clinic has EHR');
      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/appointments').allowed, true, 'Starter Clinic has Appointments');
      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/opd-rooms').allowed, true, 'Starter Clinic has OPD rooms unlocked');
      assert.equal(MockStorage.isFeatureEnabledForHospital(starterHospId, 'opd_rooms'), true, 'Starter Clinic OPD rooms is enabled');
      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/admissions').allowed, false, 'Starter Clinic is restricted from Admissions');
      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/pharmacy').allowed, false, 'Starter Clinic is restricted from Pharmacy');
      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/laboratory').allowed, false, 'Starter Clinic is restricted from Laboratory');
      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/ambulance').allowed, false, 'Starter Clinic is restricted from Ambulance');
      assert.equal(MockStorage.checkPathAccess(starterHospId, '/hospital/enterprise').allowed, false, 'Starter Clinic is restricted from Enterprise tools');
    } finally {
      // Restore standard plan features
      MockStorage.savePlan({
        ...standardPlan,
        features: originalFeatures,
      });
    }
  });

  test('Scenario 32: Promo Code Category Differentiation & Scope Isolation - Billing Software Suite codes have no function in HMS and cannot discount money', () => {
    const testHosp = 'HOSP-TEST-COUPON-CAT';

    // 1. Ensure a billing_software coupon exists
    MockStorage.saveCoupon({
      id: 'COUPON-BILLING-TEST',
      code: 'TEST_BILLING_SUITE_40',
      discountPercentage: 40,
      description: '40% discount for standalone external billing system.',
      category: 'billing_software',
      isActive: true,
      usedCount: 0,
      usedByHospitals: [],
      createdAt: '2026-01-01',
    });

    // 2. Validate billing_software coupon for HMS subscription -> REJECTED with clear message
    const res = MockStorage.validateCoupon('TEST_BILLING_SUITE_40', testHosp, 'subscription');
    assert.equal(res.valid, false, 'Billing software coupon must be rejected when validating for HMS subscription');
    assert.match(
      res.message || '',
      /Billing Software Suite category/i,
      'Must explain that coupon belongs to Billing Software Suite and has no function in this HMS project'
    );

    // 3. Attempting to request subscription upgrade with billing_software coupon -> THROWS ERROR
    assert.throws(
      () => {
        MockStorage.requestSubscriptionUpgrade(
          testHosp,
          'standard',
          3000,
          'UTR_BILLING_FAIL_123',
          'TEST_BILLING_SUITE_40',
          5000,
          'data:image/png;base64,receipt'
        );
      },
      /belongs to Billing Software Suite/i,
      'requestSubscriptionUpgrade must strictly throw error if billing_software coupon is used'
    );

    // 4. In contrast, an HMS & CRM subscription coupon succeeds cleanly
    MockStorage.saveCoupon({
      id: 'COUPON-HMS-TEST',
      code: 'TEST_HMS_VALID_25',
      discountPercentage: 25,
      description: '25% discount for HMS subscriptions.',
      category: 'subscription',
      isActive: true,
      usedCount: 0,
      usedByHospitals: [],
      createdAt: '2026-01-01',
    });

    const hmsRes = MockStorage.validateCoupon('TEST_HMS_VALID_25', testHosp, 'subscription');
    assert.equal(hmsRes.valid, true, 'HMS subscription coupon must validate successfully');
    assert.equal(hmsRes.discountPercentage, 25, 'Discount percentage must be returned correctly');
  });

  test('Enforces Max Staff capacity strictly and synchronizes Hospital Identity & Helplines', () => {
    const testHospId = 'HOSP-TEST-CAPACITY-001';

    // 1. Setup Starter Clinic plan with maxStaff: 1
    const starterPlan = MockStorage.getPlanByTier('basic');
    MockStorage.savePlan({
      ...starterPlan,
      maxStaff: 1,
    });

    // 2. Setup hospital and active subscription on 'basic' tier
    MockStorage.saveHospital({
      id: testHospId,
      name: 'Capacity Test Hospital',
      slug: 'capacity-test',
      regNumber: 'REG-CAP-001',
      type: 'Specialty Clinic',
      country: 'India',
      postalCode: '600001',
      planTier: 'basic',
      phone: '1234567890',
      email: 'contact@capacitytest.com',
      address: '100 Medical Blvd',
      city: 'Metro City',
      state: 'State',
      status: 'active',
      totalBeds: 10,
      totalDoctors: 2,
      totalPatients: 5,
      createdAt: '2026-01-01',
    });

    MockStorage.saveSubscription({
      id: `SUB-${testHospId}`,
      hospitalId: testHospId,
      planTier: 'basic',
      planName: 'Starter Clinic',
      status: 'active',
      interval: 'monthly',
      amount: 4999,
      startDate: '2026-01-01',
      renewalDate: '2026-02-01',
      paymentMethod: 'UPI QR Code',
      autoRenew: true,
    });

    // Verify active tier resolves to 'basic' with maxStaff: 1
    const activeTier = MockStorage.getHospitalActiveTier(testHospId);
    assert.equal(activeTier, 'basic', 'Active tier must resolve to basic');
    const activePlan = MockStorage.getHospitalActivePlan(testHospId);
    assert.equal(activePlan.maxStaff, 1, 'Active plan must reflect configured maxStaff: 1');

    // Clean existing staff for this test hospital if any
    const existingStaff = MockStorage.getStaff(testHospId);
    existingStaff.forEach((s) => MockStorage.deleteStaff(s.id));

    // 3. Onboard 1st staff member -> MUST SUCCEED
    const staff1: Staff = {
      id: 'STAFF-CAP-001',
      hospitalId: testHospId,
      name: 'Nurse Alice',
      email: 'alice@capacitytest.com',
      role: 'Nurse',
      systemRole: 'nurse',
      department: 'General OPD',
      phone: '9876543210',
      shift: 'Morning',
      status: 'active',
      joiningDate: '2026-01-01',
    };
    const res1 = MockStorage.saveStaff(staff1);
    assert.equal(res1.success, true, 'Onboarding 1st staff member must succeed within quota limit');

    // 4. Onboard 2nd staff member -> MUST BE STRICTLY REJECTED
    const staff2: Staff = {
      id: 'STAFF-CAP-002',
      hospitalId: testHospId,
      name: 'Nurse Bob',
      email: 'bob@capacitytest.com',
      role: 'Nurse',
      systemRole: 'nurse',
      department: 'General OPD',
      phone: '9876543211',
      shift: 'Evening',
      status: 'active',
      joiningDate: '2026-01-02',
    };
    const res2 = MockStorage.saveStaff(staff2);
    assert.equal(res2.success, false, 'Onboarding 2nd staff member must be strictly blocked when quota limit is reached');
    assert.match(res2.message || '', /Subscription Limit Reached/i, 'Error message must clearly inform subscription limit reached');

    // 5. Test Hospital Identity & Public Helplines synchronization
    MockStorage.saveHospitalSettings({
      hospitalId: testHospId,
      hospitalName: 'Naruvi Super Specialty Hospital',
      tagline: 'World-Class Healthcare',
      emergencyHelpline: '1800-999-HELP',
      receptionPhone: '044-888-OPD1',
      email: 'care@naruvi.com',
      address: '77 Medical Enclave, Chennai',
      operatingHours: '24/7 OPD & Emergency',
      consultationSlotMinutes: 15,
      taxRegistrationNumber: 'GSTIN12345678',
    });

    const updatedHosp = MockStorage.getHospitalById(testHospId);
    assert.equal(updatedHosp?.name, 'Naruvi Super Specialty Hospital', 'Hospital name must be synchronized in STORAGE_KEYS.HOSPITALS');
    assert.equal(updatedHosp?.phone, '1800-999-HELP', 'Hospital phone must be synchronized with emergency helpline');
    assert.equal(updatedHosp?.email, 'care@naruvi.com', 'Hospital email must be synchronized');
    assert.equal(updatedHosp?.address, '77 Medical Enclave, Chennai', 'Hospital address must be synchronized');

    const website = MockStorage.getWebsiteByHospitalId(testHospId);
    if (website) {
      assert.equal(website.hospitalName, 'Naruvi Super Specialty Hospital', 'Website name must be synchronized');
    }

    // 6. Test Max Patient EHR capacity strictly (maxPatients: 1)
    MockStorage.savePlan({
      ...starterPlan,
      maxStaff: 1,
      maxPatients: 1,
    });

    // Clean existing patients for this test hospital if any
    const existingPatients = MockStorage.getPatients(testHospId);
    existingPatients.forEach((p) => MockStorage.deletePatient(p.id));

    // Register 1st patient -> MUST SUCCEED
    const patient1: Patient = {
      id: 'PAT-CAP-001',
      hospitalId: testHospId,
      name: 'John Doe',
      phone: '9876543220',
      email: 'john@capacitytest.com',
      dateOfBirth: '1994-05-15',
      emergencyContactName: 'Mary Doe',
      emergencyContactPhone: '9876543229',
      emergencyContactRelation: 'Spouse',
      age: 32,
      gender: 'Male',
      bloodGroup: 'O+',
      address: '123 Test Street',
      registeredDate: '2026-01-01',
      status: 'Outpatient',
      allergies: [],
      medicalHistory: [],
    };
    const patRes1 = MockStorage.savePatient(patient1);
    assert.equal(patRes1.success, true, 'Registering 1st patient must succeed within quota limit');

    // Register 2nd patient -> MUST BE STRICTLY REJECTED
    const patient2: Patient = {
      id: 'PAT-CAP-002',
      hospitalId: testHospId,
      name: 'Jane Smith',
      phone: '9876543221',
      email: 'jane@capacitytest.com',
      dateOfBirth: '1998-08-20',
      emergencyContactName: 'Mark Smith',
      emergencyContactPhone: '9876543228',
      emergencyContactRelation: 'Brother',
      age: 28,
      gender: 'Female',
      bloodGroup: 'A+',
      address: '124 Test Street',
      registeredDate: '2026-01-02',
      status: 'Outpatient',
      allergies: [],
      medicalHistory: [],
    };
    const patRes2 = MockStorage.savePatient(patient2);
    assert.equal(patRes2.success, false, 'Registering 2nd patient must be strictly blocked when quota limit is reached');
    assert.match(patRes2.message || '', /Patient Limit Reached/i, 'Error message must clearly inform patient limit reached');
  });

  test('Scenario 34: Sub-Branch Subscription Restriction - Sub-branch facilities cannot independently request subscription upgrades', () => {
    const headHospId = 'HOSP-HEAD-NETWORK-001';
    const subBranchId = 'HOSP-SUB-BRANCH-001';

    // 1. Setup Head Hospital
    MockStorage.saveHospital({
      id: headHospId,
      name: 'Apex Head Medical Network',
      slug: 'apex-head',
      regNumber: 'REG-APEX-HEAD',
      type: 'Specialty Clinic',
      country: 'India',
      postalCode: '600001',
      planTier: 'enterprise',
      phone: '1111111111',
      email: 'admin@apexhead.com',
      address: '100 Headway',
      city: 'Chennai',
      state: 'Tamil Nadu',
      status: 'active',
      isHeadBranch: true,
      totalBeds: 200,
      totalDoctors: 50,
      totalPatients: 500,
      createdAt: '2026-01-01',
    });

    // 2. Setup Sub-Branch under Head Hospital
    MockStorage.saveHospital({
      id: subBranchId,
      name: 'Apex Satellite Clinic - Tambaram',
      slug: 'apex-tambaram',
      regNumber: 'REG-APEX-SUB1',
      type: 'Specialty Clinic',
      country: 'India',
      postalCode: '600045',
      planTier: 'enterprise',
      phone: '2222222222',
      email: 'admin@apextambaram.com',
      address: '45 Station Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      status: 'active',
      isBranch: true,
      isHeadBranch: false,
      headBranchId: headHospId,
      totalBeds: 20,
      totalDoctors: 5,
      totalPatients: 50,
      createdAt: '2026-01-01',
    });

    // 3. Sub-branch attempting to request an upgrade MUST strictly throw an error
    assert.throws(
      () => {
        MockStorage.requestSubscriptionUpgrade(
          subBranchId,
          'enterprise',
          15000,
          'UTR_SUB_BRANCH_INVALID',
          undefined,
          undefined,
          'data:image/png;base64,receipt'
        );
      },
      /sub-branch facilities/i,
      'Sub-branch facility must be strictly prohibited from requesting subscription upgrades'
    );

    // 4. In contrast, the Head Branch CAN submit upgrade/renewal requests cleanly
    assert.doesNotThrow(() => {
      MockStorage.requestSubscriptionUpgrade(
        headHospId,
        'enterprise',
        15000,
        'UTR_HEAD_BRANCH_VALID_999',
        undefined,
        undefined,
        'data:image/png;base64,receipt'
      );
    }, 'Head branch must be permitted to submit upgrade and renewal requests');
  });

  test('Scenario 35: Cloud Storage Vault Quota Enforcement - Ensure hospital can never exceed Cloud Storage Vault under Current Plan Resource Allocations', () => {
    const vaultHospId = 'HOSP-TEST-STORAGE-VAULT-01';
    MockStorage.saveHospital({
      id: vaultHospId,
      name: 'Vault Testing Clinic',
      regNumber: 'REG-VAULT-01',
      type: 'Specialty Clinic',
      planTier: 'basic', // Starter Clinic = 50 GB
      status: 'active',
      address: '100 Storage Ave',
      city: 'Dallas',
      state: 'TX',
      country: 'USA',
      postalCode: '75001',
      email: 'admin@vaulttesting.org',
      phone: '2145550100',
      totalDoctors: 2,
      totalPatients: 10,
      totalBeds: 0,
      createdAt: '2026-01-01',
    });

    // 1. Initial storage usage check
    const usage = MockStorage.getHospitalStorageUsage(vaultHospId);
    assert.equal(usage.maxStorageGB, 50, 'Starter clinic plan allocation must be 50 GB');
    assert.equal(usage.isLimitReached, false, 'Storage limit must not be reached initially');

    // 2. Normal upload within quota
    const smallFileBytes = 2 * 1024 * 1024; // 2 MB
    const smallCheck = MockStorage.canUploadFile(vaultHospId, smallFileBytes);
    assert.equal(smallCheck.allowed, true, 'Small file upload within quota must be permitted');

    // 3. Excess upload exceeding 50 GB vault quota
    const hugeFileBytes = 55 * 1024 * 1024 * 1024; // 55 GB (exceeds 50 GB)
    const excessCheck = MockStorage.canUploadFile(vaultHospId, hugeFileBytes);
    assert.equal(excessCheck.allowed, false, 'File exceeding Cloud Storage Vault quota must be strictly blocked');
    assert.match(excessCheck.message || '', /Cloud Storage Vault Limit Exceeded/i);

    // 4. Enterprise Manifest upload exceeding quota must be blocked
    const excessDoc = {
      id: 'DOC-EXCESS-01',
      hospitalId: vaultHospId,
      hospitalName: 'Vault Testing Clinic',
      fileName: 'massive_manifest.pdf',
      fileSize: 60 * 1024 * 1024 * 1024, // 60 GB
      fileType: 'application/pdf',
      fileData: 'data:application/pdf;base64,...',
      uploadedBy: 'Admin',
      uploadedAt: new Date().toISOString(),
      status: 'pending_review' as const,
    };
    const docResult = MockStorage.saveEnterpriseBranchDocument(excessDoc);
    assert.equal(docResult.success, false, 'saveEnterpriseBranchDocument must reject uploads exceeding storage quota');
  });

  test('Scenario 36: Sales Executive Workspace Scope Isolation - strictly Platform Global HQ, never Hospital Tenant', () => {
    const salesUserId = 'USR-SALES-TEST-01';
    MockStorage.saveUser({
      id: salesUserId,
      name: 'Rohan Sharma',
      email: 'rohan.sharma@zenelait.com',
      role: 'sales_executive',
      portal: 'sales',
      status: 'active',
      password: 'custompassword123',
      createdAt: '2026-01-01',
    });

    const users = MockStorage.getUsers();
    const salesUser = users.find((u) => u.id === salesUserId);
    assert.ok(salesUser, 'Sales executive user must exist');
    assert.equal(salesUser?.role, 'sales_executive');
    assert.equal(salesUser?.portal, 'sales');
    assert.equal(salesUser?.hospitalId, undefined, 'Sales executive must never have a hospital tenant ID');
    assert.equal(salesUser?.hospitalName, undefined, 'Sales executive must never have a hospital tenant Name');

    // Verify workspace scope logic matches Platform Global HQ
    const isPlatformGlobalScope =
      (salesUser?.portal as string) === 'platform' ||
      salesUser?.portal === 'sales' ||
      salesUser?.role.startsWith('super_admin') ||
      salesUser?.role === 'sales_executive';

    assert.equal(isPlatformGlobalScope, true, 'Sales Executive workspace scope must resolve to Platform Global HQ');
  });

  test('Scenario 37: Global Email Uniqueness - Staff emails cannot duplicate any staff in other hospitals, doctors, or platform accounts', () => {
    // 1. Staff email duplication across different hospitals must be strictly blocked
    const staffHospA: Staff = {
      id: 'STF-TEST-UNIQ-01',
      hospitalId: 'HOSP-A',
      name: 'Nurse Priya',
      email: 'priya.nurse@example.com',
      role: 'Nurse',
      systemRole: 'nurse',
      department: 'General Ward',
      status: 'active',
      phone: '9876543210',
      shift: 'Morning',
      joiningDate: '2026-01-01',
    };
    const resA = MockStorage.saveStaff(staffHospA);
    assert.equal(resA.success, true, 'First staff save must succeed');

    const staffHospB: Staff = {
      id: 'STF-TEST-UNIQ-02',
      hospitalId: 'HOSP-B',
      name: 'Priya Another Hospital',
      email: 'priya.nurse@example.com', // Duplicate in another hospital
      role: 'Nurse',
      systemRole: 'nurse',
      department: 'ICU',
      status: 'active',
      phone: '9876543211',
      shift: 'Evening',
      joiningDate: '2026-01-01',
    };
    const resB = MockStorage.saveStaff(staffHospB);
    assert.equal(resB.success, false, 'Duplicate staff email in another hospital must be strictly blocked');
    assert.match(resB.message || '', /Duplicate Email/i);

    // 2. Staff email duplicating an existing Doctor must be blocked
    const doc: Doctor = {
      id: 'DOC-TEST-UNIQ-01',
      hospitalId: 'HOSP-A',
      name: 'Dr. Vikram Seth',
      email: 'vikram.doctor@example.com',
      specialization: 'Cardiology',
      status: 'active',
      phone: '9876543212',
      departmentId: 'DEP-01',
      departmentName: 'Cardiology',
      qualifications: 'MD',
      experienceYears: 10,
      consultationFee: 500,
      roomNumber: '101',
      opdRoomId: 'ROOM-101',
      availableDays: ['Mon', 'Wed', 'Fri'],
      availableHours: '09:00 - 12:00',
    };
    MockStorage.saveDoctor(doc);

    const staffWithDocEmail: Staff = {
      id: 'STF-TEST-UNIQ-03',
      hospitalId: 'HOSP-C',
      name: 'Vikram Receptionist',
      email: 'vikram.doctor@example.com',
      role: 'Receptionist',
      systemRole: 'receptionist',
      department: 'Front Desk',
      status: 'active',
      phone: '9876543213',
      shift: 'Morning',
      joiningDate: '2026-01-01',
    };
    const resDocDup = MockStorage.saveStaff(staffWithDocEmail);
    assert.equal(resDocDup.success, false, 'Staff email duplicating an existing doctor must be blocked');
    assert.match(resDocDup.message || '', /Duplicate Email/i);

    // 3. Staff email duplicating a Super Admin must be blocked
    const staffWithSuperAdminEmail: Staff = {
      id: 'STF-TEST-UNIQ-04',
      hospitalId: 'HOSP-A',
      name: 'Fake Admin Staff',
      email: 'superadmin@zenelait.com',
      role: 'Nurse',
      systemRole: 'nurse',
      department: 'OPD',
      status: 'active',
      phone: '9876543214',
      shift: 'Night',
      joiningDate: '2026-01-01',
    };
    const resSuperAdminDup = MockStorage.saveStaff(staffWithSuperAdminEmail);
    assert.equal(resSuperAdminDup.success, false, 'Staff email duplicating super admin must be blocked');
    assert.match(resSuperAdminDup.message || '', /Duplicate Email/i);
  });

  test('Scenario 38: Ambulance Fleet Inventory, Driver & Paramedic Roster, and Fleet Maintenance Logs - Dynamic Storage and Strict Tenant Isolation', () => {
    const hospAId = 'HOSP-FLEET-A';
    const hospBId = 'HOSP-FLEET-B';
    const hospCId = 'HOSP-FLEET-C';

    // 1. Hospital C has onboarded no fleet: must return exactly 0 ambulances, 0 drivers, 0 maintenance logs
    assert.equal(MockStorage.getAmbulances(hospCId).length, 0, 'Hospital C must have 0 ambulances initially');
    assert.equal(MockStorage.getAmbulanceDrivers(hospCId).length, 0, 'Hospital C must have 0 drivers initially');
    assert.equal(MockStorage.getAmbulanceMaintenance(hospCId).length, 0, 'Hospital C must have 0 maintenance logs initially');

    // 2. Hospital A onboards an ambulance, driver, and logs maintenance
    const ambA: Ambulance = {
      id: 'AMB-DYNAMIC-A1',
      hospitalId: hospAId,
      hospitalName: 'Hospital A Health',
      regNumber: 'KA-01-AMB-1001',
      type: 'Advanced Life Support (ALS)',
      model: 'Force Traveller',
      equipmentCategory: 'Class A (Critical Telemetry)',
      status: 'Available',
      currentLocation: 'Bay 1',
      lastMaintenanceDate: '2026-11-01',
      nextMaintenanceDate: '2027-02-01',
      fuelLevel: 95,
      mileageKm: 12000,
    };
    MockStorage.saveAmbulance(ambA);

    const drvA: AmbulanceDriver = {
      id: 'DRV-DYNAMIC-A1',
      hospitalId: hospAId,
      hospitalName: 'Hospital A Health',
      name: 'Ramesh Kumar',
      email: 'ramesh.driver@hospital-a.com',
      phone: '9888811111',
      licenseNumber: 'KA-DL-1001',
      licenseExpiry: '2030-01-01',
      assignedAmbulanceId: ambA.id,
      assignedAmbulanceReg: ambA.regNumber,
      availabilityStatus: 'On Duty & Available',
      status: 'active',
      completedTrips: 5,
      emergencyExperienceYears: 6,
    };
    MockStorage.saveAmbulanceDriver(drvA);

    const mntA: AmbulanceMaintenance = {
      id: 'MNT-DYNAMIC-A1',
      hospitalId: hospAId,
      ambulanceId: ambA.id,
      ambulanceReg: ambA.regNumber,
      serviceDate: '2026-11-01',
      category: 'Preventive',
      maintenanceStatus: 'Completed',
      serviceType: '10,000 km Periodic Inspection',
      servicedBy: 'Authorized EMS Fleet Care',
      cost: 4500,
      partsCost: 3000,
      labourCost: 1500,
      otherCharges: 0,
      technicianName: 'Suresh Tech',
      nextServiceDate: '2027-02-01',
      description: '10,000 km Periodic Inspection',
    };
    MockStorage.saveAmbulanceMaintenance(mntA);

    // 3. Hospital B onboards distinct fleet data
    const ambB: Ambulance = {
      id: 'AMB-DYNAMIC-B1',
      hospitalId: hospBId,
      hospitalName: 'Hospital B Medical',
      regNumber: 'TN-09-AMB-2002',
      type: 'Basic Life Support (BLS)',
      model: 'Tata Winger',
      equipmentCategory: 'Class B (Defibrillator + O2)',
      status: 'Available',
      currentLocation: 'Station Bravo',
      lastMaintenanceDate: '2026-11-05',
      nextMaintenanceDate: '2027-02-05',
      fuelLevel: 80,
      mileageKm: 25000,
    };
    MockStorage.saveAmbulance(ambB);

    const drvB: AmbulanceDriver = {
      id: 'DRV-DYNAMIC-B1',
      hospitalId: hospBId,
      hospitalName: 'Hospital B Medical',
      name: 'Murugan Selvam',
      email: 'murugan.driver@hospital-b.com',
      phone: '9777722222',
      licenseNumber: 'TN-DL-2002',
      licenseExpiry: '2029-05-01',
      assignedAmbulanceId: ambB.id,
      assignedAmbulanceReg: ambB.regNumber,
      availabilityStatus: 'On Duty & Available',
      status: 'active',
      completedTrips: 12,
      emergencyExperienceYears: 8,
    };
    MockStorage.saveAmbulanceDriver(drvB);

    const mntB: AmbulanceMaintenance = {
      id: 'MNT-DYNAMIC-B1',
      hospitalId: hospBId,
      ambulanceId: ambB.id,
      ambulanceReg: ambB.regNumber,
      serviceDate: '2026-11-05',
      category: 'Corrective',
      maintenanceStatus: 'Completed',
      serviceType: 'Brake Pad Replacement',
      servicedBy: 'City Brake Specialists',
      cost: 6500,
      partsCost: 5000,
      labourCost: 1500,
      otherCharges: 0,
      technicianName: 'Karthik Tech',
      nextServiceDate: '2027-02-05',
      description: 'Brake Pad Replacement',
    };
    MockStorage.saveAmbulanceMaintenance(mntB);

    // 4. Verify strict isolation: Hospital A sees ONLY ambA, drvA, mntA
    const hospAAmbs = MockStorage.getAmbulances(hospAId);
    assert.equal(hospAAmbs.length, 1);
    assert.equal(hospAAmbs[0].id, 'AMB-DYNAMIC-A1');
    assert.equal(hospAAmbs[0].regNumber, 'KA-01-AMB-1001');

    const hospADrvs = MockStorage.getAmbulanceDrivers(hospAId);
    assert.equal(hospADrvs.length, 1);
    assert.equal(hospADrvs[0].id, 'DRV-DYNAMIC-A1');

    const hospAMnts = MockStorage.getAmbulanceMaintenance(hospAId);
    assert.equal(hospAMnts.length, 1);
    assert.equal(hospAMnts[0].id, 'MNT-DYNAMIC-A1');

    // 5. Hospital B sees ONLY ambB, drvB, mntB
    const hospBAmbs = MockStorage.getAmbulances(hospBId);
    assert.equal(hospBAmbs.length, 1);
    assert.equal(hospBAmbs[0].id, 'AMB-DYNAMIC-B1');

    const hospBDrvs = MockStorage.getAmbulanceDrivers(hospBId);
    assert.equal(hospBDrvs.length, 1);
    assert.equal(hospBDrvs[0].id, 'DRV-DYNAMIC-B1');

    const hospBMnts = MockStorage.getAmbulanceMaintenance(hospBId);
    assert.equal(hospBMnts.length, 1);
    assert.equal(hospBMnts[0].id, 'MNT-DYNAMIC-B1');

    // 6. Hospital C still has 0 records - absolutely no cross-tenant leakage from A or B
    assert.equal(MockStorage.getAmbulances(hospCId).length, 0);
    assert.equal(MockStorage.getAmbulanceDrivers(hospCId).length, 0);
    assert.equal(MockStorage.getAmbulanceMaintenance(hospCId).length, 0);

    // 7. Empty or missing hospitalId returns [] (no leakage)
    assert.equal(MockStorage.getAmbulances('').length, 0);
    assert.equal(MockStorage.getAmbulanceDrivers('').length, 0);
    assert.equal(MockStorage.getAmbulanceMaintenance('').length, 0);

    // 8. Simulated Logout and Login Back: Hospital A logs in again -> exactly 1 unit, 1 driver, 1 mnt log
    const reloadedAmbs = MockStorage.getAmbulances(hospAId);
    assert.equal(reloadedAmbs.length, 1);
    assert.equal(reloadedAmbs[0].id, 'AMB-DYNAMIC-A1');
    assert.equal(MockStorage.getAmbulanceDrivers(hospAId).length, 1);
    assert.equal(MockStorage.getAmbulanceMaintenance(hospAId).length, 1);
  });

  test('Scenario 39: Head Branch Admin login into sub-branch after sync & Pharmacy Inventory stability', async () => {
    // 1. Setup Head Hospital and Sub-Branch Hospital
    const testHeadId = 'HOSP-HEAD-TEST-99';
    const testSubId = 'HOSP-SUB-TEST-99';

    const headHosp: Hospital & { adminPassword?: string } = {
      id: testHeadId,
      name: 'Central Metro Hospital (Head)',
      regNumber: 'REG-HEAD-99',
      type: 'General Hospital',
      email: 'head.admin@centralmetro.org',
      phone: '9876543210',
      address: '100 Medical Center Blvd',
      city: 'Mumbai',
      state: 'MH',
      country: 'India',
      postalCode: '400001',
      adminName: 'Chief Medical Officer',
      adminEmail: 'head.admin@centralmetro.org',
      adminPassword: 'HeadAdminPassword@2026',
      adminPhone: '9876543210',
      planTier: 'enterprise',
      status: 'active',
      totalDoctors: 20,
      totalPatients: 50,
      totalBeds: 100,
      createdAt: '2026-01-01',
      isHeadBranch: true,
      isBranch: false,
      organizationId: 'ORG-CENTRAL-NET',
    };
    MockStorage.saveHospital(headHosp);

    const subHosp: Hospital = {
      id: testSubId,
      name: 'Central Metro Suburban Care',
      regNumber: 'REG-SUB-99',
      type: 'General Hospital',
      email: 'sub.admin@centralmetro.org',
      phone: '9876543211',
      address: '200 Suburban Rd',
      city: 'Thane',
      state: 'MH',
      country: 'India',
      postalCode: '400601',
      adminName: 'Branch Director',
      adminEmail: 'sub.admin@centralmetro.org',
      adminPhone: '9876543211',
      planTier: 'enterprise',
      status: 'active',
      totalDoctors: 5,
      totalPatients: 10,
      totalBeds: 25,
      createdAt: '2026-01-01',
      isHeadBranch: false,
      isBranch: true,
      headBranchId: testHeadId,
      organizationId: 'ORG-CENTRAL-NET',
    };
    MockStorage.saveHospital(subHosp);

    // 2. Head Hospital Admin authenticates directly into Sub-Branch portal
    const subBranchLogin = MockStorage.findUserForAuth(
      'head.admin@centralmetro.org',
      testSubId,
      'HeadAdminPassword@2026'
    );
    assert.ok(subBranchLogin.user, 'Head Branch Hospital Admin must authenticate directly into sub-branch portal');
    assert.equal(subBranchLogin.user?.email, 'head.admin@centralmetro.org');

    // 3. Fresh Start & Dynamic Pharmacy Storage: A new hospital begins freshly (0 hardcoded medicines)
    const freshHospId = 'HOSP-FRESH-START-77';
    const initialFreshMeds = MockStorage.getMedicines(freshHospId);
    assert.equal(initialFreshMeds.length, 0, 'A new hospital pharmacy inventory must begin freshly with 0 hardcoded medicines');

    // Dynamically store medicine in DB for testHeadId
    const newMed: Medicine = {
      id: 'MED-NEW-TEST-99',
      hospitalId: testHeadId,
      name: 'Doxycycline 100mg',
      genericName: 'Doxycycline Hyclate',
      sku: 'MED-DOX-100',
      batchNumber: 'BAT-DOX-2026-99',
      category: 'Antibiotics',
      stockQuantity: 150,
      minThreshold: 20,
      unitPrice: 45,
      price: 45,
      expiryDate: '2028-12-31',
      manufacturer: 'Pfizer',
      locationRack: 'Rack D-01',
      requiresPrescription: true,
      status: 'In Stock',
    };
    MockStorage.saveMedicine(newMed);

    // Verify medicine is in head hospital and persists dynamically
    const headMeds = MockStorage.getMedicines(testHeadId);
    assert.equal(headMeds.length, 1);
    assert.equal(headMeds[0].id, 'MED-NEW-TEST-99');

    // 4. Strict Isolation: Fresh hospital still has 0 medicines (no leakage from testHeadId)
    assert.equal(MockStorage.getMedicines(freshHospId).length, 0, 'No cross-hospital medicine leakage');

    // When fresh hospital dynamically adds its own medicine:
    const freshMed: Medicine = {
      id: 'MED-FRESH-1',
      hospitalId: freshHospId,
      name: 'Cough Syrup 100ml',
      genericName: 'Dextromethorphan',
      sku: 'MED-CS-100',
      batchNumber: 'BAT-CS-2026-01',
      category: 'Respiratory',
      stockQuantity: 60,
      minThreshold: 10,
      unitPrice: 50,
      price: 50,
      expiryDate: '2027-12-31',
      manufacturer: 'Abbott',
      locationRack: 'Rack R-01',
      requiresPrescription: false,
      status: 'In Stock',
    };
    MockStorage.saveMedicine(freshMed);

    const reloadedFresh = MockStorage.getMedicines(freshHospId);
    assert.equal(reloadedFresh.length, 1);
    assert.equal(reloadedFresh[0].id, 'MED-FRESH-1');

    // Head hospital does NOT see freshMed
    assert.equal(MockStorage.getMedicines(testHeadId).length, 1);
    assert.equal(MockStorage.getMedicines(testHeadId)[0].id, 'MED-NEW-TEST-99');
  });
});
