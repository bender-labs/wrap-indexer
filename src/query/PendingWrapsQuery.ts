import { ERC20Wrap, ERC721Wrap } from '../domain/ERCWrap';
import { Erc20MintingSignature, Erc721MintingSignature } from '../domain/Signature';
import Knex from 'knex';

export type PendingERC20Wrap = {
  source: string;
  destination: string;
  token: string;
  amount: string;
  transactionHash: string;
  signatures: string[];
}

export type PendingERC721Wrap = {
  source: string;
  destination: string;
  token: string;
  tokenId: string;
  transactionHash: string;
  signatures: string[];
}

export class PendingWrapsQuery {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async erc20(tezosAddress: string, ethereumAddress: string): Promise<PendingERC20Wrap[]> {
    const pendingWraps: ERC20Wrap[] = await this._getPendingWraps(tezosAddress, ethereumAddress, 'erc20_wraps') as ERC20Wrap[];
    const signatures: Erc20MintingSignature[] = await this._getSignatures(pendingWraps.map(p => p.id)) as Erc20MintingSignature[];
    return pendingWraps.map(wrap => {
      const relatedSignatures = signatures.filter(s => s.wrapId == wrap.id).map(s => s.signature);
      return {
        source: wrap.source,
        destination: wrap.tezosDestination,
        token: wrap.token,
        amount: wrap.amount.toString(),
        transactionHash: wrap.transactionHash,
        signatures: relatedSignatures,
      };
    });
  }

  async erc721(tezosAddress: string, ethereumAddress: string): Promise<PendingERC721Wrap[]> {
    const pendingWraps: ERC721Wrap[] = await this._getPendingWraps(tezosAddress, ethereumAddress, 'erc721_wraps') as ERC721Wrap[];
    const signatures: Erc721MintingSignature[] = await this._getSignatures(pendingWraps.map(p => p.id)) as Erc721MintingSignature[];
    return pendingWraps.map(wrap => {
      const relatedSignatures = signatures.filter(s => s.wrapId == wrap.id).map(s => s.signature);
      return {
        source: wrap.source,
        destination: wrap.tezosDestination,
        token: wrap.token,
        tokenId: wrap.tokenId.toString(),
        transactionHash: wrap.transactionHash,
        signatures: relatedSignatures,
      };
    });
  }

  private async _getPendingWraps(tezosAddress: string, ethereumAddress: string, table: string): Promise<unknown> {
    return this._dbClient
      .table(table)
      .where({ status: 'asked' })
      .andWhere(function() {
        if (ethereumAddress && tezosAddress) {
          this.where({ source: ethereumAddress }).orWhere({ tezosDestination: tezosAddress });
        } else if (ethereumAddress) {
          this.where({ source: ethereumAddress });
        } else {
          this.where({ tezosDestination: tezosAddress });
        }
      });
  }

  private async _getSignatures(wrapIds: string[]): Promise<unknown> {
    return this._dbClient.table('signatures').whereIn('wrap_id', wrapIds);
  }

  _dbClient: Knex;
}
