import { Logger } from 'tslog';
import { EthereumConfig } from '../../configuration';
import Knex from 'knex';
import { ethers } from 'ethers';
import { EthereumQuorumDao } from '../../dao/EthereumQuorumDao';
import { Dependencies } from '../../bootstrap';

export class EthereumQuorumIndexer {
  constructor({
    logger,
    ethereumConfiguration,
    ethereumProvider,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._ethereumConfiguration = ethereumConfiguration;
    this._ethereumProvider = ethereumProvider;
    this._dbClient = dbClient;
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing ethereum quorum`);
    let transaction;
    try {
      const contract = new ethers.Contract(
        this._ethereumConfiguration.wrapContractAddress,
        this._ethereumConfiguration.wrapABI,
        this._ethereumProvider
      );
      const administrator = await contract.getAdministrator();
      const threshold = await contract.getThreshold();
      const signers = await contract.getOwners();
      transaction = await this._dbClient.transaction();
      await new EthereumQuorumDao(this._dbClient).save(
        {
          admin: administrator,
          threshold: threshold.toNumber(),
          signers,
        },
        transaction
      );
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process ethereum quorum ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private _logger: Logger;
  private _ethereumConfiguration: EthereumConfig;
  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
}
