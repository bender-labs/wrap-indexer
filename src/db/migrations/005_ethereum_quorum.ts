import Knex from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('ethereum_quorum', table => {
    table.string('admin').primary();
    table.integer('threshold');
  });
  await knex.schema.createTable('ethereum_quorum_signers', table => {
    table.string('address').primary();
    table.boolean('active');
  });
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('ethereum_quorum');
  await knex.schema.dropTable('ethereum_quorum_signers');
}
