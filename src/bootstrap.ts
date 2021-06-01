import { Config, EthereumConfig, TezosConfig } from './configuration';
import { createLogger } from './infrastructure/logger';
import { createDbClient } from './infrastructure/dbClient';
import { createEthereumProvider } from './infrastructure/ethereum/ethereumNetworkProvider';
import { BcdProvider, createBcd } from './infrastructure/tezos/bcdProvider';
import { createIpfsClient, IpfsClient } from './infrastructure/ipfsClient';
import { Logger } from 'tslog';
import Knex from 'knex';
import { ethers } from 'ethers';
import { TezosToolkit } from '@taquito/taquito';
import { createTezosToolkit } from './infrastructure/tezos/toolkitProvider';
import { createTzKt, TzktProvider } from './infrastructure/tezos/tzktProvider';

export type Dependencies = {
  logger: Logger;
  dbClient: Knex;
  ethereumProvider: ethers.providers.Provider;
  bcd: BcdProvider;
  tzkt: TzktProvider;
  ipfsClient: IpfsClient;
  configuration: Config;
  ethereumConfiguration: EthereumConfig;
  tezosConfiguration: TezosConfig;
  tezosToolkit: TezosToolkit;
};

export function bootstrap(
  configuration: Config,
  ethereumConfiguration: EthereumConfig,
  tezosConfiguration: TezosConfig
): Dependencies {
  const logger = createLogger(configuration);
  const dbClient = createDbClient(configuration);
  const ethereumProvider = createEthereumProvider(ethereumConfiguration);
  const bcd = createBcd(configuration.tezos.currentNetwork);
  const tzkt = createTzKt(tezosConfiguration.tzKtApiUrl);
  const ipfsClient = createIpfsClient(configuration);
  const tezosToolkit = createTezosToolkit(tezosConfiguration);
  return {
    logger,
    dbClient,
    ethereumProvider,
    bcd,
    tzkt,
    ipfsClient,
    configuration,
    ethereumConfiguration,
    tezosConfiguration,
    tezosToolkit,
  };
}
