import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { BcdProvider, Operation } from '../../infrastructure/tezos/bcdProvider';
import { AppState } from '../state/AppState';
import { ERCUnwrap } from '../../domain/ERCUnwrap';
import { ErcUnwrapDAO } from '../../dao/ErcUnwrapDAO';
import { Dependencies } from '../../bootstrap';

export class TezosInitialUnwrapIndexer {
  constructor({ logger, tezosConfiguration, bcd, dbClient }: Dependencies) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._bcd = bcd;
    this._dbClient = dbClient;
    this._appState = new AppState(dbClient);
    this._unwrapDAO = new ErcUnwrapDAO(dbClient);
  }

  async index(): Promise<void> {
    const maxLevelProcessed = await this._appState.getErcUnwrapLevelProcessed();
    const minLevelToProcess = maxLevelProcessed
      ? maxLevelProcessed - this._tezosConfiguration.confirmationsThreshold
      : null;
    this._logger.info(`Indexing tezos unwraps from level ${minLevelToProcess}`);
    const operations = await this._getAllOperationsUntilLevel(
      minLevelToProcess
    );
    if (operations.length > 0) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        await this._addOperations(operations, transaction);
        await this._appState.setErcUnwrapLevelProcessed(
          operations[0].level,
          transaction
        );
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process tezos unwraps ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _getAllOperationsUntilLevel(
    level: number
  ): Promise<Operation[]> {
    const operations: Operation[] = [];
    let lastProcessedId = undefined;
    let inProgress = true;
    do {
      const currentOperations = await this._bcd.getContractOperations(
        this._tezosConfiguration.minterContractAddress,
        ['unwrap_erc20', 'unwrap_erc721'],
        lastProcessedId
      );
      if (
        currentOperations.operations.length === 0 ||
        currentOperations.operations[currentOperations.operations.length - 1]
          .level < level
      ) {
        inProgress = false;
      } else {
        lastProcessedId = currentOperations.last_id;
      }
      operations.push(
        ...currentOperations.operations.filter(
          (o) => o.status == 'applied' && !o.mempool && o.level >= level
        )
      );
    } while (inProgress);
    return operations;
  }

  private async _addOperations(
    operationsToProcess: Operation[],
    transaction: Knex.Transaction
  ): Promise<void> {
    const unwraps = operationsToProcess.map((operation) => {
      let operationId = `${operation.hash}/${operation.counter}`;
      if (operation.internal) {
        // TODO get nonce of internal operation
        operationId += `/${0}`;
      }
      return this._parseERCUnwrap(operation, operationId);
    });
    await this._ensureExistingUnwrapsAreOnTheRightChain(unwraps, transaction);
    for (const unwrap of unwraps) {
      const existingUnwrap = await this._unwrapDAO.isExist(unwrap, transaction);
      if (!existingUnwrap) {
        await this._unwrapDAO.save(unwrap, transaction);
      }
    }
  }

  private async _ensureExistingUnwrapsAreOnTheRightChain(
    unwraps: ERCUnwrap[],
    transaction: Knex.Transaction
  ) {
    const operationsHashAndLevel = unwraps.map((w) => ({
      level: w.level,
      operationHash: w.operationHash,
    }));
    for (const operationHashAndBlockLevel of operationsHashAndLevel) {
      const existingUnwraps: ERCUnwrap[] = await this._unwrapDAO.getByOperationHash(
        operationHashAndBlockLevel.operationHash
      );
      const unwrapsOnWrongChain = existingUnwraps.filter(
        (w) =>
          w.level.toString() !== operationHashAndBlockLevel.level.toString()
      );
      if (unwrapsOnWrongChain.length > 0) {
        this._logger.info(
          `Unwraps found on a different block, removing unwraps ${unwrapsOnWrongChain.map(
            (w) => w.id
          )}`
        );
        await this._unwrapDAO.remove(unwrapsOnWrongChain, transaction);
      }
    }
  }

  private _parseERCUnwrap(
    operation: Operation,
    operationId: string
  ): ERCUnwrap {
    if (operation.entrypoint === 'unwrap_erc20') {
      return {
        id: operationId,
        source: operation.source,
        token:
          '0x' +
          operation.parameters[0].children.find((c) => c.name == 'erc_20')
            .value,
        amount: operation.parameters[0].children.find((c) => c.name == 'amount')
          .value as string,
        ethereumDestination:
          '0x' +
          (operation.parameters[0].children.find((c) => c.name == 'destination')
            .value as string).toLowerCase(),
        operationHash: operation.hash,
        level: operation.level,
        status: 'asked',
        type: 'ERC20',
        finalizedAtLevel: null,
      };
    }
    return {
      id: operationId,
      source: operation.source,
      token:
        '0x' +
        operation.parameters[0].children.find((c) => c.name == 'erc_721').value,
      tokenId: operation.parameters[0].children.find(
        (c) => c.name == 'token_id'
      ).value as string,
      ethereumDestination:
        '0x' +
        (operation.parameters[0].children.find((c) => c.name == 'destination')
          .value as string).toLowerCase(),
      operationHash: operation.hash,
      level: operation.level,
      status: 'asked',
      type: 'ERC721',
      finalizedAtLevel: null,
    };
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _bcd: BcdProvider;
  private _dbClient: Knex;
  private _appState: AppState;
  private _unwrapDAO: ErcUnwrapDAO;
}
