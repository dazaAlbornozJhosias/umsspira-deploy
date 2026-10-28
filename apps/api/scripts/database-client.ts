import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

export function createDatabaseClient(): PrismaClient {
  config({ path: resolve(__dirname, '../.env'), quiet: true });
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta configurar la conexión a PostgreSQL');
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 1, connectionTimeoutMillis: 5000 }),
  });
}
