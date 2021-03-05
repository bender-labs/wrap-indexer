import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import {
  PendingWrapsQuery,
} from '../../query/PendingWrapsQuery';

function build(dependencies: Dependencies): Router {
  const router = Router();
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    const ethereumAddress = req.query.ethereumAddress as string;
    if (!tezosAddress && !ethereumAddress) {
      return res.status(400).json({ message: 'MISSING_ADDRESS' });
    }
    const query = new PendingWrapsQuery(dependencies.dbClient);
    const erc20Wraps = await query.erc20(tezosAddress, ethereumAddress);
    const erc721Wraps = await query.erc721(tezosAddress, ethereumAddress);
    return res.json({ erc20Wraps, erc721Wraps });
  });
  return router;
}

export default build;
