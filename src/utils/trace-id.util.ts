import { nanoid } from 'nanoid';

export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = nanoid(10);
  return `tr_${timestamp}_${random}`;
}

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = nanoid(10);
  return `req_${timestamp}_${random}`;
}

export function isValidTraceId(traceId: string): boolean {
  return /^tr_[a-z0-9]+_[a-zA-Z0-9_-]+$/.test(traceId);
}
