import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { categoriesTable, expenseRecordsTable } from '../db/schema.js';
import { getRangeBounds, normalizeDateInput, type RecordRange } from '../lib/time.js';
import type * as schema from '../db/schema.js';

const rangeQuerySchema = z.object({
  range: z.enum(['week', 'month', 'year']).default('month'),
  categoryId: z.string().trim().optional(),
});

const recordPayloadSchema = z.object({
  categoryId: z.string().trim().min(1, '请选择消费分类'),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, '金额格式不正确')
    .refine((value) => Number(value) > 0, '金额必须大于 0'),
  spentAt: z.string().trim().min(1, '请选择消费时间'),
  title: z.string().trim().min(1, '请输入消费标题').max(30, '标题最多 30 个字符'),
  remark: z.string().trim().max(200, '备注最多 200 个字符').optional().default(''),
});

export interface RecordRouteOptions {
  now?: () => Date;
}

async function ensureCategoryExists(
  db: BetterSQLite3Database<typeof schema>,
  categoryId: string,
): Promise<void> {
  const category = db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, categoryId))
    .get();

  if (!category) {
    throw new Error('Category not found');
  }
}

export function registerRecordRoutes(
  app: FastifyInstance,
  db: BetterSQLite3Database<typeof schema>,
  options: RecordRouteOptions = {},
): void {
  const getNow = options.now ?? (() => new Date());

  app.get('/api/records', async (request, reply) => {
    const parseResult = rangeQuerySchema.safeParse(request.query);

    if (!parseResult.success) {
      return reply.code(400).send({
        message: 'Invalid query',
        issues: parseResult.error.flatten(),
      });
    }

    const { range, categoryId } = parseResult.data;
    const { start, end } = getRangeBounds(range, getNow());
    const conditions = [gte(expenseRecordsTable.spentAt, start), lte(expenseRecordsTable.spentAt, end)];

    if (categoryId) {
      conditions.push(eq(expenseRecordsTable.categoryId, categoryId));
    }

    const records = db
      .select()
      .from(expenseRecordsTable)
      .where(and(...conditions))
      .orderBy(desc(expenseRecordsTable.spentAt), desc(expenseRecordsTable.createdAt))
      .all();

    return records;
  });

  app.post('/api/records', async (request, reply) => {
    const parseResult = recordPayloadSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({
        message: 'Invalid payload',
        issues: parseResult.error.flatten(),
      });
    }

    const payload = parseResult.data;

    try {
      await ensureCategoryExists(db, payload.categoryId);
    } catch {
      return reply.code(400).send({ message: '消费分类不存在' });
    }

    const now = getNow().toISOString();
    const record = {
      id: crypto.randomUUID(),
      categoryId: payload.categoryId,
      amount: Number(payload.amount).toFixed(2),
      title: payload.title,
      remark: payload.remark ?? '',
      spentAt: normalizeDateInput(payload.spentAt),
      createdAt: now,
      updatedAt: now,
    };

    db.insert(expenseRecordsTable).values(record).run();

    return reply.code(201).send(record);
  });

  app.patch('/api/records/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const paramResult = paramsSchema.safeParse(request.params);
    const payloadResult = recordPayloadSchema.safeParse(request.body);

    if (!paramResult.success || !payloadResult.success) {
      return reply.code(400).send({
        message: 'Invalid payload',
        issues: {
          params: paramResult.success ? undefined : paramResult.error.flatten(),
          body: payloadResult.success ? undefined : payloadResult.error.flatten(),
        },
      });
    }

    const recordId = paramResult.data.id;
    const payload = payloadResult.data;
    const existingRecord = db
      .select({ id: expenseRecordsTable.id })
      .from(expenseRecordsTable)
      .where(eq(expenseRecordsTable.id, recordId))
      .get();

    if (!existingRecord) {
      return reply.code(404).send({ message: '消费记录不存在' });
    }

    try {
      await ensureCategoryExists(db, payload.categoryId);
    } catch {
      return reply.code(400).send({ message: '消费分类不存在' });
    }

    const updatedRecord = {
      categoryId: payload.categoryId,
      amount: Number(payload.amount).toFixed(2),
      title: payload.title,
      remark: payload.remark ?? '',
      spentAt: normalizeDateInput(payload.spentAt),
      updatedAt: getNow().toISOString(),
    };

    db.update(expenseRecordsTable).set(updatedRecord).where(eq(expenseRecordsTable.id, recordId)).run();

    return reply.send({
      id: recordId,
      ...updatedRecord,
    });
  });

  app.delete('/api/records/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const paramResult = paramsSchema.safeParse(request.params);

    if (!paramResult.success) {
      return reply.code(400).send({
        message: 'Invalid params',
        issues: paramResult.error.flatten(),
      });
    }

    const recordId = paramResult.data.id;
    const existingRecord = db
      .select({ id: expenseRecordsTable.id })
      .from(expenseRecordsTable)
      .where(eq(expenseRecordsTable.id, recordId))
      .get();

    if (!existingRecord) {
      return reply.code(404).send({ message: '消费记录不存在' });
    }

    db.delete(expenseRecordsTable).where(eq(expenseRecordsTable.id, recordId)).run();

    return reply.code(204).send();
  });
}
