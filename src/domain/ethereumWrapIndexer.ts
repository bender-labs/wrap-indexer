import Knex from 'knex';
import { ethers } from 'ethers';

export class EthereumWrapIndexer {
  constructor(wrapContractAddress: string, ethereumProvider: ethers.providers.Provider, dbClient: Knex) {
    this._wrapContractAddress = wrapContractAddress;
    this._ethereumProvider = ethereumProvider;
    this._dbClient = dbClient;
  }

  async index() {
    const filter = {
      address: this._wrapContractAddress,
      fromBlock: 7997435-100,
      toBlock: 'latest',
      topics: [
        "0x4f4dff159c274e50aaa8650afd371620db5c679e96bde2a4133cf626384ba046"
      ]
    }
    this._dbClient.select();
    const result = await this._ethereumProvider.getLogs(filter);
    console.log(result);
  }

  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;
  private _wrapContractAddress: string;
}
