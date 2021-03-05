import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tokens', table => {
    table.string('type');
    table.string('ethereum_symbol');
    table.string('ethereum_name');
    table.string('ethereum_contract_address').primary();
    table.integer('decimals');
    table.string('tezos_wrapping_contract');
    table.string('tezos_token_id');
    table.string('tezos_symbol');
    table.string('tezos_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tokens');
}
