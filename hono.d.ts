// src/types/hono.d.ts
import 'hono'
import { reqCtx } from './src/constants/context'

export interface RequestContext {
  traceId: string;
  userId?: string;
  requestId: string;
  startTime: number;
  ip?: string;
  userAgent?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    [reqCtx]: RequestContext
  }
}
