import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tezos_quorum', table => {
    table.string('admin').primary();
    table.integer('threshold');
  });
  await knex.schema.createTable('tezos_quorum_signers', table => {
    table.string('ipns_key').primary();
    table.string('public_key');
    table.boolean('active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tezos_quorum');
  await knex.schema.dropTable('tezos_quorum_signers');
}
