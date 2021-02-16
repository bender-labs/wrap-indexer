import Knex from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('app_state', table => {
    table.string('key').primary();
    table.string('value');
  });
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('app_state');
}
