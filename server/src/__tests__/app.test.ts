import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

describe('expense api', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeEach(async () => {
    app = await createApp({
      dbPath: ':memory:',
      clientDistPath: '/tmp/non-existent-client-dist',
      now: () => new Date('2026-04-17T12:00:00+08:00'),
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns seeded categories', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'food', name: '餐饮' }),
        expect.objectContaining({ id: 'transport', name: '交通' }),
      ]),
    );
  });

  it('creates, filters, updates, and deletes expense records', async () => {
    const createResponses = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/api/records',
        payload: {
          categoryId: 'food',
          amount: '26.5',
          title: '午餐',
          remark: '公司附近的面馆',
          spentAt: '2026-04-15T12:00:00+08:00',
        },
      }),
      app.inject({
        method: 'POST',
        url: '/api/records',
        payload: {
          categoryId: 'housing',
          amount: '1200',
          title: '房租分摊',
          remark: '',
          spentAt: '2026-04-02T09:00:00+08:00',
        },
      }),
      app.inject({
        method: 'POST',
        url: '/api/records',
        payload: {
          categoryId: 'food',
          amount: '88',
          title: '聚餐',
          remark: '上月结算',
          spentAt: '2026-03-10T18:30:00+08:00',
        },
      }),
    ]);

    createResponses.forEach((response) => {
      expect(response.statusCode).toBe(201);
    });

    const weeklyResponse = await app.inject({
      method: 'GET',
      url: '/api/records?range=week',
    });
    expect(weeklyResponse.statusCode).toBe(200);
    expect(weeklyResponse.json()).toHaveLength(1);
    expect(weeklyResponse.json()[0]).toMatchObject({ title: '午餐', amount: '26.50' });

    const monthlyResponse = await app.inject({
      method: 'GET',
      url: '/api/records?range=month',
    });
    expect(monthlyResponse.statusCode).toBe(200);
    expect(monthlyResponse.json()).toHaveLength(2);

    const yearlyFoodResponse = await app.inject({
      method: 'GET',
      url: '/api/records?range=year&categoryId=food',
    });
    expect(yearlyFoodResponse.statusCode).toBe(200);
    expect(yearlyFoodResponse.json()).toHaveLength(2);

    const recordId = createResponses[0].json().id as string;
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/records/${recordId}`,
      payload: {
        categoryId: 'transport',
        amount: '30',
        title: '打车',
        remark: '下雨天',
        spentAt: '2026-04-16T08:45:00+08:00',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      id: recordId,
      categoryId: 'transport',
      amount: '30.00',
      title: '打车',
      remark: '下雨天',
    });

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/records/${createResponses[1].json().id as string}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const afterDeleteResponse = await app.inject({
      method: 'GET',
      url: '/api/records?range=month',
    });
    expect(afterDeleteResponse.statusCode).toBe(200);
    expect(afterDeleteResponse.json()).toHaveLength(1);
    expect(afterDeleteResponse.json()[0]).toMatchObject({
      id: recordId,
      categoryId: 'transport',
    });
  });
});
