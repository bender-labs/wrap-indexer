import Knex from 'knex'

export async function up (knex: Knex) {
  await knex.schema.createTable('erc20_wraps', table => {
    table.string('source');
    table.string('token');
    table.bigInteger('amount');
    table.string('tezos_destination');
    table.string('transaction_hash');
    table.string('block_hash');
    table.bigInteger('log_index');
    table.primary(['block_hash', 'log_index']);
  });
  await knex.schema.createTable('erc721_wraps', table => {
    table.string('source');
    table.string('token');
    table.bigInteger('token_id');
    table.string('tezos_destination');
    table.string('transaction_hash');
    table.string('block_hash');
    table.bigInteger('log_index');
    table.primary(['block_hash', 'log_index']);
  });
}

export async function down (knex: Knex) {
  await knex.schema.dropTable('erc20_wraps');
  await knex.schema.dropTable('erc721_wraps');
}
