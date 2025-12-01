import { Context, Next } from 'hono'
import { serverError } from '../../core/response/response.builder'
import { getLogger } from '../../core/logger/logger';
import { reqCtx } from '../../constants/context';

export const errorMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    const ctx = c.get(reqCtx)
    const logger = getLogger();
    logger.errorWithContext(ctx, 'Unhandled error:', {
        "error": err
    })
    return serverError(c);
  }
}
