import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tezos_stacking_contracts', (table) => {
    table.string('contract').primary();
    table.string('total_staked');
    table.json('fees');
    table.bigInteger('start_level');
    table.string('total_rewards');
    table.string('start_timestamp');
    table.bigInteger('duration');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tezos_stacking_contracts');
}
