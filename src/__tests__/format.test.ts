import { formatDateTime, formatRecordTime } from '../utils/format';

describe('time formatting', () => {
  it('formats record times as an absolute Shanghai datetime', () => {
    expect(formatRecordTime('2025-01-12T04:15:00.000Z')).toBe('2025.01.12 12:15');
  });

  it('formats picker datetimes with the same absolute pattern', () => {
    expect(formatDateTime('2025-01-12T04:15:00.000Z')).toBe('2025.01.12 12:15');
  });
});
