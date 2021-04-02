import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('erc20_wraps', (table) => {
    table.bigInteger('token_id');
    table.string('type');
  });
  await knex.schema.renameTable('erc20_wraps', 'wraps');
  await knex.schema.dropTable('erc721_wraps');
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
