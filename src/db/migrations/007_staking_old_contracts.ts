import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('tezos_staking_contracts', (table) => {
    table.boolean('old').defaultTo(true);
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
