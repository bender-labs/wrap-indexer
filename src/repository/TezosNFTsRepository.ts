import Knex from 'knex';
import { TezosNFT } from '../domain/TezosNFT';

export class TezosNFTsRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async saveAll(
    tokens: Array<TezosNFT>,
    contract: string,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._clearTokens(contract, transaction);
    for (const token of tokens) {
      await this._saveNFT(token, transaction);
    }
  }

  private async _clearTokens(contract: string, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table('tezos_nfts')
      .where({contract})
      .transacting(transaction)
      .delete();
  }

  private async _saveNFT(
    token: TezosNFT,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('tezos_nfts')
      .transacting(transaction)
      .insert(token);
  }

  private _dbClient: Knex;
}
