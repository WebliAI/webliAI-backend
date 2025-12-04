/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  /*
   * Maximum number of requests allowed
   */
  points: number;

  /*
   * Time window in seconds
   */
  duration: number;

  /**
   * Block duration in seconds if limit exceeded (optional)
   * If not set, uses normal token refill
   */
  blockDuration?: number;

  /**
   * Key prefix for storage (helps with namespacing)
   */
  keyPrefix?: string;

  /**
   * Whether to consume points on failed attempts
   */
  consumeOnFailure?: boolean;
}

/**
 * Rate Limit Storage Data
 */
export interface RateLimitData {
  /**
   * Current token count
   */
  tokens: number;

  /**
   * Last refill timestamp
   */
  lastRefill: number;

  /**
   * Total consumed in current window
   */
  consumed: number;

  /**
   * Block expiry timestamp (if blocked)
   */
  blockUntil?: number;
}

/**
 * Rate Limit Key Info
 */
export interface RateLimitKeyInfo {
  /**
   * Full storage key
   */
  key: string;

  /**
   * Identifier (user ID, IP, etc.)
   */
  identifier: string;

  /**
   * Key namespace/prefix
   */
  namespace?: string;
}

/**
 * Storage Interface
 * Implement this for different storage backends (like localstorage, redis, clouldflare kv etc)
 */
export interface IRateLimitStorage {
  /**
   * Get rate limit data for a key
   */
  get(key: string): Promise<RateLimitData | null>;

  /**
   * Set rate limit data for a key
   */
  set(key: string, data: RateLimitData, ttl: number): Promise<void>;

  /**
   * Delete rate limit data for a key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if storage is healthy
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Remaining points/requests
   */
  remaining: number;

  /**
   * Total points allowed
   */
  limit: number;

  /**
   * Unix timestamp when the limit resets
   */
  resetAt: number;

  /**
   * Seconds until reset
   */
  retryAfter: number;

  /**
   * Current points consumed
   */
  consumed: number;

  /**
   * Whether the key is currently blocked
   */
  isBlocked?: boolean;
}

/**
 * Rate Limiting Strategy Interface
 * Implement this for different algorithms
 */
export interface IRateLimitStrategy {
  /**
   * Check if request should be allowed
   */
  consume(
    identifier: string,
    points: number,
    config: RateLimitConfig
  ): Promise<RateLimitResult>;

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): Promise<void>;

  /**
   * Get current status without consuming
   */
  getStatus(identifier: string, config: RateLimitConfig): Promise<RateLimitResult>;

  /**
   * Block an identifier for a specific duration
   */
  block(identifier: string, duration: number): Promise<void>;

  /**
   * Check if an identifier is blocked
   */
  isBlocked(identifier: string): Promise<boolean>;
}

/**
 * Rate Limiter Options
 */
export interface RateLimiterOptions {
  /**
   * Storage backend
   */
  storage: IRateLimitStorage;

  /**
   * Rate limiting strategy (default: token bucket)
   */
  strategy?: IRateLimitStrategy;

  /**
   * Default configuration (can be overridden per-request)
   */
  defaultConfig?: RateLimitConfig;

  /**
   * Key generator function
   */
  keyGenerator?: (identifier: string, namespace?: string) => string;

  /**
   * Error handler
   */
  onError?: (error: Error) => void;
}

/**
 * Rate Limit Tier Configuration
 * For different user tiers (free, pro, enterprise)
 */
export interface RateLimitTier {
  name: string;
  config: RateLimitConfig;
}

/**
 * Rate Limit Rule
 * For different endpoints/resources
 */
export interface RateLimitRule {
  /**
   * Route pattern (e.g., "/api/generate")
   */
  path: string;

  /**
   * HTTP methods (e.g., ["POST", "PUT"])
   */
  methods?: string[];

  /**
   * Configuration for this rule
   */
  config: RateLimitConfig;

  /**
   * Tier-specific overrides
   */
  tiers?: Record<string, RateLimitConfig>;
}
