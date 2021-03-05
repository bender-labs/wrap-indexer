import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosQuorumDao } from '../../dao/TezosQuorumDao';
import { EthereumQuorumDao } from '../../dao/EthereumQuorumDao';

type Configuration = {
  ethereumNetwork: string;
  tezosNetwork: string;
  ethereumWrapContract: string;
  tezosMinterContract: string;
  tezosQuorumContract: string;
  wrapRequiredSignatures: number;
  unwrapRequiredSignatures: number;
}

async function buildConfiguration(dependencies: Dependencies): Promise<Configuration> {
  const tezosThreashold = await new TezosQuorumDao(dependencies.dbClient).getThreshold();
  const ethereumThreshold = await new EthereumQuorumDao(dependencies.dbClient).getThreshold();
  return {
    ethereumNetwork: dependencies.configuration.ethereum.currentNetwork,
    tezosNetwork: dependencies.configuration.tezos.currentNetwork,
    ethereumWrapContract: dependencies.ethereumConfiguration.wrapContractAddress,
    tezosMinterContract: dependencies.tezosConfiguration.minterContractAddress,
    tezosQuorumContract: dependencies.tezosConfiguration.quorumContractAddress,
    wrapRequiredSignatures: tezosThreashold,
    unwrapRequiredSignatures: ethereumThreshold,
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
