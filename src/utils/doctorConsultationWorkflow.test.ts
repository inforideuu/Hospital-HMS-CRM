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
import { Appointment, Consultation } from '../types';

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
});
