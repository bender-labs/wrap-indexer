import * as Knex from 'knex'
import { Config } from '../configuration';

export function createKnexConfiguration(configuration: Config) : Knex.Config {
  return {
    client: 'pg',
    connection: {
      host: configuration.postgres.host,
      port: configuration.postgres.port,
      user: configuration.postgres.username,
      password: configuration.postgres.password,
      database: configuration.postgres.database
    }
  };
}

export function createDbClient(configuration: Config) : Knex {
  return Knex(createKnexConfiguration(configuration));
}
