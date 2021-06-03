import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { TezosStakingContractRewardsRepository } from '../../repository/TezosStakingContractRewardsRepository';
import { TezosStakingContractRewards } from '../../domain/TezosStakingContractRewards';

interface StakingConfiguration {
  contracts: Array<{
    contract: string;
    token: string;
    tokenId: number;
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
  return {
    contracts: stakingContracts.map((s) => {
      const reward = rewards.find((r) => r.contract === s.contract);
      if (reward) {
        return {
          rewards: reward,
          ...s,
        };
      }
      return s;
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
