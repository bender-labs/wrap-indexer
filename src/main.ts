import { loadConfiguration } from './configuration';
import { createLogger } from './tools/logger';
import { createDbClient } from './tools/dbClient';
import { createEthereumProvider } from './tools/ethereum/ethereumNetworkProvider';
import { EthereumWrapIndexer } from './domain/ethereum/EthereumWrapIndexer';
import { TezosQuorumIndexer } from './domain/tezos/TezosQuorumIndexer';
import { createTezosToolkit } from './tools/tezos/tezosToolkitProvider';
import { SignatureIndexer } from './domain/signatures/SignatureIndexer';
import { createIpfsClient } from './tools/ipfsClient';
import { EthereumQuorumIndexer } from './domain/ethereum/EthereumQuorumIndexer';
import { httpServer } from './web/Server';
import { SignaturePinningService } from './domain/signatures/SignaturePinningService';

const configuration = loadConfiguration();
const ethereumConfiguration = configuration.ethereum.networks[configuration.ethereum.currentNetwork];
const tezosConfiguration = configuration.tezos.networks[configuration.tezos.currentNetwork];
const logger = createLogger(configuration);
const dbClient = createDbClient(configuration);
const ethereumProvider = createEthereumProvider(ethereumConfiguration);
const tezosToolkit = createTezosToolkit(tezosConfiguration);
const ipfsClient = createIpfsClient(configuration);
const ethereumWrapIndexer = new EthereumWrapIndexer(logger, ethereumConfiguration, ethereumProvider, dbClient);
const tezosQuorumIndexer = new TezosQuorumIndexer(logger, tezosConfiguration, tezosToolkit, dbClient);
const ethereumQuorumIndexer = new EthereumQuorumIndexer(logger, ethereumConfiguration, ethereumProvider, dbClient);
const signatureIndexer = new SignatureIndexer(logger, ipfsClient, dbClient);
const signaturePinningService = new SignaturePinningService(logger, ipfsClient, dbClient);

const app = httpServer(logger, configuration);
app.listen(3000, () => {
  logger.info('Express server started on port: ' + 3000);
});

(async function main() {
  logger.info('Indexer started');
  await Promise.all([
    ethereumWrapIndexer.index(),
    tezosQuorumIndexer.index(),
    ethereumQuorumIndexer.index(),
    signatureIndexer.index(),
    signaturePinningService.index()
  ]);
}());




