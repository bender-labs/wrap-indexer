import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { BcdProvider } from '../../tools/tezos/bcdProvider';
import { extractQuorum } from './TezosQuorum';

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
      const tezosQuorum = extractQuorum(storage);
      transaction = await this._dbClient.transaction();
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
  private _bcd: BcdProvider;
  private _dbClient: Knex;
}
