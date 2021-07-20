import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { TezosStakingContractRewardsRepository } from '../../repository/TezosStakingContractRewardsRepository';
import { TezosStakingContractRewards } from '../../domain/TezosStakingContractRewards';
import { TezosStakingContractUserBalanceRepository } from '../../repository/TezosStakingContractUserBalanceRepository';
import {AppState} from "../../indexer/state/AppState";

type ContractStakingConfiguration = {
  contract: string;
  token: string;
  tokenId: number;
  totalStaked?: string;
  maxLevelProcessed: number;
  rewards?: TezosStakingContractRewards;
}

interface StakingConfiguration {
  contracts: ContractStakingConfiguration[]
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
  const appState = new AppState(dbClient);
  const contracts: ContractStakingConfiguration[] = [];
  for (const s of stakingContracts) {
    const balance = balances.find((b) => b.contract === s.contract);
    const reward = rewards.find((r) => r.contract === s.contract);
    contracts.push({
      rewards: reward,
      totalStaked: balance ? balance.sum : undefined,
      maxLevelProcessed: balance ? (await appState.getStakingContractLevelProcessed(
        balance.contract
      )) : 0,
      ...s,
    });
  }
  return {contracts};
}

function build(dependencies: Dependencies): Router {
  const router = Router();
  router.get('/', async (_req: Request, res: Response) => {
    return res.json(await buildConfiguration(dependencies));
  });
  return router;
}

export default build;
