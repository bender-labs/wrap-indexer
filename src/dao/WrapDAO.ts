import Knex from 'knex';
import { ERCWrap, WrapStatus } from '../domain/ERCWrap';

export class WrapDAO {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async isExist(wrap: ERCWrap, transaction: Knex.Transaction) {
    const count = await this._dbClient
      .table('wraps')
      .transacting(transaction)
      .where({ id: wrap.id })
      .count();
    return count[0].count !== '0';
  }

  async save(wrap: ERCWrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('wraps').transacting(transaction).insert(wrap);
  }

  async setStatus(
    wrap: ERCWrap,
    status: WrapStatus,
    level: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('wraps')
      .transacting(transaction)
      .where({
        blockHash: wrap.blockHash,
        logIndex: wrap.logIndex,
      })
      .update({ status, finalizedAtLevel: level });
  }

  async getNotFinalized(): Promise<ERCWrap[]> {
    return this._dbClient.table<ERCWrap>('wraps').where({ status: 'asked' });
  }

  async getFinalizedUntilLevel(level: number): Promise<ERCWrap[]> {
    return this._dbClient
      .table<ERCWrap>('wraps')
      .where({ status: 'finalized' })
      .andWhere('finalized_at_level', '>=', level);
  }

  async getByTransactionHash(transactionHash: string): Promise<ERCWrap[]> {
    return this._dbClient.table<ERCWrap>('wraps').where({ transactionHash });
  }

  async remove(wraps: ERCWrap[], transaction: Knex.Transaction): Promise<void> {
    for (const wrap of wraps) {
      await this._dbClient
        .table('wraps')
        .transacting(transaction)
        .where({ id: wrap.id })
        .delete();
    }
  }

  private _dbClient: Knex;
}
