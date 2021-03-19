import Knex from 'knex';
import * as _ from 'lodash';
import { ethers } from 'ethers';
import { id } from 'ethers/lib/utils';
import { ERC20Wrap, ERC721Wrap } from '../../domain/ERCWrap';
import { EthereumConfig } from '../../configuration';
import { Logger } from 'tslog';
import { AppState } from '../state/AppState';
import { ErcWrapDAO } from '../../dao/ErcWrapDAO';
import { Dependencies } from '../../bootstrap';

export class EthereumInitialWrapIndexer {

  constructor({
                logger,
                ethereumConfiguration,
                ethereumProvider,
                dbClient,
              }: Dependencies) {
    this._logger = logger;
    this._ethereumConfig = ethereumConfiguration;
    this._ethereumProvider = ethereumProvider;
    this._dbClient = dbClient;
    this._appState = new AppState(this._dbClient);
    this._wrapDAO = new ErcWrapDAO(this._dbClient);
  }

  async index(): Promise<void> {
    const firstBlock = await this._getFirstBlockToIndex();
    this._logger.info(`Indexing new wrap events from block ${firstBlock}`);
    const rawLogs = await this._getLogs(firstBlock);
    this._logger.info(`${rawLogs.length} wrap events to index`);
    if (rawLogs.length > 0) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        await this._addEvents(rawLogs, transaction);
        await this._setLastIndexedBlock(_.maxBy(rawLogs, log => log.blockNumber).blockNumber, transaction);
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process wrap events ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _addEvents(rawLogs: ethers.providers.Log[], transaction: Knex.Transaction) {
    const wraps = rawLogs.map(log => EthereumInitialWrapIndexer._parseERCLog(log));
    await this._ensureExistingWrapsAreOnTheRightChain(wraps, transaction);
    for (const wrap of wraps) {
      if (wrap) {
        const exist = await this._wrapDAO.isExist(wrap, transaction);
        if (!exist) {
          await this._wrapDAO.save(wrap, transaction);
        }
      }
    }
  }

  private async _ensureExistingWrapsAreOnTheRightChain(wraps: (ERC20Wrap | ERC721Wrap)[], transaction: Knex.Transaction) {
    const transactionsHashAndBlockLevel = wraps.map(w => ({blockHash: w.blockHash, logIndex: w.logIndex, transactionHash: w.transactionHash}));
    for (const transactionHashAndBlockLevel of transactionsHashAndBlockLevel) {
      const existingWraps : (ERC20Wrap | ERC721Wrap)[] = await this._wrapDAO.getERC20ByTransactionHash(transactionHashAndBlockLevel.transactionHash);
      existingWraps.concat(await this._wrapDAO.getERC721ByTransactionHash(transactionHashAndBlockLevel.transactionHash));
      const wrapsOnWrongChain = existingWraps.filter(w => w.blockHash !== transactionHashAndBlockLevel.blockHash || w.logIndex.toString() !== transactionHashAndBlockLevel.logIndex.toString());
      if (wrapsOnWrongChain.length > 0) {
        this._logger.info(`Wraps found on a different block, removing wraps ${wrapsOnWrongChain.map(w => w.id)}`);
        await this._wrapDAO.remove(wrapsOnWrongChain, transaction);
      }
    }
  }

  private async _getFirstBlockToIndex(): Promise<number> {
    const lastIndexedBlock = await this._appState.getErcWrapLastIndexedBlock();
    return lastIndexedBlock ? lastIndexedBlock - this._ethereumConfig.confirmationsThreshold + 1 : this._ethereumConfig.firstBlockToIndex;
  }

  private async _setLastIndexedBlock(block: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setErcWrapLastIndexedBlock(block, transaction);
  }

  private async _getLogs(fromBlock: number): Promise<ethers.providers.Log[]> {
    const filter = this._buildFilters(fromBlock);
    return this._ethereumProvider.getLogs(filter);
  }

  private _buildFilters(fromBlock: number): ethers.providers.Filter {
    return {
      address: this._ethereumConfig.wrapContractAddress,
      fromBlock: fromBlock,
      toBlock: 'latest',
      topics: [
        EthereumInitialWrapIndexer._wrapTopics,
      ],
    };
  }

  private static _parseERCLog(log: ethers.providers.Log): ERC20Wrap | ERC721Wrap | null {
    const logDescription = EthereumInitialWrapIndexer._wrapInterface.parseLog(log);
    if (logDescription.name === 'ERC20WrapAsked') {
      return {
        id: `${log.blockHash}:${log.logIndex}`,
        source: logDescription.args['user'].toLowerCase(),
        token: logDescription.args['token'].toLowerCase(),
        amount: logDescription.args['amount'].toString(),
        tezosDestination: logDescription.args['tezosDestinationAddress'],
        transactionHash: log.transactionHash,
        blockHash: log.blockHash,
        logIndex: log.logIndex,
        level: log.blockNumber,
        status: 'asked',
      };
    } else if (logDescription.name === 'ERC721WrapAsked') {
      return {
        id: `${log.blockHash}:${log.logIndex}`,
        source: logDescription.args['user'].toLowerCase(),
        token: logDescription.args['token'].toLowerCase(),
        tokenId: logDescription.args['tokenId'].toString(),
        tezosDestination: logDescription.args['tezosDestinationAddress'],
        transactionHash: log.transactionHash,
        blockHash: log.blockHash,
        logIndex: log.logIndex,
        level: log.blockNumber,
        status: 'asked',
      };
    }
    return null;
  }

  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
  private _ethereumConfig: EthereumConfig;
  private _appState: AppState;
  private _logger: Logger;
  private _wrapDAO: ErcWrapDAO;
  private static readonly _wrapTopics: string[] = [id('ERC20WrapAsked(address,address,uint256,string)'), id('ERC721WrapAsked(address,address,uint256,string)')];
  private static readonly _wrapInterface: ethers.utils.Interface = new ethers.utils.Interface(['event ERC20WrapAsked(address user, address token, uint256 amount, string tezosDestinationAddress)', 'event ERC721WrapAsked(address user, address token, uint256 tokenId, string tezosDestinationAddress)']);
}
