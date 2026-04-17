import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categoriesTable = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: text('created_at').notNull(),
});

export const expenseRecordsTable = sqliteTable('expense_records', {
  id: text('id').primaryKey(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categoriesTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  amount: text('amount').notNull(),
  title: text('title').notNull(),
  remark: text('remark').notNull().default(''),
  spentAt: text('spent_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type Category = InferSelectModel<typeof categoriesTable>;
export type ExpenseRecord = InferSelectModel<typeof expenseRecordsTable>;
export type NewExpenseRecord = InferInsertModel<typeof expenseRecordsTable>;
