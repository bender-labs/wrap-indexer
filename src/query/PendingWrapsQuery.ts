import { ERC20Wrap, ERC721Wrap } from '../domain/ERCWrap';
import { Erc20MintingSignature, Erc721MintingSignature } from '../domain/Signature';
import Knex from 'knex';
import { EthereumConfig } from '../configuration';
import { ethers } from 'ethers';

type PendingERC20Wrap = {
  id: string,
  source: string;
  destination: string;
  token: string;
  amount: string;
  transactionHash: string;
  signatures: {
    [address: string]: string;
  },
  confirmations: number;
  confirmationsThreshold: number;
}

type PendingERC721Wrap = {
  id: string,
  source: string;
  destination: string;
  token: string;
  tokenId: string;
  transactionHash: string;
  signatures: {
    [address: string]: string;
  },
  confirmations: number;
  confirmationsThreshold: number;
}

export class PendingWrapsQuery {


  constructor(dbClient: Knex, ethereumConfiguration: EthereumConfig, ethereumProvider: ethers.providers.Provider) {
    this._dbClient = dbClient;
    this._ethereumConfiguration = ethereumConfiguration;
    this._ethereumProvider = ethereumProvider;
  }

  async erc20(tezosAddress: string, ethereumAddress: string): Promise<PendingERC20Wrap[]> {
    const currentBlock = await this._ethereumProvider.getBlockNumber();
    const pendingWraps: ERC20Wrap[] = await this._getPendingWraps(tezosAddress, ethereumAddress, 'erc20_wraps') as ERC20Wrap[];
    const signatures: Erc20MintingSignature[] = await this._getSignatures(pendingWraps.map(p => p.id)) as Erc20MintingSignature[];
    return pendingWraps.map(wrap => {
      const relatedSignatures = signatures
        .filter(s => s.wrapId == wrap.id)
        .reduce((acc, value) => acc[value.signerAddress] = value.signature, {});
      return {
        id: wrap.id,
        source: wrap.source,
        destination: wrap.tezosDestination,
        token: wrap.token,
        amount: wrap.amount.toString(),
        transactionHash: wrap.transactionHash,
        signatures: relatedSignatures,
        confirmations: currentBlock - wrap.level,
        confirmationsThreshold: this._ethereumConfiguration.confirmationsThreshold
      };
    });
  }

  async erc721(tezosAddress: string, ethereumAddress: string): Promise<PendingERC721Wrap[]> {
    const currentBlock = await this._ethereumProvider.getBlockNumber();
    const pendingWraps: ERC721Wrap[] = await this._getPendingWraps(tezosAddress, ethereumAddress, 'erc721_wraps') as ERC721Wrap[];
    const signatures: Erc721MintingSignature[] = await this._getSignatures(pendingWraps.map(p => p.id)) as Erc721MintingSignature[];
    return pendingWraps.map(wrap => {
      const relatedSignatures = signatures
        .filter(s => s.wrapId == wrap.id)
        .reduce((acc, value) => acc[value.signerAddress] = value.signature, {});
      return {
        id: wrap.id,
        source: wrap.source,
        destination: wrap.tezosDestination,
        token: wrap.token,
        tokenId: wrap.tokenId.toString(),
        transactionHash: wrap.transactionHash,
        signatures: relatedSignatures,
        confirmations: currentBlock - wrap.level,
        confirmationsThreshold: this._ethereumConfiguration.confirmationsThreshold
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

  private _dbClient: Knex;
  private _ethereumConfiguration: EthereumConfig;
  private _ethereumProvider: ethers.providers.Provider;
}
