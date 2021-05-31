import Knex from 'knex';
import { TezosSigner } from '../domain/TezosSigner';
import { TezosQuorum } from '../domain/TezosQuorum';

export class TezosQuorumRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(
    quorum: TezosQuorum,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._saveQuorum(quorum, transaction);
    await this._disableOtherSigners(quorum, transaction);
    for (const signer of quorum.signers) {
      await this._saveSigner(signer, transaction);
    }
  }

  private async _saveQuorum(
    quorum: TezosQuorum,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('tezos_quorum')
      .transacting(transaction)
      .insert({ admin: quorum.admin, threshold: quorum.threshold })
      .onConflict('admin' as never)
      .merge({ threshold: quorum.threshold });
  }

  private async _disableOtherSigners(
    quorum: TezosQuorum,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('tezos_quorum_signers')
      .transacting(transaction)
      .update({ active: false })
      .whereNotIn(
        'public_key',
        quorum.signers.map<string>((s) => s.publicKey)
      );
  }

  private async _saveSigner(
    signer: TezosSigner,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('tezos_quorum_signers')
      .transacting(transaction)
      .insert(signer)
      .onConflict('ipns_key' as never)
      .merge({ active: true });
  }

  async getActiveSigners(): Promise<TezosSigner[]> {
    return this._dbClient
      .table<TezosSigner>('tezos_quorum_signers')
      .where({ active: true });
  }

  async getThreshold(): Promise<number> {
    const quorum = await this._dbClient
      .table<TezosQuorum>('tezos_quorum')
      .first();
    return quorum?.threshold;
  }

  private _dbClient: Knex;
}
