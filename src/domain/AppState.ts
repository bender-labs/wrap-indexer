import Knex from 'knex';

export interface AppStateItem {
  key: string,
  value: string
}

export class AppState {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async getErcWrapLastIndexedBlock(): Promise<number | null> {
    const item = await this._getValue('erc_wrap_last_indexed_block');
    return item ? +item.value : null;
  }

  async setErcWrapLastIndexedBlock(block: number, transaction: Knex.Transaction): Promise<void> {
    await this._setValue({key: 'erc_wrap_last_indexed_block', value: block.toString()}, transaction);
  }

  async getLastIndexedSignature(ipnsKey: string): Promise<string | null> {
    const item = await this._getValue(`${ipnsKey}_signature_last_indexed`);
    return item ? item.value : null;
  }

  async setLastIndexedSignature(ipnsKey: string, signature: string, transaction: Knex.Transaction): Promise<void> {
    await this._setValue({key: `${ipnsKey}_signature_last_indexed`, value: signature}, transaction);
  }

  async _getValue(key: string): Promise<AppStateItem | null> {
    return this._dbClient('app_state').where({ key }).first();
  }

  async _setValue(item: AppStateItem, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient('app_state')
      .transacting(transaction)
      .insert(item)
      .onConflict('key' as never)
      .merge(item);
  }

  private _dbClient: Knex;
}
