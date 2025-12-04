/**
 * In-Memory Storage
 * Fast, but not distributed. Doing it for local development.
 */

import { BaseRateLimitStorage } from "./base.storage";
import type { RateLimitData } from "../types";

interface CacheEntry {
  data: RateLimitData;
  expiresAt: number;
}

export class MemoryRateLimitStorage extends BaseRateLimitStorage {
  private cache: Map<string, CacheEntry>;
  private cleanupInterval: Timer | null = null;

  constructor(keyPrefix?: string) {
    super(keyPrefix);
    this.cache = new Map();
    this.startCleanupInterval();
  }

  /**
   * Get data from memory
   */
  async get(key: string): Promise<RateLimitData | null> {
    const fullKey = this.buildKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in memory with TTL
   */
  async set(key: string, data: RateLimitData, ttlInSeconds: number): Promise<void> {
    const fullKey = this.buildKey(key);
    const expiresAt = Date.now() + ttlInSeconds * 1000;

    this.cache.set(fullKey, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete data from memory
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    this.cache.delete(fullKey);
  }

  /**
   * Check if storage is healthy
   */
  async isHealthy(): Promise<boolean> {
    return true;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear all expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Start automatic cleanup
   */
  private startCleanupInterval(): void {
    // Run cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}
