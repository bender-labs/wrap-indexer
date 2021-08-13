import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { TezosNFTsQuery } from '../../query/TezosNFTsQuery';

function build({
  dbClient
}: Dependencies): Router {
  const router = Router();
  const query = new TezosNFTsQuery(
    dbClient
  );
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    const contractAddress = req.query.contractAddress as string;
    if (!tezosAddress) {
      return res.status(400).json({ message: 'MISSING_ADDRESS' });
    }
    const nfts = await query.search(tezosAddress, contractAddress);
    return res.json({ result: nfts });
  });
  return router;
}

export default build;
