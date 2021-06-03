import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(
    'tezos_staking_contracts_user_balances',
    (table) => {
      table.string('contract');
      table.string('tezos_address');
      table.string('balance');
      table.primary(['contract', 'tezos_address']);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tezos_staking_contracts_user_balances');
}
