import Knex from 'knex';
import { ERC20Unwrap, ERC721Unwrap } from '../domain/ERCUnwrap';

export class ErcUnwrapDAO {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(unwrap: ERC20Unwrap | ERC721Unwrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table(this._table(unwrap)).transacting(transaction).insert(unwrap);
  }

  async setAsFinalized(unwrap: ERC20Unwrap | ERC721Unwrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table(this._table(unwrap)).transacting(transaction).where({ id: unwrap.id }).update({ status: 'finalized' });
  }

  async getNotFinalizedERC20(): Promise<ERC20Unwrap[]> {
    return this._dbClient.table<ERC20Unwrap>('erc20_unwraps').where({ status: 'asked' });
  }

  async getNotFinalizedERC721(): Promise<ERC721Unwrap[]> {
    return this._dbClient.table<ERC721Unwrap>('erc721_unwraps').where({ status: 'asked' });
  }

  private _table(unwrap: ERC20Unwrap | ERC721Unwrap): string {
    return (unwrap as ERC20Unwrap).amount !== undefined ? 'erc20_unwraps' : 'erc721_unwraps';
  }

  private _dbClient: Knex;
}
