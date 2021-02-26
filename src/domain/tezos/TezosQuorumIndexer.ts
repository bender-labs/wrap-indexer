import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import { TezosToolkit } from '@taquito/taquito';
import Knex from 'knex';
import { extractSigners, QuorumStorage } from './QuorumStorage';
import { TezosQuorum } from './TezosQuorum';

export class TezosQuorumIndexer {

  constructor(logger: Logger, tezosConfiguration: TezosConfig, tezosToolkit: TezosToolkit, dbClient: Knex) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._dbClient = dbClient;
  }

  async index(): Promise<void> {
    this._logger.info(`Indexing tezos quorum`);
    let transaction;
    try {
      const contract = await this._tezosToolkit.contract.at(this._tezosConfiguration.quorumContractAddress)
      const storage = await contract.storage<QuorumStorage>();
      transaction = await this._dbClient.transaction();
      const tezosQuorum = await new TezosQuorum(storage.admin, storage.threshold.toNumber(), extractSigners(storage));
      await tezosQuorum.save(this._dbClient, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process tezos quorum ${e.message}`)
      if (transaction) {
        transaction.rollback();
      }
    }
  }
  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _tezosToolkit: TezosToolkit;
  private _dbClient: Knex;
}
