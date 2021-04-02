import { Logger } from 'tslog';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TezosToolkit } from '@taquito/taquito';
import { Fees } from '../../domain/Fees';
import { FeesDao } from '../../dao/FeesDao';

export class FeesIndexer {
  constructor({
    logger,
    tezosToolkit,
    tezosConfiguration,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._tezosToolkit = tezosToolkit;
    this._minterContractAddress = tezosConfiguration.minterContractAddress;
    this._feesDAO = new FeesDao(dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing fees`);
    const fees = await this._getFees();
    let transaction;
    try {
      transaction = await this._dbClient.transaction();
      await this._feesDAO.save(fees, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process fees ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  async _getFees(): Promise<Fees> {
    const minterContract = await this._tezosToolkit.contract.at(
      this._minterContractAddress
    );
    const storage = await minterContract.storage();
    const fees = storage['governance'];
    return {
      erc20UnwrappingFees: fees['erc20_unwrapping_fees'].toNumber(),
      erc20WrappingFees: fees['erc20_wrapping_fees'].toNumber(),
      erc721UnwrappingFees: fees['erc721_unwrapping_fees'].toNumber(),
      erc721WrappingFees: fees['erc721_wrapping_fees'].toNumber(),
    };
  }

  private _logger: Logger;
  private _dbClient: Knex;
  private _minterContractAddress: string;
  private _tezosToolkit: TezosToolkit;
  private _feesDAO: FeesDao;
}
