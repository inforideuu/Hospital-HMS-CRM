import { test, describe, beforeEach } from 'node:test';
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
import { Appointment, Consultation, FollowUpRequest } from '../types';

describe('5-Step Clinical Follow-Up Workflow Tests', () => {
  const TEST_HOSP_ID = 'HOSP-TEST-FOLLOWUP';
  const TEST_PATIENT_ID = 'PAT-TEST-001';
  const TEST_DOCTOR_ID = 'DOC-TEST-101';

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
  });

  test('Step 1 — Doctor initiates follow-up while completing consultation', () => {
    // Create initial consultation where doctor recommends follow-up in 7 days
    const consult: Consultation = {
      id: 'CON-TEST-1',
      hospitalId: TEST_HOSP_ID,
      appointmentId: 'APT-INIT-001',
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      status: 'Finalized',
      chiefComplaint: 'Acute chest congestion and fever',
      diagnosis: 'Acute Bronchitis',
      treatmentPlan: 'Antibiotic course + bronchodilator syrup',
      needsFollowUp: true,
      followUpDate: '2026-10-28',
      followUpIntervalDays: 7,
      followUpReason: 'Review lung recovery and check SpO2 baseline',
      finalizedAt: new Date().toISOString(),
    };

    MockStorage.saveConsultation(consult);

    // Verify FollowUpRequest was automatically generated in 'Pending' status
    const requests = MockStorage.getFollowUpRequests(TEST_HOSP_ID);
    assert.equal(requests.length, 1, 'Exactly one FollowUpRequest should be created');
    
    const req = requests[0];
    assert.equal(req.status, 'Pending');
    assert.equal(req.patientId, TEST_PATIENT_ID);
    assert.equal(req.patientName, 'Aarav Patel');
    assert.equal(req.suggestedDate, '2026-10-28');
    assert.equal(req.intervalDays, 7);
    assert.equal(req.reason, 'Review lung recovery and check SpO2 baseline');
    assert.equal(req.consultationId, 'CON-TEST-1');
  });

  test('Step 2 — Receptionist schedules the follow-up appointment from the pending queue', () => {
    // 1. Existing pending follow-up request from Step 1
    const req: FollowUpRequest = {
      id: 'FUR-TEST-001',
      hospitalId: TEST_HOSP_ID,
      consultationId: 'CON-TEST-1',
      originalAppointmentId: 'APT-INIT-001',
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      patientPhone: '+91 9876543210',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      departmentName: 'Pulmonology',
      suggestedDate: '2026-10-28',
      intervalDays: 7,
      reason: 'Review lung recovery and check SpO2 baseline',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    MockStorage.saveFollowUpRequest(req);

    // 2. Receptionist selects the pending request and books the follow-up appointment
    const followUpApt: Appointment = {
      id: 'APT-FU-202',
      hospitalId: TEST_HOSP_ID,
      parentAppointmentId: req.originalAppointmentId,
      patientId: req.patientId,
      patientName: req.patientName,
      patientPhone: req.patientPhone,
      patientAge: 38,
      patientGender: 'Male',
      doctorId: req.doctorId,
      doctorName: req.doctorName,
      doctorSpecialization: 'Pulmonologist',
      departmentId: 'DEP-PULM',
      departmentName: 'Pulmonology',
      appointmentDate: '2026-10-28',
      appointmentTime: '10:30 AM',
      type: 'Follow-up',
      status: 'Confirmed',
      reason: req.reason,
      fee: 200,
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString().split('T')[0],
      isFollowUp: true,
      followUpReason: req.reason,
    };
    MockStorage.saveAppointment(followUpApt);

    // 3. Receptionist updates the request status to 'Scheduled'
    MockStorage.updateFollowUpRequestStatus(
      req.id,
      'Scheduled',
      followUpApt.id,
      followUpApt.appointmentDate,
      followUpApt.appointmentTime
    );

    // Verify request is now 'Scheduled' with appointment reference
    const updatedRequests = MockStorage.getFollowUpRequests(TEST_HOSP_ID);
    const updatedReq = updatedRequests.find((r) => r.id === req.id);
    assert.ok(updatedReq);
    assert.equal(updatedReq.status, 'Scheduled');
    assert.equal(updatedReq.scheduledAppointmentId, 'APT-FU-202');
    assert.equal(updatedReq.scheduledDate, '2026-10-28');
    assert.equal(updatedReq.scheduledTime, '10:30 AM');
  });

  test('Step 3 — Patient receives confirmation and views follow-up details in portal', () => {
    // When patient loads appointments, the scheduled follow-up appointment is retrieved
    const apt: Appointment = {
      id: 'APT-FU-202',
      hospitalId: TEST_HOSP_ID,
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      patientPhone: '+91 9876543210',
      patientAge: 38,
      patientGender: 'Male',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      doctorSpecialization: 'Pulmonologist',
      departmentId: 'DEP-PULM',
      departmentName: 'Pulmonology',
      appointmentDate: '2026-10-28',
      appointmentTime: '10:30 AM',
      type: 'Follow-up',
      status: 'Confirmed',
      reason: 'Review lung recovery and check SpO2 baseline',
      isFollowUp: true,
      followUpReason: 'Review lung recovery and check SpO2 baseline',
      fee: 200,
      paymentStatus: 'Paid',
      createdAt: '2026-10-21',
    };
    MockStorage.saveAppointment(apt);

    const patientAppointments = MockStorage.getAppointments(undefined, TEST_PATIENT_ID);
    assert.equal(patientAppointments.length, 1);
    const retrieved = patientAppointments[0];
    assert.equal(retrieved.status, 'Confirmed');
    assert.equal(retrieved.isFollowUp, true);
    assert.equal(retrieved.followUpReason, 'Review lung recovery and check SpO2 baseline');
  });

  test('Step 4 — Follow-up appointment takes place (check-in and previous encounter comparison)', () => {
    // 1. Initial consultation in patient history
    const priorConsult: Consultation = {
      id: 'CON-TEST-1',
      hospitalId: TEST_HOSP_ID,
      appointmentId: 'APT-INIT-001',
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      status: 'Finalized',
      chiefComplaint: 'Chest congestion',
      diagnosis: 'Acute Bronchitis',
      treatmentPlan: 'Antibiotics 5 days',
      prescriptionItems: [
        { medicineName: 'Azithromycin 500mg', dosage: '1 tab', frequency: 'OD', duration: '5 days', instructions: 'After food' }
      ],
      vitals: { bloodPressure: '135/88 mmHg', heartRate: 88, oxygenLevel: 94 },
      finalizedAt: '2026-10-21T10:00:00.000Z',
    };
    MockStorage.saveConsultation(priorConsult);

    // 2. Follow-up appointment arrives, receptionist checks patient in
    const followUpApt: Appointment = {
      id: 'APT-FU-202',
      hospitalId: TEST_HOSP_ID,
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      patientPhone: '+91 9876543210',
      patientAge: 38,
      patientGender: 'Male',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      doctorSpecialization: 'Pulmonologist',
      departmentId: 'DEP-PULM',
      departmentName: 'Pulmonology',
      appointmentDate: '2026-10-28',
      appointmentTime: '10:30 AM',
      type: 'Follow-up',
      status: 'Confirmed',
      reason: 'Review lung recovery',
      isFollowUp: true,
      followUpReason: 'Review lung recovery and check SpO2 baseline',
      fee: 200,
      paymentStatus: 'Paid',
      createdAt: '2026-10-21',
    };
    MockStorage.saveAppointment(followUpApt);

    // Check in
    MockStorage.updateAppointmentStatus(followUpApt.id, 'Checked In');
    const checkedIn = MockStorage.getAppointmentById(followUpApt.id);
    assert.equal(checkedIn?.status, 'Checked In');

    // Clinician opens consultation workspace: prior consultation is found for baseline comparison
    const allConsults = MockStorage.getConsultations(TEST_HOSP_ID).filter(
      (c) => c.patientId === TEST_PATIENT_ID && c.status === 'Finalized'
    );
    const baseline = allConsults.sort(
      (a, b) => new Date(b.finalizedAt || 0).getTime() - new Date(a.finalizedAt || 0).getTime()
    )[0];

    assert.ok(baseline, 'Baseline prior encounter should be retrieved');
    assert.equal(baseline.diagnosis, 'Acute Bronchitis');
    assert.equal(baseline.vitals?.oxygenLevel, 94);
    assert.equal(baseline.prescriptionItems?.[0].medicineName, 'Azithromycin 500mg');
  });

  test('Step 5A — Follow-up is rescheduled with date tracking', () => {
    const apt: Appointment = {
      id: 'APT-FU-202',
      hospitalId: TEST_HOSP_ID,
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      patientPhone: '+91 9876543210',
      patientAge: 38,
      patientGender: 'Male',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      doctorSpecialization: 'Pulmonologist',
      departmentId: 'DEP-PULM',
      departmentName: 'Pulmonology',
      appointmentDate: '2026-10-28',
      appointmentTime: '10:30 AM',
      type: 'Follow-up',
      status: 'Confirmed',
      reason: 'Review lung recovery',
      isFollowUp: true,
      fee: 200,
      paymentStatus: 'Paid',
      createdAt: '2026-10-21',
    };
    MockStorage.saveAppointment(apt);

    // Reschedule to 2026-10-30 at 11:15 AM
    const res = MockStorage.rescheduleAppointment(
      apt.id,
      '2026-10-30',
      '11:15 AM',
      'Patient requested postponement due to travel'
    );

    assert.equal(res.success, true);
    assert.ok(res.appointment);
    const updated = res.appointment;
    assert.equal(updated.appointmentDate, '2026-10-30');
    assert.equal(updated.appointmentTime, '11:15 AM');
    assert.equal(updated.rescheduledFromDate, '2026-10-28');
    assert.equal(updated.rescheduledFromTime, '10:30 AM');
    assert.equal(updated.rescheduleReason, 'Patient requested postponement due to travel');
    assert.equal(updated.status, 'Confirmed');
  });

  test('Step 5B — Follow-up encounter is completed and finalized, closing the follow-up cycle', () => {
    // FollowUpRequest currently Scheduled
    const req: FollowUpRequest = {
      id: 'FUR-TEST-001',
      hospitalId: TEST_HOSP_ID,
      consultationId: 'CON-TEST-1',
      originalAppointmentId: 'APT-INIT-001',
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      patientPhone: '+91 9876543210',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      departmentName: 'Pulmonology',
      reason: 'Review lung recovery',
      suggestedDate: '2026-10-28',
      status: 'Scheduled',
      scheduledAppointmentId: 'APT-FU-202',
      createdAt: new Date().toISOString(),
    };
    MockStorage.saveFollowUpRequest(req);

    const followUpApt: Appointment = {
      id: 'APT-FU-202',
      hospitalId: TEST_HOSP_ID,
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      patientPhone: '+91 9876543210',
      patientAge: 38,
      patientGender: 'Male',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      doctorSpecialization: 'Pulmonologist',
      departmentId: 'DEP-PULM',
      departmentName: 'Pulmonology',
      appointmentDate: '2026-10-28',
      appointmentTime: '10:30 AM',
      type: 'Follow-up',
      status: 'In Consultation',
      reason: 'Review lung recovery',
      isFollowUp: true,
      fee: 200,
      paymentStatus: 'Paid',
      createdAt: '2026-10-21',
    };
    MockStorage.saveAppointment(followUpApt);

    // Doctor conducts follow-up consultation and finalizes it
    const followUpConsult: Consultation = {
      id: 'CON-FU-202',
      hospitalId: TEST_HOSP_ID,
      appointmentId: followUpApt.id,
      patientId: TEST_PATIENT_ID,
      patientName: 'Aarav Patel',
      doctorId: TEST_DOCTOR_ID,
      doctorName: 'Dr. Ramesh Sharma',
      status: 'Finalized',
      chiefComplaint: 'Follow-up on bronchitis recovery',
      diagnosis: 'Resolved Bronchitis',
      treatmentPlan: 'Discontinue antibiotics. Normal activity resumed.',
      needsFollowUp: false,
      finalizedAt: new Date().toISOString(),
    };
    MockStorage.saveConsultation(followUpConsult);

    // Verify appointment is completed
    const finalApt = MockStorage.getAppointmentById(followUpApt.id);
    assert.equal(finalApt?.status, 'Completed');

    // Verify FollowUpRequest is marked 'Completed'
    const finalRequests = MockStorage.getFollowUpRequests(TEST_HOSP_ID);
    const finalReq = finalRequests.find((r) => r.id === req.id);
    assert.ok(finalReq);
    assert.equal(finalReq.status, 'Completed');
  });
});
