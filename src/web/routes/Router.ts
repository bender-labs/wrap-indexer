import { Router } from 'express';
import WrapsRouter from './WrapsRouter';
import UnwrapsRouter from './UnwrapsRouter';
import { Dependencies } from '../../bootstrap';

function build(dependencies: Dependencies): Router {
  const router = Router();
  router.use('/wraps', WrapsRouter(dependencies));
  router.use('/unwraps', UnwrapsRouter(dependencies));
  return router;
}

export default build;
