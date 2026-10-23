import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  getDayOfWeekName,
  formatDisplayDate,
  addDays,
  getHospitalTodayDate,
  getHospitalMinutesSinceMidnight,
  getHospitalLocalTime,
  getScheduleDateConstraints,
  findNextConsultingDate,
  generateDoctorTimeSlots,
  validateBookingAvailability,
} from './appointmentScheduling';
import type {
  DoctorSchedule,
  DoctorUnavailablePeriod,
  AppointmentSettings,
  Appointment,
} from '../types';

const baseSchedule: DoctorSchedule = {
  id: 'SCH-TEST-001',
  hospitalId: 'HOSP-001',
  doctorId: 'DOC-TEST-1',
  doctorName: 'Dr. John Test',
  departmentId: 'DEP-101',
  departmentName: 'Cardiology',
  opdRoomId: 'ROOM-101',
  opdRoomName: 'Cardiology OPD Room 1',
  workingDays: ['Monday', 'Wednesday', 'Friday'],
  consultationStartTime: '09:00 AM',
  consultationEndTime: '01:00 PM',
  slotDurationMinutes: 30,
  breaks: [
    {
      id: 'BRK-1',
      name: 'Tea Break',
      startTime: '10:30 AM',
      endTime: '11:00 AM',
    },
  ],
  effectiveStartDate: '2026-10-01',
  effectiveEndDate: '2026-12-31',
  isActive: true,
  createdAt: '2026-09-01',
};

const baseSettings: AppointmentSettings = {
  hospitalId: 'HOSP-001',
  maxAdvanceBookingDays: 30,
  minAdvanceBookingHours: 2,
  cancellationDeadlineHours: 4,
  reschedulingDeadlineHours: 4,
  appointmentBufferMinutes: 5,
  allowSameDayBooking: true,
};

describe('OPD Appointment Scheduling & Availability Logic', () => {
  // Test 1: Past Dates
  test('Requirement 1: Rejects past appointment dates and returns no slots', () => {
    const today = getHospitalTodayDate();
    const pastDate = addDays(today, -5); // 5 days in past

    const result = generateDoctorTimeSlots(
      baseSchedule,
      pastDate,
      [],
      [],
      undefined,
      baseSettings
    );

    assert.equal(result.isPastDate, true);
    assert.equal(result.slots.length, 0);
    assert.match(result.message || '', /past/i);

    const validation = validateBookingAvailability(
      {
        doctorId: baseSchedule.doctorId,
        appointmentDate: pastDate,
        appointmentTime: '10:00 AM',
      },
      baseSchedule,
      [],
      [],
      baseSettings
    );

    assert.equal(validation.isValid, false);
    assert.match(validation.errorMessage || '', /past/i);
  });

  // Test 2: Future Schedule Start Date
  test('Requirements 2 & 3: Handles future schedule start dates, disables earlier dates, and gives clear message', () => {
    const futureStartDate = '2026-11-01';
    const futureSchedule: DoctorSchedule = {
      ...baseSchedule,
      effectiveStartDate: futureStartDate,
      effectiveEndDate: '2026-12-31',
    };

    const constraints = getScheduleDateConstraints(futureSchedule, baseSettings);
    assert.equal(constraints.isFutureSchedule, true);
    assert.equal(constraints.futureStartDate, futureStartDate);
    assert.equal(constraints.minDate, futureStartDate);

    // Date before schedule start date (e.g. 2026-10-25)
    const preStartDate = '2026-10-25';
    const result = generateDoctorTimeSlots(
      futureSchedule,
      preStartDate,
      [],
      [],
      undefined,
      baseSettings
    );

    assert.equal(result.isFutureSchedule, true);
    assert.equal(result.outsideEffectiveRange, true);
    assert.equal(result.slots.length, 0);
    assert.equal(result.message, "Doctor's schedule starts on 1 Nov 2026.");

    const validation = validateBookingAvailability(
      {
        doctorId: futureSchedule.doctorId,
        appointmentDate: preStartDate,
        appointmentTime: '10:00 AM',
      },
      futureSchedule,
      [],
      [],
      baseSettings
    );

    assert.equal(validation.isValid, false);
    assert.equal(validation.errorMessage, "Doctor's schedule starts on 1 Nov 2026.");
  });

  // Test 3: Non-Consulting Weekdays
  test('Requirement 4: Rejects non-consulting weekdays and specifies day name', () => {
    // Schedule workingDays: ['Monday', 'Wednesday', 'Friday']
    // Find a Tuesday within effective date range
    const today = getHospitalTodayDate();
    let tuesday = today;
    for (let i = 0; i < 7; i++) {
      const candidate = addDays(today, i);
      if (getDayOfWeekName(candidate) === 'Tuesday') {
        tuesday = candidate;
        break;
      }
    }

    const result = generateDoctorTimeSlots(
      baseSchedule,
      tuesday,
      [],
      [],
      undefined,
      baseSettings
    );

    assert.equal(result.isDoctorWorkingDay, false);
    assert.equal(result.slots.length, 0);
    assert.equal(result.message, 'Doctor does not hold OPD consultations on Tuesdays.');

    const validation = validateBookingAvailability(
      {
        doctorId: baseSchedule.doctorId,
        appointmentDate: tuesday,
        appointmentTime: '10:00 AM',
      },
      baseSchedule,
      [],
      [],
      baseSettings
    );

    assert.equal(validation.isValid, false);
    assert.match(validation.errorMessage || '', /Tuesdays/i);
  });

  // Test 4: Doctor Full-Day Leave
  test('Requirement 4: Blocks slots when doctor has full-day leave or unavailable period', () => {
    const today = getHospitalTodayDate();
    // Pick a future working day
    let leaveDate = addDays(today, 7);
    while (!baseSchedule.workingDays.includes(getDayOfWeekName(leaveDate))) {
      leaveDate = addDays(leaveDate, 1);
    }

    const unavailabilities: DoctorUnavailablePeriod[] = [
      {
        id: 'UNAV-1',
        hospitalId: 'HOSP-001',
        doctorId: baseSchedule.doctorId,
        type: 'Leave',
        title: 'Annual Medical Conference',
        startDate: leaveDate,
        endDate: leaveDate,
        isAllDay: true,
        reason: 'Keynote Speaker',
      },
    ];

    const result = generateDoctorTimeSlots(
      baseSchedule,
      leaveDate,
      [],
      unavailabilities,
      undefined,
      baseSettings
    );

    assert.equal(result.isOnLeave, true);
    assert.equal(result.slots.length, 0);
    assert.match(result.message || '', /Annual Medical Conference/);

    const validation = validateBookingAvailability(
      {
        doctorId: baseSchedule.doctorId,
        appointmentDate: leaveDate,
        appointmentTime: '10:00 AM',
      },
      baseSchedule,
      [],
      unavailabilities,
      baseSettings
    );

    assert.equal(validation.isValid, false);
    assert.match(validation.errorMessage || '', /Leave/);
  });

  // Test 5: Doctor Partial-Day Leave & Breaks
  test('Requirement 4: Marks partial-day leaves and breaks correctly while keeping other slots available', () => {
    const today = getHospitalTodayDate();
    let testDate = addDays(today, 10);
    while (!baseSchedule.workingDays.includes(getDayOfWeekName(testDate))) {
      testDate = addDays(testDate, 1);
    }

    const unavailabilities: DoctorUnavailablePeriod[] = [
      {
        id: 'UNAV-PART-1',
        hospitalId: 'HOSP-001',
        doctorId: baseSchedule.doctorId,
        type: 'Administrative',
        title: 'Board Meeting',
        startDate: testDate,
        endDate: testDate,
        startTime: '11:30 AM',
        endTime: '12:30 PM',
        isAllDay: false,
      },
    ];

    const result = generateDoctorTimeSlots(
      baseSchedule,
      testDate,
      [],
      unavailabilities,
      undefined,
      baseSettings
    );

    assert.equal(result.slots.length > 0, true);

    // 09:00 AM should be available
    const slot0900 = result.slots.find((s) => s.time === '09:00 AM');
    assert.equal(slot0900?.isAvailable, true);
    assert.equal(slot0900?.status, 'available');

    // 10:30 AM is during Tea Break (10:30 AM - 11:00 AM)
    const slot1030 = result.slots.find((s) => s.time === '10:30 AM');
    assert.equal(slot1030?.isAvailable, false);
    assert.equal(slot1030?.status, 'break');

    // 11:30 AM is during Administrative Board Meeting (11:30 AM - 12:30 PM)
    const slot1130 = result.slots.find((s) => s.time === '11:30 AM');
    assert.equal(slot1130?.isAvailable, false);
    assert.equal(slot1130?.status, 'leave');

    // 12:00 PM is also during Board Meeting
    const slot1200 = result.slots.find((s) => s.time === '12:00 PM');
    assert.equal(slot1200?.isAvailable, false);
    assert.equal(slot1200?.status, 'leave');

    // 12:30 PM should be available
    const slot1230 = result.slots.find((s) => s.time === '12:30 PM');
    assert.equal(slot1230?.isAvailable, true);
    assert.equal(slot1230?.status, 'available');
  });

  // Test 6: Valid Consultation Date & Slots Generation
  test('Requirement 4: Successfully generates available slots on valid consultation days', () => {
    const today = getHospitalTodayDate();
    let validDate = addDays(today, 3);
    while (!baseSchedule.workingDays.includes(getDayOfWeekName(validDate))) {
      validDate = addDays(validDate, 1);
    }

    const result = generateDoctorTimeSlots(
      baseSchedule,
      validDate,
      [],
      [],
      undefined,
      baseSettings
    );

    assert.equal(result.isDoctorWorkingDay, true);
    assert.equal(result.isOnLeave, false);
    assert.equal(result.outsideEffectiveRange, false);
    assert.equal(result.slots.length, 8); // 09:00 AM to 01:00 PM = 8 30-min slots

    const availableSlots = result.slots.filter((s) => s.isAvailable);
    assert.equal(availableSlots.length, 7); // 8 minus 1 tea break = 7

    const validation = validateBookingAvailability(
      {
        doctorId: baseSchedule.doctorId,
        appointmentDate: validDate,
        appointmentTime: '09:00 AM',
      },
      baseSchedule,
      [],
      [],
      baseSettings
    );

    assert.equal(validation.isValid, true);
  });

  // Test 7: Buffer Time and Existing Booking Conflicts
  test('Requirement 4: Prevents double-booking and enforces configured buffer time between consultations', () => {
    const today = getHospitalTodayDate();
    let testDate = addDays(today, 5);
    while (!baseSchedule.workingDays.includes(getDayOfWeekName(testDate))) {
      testDate = addDays(testDate, 1);
    }

    const existingAppointments: Appointment[] = [
      {
        id: 'APT-1001',
        hospitalId: 'HOSP-001',
        patientId: 'PAT-1',
        patientName: 'Alice Green',
        patientPhone: '555-0101',
        patientAge: 32,
        patientGender: 'Female',
        doctorId: baseSchedule.doctorId,
        doctorName: baseSchedule.doctorName || 'Dr. John Test',
        doctorSpecialization: 'Cardiologist',
        departmentId: 'DEP-101',
        departmentName: 'Cardiology',
        appointmentDate: testDate,
        appointmentTime: '09:30 AM',
        type: 'Consultation',
        status: 'Confirmed',
        reason: 'Consultation review',
        paymentStatus: 'Paid',
        fee: 150,
        createdAt: '2026-10-10',
      },
    ];

    const result = generateDoctorTimeSlots(
      baseSchedule,
      testDate,
      existingAppointments,
      [],
      undefined,
      baseSettings
    );

    // 09:30 AM is directly booked
    const slot0930 = result.slots.find((s) => s.time === '09:30 AM');
    assert.equal(slot0930?.isAvailable, false);
    assert.equal(slot0930?.status, 'booked_doctor');

    // 09:00 AM is open
    const slot0900 = result.slots.find((s) => s.time === '09:00 AM');
    assert.equal(slot0900?.isAvailable, true);

    const validationConflict = validateBookingAvailability(
      {
        doctorId: baseSchedule.doctorId,
        appointmentDate: testDate,
        appointmentTime: '09:30 AM',
      },
      baseSchedule,
      existingAppointments,
      [],
      baseSettings
    );

    assert.equal(validationConflict.isValid, false);
    assert.match(validationConflict.errorMessage || '', /already has a confirmed consultation/);
  });

  // Test 8: Chamber / Room Availability
  test('Requirement 4: Prevents OPD Chamber double-booking across different doctors', () => {
    const today = getHospitalTodayDate();
    let testDate = addDays(today, 4);
    while (!baseSchedule.workingDays.includes(getDayOfWeekName(testDate))) {
      testDate = addDays(testDate, 1);
    }

    const existingAppointments: Appointment[] = [
      {
        id: 'APT-9999',
        hospitalId: 'HOSP-001',
        patientId: 'PAT-2',
        patientName: 'Bob White',
        patientPhone: '555-0202',
        patientAge: 45,
        patientGender: 'Male',
        doctorId: 'DOC-ANOTHER-99', // Different doctor
        doctorName: 'Dr. Sarah Another',
        doctorSpecialization: 'Neurologist',
        departmentId: 'DEP-102',
        departmentName: 'Neurology',
        opdRoomId: 'ROOM-101', // Same OPD chamber
        appointmentDate: testDate,
        appointmentTime: '10:00 AM',
        type: 'Consultation',
        status: 'Confirmed',
        reason: 'Neurology review',
        paymentStatus: 'Paid',
        fee: 150,
        createdAt: '2026-10-10',
      },
    ];

    const result = generateDoctorTimeSlots(
      baseSchedule,
      testDate,
      existingAppointments,
      [],
      'ROOM-101',
      baseSettings
    );

    const slot1000 = result.slots.find((s) => s.time === '10:00 AM');
    assert.equal(slot1000?.isAvailable, false);
    assert.equal(slot1000?.status, 'occupied_room');
    assert.match(slot1000?.reason || '', /Dr\. Sarah Another/);
  });

  // Test 9: Timezone & Date Formatting Utilities
  test('Requirements 7 & 9: Timezone formatting, day calculations and date addition are robust', () => {
    assert.equal(getDayOfWeekName('2026-10-16'), 'Friday');
    assert.equal(getDayOfWeekName('2026-10-17'), 'Saturday');
    assert.equal(getDayOfWeekName('2026-10-18'), 'Sunday');
    assert.equal(getDayOfWeekName('2026-10-19'), 'Monday');

    assert.equal(formatDisplayDate('2026-10-16'), '16 Oct 2026');
    assert.equal(formatDisplayDate('2026-11-01'), '1 Nov 2026');

    assert.equal(addDays('2026-10-16', 1), '2026-10-17');
    assert.equal(addDays('2026-10-31', 1), '2026-11-01');

    assert.equal(timeToMinutes('09:00 AM'), 540);
    assert.equal(timeToMinutes('01:30 PM'), 810);
    assert.equal(minutesToTime(540), '09:00 AM');
    assert.equal(minutesToTime(810), '01:30 PM');

    const nyDate = getHospitalTodayDate('America/New_York');
    assert.match(nyDate, /^\d{4}-\d{2}-\d{2}$/);
  });

  // Test 10: findNextConsultingDate
  test('Requirements 2 & 6: Finds next available consulting date respecting schedule and leaves', () => {
    // Schedule workingDays: Mon, Wed, Fri
    // If startDate is Saturday 2026-10-17, next consulting date must be Monday 2026-10-19
    const nextDate = findNextConsultingDate(baseSchedule, '2026-10-17');
    assert.equal(nextDate, '2026-10-19');
    assert.equal(getDayOfWeekName(nextDate!), 'Monday');
  });

  // Test 11: Exact 9:34 AM Time-Based Passed Slot Rule (Requirement 1, 2, 7)
  test('Requirements 1, 2, 7: At 9:34 AM local time, 9:00 AM and 9:30 AM slots are marked Passed; future slots are not Passed', () => {
    // Create a schedule that operates Mon-Sun from 08:00 AM to 02:00 PM with 30-min slots
    const dailySchedule: DoctorSchedule = {
      ...baseSchedule,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      consultationStartTime: '08:00 AM',
      consultationEndTime: '02:00 PM',
      breaks: [],
    };

    // Reference time: 2026-10-17 09:34:00 in Asia/Kolkata (+05:30)
    // 09:34 AM IST is 04:04 AM UTC on 2026-10-17
    const mockRefDate = new Date('2026-10-17T09:34:00+05:30');
    const todayStr = getHospitalTodayDate('Asia/Kolkata', mockRefDate);
    assert.equal(todayStr, '2026-10-17');

    const minutesNow = getHospitalMinutesSinceMidnight('Asia/Kolkata', mockRefDate);
    assert.equal(minutesNow, 9 * 60 + 34); // 574 minutes

    // Settings with minAdvanceBookingHours: 0 (immediate booking permitted up to slot start)
    const zeroNoticeSettings: AppointmentSettings = {
      ...baseSettings,
      minAdvanceBookingHours: 0,
    };

    const result = generateDoctorTimeSlots(
      dailySchedule,
      todayStr,
      [],
      [],
      undefined,
      zeroNoticeSettings,
      'Asia/Kolkata',
      mockRefDate
    );

    // 08:00 AM, 08:30 AM, 09:00 AM, 09:30 AM slots must all be marked 'passed'
    const slot0900 = result.slots.find((s) => s.time === '09:00 AM');
    assert.equal(slot0900?.isAvailable, false);
    assert.equal(slot0900?.status, 'passed');
    assert.equal(slot0900?.reason, 'Slot time has already passed today');

    const slot0930 = result.slots.find((s) => s.time === '09:30 AM');
    assert.equal(slot0930?.isAvailable, false);
    assert.equal(slot0930?.status, 'passed');
    assert.equal(slot0930?.reason, 'Slot time has already passed today');

    // 10:00 AM slot start time is 10:00 AM (600 mins) > 9:34 AM (574 mins) -> NOT Passed!
    const slot1000 = result.slots.find((s) => s.time === '10:00 AM');
    assert.notEqual(slot1000?.status, 'passed');
    assert.equal(slot1000?.isAvailable, true);
    assert.equal(slot1000?.status, 'available');

    // 10:30 AM, 11:00 AM, 11:30 AM must also be available
    const slot1030 = result.slots.find((s) => s.time === '10:30 AM');
    assert.equal(slot1030?.isAvailable, true);

    // On tomorrow's date, 09:00 AM and 09:30 AM must NOT be marked passed
    const tomorrowStr = addDays(todayStr, 1);
    const tomorrowResult = generateDoctorTimeSlots(
      dailySchedule,
      tomorrowStr,
      [],
      [],
      undefined,
      zeroNoticeSettings,
      'Asia/Kolkata',
      mockRefDate
    );
    const tomorrowSlot0900 = tomorrowResult.slots.find((s) => s.time === '09:00 AM');
    assert.equal(tomorrowSlot0900?.isAvailable, true);
    assert.equal(tomorrowSlot0900?.status, 'available');
  });

  // Test 12: Clearly distinguishes all 6 statuses (Requirement 5)
  test('Requirement 5: Clearly distinguishes Passed, Doctor Booked, Chamber Occupied, Scheduled Break, Specialist Leave, and Available', () => {
    const mockRefDate = new Date('2026-10-17T09:34:00+05:30');
    const todayStr = '2026-10-17';

    const testSchedule: DoctorSchedule = {
      ...baseSchedule,
      workingDays: ['Saturday'],
      consultationStartTime: '09:00 AM',
      consultationEndTime: '02:00 PM',
      slotDurationMinutes: 30,
      opdRoomId: 'ROOM-101',
      breaks: [
        { id: 'BRK-LUNCH', name: 'Lunch Break', startTime: '12:00 PM', endTime: '12:30 PM' },
      ],
    };

    const appointments: Appointment[] = [
      // Doctor Booked at 10:30 AM
      {
        id: 'APT-DOC',
        hospitalId: 'HOSP-001',
        patientId: 'PAT-1',
        patientName: 'John Doe',
        patientPhone: '555-1111',
        patientAge: 40,
        patientGender: 'Male',
        doctorId: testSchedule.doctorId,
        doctorName: 'Dr. John Test',
        doctorSpecialization: 'Cardiologist',
        departmentId: 'DEP-101',
        departmentName: 'Cardiology',
        opdRoomId: 'ROOM-101',
        appointmentDate: todayStr,
        appointmentTime: '10:30 AM',
        type: 'Consultation',
        status: 'Confirmed',
        fee: 150,
        paymentStatus: 'Paid',
        reason: 'Review',
        createdAt: '2026-10-10',
      },
      // Chamber Occupied by another doctor at 11:00 AM
      {
        id: 'APT-CHAMBER',
        hospitalId: 'HOSP-001',
        patientId: 'PAT-2',
        patientName: 'Jane Smith',
        patientPhone: '555-2222',
        patientAge: 35,
        patientGender: 'Female',
        doctorId: 'DOC-ANOTHER',
        doctorName: 'Dr. Jane Other',
        doctorSpecialization: 'Neurologist',
        departmentId: 'DEP-102',
        departmentName: 'Neurology',
        opdRoomId: 'ROOM-101', // Same OPD chamber
        appointmentDate: todayStr,
        appointmentTime: '11:00 AM',
        type: 'Consultation',
        status: 'Confirmed',
        fee: 150,
        paymentStatus: 'Paid',
        reason: 'Consultation',
        createdAt: '2026-10-10',
      },
    ];

    const unavailabilities: DoctorUnavailablePeriod[] = [
      // Specialist Leave at 11:30 AM - 12:00 PM
      {
        id: 'UNAV-LEAVE',
        hospitalId: 'HOSP-001',
        doctorId: testSchedule.doctorId,
        type: 'Leave',
        title: 'Clinical Case Conference',
        startDate: todayStr,
        endDate: todayStr,
        startTime: '11:30 AM',
        endTime: '12:00 PM',
        isAllDay: false,
      },
    ];

    const result = generateDoctorTimeSlots(
      testSchedule,
      todayStr,
      appointments,
      unavailabilities,
      'ROOM-101',
      { ...baseSettings, minAdvanceBookingHours: 0, appointmentBufferMinutes: 0 },
      'Asia/Kolkata',
      mockRefDate
    );

    // 1. Passed (09:00 AM and 09:30 AM at 9:34 AM)
    const slot0900 = result.slots.find((s) => s.time === '09:00 AM');
    assert.equal(slot0900?.status, 'passed');

    // 2. Available (10:00 AM)
    const slot1000 = result.slots.find((s) => s.time === '10:00 AM');
    assert.equal(slot1000?.status, 'available');
    assert.equal(slot1000?.isAvailable, true);

    // 3. Doctor Booked (10:30 AM)
    const slot1030 = result.slots.find((s) => s.time === '10:30 AM');
    assert.equal(slot1030?.status, 'booked_doctor');
    assert.equal(slot1030?.isAvailable, false);

    // 4. Chamber Occupied (11:00 AM)
    const slot1100 = result.slots.find((s) => s.time === '11:00 AM');
    assert.equal(slot1100?.status, 'occupied_room');
    assert.equal(slot1100?.isAvailable, false);

    // 5. Specialist Leave (11:30 AM)
    const slot1130 = result.slots.find((s) => s.time === '11:30 AM');
    assert.equal(slot1130?.status, 'leave');
    assert.equal(slot1130?.isAvailable, false);

    // 6. Scheduled Break (12:00 PM)
    const slot1200 = result.slots.find((s) => s.time === '12:00 PM');
    assert.equal(slot1200?.status, 'break');
    assert.equal(slot1200?.isAvailable, false);
  });

  // Test 13: Stale state prevention and past-slot booking rejection (Requirement 6)
  test('Requirement 6: Strictly rejects booking attempts for passed slots, even if frontend state was stale', () => {
    const mockRefDate = new Date('2026-10-17T09:34:00+05:30');
    const todayStr = '2026-10-17';

    const dailySchedule: DoctorSchedule = {
      ...baseSchedule,
      workingDays: ['Saturday'],
      consultationStartTime: '08:00 AM',
      consultationEndTime: '02:00 PM',
      breaks: [],
    };

    // Stale booking attempt for 09:00 AM (already passed at 9:34 AM)
    const validation0900 = validateBookingAvailability(
      {
        doctorId: dailySchedule.doctorId,
        appointmentDate: todayStr,
        appointmentTime: '09:00 AM',
      },
      dailySchedule,
      [],
      [],
      { ...baseSettings, minAdvanceBookingHours: 0 },
      'Asia/Kolkata',
      mockRefDate
    );
    assert.equal(validation0900.isValid, false);
    assert.match(validation0900.errorMessage || '', /already passed/i);

    // Stale booking attempt for 09:30 AM (also passed at 9:34 AM)
    const validation0930 = validateBookingAvailability(
      {
        doctorId: dailySchedule.doctorId,
        appointmentDate: todayStr,
        appointmentTime: '09:30 AM',
      },
      dailySchedule,
      [],
      [],
      { ...baseSettings, minAdvanceBookingHours: 0 },
      'Asia/Kolkata',
      mockRefDate
    );
    assert.equal(validation0930.isValid, false);
    assert.match(validation0930.errorMessage || '', /already passed/i);

    // Future booking attempt for 10:00 AM with zero notice policy succeeds
    const validation1000 = validateBookingAvailability(
      {
        doctorId: dailySchedule.doctorId,
        appointmentDate: todayStr,
        appointmentTime: '10:00 AM',
      },
      dailySchedule,
      [],
      [],
      { ...baseSettings, minAdvanceBookingHours: 0 },
      'Asia/Kolkata',
      mockRefDate
    );
    assert.equal(validation1000.isValid, true);
  });

  // Test 14: Hospital Timezone dynamic calculation (Requirement 1, 7)
  test('Requirements 1 & 7: Dynamic timezone calculations without hardcoded times or UTC date offset errors', () => {
    // When it is 2026-10-17 00:30 UTC:
    // In Asia/Kolkata (+05:30): it is 2026-10-17 06:00 AM (360 mins)
    // In America/New_York (-04:00): it is 2026-10-16 08:30 PM (1230 mins)
    const refUtc = new Date('2026-10-17T00:30:00Z');

    const kolkataDate = getHospitalTodayDate('Asia/Kolkata', refUtc);
    const kolkataMins = getHospitalMinutesSinceMidnight('Asia/Kolkata', refUtc);
    assert.equal(kolkataDate, '2026-10-17');
    assert.equal(kolkataMins, 6 * 60);

    const nyDate = getHospitalTodayDate('America/New_York', refUtc);
    const nyMins = getHospitalMinutesSinceMidnight('America/New_York', refUtc);
    assert.equal(nyDate, '2026-10-16');
    assert.equal(nyMins, 20 * 60 + 30);
  });
});
