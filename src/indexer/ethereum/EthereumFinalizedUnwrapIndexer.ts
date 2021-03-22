import Knex from 'knex';
import { ethers } from 'ethers';
import { id } from 'ethers/lib/utils';
import { EthereumConfig } from '../../configuration';
import { Logger } from 'tslog';
import { ERC20Unwrap, ERC721Unwrap } from '../../domain/ERCUnwrap';
import { ErcUnwrapDAO } from '../../dao/ErcUnwrapDAO';
import { Dependencies } from '../../bootstrap';

export class EthereumFinalizedUnwrapIndexer {

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
    this._unwrapDao = new ErcUnwrapDAO(this._dbClient);
  }

  async index(): Promise<void> {
    const minLevelToCheck = (await this._getNetworkLevel()) - this._ethereumConfig.confirmationsThreshold;
    const contract = new ethers.Contract(this._ethereumConfig.wrapContractAddress, this._ethereumConfig.wrapABI, this._ethereumProvider);
    const erc20Unwraps = await this._unwrapDao.getNotFinalizedERC20();
    erc20Unwraps.concat(await this._unwrapDao.getFinalizedERC20UntilLevel(minLevelToCheck))
    this._logger.info(`${erc20Unwraps.length} pending erc20 unwraps to watch`);
    for (const unwrap of erc20Unwraps) {
      await this._updateUnwrapState(unwrap, contract);
    }
    const erc721Unwraps = await this._unwrapDao.getNotFinalizedERC721();
    erc721Unwraps.concat(await this._unwrapDao.getFinalizedERC721UntilLevel(minLevelToCheck))
    this._logger.info(`${erc721Unwraps.length} pending erc721 unwraps to watch`);
    for (const unwrap of erc721Unwraps) {
      await this._updateUnwrapState(unwrap, contract);
    }
  }

  private async _updateUnwrapState(unwrap: ERC20Unwrap | ERC721Unwrap, contract: ethers.Contract): Promise<void> {
    let transaction;
    try {
      const processed = await contract.isTezosOperationProcessed(unwrap.id);
      if (processed && unwrap.status === 'asked') {
        transaction = await this._dbClient.transaction();
        await this._unwrapDao.setStatus(unwrap, 'finalized', await this._ethereumProvider.getBlockNumber(), transaction);
        await transaction.commit();
      } else if (!processed && unwrap.status === 'finalized') {
        transaction = await this._dbClient.transaction();
        await this._unwrapDao.setStatus(unwrap, 'asked', null, transaction);
        await transaction.commit();
      }
    } catch (e) {
      this._logger.error(`Can't process pending unwrap ${unwrap.id} ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private async _getNetworkLevel(): Promise<number> {
    return this._ethereumProvider.getBlockNumber();
  }

  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
  private _ethereumConfig: EthereumConfig;
  private _logger: Logger;
  private _unwrapDao: ErcUnwrapDAO;
  static readonly wrapTopics: string[] = [id('ERC20WrapAsked(address,address,uint256,string)'), id('ERC721WrapAsked(address,address,uint256,string)')];
  static readonly wrapInterface: ethers.utils.Interface = new ethers.utils.Interface(['event ERC20WrapAsked(address user, address token, uint256 amount, string tezosDestinationAddress)', 'event ERC721WrapAsked(address user, address token, uint256 tokenId, string tezosDestinationAddress)']);
}
