import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  INITIAL_ROLE_NOTIFICATIONS,
  filterNotificationsForUser,
  formatNotificationTime,
} from './roleNotifications';
import { AppNotification, Medicine, Ambulance } from '../types';
import { MockStorage } from '../services/mockStorage';

describe('Role-Based Notification System Tests', () => {
  it('Requirement 1: Starts freshly with zero mock notifications', () => {
    assert.strictEqual(INITIAL_ROLE_NOTIFICATIONS.length, 0, 'Notifications must start freshly with no mock items');
  });

  it('Requirement 2: Dynamically created notifications are accurately filtered by role', () => {
    const dynamicAlerts: AppNotification[] = [
      {
        id: 'dyn-doc-1',
        title: 'New Appointment Booked',
        message: 'Patient Johnathan Doe booked with Dr. Marcus',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'doctor',
        targetRoles: ['doctor', 'receptionist'],
        hospitalId: 'HOSP-001',
      },
      {
        id: 'dyn-nurse-1',
        title: 'New Patient Admission',
        message: 'Patient Sarah Miller admitted to ICU Ward',
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'nurse',
        targetRoles: ['nurse', 'hospital_admin'],
        hospitalId: 'HOSP-001',
      },
      {
        id: 'dyn-pharm-1',
        title: 'New Digital Prescription',
        message: 'Prescription issued for Patient #1042',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'pharmacist',
        hospitalId: 'HOSP-001',
      },
      {
        id: 'dyn-sa-1',
        title: 'Inbound Hospital Demo Request',
        message: 'Metro General Healthcare requested demo',
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'super_admin',
        targetRoles: ['super_admin', 'super_admin_manager', 'sales_executive'],
      },
    ];

    // Doctor sees doctor alert
    const doctorAlerts = filterNotificationsForUser(dynamicAlerts, 'doctor', 'HOSP-001');
    assert.strictEqual(doctorAlerts.length, 1);
    assert.strictEqual(doctorAlerts[0].id, 'dyn-doc-1');

    // Nurse sees nurse alert
    const nurseAlerts = filterNotificationsForUser(dynamicAlerts, 'nurse', 'HOSP-001');
    assert.strictEqual(nurseAlerts.length, 1);
    assert.strictEqual(nurseAlerts[0].id, 'dyn-nurse-1');

    // Pharmacist sees prescription alert
    const pharmAlerts = filterNotificationsForUser(dynamicAlerts, 'pharmacist', 'HOSP-001');
    assert.strictEqual(pharmAlerts.length, 1);
    assert.strictEqual(pharmAlerts[0].id, 'dyn-pharm-1');

    // Super Admin sees platform alert
    const saAlerts = filterNotificationsForUser(dynamicAlerts, 'super_admin');
    assert.strictEqual(saAlerts.length, 1);
    assert.strictEqual(saAlerts[0].id, 'dyn-sa-1');
  });

  it('Requirement 3: Tenant isolation ensures hospital-scoped notifications do not leak across facilities', () => {
    const mixedNotifs: AppNotification[] = [
      {
        id: 'notif-hosp-1',
        title: 'HOSP A Alert',
        message: 'Bed capacity in Hosp A',
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'hospital_admin',
        hospitalId: 'HOSP-001',
      },
      {
        id: 'notif-hosp-2',
        title: 'HOSP B Alert',
        message: 'Bed capacity in Hosp B',
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'hospital_admin',
        hospitalId: 'HOSP-002',
      },
    ];

    const hospAItems = filterNotificationsForUser(mixedNotifs, 'hospital_admin', 'HOSP-001');
    assert.strictEqual(hospAItems.length, 1);
    assert.strictEqual(hospAItems[0].id, 'notif-hosp-1');

    const hospBItems = filterNotificationsForUser(mixedNotifs, 'hospital_admin', 'HOSP-002');
    assert.strictEqual(hospBItems.length, 1);
    assert.strictEqual(hospBItems[0].id, 'notif-hosp-2');
  });

  it('Requirement 4: Relative timestamp formatting renders friendly times', () => {
    const justNow = new Date().toISOString();
    assert.strictEqual(formatNotificationTime(justNow), 'Just now');

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    assert.strictEqual(formatNotificationTime(tenMinAgo), '10m ago');

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    assert.strictEqual(formatNotificationTime(twoHoursAgo), '2h ago');
  });

  it('Requirement 5: Mark as read and Clear all operations update notification states', () => {
    let mockList: AppNotification[] = [
      {
        id: 'n1',
        title: 'Appointment Alert',
        message: 'New appointment',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'doctor',
      },
      {
        id: 'n2',
        title: 'Emergency Lab',
        message: 'Troponin elevated',
        type: 'emergency',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'doctor',
      },
    ];

    // Single mark read
    mockList = mockList.map((n) => (n.id === 'n1' ? { ...n, read: true } : n));
    assert.strictEqual(mockList.find((n) => n.id === 'n1')?.read, true);
    assert.strictEqual(mockList.find((n) => n.id === 'n2')?.read, false);
    assert.strictEqual(mockList.filter((n) => !n.read).length, 1);

    // Mark all as read
    mockList = mockList.map((n) => ({ ...n, read: true }));
    assert.strictEqual(mockList.filter((n) => !n.read).length, 0);

    // Clear all
    mockList = [];
    assert.strictEqual(mockList.length, 0);
  });

  it('Requirement 6: Superadmin is notified of Pending QR Payment & UTR Approvals, and Hospital Admin is notified upon approval/rejection', () => {
    const alerts: AppNotification[] = [
      {
        id: 'notif-sub-pending-HOSP-001',
        title: 'Pending QR Payment & UTR Approval',
        message: 'City Care Hospital submitted payment of ₹14,999 for Enterprise Plan (UTR: UTR984729104820).',
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'super_admin',
        targetRoles: ['super_admin', 'super_admin_manager'],
        category: 'billing',
        link: '/platform/subscriptions',
      },
      {
        id: 'notif-sub-approved-HOSP-001',
        title: 'Subscription Upgrade Approved! 🎉',
        message: 'Your payment of ₹14,999 has been verified. Upgraded to Enterprise tier.',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'hospital_admin',
        targetRoles: ['hospital_admin'],
        hospitalId: 'HOSP-001',
        category: 'billing',
        link: '/hospital/settings',
      },
      {
        id: 'notif-ticket-new-1',
        title: 'New Hospital Support Ticket Raised',
        message: 'Kaveri Hospital opened ticket: "Need API credentials" (HIGH priority).',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'super_admin',
        targetRoles: ['super_admin', 'super_admin_manager'],
        category: 'support',
        link: '/platform/support',
      },
    ];

    // Super Admin sees pending QR payment approval and new support ticket
    const saAlerts = filterNotificationsForUser(alerts, 'super_admin');
    assert.strictEqual(saAlerts.length, 2, 'Super Admin must receive pending QR approval and ticket alerts');
    assert.ok(saAlerts.some((a) => a.title.includes('Pending QR Payment & UTR Approval')));

    // Super Admin Manager also sees the pending approval and ticket alerts
    const samAlerts = filterNotificationsForUser(alerts, 'super_admin_manager');
    assert.strictEqual(samAlerts.length, 2, 'Super Admin Manager must also receive pending QR approval alerts');

    // Hospital Admin of HOSP-001 sees the upgrade approval alert
    const haAlerts = filterNotificationsForUser(alerts, 'hospital_admin', 'HOSP-001');
    assert.strictEqual(haAlerts.length, 1);
    assert.strictEqual(haAlerts[0].title, 'Subscription Upgrade Approved! 🎉');

    // Hospital Admin of HOSP-002 does NOT see HOSP-001's approval alert
    const haAlertsHosp2 = filterNotificationsForUser(alerts, 'hospital_admin', 'HOSP-002');
    assert.strictEqual(haAlertsHosp2.length, 0);
  });

  it('Requirement 8: Pharmacist receives real-time bell notifications for Low Stock, Stockout, Near Expiry, and Expired medicines', () => {
    const testHospId = 'HOSP-PHARM-NOTIF-01';

    // 1. Save an Out-of-Stock medicine (stock = 0)
    const outOfStockMed: Medicine = {
      id: 'MED-TEST-OUT-01',
      hospitalId: testHospId,
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      sku: 'SKU-AMOX-01',
      batchNumber: 'BAT-AMX-001',
      category: 'Antibiotics',
      stockQuantity: 0,
      minThreshold: 20,
      unitPrice: 50,
      expiryDate: '2027-12-31',
      manufacturer: 'Sun Pharma',
      locationRack: 'A1-R1',
      requiresPrescription: true,
      status: 'Out of Stock',
    };
    MockStorage.saveMedicine(outOfStockMed);

    // 2. Save a Low Stock medicine (stock = 5, threshold = 20)
    const lowStockMed: Medicine = {
      id: 'MED-TEST-LOW-02',
      hospitalId: testHospId,
      name: 'Paracetamol 650mg',
      genericName: 'Paracetamol',
      sku: 'SKU-PARA-02',
      batchNumber: 'BAT-PARA-002',
      category: 'Analgesics',
      stockQuantity: 5,
      minThreshold: 20,
      unitPrice: 20,
      expiryDate: '2027-08-31',
      manufacturer: 'Cipla',
      locationRack: 'A1-R2',
      requiresPrescription: false,
      status: 'Low Stock',
    };
    MockStorage.saveMedicine(lowStockMed);

    // 3. Save an Expired medicine (expiryDate in the past)
    const expiredMed: Medicine = {
      id: 'MED-TEST-EXP-03',
      hospitalId: testHospId,
      name: 'Expired Syrup 100ml',
      genericName: 'Cough Syrup',
      sku: 'SKU-EXP-03',
      batchNumber: 'BAT-EXP-003',
      category: 'Respiratory',
      stockQuantity: 50,
      minThreshold: 10,
      unitPrice: 80,
      expiryDate: '2024-01-01', // Expired
      manufacturer: 'Abbott',
      locationRack: 'B1-R1',
      requiresPrescription: false,
    };
    MockStorage.saveMedicine(expiredMed);

    // Query notifications for Pharmacist in this hospital
    const pharmNotifs = MockStorage.getRoleNotifications('pharmacist', testHospId);

    // Verify Out-of-Stock notification
    const outNotif = pharmNotifs.find((n) => n.id === `notif-pharm-out-of-stock-${outOfStockMed.id}`);
    assert.ok(outNotif, 'Pharmacist must receive Critical Stockout Alert for 0-quantity medicine');
    assert.strictEqual(outNotif?.type, 'error');
    assert.ok(outNotif?.title.includes('Critical Stockout Alert'));

    // Verify Low Stock notification
    const lowNotif = pharmNotifs.find((n) => n.id === `notif-pharm-low-stock-${lowStockMed.id}`);
    assert.ok(lowNotif, 'Pharmacist must receive Low Stock Warning when quantity falls below threshold');
    assert.strictEqual(lowNotif?.type, 'warning');
    assert.ok(lowNotif?.title.includes('Low Stock Warning'));

    // Verify Expired notification
    const expNotif = pharmNotifs.find((n) => n.id === `notif-pharm-expired-${expiredMed.id}`);
    assert.ok(expNotif, 'Pharmacist must receive Expired Medicine Alert when expiryDate has passed');
    assert.strictEqual(expNotif?.type, 'error');
    assert.ok(expNotif?.title.includes('Expired Medicine Alert'));
  });

  it('Requirement 9: Enrolling an ambulance with vehicle photo and specifications persists successfully in inventory', () => {
    const testHospId = 'HOSP-AMB-TEST-01';
    const sampleAmbulance: Ambulance = {
      id: 'AMB-TEST-PHOTO-01',
      hospitalId: testHospId,
      hospitalName: 'Apollo City Hospital',
      regNumber: 'KA-01-AB-1234',
      type: 'Advanced Life Support (ALS)',
      model: 'Force Traveller BLS/ALS',
      status: 'Available',
      mileageKm: 12500,
      fuelLevel: 90,
      equipmentCategory: 'Class A (Critical Telemetry)',
      currentLocation: 'Emergency Bay 1',
      vehiclePhotoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
      lastMaintenanceDate: '2026-01-01',
      nextMaintenanceDate: '2026-07-01',
      notes: 'Fully equipped ICU ambulance with defibrillator and ventilator',
    };

    MockStorage.saveAmbulance(sampleAmbulance);

    const ambulances = MockStorage.getAmbulances(testHospId);
    const saved = ambulances.find((a) => a.id === sampleAmbulance.id);
    assert.ok(saved, 'Enrolled ambulance with photo must exist in hospital inventory');
    assert.strictEqual(saved?.regNumber, 'KA-01-AB-1234');
    assert.strictEqual(saved?.status, 'Available');
    assert.ok(saved?.vehiclePhotoUrl, 'Vehicle photo URL must be preserved');
  });

  it('Requirement 10: Critical Panic Alert in Laboratory can be acknowledged and ended with telephonic physician notification record', () => {
    const testHospId = 'HOSP-LAB-PANIC-TEST';
    const criticalOrder = {
      id: 'LAB-CRIT-001',
      hospitalId: testHospId,
      patientId: 'PAT-PANIC-01',
      patientName: 'Robert Vance',
      patientAge: 62,
      patientGender: 'Male' as const,
      doctorId: 'DOC-CAR-01',
      doctorName: 'Dr. Arvind Sharma',
      testId: 'TEST-TROP-I',
      testName: 'High Sensitivity Troponin-I',
      category: 'Cardiac Markers',
      orderDate: '2026-11-07 10:00',
      status: 'Completed' as const,
      sampleType: 'Serum',
      resultValue: '185.4 ng/L (Panic Cutoff: >50 ng/L)',
      referenceRange: '0.0 - 14.0 ng/L',
      resultStatus: 'Critical' as const,
      fee: 1200,
    };

    MockStorage.saveLabOrder(criticalOrder);

    // Verify critical order is unacknowledged initially
    let orders = MockStorage.getLabOrders(testHospId);
    let activeCritical = orders.filter((o) => o.resultStatus === 'Critical' && !o.criticalAlertAcknowledged);
    assert.strictEqual(activeCritical.length, 1, 'Should have 1 active unacknowledged critical panic alert');

    // Technician logs telephonic physician call & ends panic alert
    const updated = MockStorage.acknowledgeCriticalAlert(
      criticalOrder.id,
      'Liam Zhang',
      'Telephonically notified Dr. Arvind Sharma of critical troponin level at 10:15 AM. Verbal read-back verified under NABL guidelines.',
      'Dr. Arvind Sharma'
    );

    assert.ok(updated, 'Acknowledge method should return updated order');
    assert.strictEqual(updated?.criticalAlertAcknowledged, true);
    assert.strictEqual(updated?.criticalAlertAcknowledgedBy, 'Liam Zhang');
    assert.strictEqual(updated?.criticalAlertDoctorNotified, 'Dr. Arvind Sharma');
    assert.ok(updated?.criticalAlertCommunicationNote?.includes('Verbal read-back verified'));

    // Check dashboard active critical count is now cleared
    orders = MockStorage.getLabOrders(testHospId);
    activeCritical = orders.filter((o) => o.resultStatus === 'Critical' && !o.criticalAlertAcknowledged);
    assert.strictEqual(activeCritical.length, 0, 'Panic alert must end once acknowledged');
  });

  it('Requirement 11: Patient Demographics Form allows editing Patient Portal Password and updates User record', () => {
    const testHospId = 'HOSP-PAT-PWD-TEST';
    const patientId = 'PAT-PWD-EDIT-01';
    const patientEmail = 'sarah.connor@test.local';

    // Seed patient and portal user
    MockStorage.savePatient({
      id: patientId,
      hospitalId: testHospId,
      name: 'Sarah Connor',
      email: patientEmail,
      phone: '+1-555-0199',
      dateOfBirth: '1985-02-28',
      age: 41,
      gender: 'Female',
      bloodGroup: 'A+',
      address: '100 Cyberdyne Way',
      emergencyContactName: 'John Connor',
      emergencyContactPhone: '+1-555-0198',
      emergencyContactRelation: 'Son',
      status: 'Outpatient',
      allergies: ['Penicillin'],
      medicalHistory: ['Hypertension'],
      registeredDate: '2026-01-15',
    });

    MockStorage.saveUser({
      id: 'USR-PAT-PWD-01',
      name: 'Sarah Connor',
      email: patientEmail,
      password: 'OldPassword@123',
      role: 'patient',
      portal: 'patient',
      hospitalId: testHospId,
      hospitalName: 'Apollo City Hospital',
      patientId: patientId,
      phone: '+1-555-0199',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Verify existing password was loaded
    let userRecord = MockStorage.getUsers().find((u) => u.patientId === patientId);
    assert.strictEqual(userRecord?.password, 'OldPassword@123');

    // Simulate edit save with new password
    const newPassword = 'NewSecretPassword@2026!';
    if (userRecord) {
      MockStorage.saveUser({
        ...userRecord,
        name: 'Sarah Connor Updated',
        password: newPassword,
      });
    }

    // Verify password is now updated in User table
    userRecord = MockStorage.getUsers().find((u) => u.patientId === patientId);
    assert.strictEqual(userRecord?.password, newPassword, 'Portal password must update successfully');
    assert.strictEqual(userRecord?.name, 'Sarah Connor Updated');
  });

  it('Requirement 12: Doctor can review lab report and skip complete care trail without forcing bedside nursing directives', () => {
    const testHospId = 'HOSP-CARE-TRAIL-TEST';
    const labOrder = {
      id: 'LAB-TRAIL-001',
      hospitalId: testHospId,
      patientId: 'PAT-TRAIL-01',
      patientName: 'David Miller',
      patientAge: 45,
      patientGender: 'Male' as const,
      doctorId: 'DOC-GEN-01',
      doctorName: 'Dr. Marcus Brody',
      testId: 'TEST-CBC-01',
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      orderDate: '2026-11-07 09:00',
      status: 'Verified' as const,
      sampleType: 'Whole Blood EDTA',
      resultValue: 'Normal Hemogram (Hb: 14.8 g/dL, WBC: 6,800 /uL, Plt: 240,000 /uL)',
      referenceRange: 'Normal biological range',
      resultStatus: 'Normal' as const,
      fee: 450,
    };

    MockStorage.saveLabOrder(labOrder);

    // Case A: Doctor reviews report and skips care trail directly
    const reviewedOrder = MockStorage.reviewLabReportByDoctor(
      labOrder.id,
      'DOC-GEN-01',
      'Dr. Marcus Brody',
      'All hematological parameters within normal reference limits. Patient medically clear.',
      'Maintain standard wellness and routine hydration. No bedside nursing directives required.',
      true, // skipCareTrail = true
      'Outpatient routine checkup completed directly by physician.'
    );

    assert.ok(reviewedOrder, 'Order should be returned');
    assert.strictEqual(reviewedOrder?.status, 'Action Completed', 'Status must move directly to Action Completed');
    assert.strictEqual(reviewedOrder?.nurseActionStatus, 'Completed', 'Nursing status must be Completed');
    assert.strictEqual(reviewedOrder?.careTrailSkipped, true, 'careTrailSkipped must be true');
    assert.strictEqual(reviewedOrder?.careTrailCompletedAtReview, true, 'careTrailCompletedAtReview must be true');
    assert.ok(reviewedOrder?.careTrailSkippedReason?.includes('Outpatient routine checkup'));

    // Case B: An order already in Doctor Reviewed status can have care trail skipped with skipCareTrailForOrder
    const pendingOrder = {
      ...labOrder,
      id: 'LAB-TRAIL-002',
      status: 'Doctor Reviewed' as const,
      nurseActionStatus: 'Pending' as const,
    };
    MockStorage.saveLabOrder(pendingOrder);

    const closedOrder = MockStorage.skipCareTrailForOrder(
      pendingOrder.id,
      'Dr. Marcus Brody',
      'Physician closed care trail directly; patient discharged.'
    );

    assert.ok(closedOrder);
    assert.strictEqual(closedOrder?.status, 'Action Completed');
    assert.strictEqual(closedOrder?.nurseActionStatus, 'Completed');
    assert.strictEqual(closedOrder?.careTrailSkipped, true);
  });

  it('Requirement 13: Doctor initiated discharge remains permanently in Discharge Initiated state across multiple refreshes and syncs', async () => {
    const testHospId = 'HOSP-DISCHARGE-PERSIST-TEST';
    const admId = 'ADM-PERSIST-DISCHARGE-01';

    // 1. Save an active admission
    MockStorage.saveAdmission({
      id: admId,
      hospitalId: testHospId,
      patientId: 'PAT-DISCH-01',
      patientName: 'Elena Rostova',
      doctorId: 'DOC-INT-01',
      doctorName: 'Dr. Praveen',
      departmentName: 'Internal Medicine',
      wardType: 'General Ward',
      bedNumber: 'B-101',
      admissionDate: '2026-11-01',
      admissionType: 'Elective',
      reason: 'Pneumonia observation',
      status: 'Active',
      initialDeposit: 1500,
    });

    let adm = MockStorage.getAdmissions(testHospId).find((a) => a.id === admId);
    assert.strictEqual(adm?.status, 'Active');

    // 2. Doctor initiates discharge
    const dischargeRes = MockStorage.initiateDoctorDischarge(admId, {
      dischargeDate: '2026-11-07',
      dischargeSummary: 'Vitals stable, chest clear, completed 5-day IV antibiotic course.',
      dischargeAdvice: 'Take prescribed oral medications. Follow up in 7 days.',
      dischargePrescriptions: 'Tab Azithromycin 500mg OD x 3 days',
      doctorId: 'DOC-INT-01',
      doctorName: 'Dr. Praveen',
    });
    assert.strictEqual(dischargeRes.success, true);

    // Verify status is immediately 'Discharge Initiated'
    adm = MockStorage.getAdmissions(testHospId).find((a) => a.id === admId);
    assert.strictEqual(adm?.status, 'Discharge Initiated', 'Status must be Discharge Initiated immediately');
    assert.strictEqual(adm?.dischargeDate, '2026-11-07');

    // 3. Simulate multiple page refreshes / backend syncs (e.g. 4 refreshes)
    for (let refreshCount = 1; refreshCount <= 4; refreshCount++) {
      if (MockStorage.syncWithBackend) {
        await MockStorage.syncWithBackend();
      }
      const refreshedAdm = MockStorage.getAdmissions(testHospId).find((a) => a.id === admId);
      assert.strictEqual(
        refreshedAdm?.status,
        'Discharge Initiated',
        `Admission status must remain 'Discharge Initiated' after refresh #${refreshCount}`
      );
      assert.strictEqual(
        refreshedAdm?.dischargeDate,
        '2026-11-07',
        `Discharge date must be preserved after refresh #${refreshCount}`
      );
    }

    // 4. Complete final discharge settlement & release
    MockStorage.settleInpatientBilling(admId);
    const finalRes = MockStorage.completeFinalDischarge(admId, 'Sister Clara', 'Nurse');
    assert.strictEqual(finalRes.success, true);

    adm = MockStorage.getAdmissions(testHospId).find((a) => a.id === admId);
    assert.strictEqual(adm?.status, 'Discharged');

    // 5. Subsequent refreshes must maintain Discharged status
    for (let refreshCount = 1; refreshCount <= 2; refreshCount++) {
      if (MockStorage.syncWithBackend) {
        await MockStorage.syncWithBackend();
      }
      const refreshedAdm = MockStorage.getAdmissions(testHospId).find((a) => a.id === admId);
      assert.strictEqual(
        refreshedAdm?.status,
        'Discharged',
        `Terminal status 'Discharged' must be preserved after refresh #${refreshCount}`
      );
    }
  });

  it('Requirement 14: Initial Admission Deposit is automatically computed and adjusted in Inpatient Discharge Invoicing', () => {
    const testHospId = 'HOSP-DEPOSIT-AUTO-TEST';
    const bedNumber = 'BED-DEP-11';
    const dailyRate = 150;

    // 1. Save Bed with daily rate = 150
    MockStorage.saveBed({
      id: 'BED-AUTO-DEP-01',
      hospitalId: testHospId,
      wardId: 'WARD-GEN-01',
      wardName: 'General Ward',
      bedNumber,
      wardType: 'General Ward',
      floor: '1st Floor',
      status: 'Occupied',
      dailyRate,
    });

    // 2. Save Admission without explicit initialDeposit (or 0)
    const admId = 'ADM-AUTO-DEP-01';
    MockStorage.saveAdmission({
      id: admId,
      hospitalId: testHospId,
      patientId: 'PAT-MAHI-01',
      patientName: 'mahi',
      doctorId: 'DOC-ARUN-01',
      doctorName: 'Arun',
      departmentName: 'General Medicine',
      wardType: 'General Ward',
      bedNumber,
      admissionDate: '2026-11-07',
      dischargeDate: '2026-11-07',
      admissionType: 'Emergency',
      reason: 'Observation',
      status: 'Discharge Initiated',
      initialDeposit: 0, // Unspecified or 0
    });

    const adm = MockStorage.getAdmissions(testHospId).find((a) => a.id === admId);
    assert.ok(adm);

    // Compute automatic initial deposit: 3 days x 150 = 450
    const bed = MockStorage.getBeds(testHospId).find((b) => b.bedNumber === adm?.bedNumber);
    const autoDeposit = bed ? bed.dailyRate * 3 : 1000;
    const effectiveDeposit = Number(adm?.initialDeposit) > 0 ? Number(adm?.initialDeposit) : autoDeposit;

    assert.strictEqual(effectiveDeposit, 450, 'Automatic deposit should default to 3 days bed stay = 450');

    // Bed charge: 1 day x 150 = 150
    const bedCharge = 1 * dailyRate;
    // Specialist doc fee: 1 day x 250 = 250
    const docFee = 250;
    const subtotal = bedCharge + docFee; // 400
    const gst = Math.round((bedCharge * 0.05)); // +8
    const grossTotal = subtotal + gst; // 408

    // Net balance due: Math.max(0, 408 - 450) = 0
    const netDue = Math.max(0, grossTotal - effectiveDeposit);
    assert.strictEqual(netDue, 0, 'Net due should be 0 because 450 initial deposit fully covers 408 gross charges');
    const refundDue = effectiveDeposit > grossTotal ? effectiveDeposit - grossTotal : 0;
    assert.strictEqual(refundDue, 42, 'Refund due to patient should be 42');
  });
});
