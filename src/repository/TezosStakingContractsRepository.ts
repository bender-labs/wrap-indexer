import Knex from 'knex';
import { TezosStakingContract } from '../domain/TezosStakingContract';

export class TezosStakingContractsRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async saveAll(
    contracts: Array<TezosStakingContract>,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._clearContracts(transaction);
    for (const contract of contracts) {
      await this._saveContract(contract, transaction);
    }
  }

  private async _clearContracts(transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table('tezos_staking_contracts')
      .transacting(transaction)
      .delete();
  }

  private async _saveContract(
    contract: TezosStakingContract,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('tezos_staking_contracts')
      .transacting(transaction)
      .insert(contract);
  }

  async getStakingContracts(): Promise<Array<TezosStakingContract>> {
    return this._dbClient.table<TezosStakingContract>(
      'tezos_staking_contracts'
    );
  }

  private _dbClient: Knex;
}
