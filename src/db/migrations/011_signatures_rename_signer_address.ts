import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('signatures', table => {
    table.renameColumn('signerAddress', 'signer_address');
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
