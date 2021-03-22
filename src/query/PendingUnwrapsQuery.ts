import {
  Erc20UnwrapSignature,
  Erc721UnwrapSignature,
} from '../domain/Signature';
import Knex from 'knex';
import { ERC20Unwrap, ERC721Unwrap } from '../domain/ERCUnwrap';
import { TezosConfig } from '../configuration';
import { TezosToolkit } from '@taquito/taquito';

type PendingERC20Unwrap = {
  id: string;
  source: string;
  destination: string;
  token: string;
  amount: string;
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
  signatures: {
    [address: string]: string;
  }
  confirmations: number;
  confirmationsThreshold: number;
}

export class PendingUnwrapsQuery {

  constructor(dbClient: Knex, tezosConfiguration: TezosConfig, tezosToolkit: TezosToolkit) {
    this._dbClient = dbClient;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
  }

  async erc20(tezosAddress: string, ethereumAddress: string): Promise<PendingERC20Unwrap[]> {
    const currentLevel = await this._getNetworkLevel();
    const pendingUnwraps: ERC20Unwrap[] = await this._getPendingUnwraps(tezosAddress, ethereumAddress, 'erc20_unwraps') as ERC20Unwrap[];
    const signatures: Erc20UnwrapSignature[] = await this._getSignatures(pendingUnwraps.map(p => p.id)) as Erc20UnwrapSignature[];
    return pendingUnwraps.map(unwrap => {
      const relatedSignatures = signatures
        .filter(s => s.wrapId == unwrap.id)
        .reduce((acc, value) => {
          acc[value.signerAddress] = value.signature;
          return acc;
        }, {});
      return {
        id: unwrap.id,
        source: unwrap.source,
        destination: unwrap.ethereumDestination,
        token: unwrap.token,
        amount: unwrap.amount.toString(),
        signatures: relatedSignatures,
        confirmations: currentLevel - unwrap.level,
        confirmationsThreshold: this._tezosConfiguration.confirmationsThreshold
      };
    });
  }

  async erc721(tezosAddress: string, ethereumAddress: string): Promise<PendingERC721Unwrap[]> {
    const currentLevel = await this._getNetworkLevel();
    const pendingUnwraps: ERC721Unwrap[] = await this._getPendingUnwraps(tezosAddress, ethereumAddress, 'erc721_unwraps') as ERC721Unwrap[];
    const signatures: Erc721UnwrapSignature[] = await this._getSignatures(pendingUnwraps.map(p => p.id)) as Erc721UnwrapSignature[];
    return pendingUnwraps.map(unwrap => {
      const relatedSignatures = signatures
        .filter(s => s.wrapId == unwrap.id)
        .reduce((acc, value) => {
          acc[value.signerAddress] = value.signature;
          return acc;
        }, {});
      return {
        id: unwrap.id,
        source: unwrap.source,
        destination: unwrap.ethereumDestination,
        token: unwrap.token,
        tokenId: unwrap.tokenId.toString(),
        signatures: relatedSignatures,
        confirmations: currentLevel - unwrap.level,
        confirmationsThreshold: this._tezosConfiguration.confirmationsThreshold
      };
    });
  }

  private async _getNetworkLevel(): Promise<number> {
    const block = await this._tezosToolkit.rpc.getBlockHeader();
    return block.level;
  }

  private async _getPendingUnwraps(tezosAddress: string, ethereumAddress: string, table: string): Promise<unknown> {
    return this._dbClient
      .table(table)
      .where({ status: 'asked' })
      .andWhere(function() {
        if (ethereumAddress && tezosAddress) {
          this.where({ source: tezosAddress }).orWhere({ ethereumDestination: ethereumAddress.toLowerCase() });
        } else if (tezosAddress) {
          this.where({ source: tezosAddress });
        } else {
          this.where({ ethereumDestination: ethereumAddress.toLowerCase() });
        }
      });
  }

  private async _getSignatures(wrapIds: string[]): Promise<unknown> {
    return this._dbClient.table('signatures').whereIn('wrap_id', wrapIds);
  }

  private _dbClient: Knex;
  private _tezosConfiguration: TezosConfig;
  private _tezosToolkit: TezosToolkit;
}
