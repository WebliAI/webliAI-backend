import { Context, Next } from 'hono';
import { getLogger } from '../../core/logger/logger';
import { reqCtx } from './../../constants/context';

const logger = getLogger();

export const loggingMiddleware = async (c: Context, next: Next) => {
  const ctx = c.get(reqCtx);

  let requestBody: any = null;
  try {
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      const contentType = c.req.header('content-type') || '';

      if (contentType.includes('application/json')) {
        requestBody = await c.req.json();
      } else if (contentType.includes('text/')) {
        requestBody = await c.req.text();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        requestBody = await c.req.parseBody();
      } else {
        requestBody = 'Unsupported or no body';
      }
    }
  } catch {
    requestBody = 'Failed to parse request body';
  }

  const requestHeaders: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });

  logger.infoWithContext(ctx, "API LOG Request", {
    method: c.req.method,
    path: c.req.path,
    headers: requestHeaders,
    body: requestBody,
  });

  let response: any = null;

  await next();

  const res = c.res.clone();

  try {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      response = await res.json();
    } else if (contentType.includes("text/")) {
      response = await res.text();
    } else {
      response = "Non-text response";
    }
  } catch {
    response = "Failed to parse response body";
  }

  const ctxAfter = c.get(reqCtx);

  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  logger.infoWithContext(ctxAfter, "API LOG Response", {
    status: res.status,
    headers: responseHeaders,
    durationMs: Date.now() - ctxAfter.startTime,
    response,
  });
};
