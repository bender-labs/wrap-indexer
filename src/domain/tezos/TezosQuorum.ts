import Knex from 'knex';
import { MichelineNode } from '../../tools/tezos/bcdProvider';
import { TezosSigner } from './TezosSigner';

export class TezosQuorum {
  constructor(admin: string, threshold: number, signers: TezosSigner[]) {
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

  async _saveSigner(signer: TezosSigner, dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('tezos_quorum_signers')
      .transacting(transaction)
      .insert({ ipnsKey: signer.ipnsKey, publicKey: signer.publicKey, active: true })
      .onConflict('ipns_key' as never)
      .merge({ active: true });
  }

  admin: string;
  threshold: number;
  signers: TezosSigner[];
}

export function extractQuorum(storage: MichelineNode): TezosQuorum {
  const admin = storage.children.find(c => c.name == 'admin').value as string;
  const threshold = storage.children.find(c => c.name == 'threshold').value as number;
  const signers = storage.children.find(c => c.name == 'signers').children.map(c => ({ipnsKey: c.name, publicKey: c.value as string}));
  return new TezosQuorum(admin, threshold, signers);
}
