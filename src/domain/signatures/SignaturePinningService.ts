import { Logger } from 'tslog';
import Knex from 'knex';
import { IpfsClient } from '../../tools/ipfsClient';
import { AppState } from '../AppState';
import { TezosSigner } from '../tezos/TezosSigner';

export class SignaturePinningService {
  constructor(logger: Logger, ipfsClient: IpfsClient, dbClient: Knex) {
    this._logger = logger;
    this._ipfsClient = ipfsClient;
    this._dbClient = dbClient;
    this._appState = new AppState(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.info(`Pinning signatures`);
    const signers: TezosSigner[] = await this._dbClient.table('tezos_quorum_signers').where({ active: true });
    for (const signer of signers) {
      this._logger.info(`Pinning signatures of ${signer.ipnsKey}`);
      try {
        await this._pinSignatureOf(signer);
      } catch (e) {
        this._logger.error(`Can't pin signatures ${e.message}`);
      }
    }
  }

  private async _pinSignatureOf(signer: TezosSigner): Promise<void> {
    const cid = await this._appState.getLastIndexedSignature(signer.ipnsKey);
    if (cid != null) {
      await this._ipfsClient.pin.add(cid);
    }
  }
  private _logger: Logger;
  private _ipfsClient: IpfsClient;
  private _dbClient: Knex;
  private _appState: AppState;
}
