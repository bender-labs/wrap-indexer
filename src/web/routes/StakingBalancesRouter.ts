import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractUserBalanceRepository } from '../../repository/TezosStakingContractUserBalanceRepository';

function build({ dbClient }: Dependencies): Router {
  const router = Router();
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    if (!tezosAddress) {
      return res.status(400).json({ message: 'MISSING_ADDRESS' });
    }
    const balances = await new TezosStakingContractUserBalanceRepository(
      dbClient
    ).getBalances(tezosAddress);
    return res.json({
      result: balances.map((b) => ({
        contract: b.contract,
        balance: b.balance,
      })),
    });
  });
  return router;
}

export default build;
