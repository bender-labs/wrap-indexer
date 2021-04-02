import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('erc20_unwraps', (table) => {
    table.bigInteger('token_id');
    table.string('type');
  });
  await knex.schema.renameTable('erc20_unwraps', 'unwraps');
  await knex.schema.dropTable('erc721_unwraps');
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
