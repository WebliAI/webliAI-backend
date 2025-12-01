/**
 * - success: All worked as expected
 * - fail: Request was valid but failed validation/business logic
 * - error: Server error occurred
 */
export type ResponseStatus = 'success' | 'fail' | 'error';

/**
 * Base Response - Always present fields
 */
interface BaseResponse {
  status: ResponseStatus;
  message?: string;
  meta?: ResponseMeta;
}

/**
 * Response Metadata - Optional context
 */
export interface ResponseMeta {
  traceId?: string;
  requestId?: string;
  timestamp?: string;
  duration?: number;
  version?: string;
  [key: string]: any;
}

/**
 * Success Response - Status 2xx
 * Used when operation succeeds
 */
export interface SuccessResponse<T = any> extends BaseResponse {
  status: 'success';
  data: T;
  meta?: ResponseMeta;
}

/**
 * Fail Response - Status 4xx (Client Error)
 * Used for validation errors, business logic failures
 */
export interface FailResponse extends BaseResponse {
  status: 'fail';
  message: string;
  errors?: ValidationError[];
  meta?: ResponseMeta;
}

/**
 * Error Response - Status 5xx (Server Error)
 * Used for server/system errors
 */
export interface ErrorResponse extends BaseResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: Record<string, any>;
  meta?: ResponseMeta;
}

/**
 * Validation Error Structure
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * API Response - Union of all possible responses
 */
export type ApiResponse<T = any> =
  | SuccessResponse<T>
  | FailResponse
  | ErrorResponse;

/**
 * Response Options
 */
export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  meta?: ResponseMeta;
}
