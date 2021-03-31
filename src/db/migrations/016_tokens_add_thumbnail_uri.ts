import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('tokens', (table) => {
    table.string('thumbnail_uri');
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
