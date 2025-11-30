// Request Context
export interface RequestContext {
  traceId: string;
  userId?: string;
  requestId: string;
  startTime: number;
  ip?: string;
  userAgent?: string;
}
