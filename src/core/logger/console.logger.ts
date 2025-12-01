import { RequestContext } from '../../../hono';
import { ILogger } from './logger.interface';

export class ConsoleLogger implements ILogger {
  private formatMessageWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>) {
    return {
      message,
      ...meta,
      ...ctx
    };
  }

  private formatMessage(message: string, meta?: Record<string, any>) {
    return {
      message,
      ...meta
    };
  }

  info(message: string, meta?: Record<string, any>) {
    console.info(`[INFO] ${new Date().toISOString()}`, this.formatMessage(message, meta));
  }

  warn(message: string, meta?: Record<string, any>) {
    console.warn(`[WARN] ${new Date().toISOString()}`, this.formatMessage(message, meta));
  }

  error(message: string, meta?: Record<string, any>) {
    console.error(`[ERROR] ${new Date().toISOString()}`, this.formatMessage(message, meta));
  }

  debug(message: string, meta?: Record<string, any>) {
    console.debug(`[DEBUG] ${new Date().toISOString()}`, this.formatMessage(message, meta));
  }

  infoWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>) {
    console.info(`[INFO] ${new Date().toISOString()}`, this.formatMessageWithContext(ctx, message, meta));
  }

  warnWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>) {
    console.warn(`[WARN] ${new Date().toISOString()}`, this.formatMessageWithContext(ctx, message, meta));
  }

  errorWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>) {
    console.error(`[ERROR] ${new Date().toISOString()}`, this.formatMessageWithContext(ctx, message, meta));
  }

  debugWithContext(ctx: RequestContext, message: string, meta?: Record<string, any>) {
    console.debug(`[DEBUG] ${new Date().toISOString()}`, this.formatMessageWithContext(ctx, message, meta));
  }
}
