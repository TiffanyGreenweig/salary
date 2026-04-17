import { asc } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import { categoriesTable } from '../db/schema.js';
import type * as schema from '../db/schema.js';

export function registerCategoryRoutes(
  app: FastifyInstance,
  db: BetterSQLite3Database<typeof schema>,
): void {
  app.get('/api/categories', async () => {
    return db
      .select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name))
      .all();
  });
}
