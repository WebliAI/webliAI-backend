import { RequestContext } from "../../../hono";

export interface ILogger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  infoWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>): void,
  warnWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>): void,
  errorWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>): void,
  debugWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>): void
}
