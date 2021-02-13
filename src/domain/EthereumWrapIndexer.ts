import Knex from 'knex';
import { ethers } from 'ethers';
import { id } from 'ethers/lib/utils';
import { buildERCEvent } from './ERCWrapped';

export class EthereumWrapIndexer {
  constructor(wrapContractAddress: string, ethereumProvider: ethers.providers.Provider, dbClient: Knex) {
    this._wrapContractAddress = wrapContractAddress;
    this._ethereumProvider = ethereumProvider;
    this._dbClient = dbClient;
  }

  async index(fromBlock: number): Promise<void> {
    this._dbClient.select();
    const filter = this._buildFilters(fromBlock);
    const rawLogs = await this._ethereumProvider.getLogs(filter);
    const domainObjects = rawLogs.map(log => buildERCEvent(log, EthereumWrapIndexer.wrapInterface));
    console.log(domainObjects);
  }

  private _buildFilters(fromBlock: number): ethers.providers.Filter {
    return {
      address: this._wrapContractAddress,
      fromBlock: fromBlock,
      toBlock: 'latest',
      topics: [
        EthereumWrapIndexer.wrapTopics,
      ],
    };
  }

  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
  private _wrapContractAddress: string;
  static readonly wrapTopics: string[] = [id('ERC20WrapAsked(address,address,uint256,string)'), id('ERC721WrapAsked(address,address,uint256,string)')];
  static readonly wrapInterface: ethers.utils.Interface = new ethers.utils.Interface(['event ERC20WrapAsked(address user, address token, uint256 amount, string tezosDestinationAddress)', 'event ERC721WrapAsked(address user, address token, uint256 tokenId, string tezosDestinationAddress)']);
}
