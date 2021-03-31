import Knex from 'knex';
import {
  ERC20Unwrap,
  ERC721Unwrap,
  ERCUnwrapStatus,
} from '../domain/ERCUnwrap';

export class ErcUnwrapDAO {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(
    unwrap: ERC20Unwrap | ERC721Unwrap,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table(this._table(unwrap))
      .transacting(transaction)
      .insert(unwrap);
  }

  async setStatus(
    unwrap: ERC20Unwrap | ERC721Unwrap,
    status: ERCUnwrapStatus,
    level: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table(this._table(unwrap))
      .transacting(transaction)
      .where({ id: unwrap.id })
      .update({
        status,
        finalizedAtLevel: level,
      });
  }

  async getNotFinalizedERC20(): Promise<ERC20Unwrap[]> {
    return this._dbClient
      .table<ERC20Unwrap>('erc20_unwraps')
      .where({ status: 'asked' });
  }

  async getFinalizedERC20UntilLevel(level: number): Promise<ERC20Unwrap[]> {
    return this._dbClient
      .table<ERC20Unwrap>('erc20_unwraps')
      .where({ status: 'finalized' })
      .andWhere('finalized_at_level', '>=', level);
  }

  async getNotFinalizedERC721(): Promise<ERC721Unwrap[]> {
    return this._dbClient
      .table<ERC721Unwrap>('erc721_unwraps')
      .where({ status: 'asked' });
  }

  async getFinalizedERC721UntilLevel(level: number): Promise<ERC721Unwrap[]> {
    return this._dbClient
      .table<ERC721Unwrap>('erc721_unwraps')
      .where({ status: 'finalized' })
      .andWhere('finalized_at_level', '>=', level);
  }

  async getERC20ByOperationHash(operationHash: string): Promise<ERC20Unwrap[]> {
    return this._dbClient
      .table<ERC20Unwrap>('erc20_unwraps')
      .where({ operationHash });
  }

  async getERC721ByOperationHash(
    operationHash: string
  ): Promise<ERC721Unwrap[]> {
    return this._dbClient
      .table<ERC721Unwrap>('erc721_unwraps')
      .where({ operationHash });
  }

  async isExist(
    unwrap: ERC20Unwrap | ERC721Unwrap,
    transaction: Knex.Transaction
  ) {
    const count = await this._dbClient
      .table(this._table(unwrap))
      .transacting(transaction)
      .where({ id: unwrap.id })
      .count();
    return count[0].count !== '0';
  }

  async remove(
    unwraps: (ERC20Unwrap | ERC721Unwrap)[],
    transaction: Knex.Transaction
  ): Promise<void> {
    for (const unwrap of unwraps) {
      await this._dbClient
        .table(this._table(unwrap))
        .transacting(transaction)
        .where({ id: unwrap.id })
        .delete();
    }
  }

  private _table(unwrap: ERC20Unwrap | ERC721Unwrap): string {
    return (unwrap as ERC20Unwrap).amount !== undefined
      ? 'erc20_unwraps'
      : 'erc721_unwraps';
  }

  private _dbClient: Knex;
}
