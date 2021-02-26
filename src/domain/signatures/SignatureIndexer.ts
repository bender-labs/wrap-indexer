import { Logger } from 'tslog';
import Knex from 'knex';
import { Signer } from '../tezos/QuorumStorage';
import { IpfsClient } from '../../tools/ipfsClient';
import { parseSignature } from './Signature';

export class SignatureIndexer {
  constructor(logger: Logger, ipfsClient: IpfsClient, dbClient: Knex) {
    this._logger = logger;
    this._ipfsClient = ipfsClient;
    this._dbClient = dbClient;
  }


  async index(): Promise<void> {
    this._logger.info(`Indexing signatures`);
    const signers: Signer[] = await this._dbClient.table('tezos_quorum_signers').where({ active: true });
    for (const signer of signers) {
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

  private async _indexSigner(signer: Signer, transaction: Knex.Transaction): Promise<void> {
    // get and save top signature to only index new stuff
    let cid = await this._resolveIpnsPath('/ipns/' + signer.ipnsKey);
    if (cid != null) {
      do {
        const result = await this._resolveDag(cid);
        if (result != null) {
          await parseSignature(signer, cid.toString(), result.value).save(this._dbClient, transaction);
        }
        cid = result && result.value.parent ? '/ipfs/' + result.value.parent : null;
      } while (cid);
    }
  }

  private async _resolveIpnsPath(path: string): Promise<string | null> {
    try {
      return await this._ipfsClient.resolve(path);
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

}
