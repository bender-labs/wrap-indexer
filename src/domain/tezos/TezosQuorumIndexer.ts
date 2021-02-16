import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import { TezosToolkit } from '@taquito/taquito';
import Knex from 'knex';
import { extractSigners, QuorumStorage, Signer } from './QuorumStorage';

export class TezosQuorumIndexer {

  constructor(logger: Logger, tezosConfiguration: TezosConfig, tezosToolkit: TezosToolkit, dbClient: Knex) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._dbClient = dbClient;
  }

  async index(): Promise<void> {
    this._logger.info(`Indexing tezos quorum`);
    const contract = await this._tezosToolkit.contract.at(this._tezosConfiguration.quorumContractAddress)
    const storage = await contract.storage<QuorumStorage>();
    let transaction;
    try {
      transaction = await this._dbClient.transaction();
      await this._updateQuorum(storage, transaction);
      await this._updateSigners(storage, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process quorum ${e.message}`)
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private async _updateQuorum(storage: QuorumStorage, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient('tezos_quorum')
      .transacting(transaction)
      .insert({ admin: storage.admin, threshold: storage.threshold.toNumber() })
      .onConflict('admin' as never)
      .merge({ threshold: storage.threshold.toNumber() });
  }

  private async _updateSigners(storage: QuorumStorage, transaction: Knex.Transaction): Promise<void> {
    const signers = extractSigners(storage);
    await this._disableOtherSigners(signers, transaction);
    await this._createOrUpdateSigners(signers, transaction);
  }

  private async _disableOtherSigners(signers: Signer[], transaction: Knex.Transaction): Promise<void> {
    await this._dbClient('tezos_quorum_signers')
      .transacting(transaction)
      .update({ active: false })
      .whereNotIn('public_key', [signers.map<string>(signer => signer.publicKey)]);
  }

  private async _createOrUpdateSigners(signers: Signer[], transaction: Knex.Transaction): Promise<void> {
    for (const signer of signers) {
      await this._dbClient('tezos_quorum_signers')
        .transacting(transaction)
        .insert({ ipnsKey: signer.ipnsKey, publicKey: signer.publicKey, active: true })
        .onConflict('ipns_key' as never)
        .merge({ active: true });
    }
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _tezosToolkit: TezosToolkit;
  private _dbClient: Knex;
}
