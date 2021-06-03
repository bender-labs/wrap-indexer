import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('tezos_staking_contracts_rewards', (table) => {
    table.string('start_timestamp');
    table.bigInteger('duration');
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
