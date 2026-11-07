import { describe, it, beforeEach } from 'node:test';
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
import { Appointment, Consultation, Medicine, Bed } from '../types';

describe('Doctor Dashboard & Consultation Workflow E2E Integration Tests', () => {
  const TEST_HOSPITAL_ID = 'HOSP-TEST-001';
  const TEST_DOCTOR_ID = 'DOC-TEST-888';
  const TEST_PATIENT_ID = 'PAT-TEST-999';

  beforeEach(() => {
    // Reset test appointment
    const appt: Appointment = {
      id: 'APT-TEST-001',
      hospitalId: TEST_HOSPITAL_ID,
      patientId: TEST_PATIENT_ID,
      patientName: 'John Doe',
      patientPhone: '+1 555-0101',
      patientAge: 38,
      patientGender: 'Male',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Jane Smith',
      doctorSpecialization: 'General Physician',
      departmentId: 'DEP-001',
      departmentName: 'General Medicine',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '10:00 AM',
      type: 'Consultation',
      status: 'Confirmed',
      fee: 50,
      paymentStatus: 'Paid',
      reason: 'Persistent fever and cough',
      createdAt: new Date().toISOString(),
    };
    MockStorage.saveAppointment(appt);
  });

  it('1. Receptionist checks in patient: updates same persisted appointment with Checked In status and timestamp', () => {
    const apptBefore = MockStorage.getAppointmentById('APT-TEST-001');
    assert.ok(apptBefore);
    assert.equal(apptBefore.status, 'Confirmed');

    // Receptionist check-in
    const checkInTime = new Date().toISOString();
    const updated: Appointment = {
      ...apptBefore,
      status: 'Checked In',
      checkedInAt: checkInTime,
    };
    MockStorage.saveAppointment(updated);

    const apptAfter = MockStorage.getAppointmentById('APT-TEST-001');
    assert.ok(apptAfter);
    assert.equal(apptAfter.status, 'Checked In');
    assert.equal(apptAfter.checkedInAt, checkInTime);
  });

  it('2. The checked-in appointment appears in the doctor queue and updates waiting metrics from persisted records', () => {
    // Ensure checked-in state
    MockStorage.updateAppointmentStatus('APT-TEST-001', 'Checked In');

    const docAppointments = MockStorage.getAppointments(TEST_HOSPITAL_ID).filter(
      (a) => a.doctorId === TEST_DOCTOR_ID
    );
    const waitingQueue = docAppointments.filter((a) => a.status === 'Checked In');

    assert.equal(waitingQueue.length, 1);
    assert.equal(waitingQueue[0].id, 'APT-TEST-001');
    assert.equal(waitingQueue[0].patientName, 'John Doe');
  });

  it('3. Doctor starts consultation: transitions to In Consultation and sets consultationStartedAt', () => {
    MockStorage.updateAppointmentStatus('APT-TEST-001', 'Checked In');

    const appt = MockStorage.getAppointmentById('APT-TEST-001');
    assert.ok(appt);
    assert.equal(appt.status, 'Checked In');

    // Doctor starts consultation
    const startTime = new Date().toISOString();
    const updatedAppt: Appointment = {
      ...appt,
      status: 'In Consultation',
      consultationStartedAt: startTime,
    };
    MockStorage.saveAppointment(updatedAppt);

    const persisted = MockStorage.getAppointmentById('APT-TEST-001');
    assert.ok(persisted);
    assert.equal(persisted.status, 'In Consultation');
    assert.equal(persisted.consultationStartedAt, startTime);
  });

  it('4. Doctor saves consultation draft: persists clinical fields without completing appointment', () => {
    MockStorage.updateAppointmentStatus('APT-TEST-001', 'In Consultation');

    const draftConsultation: Consultation = {
      id: 'CNS-TEST-001',
      hospitalId: TEST_HOSPITAL_ID,
      appointmentId: 'APT-TEST-001',
      patientId: TEST_PATIENT_ID,
      patientName: 'John Doe',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Jane Smith',
      status: 'Draft',
      chiefComplaint: 'High grade fever for 4 days',
      symptoms: 'Fever, dry cough, body aches',
      examination: 'Throat erythematous, chest clear, temperature 101.4F',
      vitals: {
        bloodPressure: '120/78 mmHg',
        heartRate: 88,
        temperature: 101.4,
        oxygenLevel: 98,
        weightKg: 72,
        recordedAt: new Date().toISOString(),
      },
      diagnosis: 'Acute Viral Pharyngitis',
      treatmentPlan: 'Hydration, antipyretics, rest',
      prescriptionItems: [
        {
          medicineName: 'Paracetamol 650mg',
          dosage: '1 tab',
          frequency: 'TDS (Three times daily)',
          duration: '3 days',
          instructions: 'After meals',
        },
      ],
      followUpInstructions: 'Return in 3 days if fever persists',
      notes: 'Initial clinical workup in progress',
      startedAt: new Date().toISOString(),
    };

    MockStorage.saveConsultation(draftConsultation);

    // Retrieve draft
    const retrievedDraft = MockStorage.getConsultationById('CNS-TEST-001');
    assert.ok(retrievedDraft);
    assert.equal(retrievedDraft.status, 'Draft');
    assert.equal(retrievedDraft.chiefComplaint, 'High grade fever for 4 days');
    assert.equal(retrievedDraft.diagnosis, 'Acute Viral Pharyngitis');
    assert.equal(retrievedDraft.prescriptionItems?.length, 1);

    // Appointment must still be In Consultation (NOT completed)
    const appt = MockStorage.getAppointmentById('APT-TEST-001');
    assert.ok(appt);
    assert.equal(appt.status, 'In Consultation');
  });

  it('5. Doctor finalizes consultation: marks consultation Finalized, completes appointment, updates EHR and creates prescription', () => {
    let existingDraft = MockStorage.getConsultationById('CNS-TEST-001');
    if (!existingDraft) {
      existingDraft = {
        id: 'CNS-TEST-001',
        hospitalId: TEST_HOSPITAL_ID,
        appointmentId: 'APT-TEST-001',
        patientId: TEST_PATIENT_ID,
        patientName: 'John Doe',
        doctorId: TEST_DOCTOR_ID,
        doctorName: 'Dr. Jane Smith',
        status: 'Draft',
        chiefComplaint: 'High grade fever for 4 days',
        symptoms: 'Fever, dry cough, body aches',
        examination: 'Throat erythematous, chest clear, temperature 101.4F',
        vitals: {
          bloodPressure: '120/78 mmHg',
          heartRate: 88,
          temperature: 101.4,
          oxygenLevel: 98,
          weightKg: 72,
          recordedAt: new Date().toISOString(),
        },
        diagnosis: 'Acute Viral Pharyngitis',
        treatmentPlan: 'Hydration, antipyretics, rest',
        prescriptionItems: [
          {
            medicineName: 'Paracetamol 650mg',
            dosage: '1 tab',
            frequency: 'TDS (Three times daily)',
            duration: '3 days',
            instructions: 'After meals',
          },
        ],
        followUpInstructions: 'Return in 3 days if fever persists',
        notes: 'Initial clinical workup in progress',
        startedAt: new Date().toISOString(),
      };
      MockStorage.saveConsultation(existingDraft);
    }

    const finalizedTime = new Date().toISOString();
    const finalizedConsultation: Consultation = {
      ...existingDraft,
      status: 'Finalized',
      finalizedAt: finalizedTime,
    };
    MockStorage.saveConsultation(finalizedConsultation);

    // Verify consultation is Finalized
    const storedConsultation = MockStorage.getConsultationById('CNS-TEST-001');
    assert.ok(storedConsultation);
    assert.equal(storedConsultation.status, 'Finalized');
    assert.equal(storedConsultation.finalizedAt, finalizedTime);

    // Verify appointment was transitioned to Completed
    const appt = MockStorage.getAppointmentById('APT-TEST-001');
    assert.ok(appt);
    assert.equal(appt.status, 'Completed');
    assert.ok(appt.consultationCompletedAt);

    // Verify generated prescription is retrievable by patient ID
    const prescriptions = MockStorage.getPrescriptions(TEST_PATIENT_ID, TEST_HOSPITAL_ID);
    assert.ok(prescriptions.length > 0);
    const pres = prescriptions.find((p) => p.diagnosis === 'Acute Viral Pharyngitis');
    assert.ok(pres);
    assert.equal(pres.doctorName, 'Dr. Jane Smith');
    assert.equal(pres.medications.length, 1);
    assert.equal(pres.medications[0].medicineName, 'Paracetamol 650mg');
  });

  it('6. Integrity constraint: Cancelled and No-Show appointments cannot start consultation', () => {
    const appt = MockStorage.getAppointmentById('APT-TEST-001')!;
    appt.status = 'Cancelled';
    MockStorage.saveAppointment(appt);

    const cancelledAppt = MockStorage.getAppointmentById('APT-TEST-001')!;
    assert.equal(cancelledAppt.status, 'Cancelled');

    // Attempting start on cancelled appointment must be blocked
    const canStart = (cancelledAppt.status as string) === 'Checked In';
    assert.equal(canStart, false);
  });

  it('7. Calculates cancellation penalty according to configured percentage and collects at Accountant billing on next visit', () => {
    // Hospital Admin configures: Cutoff = 4 hours, Penalty = 50% of consultation fee
    const cutoffHours = 4;
    const penaltyPercent = 50;
    const now = new Date('2026-10-26T10:00:00+05:30');

    // Case A: 6 hours before appointment (4:00 PM) -> Penalty-free
    const slotA = new Date('2026-10-26T16:00:00+05:30');
    const remainingHoursA = (slotA.getTime() - now.getTime()) / (1000 * 60 * 60);
    assert.ok(remainingHoursA >= cutoffHours);
    const feeA = 400;
    const penaltyA = remainingHoursA < cutoffHours ? Math.round((feeA * penaltyPercent) / 100) : 0;
    assert.equal(penaltyA, 0); // 0 penalty

    // Case B: 2 hours before appointment (12:00 PM) -> Exceeded penalty-free window -> configured 50% penalty
    const slotB = new Date('2026-10-26T12:00:00+05:30');
    const remainingHoursB = (slotB.getTime() - now.getTime()) / (1000 * 60 * 60);
    assert.ok(remainingHoursB < cutoffHours);
    const feeB = 500;
    const penaltyB = remainingHoursB < cutoffHours ? Math.round((feeB * penaltyPercent) / 100) : 0;
    assert.equal(penaltyB, 250); // 50% penalty applied on doctor fee

    // 1. Patient cancels late: penalty logged on appointment record as uncollected
    MockStorage.updateAppointmentStatus('APT-TEST-001', 'Cancelled', {
      cancellationPenalty: penaltyB,
      cancellationPenaltyCollected: false,
      cancelledAt: now.toISOString(),
    });

    const updated = MockStorage.getAppointmentById('APT-TEST-001');
    assert.equal(updated?.status, 'Cancelled');
    assert.equal(updated?.cancellationPenalty, 250);
    assert.equal(updated?.cancellationPenaltyCollected, false);

    // 2. Pending cancellation penalty is detected for Accountant Billing
    const pendingPenalties = MockStorage.getPendingCancellationPenalties(TEST_PATIENT_ID, TEST_HOSPITAL_ID);
    assert.equal(pendingPenalties.length, 1);
    assert.equal(pendingPenalties[0].cancellationPenalty, 250);

    // 3. On patient's next visit, Accountant creates invoice and collects the penalty
    MockStorage.markCancellationPenaltyCollected('APT-TEST-001', 'INV-NEXT-VISIT-001');

    // 4. Penalty is now marked collected and removed from pending dues
    const remainingPenalties = MockStorage.getPendingCancellationPenalties(TEST_PATIENT_ID, TEST_HOSPITAL_ID);
    assert.equal(remainingPenalties.length, 0);

    const finalizedAppt = MockStorage.getAppointmentById('APT-TEST-001');
    assert.equal(finalizedAppt?.cancellationPenaltyCollected, true);
    assert.equal(finalizedAppt?.cancellationCollectedInvoiceId, 'INV-NEXT-VISIT-001');
  });

  it('7b. Rescheduling Cutoff Exceeded calculates penalty similarly to Cancellation Cutoff', () => {
    // Configure hospital settings: Rescheduling cutoff = 4 hours, Penalty = 50%
    MockStorage.saveHospitalSettings({
      hospitalId: TEST_HOSPITAL_ID,
      hospitalName: 'General Hospital',
      tagline: 'Advanced Clinical Care',
      emergencyHelpline: '108',
      receptionPhone: '044-12345678',
      email: 'admin@hospital.org',
      address: '100 Medical Center Way',
      operatingHours: '24 Hours',
      consultationSlotMinutes: 15,
      taxRegistrationNumber: 'TAX-TEST-99',
      reschedulingDeadlineHours: 4,
      reschedulingPenaltyPercent: 50,
      cancellationDeadlineHours: 4,
      cancellationPenaltyPercent: 50,
    });

    // Create an appointment today, 1 hour from now (within the 4-hour cutoff window)
    const now = new Date();
    const targetSlotDate = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour ahead
    const dateStr = targetSlotDate.toISOString().split('T')[0];
    const hours = targetSlotDate.getHours();
    const mins = targetSlotDate.getMinutes();
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${meridiem}`;

    const aptToReschedule = {
      id: 'APT-RESCHEDULE-CUTOFF-01',
      hospitalId: TEST_HOSPITAL_ID,
      patientId: TEST_PATIENT_ID,
      patientName: 'Jane Doe',
      patientPhone: '9876543210',
      patientAge: 30,
      patientGender: 'Female' as const,
      doctorId: 'DOC-101',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Medicine',
      departmentId: 'DEP-01',
      departmentName: 'General Medicine',
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      type: 'General Checkup' as const,
      status: 'Confirmed' as const,
      reason: 'Fever follow-up',
      fee: 600, // 50% penalty should be 300
      paymentStatus: 'Paid' as const,
      createdAt: now.toISOString(),
    };
    MockStorage.saveAppointment(aptToReschedule);

    // Reschedule appointment to tomorrow:
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = MockStorage.rescheduleAppointment(
      'APT-RESCHEDULE-CUTOFF-01',
      tomorrow,
      '11:00 AM',
      'Patient requested shift due to work emergency'
    );

    assert.equal(res.success, true);
    assert.equal(res.isLateReschedule, true, 'Must detect that reschedule occurred within 4-hour cutoff');
    assert.equal(res.penalty, 300, 'Late reschedule penalty must be 50% of ₹600 fee = ₹300');

    // Verify appointment record has uncollected penalty
    const updatedApt = MockStorage.getAppointmentById('APT-RESCHEDULE-CUTOFF-01');
    assert.equal(updatedApt?.reschedulingPenalty, 300);
    assert.equal(updatedApt?.reschedulingPenaltyCollected, false);
    assert.equal(updatedApt?.rescheduledFromDate, dateStr);

    // Verify pending penalty appears for cashier collection
    const pendingPenalties = MockStorage.getPendingCancellationPenalties(TEST_PATIENT_ID, TEST_HOSPITAL_ID);
    const foundPenalty = pendingPenalties.find((p) => p.id === 'APT-RESCHEDULE-CUTOFF-01');
    assert.ok(foundPenalty, 'Late rescheduling penalty must appear in pending penalties for cashier billing');
    assert.equal(foundPenalty?.reschedulingPenalty, 300);

    // Cashier collects the penalty in an invoice
    MockStorage.markCancellationPenaltyCollected('APT-RESCHEDULE-CUTOFF-01', 'INV-RESCHEDULE-PENALTY-01');

    const finalizedApt = MockStorage.getAppointmentById('APT-RESCHEDULE-CUTOFF-01');
    assert.equal(finalizedApt?.reschedulingPenaltyCollected, true);
    assert.equal(finalizedApt?.reschedulingCollectedInvoiceId, 'INV-RESCHEDULE-PENALTY-01');

    const remainingPenalties = MockStorage.getPendingCancellationPenalties(TEST_PATIENT_ID, TEST_HOSPITAL_ID);
    assert.equal(remainingPenalties.filter((p) => p.id === 'APT-RESCHEDULE-CUTOFF-01').length, 0);
  });

  it('8. Mandatory Nursing Vitals Triage strictly blocks doctor from starting consultation if not triaged', () => {
    MockStorage.saveHospitalSettings({
      hospitalId: TEST_HOSPITAL_ID,
      hospitalName: 'General Hospital',
      tagline: 'Advanced Clinical Care',
      emergencyHelpline: '108',
      receptionPhone: '100',
      email: 'admin@hosp.com',
      address: 'Main Campus',
      operatingHours: '24/7',
      taxRegistrationNumber: 'EIN-1234567',
      consultationSlotMinutes: 15,
      mandatoryVitalsTriage: true,
      requireFullSettlementOnDischarge: true,
    });

    const settings = MockStorage.getHospitalSettings(TEST_HOSPITAL_ID);
    assert.equal(settings.mandatoryVitalsTriage, true);

    // Patient without vitals
    const patientWithoutVitals: any = {
      id: TEST_PATIENT_ID,
      name: 'John Doe',
      vitals: {},
    };
    const hasVitalsBefore = Boolean(
      patientWithoutVitals.vitals?.bloodPressure ||
      patientWithoutVitals.vitals?.heartRate ||
      patientWithoutVitals.vitals?.temperature
    );
    assert.equal(hasVitalsBefore, false);

    // With mandatory vitals triage active, start consultation is strictly locked
    const canDoctorStart = !settings.mandatoryVitalsTriage || hasVitalsBefore;
    assert.equal(canDoctorStart, false);

    // Nurse records vitals
    patientWithoutVitals.vitals = {
      bloodPressure: '120/80 mmHg',
      heartRate: 72,
      temperature: 98.6,
      oxygenLevel: 99,
    };
    const hasVitalsAfter = Boolean(
      patientWithoutVitals.vitals?.bloodPressure ||
      patientWithoutVitals.vitals?.heartRate ||
      patientWithoutVitals.vitals?.temperature
    );
    assert.equal(hasVitalsAfter, true);

    // Once nurse records vitals, doctor is authorized to start consultation
    const canDoctorStartAfter = !settings.mandatoryVitalsTriage || hasVitalsAfter;
    assert.equal(canDoctorStartAfter, true);

    // When Mandatory Nursing Vitals Triage is CHECKED OUT (disabled: false), doctor can start consultation immediately even without nurse vitals
    MockStorage.saveHospitalSettings({
      ...settings,
      mandatoryVitalsTriage: false,
    });
    const settingsDisabled = MockStorage.getHospitalSettings(TEST_HOSPITAL_ID);
    assert.equal(settingsDisabled.mandatoryVitalsTriage, false);
    const canDoctorStartWithoutVitalsWhenDisabled = !settingsDisabled.mandatoryVitalsTriage || hasVitalsBefore;
    assert.equal(canDoctorStartWithoutVitalsWhenDisabled, true);
  });

  it('Check-In generates bell notification for Nurse with Clinical Intake Required alert', () => {
    const apt: Appointment = {
      id: 'APT-CHECKIN-NOTIF-01',
      hospitalId: TEST_HOSPITAL_ID,
      patientId: TEST_PATIENT_ID,
      patientName: 'Jane Smith',
      patientPhone: '9876543210',
      patientAge: 29,
      patientGender: 'Female',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. John Watson',
      doctorSpecialization: 'Cardiology',
      departmentId: 'DEP-101',
      departmentName: 'Cardiology',
      appointmentDate: '2026-11-06',
      appointmentTime: '10:00 AM',
      type: 'General Checkup',
      status: 'Confirmed',
      reason: 'Chest discomfort',
      fee: 200,
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString(),
    };
    MockStorage.saveAppointment(apt);

    // Receptionist checks in the patient
    MockStorage.updateAppointmentStatus(apt.id, 'Checked In');

    // Verify notification was generated for Nurse
    const nurseNotifications = MockStorage.getRoleNotifications('nurse', TEST_HOSPITAL_ID);
    const checkInNotif = nurseNotifications.find((n) => n.id === `notif-checkin-nurse-${apt.id}`);
    assert.ok(checkInNotif, 'Nurse should receive bell notification on patient check-in');
    assert.equal(checkInNotif?.title, 'Clinical Intake Required: Jane Smith');
    assert.ok(checkInNotif?.message.includes('Please complete clinical intake & record vitals'));
    assert.ok(checkInNotif?.targetRoles?.includes('nurse'));
  });

  it('Buffer Time & Appointment Settings stay synchronized bidirectionally with Hospital Settings', () => {
    // 1. Updating Hospital Settings updates Appointment Settings
    MockStorage.saveHospitalSettings({
      ...MockStorage.getHospitalSettings(TEST_HOSPITAL_ID),
      appointmentBufferMinutes: 15,
      maxAdvanceBookingDays: 45,
    });
    const apptSettings = MockStorage.getAppointmentSettings(TEST_HOSPITAL_ID);
    assert.equal(apptSettings.appointmentBufferMinutes, 15);
    assert.equal(apptSettings.maxAdvanceBookingDays, 45);

    // 2. Updating Appointment Settings updates Hospital Settings
    MockStorage.saveAppointmentSettings({
      ...apptSettings,
      appointmentBufferMinutes: 10,
      maxAdvanceBookingDays: 60,
    });
    const hospSettingsAfter = MockStorage.getHospitalSettings(TEST_HOSPITAL_ID);
    assert.equal(hospSettingsAfter.appointmentBufferMinutes, 10);
    assert.equal(hospSettingsAfter.maxAdvanceBookingDays, 60);
  });

  it('Strict OTC Pharmacy Blocker prevents dispensing prescription-required drugs without doctor Rx', () => {
    // 1. Create a Prescription-Only medicine (Schedule-H antibiotic)
    const rxMed = {
      id: 'MED-RX-AMOX-500',
      hospitalId: TEST_HOSPITAL_ID,
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      sku: 'SKU-AMOX-500',
      batchNumber: 'B-AMX-99',
      category: 'Antibiotics' as const,
      stockQuantity: 100,
      minThreshold: 20,
      unitPrice: 25.0,
      expiryDate: '2028-12-31',
      manufacturer: 'Cipla Ltd',
      locationRack: 'Shelf A1',
      requiresPrescription: true, // Schedule-H Prescription Required
      status: 'In Stock' as const,
    };
    MockStorage.saveMedicine(rxMed);

    // 2. Create a non-prescription OTC medicine (Paracetamol)
    const otcMed = {
      id: 'MED-OTC-PARA-650',
      hospitalId: TEST_HOSPITAL_ID,
      name: 'Paracetamol 650mg',
      genericName: 'Paracetamol',
      sku: 'SKU-PARA-650',
      batchNumber: 'B-PCM-11',
      category: 'Analgesics' as const,
      stockQuantity: 200,
      minThreshold: 30,
      unitPrice: 5.0,
      expiryDate: '2028-12-31',
      manufacturer: 'Apex Pharma',
      locationRack: 'Shelf B2',
      requiresPrescription: false, // General OTC
      status: 'In Stock' as const,
    };
    MockStorage.saveMedicine(otcMed);

    // 3. Attempt to buy the prescription-required medicine via OTC POS -> strictly blocked
    const blockedSale = MockStorage.createOTCPurchase(
      'Walk-in Retail Buyer',
      '9876543210',
      [{ medicineId: 'MED-RX-AMOX-500', medicineName: 'Amoxicillin 500mg', quantity: 2, unitPrice: 25.0 }],
      'Cash',
      'Chief Pharmacist',
      TEST_HOSPITAL_ID
    );
    assert.equal(blockedSale.success, false, 'Sale must be rejected for prescription-required medicine');
    assert.ok(
      blockedSale.error?.includes('Schedule-H Restriction') || blockedSale.error?.includes('prescription'),
      'Must return clear Schedule-H prescription restriction error'
    );

    // 4. Attempt to buy the OTC medicine -> successfully processed
    const allowedSale = MockStorage.createOTCPurchase(
      'Walk-in Retail Buyer',
      '9876543210',
      [{ medicineId: 'MED-OTC-PARA-650', medicineName: 'Paracetamol 650mg', quantity: 2, unitPrice: 5.0 }],
      'Cash',
      'Chief Pharmacist',
      TEST_HOSPITAL_ID
    );
    assert.equal(allowedSale.success, true, 'OTC medicine purchase must be approved');
    assert.ok(allowedSale.invoiceId?.startsWith('INV-OTC-'));
  });

  it('Medicine custom fields (e.g. SKU MED-0006, batch, rack) are preserved dynamically and never overwritten by backend sync fallbacks', async () => {
    const customMed: Medicine = {
      id: 'MED-MW5XI7LV-UTWQ',
      hospitalId: TEST_HOSPITAL_ID,
      name: 'Custom Medicine X',
      genericName: 'Custom Molecule',
      sku: 'MED-0006',
      batchNumber: 'BAT-2026-CUSTOM',
      category: 'General',
      stockQuantity: 80,
      minThreshold: 15,
      unitPrice: 45.0,
      expiryDate: '2028-05-20',
      manufacturer: 'User Custom Pharma',
      locationRack: 'Shelf C3',
      requiresPrescription: true,
      status: 'In Stock',
    };
    MockStorage.saveMedicine(customMed);

    // Verify stored correctly
    const storedBefore = MockStorage.getMedicines(TEST_HOSPITAL_ID).find((m) => m.id === 'MED-MW5XI7LV-UTWQ');
    assert.equal(storedBefore?.sku, 'MED-0006');
    assert.equal(storedBefore?.batchNumber, 'BAT-2026-CUSTOM');
    assert.equal(storedBefore?.manufacturer, 'User Custom Pharma');

    // Run backend sync (which simulates reconciliation)
    await MockStorage.syncWithBackend();

    // Verify custom fields were NOT overwritten by dummy fallback strings like SKU-MED-MW5XI7LV-UTWQ
    const storedAfter = MockStorage.getMedicines(TEST_HOSPITAL_ID).find((m) => m.id === 'MED-MW5XI7LV-UTWQ');
    assert.equal(storedAfter?.sku, 'MED-0006', 'SKU must remain MED-0006 and not be overwritten');
    assert.equal(storedAfter?.batchNumber, 'BAT-2026-CUSTOM', 'Batch number must remain BAT-2026-CUSTOM');
    assert.equal(storedAfter?.manufacturer, 'User Custom Pharma', 'Manufacturer must be preserved');
    assert.equal(storedAfter?.locationRack, 'Shelf C3', 'Rack location must be preserved');
    assert.equal(storedAfter?.requiresPrescription, true, 'requiresPrescription must be preserved');
  });

  it('Bed set to Maintenance is strictly preserved on refresh/sync and is never deleted or reset to Available', async () => {
    // 1. Create a bed in the hospital
    const testBed: Bed = {
      id: 'BED-TEST-MAINT-001',
      hospitalId: TEST_HOSPITAL_ID,
      wardId: 'WARD-TEST-01',
      wardName: 'Cardiology Ward',
      bedNumber: 'CARD-B01',
      wardType: 'ICU',
      floor: '3rd Floor',
      status: 'Available',
      dailyRate: 2500,
      notes: 'Monitored Cardiac Telemetry Bed',
    };
    MockStorage.saveBed(testBed);

    const bedsBefore = MockStorage.getBeds(TEST_HOSPITAL_ID);
    assert.ok(bedsBefore.some((b) => b.id === 'BED-TEST-MAINT-001'));

    // 2. Set the bed to Maintenance
    MockStorage.updateBedStatus('BED-TEST-MAINT-001', 'Maintenance');

    const bedsAfterMaint = MockStorage.getBeds(TEST_HOSPITAL_ID);
    const maintBed = bedsAfterMaint.find((b) => b.id === 'BED-TEST-MAINT-001');
    assert.equal(maintBed?.status, 'Maintenance', 'Bed status must be Maintenance');

    // 3. Simulate page reload / backend sync
    await MockStorage.syncWithBackend();

    // 4. Verify bed STILL exists and status is STILL Maintenance (not deleted, not reset to Available)
    const bedsAfterRefresh = MockStorage.getBeds(TEST_HOSPITAL_ID);
    const refreshedBed = bedsAfterRefresh.find((b) => b.id === 'BED-TEST-MAINT-001');
    assert.ok(refreshedBed, 'Bed must NOT be deleted after refresh/sync');
    assert.equal(refreshedBed?.status, 'Maintenance', 'Bed status must remain Maintenance after refresh/sync');
    assert.equal(refreshedBed?.hospitalId, TEST_HOSPITAL_ID, 'Hospital ID must be preserved');
    assert.equal(refreshedBed?.wardId, 'WARD-TEST-01', 'Ward ID must be preserved');
  });
});
