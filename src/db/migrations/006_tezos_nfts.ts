import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(
    'tezos_nfts',
    (table) => {
      table.string('contract');
      table.string('owner');
      table.string('token_id');
      table.primary(['contract', 'token_id']);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tezos_nfts');
}
