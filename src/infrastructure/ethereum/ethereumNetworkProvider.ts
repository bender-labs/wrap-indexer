import { EthereumConfig } from '../../configuration';
import { ethers } from 'ethers';

export function createEthereumProvider(
  configuration: EthereumConfig
): ethers.providers.Provider {
  return new ethers.providers.JsonRpcProvider(configuration.rpc);
}
