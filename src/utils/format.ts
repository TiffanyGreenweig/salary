import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('zh-cn');

const APP_TIMEZONE = 'Asia/Shanghai';
const RECORD_TIME_FORMAT = 'YYYY.MM.DD HH:mm';

export function formatCurrency(amount: string): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatRecordTime(value: string): string {
  return dayjs(value).tz(APP_TIMEZONE).format(RECORD_TIME_FORMAT);
}

export function formatDateTime(value: string): string {
  return dayjs(value).tz(APP_TIMEZONE).format(RECORD_TIME_FORMAT);
}
