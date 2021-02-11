import * as Knex from 'knex'

export function createKnexConfiguration(configuration: any) : Knex.Config {
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

export function createDbClient(configuration: any) {
  return Knex(createKnexConfiguration({ configuration }));
}
