import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosQuorumDao } from '../../dao/TezosQuorumDao';
import { EthereumQuorumDao } from '../../dao/EthereumQuorumDao';
import { TokenDao } from '../../dao/TokenDao';
import { Token } from '../../domain/Token';
import { FeesDao } from '../../dao/FeesDao';
import { Fees } from '../../domain/Fees';

interface Configuration {
  ethereumNetwork: string;
  ethereumNetworkId: number;
  tezosNetwork: string;
  ethereumWrapContract: string;
  tezosMinterContract: string;
  tezosQuorumContract: string;
  wrapRequiredSignatures: number;
  unwrapRequiredSignatures: number;
  tokens: Token[];
  fees: Fees;
}

async function buildConfiguration({
                                    dbClient,
                                    configuration,
                                    ethereumConfiguration,
                                    tezosConfiguration,
                                  }: Dependencies): Promise<Configuration> {
  const tezosThreashold = await new TezosQuorumDao(dbClient).getThreshold();
  const ethereumThreshold = await new EthereumQuorumDao(dbClient).getThreshold();
  const fees = await new FeesDao(dbClient).getFees();
  const tokens = await new TokenDao(dbClient).all();
  return {
    ethereumNetwork: configuration.ethereum.currentNetwork,
    ethereumNetworkId: ethereumConfiguration.networkId,
    ethereumWrapContract: ethereumConfiguration.wrapContractAddress,
    tezosNetwork: configuration.tezos.currentNetwork,
    tezosMinterContract: tezosConfiguration.minterContractAddress,
    tezosQuorumContract: tezosConfiguration.quorumContractAddress,
    wrapRequiredSignatures: tezosThreashold,
    unwrapRequiredSignatures: ethereumThreshold,
    tokens,
    fees,
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
