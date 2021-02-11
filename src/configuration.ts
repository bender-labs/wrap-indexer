import {loadConfiguration as load} from '@arpinum/config';

export function loadConfiguration() {
  return load({
    postgres: {
      username: {
        env: 'POSTGRES_DB_USER',
        default: 'postgres'
      },
      password: {
        env: 'POSTGRES_DB_PASSWORD',
        default: 'password'
      },
      host: {
        env: 'POSTGRES_DB_HOST',
        default: 'localhost'
      },
      port: {
        env: 'POSTGRES_DB_PORT',
        type: 'integer',
        default: 5432
      },
      database: {
        env: 'POSTGRES_DB_NAME',
        default: 'indexer'
      }
    }
  });
}


