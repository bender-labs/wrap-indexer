import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('erc20_unwraps', table => {
    table.string('id').primary();
    table.string('source');
    table.string('token');
    table.bigInteger('amount');
    table.string('ethereum_destination');
    table.string('operation_id');
    table.string('status');
  });
  await knex.schema.createTable('erc721_unwraps', table => {
    table.string('id').primary();
    table.string('source');
    table.string('token');
    table.bigInteger('token_id');
    table.string('ethereum_destination');
    table.string('operation_id');
    table.string('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('erc20_unwraps');
  await knex.schema.dropTable('erc721_unwraps');
}
