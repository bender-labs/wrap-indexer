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
    for (const wrap of wraps) {
      if (wrap) {
        await new ErcWrapDAO(this._dbClient).save(wrap, transaction);
      }
    }
  }

  private async _getFirstBlockToIndex(): Promise<number> {
    const lastIndexedBlock = await this._appState.getErcWrapLastIndexedBlock();
    return lastIndexedBlock ? lastIndexedBlock + 1 : this._ethereumConfig.firstBlockToIndex;
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
        source: logDescription.args['user'],
        token: logDescription.args['token'],
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
        source: logDescription.args['user'],
        token: logDescription.args['token'],
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
  private static readonly _wrapTopics: string[] = [id('ERC20WrapAsked(address,address,uint256,string)'), id('ERC721WrapAsked(address,address,uint256,string)')];
  private static readonly _wrapInterface: ethers.utils.Interface = new ethers.utils.Interface(['event ERC20WrapAsked(address user, address token, uint256 amount, string tezosDestinationAddress)', 'event ERC721WrapAsked(address user, address token, uint256 tokenId, string tezosDestinationAddress)']);
}
