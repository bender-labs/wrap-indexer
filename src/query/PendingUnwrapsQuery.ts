import {
  Erc20UnwrapSignature,
  Erc721UnwrapSignature,
} from '../domain/Signature';
import Knex from 'knex';
import { ERC20Unwrap, ERC721Unwrap } from '../domain/ERCUnwrap';

export type PendingERC20Unwrap = {
  id: string;
  source: string;
  destination: string;
  token: string;
  amount: string;
  operationId: string;
  signatures: string[];
}

export type PendingERC721Unwrap = {
  id: string;
  source: string;
  destination: string;
  token: string;
  tokenId: string;
  operationId: string;
  signatures: string[];
}

export class PendingUnwrapsQuery {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async erc20(tezosAddress: string, ethereumAddress: string): Promise<PendingERC20Unwrap[]> {
    const pendingWraps: ERC20Unwrap[] = await this._getPendingUnwraps(tezosAddress, ethereumAddress, 'erc20_unwraps') as ERC20Unwrap[];
    const signatures: Erc20UnwrapSignature[] = await this._getSignatures(pendingWraps.map(p => p.id)) as Erc20UnwrapSignature[];
    return pendingWraps.map(wrap => {
      const relatedSignatures = signatures.filter(s => s.wrapId == wrap.operationId).map(s => s.signature);
      return {
        id: wrap.operationId,
        source: wrap.source,
        destination: wrap.ethereumDestination,
        token: wrap.token,
        amount: wrap.amount.toString(),
        operationId: wrap.operationId,
        signatures: relatedSignatures,
      };
    });
  }

  async erc721(tezosAddress: string, ethereumAddress: string): Promise<PendingERC721Unwrap[]> {
    const pendingWraps: ERC721Unwrap[] = await this._getPendingUnwraps(tezosAddress, ethereumAddress, 'erc721_unwraps') as ERC721Unwrap[];
    const signatures: Erc721UnwrapSignature[] = await this._getSignatures(pendingWraps.map(p => p.id)) as Erc721UnwrapSignature[];
    return pendingWraps.map(wrap => {
      const relatedSignatures = signatures.filter(s => s.wrapId == wrap.operationId).map(s => s.signature);
      return {
        id: wrap.operationId,
        source: wrap.source,
        destination: wrap.ethereumDestination,
        token: wrap.token,
        tokenId: wrap.tokenId.toString(),
        operationId: wrap.operationId,
        signatures: relatedSignatures,
      };
    });
  }

  private async _getPendingUnwraps(tezosAddress: string, ethereumAddress: string, table: string): Promise<unknown> {
    return this._dbClient
      .table(table)
      .where({ status: 'asked' })
      .andWhere(function() {
        if (ethereumAddress && tezosAddress) {
          this.where({ source: tezosAddress }).orWhere({ ethereumDestination: ethereumAddress });
        } else if (ethereumAddress) {
          this.where({ source: tezosAddress });
        } else {
          this.where({ ethereumDestination: ethereumAddress });
        }
      });
  }

  private async _getSignatures(wrapIds: string[]): Promise<unknown> {
    return this._dbClient.table('signatures').whereIn('wrap_id', wrapIds);
  }

  _dbClient: Knex;
}
