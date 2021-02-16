import Knex from 'knex';
import * as _ from 'lodash';
import { ethers } from 'ethers';
import { id } from 'ethers/lib/utils';
import { buildERCEvent } from './ERCWrapAsked';
import { EthereumConfig } from '../../configuration';
import { Logger } from 'tslog';
import { AppState } from '../AppState';

export class EthereumWrapIndexer {
  constructor(logger: Logger, ethereumConfig: EthereumConfig, ethereumProvider: ethers.providers.Provider, dbClient: Knex) {
    this._logger = logger;
    this._ethereumConfig = ethereumConfig;
    this._ethereumProvider = ethereumProvider;
    this._dbClient = dbClient;
    this._appState = new AppState(this._dbClient);
  }

  async index(): Promise<void> {
    const firstBlock = await this._getFirstBlockToIndex()
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
        this._logger.error(`Can't process wrap events ${e.message}`)
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _addEvents(rawLogs: ethers.providers.Log[], transaction) {
    const domainObjects = rawLogs.map(log => buildERCEvent(log, EthereumWrapIndexer.wrapInterface));
    for (const domainObject of domainObjects) {
      await this._dbClient(domainObject.table()).transacting(transaction).insert(domainObject);
    }
  }

  private async _getFirstBlockToIndex(): Promise<number> {
    const result = await this._appState.getValue('ercWraps');
    return result ? (+(result.value) + 1) : this._ethereumConfig.firstBlockToIndex;
  }

  private async _setLastIndexedBlock(block: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setValue({key: 'ercWraps', value: block.toString()}, transaction);
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
        EthereumWrapIndexer.wrapTopics,
      ],
    };
  }

  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
  private _ethereumConfig: EthereumConfig;
  private _appState: AppState;
  static readonly wrapTopics: string[] = [id('ERC20WrapAsked(address,address,uint256,string)'), id('ERC721WrapAsked(address,address,uint256,string)')];
  _logger: Logger;
  static readonly wrapInterface: ethers.utils.Interface = new ethers.utils.Interface(['event ERC20WrapAsked(address user, address token, uint256 amount, string tezosDestinationAddress)', 'event ERC721WrapAsked(address user, address token, uint256 tokenId, string tezosDestinationAddress)']);
}
