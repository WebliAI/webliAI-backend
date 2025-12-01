/*
 * Reference: https://github.com/omniti-labs/jsend
*/
import type { Context } from 'hono';
import type {
  SuccessResponse,
  FailResponse,
  ErrorResponse,
  PaginatedResponse,
  ResponseOptions,
  ResponseMeta,
  ValidationError,
  PaginationMeta,
} from './response.types';
import { reqCtx } from '../../constants/context';

/**
 * Main Response Builder Class
 */
export class ResponseBuilder {
  /**
   * Success Response (2xx)
   * Use for successful operations
   */
  static success<T>(
    c: Context,
    data: T,
    options?: ResponseOptions
  ): Response {
    const body: SuccessResponse<T> = {
      status: 'success',
      data,
      meta: this.buildMeta(c, options?.meta),
    };

    return this.json(c, body, options?.status || 200, options?.headers);
  }

  /**
   * Created Response (201)
   * Use after creating a resource
   */
  static created<T>(
    c: Context,
    data: T,
    options?: ResponseOptions
  ): Response {
    return this.success(c, data, { ...options, status: 201 });
  }

  /**
   * Accepted Response (202)
   * Use for async operations (queued jobs)
   */
  static accepted<T>(
    c: Context,
    data: T,
    options?: ResponseOptions
  ): Response {
    return this.success(c, data, { ...options, status: 202 });
  }

  /**
   * No Content Response (204)
   * Use for successful DELETE or operations with no response body
   */
  static noContent(c: Context): Response {
    return new Response(null, {
      status: 204,
      headers: this.buildHeaders(c),
    });
  }

  /**
   * Fail Response (4xx)
   * Use for client errors (validation, business logic failures)
   */
  static fail(
    c: Context,
    message: string,
    errors?: ValidationError[],
    options?: ResponseOptions
  ): Response {
    const body: FailResponse = {
      status: 'fail',
      message,
      errors,
      meta: this.buildMeta(c, options?.meta),
    };

    return this.json(c, body, options?.status || 400, options?.headers);
  }

  /**
   * Error Response (5xx)
   * Use for server errors
   */
  static error(
    c: Context,
    message: string,
    code?: string,
    details?: Record<string, any>,
    options?: ResponseOptions
  ): Response {
    const body: ErrorResponse = {
      status: 'error',
      message,
      code,
      details,
      meta: this.buildMeta(c, options?.meta),
    };

    return this.json(c, body, options?.status || 500, options?.headers);
  }

  /**
   * Paginated Response
   * Use for list endpoints with pagination
   */
  static paginated<T>(
    c: Context,
    data: T[],
    pagination: PaginationMeta,
    options?: ResponseOptions
  ): Response {
    const body: PaginatedResponse<T> = {
      status: 'success',
      data,
      pagination,
      meta: this.buildMeta(c, options?.meta),
    };

    return this.json(c, body, options?.status || 200, options?.headers);
  }

  /**
   * Validation Error Response (422)
   * Use for input validation failures
   */
  static validationError(
    c: Context,
    errors: ValidationError[],
    message: string = 'Validation failed'
  ): Response {
    return this.fail(c, message, errors, { status: 422 });
  }

  /**
   * Not Found Response (404)
   */
  static notFound(c: Context, message: string = 'Resource not found'): Response {
    return this.fail(c, message, undefined, { status: 404 });
  }

  /**
   * Unauthorized Response (401)
   */
  static unauthorized(c: Context, message: string = 'Unauthorized'): Response {
    return this.fail(c, message, undefined, { status: 401 });
  }

  /**
   * Forbidden Response (403)
   */
  static forbidden(c: Context, message: string = 'Forbidden'): Response {
    return this.fail(c, message, undefined, { status: 403 });
  }

  /**
   * Conflict Response (409)
   */
  static conflict(c: Context, message: string): Response {
    return this.fail(c, message, undefined, { status: 409 });
  }

  /**
   * Rate Limited Response (429)
   */
  static rateLimited(
    c: Context,
    retryAfter?: number,
    message: string = 'Too many requests'
  ): Response {
    const headers = retryAfter ? { 'Retry-After': retryAfter.toString() } : undefined;
    return this.fail(c, message, undefined, { status: 429, headers });
  }

  /**
   * Server Error Response (500)
   */
  static serverError(
    c: Context,
    message: string = 'Internal server error',
    code?: string
  ): Response {
    return this.error(c, message, code, undefined, { status: 500 });
  }

  /**
   * Service Unavailable Response (503)
   */
  static serviceUnavailable(
    c: Context,
    message: string = 'Service temporarily unavailable'
  ): Response {
    return this.error(c, message, 'SERVICE_UNAVAILABLE', undefined, { status: 503 });
  }

  /**
   * Build response metadata
   */
  private static buildMeta(c: Context, additional?: ResponseMeta): ResponseMeta {
    const ctx = c.get(reqCtx);
    const startTime = ctx.startTime || Date.now();

    return {
      traceId: ctx?.traceId || c.req.header('x-trace-id'),
      requestId: ctx?.requestId || c.req.header('x-request-id'),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      ...additional,
    };
  }

  /**
   * Build response headers
   */
  private static buildHeaders(
    c: Context,
    additional?: Record<string, string>
  ): HeadersInit {
    const context = c.get(reqCtx);

    return {
      'Content-Type': 'application/json',
      'X-Trace-Id': context?.traceId || '',
      'X-Request-Id': context?.requestId || '',
      ...additional,
    };
  }

  /**
   * Create JSON response
   */
  private static json(
    c: Context,
    body: any,
    status: number,
    headers?: Record<string, string>
  ): Response {
    // Use Response constructor to avoid Hono's strict type checking
    return new Response(JSON.stringify(body), {
      status,
      headers: this.buildHeaders(c, headers),
    });
  }
}

/**
 * Convenience Functions (Functional Style)
 */

export const ok = <T>(c: Context, data: T, options?: ResponseOptions) =>
  ResponseBuilder.success(c, data, options);

export const created = <T>(c: Context, data: T, options?: ResponseOptions) =>
  ResponseBuilder.created(c, data, options);

export const accepted = <T>(c: Context, data: T, options?: ResponseOptions) =>
  ResponseBuilder.accepted(c, data, options);

export const noContent = (c: Context) => ResponseBuilder.noContent(c);

export const fail = (
  c: Context,
  message: string,
  errors?: ValidationError[],
  options?: ResponseOptions
) => ResponseBuilder.fail(c, message, errors, options);

export const validationError = (
  c: Context,
  errors: ValidationError[],
  message?: string
) => ResponseBuilder.validationError(c, errors, message);

export const notFound = (c: Context, message?: string) =>
  ResponseBuilder.notFound(c, message);

export const unauthorized = (c: Context, message?: string) =>
  ResponseBuilder.unauthorized(c, message);

export const forbidden = (c: Context, message?: string) =>
  ResponseBuilder.forbidden(c, message);

export const conflict = (c: Context, message: string) =>
  ResponseBuilder.conflict(c, message);

export const rateLimited = (c: Context, retryAfter?: number, message?: string) =>
  ResponseBuilder.rateLimited(c, retryAfter, message);

export const serverError = (c: Context, message?: string, code?: string) =>
  ResponseBuilder.serverError(c, message, code);

export const serviceUnavailable = (c: Context, message?: string) =>
  ResponseBuilder.serviceUnavailable(c, message);

export const paginated = <T>(
  c: Context,
  data: T[],
  pagination: PaginationMeta,
  options?: ResponseOptions
) => ResponseBuilder.paginated(c, data, pagination, options);
