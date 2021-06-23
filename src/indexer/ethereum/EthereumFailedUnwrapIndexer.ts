import Knex from 'knex';
import * as _ from 'lodash';
import { ethers } from 'ethers';
import { id } from 'ethers/lib/utils';
import { EthereumConfig } from '../../configuration';
import { Logger } from 'tslog';
import { AppState } from '../state/AppState';
import { Dependencies } from '../../bootstrap';
import { UnwrapRepository } from '../../repository/UnwrapRepository';
import { ERCUnwrap } from '../../domain/ERCUnwrap';

export class EthereumFailedUnwrapIndexer {
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
    this._unwrapDAO = new UnwrapRepository(this._dbClient);
  }

  async index(): Promise<void> {
    const firstBlock = await this._getFirstBlockToIndex();
    const lastBlock = await this._getLastBlockToIndex();
    this._logger.debug(`Indexing failed unwrap events from block ${firstBlock} to block ${lastBlock}`);
    const rawLogs = await this._getLogs(firstBlock, lastBlock);
    this._logger.debug(`${rawLogs.length} failed unwrap events to index`);
    if (rawLogs.length > 0) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        const wrapInterface = new ethers.utils.Interface(this._ethereumConfig.wrapABI);
        const erc20Interface = new ethers.utils.Interface(this._ethereumConfig.erc20ABI);
        for (const rawLog of rawLogs) {
          const transactionWithMoreThanAnExecutionFailureEvent = await this._isTransactionProducedMoreThanAnExecutionFailureEvent(rawLog.transactionHash);
          if (transactionWithMoreThanAnExecutionFailureEvent) {
            this._logger.info(`Can't process failed unwrap ${rawLog.transactionHash} because other events exist`);
          } else {
            const unwrap = await this._parseLog(rawLog, wrapInterface, erc20Interface);
            await this._unwrapDAO.save(unwrap, transaction);
          }
        }
        await this._setLastIndexedBlock(
          lastBlock,
          transaction
        );
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process failed unwrap events ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _getFirstBlockToIndex(): Promise<number> {
    const lastIndexedBlock = await this._appState.getErcFailedUnwrapLastIndexedBlock();
    return lastIndexedBlock
      ? lastIndexedBlock + 1
      : this._ethereumConfig.firstBlockToIndex;
  }

  private async _getLastBlockToIndex(): Promise<number> {
    const lastBlockNumber = await this._ethereumProvider.getBlockNumber();
    return lastBlockNumber - this._ethereumConfig.confirmationsThreshold;
  }

  private async _parseLog(rawLog: ethers.providers.Log, wrapInterface: ethers.utils.Interface, erc20Interface: ethers.utils.Interface): Promise<ERCUnwrap> {
    const relatedTransaction = await this._ethereumProvider.getTransaction(rawLog.transactionHash);
    const parsedTransaction = wrapInterface.parseTransaction(relatedTransaction);
    const transferParameters = erc20Interface.decodeFunctionData('transfer', parsedTransaction.args['data']);
    const tokenContract = parsedTransaction.args['to'];
    const tezosOperation = parsedTransaction.args['tezosOperation'];
    const destination = transferParameters['to'];
    const amount = transferParameters['value'].toString();
    const operationId = `retry:${tezosOperation}`;
    return {
      id: operationId,
      source: destination.toLowerCase(),
      token: tokenContract.toLowerCase(),
      amount: amount,
      ethereumDestination: destination.toLowerCase(),
      operationHash: rawLog.transactionHash,
      level: relatedTransaction.blockNumber,
      status: 'asked',
      type: 'ERC20',
      finalizedAtLevel: null,
    };
  }

  private async _setLastIndexedBlock(
    block: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._appState.setErcFailedUnwrapLastIndexedBlock(block, transaction);
  }

  private async _getLogs(fromBlock: number, toBlock: number): Promise<ethers.providers.Log[]> {
    const filter = this._buildFilters(fromBlock, toBlock);
    return this._ethereumProvider.getLogs(filter);
  }

  private _buildFilters(fromBlock: number, toBlock: number): ethers.providers.Filter {
    return {
      address: this._ethereumConfig.wrapContractAddress,
      fromBlock: fromBlock,
      toBlock: toBlock,
      topics: [EthereumFailedUnwrapIndexer._failureTopics],
    };
  }

  private async _isTransactionProducedMoreThanAnExecutionFailureEvent(transactionHash: string): Promise<boolean> {
    const receipt = await this._ethereumProvider.getTransactionReceipt(transactionHash);
    if (receipt.logs.length > 1) {
      return true;
    }
    const logs = receipt.logs.map(log => EthereumFailedUnwrapIndexer._possibleEventsInterface.parseLog(log));
    return logs.find(l => l.name !== 'ExecutionFailure') !== undefined;
  }

  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
  private _ethereumConfig: EthereumConfig;
  private _appState: AppState;
  private _logger: Logger;
  private _unwrapDAO: UnwrapRepository;

  private static readonly _failureTopics: string[] = [
    id('ExecutionFailure(bytes32)'),
  ];
  private static readonly _possibleEventsInterface: ethers.utils.Interface = new ethers.utils.Interface(
    [
      'event ExecutionFailure(bytes32 txHash)',
      'event ExecutionSuccess(bytes32 txHash)',
      'event Transfer(address from,to address,value uint256)'
    ]
  )
}
