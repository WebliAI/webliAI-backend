import { Context, Next } from 'hono';
import {
  generateTraceId,
  generateRequestId,
  isValidTraceId,
} from "../../utils/trace-id.util";
import { reqCtx } from './../../constants/context';

export const contextMiddleware = async (c: Context, next: Next) => {
  const traceIdHeader = c.req.header("x-trace-id");

  const traceId =
    traceIdHeader && isValidTraceId(traceIdHeader)
      ? traceIdHeader
      : generateTraceId();
  const requestId = generateRequestId();

  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    c.req.header("x-real-ip") ||
    // Miniflare local fallback
    (c.req.raw as any)?.remoteAddress ||
    "unknown";

  const context = {
    traceId: traceId,
    requestId: requestId,
    startTime: Date.now(),
    userAgent: c.req.header('user-agent') || '',
    ip
  };

  c.set(reqCtx, context);
  c.header('x-trace-id', traceId)

  await next();
};
