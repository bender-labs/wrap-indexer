import Knex from 'knex';
import { ethers } from 'ethers';
import { id } from 'ethers/lib/utils';
import { EthereumConfig } from '../../configuration';
import { Logger } from 'tslog';
import { ERC20Unwrap, ERC721Unwrap } from '../../domain/ERCUnwrap';
import { ErcUnwrapDAO } from '../../dao/ErcUnwrapDAO';

export class EthereumFinalizedUnwrapIndexer {

  constructor({
                logger,
                ethereumConfiguration,
                ethereumProvider,
                dbClient,
              }: { logger: Logger, ethereumConfiguration: EthereumConfig, ethereumProvider: ethers.providers.Provider, dbClient: Knex }) {
    this._logger = logger;
    this._ethereumConfig = ethereumConfiguration;
    this._ethereumProvider = ethereumProvider;
    this._dbClient = dbClient;
    this._unwrapDao = new ErcUnwrapDAO(this._dbClient);
  }

  async index(): Promise<void> {
    const contract = new ethers.Contract(this._ethereumConfig.wrapContractAddress, this._ethereumConfig.wrapABI, this._ethereumProvider);
    const erc20Unwraps = await this._unwrapDao.getNotFinalizedERC20();
    this._logger.info(`${erc20Unwraps.length} pending erc20 unwraps to watch`);
    for (const unwrap of erc20Unwraps) {
      await this._updateUnwrapState(unwrap, contract);
    }
    const erc721Unwraps = await this._unwrapDao.getNotFinalizedERC721();
    this._logger.info(`${erc721Unwraps.length} pending erc721 unwraps to watch`);
    for (const unwrap of erc721Unwraps) {
      await this._updateUnwrapState(unwrap, contract);
    }
  }

  private async _updateUnwrapState(unwrap: ERC20Unwrap | ERC721Unwrap, contract: ethers.Contract): Promise<void> {
    let transaction;
    try {
      const processed = await contract.isTezosOperationProcessed(unwrap.operationId);
      if (processed) {
        transaction = await this._dbClient.transaction();
        await this._unwrapDao.setAsFinalized(unwrap, transaction);
        await transaction.commit();
      }
    } catch (e) {
      this._logger.error(`Can't process pending unwrap ${unwrap.operationId} ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
  private _ethereumConfig: EthereumConfig;
  private _logger: Logger;
  private _unwrapDao: ErcUnwrapDAO;
  static readonly wrapTopics: string[] = [id('ERC20WrapAsked(address,address,uint256,string)'), id('ERC721WrapAsked(address,address,uint256,string)')];
  static readonly wrapInterface: ethers.utils.Interface = new ethers.utils.Interface(['event ERC20WrapAsked(address user, address token, uint256 amount, string tezosDestinationAddress)', 'event ERC721WrapAsked(address user, address token, uint256 tokenId, string tezosDestinationAddress)']);
}
