import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { BcdProvider, MichelineNode } from '../../infrastructure/tezos/bcdProvider';
import { TezosQuorum } from '../../domain/TezosQuorum';
import { TezosQuorumDao } from '../../dao/TezosQuorumDao';

export class TezosQuorumIndexer {

  constructor(logger: Logger, tezosConfiguration: TezosConfig, bcd: BcdProvider, dbClient: Knex) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._bcd = bcd;
    this._dbClient = dbClient;
  }

  async index(): Promise<void> {
    this._logger.info(`Indexing tezos quorum`);
    let transaction;
    try {
      const storage = await this._bcd.getStorage(this._tezosConfiguration.quorumContractAddress);
      const tezosQuorum = this._extractQuorum(storage);
      transaction = await this._dbClient.transaction();
      await new TezosQuorumDao(this._dbClient).save(tezosQuorum, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process tezos quorum ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private _extractQuorum(storage: MichelineNode): TezosQuorum {
    const admin = storage.children.find(c => c.name == 'admin').value as string;
    const threshold = storage.children.find(c => c.name == 'threshold').value as number;
    const signers = storage.children.find(c => c.name == 'signers').children.map(c => ({
      ipnsKey: c.name,
      publicKey: c.value as string,
      active: true
    }));
    return { admin, threshold, signers };
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _bcd: BcdProvider;
  private _dbClient: Knex;
}
