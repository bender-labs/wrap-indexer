import {loadConfiguration} from './configuration';
import {createLogger} from './tools/logger';
import {createDbClient} from './tools/dbClient';
import {createEthereumProvider} from './tools/ethereum/ethereumNetworkProvider';
import {EthereumWrapIndexer} from './domain/ethereum/EthereumWrapIndexer';
import { TezosQuorumIndexer } from './domain/tezos/TezosQuorumIndexer';
import { createTezosToolkit } from './tools/tezos/tezosToolkitProvider';
import { SignatureIndexer } from './domain/signatures/SignatureIndexer';
import { createIpfsClient } from './tools/ipfsClient';

const configuration = loadConfiguration();
const ethereumConfiguration = configuration.ethereum.networks[configuration.ethereum.currentNetwork];
const tezosConfiguration = configuration.tezos.networks[configuration.tezos.currentNetwork];
const logger = createLogger(configuration);
const dbClient = createDbClient(configuration);
const ethereumProvider = createEthereumProvider(ethereumConfiguration);
const tezosToolkit = createTezosToolkit(tezosConfiguration);
const ipfsClient = createIpfsClient(configuration);
const ethereumWrapIndexer = new EthereumWrapIndexer(logger, ethereumConfiguration, ethereumProvider, dbClient);
const tezosOwnerIndexer = new TezosQuorumIndexer(logger, tezosConfiguration, tezosToolkit, dbClient);
const signatureIndexer = new SignatureIndexer(logger, ipfsClient, dbClient);

(async function main(){
  logger.info('Indexer started');
  await ethereumWrapIndexer.index();
  await tezosOwnerIndexer.index();
  await signatureIndexer.index();
  await dbClient.destroy();
}());




