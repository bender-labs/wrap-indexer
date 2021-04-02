import { Logger } from 'tslog';
import Knex from 'knex';
import { IpfsClient } from '../../infrastructure/ipfsClient';
import { WrapSignature, UnwrapSignature } from '../../domain/Signature';
import { AppState } from '../state/AppState';
import { TezosSigner } from '../../domain/TezosSigner';
import { SignatureDao } from '../../dao/SignatureDao';
import { TezosQuorumDao } from '../../dao/TezosQuorumDao';
import { Dependencies } from '../../bootstrap';

export class SignatureIndexer {
  constructor({ logger, ipfsClient, dbClient }: Dependencies) {
    this._logger = logger;
    this._ipfsClient = ipfsClient;
    this._dbClient = dbClient;
    this._appState = new AppState(this._dbClient);
    this._signatureDao = new SignatureDao(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.info(`Indexing signatures`);
    const signers = await new TezosQuorumDao(this._dbClient).getActiveSigners();
    for (const signer of signers) {
      this._logger.info(`Indexing signatures of ${signer.ipnsKey}`);
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
          const signature = this._parseSignature(
            signer,
            current.toString(),
            result.value
          );
          await this._signatureDao.save(signature, transaction);
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

  private async _resolveIpnsPath(path: string): Promise<string | null> {
    try {
      return await this._ipfsClient.resolve(path, { timeout: 30 * 1000 });
    } catch (e) {
      this._logger.warn(`Can't resolve ipns path ${path}: ${e.message}`);
      return null;
    }
  }

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
    value: any
  ): WrapSignature | UnwrapSignature {
    if (value.type === 'Erc20MintingSigned') {
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
    } else if (value.type === 'Erc721MintingSigned') {
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
    } else if (value.type === 'Erc20UnwrapSigned') {
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
    } else if (value.type === 'Erc721UnwrapSigned') {
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
    }
    return null;
  }

  private _logger: Logger;
  private _ipfsClient: IpfsClient;
  private _dbClient: Knex;
  private _appState: AppState;
  private _signatureDao: SignatureDao;
}
