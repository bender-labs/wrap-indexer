import Knex from 'knex';
import { TezosNFT } from '../domain/TezosNFT';

export class TezosNFTsQuery {
  constructor(
    dbClient: Knex
  ) {
    this._dbClient = dbClient;
  }

  async search(
    tezosAddress: string,
    contractAddress: string
  ): Promise<TezosNFT[]> {
    return this._dbClient
      .table<TezosNFT>('tezos_nfts')
      .where({owner: tezosAddress})
      .andWhere(function () {
        if (contractAddress) {
          this.where({ contract: contractAddress });
        }
      });
  }

  private _dbClient: Knex;
}
