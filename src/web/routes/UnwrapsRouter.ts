import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { PendingUnwrapsQuery } from '../../query/PendingUnwrapsQuery';

function build({ dbClient, tezosConfiguration, bcd }: Dependencies): Router {
  const router = Router();
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    const ethereumAddress = req.query.ethereumAddress as string;
    if (!tezosAddress && !ethereumAddress) {
      return res.status(400).json({ message: 'MISSING_ADDRESS' });
    }
    const query = new PendingUnwrapsQuery(dbClient, tezosConfiguration, bcd);
    const erc20Unwraps = await query.erc20(tezosAddress, ethereumAddress);
    const erc721Unwraps = await query.erc721(tezosAddress, ethereumAddress);
    return res.json({ erc20Unwraps, erc721Unwraps });
  });
  return router;
}

export default build;
