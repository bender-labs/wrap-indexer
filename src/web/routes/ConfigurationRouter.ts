import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosQuorumRepository } from '../../repository/TezosQuorumRepository';
import { EthereumQuorumRepository } from '../../repository/EthereumQuorumRepository';
import { TokenRepository } from '../../repository/TokenRepository';
import { Token } from '../../domain/Token';
import { FeesRepository } from '../../repository/FeesRepository';
import { Fees } from '../../domain/Fees';

interface Configuration {
  ethereumNetwork: string;
  ethereumNetworkId: number;
  tezosNetwork: string;
  ethereumWrapContract: string;
  tezosMinterContract: string;
  tezosQuorumContract: string;
  vesting: {
    vestingContract: string;
    wrapTokenContract: string;
    wrapTokenTokenId: number;
  },
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
  const tezosThreashold = await new TezosQuorumRepository(
    dbClient
  ).getThreshold();
  const ethereumThreshold = await new EthereumQuorumRepository(
    dbClient
  ).getThreshold();
  const fees = await new FeesRepository(dbClient).getFees();
  const tokens = await new TokenRepository(dbClient).all();
  return {
    ethereumNetwork: configuration.ethereum.currentNetwork,
    ethereumNetworkId: ethereumConfiguration.networkId,
    ethereumWrapContract: ethereumConfiguration.wrapContractAddress,
    tezosNetwork: configuration.tezos.currentNetwork,
    tezosMinterContract: tezosConfiguration.minterContractAddress,
    tezosQuorumContract: tezosConfiguration.quorumContractAddress,
    vesting: {
      vestingContract: tezosConfiguration.vestingContractAddress,
      wrapTokenContract: tezosConfiguration.wrapTokenContractAddress,
      wrapTokenTokenId: tezosConfiguration.wrapTokenTokenId,
    },
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
