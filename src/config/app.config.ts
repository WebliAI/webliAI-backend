import { Environment } from '../constants/env'

export const APP_ENV: Environment = (() => {
  const env = process.env.NODE_ENV?.toLowerCase() || 'local';

  switch (env) {
    case 'production':
      return Environment.Production;
    case 'staging':
      return Environment.Staging;
    default:
      return Environment.Local;
  }
})();

export const IS_PRODUCTION = APP_ENV === Environment.Production;
export const IS_STAGING = APP_ENV === Environment.Staging;
export const IS_LOCAL = APP_ENV === Environment.Local;
