import Knex from 'knex';
import { ERCUnwrap } from '../domain/ERCUnwrap';
import { WrapStatus } from '../domain/ERCWrap';

export class UnwrapRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(unwrap: ERCUnwrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table('unwraps')
      .transacting(transaction)
      .insert(unwrap);
  }

  async setStatus(
    unwrap: ERCUnwrap,
    status: WrapStatus,
    level: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('unwraps')
      .transacting(transaction)
      .where({ id: unwrap.id })
      .update({
        status,
        finalizedAtLevel: level,
      });
  }

  async getNotFinalized(): Promise<ERCUnwrap[]> {
    return this._dbClient
      .table<ERCUnwrap>('unwraps')
      .where({ status: 'asked' });
  }

  async getFinalizedUntilLevel(level: number): Promise<ERCUnwrap[]> {
    return this._dbClient
      .table<ERCUnwrap>('unwraps')
      .where({ status: 'finalized' })
      .andWhere('finalized_at_level', '>=', level);
  }

  async getByOperationHash(operationHash: string): Promise<ERCUnwrap[]> {
    return this._dbClient.table<ERCUnwrap>('unwraps').where({ operationHash });
  }

  async isExist(
    unwrap: ERCUnwrap,
    transaction: Knex.Transaction
  ): Promise<boolean> {
    const count = await this._dbClient
      .table('unwraps')
      .transacting(transaction)
      .where({ id: unwrap.id })
      .count();
    return count[0].count !== '0';
  }

  async remove(
    unwraps: ERCUnwrap[],
    transaction: Knex.Transaction
  ): Promise<void> {
    for (const unwrap of unwraps) {
      await this._dbClient
        .table('unwraps')
        .transacting(transaction)
        .where({ id: unwrap.id })
        .delete();
    }
  }

  private _dbClient: Knex;
}
