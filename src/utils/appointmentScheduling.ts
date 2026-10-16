import type {
  DoctorSchedule,
  DoctorUnavailablePeriod,
  AppointmentSettings,
  Appointment,
} from '../types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const timeOnly = cleaned.replace(/[AP]M/, '').trim();
  const parts = timeOnly.split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const paddedHours = hours12 < 10 ? `0${hours12}` : `${hours12}`;
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${paddedHours}:${paddedMins} ${period}`;
}

export function getDayOfWeekName(
  dateStr: string
): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' {
  if (!dateStr) return 'Monday';
  const [year, month, day] = dateStr.split('-').map(Number);
  // Using 12:00 UTC ensures mid-day avoids any DST or local timezone offset shift
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getUTCDay()] as any;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[month - 1]} ${year}`;
}

export function addDays(dateStr: string, daysToAdd: number): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd, 12, 0, 0));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getHospitalTimezone(
  hospital?: { timezone?: string } | null,
  settings?: { timezone?: string } | null
): string {
  if (settings?.timezone) return settings.timezone;
  if (hospital?.timezone) return hospital.timezone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
}

export function getHospitalTodayDate(timeZone?: string): string {
  try {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Fallback if formatting fails
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getHospitalMinutesSinceMidnight(timeZone?: string): number {
  try {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date());

    let hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return hour * 60 + minute;
  } catch (e) {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

export interface ScheduleDateConstraints {
  minDate: string;
  maxDate?: string;
  todayDate: string;
  isFutureSchedule: boolean;
  futureStartDate?: string;
  scheduleExpired: boolean;
  effectiveEndDate?: string;
}

export function getScheduleDateConstraints(
  schedule: DoctorSchedule | undefined,
  settings?: AppointmentSettings,
  timeZone?: string
): ScheduleDateConstraints {
  const todayDate = getHospitalTodayDate(timeZone);
  let minDate = todayDate;

  if (settings && !settings.allowSameDayBooking) {
    minDate = addDays(todayDate, 1);
  }

  let isFutureSchedule = false;
  let futureStartDate: string | undefined;
  if (schedule?.effectiveStartDate && schedule.effectiveStartDate > minDate) {
    minDate = schedule.effectiveStartDate;
    isFutureSchedule = true;
    futureStartDate = schedule.effectiveStartDate;
  }

  let maxDate: string | undefined;
  if (settings?.maxAdvanceBookingDays) {
    maxDate = addDays(todayDate, settings.maxAdvanceBookingDays);
  }

  let scheduleExpired = false;
  if (schedule?.effectiveEndDate) {
    if (schedule.effectiveEndDate < todayDate) {
      scheduleExpired = true;
    }
    if (maxDate) {
      maxDate = schedule.effectiveEndDate < maxDate ? schedule.effectiveEndDate : maxDate;
    } else {
      maxDate = schedule.effectiveEndDate;
    }
  }

  return {
    minDate,
    maxDate,
    todayDate,
    isFutureSchedule,
    futureStartDate,
    scheduleExpired,
    effectiveEndDate: schedule?.effectiveEndDate,
  };
}

export function findNextConsultingDate(
  schedule: DoctorSchedule | undefined,
  startDateStr: string,
  maxDateStr?: string,
  doctorUnavailabilities?: DoctorUnavailablePeriod[]
): string | undefined {
  if (!schedule || !schedule.workingDays || schedule.workingDays.length === 0) {
    return startDateStr;
  }

  let curr = startDateStr;
  if (schedule.effectiveStartDate && curr < schedule.effectiveStartDate) {
    curr = schedule.effectiveStartDate;
  }

  // Look ahead up to 60 days for an active consulting day
  for (let i = 0; i < 60; i++) {
    if (maxDateStr && curr > maxDateStr) break;
    if (schedule.effectiveEndDate && curr > schedule.effectiveEndDate) break;

    const dayName = getDayOfWeekName(curr);
    if (schedule.workingDays.includes(dayName)) {
      const hasFullDayLeave = doctorUnavailabilities?.some(
        (u) => u.doctorId === schedule.doctorId && u.isAllDay && curr >= u.startDate && curr <= u.endDate
      );
      if (!hasFullDayLeave) {
        return curr;
      }
    }
    curr = addDays(curr, 1);
  }

  return startDateStr;
}

export interface GeneratedSlot {
  time: string;
  isAvailable: boolean;
  status: 'available' | 'booked_doctor' | 'occupied_room' | 'break' | 'leave' | 'outside_hours';
  reason?: string;
  appointmentId?: string;
}

export interface SlotGenerationResult {
  slots: GeneratedSlot[];
  isDoctorWorkingDay: boolean;
  isOnLeave: boolean;
  leaveDetails?: DoctorUnavailablePeriod;
  outsideEffectiveRange: boolean;
  isPastDate?: boolean;
  isFutureSchedule?: boolean;
  outsideAdvanceWindow?: boolean;
  sameDayDisallowed?: boolean;
  message?: string;
}

/**
 * Generates all time slots for a given doctor on a specific date based on their schedule,
 * excluding breaks, doctor leaves, holidays, unavailable periods, and already-booked doctor or room slots.
 */
export function generateDoctorTimeSlots(
  schedule: DoctorSchedule | undefined,
  dateStr: string,
  existingAppointments: Appointment[],
  doctorUnavailabilities: DoctorUnavailablePeriod[],
  selectedOPDRoomId?: string,
  settings?: AppointmentSettings,
  timeZone?: string
): SlotGenerationResult {
  if (!schedule) {
    return {
      slots: [],
      isDoctorWorkingDay: false,
      isOnLeave: false,
      outsideEffectiveRange: false,
      message: 'No active consultation schedule found for this specialist.',
    };
  }

  const todayStr = getHospitalTodayDate(timeZone);

  // 1. Past date validation
  if (dateStr < todayStr) {
    return {
      slots: [],
      isPastDate: true,
      isDoctorWorkingDay: false,
      isOnLeave: false,
      outsideEffectiveRange: false,
      message: 'Cannot schedule appointments in the past.',
    };
  }

  // 2. Schedule effective date range checks
  if (schedule.effectiveStartDate && dateStr < schedule.effectiveStartDate) {
    return {
      slots: [],
      isFutureSchedule: true,
      outsideEffectiveRange: true,
      isDoctorWorkingDay: false,
      isOnLeave: false,
      message: `Doctor's schedule starts on ${formatDisplayDate(schedule.effectiveStartDate)}.`,
    };
  }
  if (schedule.effectiveEndDate && dateStr > schedule.effectiveEndDate) {
    return {
      slots: [],
      outsideEffectiveRange: true,
      isDoctorWorkingDay: false,
      isOnLeave: false,
      message: `Doctor's schedule expired on ${formatDisplayDate(schedule.effectiveEndDate)}.`,
    };
  }

  // 3. Hospital advance booking limits
  if (settings?.maxAdvanceBookingDays) {
    const maxDateStr = addDays(todayStr, settings.maxAdvanceBookingDays);
    if (dateStr > maxDateStr) {
      return {
        slots: [],
        outsideAdvanceWindow: true,
        isDoctorWorkingDay: false,
        isOnLeave: false,
        outsideEffectiveRange: false,
        message: `Advance bookings are limited to ${settings.maxAdvanceBookingDays} days in advance (up to ${formatDisplayDate(maxDateStr)}).`,
      };
    }
  }

  // 4. Same day booking policy
  if (settings && !settings.allowSameDayBooking && dateStr === todayStr) {
    return {
      slots: [],
      sameDayDisallowed: true,
      isDoctorWorkingDay: false,
      isOnLeave: false,
      outsideEffectiveRange: false,
      message: 'Same-day appointments are disallowed by hospital policy.',
    };
  }

  // 5. Working days check
  const dayName = getDayOfWeekName(dateStr);
  const isWorking = schedule.workingDays?.includes(dayName);
  if (!isWorking) {
    return {
      slots: [],
      isDoctorWorkingDay: false,
      isOnLeave: false,
      outsideEffectiveRange: false,
      message: `Doctor does not hold OPD consultations on ${dayName}s.`,
    };
  }

  // 6. Leave / Holiday / Unavailability check
  const matchingUnavailabilities = doctorUnavailabilities.filter((u) => {
    return u.doctorId === schedule.doctorId && dateStr >= u.startDate && dateStr <= u.endDate;
  });

  const fullDayLeave = matchingUnavailabilities.find((u) => u.isAllDay);
  if (fullDayLeave) {
    return {
      slots: [],
      isDoctorWorkingDay: true,
      isOnLeave: true,
      leaveDetails: fullDayLeave,
      outsideEffectiveRange: false,
      message: `Doctor unavailable on this date [${fullDayLeave.type}: ${fullDayLeave.title}]${
        fullDayLeave.reason ? ` - ${fullDayLeave.reason}` : ''
      }.`,
    };
  }

  // 7. Generate candidate slots from schedule
  const startMins = timeToMinutes(schedule.consultationStartTime || '09:00 AM');
  const endMins = timeToMinutes(schedule.consultationEndTime || '05:00 PM');
  const slotDuration = schedule.slotDurationMinutes > 0 ? schedule.slotDurationMinutes : 30;
  const bufferMins = Math.max(0, settings?.appointmentBufferMinutes || 0);
  const minNoticeHours = Math.max(0, settings?.minAdvanceBookingHours || 0);

  // Active appointments on this date
  const dayAppointments = existingAppointments.filter(
    (a) => a.appointmentDate === dateStr && a.status !== 'Cancelled'
  );

  const nowMins = dateStr === todayStr ? getHospitalMinutesSinceMidnight(timeZone) : -1;
  const minNoticeThresholdMins = nowMins >= 0 ? nowMins + minNoticeHours * 60 : -1;

  const slots: GeneratedSlot[] = [];

  for (let m = startMins; m + slotDuration <= endMins; m += slotDuration) {
    const slotTime = minutesToTime(m);
    const slotStartMins = m;
    const slotEndMins = m + slotDuration;

    // Notice window and past-slot check for today
    if (minNoticeThresholdMins >= 0 && slotStartMins < minNoticeThresholdMins) {
      slots.push({
        time: slotTime,
        isAvailable: false,
        status: 'outside_hours',
        reason:
          slotStartMins <= nowMins
            ? 'Slot time has already passed today'
            : `Requires at least ${minNoticeHours} hour(s) advance booking notice`,
      });
      continue;
    }

    // Check breaks
    let isDuringBreak = false;
    let breakName = '';
    if (schedule.breaks && schedule.breaks.length > 0) {
      for (const brk of schedule.breaks) {
        const brkStart = timeToMinutes(brk.startTime);
        const brkEnd = timeToMinutes(brk.endTime);
        if (Math.max(slotStartMins, brkStart) < Math.min(slotEndMins, brkEnd)) {
          isDuringBreak = true;
          breakName = brk.name || 'Scheduled Break';
          break;
        }
      }
    }

    if (isDuringBreak) {
      slots.push({
        time: slotTime,
        isAvailable: false,
        status: 'break',
        reason: `Break: ${breakName}`,
      });
      continue;
    }

    // Check partial-day leaves
    let isPartialLeave = false;
    let leaveReason = '';
    for (const u of matchingUnavailabilities) {
      if (!u.isAllDay && u.startTime && u.endTime) {
        const uStart = timeToMinutes(u.startTime);
        const uEnd = timeToMinutes(u.endTime);
        if (Math.max(slotStartMins, uStart) < Math.min(slotEndMins, uEnd)) {
          isPartialLeave = true;
          leaveReason = `${u.type}: ${u.title}`;
          break;
        }
      }
    }

    if (isPartialLeave) {
      slots.push({
        time: slotTime,
        isAvailable: false,
        status: 'leave',
        reason: `Unavailable: ${leaveReason}`,
      });
      continue;
    }

    // Check doctor conflict (already booked or buffer conflict)
    const conflictingDoctorAppt = dayAppointments.find((a) => {
      if (a.doctorId !== schedule.doctorId) return false;
      const apptStart = timeToMinutes(a.appointmentTime);
      const apptEnd = apptStart + slotDuration;
      if (a.appointmentTime === slotTime) return true;
      const occupiedEnd = apptEnd + bufferMins;
      if (Math.max(slotStartMins, apptStart) < Math.min(slotEndMins, occupiedEnd)) return true;
      return false;
    });

    if (conflictingDoctorAppt) {
      const isDirectMatch = conflictingDoctorAppt.appointmentTime === slotTime;
      slots.push({
        time: slotTime,
        isAvailable: false,
        status: 'booked_doctor',
        reason: isDirectMatch
          ? `Booked for ${conflictingDoctorAppt.patientName} (${conflictingDoctorAppt.id})`
          : `Post-consultation buffer required (${bufferMins} min turnaround)`,
        appointmentId: conflictingDoctorAppt.id,
      });
      continue;
    }

    // Check OPD room conflict (room occupied by any doctor in this slot or buffer)
    const targetRoomId = selectedOPDRoomId || schedule.opdRoomId;
    if (targetRoomId) {
      const conflictingRoomAppt = dayAppointments.find((a) => {
        if (a.opdRoomId !== targetRoomId) return false;
        const apptStart = timeToMinutes(a.appointmentTime);
        const apptEnd = apptStart + slotDuration;
        if (a.appointmentTime === slotTime) return true;
        const occupiedEnd = apptEnd + bufferMins;
        if (Math.max(slotStartMins, apptStart) < Math.min(slotEndMins, occupiedEnd)) return true;
        return false;
      });

      if (conflictingRoomAppt) {
        const isDirectMatch = conflictingRoomAppt.appointmentTime === slotTime;
        slots.push({
          time: slotTime,
          isAvailable: false,
          status: 'occupied_room',
          reason: isDirectMatch
            ? `OPD Chamber occupied by ${conflictingRoomAppt.doctorName}`
            : `OPD Chamber turnaround buffer time (${bufferMins} min)`,
          appointmentId: conflictingRoomAppt.id,
        });
        continue;
      }
    }

    // Slot is open and available
    slots.push({
      time: slotTime,
      isAvailable: true,
      status: 'available',
    });
  }

  return {
    slots,
    isDoctorWorkingDay: true,
    isOnLeave: false,
    outsideEffectiveRange: false,
  };
}

/**
 * Validates whether an appointment can be safely booked without conflicts.
 */
export function validateBookingAvailability(
  appointment: {
    doctorId: string;
    opdRoomId?: string;
    appointmentDate: string;
    appointmentTime: string;
    id?: string;
  },
  schedule: DoctorSchedule | undefined,
  existingAppointments: Appointment[],
  doctorUnavailabilities: DoctorUnavailablePeriod[],
  settings?: AppointmentSettings,
  timeZone?: string
): { isValid: boolean; errorMessage?: string } {
  const { doctorId, opdRoomId, appointmentDate, appointmentTime, id: currentId } = appointment;

  const todayStr = getHospitalTodayDate(timeZone);

  // 1. Past date check
  if (appointmentDate < todayStr) {
    return { isValid: false, errorMessage: 'Cannot schedule appointments in the past.' };
  }

  // 2. Settings advance window & same-day validation
  if (settings) {
    if (!settings.allowSameDayBooking && appointmentDate === todayStr) {
      return { isValid: false, errorMessage: 'Same-day appointments are disallowed by hospital policy.' };
    }
    if (settings.maxAdvanceBookingDays) {
      const maxDateStr = addDays(todayStr, settings.maxAdvanceBookingDays);
      if (appointmentDate > maxDateStr) {
        return {
          isValid: false,
          errorMessage: `Advance bookings are limited to ${settings.maxAdvanceBookingDays} days in advance (up to ${formatDisplayDate(maxDateStr)}).`,
        };
      }
    }
  }

  // 3. Doctor schedule check
  if (!schedule) {
    return { isValid: false, errorMessage: 'Selected specialist does not have a configured schedule.' };
  }

  // Effective date check
  if (schedule.effectiveStartDate && appointmentDate < schedule.effectiveStartDate) {
    return {
      isValid: false,
      errorMessage: `Doctor's schedule starts on ${formatDisplayDate(schedule.effectiveStartDate)}.`,
    };
  }
  if (schedule.effectiveEndDate && appointmentDate > schedule.effectiveEndDate) {
    return {
      isValid: false,
      errorMessage: `Doctor's schedule expired on ${formatDisplayDate(schedule.effectiveEndDate)}.`,
    };
  }

  const dayName = getDayOfWeekName(appointmentDate);
  if (!schedule.workingDays?.includes(dayName)) {
    return { isValid: false, errorMessage: `Specialist is not scheduled to work on ${dayName}s.` };
  }

  const slotMins = timeToMinutes(appointmentTime);
  const slotDuration = schedule.slotDurationMinutes || 30;
  const slotEnd = slotMins + slotDuration;
  const bufferMins = Math.max(0, settings?.appointmentBufferMinutes || 0);

  // Notice window for same-day bookings
  if (appointmentDate === todayStr && settings?.minAdvanceBookingHours) {
    const nowMins = getHospitalMinutesSinceMidnight(timeZone);
    const minNoticeLimit = nowMins + settings.minAdvanceBookingHours * 60;
    if (slotMins < minNoticeLimit) {
      return {
        isValid: false,
        errorMessage:
          slotMins <= nowMins
            ? 'Selected time slot has already passed today.'
            : `Requires at least ${settings.minAdvanceBookingHours} hour(s) advance booking notice.`,
      };
    }
  }

  // 4. Leave check
  const matchingLeave = doctorUnavailabilities.find(
    (u) =>
      u.doctorId === doctorId &&
      appointmentDate >= u.startDate &&
      appointmentDate <= u.endDate
  );
  if (matchingLeave) {
    if (matchingLeave.isAllDay) {
      return {
        isValid: false,
        errorMessage: `Doctor is on ${matchingLeave.type} (${matchingLeave.title}) on this date.`,
      };
    } else if (matchingLeave.startTime && matchingLeave.endTime) {
      const uStart = timeToMinutes(matchingLeave.startTime);
      const uEnd = timeToMinutes(matchingLeave.endTime);
      if (Math.max(slotMins, uStart) < Math.min(slotEnd, uEnd)) {
        return {
          isValid: false,
          errorMessage: `Doctor is unavailable during this time (${matchingLeave.title}).`,
        };
      }
    }
  }

  // 5. Break check
  if (schedule.breaks && schedule.breaks.length > 0) {
    for (const brk of schedule.breaks) {
      const bStart = timeToMinutes(brk.startTime);
      const bEnd = timeToMinutes(brk.endTime);
      if (Math.max(slotMins, bStart) < Math.min(slotEnd, bEnd)) {
        return {
          isValid: false,
          errorMessage: `Selected time slot falls within the doctor's scheduled break (${brk.name}).`,
        };
      }
    }
  }

  // 6. Existing doctor appointment overlap + buffer check
  const conflictingDoctorAppt = existingAppointments.find((a) => {
    if (a.id === currentId || a.doctorId !== doctorId || a.appointmentDate !== appointmentDate || a.status === 'Cancelled') {
      return false;
    }
    const apptStart = timeToMinutes(a.appointmentTime);
    const apptEnd = apptStart + slotDuration;
    if (a.appointmentTime === appointmentTime) return true;
    const occupiedEnd = apptEnd + bufferMins;
    if (Math.max(slotMins, apptStart) < Math.min(slotEnd, occupiedEnd)) return true;
    return false;
  });

  if (conflictingDoctorAppt) {
    return {
      isValid: false,
      errorMessage:
        conflictingDoctorAppt.appointmentTime === appointmentTime
          ? `Doctor already has a confirmed consultation at ${appointmentTime} with ${conflictingDoctorAppt.patientName}.`
          : `Doctor requires a ${bufferMins} min turnaround buffer after the ${conflictingDoctorAppt.appointmentTime} consultation.`,
    };
  }

  // 7. Existing OPD room overlap + buffer check
  const targetRoomId = opdRoomId || schedule.opdRoomId;
  if (targetRoomId) {
    const conflictingRoomAppt = existingAppointments.find((a) => {
      if (a.id === currentId || a.opdRoomId !== targetRoomId || a.appointmentDate !== appointmentDate || a.status === 'Cancelled') {
        return false;
      }
      const apptStart = timeToMinutes(a.appointmentTime);
      const apptEnd = apptStart + slotDuration;
      if (a.appointmentTime === appointmentTime) return true;
      const occupiedEnd = apptEnd + bufferMins;
      if (Math.max(slotMins, apptStart) < Math.min(slotEnd, occupiedEnd)) return true;
      return false;
    });

    if (conflictingRoomAppt) {
      return {
        isValid: false,
        errorMessage:
          conflictingRoomAppt.appointmentTime === appointmentTime
            ? `Selected OPD Chamber is already booked at ${appointmentTime} for ${conflictingRoomAppt.doctorName}.`
            : `OPD Chamber requires a ${bufferMins} min turnaround buffer after the ${conflictingRoomAppt.appointmentTime} consultation.`,
      };
    }
  }

  return { isValid: true };
}
