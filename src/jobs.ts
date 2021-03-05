import { TezosQuorumIndexer } from './indexer/tezos/TezosQuorumIndexer';
import { Crontab } from './infrastructure/Crontab';
import { Dependencies } from './bootstrap';
import { EthereumInitialWrapIndexer } from './indexer/ethereum/EthereumInitialWrapIndexer';
import { SignaturePinningService } from './indexer/signatures/SignaturePinningService';
import { TezosFinalizedWrapIndexer } from './indexer/tezos/TezosFinalizedWrapIndexer';
import { EthereumFinalizedUnwrapIndexer } from './indexer/ethereum/EthereumFinalizedUnwrapIndexer';
import { SignatureIndexer } from './indexer/signatures/SignatureIndexer';
import { EthereumQuorumIndexer } from './indexer/ethereum/EthereumQuorumIndexer';
import { TezosInitialUnwrapIndexer } from './indexer/tezos/TezosInitialUnwrapIndexer';
import { TokensIndexer } from './indexer/tokens/TokensIndexer';

const every2Minutes = '*/2 * * * *';
const every10Minutes = '*/10 * * * *';
const every30Minutes = '*/30 * * * *';

export function scheduleJobs(dependencies: Dependencies): Crontab {
  const crontab = new Crontab();
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), every2Minutes);
  crontab.register(() => new TezosInitialUnwrapIndexer(dependencies).index(), every2Minutes);
  crontab.register(() => new SignatureIndexer(dependencies).index(), every2Minutes);
  crontab.register(() => new EthereumFinalizedUnwrapIndexer(dependencies).index(), every2Minutes);
  crontab.register(() => new TezosFinalizedWrapIndexer(dependencies).index(), every2Minutes);
  crontab.register(() => new TezosQuorumIndexer(dependencies).index(), every10Minutes);
  crontab.register(() => new EthereumQuorumIndexer(dependencies).index(), every10Minutes);
  crontab.register(() => new TokensIndexer(dependencies).index(), every10Minutes);
  crontab.register(() => new SignaturePinningService(dependencies).index(), every30Minutes);
  return crontab;
}
