import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wraps', (table) => {
    table.string('id').primary();
    table.string('type');
    table.string('source');
    table.string('token');
    table.string('amount');
    table.string('token_id');
    table.string('tezos_destination');
    table.string('transaction_hash');
    table.string('block_hash');
    table.bigInteger('log_index');
    table.string('status');
    table.bigInteger('level');
    table.bigInteger('finalized_at_level');
  });
  await knex.schema.createTable('unwraps', (table) => {
    table.string('id').primary();
    table.string('type');
    table.string('source');
    table.string('token');
    table.string('amount');
    table.string('token_id');
    table.string('ethereum_destination');
    table.string('status');
    table.bigInteger('level');
    table.string('operation_hash');
    table.bigInteger('finalized_at_level');
  });
  await knex.schema.createTable('signatures', (table) => {
    table.string('signer');
    table.string('cid').primary();
    table.string('id');
    table.string('wrap_id');
    table.string('type');
    table.string('signature');
    table.integer('level');
    table.string('erc');
    table.string('owner').index();
    table.string('amount');
    table.string('token_id');
    table.string('transaction_hash');
    table.string('operation_id');
    table.string('block_hash');
    table.integer('log_index');
    table.string('signer_address');
  });
  await knex.schema.createTable('app_state', (table) => {
    table.string('key').primary();
    table.string('value');
  });
  await knex.schema.createTable('tezos_quorum', (table) => {
    table.string('admin').primary();
    table.integer('threshold');
  });
  await knex.schema.createTable('tezos_quorum_signers', (table) => {
    table.string('ipns_key').primary();
    table.string('public_key');
    table.boolean('active');
  });
  await knex.schema.createTable('ethereum_quorum', (table) => {
    table.string('admin').primary();
    table.integer('threshold');
  });
  await knex.schema.createTable('ethereum_quorum_signers', (table) => {
    table.string('address').primary();
    table.boolean('active');
  });
  await knex.schema.createTable('tokens', (table) => {
    table.string('type');
    table.string('ethereum_symbol');
    table.string('ethereum_name');
    table.string('ethereum_contract_address').primary();
    table.integer('decimals');
    table.string('tezos_wrapping_contract');
    table.string('tezos_token_id');
    table.string('tezos_symbol');
    table.string('tezos_name');
    table.string('thumbnail_uri');
  });
  await knex.schema.createTable('fees', (table) => {
    table.integer('erc20_wrapping_fees');
    table.integer('erc20_unwrapping_fees');
    table.integer('erc721_wrapping_fees');
    table.integer('erc721_unwrapping_fees');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wraps');
  await knex.schema.dropTableIfExists('unwraps');
  await knex.schema.dropTableIfExists('signatures');
  await knex.schema.dropTableIfExists('app_state');
  await knex.schema.dropTableIfExists('tezos_quorum');
  await knex.schema.dropTableIfExists('tezos_quorum_signers');
  await knex.schema.dropTableIfExists('ethereum_quorum');
  await knex.schema.dropTableIfExists('ethereum_quorum_signers');
  await knex.schema.dropTableIfExists('tokens');
  await knex.schema.dropTableIfExists('fees');
}
