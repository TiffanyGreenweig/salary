import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import type { ExpenseRecord, RecordFilter } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

const APP_TIMEZONE = 'Asia/Shanghai';

export function matchesRecordFilter(
  record: ExpenseRecord,
  filter: RecordFilter,
  now: Date = new Date(),
): boolean {
  if (filter.categoryId && record.categoryId !== filter.categoryId) {
    return false;
  }

  const current = dayjs(now).tz(APP_TIMEZONE);
  const spentAt = dayjs(record.spentAt).tz(APP_TIMEZONE);

  switch (filter.range) {
    case 'week':
      return spentAt.isAfter(current.startOf('isoWeek').subtract(1, 'millisecond')) &&
        spentAt.isBefore(current.endOf('isoWeek').add(1, 'millisecond'));
    case 'month':
      return spentAt.isAfter(current.startOf('month').subtract(1, 'millisecond')) &&
        spentAt.isBefore(current.endOf('month').add(1, 'millisecond'));
    case 'year':
      return spentAt.isAfter(current.startOf('year').subtract(1, 'millisecond')) &&
        spentAt.isBefore(current.endOf('year').add(1, 'millisecond'));
    default:
      return true;
  }
}

export function sortRecords(records: ExpenseRecord[]): ExpenseRecord[] {
  return [...records].sort((left, right) => {
    const spentDiff = dayjs(right.spentAt).valueOf() - dayjs(left.spentAt).valueOf();

    if (spentDiff !== 0) {
      return spentDiff;
    }

    return dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf();
  });
}
