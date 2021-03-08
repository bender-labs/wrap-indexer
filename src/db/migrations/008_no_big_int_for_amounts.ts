import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('erc20_wraps', table => {
    table.string('amount').alter();
  });
  await knex.schema.table('erc721_wraps', table => {
    table.string('token_id').alter();
  });
  await knex.schema.table('erc20_unwraps', table => {
    table.string('amount').alter();
  });
  await knex.schema.table('erc721_unwraps', table => {
    table.string('token_id').alter();
  });
  await knex.schema.table('signatures', table => {
    table.string('amount').alter();
    table.string('token_id').alter();
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
