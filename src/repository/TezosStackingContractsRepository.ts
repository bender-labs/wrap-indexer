import Knex from 'knex';
import { TezosStackingContract } from '../domain/TezosStackingContract';

export class TezosStackingContractsRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async saveAll(
    contracts: Array<TezosStackingContract>,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._clearContracts(transaction);
    for (const contract of contracts) {
      await this._saveContract(contract, transaction);
    }
  }

  private async _clearContracts(transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table('tezos_stacking_contracts')
      .transacting(transaction)
      .delete();
  }

  private async _saveContract(
    contract: TezosStackingContract,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('tezos_stacking_contracts')
      .transacting(transaction)
      .insert(contract);
  }

  async getStackingContracts(): Promise<Array<TezosStackingContract>> {
    return this._dbClient.table<TezosStackingContract>(
      'tezos_stacking_contracts'
    );
  }

  private _dbClient: Knex;
}
