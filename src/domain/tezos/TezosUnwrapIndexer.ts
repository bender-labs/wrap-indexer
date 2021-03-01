import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { BcdProvider, Operation, Operations } from '../../tools/tezos/bcdProvider';
import { AppState } from '../AppState';
import { parseERCUnwrap } from './ERCUnwrapAsked';

export class TezosUnwrapIndexer {

  constructor(logger: Logger, tezosConfiguration: TezosConfig, bcd: BcdProvider, dbClient: Knex) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._bcd = bcd;
    this._dbClient = dbClient;
    this._appState = new AppState(dbClient);
  }

  async index(): Promise<void> {
    const lastProcessedOperationId = await this._appState.getErcUnwrapLastOperationId();
    this._logger.info(`Indexing tezos unwraps after operation id ${lastProcessedOperationId ? lastProcessedOperationId : 'none'}`);
    const operations = await this._getOperations(lastProcessedOperationId);
    this._logger.info(`${operations.operations.length} unwraps to index`);
    if (operations.operations.length > 0) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        await this._addOperations(operations.operations, transaction);
        await this._appState.setErcUnwrapLastOperationId(operations.last_id, transaction);
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process tezos unwraps ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _getOperations(lastProcessedOperationId: string): Promise<Operations> {
    const operations = await this._bcd
      .getContractOperations(
        this._tezosConfiguration.minterContractAddress,
        ['unwrap_erc20', 'unwrap_erc721'],
        lastProcessedOperationId);
    return { last_id: operations.last_id, operations: operations.operations.filter(o => o.status == 'applied' && !o.mempool) };
  }

  private async _addOperations(operationsToProcess: Operation[], transaction: Knex.Transaction): Promise<void> {
    for (const operation of operationsToProcess) {
      let operationId = `${operation.hash}/${operation.counter}`;
      if (operation.internal) {
        // TODO get nonce of internal operation
        operationId += `/${0}`
      }
      const unwrap = parseERCUnwrap(operation, operationId);
      if (unwrap) {
        await unwrap.save(this._dbClient, transaction);
      }
    }
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _bcd: BcdProvider;
  private _dbClient: Knex;
  private _appState: AppState;
}
