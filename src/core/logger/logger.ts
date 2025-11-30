import { ILogger } from './logger.interface';
import { ConsoleLogger } from './console.logger';
import { APP_ENV } from '../../config/app.config'
import { Environment } from '../../constants/env'

let loggerInstance: ILogger;

export function getLogger(): ILogger {
  if (!loggerInstance) {
    switch (APP_ENV) {
      case Environment.Production:
      case Environment.Staging:
      default:
        loggerInstance = new ConsoleLogger();
    }
  }
  return loggerInstance;
}
