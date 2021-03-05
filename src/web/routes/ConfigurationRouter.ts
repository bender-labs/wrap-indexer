import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import Knex from 'knex';
import { TezosQuorumDao } from '../../dao/TezosQuorumDao';
import { EthereumQuorumDao } from '../../dao/EthereumQuorumDao';

type Configuration = {
  wrapRequiredSignatures: number;
  unwrapRequiredSignatures: number;
}

async function buildConfiguration(dbClient: Knex): Promise<Configuration> {
  const tezosThreashold = await new TezosQuorumDao(dbClient).getThreshold();
  const ethereumThreshold = await new EthereumQuorumDao(dbClient).getThreshold();
  return {
    wrapRequiredSignatures: tezosThreashold,
    unwrapRequiredSignatures: ethereumThreshold,
  };
}

function build(dependencies: Dependencies): Router {
  const router = Router();
  router.get('/', async (_req: Request, res: Response) => {
    return res.json(await buildConfiguration(dependencies.dbClient));
  });
  return router;
}

export default build;
