import Knex from 'knex';
import { ERC20Wrap, ERC721Wrap } from '../domain/ERCWrap';

export class ErcWrapDAO {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrap: ERC20Wrap | ERC721Wrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table(this._table(wrap)).transacting(transaction).insert(wrap);
  }

  private _table(unwrap: ERC20Wrap | ERC721Wrap): string {
    return (unwrap as ERC20Wrap).amount !== undefined ? 'erc20_wraps' : 'erc721_wraps';
  }

  private _dbClient: Knex;
}
