import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TezosToolkit } from '@taquito/taquito';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { TzktProvider } from '../../infrastructure/tezos/tzktProvider';
import { TezosStakingContract } from '../../domain/TezosStakingContract';

export class TezosStakingContractsIndexer {
  constructor({
    logger,
    tezosConfiguration,
    tezosToolkit,
    tzkt,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._tzkt = tzkt;
    this._dbClient = dbClient;
  }

  private async getContracts(reserveAddress: string, old: boolean): Promise<TezosStakingContract[]> {
    const reserveContract = await this._tezosToolkit.contract.at(
      reserveAddress
    );
    const storage = await reserveContract.storage();
    const farmsBigMapId = storage['farms'].id.toString(10);
    const bigMapValues = await this._tzkt.getBigMapContent(farmsBigMapId);
    return bigMapValues.map((v) => ({
      contract: v.keyString,
      token: v.value.address,
      tokenId: v.value.nat,
      old
    }));
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing staking contracts`);
    let transaction;
    try {
      const oldContracts = await this.getContracts(this._tezosConfiguration.stakingOldReserveContractAddress, true);
      const newContracts = await this.getContracts(this._tezosConfiguration.stakingNewReserveContractAddress, false);
      transaction = await this._dbClient.transaction();
      await new TezosStakingContractsRepository(this._dbClient).saveAll(
        oldContracts.concat(newContracts),
        transaction
      );
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process tezos staking contracts ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _dbClient: Knex;
  private _tezosToolkit: TezosToolkit;
  private _tzkt: TzktProvider;
}
