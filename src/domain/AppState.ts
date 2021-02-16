import Knex from 'knex';

export interface AppStateItem {
  key: string,
  value: string
}

export class AppState {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async getValue(key: string): Promise<AppStateItem | null> {
    return this._dbClient('app_state').where({ key }).first();
  }

  async setValue(item: AppStateItem, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient('app_state')
      .transacting(transaction)
      .insert(item)
      .onConflict('key' as never)
      .merge(item);
  }

  private _dbClient: Knex;
}
