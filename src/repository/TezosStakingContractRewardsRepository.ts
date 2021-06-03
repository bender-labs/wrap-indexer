import Knex from 'knex';
import { TezosStakingContractRewards } from '../domain/TezosStakingContractRewards';

export class TezosStakingContractRewardsRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(
    rewards: TezosStakingContractRewards,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table<TezosStakingContractRewards>('tezos_staking_contracts_rewards')
      .transacting(transaction)
      .insert(rewards)
      .onConflict('contract' as never)
      .merge(rewards);
  }

  async getRewards(): Promise<Array<TezosStakingContractRewards>> {
    return this._dbClient.table<TezosStakingContractRewards>(
      'tezos_staking_contracts_rewards'
    );
  }

  private _dbClient: Knex;
}
