import { ERCType, ERCWrap, WrapStatus } from '../domain/ERCWrap';
import { WrapSignature } from '../domain/Signature';
import Knex from 'knex';
import { EthereumConfig } from '../configuration';
import { ethers } from 'ethers';

interface WrapWithSignatures {
  id: string;
  source: string;
  destination: string;
  token: string;
  amount?: string;
  tokenId?: string;
  type: ERCType;
  status: WrapStatus;
  transactionHash: string;
  signatures: {
    [address: string]: string;
  };
  confirmations: number;
  confirmationsThreshold: number;
}

export class WrapsQuery {
  constructor(
    dbClient: Knex,
    ethereumConfiguration: EthereumConfig,
    ethereumProvider: ethers.providers.Provider
  ) {
    this._dbClient = dbClient;
    this._ethereumConfiguration = ethereumConfiguration;
    this._ethereumProvider = ethereumProvider;
  }

  async search(
    tezosAddress: string,
    ethereumAddress: string,
    status: WrapStatus
  ): Promise<WrapWithSignatures[]> {
    const currentBlock = await this._ethereumProvider.getBlockNumber();
    const pendingWraps: ERCWrap[] = await this._getWraps(
      tezosAddress,
      ethereumAddress,
      status
    );
    const signatures: WrapSignature[] = await this._getSignatures(
      pendingWraps.map((p) => p.id)
    );
    return pendingWraps.map((wrap) => {
      const relatedSignatures = signatures
        .filter((s) => s.wrapId == wrap.id)
        .reduce((acc, value) => {
          acc[value.signer] = value.signature;
          return acc;
        }, {});
      return {
        id: wrap.id,
        source: wrap.source,
        destination: wrap.tezosDestination,
        token: wrap.token,
        amount: wrap.amount?.toString(),
        token_id: wrap.tokenId?.toString(),
        type: wrap.type,
        status: wrap.status,
        transactionHash: wrap.transactionHash,
        signatures: relatedSignatures,
        confirmations: currentBlock - wrap.level,
        confirmationsThreshold: this._ethereumConfiguration
          .confirmationsThreshold,
      };
    });
  }

  private async _getWraps(
    tezosAddress: string,
    ethereumAddress: string,
    status: WrapStatus
  ): Promise<ERCWrap[]> {
    return this._dbClient
      .table<ERCWrap>('wraps')
      .where(function () {
        if (ethereumAddress) {
          this.orWhere({ source: ethereumAddress.toLowerCase() });
        }
        if (tezosAddress) {
          this.orWhere({ tezosDestination: tezosAddress });
        }
      })
      .andWhere(function () {
        if (status) {
          this.where({ status });
        }
      });
  }

  private async _getSignatures(wrapIds: string[]): Promise<WrapSignature[]> {
    return this._dbClient
      .table<WrapSignature>('signatures')
      .whereIn('wrap_id', wrapIds);
  }

  private _dbClient: Knex;
  private _ethereumConfiguration: EthereumConfig;
  private _ethereumProvider: ethers.providers.Provider;
}
