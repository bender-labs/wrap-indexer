import {
  Erc20UnwrapSignature,
  Erc721UnwrapSignature,
} from '../domain/Signature';
import Knex from 'knex';
import { ERC20Unwrap, ERC721Unwrap } from '../domain/ERCUnwrap';
import { TezosConfig } from '../configuration';
import { BcdProvider } from '../infrastructure/tezos/bcdProvider';

type PendingERC20Unwrap = {
  id: string;
  source: string;
  destination: string;
  token: string;
  amount: string;
  operationId: string;
  signatures: {
    [address: string]: string;
  },
  confirmations: number;
  confirmationsThreshold: number;
}

type PendingERC721Unwrap = {
  id: string;
  source: string;
  destination: string;
  token: string;
  tokenId: string;
  operationId: string;
  signatures: {
    [address: string]: string;
  }
  confirmations: number;
  confirmationsThreshold: number;
}

export class PendingUnwrapsQuery {

  constructor(dbClient: Knex, tezosConfiguration: TezosConfig, bcd: BcdProvider) {
    this._dbClient = dbClient;
    this._tezosConfiguration = tezosConfiguration;
    this._bcd = bcd;
  }

  async erc20(tezosAddress: string, ethereumAddress: string): Promise<PendingERC20Unwrap[]> {
    const currentLevel = await this._bcd.getNetworkCurrentLevel();
    const pendingUnwraps: ERC20Unwrap[] = await this._getPendingUnwraps(tezosAddress, ethereumAddress, 'erc20_unwraps') as ERC20Unwrap[];
    const signatures: Erc20UnwrapSignature[] = await this._getSignatures(pendingUnwraps.map(p => p.id)) as Erc20UnwrapSignature[];
    return pendingUnwraps.map(unwrap => {
      const relatedSignatures = signatures
        .filter(s => s.wrapId == unwrap.operationId)
        .reduce((acc, value) => {
          acc[value.signerAddress] = value.signature;
          return acc;
        }, {});
      return {
        id: unwrap.operationId,
        source: unwrap.source,
        destination: unwrap.ethereumDestination,
        token: unwrap.token,
        amount: unwrap.amount.toString(),
        operationId: unwrap.operationId,
        signatures: relatedSignatures,
        confirmations: currentLevel - unwrap.level,
        confirmationsThreshold: this._tezosConfiguration.confirmationsThreshold
      };
    });
  }

  async erc721(tezosAddress: string, ethereumAddress: string): Promise<PendingERC721Unwrap[]> {
    const currentLevel = await this._bcd.getNetworkCurrentLevel();
    const pendingUnwraps: ERC721Unwrap[] = await this._getPendingUnwraps(tezosAddress, ethereumAddress, 'erc721_unwraps') as ERC721Unwrap[];
    const signatures: Erc721UnwrapSignature[] = await this._getSignatures(pendingUnwraps.map(p => p.id)) as Erc721UnwrapSignature[];
    return pendingUnwraps.map(unwrap => {
      const relatedSignatures = signatures
        .filter(s => s.wrapId == unwrap.operationId)
        .reduce((acc, value) => {
          acc[value.signerAddress] = value.signature;
          return acc;
        }, {});
      return {
        id: unwrap.operationId,
        source: unwrap.source,
        destination: unwrap.ethereumDestination,
        token: unwrap.token,
        tokenId: unwrap.tokenId.toString(),
        operationId: unwrap.operationId,
        signatures: relatedSignatures,
        confirmations: currentLevel - unwrap.level,
        confirmationsThreshold: this._tezosConfiguration.confirmationsThreshold
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

  private _dbClient: Knex;
  private _tezosConfiguration: TezosConfig;
  private _bcd: BcdProvider;
}
