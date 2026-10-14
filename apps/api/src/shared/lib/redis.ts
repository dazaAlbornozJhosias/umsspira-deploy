import Redis, { RedisOptions } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('Redis');

const DEFAULT_REDIS_PORT = 6379;

function getRedisPort(value?: string): number {
  if (!value) {
    return DEFAULT_REDIS_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('REDIS_PORT debe ser un puerto válido');
  }

  return port;
}

export function getRedisOptions(): RedisOptions {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: getRedisPort(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  };
}

export function createRedisClient(): Redis {
  // REDIS_URL es la forma que entrega Render (Key Value): redis://host:puerto.
  // Si existe, manda sobre las variables sueltas de desarrollo local.
  const url = process.env.REDIS_URL;

  const client = url
    ? new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 })
    : new Redis(getRedisOptions());

  // Sin oyente, ioredis emite "Unhandled error event" y llena los logs.
  client.on('error', (error: Error) => {
    logger.error(`[redis] ${error.message}`);
  });

  return client;
}

export const redisClient = createRedisClient();