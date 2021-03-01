import { loadConfiguration } from './configuration';
import { createLogger } from './tools/logger';
import { createBcd } from './tools/tezos/bcdProvider';
import { httpServer } from './web/Server';
import { createDbClient } from './tools/dbClient';
import { createEthereumProvider } from './tools/ethereum/ethereumNetworkProvider';
import { createIpfsClient } from './tools/ipfsClient';
import { EthereumWrapIndexer } from './domain/ethereum/EthereumWrapIndexer';
import { TezosQuorumIndexer } from './domain/tezos/TezosQuorumIndexer';
import { EthereumQuorumIndexer } from './domain/ethereum/EthereumQuorumIndexer';
import { SignatureIndexer } from './domain/signatures/SignatureIndexer';
import { SignaturePinningService } from './domain/signatures/SignaturePinningService';

const configuration = loadConfiguration();
const ethereumConfiguration = configuration.ethereum.networks[configuration.ethereum.currentNetwork];
const tezosConfiguration = configuration.tezos.networks[configuration.tezos.currentNetwork];
const logger = createLogger(configuration);
const dbClient = createDbClient(configuration);
const ethereumProvider = createEthereumProvider(ethereumConfiguration);
const bcd = createBcd(configuration.tezos.currentNetwork);
const ipfsClient = createIpfsClient(configuration);
const ethereumWrapIndexer = new EthereumWrapIndexer(logger, ethereumConfiguration, ethereumProvider, dbClient);
const tezosQuorumIndexer = new TezosQuorumIndexer(logger, tezosConfiguration, bcd, dbClient);
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




