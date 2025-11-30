// Service Response
export type ServiceResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: Error };
