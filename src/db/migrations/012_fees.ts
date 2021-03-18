import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('fees', table => {
    table.integer('erc20_wrapping_fees');
    table.integer('erc20_unwrapping_fees');
    table.integer('erc721_wrapping_fees');
    table.integer('erc721_unwrapping_fees');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('fees');
}
