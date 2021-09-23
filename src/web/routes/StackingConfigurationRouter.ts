import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosStackingContractsRepository } from '../../repository/TezosStackingContractsRepository';
import { TezosStackingContract } from '../../domain/TezosStackingContract';

interface StackingConfiguration {
  contracts: TezosStackingContract[]
}

async function buildConfiguration({
  dbClient,
}: Dependencies): Promise<StackingConfiguration> {
  const contracts = await new TezosStackingContractsRepository(
    dbClient
  ).getStackingContracts();
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
