import { Crontab } from './infrastructure/Crontab';
import { Dependencies } from './bootstrap';
import { EthereumInitialWrapIndexer } from './indexer/ethereum/EthereumInitialWrapIndexer';
import { SignaturePinningService } from './indexer/signatures/SignaturePinningService';
import { EthereumFinalizedUnwrapIndexer } from './indexer/ethereum/EthereumFinalizedUnwrapIndexer';
import { SignatureIndexer } from './indexer/signatures/SignatureIndexer';
import { EthereumQuorumIndexer } from './indexer/ethereum/EthereumQuorumIndexer';
import { TezosFinalizedWrapIndexer } from './indexer/tezos/TezosFinalizedWrapIndexer';
import { TokensIndexer } from './indexer/tokens/TokensIndexer';
import { TezosQuorumIndexer } from './indexer/tezos/TezosQuorumIndexer';
import { TezosInitialUnwrapIndexer } from './indexer/tezos/TezosInitialUnwrapIndexer';

const everyMinutes = '* * * * *';
const every10Minutes = '*/10 * * * *';
const every30Minutes = '*/30 * * * *';

export function scheduleJobs(dependencies: Dependencies): Crontab {
  const crontab = new Crontab();
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), everyMinutes);
  crontab.register(() => new TezosInitialUnwrapIndexer(dependencies).index(), everyMinutes);
  crontab.register(() => new SignatureIndexer(dependencies).index(), everyMinutes);
  crontab.register(() => new EthereumFinalizedUnwrapIndexer(dependencies).index(), everyMinutes);
  crontab.register(() => new TezosFinalizedWrapIndexer(dependencies).index(), everyMinutes);
  crontab.register(() => new TezosQuorumIndexer(dependencies).index(), every10Minutes);
  crontab.register(() => new EthereumQuorumIndexer(dependencies).index(), every10Minutes);
  crontab.register(() => new TokensIndexer(dependencies).index(), every10Minutes);
  crontab.register(() => new SignaturePinningService(dependencies).index(), every30Minutes);
  return crontab;
}
