import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import axios from 'axios';


function build({
  configuration
}: Dependencies): Router {
  const router = Router();
  const whitelistedUrls = configuration.nfts.whitelistedMetadataUrls.split(',');

  const isWhitelisted = (url: string) => {
    for (const whitelistedUrl of whitelistedUrls) {
      if (url.startsWith(whitelistedUrl)) {
        return true;
      }
    }
    return false;
  }

  router.get('/', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!isWhitelisted(url)) {
      return res.status(400).json({ message: 'NOT_A_KNOWN_METADATA' });
    }
    const metadata = await axios.get(url)
    return res.json(metadata.data);
  });
  return router;
}

export default build;
