import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TezosToolkit } from '@taquito/taquito';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { TzktProvider } from '../../infrastructure/tezos/tzktProvider';

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

  async index(): Promise<void> {
    this._logger.debug(`Indexing staking contracts`);
    let transaction;
    try {
      const reserveContract = await this._tezosToolkit.contract.at(
        this._tezosConfiguration.stakingReserveContractAddress
      );
      const storage = await reserveContract.storage();
      const farmsBigMapId = storage['farms'].id.toString(10);
      const bigMapValues = await this._tzkt.getBigMapContent(farmsBigMapId);
      const contracts = bigMapValues.map((v) => ({
        contract: v.keyString,
        token: v.value.address,
        tokenId: v.value.nat,
      }));
      transaction = await this._dbClient.transaction();
      await new TezosStakingContractsRepository(this._dbClient).saveAll(
        contracts,
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
