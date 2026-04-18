import dayjs from 'dayjs';

import type { ApiClient } from '../api/client';
import { RootStore } from '../store/RootStore';
import type { Category, ExpenseRecord } from '../types';

const categories: Category[] = [
  { id: 'food', name: '餐饮', color: '#ff7a59', sortOrder: 1 },
  { id: 'transport', name: '交通', color: '#2c9cff', sortOrder: 2 },
];

function buildRecord(overrides: Partial<ExpenseRecord> = {}): ExpenseRecord {
  const now = dayjs().toISOString();

  return {
    id: crypto.randomUUID(),
    categoryId: 'food',
    amount: '42.00',
    title: '午餐',
    remark: '工作餐',
    spentAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('RecordStore submit flow', () => {
  it('keeps a newly created record visible even if the follow-up refresh fails', async () => {
    const createdRecord = buildRecord();
    let getRecordsCalls = 0;

    const api: ApiClient = {
      async getCategories() {
        return categories;
      },
      async getRecords() {
        getRecordsCalls += 1;

        if (getRecordsCalls === 1) {
          return [];
        }

        throw new Error('列表刷新失败');
      },
      async createRecord() {
        return createdRecord;
      },
      async updateRecord() {
        return createdRecord;
      },
      async deleteRecord() {
        return undefined;
      },
    };

    const store = new RootStore(api);
    await store.initialize();

    await store.records.submitRecord({
      categoryId: createdRecord.categoryId,
      amount: createdRecord.amount,
      title: createdRecord.title,
      remark: createdRecord.remark,
      spentAt: createdRecord.spentAt,
    });

    expect(store.records.records).toEqual([createdRecord]);
    expect(store.records.error).toBe('列表刷新失败');
    expect(store.records.sheetVisible).toBe(false);
  });
});
