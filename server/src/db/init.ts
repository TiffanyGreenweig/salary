import { sql } from 'drizzle-orm';

import type { DatabaseContext } from './client.js';
import { categoriesTable } from './schema.js';

const seededCategories = [
  { id: 'food', name: '餐饮', color: '#ff7a59', sortOrder: 1 },
  { id: 'transport', name: '交通', color: '#2c9cff', sortOrder: 2 },
  { id: 'shopping', name: '购物', color: '#ff5d8f', sortOrder: 3 },
  { id: 'housing', name: '住房', color: '#6cc24a', sortOrder: 4 },
  { id: 'entertainment', name: '娱乐', color: '#9b6bff', sortOrder: 5 },
  { id: 'medical', name: '医疗', color: '#12b886', sortOrder: 6 },
  { id: 'study', name: '学习', color: '#f59f00', sortOrder: 7 },
  { id: 'other', name: '其他', color: '#667085', sortOrder: 8 },
];

export function initializeDatabase({ sqlite, db }: DatabaseContext): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expense_records (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT NOT NULL,
      amount TEXT NOT NULL,
      title TEXT NOT NULL,
      remark TEXT NOT NULL DEFAULT '',
      spent_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE cascade ON DELETE restrict
    );
  `);

  const categoryCount = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(categoriesTable)
    .get();

  if ((categoryCount?.count ?? 0) > 0) {
    return;
  }

  const createdAt = new Date().toISOString();
  db.insert(categoriesTable)
    .values(
      seededCategories.map((category) => ({
        ...category,
        createdAt,
      })),
    )
    .run();
}
