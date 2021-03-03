import { Config, EthereumConfig, TezosConfig } from './configuration';
import { createLogger } from './infrastructure/logger';
import { createDbClient } from './infrastructure/dbClient';
import { createEthereumProvider } from './infrastructure/ethereum/ethereumNetworkProvider';
import { BcdProvider, createBcd } from './infrastructure/tezos/bcdProvider';
import { createIpfsClient, IpfsClient } from './infrastructure/ipfsClient';
import { Logger } from 'tslog';
import Knex from 'knex';
import { ethers } from 'ethers';

export type Dependencies = {
  logger: Logger;
  dbClient: Knex;
  ethereumProvider: ethers.providers.Provider;
  bcd: BcdProvider;
  ipfsClient: IpfsClient;
  ethereumConfiguration: EthereumConfig;
  tezosConfiguration: TezosConfig;
}

export function bootstrap(configuration: Config, ethereumConfiguration: EthereumConfig, tezosConfiguration: TezosConfig): Dependencies {
  const logger = createLogger(configuration);
  const dbClient = createDbClient(configuration);
  const ethereumProvider = createEthereumProvider(ethereumConfiguration);
  const bcd = createBcd(configuration.tezos.currentNetwork);
  const ipfsClient = createIpfsClient(configuration);
  return {
    logger,
    dbClient,
    ethereumProvider,
    bcd,
    ipfsClient,
    ethereumConfiguration,
    tezosConfiguration
  }
}
