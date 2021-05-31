import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tezos_staking_contracts', (table) => {
    table.string('contract').primary();
    table.string('token');
    table.string('token_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tezos_staking_contracts');
}
