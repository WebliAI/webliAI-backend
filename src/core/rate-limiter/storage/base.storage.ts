/**
 * Base Storage Class
 * Abstract class with common functionality for all storage implementations
 */

import type { IRateLimitStorage, RateLimitData } from '../types';

export abstract class BaseRateLimitStorage implements IRateLimitStorage {
  protected keyPrefix: string;
  constructor(keyPrefix: string = 'ratelimit') {
    this.keyPrefix = keyPrefix;
  }

  /**
   * Build full storage key
   */
  protected buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  /**
   * Parse stored data
   */
  protected parseData(data: string | null): RateLimitData | null {
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Serialize data for storage
   */
  protected serializeData(data: RateLimitData): string {
    return JSON.stringify(data);
  }

  // Abstract methods to be implemented by subclasses
  abstract get(key: string): Promise<RateLimitData | null>;
  abstract set(key: string, data: RateLimitData, ttl: number): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract isHealthy(): Promise<boolean>;
}
