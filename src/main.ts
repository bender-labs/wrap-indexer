import { loadConfiguration } from './configuration';
import { createLogger } from './infrastructure/logger';
import { createBcd } from './infrastructure/tezos/bcdProvider';
import { httpServer } from './web/Server';
import { createDbClient } from './infrastructure/dbClient';
import { createEthereumProvider } from './infrastructure/ethereum/ethereumNetworkProvider';
import { createIpfsClient } from './infrastructure/ipfsClient';
import { EthereumInitialWrapIndexer } from './indexer/ethereum/EthereumInitialWrapIndexer';
import { TezosQuorumIndexer } from './indexer/tezos/TezosQuorumIndexer';
import { EthereumQuorumIndexer } from './indexer/ethereum/EthereumQuorumIndexer';
import { SignatureIndexer } from './indexer/signatures/SignatureIndexer';
import { SignaturePinningService } from './indexer/signatures/SignaturePinningService';
import { TezosInitialUnwrapIndexer } from './indexer/tezos/TezosInitialUnwrapIndexer';
import { EthereumFinalizedUnwrapIndexer } from './indexer/ethereum/EthereumFinalizedUnwrapIndexer';

const configuration = loadConfiguration();
const ethereumConfiguration = configuration.ethereum.networks[configuration.ethereum.currentNetwork];
const tezosConfiguration = configuration.tezos.networks[configuration.tezos.currentNetwork];
const logger = createLogger(configuration);
const dbClient = createDbClient(configuration);
const ethereumProvider = createEthereumProvider(ethereumConfiguration);
const bcd = createBcd(configuration.tezos.currentNetwork);
const ipfsClient = createIpfsClient(configuration);
const ethereumWrapIndexer = new EthereumInitialWrapIndexer(logger, ethereumConfiguration, ethereumProvider, dbClient);
const tezosQuorumIndexer = new TezosQuorumIndexer(logger, tezosConfiguration, bcd, dbClient);
const ethereumQuorumIndexer = new EthereumQuorumIndexer(logger, ethereumConfiguration, ethereumProvider, dbClient);
const signatureIndexer = new SignatureIndexer(logger, ipfsClient, dbClient);
const signaturePinningService = new SignaturePinningService(logger, ipfsClient, dbClient);
const tezosUnwrapIndexer = new TezosInitialUnwrapIndexer(logger, tezosConfiguration, bcd, dbClient);
const ethereumFinalizedUnwrapIndexer = new EthereumFinalizedUnwrapIndexer(logger, ethereumConfiguration, ethereumProvider, dbClient);

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
    signaturePinningService.index(),
    tezosUnwrapIndexer.index(),
    ethereumFinalizedUnwrapIndexer.index(),
  ]);
}());




