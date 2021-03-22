import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('erc20_unwraps', table => {
    table.dropColumn('operation_id');
  });
  await knex.schema.table('erc721_unwraps', table => {
    table.dropColumn('operation_id');
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
