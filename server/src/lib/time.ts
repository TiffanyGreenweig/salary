import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

export const APP_TIMEZONE = 'Asia/Shanghai';

export type RecordRange = 'week' | 'month' | 'year';

export function getRangeBounds(range: RecordRange, now: Date = new Date()): { start: string; end: string } {
  const current = dayjs(now).tz(APP_TIMEZONE);

  switch (range) {
    case 'week':
      return {
        start: current.startOf('isoWeek').utc().toISOString(),
        end: current.endOf('isoWeek').utc().toISOString(),
      };
    case 'month':
      return {
        start: current.startOf('month').utc().toISOString(),
        end: current.endOf('month').utc().toISOString(),
      };
    case 'year':
      return {
        start: current.startOf('year').utc().toISOString(),
        end: current.endOf('year').utc().toISOString(),
      };
    default:
      return {
        start: current.startOf('month').utc().toISOString(),
        end: current.endOf('month').utc().toISOString(),
      };
  }
}

export function normalizeDateInput(value: string): string {
  const normalized = dayjs(value);

  if (!normalized.isValid()) {
    throw new Error('Invalid date value');
  }

  return normalized.toDate().toISOString();
}
