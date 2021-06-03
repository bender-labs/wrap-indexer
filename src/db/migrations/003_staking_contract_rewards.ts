import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tezos_staking_contracts_rewards', (table) => {
    table.string('contract').primary();
    table.bigInteger('start_level');
    table.string('total_rewards');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tezos_staking_contracts_rewards');
}
