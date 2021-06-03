import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { TezosStakingContractRewardsRepository } from '../../repository/TezosStakingContractRewardsRepository';
import { TezosStakingContractRewards } from '../../domain/TezosStakingContractRewards';
import { TezosStakingContractUserBalanceRepository } from '../../repository/TezosStakingContractUserBalanceRepository';

interface StakingConfiguration {
  contracts: Array<{
    contract: string;
    token: string;
    tokenId: number;
    totalStaked?: string;
    rewards?: TezosStakingContractRewards;
  }>;
}

async function buildConfiguration({
  dbClient,
}: Dependencies): Promise<StakingConfiguration> {
  const stakingContracts = await new TezosStakingContractsRepository(
    dbClient
  ).getStakingContracts();
  const rewards = await new TezosStakingContractRewardsRepository(
    dbClient
  ).getRewards();
  const balances = await new TezosStakingContractUserBalanceRepository(
    dbClient
  ).getTotalBalancesPerContract();
  return {
    contracts: stakingContracts.map((s) => {
      const balance = balances.find((b) => b.contract === s.contract);
      const reward = rewards.find((r) => r.contract === s.contract);
      return {
        rewards: reward,
        totalStaked: balance ? balance.sum : undefined,
        ...s,
      };
    }),
  };
}

function build(dependencies: Dependencies): Router {
  const router = Router();
  router.get('/', async (_req: Request, res: Response) => {
    return res.json(await buildConfiguration(dependencies));
  });
  return router;
}

export default build;
