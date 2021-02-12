import {loadConfiguration} from './configuration';
import {createLogger} from './tools/logger';
import {createDbClient} from './tools/dbClient';
import {createEthereumProvider} from './tools/ethereumNetworkProvider';
import {EthereumWrapIndexer} from './domain/ethereumWrapIndexer';

const configuration = loadConfiguration();
const logger = createLogger(configuration);
const dbClient = createDbClient(configuration);
const ethereumProvider = createEthereumProvider(configuration);
const ethereumWrapIndexer = new EthereumWrapIndexer(configuration.ethereum.wrapContractAddress, ethereumProvider, dbClient);

(async function main(){
  logger.info('Indexer started');
  await ethereumWrapIndexer.index();
}())




