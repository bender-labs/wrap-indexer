import { Logger } from 'tslog';
import Knex from 'knex';
import { IpfsClient } from '../../infrastructure/ipfsClient';
import { WrapSignature, UnwrapSignature } from '../../domain/Signature';
import { AppState } from '../state/AppState';
import { TezosSigner } from '../../domain/TezosSigner';
import { SignatureRepository } from '../../repository/SignatureRepository';
import { TezosQuorumRepository } from '../../repository/TezosQuorumRepository';
import { Dependencies } from '../../bootstrap';
import { MintingFailedEvent } from '../../domain/MintingFailedEvent';
import { WrapRepository } from '../../repository/WrapRepository';
import { UnwrapRepository } from '../../repository/UnwrapRepository';
import { ERCUnwrap } from '../../domain/ERCUnwrap';
import { TezosToolkit } from '@taquito/taquito';

export class SignatureIndexer {
  constructor({ logger, ipfsClient, dbClient, tezosToolkit }: Dependencies) {
    this._logger = logger;
    this._ipfsClient = ipfsClient;
    this._dbClient = dbClient;
    this._tezosToolkit = tezosToolkit;
    this._appState = new AppState(this._dbClient);
    this._signatureDao = new SignatureRepository(this._dbClient);
    this._wrapDao = new WrapRepository(this._dbClient);
    this._unwrapDao = new UnwrapRepository(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing signatures`);
    const signers = await new TezosQuorumRepository(
      this._dbClient
    ).getActiveSigners();
    for (const signer of signers) {
      this._logger.debug(`Indexing signatures of ${signer.ipnsKey}`);
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        await this._indexSigner(signer, transaction);
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process signatures ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _indexSigner(
    signer: TezosSigner,
    transaction: Knex.Transaction
  ): Promise<void> {
    const cid = await this._resolveIpnsPath('/ipns/' + signer.ipnsKey);
    const lastIndexedSignature = await this._appState.getLastIndexedSignature(
      signer.ipnsKey
    );
    if (cid != null && cid != lastIndexedSignature) {
      let current = cid;
      do {
        const result = await this._resolveDag(current);
        if (result != null) {
          if (this._isAFailedEvent(result.value.type)) {
            await this._processFailedEvent(result.value, transaction);
          } else {
            await this._indexSignature(
              signer,
              current.toString(),
              result.value,
              transaction
            );
          }
        }
        current =
          result && result.value.parent ? '/ipfs/' + result.value.parent : null;
      } while (current && current != lastIndexedSignature);
      await this._appState.setLastIndexedSignature(
        signer.ipnsKey,
        cid.toString(),
        transaction
      );
    }
  }

  private async _indexSignature(
    signer: TezosSigner,
    cid: string,
    value: any,
    transaction: Knex.Transaction
  ): Promise<void> {
    const signature = this._parseSignature(signer, cid, value);
    if (signature) {
      await this._signatureDao.save(signature, transaction);
    }
  }

  private async _processFailedEvent(
    value: any,
    transaction: Knex.Transaction
  ): Promise<void> {
    const event = this._parseFailedEvent(value);
    const currentTezosLevel = (await this._tezosToolkit.rpc.getBlockHeader())
      .level;
    await this._wrapDao.setStatus(
      event.blockHash,
      event.logIndex,
      'reverted',
      currentTezosLevel,
      transaction
    );
    const unwrap = await this._buildUnwrapFromRevert(event, currentTezosLevel);
    const existingUnwrap = await this._unwrapDao.isExist(unwrap, transaction);
    if (!existingUnwrap) {
      await this._unwrapDao.save(unwrap, transaction);
    }
  }

  private async _buildUnwrapFromRevert(
    event: MintingFailedEvent,
    currentTezosLevel: number
  ): Promise<ERCUnwrap> {
    const wrapId = `revert:${event.wrapId}`;
    return {
      id: wrapId,
      source: event.owner,
      token: event.erc,
      amount: event.amount,
      tokenId: event.tokenId,
      ethereumDestination: event.owner,
      operationHash: wrapId,
      level: currentTezosLevel,
      status: 'asked',
      type: event.type === 'Erc20MintingFailed' ? 'ERC20' : 'ERC721',
      finalizedAtLevel: null,
    };
  }

  private _isAFailedEvent(type: string): boolean {
    return type === 'Erc20MintingFailed' || type === 'Erc721MintingFailed';
  }

  private async _resolveIpnsPath(path: string): Promise<string | null> {
    try {
      return await this._ipfsClient.resolve(path, { timeout: 20 * 1000 });
    } catch (e) {
      this._logger.warn(`Can't resolve ipns path ${path}: ${e.message}`);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _resolveDag(path: string): Promise<any | null> {
    try {
      return await this._ipfsClient.dag.get(path);
    } catch (e) {
      this._logger.warn(`Can't resolve dag ${path}: ${e.message}`);
      return null;
    }
  }

  private _parseSignature(
    signer: TezosSigner,
    cid: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ): WrapSignature | UnwrapSignature {
    switch (value.type) {
      case 'Erc20MintingSigned':
        return {
          wrapId: `${value.payload.parameters.blockHash}:${value.payload.parameters.logIndex}`,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress,
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc20,
          amount: value.payload.parameters.amount,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.parameters.blockHash,
          logIndex: value.payload.parameters.logIndex,
        };
      case 'Erc721MintingSigned':
        return {
          wrapId: `${value.payload.parameters.blockHash}:${value.payload.parameters.logIndex}`,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress,
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc721,
          tokenId: value.payload.parameters.tokenId,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.parameters.blockHash,
          logIndex: value.payload.parameters.logIndex,
        };
      case 'Erc20UnwrapSigned':
        return {
          wrapId: value.payload.parameters.operationId,
          id: value.payload.parameters.operationId,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress.toLowerCase(),
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc20,
          amount: value.payload.parameters.amount,
          operationId: value.payload.parameters.operationId,
        };
      case 'Erc721UnwrapSigned':
        return {
          wrapId: value.payload.parameters.operationId,
          id: value.payload.parameters.operationId,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress.toLowerCase(),
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc721,
          tokenId: value.payload.parameters.tokenId,
          operationId: value.payload.parameters.operationId,
        };
      default:
        return null;
    }
  }

  private _parseFailedEvent(value: any): MintingFailedEvent {
    switch (value.type) {
      case 'Erc20MintingFailed':
        return {
          wrapId: `${value.payload.payload.blockHash}:${value.payload.payload.logIndex}`,
          type: value.type,
          owner: value.payload.payload.owner,
          level: value.payload.level,
          reason: value.payload.reason,
          erc: value.payload.payload.erc20,
          amount: value.payload.payload.amount,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.payload.blockHash,
          logIndex: value.payload.payload.logIndex,
        };
      case 'Erc721MintingFailed':
        return {
          wrapId: `${value.payload.parameters.blockHash}:${value.payload.parameters.logIndex}`,
          type: value.type,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          reason: value.reason,
          erc: value.payload.parameters.erc721,
          tokenId: value.payload.parameters.tokenId,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.parameters.blockHash,
          logIndex: value.payload.parameters.logIndex,
        };
      default:
        return null;
    }
  }

  private _logger: Logger;
  private _ipfsClient: IpfsClient;
  private _dbClient: Knex;
  private _tezosToolkit: TezosToolkit;
  private _appState: AppState;
  private _signatureDao: SignatureRepository;
  private _wrapDao: WrapRepository;
  private _unwrapDao: UnwrapRepository;
}
