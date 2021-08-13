import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { UnwrapsQuery } from '../../query/UnwrapsQuery';
import { ERCType, WrapStatus } from '../../domain/ERCWrap';

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
    const type = req.query.type as ERCType;
    const operationHash = req.query.hash as string;
    if (!tezosAddress && !ethereumAddress && !operationHash) {
      return res.status(400).json({ message: 'MISSING_ADDRESS_OR_HASH' });
    }
    const unwraps = await query.search(
      tezosAddress,
      ethereumAddress,
      status,
      type,
      operationHash
    );
    return res.json({ result: unwraps });
  });
  return router;
}

export default build;
