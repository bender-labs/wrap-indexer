import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { WrapsQuery } from '../../query/WrapsQuery';
import { WrapStatus } from '../../domain/ERCWrap';

function build({
  dbClient,
  ethereumConfiguration,
  ethereumProvider,
}: Dependencies): Router {
  const router = Router();
  const query = new WrapsQuery(
    dbClient,
    ethereumConfiguration,
    ethereumProvider
  );
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    const ethereumAddress = req.query.ethereumAddress as string;
    const status = req.query.status as WrapStatus;
    if (!tezosAddress && !ethereumAddress) {
      return res.status(400).json({ message: 'MISSING_ADDRESS' });
    }
    const wraps = await query.search(tezosAddress, ethereumAddress, status);
    return res.json({ result: wraps });
  });
  return router;
}

export default build;
