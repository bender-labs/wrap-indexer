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
import { FeesIndexer } from './indexer/fees/FeesIndexer';
import { TezosStakingContractsIndexer } from './indexer/tezos/TezosStakingContractsIndexer';
import { TezosStakingContractsRewardsIndexer } from './indexer/tezos/TezosStakingContractsRewardsIndexer';
import { TezosStakingContractsUserBalancesIndexer } from './indexer/tezos/TezosStakingContractsUserBalancesIndexer';

const everyMinute = '* * * * *';
const every10Minutes = '*/10 * * * *';
const every30Minutes = '*/30 * * * *';

export function scheduleJobs(dependencies: Dependencies): Crontab {
  const crontab = new Crontab(dependencies);
  crontab.register(
    () => new EthereumInitialWrapIndexer(dependencies).index(),
    everyMinute
  );
  crontab.register(
    () => new TezosInitialUnwrapIndexer(dependencies).index(),
    everyMinute
  );
  crontab.register(
    () => new SignatureIndexer(dependencies).index(),
    everyMinute
  );
  crontab.register(
    () => new EthereumFinalizedUnwrapIndexer(dependencies).index(),
    everyMinute
  );
  crontab.register(
    () => new TezosFinalizedWrapIndexer(dependencies).index(),
    everyMinute
  );
  crontab.register(
    () => new TezosQuorumIndexer(dependencies).index(),
    every10Minutes
  );
  crontab.register(
    () => new EthereumQuorumIndexer(dependencies).index(),
    every10Minutes
  );
  crontab.register(
    () => new TokensIndexer(dependencies).index(),
    every10Minutes
  );
  crontab.register(
    () => new TezosStakingContractsIndexer(dependencies).index(),
    every10Minutes
  );
  crontab.register(
    () => new TezosStakingContractsRewardsIndexer(dependencies).index(),
    every10Minutes
  );
  crontab.register(
    () => new TezosStakingContractsUserBalancesIndexer(dependencies).index(),
    everyMinute
  );
  crontab.register(() => new FeesIndexer(dependencies).index(), every30Minutes);
  crontab.register(
    () => new SignaturePinningService(dependencies).index(),
    every30Minutes
  );
  return crontab;
}
