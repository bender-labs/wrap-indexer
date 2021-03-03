import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';

function build(_dependencies: Dependencies): Router {
  const router = Router();
  router.get('/', (_req: Request, res: Response) => {
    return res.json({ message: 'Hello' });
  });
  return router;
}

export default build;
