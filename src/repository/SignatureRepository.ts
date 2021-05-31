import Knex from 'knex';
import { WrapSignature, UnwrapSignature } from '../domain/Signature';

export class SignatureRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(
    signature: WrapSignature | UnwrapSignature,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('signatures')
      .transacting(transaction)
      .insert(signature);
  }

  private _dbClient: Knex;
}
