import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { TezosQuorum } from '../../domain/TezosQuorum';
import { TezosQuorumRepository } from '../../repository/TezosQuorumRepository';
import { Dependencies } from '../../bootstrap';
import { TezosToolkit } from '@taquito/taquito';

export class TezosQuorumIndexer {
  constructor({
    logger,
    tezosConfiguration,
    tezosToolkit,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._dbClient = dbClient;
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing tezos quorum`);
    let transaction;
    try {
      const quorumContract = await this._tezosToolkit.contract.at(
        this._tezosConfiguration.quorumContractAddress
      );
      const quorumStorage = await quorumContract.storage();
      const tezosQuorum = this._extractQuorum(quorumStorage);
      transaction = await this._dbClient.transaction();
      await new TezosQuorumRepository(this._dbClient).save(
        tezosQuorum,
        transaction
      );
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process tezos quorum ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _extractQuorum(storage: any): TezosQuorum {
    const admin = storage['admin'];
    const threshold = storage['threshold'].toNumber();
    const signers = [];
    for (const entry of storage['signers'].entries()) {
      signers.push({
        ipnsKey: entry[0],
        publicKey: entry[1],
        active: true,
      });
    }
    return { admin, threshold, signers };
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _dbClient: Knex;
  private _tezosToolkit: TezosToolkit;
}
