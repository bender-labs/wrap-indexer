import Knex from 'knex';
import {
  Erc20MintingSignature,
  Erc721MintingSignature,
  Erc20UnwrapSignature,
  Erc721UnwrapSignature,
} from '../domain/Signature';

export class SignatureDao {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(signature: Erc20MintingSignature | Erc721MintingSignature | Erc20UnwrapSignature | Erc721UnwrapSignature, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient('signatures')
      .transacting(transaction)
      .insert(signature);
  }

  private _dbClient: Knex;
}
