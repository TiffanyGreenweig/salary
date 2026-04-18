import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export function formatCurrency(amount: string): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatRecordTime(value: string): string {
  const target = dayjs(value);
  const now = dayjs();

  if (target.isSame(now, 'day')) {
    return target.format('HH:mm');
  }

  if (target.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天';
  }

  if (target.isSame(now.subtract(2, 'day'), 'day')) {
    return '前天';
  }

  return target.format('MM-DD');
}

export function formatDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}
