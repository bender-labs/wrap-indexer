import { Logger } from 'tslog';
import { Config } from '../configuration';

export function createLogger(configuration: Config): Logger {
  return new Logger({ name: 'Indexer', type: configuration.log.format, minLevel: configuration.log.level });
}


