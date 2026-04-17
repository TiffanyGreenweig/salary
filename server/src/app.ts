import { fileURLToPath } from 'node:url';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createDatabase } from './db/client.js';
import { initializeDatabase } from './db/init.js';
import { registerCategoryRoutes } from './routes/categories.js';
import { registerRecordRoutes, type RecordRouteOptions } from './routes/records.js';

export interface CreateAppOptions extends RecordRouteOptions {
  dbPath?: string;
  clientDistPath?: string;
}

const serverDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(serverDir, '..', '..');

export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  const databasePath = options.dbPath ?? resolve(repoRoot, 'server/data/salary.db');
  const database = createDatabase(databasePath);
  initializeDatabase(database);

  app.addHook('onClose', async () => {
    database.sqlite.close();
  });

  await app.register(cors, {
    origin: true,
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  registerCategoryRoutes(app, database.db);
  registerRecordRoutes(app, database.db, { now: options.now });

  const clientDistPath = options.clientDistPath ?? resolve(repoRoot, 'client/dist');

  if (existsSync(clientDistPath)) {
    await app.register(fastifyStatic, {
      root: clientDistPath,
      prefix: '/',
    });
  }

  return app;
}
