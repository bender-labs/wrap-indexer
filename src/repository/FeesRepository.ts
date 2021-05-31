import Knex from 'knex';
import { Fees } from '../domain/Fees';

export class FeesRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(fees: Fees, transaction: Knex.Transaction): Promise<void> {
    const exist = await this._dbClient.table<Fees>('fees').count();
    if (exist[0].count === '0') {
      await this._dbClient.table('fees').transacting(transaction).insert(fees);
    } else {
      await this._dbClient.table('fees').transacting(transaction).update(fees);
    }
  }

  async getFees(): Promise<Fees> {
    return this._dbClient.table<Fees>('fees').first();
  }

  private _dbClient: Knex;
}
