/**
 * Utility functions for Inpatient Bed Stay duration and billing calculations.
 * Calculates dynamic days between admission and discharge (or current date),
 * ensuring accurate length-of-stay (LOS) metrics and daily bed charges.
 */

export interface BedStayDetails {
  stayDays: number;
  dailyRate: number;
  totalBedCharges: number;
  nursingCharges: number;
  doctorRoundingCharges: number;
  totalEstimatedStayCharges: number;
}

/**
 * Calculates the number of calendar days a patient has occupied a bed.
 * Returns at least 1 day for same-day admissions.
 */
export function calculateStayDays(admissionDateStr: string, dischargeDateStr?: string): number {
  if (!admissionDateStr) return 1;

  const admClean = admissionDateStr.includes('T') ? admissionDateStr.split('T')[0] : admissionDateStr;
  const [ay, am, ad] = admClean.split('-').map(Number);
  if (!ay || !am || !ad) return 1;

  const disClean = dischargeDateStr
    ? (dischargeDateStr.includes('T') ? dischargeDateStr.split('T')[0] : dischargeDateStr)
    : new Date().toISOString().split('T')[0];
  const [dy, dm, dd] = disClean.split('-').map(Number);
  if (!dy || !dm || !dd) return 1;

  // UTC timestamps guarantee pure calendar-day difference with zero timezone issues
  const startUtc = Date.UTC(ay, am - 1, ad);
  const endUtc = Date.UTC(dy, dm - 1, dd);

  const diffMs = Math.max(0, endUtc - startUtc);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Same-day admission & discharge (diff = 0) is charged as 1 day
  return Math.max(1, diffDays);
}

/**
 * Formats a clean stay duration string (e.g., "1 Day", "4 Days").
 */
export function formatStayDuration(days: number): string {
  return `${days} ${days === 1 ? 'Day' : 'Days'}`;
}

/**
 * Calculates pure bed stay charges: bed per day charge * no of days.
 */
export function calculateStayCharges(
  stayDays: number,
  dailyRate: number = 1500
): {
  stayDays: number;
  dailyRate: number;
  totalBedCharges: number;
} {
  const totalBedCharges = stayDays * dailyRate;

  return {
    stayDays,
    dailyRate,
    totalBedCharges,
  };
}
