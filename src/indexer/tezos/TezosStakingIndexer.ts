import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import * as _ from 'lodash';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TezosToolkit } from '@taquito/taquito';
import { BcdProvider } from '../../infrastructure/tezos/bcdProvider';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';

export class TezosStakingIndexer {
  constructor({
    logger,
    tezosConfiguration,
    tezosToolkit,
    bcd,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._bcd = bcd;
    this._dbClient = dbClient;
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing staking reserve contracts`);
    let transaction;
    try {
      const reserveContract = await this._tezosToolkit.contract.at(
        this._tezosConfiguration.stakingReserveContractAddress
      );
      const storage = await reserveContract.storage();
      const farmsBigMapId = storage['farms'].id.toString(10);
      const bigMapValues = await this._bcd.getBigMapContent(farmsBigMapId);
      const contracts = bigMapValues.map((v) => ({
        contract: v.keyString,
        token: _.find(v.value.children, (c) => c.type === 'address').value,
        tokenId: _.find(v.value.children, (c) => c.type === 'nat').value,
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
  private _bcd: BcdProvider;
}
