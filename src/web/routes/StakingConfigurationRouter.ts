import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { TezosStakingContract } from '../../domain/TezosStakingContract';

interface StakingConfiguration {
  contracts: Array<TezosStakingContract>;
}

async function buildConfiguration({
  dbClient,
}: Dependencies): Promise<StakingConfiguration> {
  const stakingContracts = await new TezosStakingContractsRepository(
    dbClient
  ).getStakingContracts();
  return {
    contracts: stakingContracts,
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
