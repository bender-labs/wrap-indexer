import Knex from 'knex';
import { ERC20Wrap, ERC721Wrap, ERCWrapStatus } from '../domain/ERCWrap';

export class ErcWrapDAO {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async isExist(wrap: ERC20Wrap | ERC721Wrap, transaction: Knex.Transaction) {
    const count = await this._dbClient.table(this._table(wrap)).transacting(transaction).where( {id: wrap.id }).count();
    return count[0].count !== '0';
  }

  async save(wrap: ERC20Wrap | ERC721Wrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table(this._table(wrap)).transacting(transaction).insert(wrap);
  }

  async setStatus(wrap: ERC20Wrap | ERC721Wrap, status: ERCWrapStatus, level: number, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table(this._table(wrap)).transacting(transaction).where({
      blockHash: wrap.blockHash,
      logIndex: wrap.logIndex,
    }).update({ status, finalizedAtLevel: level });
  }

  async getNotFinalizedERC20(): Promise<ERC20Wrap[]> {
    return this._dbClient.table<ERC20Wrap>('erc20_wraps').where({ status: 'asked' });
  }

  async getFinalizedERC20UntilLevel(level: number): Promise<ERC20Wrap[]> {
    return this._dbClient.table<ERC20Wrap>('erc20_wraps').where({ status: 'finalized' }).andWhere('finalized_at_level', '>=', level);
  }

  async getNotFinalizedERC721(): Promise<ERC721Wrap[]> {
    return this._dbClient.table<ERC721Wrap>('erc721_wraps').where({ status: 'asked' });
  }

  async getFinalizedERC721UntilLevel(level: number): Promise<ERC721Wrap[]> {
    return this._dbClient.table<ERC721Wrap>('erc721_wraps').where({ status: 'finalized' }).andWhere('finalized_at_level', '>=', level);
  }

  async getERC20ByTransactionHash(transactionHash: string): Promise<ERC20Wrap[]> {
    return this._dbClient.table<ERC20Wrap>('erc20_wraps').where({ transactionHash });
  }

  async getERC721ByTransactionHash(transactionHash: string): Promise<ERC721Wrap[]> {
    return this._dbClient.table<ERC721Wrap>('erc721_wraps').where({ transactionHash });
  }

  async remove(wraps: (ERC20Wrap | ERC721Wrap)[], transaction: Knex.Transaction): Promise<void> {
    for (const wrap of wraps) {
      await this._dbClient.table(this._table(wrap)).transacting(transaction).where({ id: wrap.id }).delete();
    }
  }

  private _table(unwrap: ERC20Wrap | ERC721Wrap): string {
    return (unwrap as ERC20Wrap).amount !== undefined ? 'erc20_wraps' : 'erc721_wraps';
  }

  private _dbClient: Knex;
}
