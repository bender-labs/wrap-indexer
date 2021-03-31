import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { ErcWrapDAO } from '../../dao/ErcWrapDAO';
import { ERC20Wrap, ERC721Wrap } from '../../domain/ERCWrap';
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
    this._wrapDao = new ErcWrapDAO(this._dbClient);
  }

  async index(): Promise<void> {
    const minLevelToCheck =
      (await this._getNetworkLevel()) -
      this._tezosConfiguration.confirmationsThreshold;
    const mintsBigMap = await this._getMintsBigMap();
    const erc20Wraps = await this._wrapDao.getNotFinalizedERC20();
    erc20Wraps.concat(
      await this._wrapDao.getFinalizedERC20UntilLevel(minLevelToCheck)
    );
    this._logger.info(`${erc20Wraps.length} pending erc20 wraps to watch`);
    for (const erc20wrap of erc20Wraps) {
      const minted = await this._isInMintsMap(
        mintsBigMap,
        erc20wrap.blockHash,
        erc20wrap.logIndex
      );
      if (minted != null) {
        await this._updateWrapState(erc20wrap, minted);
      }
    }
    const erc721Wraps = await this._wrapDao.getNotFinalizedERC721();
    erc721Wraps.concat(
      await this._wrapDao.getFinalizedERC721UntilLevel(minLevelToCheck)
    );
    this._logger.info(`${erc721Wraps.length} pending erc721 wraps to watch`);
    for (const erc721wrap of erc721Wraps) {
      const minted = await this._isInMintsMap(
        mintsBigMap,
        erc721wrap.blockHash,
        erc721wrap.logIndex
      );
      if (minted != null) {
        await this._updateWrapState(erc721wrap, minted);
      }
    }
  }

  private async _isInMintsMap(
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
    wrap: ERC20Wrap | ERC721Wrap,
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

  private async _getMintsBigMap(): Promise<any> {
    const minterContract = await this._tezosToolkit.contract.at(
      this._tezosConfiguration.minterContractAddress
    );
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
  private _wrapDao: ErcWrapDAO;
  private _dbClient: Knex;
}
