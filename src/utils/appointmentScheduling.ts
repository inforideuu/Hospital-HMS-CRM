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

export function getHospitalTodayDate(timeZone?: string, referenceDate: Date = new Date()): string {
  try {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(referenceDate);

    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Fallback if formatting fails
  }
  const now = referenceDate;
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getHospitalMinutesSinceMidnight(timeZone?: string, referenceDate: Date = new Date()): number {
  try {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      hourCycle: 'h23',
    }).formatToParts(referenceDate);

    let hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return hour * 60 + minute;
  } catch (e) {
    const now = referenceDate;
    return now.getHours() * 60 + now.getMinutes();
  }
}

export function getHospitalLocalTime(
  timeZone?: string,
  referenceDate: Date = new Date()
): { dateStr: string; minutesSinceMidnight: number; displayTime: string } {
  const dateStr = getHospitalTodayDate(timeZone, referenceDate);
  const minutesSinceMidnight = getHospitalMinutesSinceMidnight(timeZone, referenceDate);
  const displayTime = minutesToTime(minutesSinceMidnight);
  return { dateStr, minutesSinceMidnight, displayTime };
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
  timeZone?: string,
  referenceDate?: Date
): ScheduleDateConstraints {
  const todayDate = getHospitalTodayDate(timeZone, referenceDate);
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

  const startMins = timeToMinutes(schedule.consultationStartTime || '09:00 AM');
  const endMins = timeToMinutes(schedule.consultationEndTime || '05:00 PM');
  const isOvernight = endMins <= startMins;

  let curr = startDateStr;
  if (schedule.effectiveStartDate && curr < schedule.effectiveStartDate) {
    curr = schedule.effectiveStartDate;
  }

  // Look ahead up to 60 days for an active consulting day
  for (let i = 0; i < 60; i++) {
    if (maxDateStr && curr > maxDateStr) break;
    if (schedule.effectiveEndDate && curr > schedule.effectiveEndDate) break;

    const dayName = getDayOfWeekName(curr);
    const worksToday = schedule.workingDays.includes(dayName);
    let worksFromYesterday = false;
    if (isOvernight) {
      const prevDate = addDays(curr, -1);
      const prevDayName = getDayOfWeekName(prevDate);
      const prevWithinRange =
        (!schedule.effectiveStartDate || prevDate >= schedule.effectiveStartDate) &&
        (!schedule.effectiveEndDate || prevDate <= schedule.effectiveEndDate);
      if (prevWithinRange && schedule.workingDays.includes(prevDayName)) {
        worksFromYesterday = true;
      }
    }

    if (worksToday || worksFromYesterday) {
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
  status:
    | 'available'
    | 'passed'
    | 'booked_doctor'
    | 'occupied_room'
    | 'break'
    | 'leave'
    | 'notice_required'
    | 'outside_hours';
  reason?: string;
  appointmentId?: string;
  crossesMidnight?: boolean;
  endTimeDisplay?: string;
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
 * excluding passed slots, booking notice limits, breaks, doctor leaves, holidays, unavailable periods,
 * and already-booked doctor or room slots.
 */
export function generateDoctorTimeSlots(
  schedule: DoctorSchedule | undefined,
  dateStr: string,
  existingAppointments: Appointment[],
  doctorUnavailabilities: DoctorUnavailablePeriod[],
  selectedOPDRoomId?: string,
  settings?: AppointmentSettings,
  timeZone?: string,
  referenceDate?: Date
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

  const todayStr = getHospitalTodayDate(timeZone, referenceDate);

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

  // 5. Working days check (supporting calendar day split for overnight shifts)
  const startMins = timeToMinutes(schedule.consultationStartTime || '09:00 AM');
  const endMins = timeToMinutes(schedule.consultationEndTime || '05:00 PM');
  const isOvernight = endMins <= startMins;

  const dayName = getDayOfWeekName(dateStr);
  const worksToday = Boolean(schedule.workingDays?.includes(dayName));

  let worksFromYesterday = false;
  if (isOvernight) {
    const prevDate = addDays(dateStr, -1);
    const prevDayName = getDayOfWeekName(prevDate);
    const prevWithinRange =
      (!schedule.effectiveStartDate || prevDate >= schedule.effectiveStartDate) &&
      (!schedule.effectiveEndDate || prevDate <= schedule.effectiveEndDate);
    if (prevWithinRange && schedule.workingDays?.includes(prevDayName)) {
      worksFromYesterday = true;
    }
  }

  const isWorking = worksToday || worksFromYesterday;
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

  // 7. Generate candidate slots from schedule (continuous timeline split by slot start time)
  const slotDuration = schedule.slotDurationMinutes > 0 ? schedule.slotDurationMinutes : 30;
  const bufferMins = Math.max(0, settings?.appointmentBufferMinutes || 0);
  const minNoticeHours = Math.max(0, settings?.minAdvanceBookingHours || 0);

  // Active appointments on this date and adjacent dates for overnight shift boundary checks
  const dayAppointments = existingAppointments.filter(
    (a) => a.appointmentDate === dateStr && a.status !== 'Cancelled'
  );
  const prevDate = addDays(dateStr, -1);
  const nextDate = addDays(dateStr, 1);
  const prevDayAppointments = isOvernight
    ? existingAppointments.filter((a) => a.appointmentDate === prevDate && a.status !== 'Cancelled')
    : [];
  const nextDayAppointments = isOvernight
    ? existingAppointments.filter((a) => a.appointmentDate === nextDate && a.status !== 'Cancelled')
    : [];

  const isToday = dateStr === todayStr;
  const nowMins = isToday ? getHospitalMinutesSinceMidnight(timeZone, referenceDate) : -1;

  const candidateSlots: {
    slotStartMins: number;
    slotEndMins: number;
    crossesMidnight?: boolean;
    endTimeDisplay?: string;
  }[] = [];

  if (isOvernight) {
    const continuousEndMins = endMins + 24 * 60;
    // 1. Morning portion on dateStr from previous day's shift
    if (worksFromYesterday) {
      for (let m = startMins; m + slotDuration <= continuousEndMins; m += slotDuration) {
        if (m >= 1440) {
          const actualStart = m - 1440;
          const actualEnd = m + slotDuration - 1440;
          candidateSlots.push({
            slotStartMins: actualStart,
            slotEndMins: actualEnd,
          });
        }
      }
    }
    // 2. Evening portion on dateStr for today's shift
    if (worksToday) {
      for (let m = startMins; m + slotDuration <= continuousEndMins; m += slotDuration) {
        if (m < 1440) {
          const crosses = m + slotDuration > 1440;
          const actualEnd = m + slotDuration;
          candidateSlots.push({
            slotStartMins: m,
            slotEndMins: actualEnd,
            crossesMidnight: crosses,
            endTimeDisplay: crosses ? `${minutesToTime(actualEnd % 1440)} (+1d)` : undefined,
          });
        }
      }
    }
  } else {
    // Standard daytime shift (startMins to endMins)
    for (let m = startMins; m + slotDuration <= endMins; m += slotDuration) {
      candidateSlots.push({ slotStartMins: m, slotEndMins: m + slotDuration });
    }
  }

  const slots: GeneratedSlot[] = [];

  for (const candidate of candidateSlots) {
    const { slotStartMins, slotEndMins, crossesMidnight, endTimeDisplay } = candidate;
    const slotTime = minutesToTime(slotStartMins);

    // 1. Time-based Passed Slot Rule:
    // Mark a slot as Passed ONLY when its start time is at or before current hospital-local time on selected date.
    if (isToday && slotStartMins <= nowMins) {
      slots.push({
        time: slotTime,
        isAvailable: false,
        status: 'passed',
        reason: 'Slot time has already passed today',
        crossesMidnight,
        endTimeDisplay,
      });
      continue;
    }

    // 2. Minimum Advance Booking Notice Policy:
    // Enforce booking notice window on un-passed candidate slots
    if (minNoticeHours > 0) {
      const minNoticeMins = minNoticeHours * 60;
      let minutesNotice: number;
      if (isToday) {
        minutesNotice = slotStartMins - nowMins;
      } else {
        const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
        const [dYear, dMonth, dDay] = dateStr.split('-').map(Number);
        const daysDiff =
          (Date.UTC(dYear, dMonth - 1, dDay) - Date.UTC(tYear, tMonth - 1, tDay)) / (1000 * 60 * 60 * 24);
        const currMins = getHospitalMinutesSinceMidnight(timeZone, referenceDate);
        minutesNotice = daysDiff * 24 * 60 + (slotStartMins - currMins);
      }
      if (minutesNotice < minNoticeMins) {
        slots.push({
          time: slotTime,
          isAvailable: false,
          status: 'notice_required',
          reason: `Requires at least ${minNoticeHours} hour(s) advance booking notice`,
          crossesMidnight,
          endTimeDisplay,
        });
        continue;
      }
    }

    // 3. Check Scheduled Breaks
    let isDuringBreak = false;
    let breakName = '';
    if (schedule.breaks && schedule.breaks.length > 0) {
      for (const brk of schedule.breaks) {
        let brkStart = timeToMinutes(brk.startTime);
        let brkEnd = timeToMinutes(brk.endTime);
        if (isOvernight && slotStartMins >= startMins) {
          if (brkStart < startMins) brkStart += 24 * 60;
          if (brkEnd < startMins) brkEnd += 24 * 60;
        }
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
        crossesMidnight,
        endTimeDisplay,
      });
      continue;
    }

    // 4. Check Partial-Day Specialist Leaves
    let isPartialLeave = false;
    let leaveReason = '';
    for (const u of matchingUnavailabilities) {
      if (!u.isAllDay && u.startTime && u.endTime) {
        let uStart = timeToMinutes(u.startTime);
        let uEnd = timeToMinutes(u.endTime);
        if (isOvernight && slotStartMins >= startMins) {
          if (uStart < startMins) uStart += 24 * 60;
          if (uEnd < startMins) uEnd += 24 * 60;
        }
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
        reason: `Specialist Leave: ${leaveReason}`,
        crossesMidnight,
        endTimeDisplay,
      });
      continue;
    }

    // 5. Check Doctor conflict (already booked or buffer conflict, including cross-midnight bookings)
    const conflictingDoctorAppt =
      dayAppointments.find((a) => {
        if (a.doctorId !== schedule.doctorId) return false;
        const apptStart = timeToMinutes(a.appointmentTime);
        const apptEnd = apptStart + slotDuration;
        if (a.appointmentTime === slotTime) return true;
        const occupiedEnd = apptEnd + bufferMins;
        return Math.max(slotStartMins, apptStart) < Math.min(slotEndMins, occupiedEnd);
      }) ||
      (isOvernight && slotStartMins < endMins
        ? prevDayAppointments.find((a) => {
            if (a.doctorId !== schedule.doctorId) return false;
            const aStartContinuous = timeToMinutes(a.appointmentTime);
            if (aStartContinuous < startMins) return false;
            const aOccupiedContinuous = aStartContinuous + slotDuration + bufferMins;
            if (aOccupiedContinuous <= 1440) return false;
            const morningOccupiedEnd = aOccupiedContinuous - 1440;
            return slotStartMins < morningOccupiedEnd;
          })
        : undefined) ||
      (isOvernight && slotEndMins > 1440
        ? nextDayAppointments.find((a) => {
            if (a.doctorId !== schedule.doctorId) return false;
            const nextStartContinuous = timeToMinutes(a.appointmentTime) + 1440;
            const nextOccupiedContinuous = nextStartContinuous + slotDuration + bufferMins;
            return (
              Math.max(slotStartMins, nextStartContinuous) <
              Math.min(slotEndMins + bufferMins, nextOccupiedContinuous)
            );
          })
        : undefined);

    if (conflictingDoctorAppt) {
      const isDirectMatch = conflictingDoctorAppt.appointmentTime === slotTime;
      slots.push({
        time: slotTime,
        isAvailable: false,
        status: 'booked_doctor',
        reason: isDirectMatch
          ? `Doctor Booked: consultation for ${conflictingDoctorAppt.patientName} (${conflictingDoctorAppt.id})`
          : `Doctor Booked: post-consultation buffer required (${bufferMins} min turnaround)`,
        appointmentId: conflictingDoctorAppt.id,
        crossesMidnight,
        endTimeDisplay,
      });
      continue;
    }

    // 6. Check OPD room conflict (room occupied by any doctor in this slot or buffer)
    const targetRoomId = selectedOPDRoomId || schedule.opdRoomId;
    let conflictingRoomAppt: Appointment | undefined;
    if (targetRoomId) {
      conflictingRoomAppt =
        dayAppointments.find((a) => {
          if (a.opdRoomId !== targetRoomId) return false;
          const apptStart = timeToMinutes(a.appointmentTime);
          const apptEnd = apptStart + slotDuration;
          if (a.appointmentTime === slotTime) return true;
          const occupiedEnd = apptEnd + bufferMins;
          return Math.max(slotStartMins, apptStart) < Math.min(slotEndMins, occupiedEnd);
        }) ||
        (isOvernight && slotStartMins < endMins
          ? prevDayAppointments.find((a) => {
              if (a.opdRoomId !== targetRoomId) return false;
              const aStartContinuous = timeToMinutes(a.appointmentTime);
              if (aStartContinuous < startMins) return false;
              const aOccupiedContinuous = aStartContinuous + slotDuration + bufferMins;
              if (aOccupiedContinuous <= 1440) return false;
              const morningOccupiedEnd = aOccupiedContinuous - 1440;
              return slotStartMins < morningOccupiedEnd;
            })
          : undefined) ||
        (isOvernight && slotEndMins > 1440
          ? nextDayAppointments.find((a) => {
              if (a.opdRoomId !== targetRoomId) return false;
              const nextStartContinuous = timeToMinutes(a.appointmentTime) + 1440;
              const nextOccupiedContinuous = nextStartContinuous + slotDuration + bufferMins;
              return (
                Math.max(slotStartMins, nextStartContinuous) <
                Math.min(slotEndMins + bufferMins, nextOccupiedContinuous)
              );
            })
          : undefined);

      if (conflictingRoomAppt) {
        const isDirectMatch = conflictingRoomAppt.appointmentTime === slotTime;
        slots.push({
          time: slotTime,
          isAvailable: false,
          status: 'occupied_room',
          reason: isDirectMatch
            ? `Chamber Occupied by ${conflictingRoomAppt.doctorName}`
            : `Chamber Occupied: turnaround buffer time (${bufferMins} min)`,
          appointmentId: conflictingRoomAppt.id,
          crossesMidnight,
          endTimeDisplay,
        });
        continue;
      }
    }

    // 7. Slot is open and available
    slots.push({
      time: slotTime,
      isAvailable: true,
      status: 'available',
      crossesMidnight,
      endTimeDisplay,
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
  timeZone?: string,
  referenceDate?: Date
): { isValid: boolean; errorMessage?: string } {
  const { doctorId, opdRoomId, appointmentDate, appointmentTime, id: currentId } = appointment;

  const todayStr = getHospitalTodayDate(timeZone, referenceDate);

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

  const rawSlotMins = timeToMinutes(appointmentTime);
  const startMins = timeToMinutes(schedule.consultationStartTime || '09:00 AM');
  const endMins = timeToMinutes(schedule.consultationEndTime || '05:00 PM');
  const isOvernight = endMins <= startMins;
  const slotDuration = schedule.slotDurationMinutes || 30;
  const slotEnd = rawSlotMins + slotDuration;
  const bufferMins = Math.max(0, settings?.appointmentBufferMinutes || 0);

  const dayName = getDayOfWeekName(appointmentDate);
  const worksToday = Boolean(schedule.workingDays?.includes(dayName));

  let worksFromYesterday = false;
  if (isOvernight) {
    const prevDate = addDays(appointmentDate, -1);
    const prevDayName = getDayOfWeekName(prevDate);
    const prevWithinRange =
      (!schedule.effectiveStartDate || prevDate >= schedule.effectiveStartDate) &&
      (!schedule.effectiveEndDate || prevDate <= schedule.effectiveEndDate);
    if (prevWithinRange && schedule.workingDays?.includes(prevDayName)) {
      worksFromYesterday = true;
    }
  }

  // Check if slot falls within doctor's consultation hours
  if (isOvernight) {
    const continuousEndMins = endMins + 24 * 60;
    const isEveningSlot = rawSlotMins >= startMins && rawSlotMins < 1440;
    const isMorningSlot = rawSlotMins < endMins;

    if (isEveningSlot) {
      if (!worksToday) {
        return { isValid: false, errorMessage: `Specialist is not scheduled to work on ${dayName}s.` };
      }
      const offset = rawSlotMins - startMins;
      if (offset % slotDuration !== 0 || rawSlotMins + slotDuration > continuousEndMins) {
        return {
          isValid: false,
          errorMessage: `Selected time is outside doctor's consultation hours (${schedule.consultationStartTime} - ${schedule.consultationEndTime}).`,
        };
      }
    } else if (isMorningSlot) {
      if (!worksFromYesterday) {
        return { isValid: false, errorMessage: `Specialist was not on night duty the previous evening.` };
      }
      const continuousStart = rawSlotMins + 1440;
      const offset = continuousStart - startMins;
      if (offset < 0 || offset % slotDuration !== 0 || continuousStart + slotDuration > continuousEndMins) {
        return {
          isValid: false,
          errorMessage: `Selected time is outside doctor's consultation hours (${schedule.consultationStartTime} - ${schedule.consultationEndTime}).`,
        };
      }
    } else {
      return {
        isValid: false,
        errorMessage: `Selected time is outside doctor's consultation hours (${schedule.consultationStartTime} - ${schedule.consultationEndTime}).`,
      };
    }
  } else {
    if (!worksToday) {
      return { isValid: false, errorMessage: `Specialist is not scheduled to work on ${dayName}s.` };
    }
    if (rawSlotMins < startMins || slotEnd > endMins || (rawSlotMins - startMins) % slotDuration !== 0) {
      return {
        isValid: false,
        errorMessage: `Selected time is outside doctor's consultation hours (${schedule.consultationStartTime} - ${schedule.consultationEndTime}).`,
      };
    }
  }

  // 4. Past slot & notice window validation
  if (appointmentDate === todayStr) {
    const nowMins = getHospitalMinutesSinceMidnight(timeZone, referenceDate);
    if (rawSlotMins <= nowMins) {
      return {
        isValid: false,
        errorMessage: 'Selected consultation time slot has already passed today.',
      };
    }
    const minNoticeHours = Math.max(0, settings?.minAdvanceBookingHours || 0);
    if (minNoticeHours > 0 && rawSlotMins < nowMins + minNoticeHours * 60) {
      return {
        isValid: false,
        errorMessage: `Requires at least ${minNoticeHours} hour(s) advance booking notice.`,
      };
    }
  } else if (settings?.minAdvanceBookingHours) {
    const minNoticeHours = Math.max(0, settings.minAdvanceBookingHours);
    if (minNoticeHours > 0) {
      const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
      const [dYear, dMonth, dDay] = appointmentDate.split('-').map(Number);
      const daysDiff =
        (Date.UTC(dYear, dMonth - 1, dDay) - Date.UTC(tYear, tMonth - 1, tDay)) / (1000 * 60 * 60 * 24);
      const nowMins = getHospitalMinutesSinceMidnight(timeZone, referenceDate);
      const minutesNotice = daysDiff * 24 * 60 + (rawSlotMins - nowMins);
      if (minutesNotice < minNoticeHours * 60) {
        return {
          isValid: false,
          errorMessage: `Requires at least ${minNoticeHours} hour(s) advance booking notice.`,
        };
      }
    }
  }

  // 5. Leave check
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
      let uStart = timeToMinutes(matchingLeave.startTime);
      let uEnd = timeToMinutes(matchingLeave.endTime);
      if (isOvernight && rawSlotMins >= startMins) {
        if (uStart < startMins) uStart += 24 * 60;
        if (uEnd < startMins) uEnd += 24 * 60;
      }
      if (Math.max(rawSlotMins, uStart) < Math.min(slotEnd, uEnd)) {
        return {
          isValid: false,
          errorMessage: `Doctor has an approved unavailability (${matchingLeave.title}) during this time.`,
        };
      }
    }
  }

  // 6. Break check
  if (schedule.breaks && schedule.breaks.length > 0) {
    for (const brk of schedule.breaks) {
      let bStart = timeToMinutes(brk.startTime);
      let bEnd = timeToMinutes(brk.endTime);
      if (isOvernight && rawSlotMins >= startMins) {
        if (bStart < startMins) bStart += 24 * 60;
        if (bEnd < startMins) bEnd += 24 * 60;
      }
      if (Math.max(rawSlotMins, bStart) < Math.min(slotEnd, bEnd)) {
        return {
          isValid: false,
          errorMessage: `Selected time slot falls within the doctor's scheduled break (${brk.name || 'Break'}: ${brk.startTime} - ${brk.endTime}).`,
        };
      }
    }
  }

  // 7. Existing doctor appointment overlap + buffer check (including cross-midnight bookings)
  const prevDate = addDays(appointmentDate, -1);
  const conflictingDoctorAppt =
    existingAppointments.find((a) => {
      if (a.id === currentId || a.doctorId !== doctorId || a.appointmentDate !== appointmentDate || a.status === 'Cancelled') {
        return false;
      }
      const apptStart = timeToMinutes(a.appointmentTime);
      const apptEnd = apptStart + slotDuration;
      if (a.appointmentTime === appointmentTime) return true;
      const occupiedEnd = apptEnd + bufferMins;
      return Math.max(rawSlotMins, apptStart) < Math.min(slotEnd, occupiedEnd);
    }) ||
    (isOvernight && rawSlotMins < endMins
      ? existingAppointments.find((a) => {
          if (a.id === currentId || a.doctorId !== doctorId || a.appointmentDate !== prevDate || a.status === 'Cancelled') {
            return false;
          }
          const aStartContinuous = timeToMinutes(a.appointmentTime);
          if (aStartContinuous < startMins) return false;
          const aOccupiedContinuous = aStartContinuous + slotDuration + bufferMins;
          if (aOccupiedContinuous <= 1440) return false;
          const morningOccupiedEnd = aOccupiedContinuous - 1440;
          return rawSlotMins < morningOccupiedEnd;
        })
      : undefined);

  if (conflictingDoctorAppt) {
    return {
      isValid: false,
      errorMessage:
        conflictingDoctorAppt.appointmentTime === appointmentTime
          ? `Doctor already has a confirmed consultation at ${appointmentTime} with ${conflictingDoctorAppt.patientName}.`
          : `Doctor requires a ${bufferMins} min turnaround buffer after the ${conflictingDoctorAppt.appointmentTime} consultation.`,
    };
  }

  // 8. Existing OPD room overlap + buffer check (including cross-midnight bookings)
  const targetRoomId = opdRoomId || schedule.opdRoomId;
  if (targetRoomId) {
    const conflictingRoomAppt =
      existingAppointments.find((a) => {
        if (a.id === currentId || a.opdRoomId !== targetRoomId || a.appointmentDate !== appointmentDate || a.status === 'Cancelled') {
          return false;
        }
        const apptStart = timeToMinutes(a.appointmentTime);
        const apptEnd = apptStart + slotDuration;
        if (a.appointmentTime === appointmentTime) return true;
        const occupiedEnd = apptEnd + bufferMins;
        return Math.max(rawSlotMins, apptStart) < Math.min(slotEnd, occupiedEnd);
      }) ||
      (isOvernight && rawSlotMins < endMins
        ? existingAppointments.find((a) => {
            if (a.id === currentId || a.opdRoomId !== targetRoomId || a.appointmentDate !== prevDate || a.status === 'Cancelled') {
              return false;
            }
            const aStartContinuous = timeToMinutes(a.appointmentTime);
            if (aStartContinuous < startMins) return false;
            const aOccupiedContinuous = aStartContinuous + slotDuration + bufferMins;
            if (aOccupiedContinuous <= 1440) return false;
            const morningOccupiedEnd = aOccupiedContinuous - 1440;
            return rawSlotMins < morningOccupiedEnd;
          })
        : undefined);

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
