import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { UnwrapsQuery } from '../../query/UnwrapsQuery';
import { WrapStatus } from '../../domain/ERCWrap';

function build({
  dbClient,
  tezosConfiguration,
  tezosToolkit,
}: Dependencies): Router {
  const router = Router();
  const query = new UnwrapsQuery(dbClient, tezosConfiguration, tezosToolkit);
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    const ethereumAddress = req.query.ethereumAddress as string;
    const status = req.query.status as WrapStatus;
    if (!tezosAddress && !ethereumAddress) {
      return res.status(400).json({ message: 'MISSING_ADDRESS' });
    }
    const unwraps = await query.search(tezosAddress, ethereumAddress, status);
    return res.json({ result: unwraps });
  });
  return router;
}

export default build;
