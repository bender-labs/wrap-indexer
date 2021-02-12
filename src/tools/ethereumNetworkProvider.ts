import { Config } from '../configuration';
import { ethers } from 'ethers';

export function createEthereumProvider(configuration: Config): ethers.providers.Provider {
  return new ethers.providers.JsonRpcProvider(configuration.ethereum.rpc);
}
