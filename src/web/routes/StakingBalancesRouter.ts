import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractUserBalanceRepository } from '../../repository/TezosStakingContractUserBalanceRepository';
import { AppState } from '../../indexer/state/AppState';

type TezosStakingContractUserBalanceWithMaxLevel = {
  contract: string;
  tezosAddress: string;
  balance: string;
  totalStaked?: string;
  maxLevelProcessed: number;
}

function build({ dbClient }: Dependencies): Router {
  const router = Router();
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    if (!tezosAddress) {
      return res.status(400).json({ message: 'MISSING_ADDRESS' });
    }
    const appState = new AppState(dbClient);
    const balances = await new TezosStakingContractUserBalanceRepository(
      dbClient
    ).getBalances(tezosAddress);
    const totalBalances = await new TezosStakingContractUserBalanceRepository(
      dbClient
    ).getTotalBalancesPerContract();
    const balancesWithLevel: TezosStakingContractUserBalanceWithMaxLevel[] = [];
    for (const balance of balances) {
      const totalStaked = totalBalances.find((b) => b.contract === balance.contract);
      balancesWithLevel.push({
        contract: balance.contract,
        tezosAddress: balance.tezosAddress,
        balance: balance.balance,
        totalStaked: totalStaked ? totalStaked.sum : undefined,
        maxLevelProcessed: (await appState.getStakingContractLevelProcessed(
          balance.contract
        ))
      });
    }
    return res.json({
      result: balancesWithLevel
    });
  });
  return router;
}

export default build;
