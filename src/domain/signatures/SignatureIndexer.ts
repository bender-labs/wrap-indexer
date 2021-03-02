import { Logger } from 'tslog';
import Knex from 'knex';
import { IpfsClient } from '../../tools/ipfsClient';
import { parseSignature } from './Signature';
import { AppState } from '../AppState';
import { TezosSigner } from '../tezos/TezosSigner';

export class SignatureIndexer {
  constructor(logger: Logger, ipfsClient: IpfsClient, dbClient: Knex) {
    this._logger = logger;
    this._ipfsClient = ipfsClient;
    this._dbClient = dbClient;
    this._appState = new AppState(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.info(`Indexing signatures`);
    const signers: TezosSigner[] = await this._dbClient.table('tezos_quorum_signers').where({ active: true });
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

  private async _indexSigner(signer: TezosSigner, transaction: Knex.Transaction): Promise<void> {
    const cid = await this._resolveIpnsPath('/ipns/' + signer.ipnsKey);
    const lastIndexedSignature = await this._appState.getLastIndexedSignature(signer.ipnsKey);
    if (cid != null && cid != lastIndexedSignature) {
      let current = cid;
      do {
        const result = await this._resolveDag(current);
        if (result != null) {
          const signature = parseSignature(signer, current.toString(), result.value);
          await signature.save(this._dbClient, transaction);
        }
        current = result && result.value.parent ? '/ipfs/' + result.value.parent : null;
      } while (current && current != lastIndexedSignature);
      await this._appState.setLastIndexedSignature(signer.ipnsKey, cid.toString(), transaction);
    }
  }

  private async _resolveIpnsPath(path: string): Promise<string | null> {
    try {
      return await this._ipfsClient.resolve(path, {timeout: 30 * 1000});
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

  private _logger: Logger;
  private _ipfsClient: IpfsClient;
  private _dbClient: Knex;
  private _appState: AppState;
}
