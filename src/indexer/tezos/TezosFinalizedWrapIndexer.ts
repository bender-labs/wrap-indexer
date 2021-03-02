import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import { BcdProvider } from '../../infrastructure/tezos/bcdProvider';
import Knex from 'knex';
import { ErcWrapDAO } from '../../dao/ErcWrapDAO';

export class TezosFinalizedWrapIndexer {

  constructor(logger: Logger, tezosConfiguration: TezosConfig, bcd: BcdProvider, dbClient: Knex) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._bcd = bcd;
    this._dbClient = dbClient;
    this._wrapDao = new ErcWrapDAO(this._dbClient);
  }

  async index(): Promise<void> {
    const bigmapId = await this._getMintsBigMapId();
    const erc20Wraps = await this._wrapDao.getNotFinalizedERC20();
    this._logger.info(`${erc20Wraps.length} pending erc20 wraps to watch`);
    for (const erc20Wrap of erc20Wraps) {
      console.log(erc20Wrap);
      //
      const result = await this._bcd.getBigMapKey(bigmapId, `expruxZGUzGg3kmX8J9SQdewmeofWdonpEqv3DMf1zUJufC3egyzkJ`);
      console.log(result);
    }
    const erc721Wraps = await this._wrapDao.getNotFinalizedERC721();
    this._logger.info(`${erc721Wraps.length} pending erc721 wraps to watch`);
  }

  async _getMintsBigMapId(): Promise<number> {
    const storage = await this._bcd.getStorage(this._tezosConfiguration.minterContractAddress);
    return storage.children.find(c => c.name === 'assets').children.find(c => c.name === 'mints').value as number;
  }

  /*private async _getOperations(lastProcessedOperationId: string): Promise<Operations> {
    const operations = await this._bcd
      .getContractOperations(
        this._tezosConfiguration.minterContractAddress,
        ['unwrap_erc20', 'unwrap_erc721'],
        lastProcessedOperationId);
    return {
      last_id: operations.last_id,
      operations: operations.operations.filter(o => o.status == 'applied' && !o.mempool),
    };
  }

  private async _addOperations(operationsToProcess: Operation[], transaction: Knex.Transaction): Promise<void> {
    for (const operation of operationsToProcess) {
      let operationId = `${operation.hash}/${operation.counter}`;
      if (operation.internal) {
        // TODO get nonce of internal operation
        operationId += `/${0}`;
      }
      const unwrap = this._parseERCUnwrap(operation, operationId);
      if (unwrap) {
        await new ErcUnwrapDAO(this._dbClient).save(unwrap, transaction);
      }
    }
  }

  private _parseERCUnwrap(operation: Operation, operationId: string): ERC20Unwrap | ERC721Unwrap | null {
    if (operation.entrypoint === 'unwrap_erc20') {
      return {
        id: operation.id,
        source: operation.source,
        token: operation.parameters.children.find(c => c.name == 'erc_20').value as string,
        amount: operation.parameters.children.find(c => c.name == 'amount').value as number,
        ethereumDestination: operation.parameters.children.find(c => c.name == 'destination').value as string,
        operationId,
        status: 'asked',
      };
    } else if (operation.entrypoint === 'unwrap_erc721') {
      return {
        id: operation.id,
        source: operation.source,
        token: operation.parameters.children.find(c => c.name == 'erc_721').value as string,
        tokenId: operation.parameters.children.find(c => c.name == 'token_id').value as number,
        ethereumDestination: operation.parameters.children.find(c => c.name == 'destination').value as string,
        operationId,
        status: 'asked',
      };
    }
    return null;
  }*/

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _bcd: BcdProvider;
  private _wrapDao: ErcWrapDAO;
  private _dbClient: Knex;
}
