import Knex from 'knex';
import { TezosStakingContractRewards } from '../domain/TezosStakingContractRewards';
import { TezosStakingContractUserBalance } from '../domain/TezosStakingContractUserBalance';

export class TezosStakingContractUserBalanceRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(
    balance: TezosStakingContractUserBalance,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table<TezosStakingContractRewards>(
        'tezos_staking_contracts_user_balances'
      )
      .transacting(transaction)
      .insert(balance)
      .onConflict(['contract', 'tezosAddress'] as never[])
      .merge(balance);
  }

  async getBalance(
    contract: string,
    tezosAddress: string
  ): Promise<TezosStakingContractUserBalance> {
    return this._dbClient
      .table<TezosStakingContractUserBalance>(
        'tezos_staking_contracts_user_balances'
      )
      .where({ contract, tezosAddress })
      .first();
  }

  async getBalances(
    tezosAddress: string
  ): Promise<Array<TezosStakingContractUserBalance>> {
    return this._dbClient
      .table<TezosStakingContractUserBalance>(
        'tezos_staking_contracts_user_balances'
      )
      .where({ tezosAddress });
  }

  private _dbClient: Knex;
}
