/**
 * Rate Limiter
 * Main rate limiter class that orchestrates storage and strategy
 *
 * Security Features:
 * - Multiple identifier support (IP, User ID, API Key)
 * - Automatic blocking on limit exceeded
 * - Distributed rate limiting (via storage)
 * - Bypass mechanism for trusted sources
 * - Audit logging
 */

import type {
  RateLimiterOptions,
  RateLimitConfig,
  RateLimitResult,
  IRateLimitStorage,
  IRateLimitStrategy,
} from "./types";
import { TokenBucketStrategy } from "./strategies/token-bucket.strategy";
import { MemoryRateLimitStorage } from "./storage/memory.storage";
import { getLogger, ILogger } from "../logger";
import { RequestContext } from "../../../hono";

export class RateLimiter {
  private ctx: RequestContext;
  private storage: IRateLimitStorage;
  private strategy: IRateLimitStrategy;
  private defaultConfig: RateLimitConfig;
  private keyGenerator: (identifier: string, namespace?: string) => string;
  private onError?: (error: Error) => void;
  private bypassList: Set<string> = new Set();
  private logger: ILogger;

  constructor(ctx: RequestContext, options: RateLimiterOptions) {
    this.ctx = ctx;
    this.storage = options.storage;
    this.strategy = options.strategy || new TokenBucketStrategy(this.storage);
    this.defaultConfig = options.defaultConfig || {
      points: 5,
      duration: 60,
      keyPrefix: "rl",
    };
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    this.onError = options.onError;
    this.logger = getLogger();
  }

  /**
   * Default key generator
   */
  private defaultKeyGenerator(identifier: string, namespace?: string): string {
    return namespace ? `${namespace}:${identifier}` : identifier;
  }

  /**
   * Sanitize identifier to prevent key injection attacks
   */
  private sanitizeIdentifier(identifier: string): string {
    // Remove any characters that could be used for key injection
    return identifier.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  /**
   * Check if identifier should bypass rate limiting
   */
  private shouldBypass(identifier: string): boolean {
    return this.bypassList.has(identifier);
  }

  /**
   * Add identifier to bypass list (e.g., for trusted IPs, internal services)
   */
  addBypass(identifier: string): void {
    this.bypassList.add(identifier);
  }

  /**
   * Remove identifier from bypass list
   */
  removeBypass(identifier: string): void {
    this.bypassList.delete(identifier);
  }

  /**
   * Main rate limiting method
   *
   * @param identifier - User ID, IP address, API key, etc.
   * @param points - Number of points to consume (default: 1)
   * @param config - Optional config override
   * @param namespace - Optional namespace for isolation
   */
  async consume(
    identifier: string,
    points: number = 1,
    config?: Partial<RateLimitConfig>,
    namespace?: string
  ): Promise<RateLimitResult> {
    try {
      // Sanitize identifier
      const safeIdentifier = this.sanitizeIdentifier(identifier);
      // Check bypass list
      if (this.shouldBypass(safeIdentifier)) {
        return {
          allowed: true,
          remaining: 999999,
          limit: 999999,
          resetAt: Date.now() + 999999,
          retryAfter: 0,
          consumed: 0,
        };
      }

      // Build key
      const key = this.keyGenerator(safeIdentifier, namespace);

      // Merge config
      const finalConfig: RateLimitConfig = {
        ...this.defaultConfig,
        ...config,
      };

      // Consume via strategy
      const result = await this.strategy.consume(key, points, finalConfig);

      return result;
    } catch (error) {
      this.logger.errorWithContext(this.ctx, `RateLimter.consume error: ${error}`);
      // Handle error gracefully
      if (this.onError) {
        this.onError(error as Error);
      }

      // Fail open (allow request) on error to avoid blocking all traffic
      return {
        allowed: true,
        remaining: this.defaultConfig.points,
        limit: this.defaultConfig.points,
        resetAt: Date.now() + this.defaultConfig.duration * 1000,
        retryAfter: 0,
        consumed: 0,
      };
    }
  }

  /**
   * Get current rate limit status without consuming
   */
  async getStatus(
    identifier: string,
    config?: Partial<RateLimitConfig>,
    namespace?: string
  ): Promise<RateLimitResult> {
    try {
      const safeIdentifier = this.sanitizeIdentifier(identifier);
      const key = this.keyGenerator(safeIdentifier, namespace);

      const finalConfig: RateLimitConfig = {
        ...this.defaultConfig,
        ...config,
      };

      return await this.strategy.getStatus(key, finalConfig);
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error);
      }

      return {
        allowed: true,
        remaining: this.defaultConfig.points,
        limit: this.defaultConfig.points,
        resetAt: Date.now() + this.defaultConfig.duration * 1000,
        retryAfter: 0,
        consumed: 0,
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string, namespace?: string): Promise<void> {
    const safeIdentifier = this.sanitizeIdentifier(identifier);
    const key = this.keyGenerator(safeIdentifier, namespace);
    await this.strategy.reset(key);
  }

  /**
   * Block an identifier for a specific duration
   */
  async block(
    identifier: string,
    duration: number,
    namespace?: string
  ): Promise<void> {
    const safeIdentifier = this.sanitizeIdentifier(identifier);
    const key = this.keyGenerator(safeIdentifier, namespace);
    await this.strategy.block(key, duration);
  }

  /**
   * Check if identifier is blocked
   */
  async isBlocked(identifier: string, namespace?: string): Promise<boolean> {
    const safeIdentifier = this.sanitizeIdentifier(identifier);
    const key = this.keyGenerator(safeIdentifier, namespace);
    return await this.strategy.isBlocked(key);
  }

  /**
   * Check if storage is healthy
   */
  async isHealthy(): Promise<boolean> {
    return await this.storage.isHealthy();
  }

  /**
   * Get storage instance (for advanced usage)
   */
  getStorage(): IRateLimitStorage {
    return this.storage;
  }

  /**
   * Get strategy instance (for advanced usage)
   */
  getStrategy(): IRateLimitStrategy {
    return this.strategy;
  }
}
