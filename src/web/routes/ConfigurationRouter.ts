import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosQuorumDao } from '../../dao/TezosQuorumDao';
import { EthereumQuorumDao } from '../../dao/EthereumQuorumDao';
import { TokenDao } from '../../dao/TokenDao';
import { Token } from '../../domain/Token';

type Configuration = {
  ethereumNetwork: string;
  ethereumNetworkId: number;
  tezosNetwork: string;
  ethereumWrapContract: string;
  tezosMinterContract: string;
  tezosQuorumContract: string;
  wrapRequiredSignatures: number;
  unwrapRequiredSignatures: number;
  tokens: Token[];
}

async function buildConfiguration(dependencies: Dependencies): Promise<Configuration> {
  const tezosThreashold = await new TezosQuorumDao(dependencies.dbClient).getThreshold();
  const ethereumThreshold = await new EthereumQuorumDao(dependencies.dbClient).getThreshold();
  const tokens = await new TokenDao(dependencies.dbClient).all();
  return {
    ethereumNetwork: dependencies.configuration.ethereum.currentNetwork,
    ethereumNetworkId: dependencies.ethereumConfiguration.networkId,
    tezosNetwork: dependencies.configuration.tezos.currentNetwork,
    ethereumWrapContract: dependencies.ethereumConfiguration.wrapContractAddress,
    tezosMinterContract: dependencies.tezosConfiguration.minterContractAddress,
    tezosQuorumContract: dependencies.tezosConfiguration.quorumContractAddress,
    wrapRequiredSignatures: tezosThreashold,
    unwrapRequiredSignatures: ethereumThreshold,
    tokens
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
