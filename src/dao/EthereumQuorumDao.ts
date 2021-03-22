import Knex from 'knex';
import { EthereumQuorum } from '../domain/EthereumQuorum';

export class EthereumQuorumDao {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(quorum: EthereumQuorum, transaction: Knex.Transaction): Promise<void> {
    await this._saveQuorum(quorum, transaction);
    await this._disableOtherSigners(quorum, transaction);
    for (const signer of quorum.signers) {
      await this._saveSigner(signer, transaction);
    }
  }

  private async _saveQuorum(quorum: EthereumQuorum, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('ethereum_quorum')
      .transacting(transaction)
      .insert({ admin: quorum.admin, threshold: quorum.threshold })
      .onConflict('admin' as never)
      .merge({ threshold: quorum.threshold });
  }

  private async _disableOtherSigners(quorum: EthereumQuorum, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('ethereum_quorum_signers')
      .transacting(transaction)
      .update({ active: false })
      .whereNotIn('address', quorum.signers);
  }

  private async _saveSigner(signer: string, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('ethereum_quorum_signers')
      .transacting(transaction)
      .insert({ address: signer, active: true })
      .onConflict('address' as never)
      .merge({ active: true });
  }

  async getThreshold(): Promise<number> {
    const quorum = await this._dbClient.table<EthereumQuorum>('ethereum_quorum').first();
    return quorum?.threshold;
  }

  private _dbClient: Knex;
}
