import Knex from 'knex';
import { Signer } from './QuorumStorage';

export class TezosQuorum {
  constructor(admin: string, threshold: number) {
    this.threshold = threshold;
    this.admin = admin;
  }

  addSigner(signer: Signer): void {
    this.signers.push(signer);
  }

  async save(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await this._saveQuorum(dbClient, transaction);
    await this._disableOtherSigners(dbClient, transaction);
    for(const signer of this.signers) {
      await this._saveSigner(signer, dbClient, transaction);
    }
  }

  async _saveQuorum(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('tezos_quorum')
      .transacting(transaction)
      .insert({ admin: this.admin, threshold: this.threshold })
      .onConflict('admin' as never)
      .merge({ threshold: this.threshold });
  }

  async _disableOtherSigners(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('tezos_quorum_signers')
      .transacting(transaction)
      .update({ active: false })
      .whereNotIn('public_key', this.signers.map<string>(s => s.publicKey));
  }

  async _saveSigner(signer: Signer, dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('tezos_quorum_signers')
      .transacting(transaction)
      .insert({ ipnsKey: signer.ipnsKey, publicKey: signer.publicKey, active: true })
      .onConflict('ipns_key' as never)
      .merge({ active: true });
  }

  admin: string;
  threshold: number;
  signers: Signer[] = [];
}
