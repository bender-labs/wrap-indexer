import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('signatures', table => {
    table.string('signer');
    table.string('cid').primary();
    table.string('type');
    table.string('signature');
    table.integer('level');
    table.string('erc');
    table.string('owner').index();
    table.bigInteger('amount');
    table.bigInteger('token_id');
    table.string('transaction_hash');
    table.string('operation_id');
    table.string('block_hash');
    table.integer('log_index');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('signatures');
}
