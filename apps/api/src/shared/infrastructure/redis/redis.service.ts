import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Environment } from '../../../config/environment';
import { DependencyUnavailableError } from '../../errors/dependency-unavailable-error';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private connecting: Promise<void> | undefined;

  constructor(config: ConfigService<Environment, true>) {
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      lazyConnect: true,
      connectTimeout: 1500,
      commandTimeout: 2000,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    this.client.on('error', () => this.logger.warn('Redis no está disponible'));
  }

  async evaluate(script: string, key: string, args: number[]): Promise<unknown> {
    try {
      if (this.client.status !== 'ready') {
        this.connecting ??= this.client.connect().finally(() => {
          this.connecting = undefined;
        });
        await this.connecting;
      }
      return await this.client.eval(script, 1, key, ...args);
    } catch {
      throw new DependencyUnavailableError();
    }
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
