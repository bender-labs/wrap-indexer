import { UnwrapSignature } from '../domain/Signature';
import Knex from 'knex';
import * as NodeCache from 'node-cache';
import { ERCUnwrap } from '../domain/ERCUnwrap';
import { TezosConfig } from '../configuration';
import { TezosToolkit } from '@taquito/taquito';
import { ERCType, WrapStatus } from '../domain/ERCWrap';

interface UnwrapWithSignatures {
  id: string;
  source: string;
  destination: string;
  token: string;
  amount?: string;
  tokenId?: string;
  type: ERCType;
  status: WrapStatus;
  operationHash: string;
  signatures: {
    [address: string]: string;
  };
  confirmations: number;
  confirmationsThreshold: number;
}

export class UnwrapsQuery {
  constructor(
    dbClient: Knex,
    tezosConfiguration: TezosConfig,
    tezosToolkit: TezosToolkit
  ) {
    this._dbClient = dbClient;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._cache = new NodeCache({ stdTTL: 30, checkperiod: 10 });
  }

  async search(
    tezosAddress: string,
    ethereumAddress: string,
    status: WrapStatus,
    type: ERCType,
    operationHash: string
  ): Promise<UnwrapWithSignatures[]> {
    const currentLevel = await this._getNetworkLevel();
    const pendingUnwraps: ERCUnwrap[] = await this._getUnwraps(
      tezosAddress,
      ethereumAddress,
      status,
      type,
      operationHash
    );
    const signatures: UnwrapSignature[] = await this._getSignatures(
      pendingUnwraps.map((p) => p.id)
    );
    return pendingUnwraps.map((unwrap) => {
      const relatedSignatures = signatures
        .filter((s) => s.wrapId == unwrap.id)
        .reduce((acc, value) => {
          acc[value.signerAddress] = value.signature;
          return acc;
        }, {});
      return {
        id: unwrap.id,
        source: unwrap.source,
        destination: unwrap.ethereumDestination,
        token: unwrap.token,
        amount: unwrap.amount?.toString(),
        tokenId: unwrap.tokenId?.toString(),
        type: unwrap.type,
        status: unwrap.status,
        operationHash: unwrap.operationHash,
        signatures: relatedSignatures,
        confirmations: this._confirmationsNumber(unwrap, currentLevel),
        confirmationsThreshold: this._tezosConfiguration.confirmationsThreshold,
      };
    });
  }

  private _confirmationsNumber(unwrap: ERCUnwrap, currentLevel: number): number {
    if (unwrap.id.startsWith('retry:')) {
      return this._tezosConfiguration.confirmationsThreshold;
    }
    return currentLevel - unwrap.level < 0 ? 0 : currentLevel - unwrap.level;
  }

  private async _getNetworkLevel(): Promise<number> {
    let currentLevel = this._cache.get<string>('currentLevel');
    if (!currentLevel) {
      const block = await this._tezosToolkit.rpc.getBlockHeader();
      this._cache.set<string>('currentLevel', block.level.toString());
      currentLevel = block.level.toString();
    }
    return +currentLevel;
  }

  private async _getUnwraps(
    tezosAddress: string,
    ethereumAddress: string,
    status: WrapStatus,
    type: ERCType,
    operationHash: string
  ): Promise<ERCUnwrap[]> {
    return this._dbClient
      .table<ERCUnwrap>('unwraps')
      .where(function () {
        if (ethereumAddress) {
          this.orWhere({ ethereumDestination: ethereumAddress.toLowerCase() });
        }
        if (tezosAddress) {
          this.orWhere({ source: tezosAddress });
        }
      })
      .andWhere(function () {
        if (status) {
          this.where({ status });
        }
        if (type) {
          this.where({ type });
        }
        if (operationHash) {
          this.where({ operationHash });
        }
      });
  }

  private async _getSignatures(wrapIds: string[]): Promise<UnwrapSignature[]> {
    return this._dbClient
      .table<UnwrapSignature>('signatures')
      .whereIn('wrap_id', wrapIds);
  }

  private _dbClient: Knex;
  private _tezosConfiguration: TezosConfig;
  private _tezosToolkit: TezosToolkit;
  private _cache: NodeCache;
}
