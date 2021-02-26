import Knex from 'knex';

export class EthereumQuorum {
  constructor(admin: string, threshold: number, signers: string[]) {
    this.threshold = threshold;
    this.admin = admin;
    this.signers = signers;
  }

  async save(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await this._saveQuorum(dbClient, transaction);
    await this._disableOtherSigners(dbClient, transaction);
    for(const signer of this.signers) {
      await this._saveSigner(signer, dbClient, transaction);
    }
  }

  async _saveQuorum(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('ethereum_quorum')
      .transacting(transaction)
      .insert({ admin: this.admin, threshold: this.threshold })
      .onConflict('admin' as never)
      .merge({ threshold: this.threshold });
  }

  async _disableOtherSigners(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('ethereum_quorum_signers')
      .transacting(transaction)
      .update({ active: false })
      .whereNotIn('address', this.signers);
  }

  async _saveSigner(signer: string, dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('ethereum_quorum_signers')
      .transacting(transaction)
      .insert({ address: signer, active: true })
      .onConflict('address' as never)
      .merge({ active: true });
  }

  admin: string;
  threshold: number;
  signers: string[];
}
