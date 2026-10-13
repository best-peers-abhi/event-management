import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.configService.get<string>('REDIS_PORT', '6379'));

    this.logger.log(`[REDIS] Connecting to Redis at ${host}:${port}...`);

    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('[REDIS] ✅ Successfully connected to Redis.');
    });

    this.client.on('error', (err) => {
      this.logger.warn(`[REDIS] ⚠️ Redis connection error: ${err.message}`);
    });

    try {
      await this.client.connect();
    } catch (err: any) {
      this.logger.warn(`[REDIS] Initial connection attempt failed: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('[REDIS] Connection cleanly closed.');
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err: any) {
      this.logger.error(`[REDIS] Failed to GET key "${key}": ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: string | number, ttlSeconds?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'number' ? value.toString() : value;
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (err: any) {
      this.logger.error(`[REDIS] Failed to SET key "${key}": ${err.message}`);
    }
  }

  async del(key: string | string[]): Promise<number> {
    try {
      if (Array.isArray(key)) {
        if (key.length === 0) return 0;
        return await this.client.del(...key);
      }
      return await this.client.del(key);
    } catch (err: any) {
      this.logger.error(`[REDIS] Failed to DEL key(s): ${err.message}`);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err: any) {
      this.logger.error(`[REDIS] Failed to check EXISTS for "${key}": ${err.message}`);
      return false;
    }
  }
}
