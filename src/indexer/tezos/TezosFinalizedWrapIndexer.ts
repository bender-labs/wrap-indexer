import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { WrapDAO } from '../../dao/WrapDAO';
import { ERCWrap } from '../../domain/ERCWrap';
import { Dependencies } from '../../bootstrap';
import { TezosToolkit } from '@taquito/taquito';

export class TezosFinalizedWrapIndexer {
  constructor({
    logger,
    tezosConfiguration,
    tezosToolkit,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._dbClient = dbClient;
    this._wrapDao = new WrapDAO(this._dbClient);
  }

  async index(): Promise<void> {
    const minLevelToCheck =
      (await this._getNetworkLevel()) -
      this._tezosConfiguration.confirmationsThreshold;
    const mintsBigMap = await this._getMintsBigMap();
    const wraps = await this._wrapDao.getNotFinalized();
    wraps.concat(await this._wrapDao.getFinalizedUntilLevel(minLevelToCheck));
    this._logger.debug(`${wraps.length} pending wraps to watch`);
    for (const wrap of wraps) {
      const minted = await this._isInMintsMap(
        mintsBigMap,
        wrap.blockHash,
        wrap.logIndex
      );
      if (minted != null) {
        await this._updateWrapState(wrap, minted);
      }
    }
  }

  private async _isInMintsMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bigMap: any,
    blockHash: string,
    logIndex: number
  ): Promise<boolean | null> {
    try {
      const value = await bigMap.get({
        block_hash: blockHash.replace('0x', ''),
        log_index: logIndex.toString(),
      });
      return value !== undefined;
    } catch (e) {
      this._logger.error(`Can't get mints big map key ${e.message}`);
      return null;
    }
  }

  private async _updateWrapState(
    wrap: ERCWrap,
    minted: boolean
  ): Promise<void> {
    let transaction;
    try {
      if (minted && wrap.status === 'asked') {
        transaction = await this._dbClient.transaction();
        await this._wrapDao.setStatus(
          wrap,
          'finalized',
          await this._getNetworkLevel(),
          transaction
        );
        await transaction.commit();
      } else if (!minted && wrap.status === 'finalized') {
        transaction = await this._dbClient.transaction();
        await this._wrapDao.setStatus(wrap, 'asked', null, transaction);
        await transaction.commit();
      }
    } catch (e) {
      this._logger.error(
        `Can't process pending wrap ${wrap.transactionHash} ${e.message}`
      );
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _getMintsBigMap(): Promise<any> {
    const minterContract = await this._tezosToolkit.contract.at(
      this._tezosConfiguration.minterContractAddress
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = await minterContract.storage<any>();
    return storage['assets']['mints'];
  }

  private async _getNetworkLevel(): Promise<number> {
    const block = await this._tezosToolkit.rpc.getBlockHeader();
    return block.level;
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _tezosToolkit: TezosToolkit;
  private _wrapDao: WrapDAO;
  private _dbClient: Knex;
}
