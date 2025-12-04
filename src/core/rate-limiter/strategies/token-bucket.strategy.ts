/**
 * Token Bucket Strategy
 *
 * How it works:
 * 1. Each identifier has a bucket with a maximum capacity (points)
 * 2. Tokens are added to the bucket at a constant rate (refill rate)
 * 3. Each request consumes tokens from the bucket
 * 4. If bucket is empty, request is rejected
 * 5. Tokens refill over time up to the maximum capacity
 *
 * Advantages:
 * - Allows bursts of traffic (good UX)
 * - Smooth rate limiting
 * - Memory efficient
 */

import type {
  IRateLimitStrategy,
  IRateLimitStorage,
  RateLimitConfig,
  RateLimitResult,
  RateLimitData,
} from "../types";

export class TokenBucketStrategy implements IRateLimitStrategy {
  private storage: IRateLimitStorage;
  private keyPrefix: string;

  constructor(storage: IRateLimitStorage, keyPrefix: string = 'tb') {
    this.storage = storage;
    this.keyPrefix = keyPrefix;
  }

  /**
   * Build storage key
   */
  private buildKey(identifier: string): string {
    return `${this.keyPrefix}:${identifier}`;
  }

  /**
   * Consume tokens (main rate limiting logic)
   */
  async consume(
    identifier: string,
    points: number = 1,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.buildKey(identifier);
    const now = Date.now()

    // Get current data
    let data = await this.storage.get(key);

    // Initialize if doesn't exist
    if (!data) {
      data = {
        tokens: config.points,
        lastRefill: now,
        consumed: 0,
      };
    }

    // Check if blocked
    if (data.blockUntil && data.blockUntil > now) {
      const retryAfterInSeconds = Math.ceil((data.blockUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        limit: config.points,
        resetAt: data.blockUntil,
        retryAfter: retryAfterInSeconds,
        consumed: data.consumed,
        isBlocked: true,
      }
    }

    // Refill token based on time elapsed
    data = this.refillTokens(data, config, now);

    // If enough tokens are not available - Reject request
    if (data.tokens < points) {
       const retryAfter = Math.ceil(
        (points - data.tokens) / this.getRefillRate(config)
      );

      // Apply block duration if configured
      if (config.blockDuration) {
        data.blockUntil = now + config.blockDuration * 1000;
      }

      // Save state
      await this.storage.set(key, data, config.duration + (config.blockDuration || 60));

      return {
        allowed: false,
        remaining: Math.floor(data.tokens),
        limit: config.points,
        resetAt: now + retryAfter * 1000,
        retryAfter,
        consumed: data.consumed,
      };
    }

    // Consume tokens
    data.tokens -= points;
    data.consumed += points;

    // Calculate reset time (when bucket will be full again)
    const tokensNeeded = config.points - data.tokens;
    const secondsToFull = tokensNeeded / this.getRefillRate(config);
    const resetAt = now + secondsToFull * 1000;

    // Save state
    await this.storage.set(key, data, config.duration);

    return {
      allowed: true,
      remaining: Math.floor(data.tokens),
      limit: config.points,
      resetAt: Math.floor(resetAt),
      retryAfter: 0,
      consumed: data.consumed,
    };
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(
    data: RateLimitData,
    config: RateLimitConfig,
    now: number
  ): RateLimitData {
    const refillRate = this.getRefillRate(config)
    const elapsed = (now - data.lastRefill) / 1000 // dividing by 1000 to make it in seconds
    const tokensToAdd = elapsed * refillRate;

    // Cap at maximum capacity
    const newTokens = Math.min(config.points, data.tokens + tokensToAdd);

    return {
      tokens: newTokens,
      lastRefill: now,
      consumed: data.consumed,
      blockUntil: data.blockUntil,
    };
  }

  /**
   * Calculate refill rate (tokens per second)
   */
  private getRefillRate(config: RateLimitConfig): number {
    return config.points / config.duration;
  }

  /**
   * Get current status without consuming tokens
   */
  async getStatus(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.buildKey(identifier);
    const now = Date.now();

    let data = await this.storage.get(key);

    if (!data) {
      return {
        allowed: true,
        remaining: config.points,
        limit: config.points,
        resetAt: now,
        retryAfter: 0,
        consumed: 0,
      };
    }

    // Check if blocked
    if (data.blockUntil && now < data.blockUntil) {
      const retryAfter = Math.ceil((data.blockUntil - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        limit: config.points,
        resetAt: data.blockUntil,
        retryAfter,
        consumed: data.consumed,
        isBlocked: true,
      };
    }

    // Refill tokens (without saving)
    data = this.refillTokens(data, config, now);

    const tokensNeeded = config.points - data.tokens;
    const secondsToFull = tokensNeeded / this.getRefillRate(config);
    const resetAt = now + secondsToFull * 1000;

    return {
      allowed: data.tokens >= 1,
      remaining: Math.floor(data.tokens),
      limit: config.points,
      resetAt: Math.floor(resetAt),
      retryAfter: 0,
      consumed: data.consumed,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = this.buildKey(identifier);
    await this.storage.delete(key);
  }

  /**
   * Check if identifier is blocked
   */
  async isBlocked(identifier: string): Promise<boolean> {
    const key = this.buildKey(identifier);
    const data = await this.storage.get(key);

    if (!data || !data.blockUntil) {
      return false;
    }

    return Date.now() < data.blockUntil;
  }

  /**
   * Block an identifier for a specific duration
   */
  async block(identifier: string, duration: number): Promise<void> {
    const key = this.buildKey(identifier);
    const now = Date.now();
    const blockUntil = now + duration * 1000;

    const data: RateLimitData = {
      tokens: 0,
      lastRefill: now,
      consumed: 0,
      blockUntil,
    };

    await this.storage.set(key, data, duration + 60); // TTL slightly longer
  }
}
